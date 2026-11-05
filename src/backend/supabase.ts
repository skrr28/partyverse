import './storage';
import { AppState } from 'react-native';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { supabaseConfig } from './config';

let client: SupabaseClient | null = null;

/** Devuelve el cliente de Supabase. Lanza si el proyecto no está configurado. */
export function getSupabase(): SupabaseClient {
  if (!supabaseConfig.isConfigured) {
    throw new Error('PV_NOT_CONFIGURED');
  }
  if (!client) {
    client = createClient(supabaseConfig.url, supabaseConfig.key, {
      auth: {
        storage: localStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
      },
      realtime: {
        params: { eventsPerSecond: 10 },
      },
    });

    // Recomendación de Supabase para móvil: refrescar el token solo en primer plano.
    AppState.addEventListener('change', (state) => {
      if (state === 'active') client?.auth.startAutoRefresh();
      else client?.auth.stopAutoRefresh();
    });
  }
  return client;
}
