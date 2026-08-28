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
      <main className="flex-1 flex flex-col items-center px-4 py-6 md:py-10">
        <div className="w-full max-w-xl flex flex-col gap-6">

          {/* Header */}
          <div className="text-center flex flex-col gap-1.5 px-2">
            <h1 className="text-2xl md:text-4xl font-bold text-[#7A1F23] leading-tight tracking-tight text-balance">
              Consultá tu lugar de votación
            </h1>
            <p className="text-sm md:text-base text-foreground/70 text-balance">
              Elecciones Generales 2026
            </p>
          </div>

          {/* Flyer */}
          <div className="w-full overflow-hidden rounded-2xl shadow-md bg-white">
            <Image
              src="/flyer-larrosa.png"
              alt="Ariel Ojeda Intendente y Rodrigo Larrosa Concejal - Lista 1 Opción 4"
              width={1120}
              height={1600}
              className="h-auto w-full"
              priority
            />
          </div>

          {/* Search card */}
          <div className="w-full rounded-2xl bg-white border border-black/[0.06] shadow-md px-6 py-6 sm:px-7 sm:py-7 flex flex-col gap-5">
            <div className="flex flex-col gap-1">
              <h2 className="text-lg font-bold text-foreground">Buscá tu lugar de votación</h2>
              <p className="text-sm text-muted-foreground">Ingresá tu cédula, nombre o apellido</p>
            </div>

            <ConsultaForm />
          </div>

          {/* Footer */}
          <p className="text-center text-xs text-muted-foreground/70 pb-4">
            Consulta de padrón electoral · 2026
          </p>
        </div>
      </main>
    </div>
  )
}
