// Prueba de conexión con Supabase. Uso: node --env-file=.env.local scripts/check-conexion.mjs
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !key) {
  console.log("FALTAN VARIABLES: revisa .env.local");
  process.exit(1);
}

const supabase = createClient(url, key);
const { data, error } = await supabase.from("usuarios").select("id").limit(1);

if (error) {
  console.log("ERROR:", error.message);
  process.exit(2);
}
console.log("OK conexion. La tabla 'usuarios' existe. Filas leidas:", data.length);
