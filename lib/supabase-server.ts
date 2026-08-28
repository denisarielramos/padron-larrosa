import "server-only"
import { createClient } from "@supabase/supabase-js"

// Cliente exclusivo para Route Handlers / codigo server-side.
// NUNCA importar este archivo desde un componente "use client" ni exponer
// SUPABASE_SERVICE_ROLE_KEY como NEXT_PUBLIC_*: bypassea RLS por completo.
// El import de "server-only" hace fallar el build si algo del bundle
// cliente llega a importarlo por error.

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export const supabaseServer = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
})
