// Prueba de extremo a extremo del flujo de acceso. Cuentas de prueba se borran al final.
// Uso: SUPABASE_ACCESS_TOKEN=sbp_xxx node --env-file=.env.local scripts/e2e-auth.mjs
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const token = process.env.SUPABASE_ACCESS_TOKEN;
const ref = "qemmhlklzbizmwfyhhpj";
const mk = () => createClient(url, key, { auth: { persistSession: false } });

const ownerEmail = "dueno.prueba@example.com";
const workerEmail = "trabajador.prueba@example.com";
const pass = "prueba123456";

async function limpiar() {
  if (!token) return;
  await fetch(`https://api.supabase.com/v1/projects/${ref}/database/query`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      query: `delete from auth.users where email in ('${ownerEmail}','${workerEmail}');`,
    }),
  });
}

try {
  await limpiar(); // por si quedó algo de una corrida previa

  // 1. Primer registro = dueño automático
  const o = mk();
  const ro = await o.auth.signUp({
    email: ownerEmail, password: pass, options: { data: { nombre: "Dueño Prueba" } },
  });
  if (ro.error) throw new Error("signUp dueño: " + ro.error.message);
  const { data: op } = await o.from("usuarios").select("rol, estado, permisos").eq("id", ro.data.user.id).single();
  console.log("1) Dueño:", op);

  // 2. Segundo registro = trabajador pendiente
  const w = mk();
  const rw = await w.auth.signUp({
    email: workerEmail, password: pass, options: { data: { nombre: "Trabajador Prueba" } },
  });
  if (rw.error) throw new Error("signUp trabajador: " + rw.error.message);
  const { data: wp } = await w.from("usuarios").select("rol, estado").eq("id", rw.data.user.id).single();
  console.log("2) Trabajador:", wp);

  // 3. El dueño ve a todos (RLS)
  const { data: todos } = await o.from("usuarios").select("correo, rol, estado");
  console.log("3) El dueño ve filas:", todos?.length);

  // 4. El trabajador solo se ve a sí mismo (RLS)
  const { data: visW } = await w.from("usuarios").select("correo");
  console.log("4) El trabajador ve filas:", visW?.length);

  const ok =
    op?.rol === "dueno" && op?.estado === "activo" && op?.permisos?.caja === true &&
    wp?.rol === "trabajador" && wp?.estado === "pendiente" &&
    todos?.length === 2 && visW?.length === 1;
  console.log(ok ? "\n✅ TODO CORRECTO: dueño automático + pendiente + RLS funcionan." : "\n❌ ALGO FALLÓ, revisar arriba.");
  process.exitCode = ok ? 0 : 3;
} catch (e) {
  console.log("ERROR:", e.message);
  process.exitCode = 2;
} finally {
  await limpiar();
  console.log("(cuentas de prueba eliminadas)");
}
