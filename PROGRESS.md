# Registro de avance — PARTYVERSE

## Entrega 1 · 2026-11-05 · «¿Quién es más probable?»

### Verificado (ejecutado en este entorno)

| Área | Cómo se verificó |
|---|---|
| Migraciones SQL, RLS y funciones de servidor | Aplicadas sobre PostgreSQL 16 real; 66 comprobaciones en una partida simulada con 3 usuarios (`npm run test:db`) |
| Reglas de votación y puntuación | 10 pruebas unitarias + paridad TS↔SQL en 60 rondas aleatorias (`npm test`, `npm run test:parity`) |
| Reloj sincronizado y reintentos | 4 pruebas unitarias |
| Avatares app = avatares validados en servidor | 1 prueba |
| Tipos | `tsc --noEmit` sin errores (app y pruebas) |
| Compilación de la app | `expo export` genera los bundles Hermes de Android e iOS sin errores |
| Compatibilidad de dependencias | `expo-doctor`: 18/20 OK; las 2 restantes requieren acceso a la API de Expo (no disponible en el entorno) |

### Supabase conectado (2026-11-05)

- Proyecto `partyverse` (ref `hssijwtlpnrooegtfftf`, región sa-east-1) creado.
- Las 2 migraciones están aplicadas: 40 preguntas, Realtime activo en `rooms`, `anon` sin acceso y votos ilegibles para `authenticated`.
- `.env.local` contiene la URL y la clave publicable.
- Se jugó una ronda dentro de la BD real con 3 usuarios anónimos y el `auth.uid()` de Supabase. Se comprobó: votos ilegibles, autovoto y duplicado rechazados, votos ocultos hasta el cierre, cierre y revelación simultánea, y puntos 150/100/150. La prueba se ejecutó en una transacción deshecha, así que la BD quedó vacía.
- Avisos de seguridad del linter, revisados y aceptados:
  - RPC `SECURITY DEFINER` ejecutables por `authenticated`: es el diseño.
  - `votes` y `questions` sin políticas: es intencional, para que sean ilegibles.
- **Pendiente:** activar el acceso de invitado en el dashboard. El conector no puede cambiar la configuración de Auth.

### Implementado, pendiente de probar en dispositivos

- Acceso de invitado (Auth anónima) y persistencia de sesión.
- Pantallas: bienvenida, apodo/avatar, inicio, sala, votación, revelación, clasificación.
- Suscripción Realtime, reconexión y estados de carga/error/sala llena en la interfaz.

Motivo: este entorno no tiene dispositivos ni salida de red hacia supabase.co. Siguiente paso: activar el acceso de invitado y seguir el README §3 con 3 dispositivos.

### Contraseña por sala (2026-11-06)

- Migración `20261106000003_room_passwords.sql`, aplicada también en Supabase.
- El hash bcrypt se guarda en la tabla `room_secrets`, que ningún cliente puede leer. No va en `rooms`, porque Realtime envía esa fila a los jugadores.
- Freno contra la fuerza bruta: 10 fallos cada 10 minutos por jugador. Un fallo se devuelve como `{error}` y no como excepción, para que el intento quede registrado.
- Verificado:
  - 73 comprobaciones SQL en local.
  - Prueba en la BD real (deshecha al terminar): hash ilegible y en formato bcrypt, contraseña incorrecta rechazada, contraseña correcta admitida, intento fallido registrado.
  - `tsc` y el bundle web compilan.

## Entrega 2 · 2026-11-06 · Catálogo amplio y modo local

### Lo que se añadió

- **Portada nueva:**
  - Botón «¡EMPEZAR A JUGAR!», más «Crear una partida» y «Unirme con código».
  - Selector de 9 ambientes.
  - Partidas recientes, favoritos y recomendados según el tamaño del grupo.
  - Categorías, populares, nuevos y próximos lanzamientos.
  - Acceso a «Perfil y configuración».
- **Flujo en tres pasos:** ambiente → participantes (hasta 20, guardados en el dispositivo) → catálogo filtrable por ambiente, categoría, tamaño del grupo y búsqueda.
- **54 juegos en las 10 categorías del prompt maestro (A–J),** movidos por 12 motores:
  - Tarjetas por turnos: verdad o reto con 3 intensidades y tarjetas propias.
  - Adivinar contra reloj: individual o por 2 equipos, con dificultad.
  - Trivia: 108 preguntas, puntos por rapidez y explicaciones.
  - Ruleta: giro animado con resultado aleatorio real, editable, con ruletas guardadas.
  - Impostor: roles privados, variante infiltrado, voto secreto, desempate y robo de puntos.
  - Basta / Stop.
  - Cara o cruz, piedra-papel-tijera, adivina el número, mayor o menor, reflejos y memoria visual.
- **Resultados:** clasificación con empates, equipos, reconocimientos y confeti.
- **+18:** ambiente y juegos separados, ocultos por defecto en el catálogo. Piden confirmar que todos tienen 18 años o más (válido hasta cerrar la app) y se pueden ocultar del todo en Configuración. El contenido es atrevido pero no explícito, y «Paso» nunca penaliza.
- **Modo en línea (`/online`):** el de la entrega 1. Ya no hace falta cuenta para jugar en local.

### Verificado

- 37 pruebas unitarias:
  - Lógica de los motores con aleatoriedad determinista: la ruleta cae en el segmento elegido y reparte de forma uniforme; impostor; votos; equipos.
  - Validación del contenido: sin duplicados, respuestas de trivia válidas y +18 aislado.
- Recorrido real en Chrome sin interfaz, a tamaño de móvil (390×844): 14 flujos (`npm run test:web`), sin errores de consola.
  - Encontró y corrigió 2 fallos: un campo que desbordaba la pantalla en web y el retraso de 50 ms al tocar en reflejos.
- `tsc`, bundles web/Android/iOS y pruebas SQL.

### Pendiente / siguientes entregas

- [ ] Prueba manual en dispositivos reales (Android + iPhone) con Supabase conectado.
- [ ] Presencia (detectar desconexiones sin «Salir») con Realtime Presence.
- [ ] Limpieza programada de salas antiguas (pg_cron).
- [ ] Sonidos/hápticos y animación de revelación.
- [ ] Batalla relámpago.
- [ ] ¿Cuánto me conoces?
- [ ] Moderación de apodos y banco de preguntas ampliable.
