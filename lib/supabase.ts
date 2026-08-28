import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type PadronResult = {
  ci: string
  nombre: string
  apellido: string
  nombre_completo: string
  direccion: string
  seccional: string
  orden: string
  mesa: string
  local_votacion: string
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
