# PARTYVERSE

App social de minijuegos multijugador en tiempo real para Android y iPhone.
**54 juegos** en 10 categorías y 9 ambientes. Se juegan en un solo móvil y sin cuenta (modo local), y además está **¿Quién es más probable?** en línea, con un móvil por jugador.

- **App:** Expo SDK 58 · React Native 0.88 · React 19.3 · TypeScript · Expo Router
- **Backend:** Supabase (Auth anónima, PostgreSQL, Realtime)
- **Lógica de servidor:** funciones RPC de PostgreSQL con RLS

---

## 1. Requisitos

| Herramienta | Versión |
|---|---|
| Node.js | 20.19+ o 22.x (probado con 22.23) |
| npm | 10+ |
| Cuenta de Supabase | plan gratuito suficiente |
| Expo Go en el móvil | versión compatible con **SDK 58** (la última de la tienda) |
| PostgreSQL local (solo para `npm run test:db`) | 15+ (`initdb`, `pg_ctl`, `psql`) |

## 2. Configurar Supabase (una vez)

> Sin estos pasos la app arranca, pero muestra «Falta conectar Supabase».

1. **Crea un proyecto** en <https://supabase.com/dashboard>.
2. **Activa el acceso de invitado:** *Authentication → Sign In / Providers →* activa **Allow anonymous sign-ins** y guarda.
3. **Aplica las migraciones** (crean tablas, seguridad, funciones de servidor y preguntas). Elige una opción:
   - **CLI (recomendada):**
     ```bash
     npx supabase login
     npx supabase link --project-ref TU_PROJECT_REF   # el ref aparece en la URL del dashboard
     npx supabase db push
     ```
   - **Manual:** *SQL Editor →* pega y ejecuta, en este orden,
     `supabase/migrations/20261105000001_partyverse_core.sql` y
     `supabase/migrations/20261105000002_most_likely_questions.sql`.
4. **Comprueba Realtime:** *Database → Publications → supabase_realtime* debe incluir la tabla `rooms` (la migración la añade).
5. **Variables de entorno de la app:**
   ```bash
   cp .env.example .env.local
   ```
   Rellena `EXPO_PUBLIC_SUPABASE_URL` y `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
   (*Project Settings → API Keys*; usa la clave **publicable**, nunca la secreta ni la contraseña de la BD).

## 3. Ejecutar en local y en un dispositivo real

```bash
npm install
npx expo start --clear
```

- **Android:** abre Expo Go y escanea el QR.
- **iPhone:** escanea el QR con la cámara; se abre en Expo Go.
- El móvil y el ordenador deben estar en la misma Wi-Fi. Si no es posible (redes de empresa/universidad), usa `npx expo start --tunnel`.

### Probar una partida real (mínimo 3 jugadores)

Cada instalación de Expo Go crea su propio invitado, así que necesitas **3 dispositivos** (teléfonos, emulador Android o simulador iOS, en cualquier combinación).

1. Dispositivo A: *Jugar como invitado → apodo/avatar → Crear sala*. Aparece un código de 6 caracteres.
2. Dispositivos B y C: *Unirme con código*.
3. A (anfitrión) pulsa **¡Empezar partida!** → 5 rondas de 30 s → clasificación → **Volver a jugar**.

Cosas que conviene comprobar: votar por uno mismo no es posible; tras votar, los demás solo ven ✓ (no a quién); al cerrar la ronda todos ven los resultados a la vez; cerrar Expo Go en un teléfono y volver a abrir la sala (reconexión); intentar unirse a una sala con 12 jugadores (sala llena).

## 4. Pruebas automatizadas

```bash
npm run typecheck     # TypeScript (app + pruebas)
npm test              # reglas de votación, puntuación, clasificación y reloj (node:test)
npm run test:db       # PostgreSQL temporal + migraciones reales + partida completa simulada
npm run test:parity   # la puntuación SQL y la de TypeScript coinciden en 60 rondas aleatorias
npm run test:all      # todo lo anterior
npm run test:web      # recorrido real en Chrome sin interfaz (14 flujos, capturas en .e2e-shots/)
```

`test:db` aplica un *shim* mínimo (`supabase/sql-tests/supabase_shim.sql`) que reproduce `auth.uid()` y los roles de Supabase, y luego juega una partida completa con 3 usuarios (66 comprobaciones: permisos RLS, autovoto, duplicados, votos ocultos, empates, cierre por tiempo, abandono, reconexión, sala llena, reinicio).

## 5. Arquitectura

```
src/
  app/                 rutas (Expo Router): bienvenida, perfil, inicio, sala
  navigation/          rutas tipadas y protección de pantallas
  ui/                  tema neón y componentes base
  backend/             cliente Supabase, RPC tipadas, errores
  players/             sesión de invitado, perfil, avatares
  rooms/               sincronización en tiempo real, vestíbulo, resultados
  engine/              reloj sincronizado y motor de rondas
  minigames/           registro de minijuegos + most-likely/
  scoring/             reglas puras (espejo de la función SQL)
