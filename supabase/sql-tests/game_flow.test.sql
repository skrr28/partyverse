-- =============================================================================
-- Prueba de integración: partida completa de «¿Quién es más probable?»
-- jugada por varios usuarios contra las migraciones reales.
-- Se ejecuta con: npm run test:db   (ver scripts/test-db.sh)
-- =============================================================================
\set ON_ERROR_STOP on
\set QUIET on
set client_min_messages = warning;

-- ---------- utilidades de prueba ----------
create schema pvtest;
grant usage on schema pvtest to authenticated, anon;
create table pvtest.ctx (k text primary key, v text);
grant all on pvtest.ctx to authenticated;

create function pvtest.id(p text) returns uuid language sql stable
as $$ select v::uuid from pvtest.ctx where k = p $$;

create function pvtest.put(p text, val text) returns void language sql
as $$ insert into pvtest.ctx values (p, val) on conflict (k) do update set v = excluded.v $$;

create function pvtest.act_as(p text) returns void language plpgsql as $$
begin
  perform set_config('role', 'none', false);
  perform set_config('request.jwt.claims',
                     json_build_object('sub', pvtest.id(p), 'role', 'authenticated')::text, false);
  perform set_config('role', 'authenticated', false);
end $$;

create function pvtest.check(cond boolean, msg text) returns void language plpgsql as $$
begin
  if cond is distinct from true then
    raise exception 'TEST FAILED: %', msg;
  end if;
  raise notice 'ok - %', msg;
end $$;

create function pvtest.expect_error(p_sql text, p_code text, msg text) returns void language plpgsql as $$
begin
  begin
    execute p_sql;
  exception when others then
    if sqlerrm like p_code || '%' then
      raise notice 'ok - % (%)', msg, p_code;
      return;
    end if;
    raise exception 'TEST FAILED: % -> esperado %, obtenido "%"', msg, p_code, sqlerrm;
  end;
  raise exception 'TEST FAILED: % -> esperado %, pero no hubo error', msg, p_code;
end $$;

create function pvtest.state(p_user text) returns jsonb language sql as $$
  select public.get_room_state(pvtest.id('room'))
$$;

create function pvtest.score(p_user text) returns int language sql security definer as $$
  select score from public.room_players where room_id = pvtest.id('room') and user_id = pvtest.id(p_user)
$$;

create function pvtest.round_id() returns uuid language sql security definer as $$
  select r.id from public.rounds r join public.rooms m on m.id = r.room_id
   where m.id = pvtest.id('room') and r.game_no = m.game_no and r.round_no = m.current_round
$$;

grant execute on all functions in schema pvtest to authenticated, anon;
grant select on pvtest.ctx to anon;

set client_min_messages = notice;

-- ---------- usuarios ----------
do $$
declare i int;
begin
  for i in 1..16 loop
    perform pvtest.put('u' || i, gen_random_uuid()::text);
    insert into auth.users (id) values (pvtest.id('u' || i));
  end loop;
end $$;

-- ---------- 1. Perfil ----------
select pvtest.act_as('u1');
select pvtest.expect_error('select public.create_room(''Neon2026'')', 'PV_PROFILE_REQUIRED', 'crear sala exige perfil');
select pvtest.expect_error($q$select public.upsert_profile('a', 'astro')$q$, 'PV_INVALID_NICKNAME', 'apodo demasiado corto');
select pvtest.expect_error($q$select public.upsert_profile('Ana', 'tanque')$q$, 'PV_INVALID_AVATAR', 'avatar desconocido');
select public.upsert_profile('  Ana   Neón ', 'astro') \gset
select pvtest.check((select nickname from public.profiles where id = pvtest.id('u1')) = 'Ana Neón', 'apodo normalizado');

select pvtest.act_as('u2'); select public.upsert_profile('Beto', 'robot') \gset
select pvtest.act_as('u3'); select public.upsert_profile('Caro', 'fox') \gset
select pvtest.act_as('u4'); select public.upsert_profile('Dani', 'cat') \gset

-- ---------- 2. Sala ----------
select pvtest.act_as('u1');
select pvtest.put('room', (r ->> 'room_id')), pvtest.put('code', r ->> 'code')
  from (select public.create_room('Neon2026') as r) s \gset
select pvtest.check((select v from pvtest.ctx where k = 'code') ~ '^[A-HJKMNP-Z2-9]{6}$', 'código de sala con formato válido');

