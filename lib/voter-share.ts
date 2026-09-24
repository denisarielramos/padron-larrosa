import type { PadronResult } from "@/lib/supabase"

function nombreDe(d: PadronResult): string {
  return d.nombre_completo ?? `${d.nombre} ${d.apellido}`
}

// ── Imagen para compartir ───────────────────────────────────────────────────

const BORDO = "#7A1F23"
const BORDO_OSCURO = "#5C1519"
const DORADO = "#E8C46B"
const FLYER_SRC = "/flyer-larrosa.png"

const W = 1080
const PAD = 64

function cargarImagen(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error("No se pudo cargar el flyer."))
    img.src = src
  })
}

function partirLineas(ctx: CanvasRenderingContext2D, texto: string, maxWidth: number): string[] {
  const lineas: string[] = []
  let actual = ""
  for (const palabra of texto.split(/\s+/).filter(Boolean)) {
    const prueba = actual ? `${actual} ${palabra}` : palabra
    if (ctx.measureText(prueba).width <= maxWidth || !actual) {
      actual = prueba
    } else {
      lineas.push(actual)
      actual = palabra
    }
  }
  if (actual) lineas.push(actual)
  return lineas.length ? lineas : ["—"]
}

function rectRedondeado(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}

/**
 * Dibuja la tarjeta del votante (flyer + datos) en un canvas fuera del DOM y
 * devuelve un PNG. No depende del viewport ni incluye controles de la UI.
 */
export async function generarImagenVotante(d: PadronResult): Promise<File> {
  if (typeof document !== "undefined" && document.fonts?.ready) {
    await document.fonts.ready
  }
  const flyer = await cargarImagen(FLYER_SRC)

  const bodyFont = getComputedStyle(document.body).fontFamily || ""
  const font = `${bodyFont ? bodyFont + ", " : ""}system-ui, -apple-system, "Segoe UI", Roboto, sans-serif`

  const canvas = document.createElement("canvas")
  const ctx = canvas.getContext("2d")
  if (!ctx) throw new Error("El navegador no permite generar imágenes.")

  const innerW = W - PAD * 2
  const flyerH = Math.round((W * flyer.naturalHeight) / flyer.naturalWidth)

  // Medición previa para calcular la altura total
  ctx.font = `700 54px ${font}`
  const nombreLineas = partirLineas(ctx, nombreDe(d), innerW)
  ctx.font = `700 44px ${font}`
  const localLineas = partirLineas(ctx, d.local_votacion ?? "—", innerW - 88)

  const nombreH = 34 + 16 + nombreLineas.length * 64
  const localH = 44 + 34 + 16 + localLineas.length * 56 + 44
  const celdaH = 150
  const pieH = 64
  const H = flyerH + PAD + nombreH + 36 + localH + 28 + celdaH + 40 + pieH

  canvas.width = W
  canvas.height = H
  ctx.textBaseline = "top"

  // Fondo
  ctx.fillStyle = "#FFFFFF"
  ctx.fillRect(0, 0, W, H)

  // Flyer
  ctx.drawImage(flyer, 0, 0, W, flyerH)
  ctx.fillStyle = DORADO
  ctx.fillRect(0, flyerH, W, 10)

  let y = flyerH + PAD

  // Nombre
  ctx.fillStyle = "#6B6B6B"
  ctx.font = `700 26px ${font}`
  ctx.fillText("VOTANTE", PAD, y)
  y += 34 + 16
  ctx.fillStyle = "#1A1A1A"
  ctx.font = `700 54px ${font}`
  for (const l of nombreLineas) {
    ctx.fillText(l, PAD, y)
    y += 64
  }
  y += 36

  // Local de votación destacado
  const grad = ctx.createLinearGradient(PAD, y, PAD + innerW, y + localH)
  grad.addColorStop(0, BORDO)
  grad.addColorStop(1, BORDO_OSCURO)
  ctx.fillStyle = grad
  rectRedondeado(ctx, PAD, y, innerW, localH, 28)
  ctx.fill()

  let ly = y + 44
  ctx.fillStyle = DORADO
  ctx.font = `700 26px ${font}`
  ctx.fillText("LOCAL DE VOTACIÓN", PAD + 44, ly)
  ly += 34 + 16
  ctx.fillStyle = "#FFFFFF"
  ctx.font = `700 44px ${font}`
  for (const l of localLineas) {
    ctx.fillText(l, PAD + 44, ly)
    ly += 56
  }
  y += localH + 28

  // CI · Mesa · Orden
  const gap = 20
  const celdaW = (innerW - gap * 2) / 3
  const celdas: [string, string][] = [
    ["CI", d.ci],
    ["MESA", d.mesa ?? "—"],
    ["ORDEN", d.orden ?? "—"],
  ]
  ctx.textAlign = "center"
  celdas.forEach(([label, valor], i) => {
    const x = PAD + i * (celdaW + gap)
    ctx.fillStyle = "#FAFAF9"
    rectRedondeado(ctx, x, y, celdaW, celdaH, 22)
    ctx.fill()
    ctx.strokeStyle = "#E5E5E5"
    ctx.lineWidth = 2
    ctx.stroke()

    ctx.fillStyle = "#6B6B6B"
    ctx.font = `700 24px ${font}`
    ctx.fillText(label, x + celdaW / 2, y + 30)

    ctx.fillStyle = BORDO
    let size = 46
    ctx.font = `700 ${size}px ${font}`
    while (ctx.measureText(valor).width > celdaW - 24 && size > 24) {
      size -= 2
      ctx.font = `700 ${size}px ${font}`
    }
    ctx.fillText(valor, x + celdaW / 2, y + 74)
  })
  y += celdaH + 40

  // Pie
  ctx.fillStyle = "#8A8A8A"
  ctx.font = `500 24px ${font}`
  ctx.fillText("Elecciones Generales 2026", W / 2, y + 8)
  ctx.textAlign = "left"

  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"))
  if (!blob) throw new Error("No se pudo generar la imagen.")

  const ci = String(d.ci).replace(/[^\w-]/g, "")
  return new File([blob], `datos-votacion-${ci}.png`, { type: "image/png" })
}

export function descargarArchivo(file: File) {
  const url = URL.createObjectURL(file)
  const a = document.createElement("a")
  a.href = url
  a.download = file.name
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
