/** Tema neón de PARTYVERSE. */
export const colors = {
  bg: '#070B1F',
  bgDeep: '#04061A',
  surface: '#111841',
  surfaceHigh: '#1A2357',
  border: '#2A3577',
  violet: '#8B5CF6',
  violetSoft: '#A78BFA',
  cyan: '#22D3EE',
  pink: '#F472B6',
  text: '#F4F6FF',
  muted: '#8E97CC',
  danger: '#FB7185',
  success: '#34D399',
  warning: '#FBBF24',
} as const;

export const radius = { sm: 10, md: 16, lg: 24, pill: 999 } as const;
export const space = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 } as const;

export const glow = (color: string, blur = 18) => `0 0 ${blur}px ${color}`;

export const type = {
  hero: { fontSize: 40, fontWeight: '900' as const, letterSpacing: 4 },
  title: { fontSize: 26, fontWeight: '800' as const, letterSpacing: 0.5 },
  subtitle: { fontSize: 18, fontWeight: '700' as const },
  body: { fontSize: 16, fontWeight: '500' as const },
  small: { fontSize: 13, fontWeight: '600' as const },
};