select pvtest.expect_error('select public.create_room(''abc'')', 'PV_INVALID_PASSWORD', 'contraseña de sala demasiado corta');
select pvtest.act_as('u2');
select pvtest.check(public.join_room((select v from pvtest.ctx where k = 'code'), 'incorrecta') ->> 'error' = 'PV_WRONG_PASSWORD', 'contraseña incorrecta rechazada');
select pvtest.check(public.join_room((select v from pvtest.ctx where k = 'code'), null) ->> 'error' = 'PV_WRONG_PASSWORD', 'sin contraseña no se entra');
select pvtest.check(not exists (select 1 from public.room_players where user_id = auth.uid()), 'el intento fallido no añade al jugador');
select pvtest.act_as('u1');
select pvtest.expect_error('select count(*) from public.room_secrets', 'permission denied', 'hash de contraseña ilegible para clientes');
reset role;
select pvtest.check((select password_hash from public.room_secrets limit 1) like '$2_$%', 'se guarda un hash bcrypt, no la contraseña');
select pvtest.act_as('u2');
select public.join_room(lower((select v from pvtest.ctx where k = 'code')), 'Neon2026') \gset
select pvtest.check(public.join_room('ZZZZZZ', 'Neon2026') ->> 'error' = 'PV_ROOM_NOT_FOUND', 'código inexistente');

select pvtest.act_as('u1');
select pvtest.expect_error('select public.start_game(pvtest.id(''room''))', 'PV_NOT_ENOUGH_PLAYERS', 'mínimo 3 jugadores');

select pvtest.act_as('u3');
select public.join_room((select v from pvtest.ctx where k = 'code'), 'Neon2026') \gset
select pvtest.expect_error('select public.start_game(pvtest.id(''room''))', 'PV_NOT_HOST', 'solo el anfitrión inicia');

-- ---------- 3. Seguridad: RLS y permisos ----------
select pvtest.act_as('u2');
select pvtest.expect_error('select count(*) from public.votes', 'permission denied', 'votos ilegibles para clientes');
select pvtest.expect_error('insert into public.votes values (gen_random_uuid(), auth.uid(), auth.uid())', 'permission denied', 'sin inserción directa de votos');
select pvtest.expect_error('update public.room_players set score = 9999', 'permission denied', 'sin edición directa de puntos');
select pvtest.expect_error('update public.rooms set status = ''finished''', 'permission denied', 'sin edición directa de la sala');
select pvtest.expect_error('select public.pv_close_round(gen_random_uuid())', 'permission denied', 'funciones internas no expuestas');
select pvtest.check((select count(*) from public.rooms) = 1, 'un miembro ve su sala');
select pvtest.check((select count(*) from public.profiles) = 1, 'solo se ve el perfil propio');

select pvtest.act_as('u4');
select pvtest.check((select count(*) from public.rooms) = 0, 'un no-miembro no ve la sala');
select pvtest.check((select count(*) from public.room_players) = 0, 'un no-miembro no ve participantes');
select pvtest.expect_error('select public.get_room_state(pvtest.id(''room''))', 'PV_NOT_IN_ROOM', 'estado vedado a no-miembros');

reset role;
set role anon;
select pvtest.expect_error('select public.create_room(''Neon2026'')', 'permission denied', 'anon sin sesión no puede llamar RPC');
reset role;

