import { NextRequest, NextResponse } from "next/server"
import { supabaseServer } from "@/lib/supabase-server"

// El navegador solo manda termino + ci. El backend vuelve a buscar el
// registro real en `padron` (con service_role) y recien con esos datos
// verificados arma el insert en padron_consultas -- asi nadie puede
// fabricar nombre/local/mesa/orden desde el cliente.
export async function POST(req: NextRequest) {
  const body = await req.json()
  const { termino, ci } = body as { termino?: string; ci?: string | number }

  if (!termino || !String(termino).trim() || ci === undefined || ci === null) {
    return NextResponse.json({ error: "Datos incompletos." }, { status: 400 })
  }

  const ciStr = String(ci).trim()
  if (!/^\d{1,15}$/.test(ciStr)) {
    return NextResponse.json({ error: "CI invalida." }, { status: 400 })
  }
  const ciNum = Number(ciStr)

  const { data, error: fetchError } = await supabaseServer
    .from("padron")
    .select("ci, nombre, apellido, seccional, local_votacion, mesa, orden")
    .eq("ci", ciNum)
    .limit(1)

  if (fetchError || !data || data.length === 0) {
    return NextResponse.json({ error: "No se pudo verificar la consulta." }, { status: 404 })
  }

  const persona = data[0]

  const { error: insertError } = await supabaseServer.from("padron_consultas").insert({
    termino_buscado: String(termino).trim(),
    ci: String(persona.ci),
    nombre_completo: `${persona.nombre} ${persona.apellido}`,
    seccional: persona.seccional,
    local_votacion: persona.local_votacion,
    mesa: persona.mesa != null ? String(persona.mesa) : null,
    orden: persona.orden != null ? String(persona.orden) : null,
  })

  if (insertError) {
    return NextResponse.json({ error: "Error al registrar la consulta." }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
