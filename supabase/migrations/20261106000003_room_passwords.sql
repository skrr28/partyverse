-- =============================================================================
-- PARTYVERSE · Contraseña por sala
-- El anfitrión fija una contraseña al crear la sala; para unirse hace falta el
-- código y la contraseña. Se guarda solo el hash (bcrypt vía pgcrypto).
-- Los miembros que ya pertenecen a la sala se reconectan sin contraseña.
-- =============================================================================

create extension if not exists pgcrypto with schema extensions;

-- Tabla aparte (y no una columna de `rooms`): Realtime envía la fila completa
-- de `rooms` a los jugadores, y el hash no debe salir nunca del servidor.
create table public.room_secrets (
  room_id       uuid primary key references public.rooms (id) on delete cascade,
  password_hash text not null
);
alter table public.room_secrets enable row level security;
revoke all on table public.room_secrets from anon, authenticated;

-- Intentos fallidos recientes por usuario (freno a la fuerza bruta).
create table public.join_failures (
  user_id    uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);
create index join_failures_user_time_idx on public.join_failures (user_id, created_at);
alter table public.join_failures enable row level security;
revoke all on table public.join_failures from anon, authenticated;

create function public.pv_valid_room_password(p text)
returns boolean
language sql immutable set search_path = public
as $$
  select p is not null and char_length(p) between 4 and 32;
$$;

drop function public.create_room();

create function public.create_room(p_password text)
returns jsonb
language plpgsql security definer set search_path = public
as $$
declare
  v_uid     uuid := public.pv_require_uid();
  v_profile public.profiles;
  v_room    public.rooms;
begin
  select * into v_profile from public.profiles where id = v_uid;
  if not found then
    raise exception 'PV_PROFILE_REQUIRED';
  end if;
  if not public.pv_valid_room_password(p_password) then
    raise exception 'PV_INVALID_PASSWORD';
  end if;

  insert into public.rooms (code, host_id)
  values (public.pv_generate_code(), v_uid)
  returning * into v_room;

  insert into public.room_secrets (room_id, password_hash)
  values (v_room.id, extensions.crypt(p_password, extensions.gen_salt('bf', 8)));

  insert into public.room_players (room_id, user_id, nickname, avatar)
  values (v_room.id, v_uid, v_profile.nickname, v_profile.avatar);

  return jsonb_build_object('room_id', v_room.id, 'code', v_room.code);
end;
$$;

drop function public.join_room(text);

create function public.join_room(p_code text, p_password text)
returns jsonb
language plpgsql security definer set search_path = public
as $$
declare
  v_uid     uuid := public.pv_require_uid();
  v_code    text := upper(btrim(coalesce(p_code, '')));
  v_profile public.profiles;
  v_room    public.rooms;
  v_member  public.room_players;
  v_active  int;
  v_hash    text;
begin
  select * into v_profile from public.profiles where id = v_uid;
  if not found then
    raise exception 'PV_PROFILE_REQUIRED';
  end if;

  -- Máximo 10 intentos fallidos cada 10 minutos por jugador.
  if (select count(*) from public.join_failures
       where user_id = v_uid and created_at > now() - interval '10 minutes') >= 10 then
    raise exception 'PV_TOO_MANY_ATTEMPTS';
  end if;

  select * into v_room from public.rooms where code = v_code for update;
  -- Los fallos se devuelven (no se lanzan) para que el intento quede registrado:
  -- una excepción desharía también el INSERT en join_failures.
  if not found or v_room.status = 'closed' then
    insert into public.join_failures (user_id) values (v_uid);
    return jsonb_build_object('error', 'PV_ROOM_NOT_FOUND');
  end if;

  select * into v_member from public.room_players
   where room_id = v_room.id and user_id = v_uid;

  if found then
    -- Reconexión: quien ya era miembro no necesita la contraseña.
    if not v_member.is_active then
      select count(*) into v_active from public.room_players
       where room_id = v_room.id and is_active;
      if v_active >= 12 then
        raise exception 'PV_ROOM_FULL';
      end if;
      update public.room_players set is_active = true
       where room_id = v_room.id and user_id = v_uid;
      perform public.pv_touch_room(v_room.id);
    end if;
    return jsonb_build_object('room_id', v_room.id, 'code', v_room.code, 'rejoined', true);
  end if;

  select password_hash into v_hash from public.room_secrets where room_id = v_room.id;
  if v_hash is not null
     and (p_password is null or extensions.crypt(p_password, v_hash) <> v_hash) then
    insert into public.join_failures (user_id) values (v_uid);
    return jsonb_build_object('error', 'PV_WRONG_PASSWORD');
  end if;

  if v_room.status <> 'lobby' then
    raise exception 'PV_GAME_IN_PROGRESS';
  end if;

  select count(*) into v_active from public.room_players
   where room_id = v_room.id and is_active;
  if v_active >= 12 then
    raise exception 'PV_ROOM_FULL';
  end if;

  insert into public.room_players (room_id, user_id, nickname, avatar)
  values (v_room.id, v_uid, v_profile.nickname, v_profile.avatar);

  perform public.pv_touch_room(v_room.id);
  return jsonb_build_object('room_id', v_room.id, 'code', v_room.code, 'rejoined', false);
end;
$$;

revoke execute on function
  public.pv_valid_room_password(text),
  public.create_room(text),
  public.join_room(text, text)
from public, anon, authenticated;

grant execute on function
  public.create_room(text),
  public.join_room(text, text)
to authenticated;
