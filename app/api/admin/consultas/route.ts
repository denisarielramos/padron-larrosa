import { NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const dateFrom = searchParams.get("date_from")
  const dateTo = searchParams.get("date_to")
  const seccional = searchParams.get("seccional")

  let query = supabase
    .from("qr_consultas")
    .select("*")
    .order("created_at", { ascending: false })

  if (dateFrom) {
    query = query.gte("created_at", `${dateFrom}T00:00:00`)
  }
  if (dateTo) {
    query = query.lte("created_at", `${dateTo}T23:59:59`)
  }
  if (seccional && seccional !== "all") {
    query = query.eq("seccional", seccional)
  }

  const { data, error } = await query

  if (error) {
    return NextResponse.json(
      { error: "Error al obtener las consultas." },
      { status: 500 }
    )
  }

  return NextResponse.json({ data })
}
