import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Devuelto por la funcion RPC buscar_padron() — ver
// supabase/migrations/20260828010000_padron_larrosa_consulta.sql
export type PadronResult = {
  ci: string
  nombre: string
  apellido: string
  nombre_completo?: string | null
  seccional: string | null
  orden: string | null
  mesa: string | null
  local_votacion: string | null
}

export type PadronConsulta = {
  termino_buscado: string
  ci: string
  nombre_completo: string | null
  seccional: string | null
  local_votacion: string | null
  mesa: string | null
  orden: string | null
  created_at: string
}

// Type for admin dashboard rows — read from padron_consultas / consultas_dashboard
export type DashboardRow = {
  termino_buscado?: string
  ci: string
  nombre_completo: string | null
  seccional: string | null
  local_votacion: string | null
  mesa: string | null
  orden: string | null
  created_at: string
}
