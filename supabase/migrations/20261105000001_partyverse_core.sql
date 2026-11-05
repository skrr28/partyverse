-- =============================================================================
-- PARTYVERSE · Esquema principal, seguridad (RLS) y funciones de servidor
-- =============================================================================
-- Principios:
--   * Los clientes NUNCA escriben directamente en las tablas. Todas las
--     operaciones de partida pasan por funciones RPC (SECURITY DEFINER) que
--     validan estado, turno, votos y puntos.
--   * La tabla `votes` no tiene ninguna política de lectura: ningún cliente
--     puede consultar votos. Solo se exponen dentro de `rounds.results`, que
--     se rellena en el cierre de la ronda.
--   * Errores de negocio: excepciones con mensaje 'PV_<CÓDIGO>' que la app
--     traduce a textos en español.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Tablas
-- -----------------------------------------------------------------------------

create table public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  nickname    text not null check (char_length(nickname) between 2 and 16),
  avatar      text not null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table public.questions (
  id      serial primary key,
  mode    text not null default 'most_likely',
  text    text not null unique,
  active  boolean not null default true
);

create table public.rooms (
  id              uuid primary key default gen_random_uuid(),
  -- Alfabeto sin caracteres ambiguos (sin I, L, O, 0, 1)
  code            text not null unique check (code ~ '^[A-HJKMNP-Z2-9]{6}$'),
  host_id         uuid not null references auth.users (id) on delete cascade,
  status          text not null default 'lobby'
                  check (status in ('lobby', 'playing', 'finished', 'closed')),
  game_mode       text not null default 'most_likely',
  game_no         int  not null default 0,
  current_round   int  not null default 0,
  total_rounds    int  not null default 5  check (total_rounds between 1 and 20),
  vote_seconds    int  not null default 30 check (vote_seconds between 5 and 120),
  reveal_seconds  int  not null default 12 check (reveal_seconds between 3 and 60),
  version         bigint not null default 0,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create table public.room_players (
  room_id     uuid not null references public.rooms (id) on delete cascade,
  user_id     uuid not null references auth.users (id) on delete cascade,
  nickname    text not null,
  avatar      text not null,
  score       int  not null default 0,
  is_active   boolean not null default true,
  joined_at   timestamptz not null default clock_timestamp(),
  primary key (room_id, user_id)
);
create index room_players_user_idx on public.room_players (user_id);

create table public.rounds (
  id             uuid primary key default gen_random_uuid(),
  room_id        uuid not null references public.rooms (id) on delete cascade,
  game_no        int  not null,
  round_no       int  not null,
  question_id    int  references public.questions (id) on delete set null,
  question_text  text not null,
  phase          text not null default 'voting' check (phase in ('voting', 'reveal')),
  started_at     timestamptz not null default now(),
  deadline       timestamptz not null,
  revealed_at    timestamptz,
  results        jsonb,
  unique (room_id, game_no, round_no)
);

create table public.votes (
  round_id    uuid not null references public.rounds (id) on delete cascade,
  voter_id    uuid not null references auth.users (id) on delete cascade,
  target_id   uuid not null references auth.users (id) on delete cascade,
  created_at  timestamptz not null default now(),
  primary key (round_id, voter_id),            -- un voto por jugador y ronda
  constraint votes_no_self_vote check (voter_id <> target_id)
);

-- -----------------------------------------------------------------------------
-- Seguridad a nivel de fila
-- -----------------------------------------------------------------------------

alter table public.profiles     enable row level security;
alter table public.questions    enable row level security;
alter table public.rooms        enable row level security;
alter table public.room_players enable row level security;
alter table public.rounds       enable row level security;
alter table public.votes        enable row level security;

-- Sin escrituras directas desde los clientes.
revoke all on table public.profiles, public.questions, public.rooms,
  public.room_players, public.rounds, public.votes from anon, authenticated;
revoke usage on sequence public.questions_id_seq from anon, authenticated;

-- Lecturas mínimas necesarias (perfil propio y Realtime de la sala).
grant select on table public.profiles, public.rooms, public.room_players, public.rounds
  to authenticated;

create function public.pv_is_room_member(p_room_id uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.room_players
    where room_id = p_room_id and user_id = auth.uid()
  );
$$;

create policy "profiles: leer el propio" on public.profiles
  for select to authenticated using (id = auth.uid());

create policy "rooms: miembros" on public.rooms
  for select to authenticated using (public.pv_is_room_member(id));

create policy "room_players: miembros" on public.room_players
  for select to authenticated using (public.pv_is_room_member(room_id));

-- `rounds.results` solo se rellena tras el cierre, así que leer la fila
-- durante la votación no expone votos.
create policy "rounds: miembros" on public.rounds
  for select to authenticated using (public.pv_is_room_member(room_id));

-- `votes` y `questions`: RLS activo y SIN políticas => ilegibles para clientes.

-- -----------------------------------------------------------------------------
-- Utilidades internas
-- -----------------------------------------------------------------------------

create function public.pv_require_uid()
returns uuid
language plpgsql stable set search_path = public
as $$
declare v uuid := auth.uid();
begin
  if v is null then
    raise exception 'PV_NOT_AUTHENTICATED';
  end if;
  return v;
end;
$$;

create function public.pv_valid_avatar(p text)
returns boolean
language sql immutable set search_path = public
as $$
  select p = any (array[
    'astro','alien','robot','ghost','fox','cat','dragon','unicorn',
    'ninja','wizard','rocket','planet','bolt','gem','crown','dj'
  ]);
$$;

create function public.pv_touch_room(p_room_id uuid)
returns void
language sql security definer set search_path = public
as $$
  update public.rooms
     set version = version + 1, updated_at = now()
   where id = p_room_id;
$$;

create function public.pv_generate_code()
returns text
language plpgsql volatile set search_path = public
as $$
declare
  alphabet constant text := 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  result text;
begin
  loop
    result := '';
    for i in 1..6 loop
      result := result || substr(alphabet, 1 + floor(random() * length(alphabet))::int, 1);
    end loop;
    exit when not exists (select 1 from public.rooms where code = result);
  end loop;
  return result;
end;
$$;

-- Regla de puntuación pura de «¿Quién es más probable?».
-- Entrada:  p_votes    = [{"voter": uuid, "target": uuid}, ...] (en orden de llegada)
--           p_eligible = [uuid, ...] jugadores de la sala
-- Voto válido: votante y objetivo elegibles, votante ≠ objetivo, primer voto del votante.
-- Puntos:   100 por voto válido; +50 si el objetivo está entre los más votados
--           (los empates reconocen a todos los empatados).
-- Debe coincidir exactamente con src/scoring/mostLikely.ts (lo comprueba un test).
create function public.pv_score_votes(p_votes jsonb, p_eligible jsonb)
returns jsonb
language sql immutable set search_path = public
as $$
  with raw as (
    select e ->> 'voter' as voter, e ->> 'target' as target, ord
    from jsonb_array_elements(coalesce(p_votes, '[]'::jsonb)) with ordinality as x (e, ord)
  ),
  elig as (
    select jsonb_array_elements_text(coalesce(p_eligible, '[]'::jsonb)) as id
  ),
  filtered as (
    select voter, target, ord from raw
    where voter is not null and target is not null and voter <> target
      and voter in (select id from elig) and target in (select id from elig)
  ),
  valid as (
    select distinct on (voter) voter, target from filtered order by voter, ord
  ),
  tallies as (
    select target, count(*)::int as c from valid group by target
  ),
  mx as (select max(c) as m from tallies),
  top as (select t.target from tallies t, mx where t.c = mx.m)
  select jsonb_build_object(
    'tallies',   coalesce((select jsonb_object_agg(target, c) from tallies), '{}'::jsonb),
    'top',       coalesce((select jsonb_agg(target order by target collate "C") from top), '[]'::jsonb),
    'max_votes', coalesce((select m from mx), 0),
    'points',    coalesce((
                   select jsonb_object_agg(
                     voter,
                     100 + case when target in (select target from top) then 50 else 0 end)
                   from valid), '{}'::jsonb)
  );
$$;

-- Crea la ronda N de la partida actual con una pregunta no usada en esta partida.
create function public.pv_start_round(p_room_id uuid, p_round_no int)
returns void
language plpgsql security definer set search_path = public
as $$
declare
  v_room public.rooms;
  v_q    public.questions;
begin
  select * into v_room from public.rooms where id = p_room_id;

  select q.* into v_q
    from public.questions q
   where q.active and q.mode = v_room.game_mode
     and q.id not in (
       select r.question_id from public.rounds r
        where r.room_id = p_room_id and r.game_no = v_room.game_no
          and r.question_id is not null)
   order by random()
   limit 1;

  if not found then
    raise exception 'PV_NO_QUESTIONS';
  end if;

  insert into public.rounds (room_id, game_no, round_no, question_id, question_text, deadline)
  values (p_room_id, v_room.game_no, p_round_no, v_q.id, v_q.text,
          now() + make_interval(secs => v_room.vote_seconds));

  update public.rooms
     set current_round = p_round_no, version = version + 1, updated_at = now()
   where id = p_room_id;
end;
$$;

-- Cierra una ronda (debe llamarse con la fila de la ronda bloqueada o dentro de
-- una función que la haya bloqueado). Calcula resultados y suma puntos.
create function public.pv_close_round(p_round_id uuid)
returns boolean
language plpgsql security definer set search_path = public
as $$
declare
  v_round    public.rounds;
  v_votes    jsonb;
  v_eligible jsonb;
  v_results  jsonb;
  v_points   record;
begin
  select * into v_round from public.rounds where id = p_round_id for update;
  if not found or v_round.phase <> 'voting' then
    return false;
  end if;

  select coalesce(jsonb_agg(jsonb_build_object('voter', voter_id, 'target', target_id)
                            order by created_at, voter_id), '[]'::jsonb)
    into v_votes
    from public.votes where round_id = p_round_id;

  select coalesce(jsonb_agg(user_id), '[]'::jsonb) into v_eligible
    from public.room_players where room_id = v_round.room_id;

  v_results := public.pv_score_votes(v_votes, v_eligible)
               || jsonb_build_object('votes', v_votes);

  for v_points in select key::uuid as uid, value::int as pts
                    from jsonb_each_text(v_results -> 'points') loop
    update public.room_players
       set score = score + v_points.pts
     where room_id = v_round.room_id and user_id = v_points.uid;
  end loop;

  update public.rounds
     set phase = 'reveal', revealed_at = now(), results = v_results
   where id = p_round_id;

  perform public.pv_touch_room(v_round.room_id);
  return true;
end;
$$;

-- Margen de latencia: se aceptan votos hasta 2 s después del plazo y la
-- ronda solo se cierra por tiempo pasados esos 2 s.
create function public.pv_grace()
returns interval language sql immutable set search_path = public as $$ select interval '2 seconds' $$;

create function public.pv_all_active_voted(p_round_id uuid, p_room_id uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select (select count(*) from public.room_players
           where room_id = p_room_id and is_active) > 0
     and not exists (
       select 1 from public.room_players p
        where p.room_id = p_room_id and p.is_active
          and not exists (select 1 from public.votes v
                           where v.round_id = p_round_id and v.voter_id = p.user_id));
$$;

-- -----------------------------------------------------------------------------
-- RPC públicas (las únicas que puede llamar la app)
-- -----------------------------------------------------------------------------

create function public.upsert_profile(p_nickname text, p_avatar text)
returns public.profiles
language plpgsql security definer set search_path = public
as $$
declare
  v_uid  uuid := public.pv_require_uid();
  v_nick text := btrim(regexp_replace(coalesce(p_nickname, ''), '\s+', ' ', 'g'));
  v_row  public.profiles;
begin
  if char_length(v_nick) < 2 or char_length(v_nick) > 16 then
    raise exception 'PV_INVALID_NICKNAME';
  end if;
  if not public.pv_valid_avatar(p_avatar) then
    raise exception 'PV_INVALID_AVATAR';
  end if;

  insert into public.profiles (id, nickname, avatar)
  values (v_uid, v_nick, p_avatar)
  on conflict (id) do update
    set nickname = excluded.nickname, avatar = excluded.avatar, updated_at = now()
  returning * into v_row;

  -- Actualiza la ficha en salas en espera.
  update public.room_players rp
     set nickname = v_nick, avatar = p_avatar
    from public.rooms r
   where rp.room_id = r.id and rp.user_id = v_uid and r.status = 'lobby';

  return v_row;
end;
$$;

create function public.create_room()
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

  insert into public.rooms (code, host_id)
  values (public.pv_generate_code(), v_uid)
  returning * into v_room;

  insert into public.room_players (room_id, user_id, nickname, avatar)
  values (v_room.id, v_uid, v_profile.nickname, v_profile.avatar);

  return jsonb_build_object('room_id', v_room.id, 'code', v_room.code);
end;
$$;

create function public.join_room(p_code text)
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
begin
  select * into v_profile from public.profiles where id = v_uid;
  if not found then
    raise exception 'PV_PROFILE_REQUIRED';
  end if;

  -- Bloqueo de la sala: evita superar el cupo con uniones simultáneas.
  select * into v_room from public.rooms where code = v_code for update;
  if not found or v_room.status = 'closed' then
    raise exception 'PV_ROOM_NOT_FOUND';
  end if;

  select * into v_member from public.room_players
   where room_id = v_room.id and user_id = v_uid;

  if found then
    -- Reconexión de un jugador que ya pertenecía a la sala.
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

create function public.leave_room(p_room_id uuid)
returns void
language plpgsql security definer set search_path = public
as $$
declare
  v_uid   uuid := public.pv_require_uid();
  v_room  public.rooms;
  v_new_host uuid;
  v_round public.rounds;
begin
  select * into v_room from public.rooms where id = p_room_id for update;
  if not found then
    return;
  end if;
  if not exists (select 1 from public.room_players where room_id = p_room_id and user_id = v_uid) then
    return;
  end if;

  if v_room.status = 'lobby' then
    delete from public.room_players where room_id = p_room_id and user_id = v_uid;
  else
    update public.room_players set is_active = false
     where room_id = p_room_id and user_id = v_uid;
  end if;

  if v_room.host_id = v_uid then
    select user_id into v_new_host from public.room_players
     where room_id = p_room_id and is_active
     order by joined_at limit 1;
    if v_new_host is null then
      update public.rooms set status = 'closed' where id = p_room_id;
    else
      update public.rooms set host_id = v_new_host where id = p_room_id;
    end if;
  end if;

  -- Si quien se va era el último por votar, la ronda se cierra ya.
  if v_room.status = 'playing' then
    select * into v_round from public.rounds
     where room_id = p_room_id and game_no = v_room.game_no
       and round_no = v_room.current_round and phase = 'voting';
    if found and public.pv_all_active_voted(v_round.id, p_room_id) then
      perform public.pv_close_round(v_round.id);
    end if;
  end if;

  perform public.pv_touch_room(p_room_id);
end;
$$;

create function public.start_game(p_room_id uuid)
returns void
language plpgsql security definer set search_path = public
as $$
declare
  v_uid    uuid := public.pv_require_uid();
  v_room   public.rooms;
  v_active int;
begin
  select * into v_room from public.rooms where id = p_room_id for update;
  if not found or not exists (select 1 from public.room_players
                               where room_id = p_room_id and user_id = v_uid) then
    raise exception 'PV_NOT_IN_ROOM';
  end if;
  if v_room.host_id <> v_uid then
    raise exception 'PV_NOT_HOST';
  end if;
  if v_room.status <> 'lobby' then
    raise exception 'PV_INVALID_STATE';
  end if;

  delete from public.room_players where room_id = p_room_id and not is_active;

  select count(*) into v_active from public.room_players where room_id = p_room_id;
  if v_active < 3 then
    raise exception 'PV_NOT_ENOUGH_PLAYERS';
  end if;
  if v_active > 12 then
    raise exception 'PV_ROOM_FULL';
  end if;

  update public.room_players set score = 0 where room_id = p_room_id;
  update public.rooms
     set status = 'playing', game_no = game_no + 1, current_round = 0
   where id = p_room_id;

  perform public.pv_start_round(p_room_id, 1);
end;
$$;

create function public.submit_vote(p_round_id uuid, p_target_id uuid)
returns jsonb
language plpgsql security definer set search_path = public
as $$
declare
  v_uid    uuid := public.pv_require_uid();
  v_round  public.rounds;
  v_room   public.rooms;
  v_closed boolean := false;
begin
  -- Bloqueo de la ronda: serializa votos y cierre.
  select * into v_round from public.rounds where id = p_round_id for update;
  if not found then
    raise exception 'PV_ROUND_NOT_FOUND';
  end if;

  select * into v_room from public.rooms where id = v_round.room_id;

  if not exists (select 1 from public.room_players
                  where room_id = v_room.id and user_id = v_uid and is_active) then
    raise exception 'PV_NOT_IN_ROOM';
  end if;
  if v_room.status <> 'playing' or v_round.game_no <> v_room.game_no
     or v_round.round_no <> v_room.current_round then
    raise exception 'PV_ROUND_NOT_CURRENT';
  end if;
  if v_round.phase <> 'voting' or now() > v_round.deadline + public.pv_grace() then
    raise exception 'PV_ROUND_CLOSED';
  end if;
  if p_target_id = v_uid then
    raise exception 'PV_SELF_VOTE';
  end if;
  if not exists (select 1 from public.room_players
                  where room_id = v_room.id and user_id = p_target_id and is_active) then
    raise exception 'PV_INVALID_TARGET';
  end if;
  if exists (select 1 from public.votes where round_id = p_round_id and voter_id = v_uid) then
    raise exception 'PV_ALREADY_VOTED';
  end if;

  insert into public.votes (round_id, voter_id, target_id)
  values (p_round_id, v_uid, p_target_id);

  if public.pv_all_active_voted(p_round_id, v_room.id) then
    v_closed := public.pv_close_round(p_round_id);
  else
    perform public.pv_touch_room(v_room.id);
  end if;

  return jsonb_build_object('accepted', true, 'round_closed', v_closed);
end;
$$;

-- Cualquier miembro puede pedir el cierre; el servidor decide si procede.
create function public.close_round(p_round_id uuid)
returns text
language plpgsql security definer set search_path = public
as $$
declare
  v_uid   uuid := public.pv_require_uid();
  v_round public.rounds;
begin
  select * into v_round from public.rounds where id = p_round_id for update;
  if not found then
    raise exception 'PV_ROUND_NOT_FOUND';
  end if;
  if not exists (select 1 from public.room_players
                  where room_id = v_round.room_id and user_id = v_uid) then
    raise exception 'PV_NOT_IN_ROOM';
  end if;
  if v_round.phase <> 'voting' then
    return 'already_closed';
  end if;
  if now() >= v_round.deadline + public.pv_grace()
     or public.pv_all_active_voted(p_round_id, v_round.room_id) then
    perform public.pv_close_round(p_round_id);
    return 'closed';
  end if;
  return 'not_ready';
end;
$$;

-- Avanza a la siguiente ronda o termina la partida.
-- El anfitrión puede avanzar en cuanto se revela; cualquier miembro puede
-- hacerlo cuando ha pasado el tiempo de revelación (por si el anfitrión se cae).
-- p_from_round hace la operación idempotente ante llamadas simultáneas.
create function public.next_round(p_room_id uuid, p_from_round int)
returns text
language plpgsql security definer set search_path = public
as $$
declare
  v_uid   uuid := public.pv_require_uid();
  v_room  public.rooms;
  v_round public.rounds;
begin
  select * into v_room from public.rooms where id = p_room_id for update;
  if not found or not exists (select 1 from public.room_players
                               where room_id = p_room_id and user_id = v_uid) then
    raise exception 'PV_NOT_IN_ROOM';
  end if;
  if v_room.status <> 'playing' or v_room.current_round <> p_from_round then
    return 'already_advanced';
  end if;

  select * into v_round from public.rounds
   where room_id = p_room_id and game_no = v_room.game_no and round_no = v_room.current_round;
  if v_round.phase <> 'reveal' then
    return 'not_ready';
  end if;
  if v_room.host_id <> v_uid
     and now() < v_round.revealed_at + make_interval(secs => v_room.reveal_seconds) then
    return 'not_ready';
  end if;

  if v_room.current_round >= v_room.total_rounds then
    update public.rooms set status = 'finished' where id = p_room_id;
    perform public.pv_touch_room(p_room_id);
    return 'finished';
  end if;

  perform public.pv_start_round(p_room_id, v_room.current_round + 1);
  return 'advanced';
end;
$$;

-- El anfitrión devuelve la sala al vestíbulo (puntos a cero) para volver a jugar.
create function public.restart_game(p_room_id uuid)
returns void
language plpgsql security definer set search_path = public
as $$
declare
  v_uid  uuid := public.pv_require_uid();
  v_room public.rooms;
begin
  select * into v_room from public.rooms where id = p_room_id for update;
  if not found or not exists (select 1 from public.room_players
                               where room_id = p_room_id and user_id = v_uid) then
    raise exception 'PV_NOT_IN_ROOM';
  end if;
  if v_room.host_id <> v_uid then
    raise exception 'PV_NOT_HOST';
  end if;
  if v_room.status not in ('playing', 'finished') then
    raise exception 'PV_INVALID_STATE';
  end if;

  -- Cierra cualquier ronda abierta sin puntuar.
  update public.rounds set phase = 'reveal', revealed_at = now(),
         results = coalesce(results, '{"cancelled": true}'::jsonb)
   where room_id = p_room_id and phase = 'voting';

  delete from public.room_players where room_id = p_room_id and not is_active;
  update public.room_players set score = 0 where room_id = p_room_id;
  update public.rooms set status = 'lobby', current_round = 0 where id = p_room_id;
  perform public.pv_touch_room(p_room_id);
end;
$$;

-- Estado completo y saneado de la sala para el jugador que lo pide.
-- Nunca incluye votos ajenos mientras la ronda está abierta.
create function public.get_room_state(p_room_id uuid)
returns jsonb
language plpgsql stable security definer set search_path = public
as $$
declare
  v_uid   uuid := public.pv_require_uid();
  v_room  public.rooms;
  v_round public.rounds;
  v_round_json jsonb := null;
  v_players jsonb;
begin
  select * into v_room from public.rooms where id = p_room_id;
  if not found or not exists (select 1 from public.room_players
                               where room_id = p_room_id and user_id = v_uid) then
    raise exception 'PV_NOT_IN_ROOM';
  end if;

  if v_room.current_round > 0 then
    select * into v_round from public.rounds
     where room_id = p_room_id and game_no = v_room.game_no and round_no = v_room.current_round;
  end if;

  select coalesce(jsonb_agg(jsonb_build_object(
           'user_id',   p.user_id,
           'nickname',  p.nickname,
           'avatar',    p.avatar,
           'score',     p.score,
           'is_active', p.is_active,
           'is_host',   p.user_id = v_room.host_id,
           'has_voted', v_round.id is not null and exists (
                          select 1 from public.votes v
                           where v.round_id = v_round.id and v.voter_id = p.user_id)
         ) order by p.joined_at), '[]'::jsonb)
    into v_players
    from public.room_players p where p.room_id = p_room_id;

  if v_round.id is not null then
    v_round_json := jsonb_build_object(
      'id',          v_round.id,
      'round_no',    v_round.round_no,
      'question',    v_round.question_text,
      'phase',       v_round.phase,
      'started_at',  v_round.started_at,
      'deadline',    v_round.deadline,
      'revealed_at', v_round.revealed_at,
      'votes_cast',  (select count(*) from public.votes where round_id = v_round.id),
      'my_vote',     (select target_id from public.votes
                       where round_id = v_round.id and voter_id = v_uid),
      'results',     case when v_round.phase = 'reveal' then v_round.results end
    );
  end if;

  return jsonb_build_object(
    'server_now', now(),
    'me',         v_uid,
    'room', jsonb_build_object(
      'id', v_room.id, 'code', v_room.code, 'host_id', v_room.host_id,
      'status', v_room.status, 'game_mode', v_room.game_mode,
      'game_no', v_room.game_no, 'current_round', v_room.current_round,
      'total_rounds', v_room.total_rounds, 'vote_seconds', v_room.vote_seconds,
      'reveal_seconds', v_room.reveal_seconds, 'version', v_room.version),
    'players', v_players,
    'round',   v_round_json
  );
end;
$$;

-- -----------------------------------------------------------------------------
-- Permisos de ejecución
-- -----------------------------------------------------------------------------

-- Supabase concede EXECUTE por defecto; se retira todo y se concede solo lo público.
revoke execute on all functions in schema public from public, anon, authenticated;

grant execute on function
  public.pv_is_room_member(uuid),             -- usada por las políticas RLS
  public.upsert_profile(text, text),
  public.create_room(),
  public.join_room(text),
  public.leave_room(uuid),
  public.start_game(uuid),
  public.submit_vote(uuid, uuid),
  public.close_round(uuid),
  public.next_round(uuid, int),
  public.restart_game(uuid),
  public.get_room_state(uuid)
to authenticated;

-- pv_require_uid y pv_valid_avatar se invocan dentro de funciones SECURITY
-- DEFINER (como propietario), por lo que no necesitan permiso para clientes.

-- -----------------------------------------------------------------------------
-- Realtime: solo `rooms`. Cada cambio de estado incrementa `rooms.version` y
-- los clientes resincronizan con get_room_state().
-- -----------------------------------------------------------------------------

do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    alter publication supabase_realtime add table public.rooms;
  end if;
end;
$$;
