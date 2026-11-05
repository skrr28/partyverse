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

### Implementado, pendiente de probar con Supabase real y dispositivos

- Acceso de invitado (Auth anónima) y persistencia de sesión.
- Pantallas: bienvenida, apodo/avatar, inicio, sala, votación, revelación, clasificación.
- Suscripción Realtime, reconexión y estados de carga/error/sala llena en la interfaz.

Motivo: no hay un proyecto de Supabase configurado ni dispositivos/emuladores en este entorno. Siguiente paso: seguir el README §2–3 y jugar una partida con 3 dispositivos.

### Pendiente / siguientes entregas

- [ ] Prueba manual en dispositivos reales (Android + iPhone) con Supabase conectado.
- [ ] Presencia (detectar desconexiones sin «Salir») con Realtime Presence.
- [ ] Limpieza programada de salas antiguas (pg_cron).
- [ ] Sonidos/hápticos y animación de revelación.
- [ ] Batalla relámpago.
- [ ] ¿Cuánto me conoces?
- [ ] Moderación de apodos y banco de preguntas ampliable.
