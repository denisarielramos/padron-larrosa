import { NextRequest, NextResponse } from "next/server"
import { supabaseServer } from "@/lib/supabase-server"

// Simple in-memory rate limiter: max 10 requests per IP per minute
const rateLimit = new Map<string, { count: number; resetAt: number }>()

function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const entry = rateLimit.get(ip)
  if (!entry || now > entry.resetAt) {
    rateLimit.set(ip, { count: 1, resetAt: now + 60_000 })
    return true
  }
  if (entry.count >= 10) return false
  entry.count++
  return true
}

export async function POST(req: NextRequest) {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    req.headers.get("x-real-ip") ??
    "unknown"

  if (!checkRateLimit(ip)) {
    return NextResponse.json(
      { error: "Demasiadas solicitudes. Intente de nuevo en un minuto." },
      { status: 429 }
    )
  }

  const body = await req.json()
  const { termino } = body

  if (!termino || !termino.trim()) {
    return NextResponse.json(
      { error: "El término de búsqueda es requerido." },
      { status: 400 }
    )
  }

  const t = termino.trim()

  if (t.length > 100) {
    return NextResponse.json(
      { error: "El término de búsqueda es demasiado largo." },
      { status: 400 }
    )
  }

  const isNumeric = /^\d+$/.test(t)

  if (!isNumeric && t.length < 3) {
    return NextResponse.json(
      { error: "Ingrese al menos 3 caracteres para buscar por nombre o apellido." },
      { status: 400 }
    )
  }

  const { data: results, error: rpcError } = await supabaseServer.rpc("buscar_padron", {
    termino_input: t,
  })

  if (rpcError) {
    console.error("[api/consultar] Error RPC buscar_padron", {
      message: rpcError.message,
      details: rpcError.details,
      hint: rpcError.hint,
      code: rpcError.code,
      termino: t,
    })

    return NextResponse.json(
      { error: "Error al consultar el padrón electoral." },
      { status: 500 }
    )
  }

  const list = Array.isArray(results) ? results : results ? [results] : []

  if (list.length === 0) {
    return NextResponse.json(
      { error: "No se encontraron resultados en el padrón." },
      { status: 404 }
    )
  }

  return NextResponse.json({ data: list, termino: t })
}
