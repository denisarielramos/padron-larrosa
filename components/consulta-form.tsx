"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import { MapPin, Vote, CreditCard, ListOrdered, ChevronRight, CheckCircle2, Search } from "lucide-react"
import type { PadronResult } from "@/lib/supabase"

type FormState =
  | { type: "idle" }
  | { type: "loading" }
  | { type: "error"; message: string }
  | { type: "results"; list: PadronResult[]; termino: string }
  | { type: "detail"; data: PadronResult; termino: string }

async function registrar(termino: string, ci: string) {
  await fetch("/api/registrar-consulta", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ termino, ci }),
  })
}

export function ConsultaForm() {
  const [termino, setTermino] = useState("")
  const [terminoError, setTerminoError] = useState("")
  const [state, setState] = useState<FormState>({ type: "idle" })
  const registeredRef = useRef<Set<string>>(new Set())

  function validate(): boolean {
    setTerminoError("")
    const t = termino.trim()
    if (!t) {
      setTerminoError("El término de búsqueda es requerido.")
      return false
    }
    if (t.length > 100) {
      setTerminoError("El término de búsqueda es demasiado largo.")
      return false
    }
    const isNumeric = /^\d+$/.test(t)
    if (!isNumeric && t.length < 3) {
      setTerminoError("Ingrese al menos 3 caracteres para buscar por nombre o apellido.")
      return false
    }
    return true
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return

    setState({ type: "loading" })

    try {
      const res = await fetch("/api/consultar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ termino: termino.trim() }),
      })

      const json = await res.json()

      if (!res.ok) {
        setState({ type: "error", message: json.error ?? "Error inesperado." })
        return
      }

      const list: PadronResult[] = json.data
      const t = json.termino as string

      if (list.length === 1) {
        if (!registeredRef.current.has(list[0].ci)) {
          registeredRef.current.add(list[0].ci)
          await registrar(t, list[0].ci)
        }
        setState({ type: "detail", data: list[0], termino: t })
      } else {
        setState({ type: "results", list, termino: t })
      }
    } catch {
      setState({ type: "error", message: "Error de conexión. Intente de nuevo." })
    }
  }

  function handleReset() {
    setTermino("")
    setTerminoError("")
    setState({ type: "idle" })
    registeredRef.current.clear()
  }

  async function handleSelect(persona: PadronResult, termino: string) {
    if (!registeredRef.current.has(persona.ci)) {
      registeredRef.current.add(persona.ci)
      await registrar(termino, persona.ci)
    }
    setState({ type: "detail", data: persona, termino })
  }

  // ── Detail view ─────────────────────────────────────────────────────────
  if (state.type === "detail") {
    const d = state.data
    const nombre = d.nombre_completo ?? `${d.nombre} ${d.apellido}`
    return (
      <div className="flex flex-col gap-5">
        {/* Success header */}
        <div className="flex flex-col items-center gap-2 py-1">
          <div className="w-9 h-9 rounded-full bg-[#7A1F23]/10 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5 text-[#7A1F23]" />
          </div>
          <div className="text-center">
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">
              Votante encontrado
            </p>
            <p className="text-xl font-bold text-foreground text-balance leading-tight">{nombre}</p>
          </div>
        </div>

        {/* Local de votacion — el dato mas importante */}
        <div className="rounded-2xl bg-gradient-to-br from-[#7A1F23] to-[#5C1519] px-5 py-5 text-white shadow-sm">
          <div className="flex items-center gap-1.5 text-[#E8C46B] text-[11px] font-bold uppercase tracking-wider mb-1.5">
            <MapPin className="w-3.5 h-3.5" />
            Local de votación
          </div>
          <p className="text-lg font-bold leading-snug text-balance">{d.local_votacion ?? "—"}</p>
        </div>

        {/* Detalles secundarios */}
        <div className="grid grid-cols-3 gap-2.5">
          <ResultCard icon={<CreditCard className="w-4 h-4" />} label="CI" value={d.ci} />
          <ResultCard icon={<Vote className="w-4 h-4" />} label="Mesa" value={d.mesa} />
          <ResultCard icon={<ListOrdered className="w-4 h-4" />} label="Orden" value={d.orden} />
        </div>

        <Button
          variant="outline"
          size="lg"
          className="w-full h-12 text-sm font-semibold border-2 hover:border-[#7A1F23] hover:text-[#7A1F23] transition-colors mt-1"
          onClick={handleReset}
        >
          Realizar otra consulta
        </Button>
      </div>
    )
  }

  // ── Multiple results view ────────────────────────────────────────────────
  if (state.type === "results") {
    const { list, termino: t } = state
    return (
      <div className="flex flex-col gap-4">
        <div className="text-center flex flex-col gap-1">
          <p className="text-sm font-bold text-foreground">
            Se encontraron{" "}
            <span className="text-[#7A1F23]">{list.length}</span> resultados
          </p>
          <p className="text-xs text-muted-foreground">
            Seleccioná tu nombre para ver tus datos de votación
          </p>
        </div>

        <div className="flex flex-col gap-2">
          {list.map((p) => {
            const nombre = p.nombre_completo ?? `${p.nombre} ${p.apellido}`
            return (
              <button
                key={p.ci}
                onClick={() => handleSelect(p, t)}
                className="w-full text-left flex items-center justify-between gap-3 rounded-xl border border-border bg-white px-4 py-3.5 hover:border-[#D6A22F] hover:bg-[#7A1F23]/[0.04] transition-all group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7A1F23]/30"
              >
                <div className="flex flex-col gap-0.5 min-w-0">
                  <span className="text-sm font-bold text-foreground truncate">{nombre}</span>
                  <span className="text-xs text-muted-foreground font-mono">CI: {p.ci}</span>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0 group-hover:text-[#7A1F23] transition-colors" />
              </button>
            )
          })}
        </div>

        <Button
          variant="outline"
          size="lg"
          className="w-full h-11 text-sm font-semibold border-2 hover:border-[#7A1F23] hover:text-[#7A1F23] transition-colors"
          onClick={handleReset}
        >
          Nueva búsqueda
        </Button>
      </div>
    )
  }

  // ── Search form ──────────────────────────────────────────────────────────
  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <label htmlFor="termino" className="sr-only">
          CI, nombre o apellido
        </label>
        <div className="relative">
          <Search
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            id="termino"
            type="search"
            inputMode="text"
            placeholder="Ej.: 1234567 o Juan López"
            value={termino}
            onChange={(e) => {
              setTermino(e.target.value)
              setTerminoError("")
            }}
            className="h-14 text-base pl-11 pr-4 rounded-xl border border-border bg-white focus-visible:border-[#7A1F23] focus-visible:ring-[#D6A22F]/25 focus-visible:ring-[3px] placeholder:text-muted-foreground/60"
            aria-describedby={terminoError ? "termino-error" : undefined}
            aria-invalid={!!terminoError}
            disabled={state.type === "loading"}
            autoComplete="off"
          />
        </div>
        {terminoError && (
          <p id="termino-error" className="text-xs text-destructive font-medium flex items-center gap-1" role="alert">
            <span aria-hidden="true">&#9679;</span> {terminoError}
          </p>
        )}
      </div>

      {state.type === "error" && (
        <div
          className="rounded-xl border border-destructive/30 bg-destructive/8 px-4 py-3 text-sm text-destructive font-medium"
          role="alert"
        >
          {state.message}
        </div>
      )}

      <Button
        type="submit"
        size="lg"
        className="w-full h-14 text-base font-bold rounded-xl bg-[#7A1F23] text-white hover:bg-[#601A1D] shadow-sm hover:shadow-md focus-visible:ring-[#D6A22F]/40 focus-visible:ring-[3px] transition-all"
        disabled={state.type === "loading"}
      >
        {state.type === "loading" ? (
          <span className="flex items-center gap-2">
            <Spinner className="w-4 h-4" />
            Consultando...
          </span>
        ) : (
          "Consultar padrón"
        )}
      </Button>

      <p className="text-center text-xs text-muted-foreground/70 leading-relaxed">
        Ingresá tu número de cédula o tu nombre completo para encontrar tu lugar de votación.
      </p>
    </form>
  )
}

function ResultCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode
  label: string
  value: string | null | undefined
}) {
  return (
    <div className="flex flex-col items-center gap-1 rounded-xl border border-border bg-[#FAFAF9] px-3 py-3 text-center">
      <span className="text-muted-foreground">{icon}</span>
      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">
        {label}
      </span>
      <span className="text-sm font-bold text-foreground break-words leading-snug">
        {value ?? "—"}
      </span>
    </div>
  )
}
