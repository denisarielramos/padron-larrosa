import Image from "next/image"
import { Search } from "lucide-react"
import { ConsultaForm } from "@/components/consulta-form"

export const metadata = {
  title: "Consulta tu lugar de votación - Elecciones Generales San Lorenzo 2026",
  description:
    "Buscá por cédula, nombre o apellido para conocer tu local de votación en las Elecciones Generales San Lorenzo 2026.",
}

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#F6F5F2] flex flex-col">
      <main className="flex-1 flex flex-col items-center px-4 py-8 md:py-12">
        <div className="w-full max-w-2xl flex flex-col items-center gap-5">

          {/* Header */}
          <div className="text-center flex flex-col gap-1.5 px-2">
            <h1 className="text-2xl md:text-4xl font-bold text-[#7A1F23] leading-tight tracking-tight text-balance">
              Consulta tu lugar de votación
            </h1>
            <p className="text-sm md:text-base text-foreground/70 text-balance">
              Elecciones Generales · San Lorenzo 2026
            </p>
            <p className="text-xs md:text-sm font-semibold text-[#D6A22F] tracking-wide">
              Lista 1 · Opción 4
            </p>
          </div>

          {/* Flyer */}
          <div className="w-[78%] sm:w-[65%] md:w-full md:max-w-[360px] overflow-hidden rounded-xl shadow-sm">
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
          <div className="w-full max-w-md rounded-2xl bg-white border border-black/[0.06] shadow-md">
            <div className="px-6 py-7 sm:px-8 sm:py-8 flex flex-col gap-6">
              <div className="flex flex-col items-center gap-2 text-center">
                <div className="w-10 h-10 rounded-full bg-[#7A1F23]/10 flex items-center justify-center">
                  <Search className="w-4 h-4 text-[#7A1F23]" />
                </div>
                <div className="flex flex-col gap-0.5">
                  <h2 className="text-lg font-bold text-foreground">Consultá tu lugar de votación</h2>
                  <p className="text-sm text-muted-foreground">Ingresá tu cédula, nombre o apellido</p>
                </div>
              </div>

              <ConsultaForm />
            </div>
          </div>

          {/* Footer */}
          <p className="text-center text-xs text-muted-foreground/70 pb-4">
            Consulta de padrón electoral · San Lorenzo 2026
          </p>
        </div>
      </main>
    </div>
  )
}
