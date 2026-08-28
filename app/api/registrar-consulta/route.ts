import { NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
import type { PadronResult } from "@/lib/supabase"

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { termino, persona }: { termino: string; persona: PadronResult } = body

  if (!termino || !persona?.ci) {
    return NextResponse.json({ error: "Datos incompletos." }, { status: 400 })
  }

  const { error } = await supabase.from("padron_consultas").insert({
    termino_buscado: termino,
    ci: String(persona.ci),
    nombre_completo: persona.nombre_completo ?? `${persona.nombre} ${persona.apellido}`,
    seccional: persona.seccional ?? null,
    local_votacion: persona.local_votacion ?? null,
    mesa: persona.mesa ? String(persona.mesa) : null,
    orden: persona.orden ? String(persona.orden) : null,
  })

  if (error) {
    return NextResponse.json(
      { error: "Error al registrar la consulta." },
      { status: 500 }
    )
  }

  return NextResponse.json({ ok: true })
}