-- ---------- 4. Ronda 1: validaciones de voto ----------
select pvtest.act_as('u1');
select public.start_game(pvtest.id('room')) \gset
select pvtest.check(pvtest.state('u1') #>> '{room,status}' = 'playing', 'partida iniciada');
select pvtest.check((pvtest.state('u1') #>> '{round,round_no}')::int = 1, 'ronda 1 activa');

select pvtest.expect_error('select public.submit_vote(pvtest.round_id(), pvtest.id(''u1''))', 'PV_SELF_VOTE', 'no se puede votar por uno mismo');
select pvtest.expect_error('select public.submit_vote(pvtest.round_id(), pvtest.id(''u4''))', 'PV_INVALID_TARGET', 'no se vota a alguien ajeno a la sala');
select public.submit_vote(pvtest.round_id(), pvtest.id('u2')) \gset
select pvtest.expect_error('select public.submit_vote(pvtest.round_id(), pvtest.id(''u3''))', 'PV_ALREADY_VOTED', 'no se admiten votos duplicados');

select pvtest.act_as('u4');
select pvtest.expect_error('select public.submit_vote(pvtest.round_id(), pvtest.id(''u1''))', 'PV_NOT_IN_ROOM', 'un no-miembro no vota');

select pvtest.act_as('u2');
select pvtest.check(pvtest.state('u2') #> '{round,results}' = 'null'::jsonb, 'resultados ocultos antes del cierre');
select pvtest.check(pvtest.state('u2') #> '{round,my_vote}' = 'null'::jsonb, 'u2 no ve el voto de u1');
select pvtest.check((pvtest.state('u2') #>> '{round,votes_cast}')::int = 1, 'solo se expone el número de votos');
select pvtest.check(position(pvtest.id('u2')::text in (pvtest.state('u2') -> 'round')::text) = 0,
                    'el estado no contiene el objetivo del voto ajeno');
select pvtest.check((select results from public.rounds where id = pvtest.round_id()) is null, 'rounds.results vacío durante la votación');
select pvtest.check((select count(*) from public.rounds) = 1, 'lectura directa de rounds sin votos');
select pvtest.check(public.next_round(pvtest.id('room'), 1) = 'not_ready', 'no se avanza con la ronda abierta');
select pvtest.check(public.close_round(pvtest.round_id()) = 'not_ready', 'no se cierra antes de tiempo');
select public.submit_vote(pvtest.round_id(), pvtest.id('u1')) \gset

select pvtest.act_as('u3');
select pvtest.check((public.submit_vote(pvtest.round_id(), pvtest.id('u2')) ->> 'round_closed')::boolean,
                    'la ronda se cierra cuando todos votan');
select pvtest.check(pvtest.state('u3') #>> '{round,phase}' = 'reveal', 'fase de revelación');
select pvtest.check(pvtest.state('u3') #> '{round,results,top}' = jsonb_build_array(pvtest.id('u2')), 'u2 es el más votado');
select pvtest.check((pvtest.state('u3') #>> array['round','results','tallies', pvtest.id('u2')::text])::int = 2, 'u2 recibe 2 votos');
select pvtest.check(jsonb_array_length(pvtest.state('u3') #> '{round,results,votes}') = 3, 'votos revelados tras el cierre');
select pvtest.check(pvtest.score('u1') = 150 and pvtest.score('u2') = 100 and pvtest.score('u3') = 150,
                    'ronda 1: 100 por voto + 50 por acertar al más votado');

-- Un no-anfitrión no puede adelantar la revelación.
select pvtest.check(public.next_round(pvtest.id('room'), 1) = 'not_ready', 'solo el anfitrión adelanta la revelación');
select pvtest.act_as('u1');
select pvtest.check(public.next_round(pvtest.id('room'), 1) = 'advanced', 'el anfitrión pasa a la ronda 2');
select pvtest.check(public.next_round(pvtest.id('room'), 1) = 'already_advanced', 'avance idempotente');

-- ---------- 5. Ronda 2: empate a tres ----------
select pvtest.act_as('u1'); select public.submit_vote(pvtest.round_id(), pvtest.id('u2')) \gset
select pvtest.act_as('u2'); select public.submit_vote(pvtest.round_id(), pvtest.id('u3')) \gset
select pvtest.act_as('u3'); select public.submit_vote(pvtest.round_id(), pvtest.id('u1')) \gset
select pvtest.check(jsonb_array_length(pvtest.state('u3') #> '{round,results,top}') = 3, 'empate: se reconoce a los tres');
select pvtest.check(pvtest.score('u1') = 300 and pvtest.score('u2') = 250 and pvtest.score('u3') = 300,
                    'ronda 2: todos suman 150 por el empate');
select pvtest.check(pvtest.state('u3') #>> '{round,question}' <>
                    (select question_text from public.rounds where round_no = 1 and room_id = pvtest.id('room')),
                    'no se repite la pregunta');

-- ---------- 6. Ronda 3: cierre por tiempo ----------
select pvtest.act_as('u1');
select public.next_round(pvtest.id('room'), 2) \gset
select public.submit_vote(pvtest.round_id(), pvtest.id('u3')) \gset
reset role;
update public.rounds set deadline = now() - interval '3 seconds' where id = pvtest.round_id();
select pvtest.act_as('u2');
select pvtest.expect_error('select public.submit_vote(pvtest.round_id(), pvtest.id(''u1''))', 'PV_ROUND_CLOSED', 'voto fuera de plazo rechazado');
select pvtest.check(public.close_round(pvtest.round_id()) = 'closed', 'cualquier miembro cierra la ronda vencida');
select pvtest.check(public.close_round(pvtest.round_id()) = 'already_closed', 'cierre idempotente');
select pvtest.check(pvtest.score('u1') = 450 and pvtest.score('u2') = 250 and pvtest.score('u3') = 300,
                    'ronda 3: sin voto no hay puntos');

-- Si el anfitrión desaparece, otro jugador avanza tras la revelación.
reset role;
update public.rounds set revealed_at = now() - interval '30 seconds' where id = pvtest.round_id();
select pvtest.act_as('u3');
select pvtest.check(public.next_round(pvtest.id('room'), 3) = 'advanced', 'avance automático por cualquier miembro');

-- ---------- 7. Ronda 4: abandono y reconexión ----------
select pvtest.act_as('u1'); select public.submit_vote(pvtest.round_id(), pvtest.id('u3')) \gset
select pvtest.act_as('u3'); select public.submit_vote(pvtest.round_id(), pvtest.id('u1')) \gset
select pvtest.act_as('u2'); select public.leave_room(pvtest.id('room')) \gset
select pvtest.act_as('u1');
select pvtest.check(pvtest.state('u1') #>> '{round,phase}' = 'reveal', 'si el último pendiente se va, la ronda se cierra');
select pvtest.check(pvtest.score('u1') = 600 and pvtest.score('u2') = 250 and pvtest.score('u3') = 450, 'ronda 4 puntuada');

select pvtest.act_as('u4');
select pvtest.expect_error('select public.join_room((select v from pvtest.ctx where k = ''code''), ''Neon2026'')', 'PV_GAME_IN_PROGRESS', 'no se entra a una partida en curso');
select pvtest.act_as('u2');
select pvtest.check((public.join_room((select v from pvtest.ctx where k = 'code'), null) ->> 'rejoined')::boolean, 'reconexión de un jugador de la sala (sin contraseña)');
select pvtest.check(pvtest.score('u2') = 250, 'la reconexión conserva los puntos');

-- ---------- 8. Ronda 5 y final ----------
select pvtest.act_as('u1'); select public.next_round(pvtest.id('room'), 4) \gset
select public.submit_vote(pvtest.round_id(), pvtest.id('u2')) \gset
select pvtest.act_as('u2'); select public.submit_vote(pvtest.round_id(), pvtest.id('u1')) \gset
select pvtest.act_as('u3'); select public.submit_vote(pvtest.round_id(), pvtest.id('u1')) \gset
select pvtest.act_as('u1');
select pvtest.check(public.next_round(pvtest.id('room'), 5) = 'finished', 'cinco rondas y fin de partida');
select pvtest.check(pvtest.state('u1') #>> '{room,status}' = 'finished', 'estado final');
select pvtest.check(pvtest.score('u1') = 700 and pvtest.score('u2') = 400 and pvtest.score('u3') = 600,
                    'puntuación final 700 / 400 / 600');

select pvtest.act_as('u2');
select pvtest.expect_error('select public.restart_game(pvtest.id(''room''))', 'PV_NOT_HOST', 'solo el anfitrión reinicia');
select pvtest.act_as('u1');
select public.restart_game(pvtest.id('room')) \gset
select pvtest.check(pvtest.state('u1') #>> '{room,status}' = 'lobby', 'reinicio vuelve al vestíbulo');
select pvtest.check(pvtest.score('u1') = 0 and pvtest.score('u3') = 0, 'reinicio pone puntos a cero');
select public.start_game(pvtest.id('room')) \gset
select pvtest.check((pvtest.state('u1') #>> '{room,game_no}')::int = 2 and
                    (pvtest.state('u1') #>> '{round,round_no}')::int = 1, 'segunda partida desde la ronda 1');

-- ---------- 9. Sala llena (12) y traspaso de anfitrión ----------
reset role;
insert into public.profiles (id, nickname, avatar)
select pvtest.id('u' || i), 'Jugador' || i, 'ghost' from generate_series(5, 16) i;

select pvtest.act_as('u4');
select pvtest.put('room', (r ->> 'room_id')), pvtest.put('code', r ->> 'code')
  from (select public.create_room('Neon2026') as r) s \gset

do $$
declare i int;
begin
  for i in 5..15 loop
    perform pvtest.act_as('u' || i);
    perform public.join_room((select v from pvtest.ctx where k = 'code'), 'Neon2026');
  end loop;
end $$;

select pvtest.act_as('u16');
select pvtest.expect_error('select public.join_room((select v from pvtest.ctx where k = ''code''), ''Neon2026'')', 'PV_ROOM_FULL', 'la sala llena rechaza al jugador 13');

select pvtest.act_as('u4');
select pvtest.check(jsonb_array_length(pvtest.state('u4') -> 'players') = 12, 'la sala tiene 12 jugadores');
select public.leave_room(pvtest.id('room')) \gset
select pvtest.act_as('u5');
select pvtest.check((pvtest.state('u5') #>> '{room,host_id}')::uuid = pvtest.id('u5'), 'el anfitrión pasa al siguiente jugador');
select pvtest.act_as('u16');
select public.join_room((select v from pvtest.ctx where k = 'code'), 'Neon2026') \gset
select pvtest.check(true, 'tras una salida, vuelve a haber hueco');

-- ---------- 10. Freno a la fuerza bruta ----------
select pvtest.act_as('u16');
select count(public.join_room('ZZZZZZ', 'x1234')) from generate_series(1, 10) \gset
select pvtest.expect_error('select public.join_room((select v from pvtest.ctx where k = ''code''), ''Neon2026'')', 'PV_TOO_MANY_ATTEMPTS', 'tras 10 fallos se bloquean los intentos');

reset role;
\echo 'TODAS LAS PRUEBAS SQL SUPERADAS'
