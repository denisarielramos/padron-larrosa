"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Spinner } from "@/components/ui/spinner"
import { ShieldCheck } from "lucide-react"

export default function AdminLoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setLoading(true)

    const { error: authError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    })

    setLoading(false)

    if (authError) {
      setError("Credenciales inválidas. Verifique su correo y contraseña.")
      return
    }

    router.push("/admin/dashboard")
  }

  return (
    <main className="min-h-screen bg-background flex flex-col items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm flex flex-col gap-8">
        {/* Header */}
        <header className="flex flex-col items-center gap-3 text-center">
          <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-primary text-primary-foreground shadow-md">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <div className="flex flex-col gap-1">
            <h1 className="text-2xl font-bold text-foreground">Panel de Administración</h1>
            <p className="text-sm text-muted-foreground">
              Ingrese sus credenciales para continuar.
            </p>
          </div>
        </header>

        {/* Login card */}
        <div className="rounded-2xl border bg-card shadow-sm px-6 py-7">
          <form onSubmit={handleLogin} className="flex flex-col gap-5">
            <div className="flex flex-col gap-2">
              <Label htmlFor="email" className="text-base font-medium">
                Correo electrónico
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@ejemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-12 text-base"
                required
                disabled={loading}
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="password" className="text-base font-medium">
                Contraseña
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-12 text-base"
                required
                disabled={loading}
              />
            </div>

            {error && (
              <div
                className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
                role="alert"
              >
                {error}
              </div>
            )}

            <Button
              type="submit"
              size="lg"
              className="w-full h-12 text-base font-semibold mt-1"
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <Spinner className="w-4 h-4" />
                  Ingresando...
                </span>
              ) : (
                "Ingresar"
              )}
            </Button>
          </form>
        </div>
      </div>
    </main>
  )
}
