"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import { useRouter } from "next/navigation"
import { supabase, type DashboardRow } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts"
import {
  LogOut,
  Download,
  Users,
  CalendarDays,
  BarChart2,
  RefreshCw,
  Search,
  ChevronLeft,
  ChevronRight,
  FileSpreadsheet,
  FileText,
} from "lucide-react"

const PAGE_SIZE = 20

// ─── Splash Screen ─────────────────────────────────────────────────────────────
function SplashScreen({ visible }: { visible: boolean }) {
  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-primary transition-opacity duration-500 ${
        visible ? "opacity-100" : "opacity-0 pointer-events-none"
      }`}
      aria-hidden={!visible}
    >
      <div className="flex flex-col items-center gap-6">
        <div className="w-12 h-12 border-4 border-white/30 border-t-white rounded-full animate-spin" />
        <p className="text-white text-base font-medium text-center max-w-xs text-balance">
          Cargando datos del sistema electoral...
        </p>
      </div>
    </div>
  )
}

// ─── Metric Card ───────────────────────────────────────────────────────────────
function MetricCard({
  icon,
  label,
  value,
  loading,
}: {
  icon: React.ReactNode
  label: string
  value: number
  loading: boolean
}) {
  return (
    <div className="rounded-2xl border bg-card px-5 py-5 flex items-center gap-4">
      <div className="flex items-center justify-center w-11 h-11 rounded-xl bg-primary/10 text-primary shrink-0">
        {icon}
      </div>
      <div className="flex flex-col gap-0.5">
        <span className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
          {label}
        </span>
        {loading ? (
          <Skeleton className="h-7 w-16" />
        ) : (
          <span className="text-2xl font-bold text-foreground">
            {value.toLocaleString("es")}
          </span>
        )}
      </div>
    </div>
  )
}

// ─── Main Dashboard ─────────────────────────────────────────────────────────────
export default function AdminDashboardPage() {
  const router = useRouter()

  const [allRows, setAllRows] = useState<DashboardRow[]>([])
  const [loading, setLoading] = useState(true)
  const [splash, setSplash] = useState(true)
  const [error, setError] = useState("")

  // Filters
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo] = useState("")
  const [seccional, setSeccional] = useState("all")
  const [searchCI, setSearchCI] = useState("")
  const [searchNombre, setSearchNombre] = useState("")

  // Pagination
  const [page, setPage] = useState(1)

  // Derived: unique seccionales from all loaded rows (unfiltered by seccional)
  const seccionales = Array.from(
    new Set(allRows.map((r) => r.seccional).filter(Boolean) as string[])
  ).sort()

  // Client-side search filter on top of server-filtered rows
  const filteredRows = allRows.filter((r) => {
    if (searchCI && !r.ci.includes(searchCI.trim())) return false
    if (searchNombre && !(r.nombre_completo ?? "").toLowerCase().includes(searchNombre.toLowerCase().trim())) return false
    return true
  })

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / PAGE_SIZE))
  const pageRows = filteredRows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  // Chart data
  const porSeccional = Object.entries(
    filteredRows.reduce<Record<string, number>>((acc, r) => {
      if (r.seccional) acc[r.seccional] = (acc[r.seccional] ?? 0) + 1
      return acc
    }, {})
  )
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 12)

  // Stats
  const today = new Date().toISOString().slice(0, 10)
  const totalConsultas = filteredRows.length
  const consultasHoy = filteredRows.filter(
    (r) => r.created_at.slice(0, 10) === today
  ).length
  const seccionalesActivas = new Set(
    filteredRows.map((r) => r.seccional).filter(Boolean)
  ).size

  // ── Fetch ─────────────────────────────────────────────────────────────────
  const fetchData = useCallback(async () => {
    setLoading(true)
    setError("")

    try {
      let query = supabase
        .from("padron_consultas")
        .select("termino_buscado, ci, nombre_completo, seccional, local_votacion, mesa, orden, created_at")
        .order("created_at", { ascending: false })

      if (dateFrom) query = query.gte("created_at", `${dateFrom}T00:00:00`)
      if (dateTo)   query = query.lte("created_at", `${dateTo}T23:59:59`)
      if (seccional !== "all") query = query.eq("seccional", seccional)

      const { data, error: fetchError } = await query

      if (fetchError) {
        setError(`Error al cargar los datos: ${fetchError.message}`)
        setLoading(false)
        setSplash(false)
        return
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const normalized: DashboardRow[] = (data ?? []).map((row: any) => ({
        termino_buscado: row.termino_buscado ?? "",
        ci: String(row.ci ?? ""),
        nombre_completo: row.nombre_completo ?? null,
        seccional: row.seccional ?? null,
        local_votacion: row.local_votacion ?? null,
        mesa: row.mesa != null ? String(row.mesa) : null,
        orden: row.orden != null ? String(row.orden) : null,
        created_at: row.created_at,
      }))

      setAllRows(normalized)
    } catch {
      setError("Error inesperado al cargar los datos.")
    }

    setLoading(false)
    setSplash(false)
  }, [dateFrom, dateTo, seccional])

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) {
        router.replace("/admin")
      } else {
        fetchData()
      }
    })
  }, [fetchData, router])

  // Reset page when search/filter changes
  useEffect(() => {
    setPage(1)
  }, [searchCI, searchNombre, seccional, dateFrom, dateTo])

  async function handleLogout() {
    await supabase.auth.signOut()
    router.replace("/admin")
  }

  // ── Export helpers ───────────────────────────────────────────────────────
  const EXPORT_HEADERS = [
    "Término buscado", "CI", "Nombre completo",
    "Seccional", "Local de votación", "Mesa", "Orden", "Fecha",
  ]

  function rowToArray(r: DashboardRow): string[] {
    return [
      r.termino_buscado ?? "",
      r.ci,
      r.nombre_completo ?? "",
      r.seccional ?? "",
      r.local_votacion ?? "",
      r.mesa ?? "",
      r.orden ?? "",
      new Date(r.created_at).toLocaleString("es", {
        day: "2-digit", month: "2-digit", year: "numeric",
        hour: "2-digit", minute: "2-digit",
      }),
    ]
  }

  function exportCSV() {
    const rows = [EXPORT_HEADERS, ...filteredRows.map(rowToArray)]
    const csv = rows
      .map((row) => row.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","))
      .join("\n")
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "consultas-electorales.csv"
    a.click()
    URL.revokeObjectURL(url)
  }

  async function exportExcel() {
    const XLSX = (await import("xlsx")).default
    const wsData = [EXPORT_HEADERS, ...filteredRows.map(rowToArray)]
    const ws = XLSX.utils.aoa_to_sheet(wsData)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "Consultas")
    XLSX.writeFile(wb, "consultas-electorales.xlsx")
  }

  async function exportPDF() {
    const { default: jsPDF } = await import("jspdf")
    const { default: autoTable } = await import("jspdf-autotable")
    const doc = new jsPDF({ orientation: "landscape" })

    const exportDate = new Date().toLocaleString("es", {
      day: "2-digit", month: "2-digit", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    })

    doc.setFontSize(14)
    doc.text("Consultas electorales", 14, 15)
    doc.setFontSize(10)
    doc.text("Internas ANR San Lorenzo 2026", 14, 22)
    doc.setFontSize(8)
    doc.text(`Exportado: ${exportDate}`, 14, 28)

    autoTable(doc, {
      head: [EXPORT_HEADERS],
      body: filteredRows.map(rowToArray),
      startY: 33,
      styles: { fontSize: 7, cellPadding: 2 },
      headStyles: { fillColor: [200, 30, 30] },
    })

    doc.save("consultas-electorales.pdf")
  }

  const chartColors = ["#c81e1e", "#e53e3e", "#feb2b2", "#fc8181", "#fed7d7"]

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <>
      <SplashScreen visible={splash} />

      <div className="min-h-screen bg-background">
        {/* Top bar */}
        <header className="border-b bg-card sticky top-0 z-10">
          <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
            <div className="flex flex-col gap-0">
              <h1 className="text-base font-bold text-foreground leading-tight">
                Sistema Electoral ANR
              </h1>
              <p className="text-xs text-muted-foreground">
                Internas San Lorenzo 2026
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="gap-2"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Salir</span>
            </Button>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 py-8 flex flex-col gap-8">
          {/* Metrics */}
          <section aria-label="Métricas" className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <MetricCard
              icon={<Users className="w-5 h-5" />}
              label="Total consultas"
              value={totalConsultas}
              loading={loading}
            />
            <MetricCard
              icon={<CalendarDays className="w-5 h-5" />}
              label="Consultas hoy"
              value={consultasHoy}
              loading={loading}
            />
            <MetricCard
              icon={<BarChart2 className="w-5 h-5" />}
              label="Seccionales activas"
              value={seccionalesActivas}
              loading={loading}
            />
          </section>

          {/* Chart */}
          <section aria-label="Consultas por seccional">
            <h2 className="text-base font-semibold text-foreground mb-4">
              Consultas por seccional
            </h2>
            <div className="rounded-2xl border bg-card p-4">
              {loading ? (
                <div className="flex items-end gap-2 h-[220px] px-4">
                  {Array.from({ length: 7 }).map((_, i) => (
                    <Skeleton
                      key={i}
                      className="flex-1 rounded-sm"
                      style={{ height: `${40 + Math.random() * 120}px` }}
                    />
                  ))}
                </div>
              ) : porSeccional.length === 0 ? (
                <div className="flex items-center justify-center h-[220px] text-sm text-muted-foreground">
                  Sin datos para mostrar.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart
                    data={porSeccional}
                    margin={{ top: 4, right: 4, left: -20, bottom: 4 }}
                  >
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 11 }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 11 }}
                      tickLine={false}
                      axisLine={false}
                      allowDecimals={false}
                    />
                    <Tooltip
                      contentStyle={{
                        borderRadius: "8px",
                        border: "1px solid var(--color-border)",
                        background: "var(--color-card)",
                        color: "var(--color-foreground)",
                        fontSize: "13px",
                      }}
                      cursor={{ fill: "var(--color-muted)", opacity: 0.5 }}
                    />
                    <Bar dataKey="count" name="Consultas" radius={[4, 4, 0, 0]}>
                      {porSeccional.map((_, idx) => (
                        <Cell
                          key={idx}
                          fill={chartColors[idx % chartColors.length]}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </section>

          {/* Filters + Table */}
          <section aria-label="Tabla de consultas">
            <div className="flex flex-col gap-4">
              {/* Filters row */}
              <div className="flex flex-col sm:flex-row gap-3 items-end flex-wrap">
                <div className="flex flex-col gap-1.5">
                  <Label
                    htmlFor="date-from"
                    className="text-xs text-muted-foreground font-medium"
                  >
                    Desde
                  </Label>
                  <Input
                    id="date-from"
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className="h-9 text-sm w-40"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label
                    htmlFor="date-to"
                    className="text-xs text-muted-foreground font-medium"
                  >
                    Hasta
                  </Label>
                  <Input
                    id="date-to"
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    className="h-9 text-sm w-40"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label
                    htmlFor="seccional-filter"
                    className="text-xs text-muted-foreground font-medium"
                  >
                    Seccional
                  </Label>
                  <Select value={seccional} onValueChange={setSeccional}>
                    <SelectTrigger
                      id="seccional-filter"
                      className="h-9 text-sm w-44"
                    >
                      <SelectValue placeholder="Todas" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas</SelectItem>
                      {seccionales.map((s) => (
                        <SelectItem key={s} value={s}>
                          {s}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  className="h-9 gap-2 self-end"
                  onClick={fetchData}
                  disabled={loading}
                >
                  <RefreshCw
                    className={`w-4 h-4 ${loading ? "animate-spin" : ""}`}
                  />
                  Actualizar
                </Button>
              </div>

              {/* Search + Export row */}
              <div className="flex flex-col sm:flex-row gap-3 items-end flex-wrap">
                <div className="relative flex-1 min-w-[160px] max-w-xs">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                  <Input
                    placeholder="Buscar por CI..."
                    value={searchCI}
                    onChange={(e) => setSearchCI(e.target.value.replace(/\D/g, ""))}
                    className="h-9 pl-9 text-sm"
                    aria-label="Buscar por CI"
                  />
                </div>
                <div className="relative flex-1 min-w-[160px] max-w-xs">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                  <Input
                    placeholder="Buscar por nombre..."
                    value={searchNombre}
                    onChange={(e) => setSearchNombre(e.target.value)}
                    className="h-9 pl-9 text-sm"
                    aria-label="Buscar por nombre"
                  />
                </div>
                <div className="flex gap-2 self-end ml-auto">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-9 gap-2"
                    onClick={exportCSV}
                    disabled={loading || filteredRows.length === 0}
                    title="Exportar CSV"
                  >
                    <Download className="w-4 h-4" />
                    <span className="hidden sm:inline">CSV</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-9 gap-2"
                    onClick={exportExcel}
                    disabled={loading || filteredRows.length === 0}
                    title="Exportar Excel"
                  >
                    <FileSpreadsheet className="w-4 h-4" />
                    <span className="hidden sm:inline">Excel</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-9 gap-2"
                    onClick={exportPDF}
                    disabled={loading || filteredRows.length === 0}
                    title="Exportar PDF"
                  >
                    <FileText className="w-4 h-4" />
                    <span className="hidden sm:inline">PDF</span>
                  </Button>
                </div>
              </div>

              {/* Error */}
              {error && (
                <div
                  className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
                  role="alert"
                >
                  {error}
                </div>
              )}

              {/* Table */}
              <div className="rounded-xl border bg-card overflow-hidden">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Término buscado</TableHead>
                        <TableHead>CI</TableHead>
                        <TableHead>Nombre completo</TableHead>
                        <TableHead>Seccional</TableHead>
                        <TableHead className="w-1/3">Local de votación</TableHead>
                        <TableHead>Mesa</TableHead>
                        <TableHead>Orden</TableHead>
                        <TableHead>Fecha</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {loading ? (
                        Array.from({ length: 8 }).map((_, i) => (
                          <TableRow key={i}>
                            {Array.from({ length: 8 }).map((_, j) => (
                              <TableCell key={j}>
                                <Skeleton className="h-4 w-20" />
                              </TableCell>
                            ))}
                          </TableRow>
                        ))
                      ) : pageRows.length === 0 ? (
                        <TableRow>
                          <TableCell
                            colSpan={8}
                            className="text-center py-12 text-muted-foreground"
                          >
                            No hay consultas registradas.
                          </TableCell>
                        </TableRow>
                      ) : (
                        pageRows.map((r, idx) => (
                          <TableRow key={`${r.ci}-${idx}`}>
                            <TableCell className="text-sm text-muted-foreground">
                              {r.termino_buscado ?? "—"}
                            </TableCell>
                            <TableCell className="font-mono text-sm">
                              {r.ci}
                            </TableCell>
                            <TableCell className="whitespace-nowrap">
                              {r.nombre_completo ?? "—"}
                            </TableCell>
                            <TableCell>
                              {r.seccional ? (
                                <Badge variant="secondary">{r.seccional}</Badge>
                              ) : (
                                "—"
                              )}
                            </TableCell>
                            <TableCell className="text-sm whitespace-normal">
                              {r.local_votacion ?? "—"}
                            </TableCell>
                            <TableCell>{r.mesa ?? "—"}</TableCell>
                            <TableCell>{r.orden ?? "—"}</TableCell>
                            <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                              {new Date(r.created_at).toLocaleString("es", {
                                day: "2-digit",
                                month: "2-digit",
                                year: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>

              {/* Pagination + count */}
              {!loading && filteredRows.length > 0 && (
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <p className="text-xs text-muted-foreground">
                    {filteredRows.length} registro{filteredRows.length !== 1 ? "s" : ""}
                    {totalPages > 1 && ` — Página ${page} de ${totalPages}`}
                  </p>
                  {totalPages > 1 && (
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={page === 1}
                        aria-label="Página anterior"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </Button>
                      <span className="text-sm font-medium text-foreground">
                        {page} / {totalPages}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                        disabled={page === totalPages}
                        aria-label="Página siguiente"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </section>
        </main>
      </div>
    </>
  )
}
