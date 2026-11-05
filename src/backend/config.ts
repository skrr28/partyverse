/**
 * Configuración pública de Supabase. Expo inserta en el bundle las variables
 * EXPO_PUBLIC_* al compilar (ver .env.example). Si faltan o siguen siendo los
 * valores de ejemplo, la app lo indica en pantalla en vez de fallar.
 */
const url = process.env.EXPO_PUBLIC_SUPABASE_URL?.trim() ?? '';
const key = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim() ?? '';

const looksLikePlaceholder = (v: string) => v === '' || v.includes('TU-PROYECTO') || v.includes('xxxxxxxx');

export const supabaseConfig = {
  url,
  key,
  isConfigured: !looksLikePlaceholder(url) && !looksLikePlaceholder(key) && /^https?:\/\//.test(url),
};
