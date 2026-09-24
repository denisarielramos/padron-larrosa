import Image from "next/image"
import { ConsultaForm } from "@/components/consulta-form"

export const metadata = {
  title: "Consultá tu lugar de votación - Elecciones Generales 2026",
  description:
    "Buscá por cédula, nombre o apellido para conocer tu local de votación en las Elecciones Generales 2026.",
}

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#F6F5F2] flex flex-col">
      <main className="flex-1 flex flex-col items-center px-3 pt-3 pb-2 sm:px-4 sm:py-6 md:py-8">
        <div className="w-full max-w-xl flex flex-col gap-2.5 sm:gap-4">
          {/* Header */}
          <div className="text-center flex flex-col px-2">
            <h1 className="text-lg sm:text-2xl md:text-3xl font-bold text-[#7A1F23] leading-tight tracking-tight text-balance">
              Consultá tu lugar de votación
            </h1>
            <p className="text-xs sm:text-sm md:text-base text-foreground/65 text-balance">
              Elecciones Generales 2026
            </p>
          </div>

          {/* Flyer de campaña */}
          <div className="w-full overflow-hidden rounded-2xl bg-white shadow-sm border border-black/[0.06]">
            <Image
              src="/flyer-larrosa.png"
              alt="Flyer de campaña: Lista 1 Opción 4, Ariel Ojeda Intendente y Rodrigo Larrosa Concejal"
              width={1120}
              height={1600}
              sizes="(max-width: 640px) 100vw, 576px"
              className="mx-auto w-full h-auto max-h-[58svh] sm:max-h-[70vh] object-contain"
              priority
            />
          </div>

          {/* Search card */}
          <div className="w-full rounded-2xl bg-white border border-black/[0.06] shadow-sm px-4 py-3.5 sm:px-7 sm:py-6 flex flex-col gap-3 sm:gap-4">
            <div className="flex flex-col gap-0.5">
              <h2 className="text-base sm:text-lg font-bold text-foreground">Buscá tu lugar de votación</h2>
              <p className="text-xs sm:text-sm text-muted-foreground">Ingresá tu cédula, nombre o apellido</p>
            </div>

            <ConsultaForm />
          </div>

          {/* Footer */}
          <p className="text-center text-[11px] sm:text-xs text-muted-foreground/70 pb-1">
            Consulta de padrón electoral · 2026
          </p>
        </div>
      </main>
    </div>
  )
}
