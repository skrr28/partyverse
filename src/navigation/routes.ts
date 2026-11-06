/** Rutas de la app (Expo Router, carpeta src/app). */
export const routes = {
  /** Portada: punto de partida de todo. */
  hub: '/',
  /** Compatibilidad: antes la bienvenida estaba en «/». */
  welcome: '/online',
  online: '/online',
  /** Antes era la pantalla de crear/unirse; ahora es la sección en línea. */
  home: '/online',
  profile: '/profile',
  settings: '/settings',
  play: '/play',
  players: '/play/players',
  games: (params: { ambiente?: string; category?: string } = {}) => ({ pathname: '/play/games', params }) as const,
  game: (id: string) => ({ pathname: '/game/[id]', params: { id } }) as const,
  room: (id: string) => ({ pathname: '/room/[id]', params: { id } }) as const,
} as const;
