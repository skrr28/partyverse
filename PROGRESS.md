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

### Pendiente / siguientes entregas

- [ ] Prueba manual en dispositivos reales (Android + iPhone) con Supabase conectado.
- [ ] Presencia (detectar desconexiones sin «Salir») con Realtime Presence.
- [ ] Limpieza programada de salas antiguas (pg_cron).
- [ ] Sonidos/hápticos y animación de revelación.
- [ ] Batalla relámpago.
- [ ] ¿Cuánto me conoces?
- [ ] Moderación de apodos y banco de preguntas ampliable.
