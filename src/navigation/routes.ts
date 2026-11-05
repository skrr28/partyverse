/** Rutas de la app (Expo Router, carpeta src/app). */
export const routes = {
  welcome: '/',
  profile: '/profile',
  home: '/home',
  room: (id: string) => ({ pathname: '/room/[id]', params: { id } }) as const,
} as const;
