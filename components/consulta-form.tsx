"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import { MapPin, Vote, CreditCard, ListOrdered, ChevronRight, CheckCircle2 } from "lucide-react"
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
        <div className="flex flex-col items-center gap-2 py-2">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
            <CheckCircle2 className="w-7 h-7 text-primary" />
          </div>
          <div className="text-center">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-1">
              Votante encontrado
            </p>
            <p className="text-xl font-extrabold text-foreground text-balance leading-tight">{nombre}</p>
          </div>
        </div>

        {/* Divider */}
        <div className="h-px bg-border" aria-hidden="true" />

        {/* Result cards */}
        <div className="flex flex-col gap-2.5">
          <ResultCard icon={<CreditCard className="w-4 h-4" />} label="Cédula de identidad" value={d.ci} />
          <ResultCard icon={<MapPin className="w-4 h-4" />} label="Local de votación" value={d.local_votacion} highlight />
          <div className="grid grid-cols-2 gap-2.5">
            <ResultCard icon={<Vote className="w-4 h-4" />} label="Mesa" value={d.mesa} />
            <ResultCard icon={<ListOrdered className="w-4 h-4" />} label="Orden" value={d.orden} />
          </div>
        </div>

        <Button
          variant="outline"
          size="lg"
          className="w-full h-12 text-sm font-semibold border-2 hover:border-primary hover:text-primary transition-colors mt-1"
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
            <span className="text-primary">{list.length}</span> resultados
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
                className="w-full text-left flex items-center justify-between gap-3 rounded-xl border-2 border-border bg-white px-4 py-3.5 hover:border-primary hover:bg-primary/5 transition-all group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                <div className="flex flex-col gap-0.5 min-w-0">
                  <span className="text-sm font-bold text-foreground truncate">{nombre}</span>
                  <span className="text-xs text-muted-foreground font-mono">CI: {p.ci}</span>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0 group-hover:text-primary transition-colors" />
              </button>
            )
          })}
        </div>

        <Button
          variant="outline"
          size="lg"
          className="w-full h-11 text-sm font-semibold border-2 hover:border-primary hover:text-primary transition-colors"
          onClick={handleReset}
        >
          Nueva búsqueda
        </Button>
      </div>
    )
  }

  // ── Search form ──────────────────────────────────────────────────────────
  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <label
          htmlFor="termino"
          className="text-sm font-semibold text-foreground/80 tracking-wide"
        >
          CI, nombre o apellido
        </label>
        <Input
          id="termino"
          type="search"
          inputMode="text"
          placeholder="Ej: 1234567 o López Juan"
          value={termino}
          onChange={(e) => {
            setTermino(e.target.value)
            setTerminoError("")
          }}
          className="h-13 text-base px-4 rounded-xl border-2 border-border focus:border-primary transition-colors placeholder:text-muted-foreground/60"
          aria-describedby={terminoError ? "termino-error" : undefined}
          aria-invalid={!!terminoError}
          disabled={state.type === "loading"}
          autoComplete="off"
        />
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
        className="w-full h-13 text-base font-bold rounded-xl shadow-sm hover:shadow-md transition-all"
        disabled={state.type === "loading"}
      >
        {state.type === "loading" ? (
          <span className="flex items-center gap-2">
            <Spinner className="w-4 h-4" />
            Consultando...
          </span>
        ) : (
          "Consultar"
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
  highlight = false,
}: {
  icon: React.ReactNode
  label: string
  value: string | null | undefined
  highlight?: boolean
}) {
  return (
    <div
      className={`flex items-start gap-3 rounded-xl px-4 py-3.5 border-2 transition-colors ${
        highlight
          ? "border-primary/30 bg-primary/5"
          : "border-border bg-[#fafafa]"
      }`}
    >
      <span className={`mt-0.5 shrink-0 ${highlight ? "text-primary" : "text-muted-foreground"}`}>
        {icon}
      </span>
      <div className="flex flex-col gap-0.5 min-w-0">
        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
          {label}
        </span>
        <span className={`text-sm font-bold break-words leading-snug ${highlight ? "text-primary" : "text-foreground"}`}>
          {value ?? "—"}
        </span>
      </div>
    </div>
  )
}
