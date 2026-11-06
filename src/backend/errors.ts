/** Traducción de errores del servidor (PV_*) y de red a mensajes para el jugador. */

const MESSAGES: Record<string, string> = {
  PV_NOT_CONFIGURED: 'La app aún no está conectada a Supabase. Revisa el archivo .env.local.',
  PV_NOT_AUTHENTICATED: 'Tu sesión ha caducado. Vuelve a entrar como invitado.',
  PV_PROFILE_REQUIRED: 'Primero elige tu apodo y avatar.',
  PV_INVALID_NICKNAME: 'El apodo debe tener entre 2 y 16 caracteres.',
  PV_INVALID_AVATAR: 'Ese avatar no está disponible.',
  PV_ROOM_NOT_FOUND: 'No existe ninguna sala con ese código.',
  PV_INVALID_PASSWORD: 'La contraseña de la sala debe tener entre 4 y 32 caracteres.',
  PV_WRONG_PASSWORD: 'Contraseña incorrecta para esa sala.',
  PV_TOO_MANY_ATTEMPTS: 'Demasiados intentos fallidos. Espera unos minutos y vuelve a probar.',
  PV_ROOM_FULL: 'La sala está llena (máximo 12 jugadores).',
  PV_GAME_IN_PROGRESS: 'La partida ya ha empezado. Espera a la siguiente.',
  PV_NOT_IN_ROOM: 'Ya no formas parte de esta sala.',
  PV_NOT_HOST: 'Solo el anfitrión puede hacer eso.',
  PV_INVALID_STATE: 'La sala no está en el estado adecuado para eso.',
  PV_NOT_ENOUGH_PLAYERS: 'Hacen falta al menos 3 jugadores para empezar.',
  PV_NO_QUESTIONS: 'No quedan preguntas disponibles.',
  PV_ROUND_NOT_FOUND: 'No se encontró la ronda.',
  PV_ROUND_NOT_CURRENT: 'Esa ronda ya no está activa.',
  PV_ROUND_CLOSED: 'La votación de esta ronda ya se cerró.',
  PV_SELF_VOTE: 'No puedes votarte a ti mismo.',
  PV_INVALID_TARGET: 'Ese jugador ya no está en la sala.',
  PV_ALREADY_VOTED: 'Ya has votado en esta ronda.',
  NETWORK: 'Sin conexión con el servidor. Comprueba tu internet.',
};

export class PartyError extends Error {
  constructor(
    public readonly code: string,
    message?: string,
  ) {
    super(message ?? MESSAGES[code] ?? 'Algo salió mal. Inténtalo de nuevo.');
    this.name = 'PartyError';
  }
}

export function toPartyError(raw: unknown): PartyError {
  if (raw instanceof PartyError) return raw;
  const msg =
    typeof raw === 'object' && raw && 'message' in raw ? String((raw as { message: unknown }).message) : String(raw);
  const code = msg.match(/PV_[A-Z_]+/)?.[0];
  if (code) return new PartyError(code);
  if (/network|fetch|timed? ?out|socket|offline/i.test(msg)) return new PartyError('NETWORK');
  return new PartyError('UNKNOWN', 'Algo salió mal. Inténtalo de nuevo.');
}
