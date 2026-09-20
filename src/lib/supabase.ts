import { createClient, type SupabaseClient } from '@supabase/supabase-js'

export const SUPABASE_URL: string = import.meta.env.VITE_SUPABASE_URL ?? ''

/**
 * FASE 2 — Herramienta administrativa.
 * Se opera con SERVICE_ROLE para poder administrar todas las tablas.
 * ⚠️ NUNCA usar esta clave en un entorno público o en el bundle de un
 * producto final. Plan: sustituir por Supabase Auth + RLS (docs/05-seguridad.md).
 */
export const SUPABASE_KEY: string =
  import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY ??
  import.meta.env.VITE_SUPABASE_ANON_KEY ??
  ''

export const supabase: SupabaseClient = createClient(SUPABASE_URL, SUPABASE_KEY)