import Image from "next/image"
import { ConsultaForm } from "@/components/consulta-form"

export const metadata = {
  title: "Consulta tu lugar de votación - Elecciones Generales San Lorenzo 2026",
  description:
    "Buscá por cédula, nombre o apellido para conocer tu local de votación en las Elecciones Generales San Lorenzo 2026.",
}

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#f0f0f0] flex flex-col">
      {/* Red accent strip */}
      <div className="w-full bg-primary h-1.5" aria-hidden="true" />

      {/* Main content */}
      <main className="flex-1 flex flex-col items-center px-4 py-6 md:py-10">
        <div className="w-full max-w-lg flex flex-col gap-4">

          {/* Title block */}
          <div className="text-center flex flex-col gap-1 px-2">
            <h1 className="text-2xl md:text-3xl font-extrabold text-primary leading-tight text-balance tracking-tight">
              Consulta tu lugar de votación
            </h1>
            <p className="text-sm md:text-base font-semibold text-foreground/60 text-balance uppercase tracking-widest">
              Elecciones Generales - San Lorenzo 2026
            </p>
          </div>

          {/* Campaign flyer */}
          <div className="w-full overflow-hidden rounded-2xl border border-border/60 shadow-lg">
            <Image
              src="/flyer-chechito-generales.jpeg"
              alt="Flyer de José Chechito López, Lista 1, opción 3 para concejal"
              width={1600}
              height={667}
              className="h-auto w-full"
              priority
            />
          </div>

          {/* Search panel card */}
          <div className="rounded-2xl bg-white border border-border/60 shadow-lg overflow-hidden">
            {/* Panel header */}
            <div className="bg-primary px-6 py-4 flex items-center gap-3">
              <div className="bg-white/20 rounded-full p-2 shrink-0">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-5 h-5 text-white"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <circle cx="11" cy="11" r="8" />
                  <path d="m21 21-4.35-4.35" />
                </svg>
              </div>
              <div className="flex flex-col gap-0">
                <span className="text-white font-bold text-base leading-tight tracking-wide">
                  Padrón Electoral San Lorenzo 2026
                </span>
              </div>
            </div>

            {/* Divider accent */}
            <div className="h-px bg-gradient-to-r from-primary/30 via-primary/10 to-transparent" aria-hidden="true" />

            {/* Form body */}
            <div className="px-6 py-7">
              <ConsultaForm />
            </div>
          </div>

          {/* Footer */}
          <p className="text-center text-xs text-muted-foreground pb-4 tracking-wide">
            Sistema Electoral ANR &mdash; Uso oficial
          </p>
        </div>
      </main>
    </div>
  )
}
