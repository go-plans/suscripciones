import { createClient, type SupabaseClient } from '@supabase/supabase-js'

export const SUPABASE_URL: string = import.meta.env.VITE_SUPABASE_URL ?? ''

/**
 * FASE 2.2 — Despliegue seguro (GitHub Pages).
 * Se usa SOLO la anon key (publishable): toda la protección la da
 * Supabase Auth + RLS en la BD (es_admin() por auth.uid()).
 * La service_role NUNCA debe incrustarse en el bundle del navegador.
 */
export const SUPABASE_KEY: string = import.meta.env.VITE_SUPABASE_ANON_KEY ?? ''

export const supabase: SupabaseClient = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    // Con HashRouter la URL lleva la ruta en el hash (#/pagos); no queremos
    // que Supabase la interprete como fragmento de autenticación.
    detectSessionInUrl: false,
  },
})