supabase/
  migrations/          esquema, RLS, funciones de servidor, preguntas
  sql-tests/           shim + partida simulada
scripts/test-db.sh     ejecutor de las pruebas SQL
```

### Seguridad y autoridad del servidor

- Los clientes **no pueden escribir** en ninguna tabla: todo pasa por funciones `SECURITY DEFINER` que validan estado, anfitrión, turno, plazos y votos, y calculan los puntos.
- La tabla `votes` **no tiene política de lectura**. Durante la votación solo se expone cuántos han votado y quién (✓), nunca a quién. Los votos se publican en `rounds.results` al cerrar la ronda, para todos a la vez.
- Restricciones en BD además de en las funciones: clave primaria `(round_id, voter_id)` (un voto por ronda) y `check (voter_id <> target_id)` (sin autovoto).
- Concurrencia: bloqueos de fila en sala/ronda para que el cupo de 12 y el cierre de ronda sean correctos con peticiones simultáneas; `next_round` y `close_round` son idempotentes.

| RPC | Quién | Qué hace |
|---|---|---|
| `upsert_profile` | cualquiera | apodo (2–16) y avatar validados |
| `create_room` / `join_room` | con perfil | código único y contraseña; sala llena, en curso, reconexión, límite de intentos |
| `start_game` / `restart_game` | anfitrión | 3–12 jugadores; reinicia puntos |
| `submit_vote` | jugador activo | valida y cierra la ronda si votaron todos |
| `close_round` | cualquier miembro | solo si venció el plazo (+2 s) o votaron todos |
| `next_round` | anfitrión, o cualquiera tras 12 s de revelación | avanza o termina |
| `leave_room` | miembro | traspasa anfitrión; cierra la ronda si era el último pendiente |
| `get_room_state` | miembro | estado saneado para ese jugador |

### Tiempo real y reconexión

Cada cambio incrementa `rooms.version`; la app escucha esa tabla por Realtime y vuelve a pedir `get_room_state`. Si el canal cae, reintenta con espera creciente (1 s → 15 s), resincroniza al volver a primer plano y hace un sondeo de seguridad (10 s en vivo, 3 s degradado). Los plazos los fija el servidor y el cliente corrige el desfase de reloj.

### ¿Por qué RPC de PostgreSQL y no Edge Functions?

Las reglas críticas necesitan transacciones y bloqueos sobre los mismos datos; dentro de la BD son atómicas, sin arranque en frío y verificables con pruebas SQL. Las Edge Functions quedan para lo que requiera secretos o servicios externos (notificaciones, moderación…).

## 6. Reglas de «¿Quién es más probable?»

- 3–12 jugadores · 5 rondas · 30 s por votación · 1 voto por jugador y ronda.
- Cada sala tiene contraseña (4–32 caracteres, guardada como hash bcrypt). Para unirse hace falta código + contraseña; quien ya está en la sala se reconecta sin ella. Máximo 10 intentos fallidos cada 10 minutos por jugador.
- Voto válido: +100. Elegir a la persona más votada: +50. En empate, todos los empatados cuentan como «más votados».
- No se puede votar por uno mismo, votar dos veces ni ver votos ajenos antes del cierre.

## 7. Versión web (Vercel o Netlify)

La app también funciona en el navegador del móvil. `vercel.json` y `netlify.toml` ya traen el comando de compilación (`npx expo export --platform web`), la carpeta de salida (`dist`) y las reglas de rutas. `.env.production` contiene los dos valores públicos de Supabase, así que no hay que configurar variables.

- **Vercel:** vercel.com/new → *Import Git Repository* → elige el repo → *Deploy*.
- **Netlify:** el sitio `partyverse-ykj3` → *Project configuration → Build & deploy → Link repository*.
