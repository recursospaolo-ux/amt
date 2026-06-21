// Crea (o asegura) la cuenta de administrador como dueño activo.
// Uso: SUPABASE_ACCESS_TOKEN=sbp_xxx ADMIN_EMAIL=... ADMIN_PASS=... node --env-file=.env.local scripts/crear-admin.mjs
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const token = process.env.SUPABASE_ACCESS_TOKEN;
const ref = "qemmhlklzbizmwfyhhpj";
const email = process.env.ADMIN_EMAIL;
const pass = process.env.ADMIN_PASS;
const nombre = "Administrador AMT";

async function mgmt(query) {
  const r = await fetch(`https://api.supabase.com/v1/projects/${ref}/database/query`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ query }),
  });
  return { ok: r.ok, body: await r.text() };
}

// 1) Obtener la service_role key vía Management API
const kr = await fetch(`https://api.supabase.com/v1/projects/${ref}/api-keys?reveal=true`, {
  headers: { Authorization: `Bearer ${token}` },
});
if (!kr.ok) { console.log("No se pudo leer api-keys:", kr.status, await kr.text()); process.exit(2); }
const keys = await kr.json();
const service = keys.find((k) => k.name === "service_role")?.api_key
  || keys.find((k) => k.type === "secret")?.api_key;
if (!service) { console.log("No se encontró service_role en:", keys.map(k=>k.name)); process.exit(2); }

// 2) Crear el usuario en Auth (confirmado). Si ya existe, seguimos.
const cu = await fetch(`${url}/auth/v1/admin/users`, {
  method: "POST",
  headers: { apikey: service, Authorization: `Bearer ${service}`, "Content-Type": "application/json" },
  body: JSON.stringify({ email, password: pass, email_confirm: true, user_metadata: { nombre } }),
});
if (cu.ok) console.log("Usuario creado en Auth.");
else console.log("Aviso al crear (puede ya existir):", cu.status, (await cu.text()).slice(0, 200));

// 3) Forzar perfil dueño/activo con todos los permisos
const up = await mgmt(`update public.usuarios
  set rol='dueno', estado='activo',
      permisos='{"acopio":true,"inventario":true,"caja":true,"ventas":true}'::jsonb,
      aprobado_en=now(), nombre='${nombre}'
  where correo='${email}';`);
console.log("Perfil actualizado a dueño:", up.ok);

// 4) Verificar inicio de sesión real
const s = createClient(url, anon, { auth: { persistSession: false } });
const li = await s.auth.signInWithPassword({ email, password: pass });
if (li.error) { console.log("❌ Login de prueba falló:", li.error.message); process.exit(3); }
const { data: perfil } = await s.from("usuarios").select("rol, estado").eq("id", li.data.user.id).single();
console.log("✅ Login OK. Perfil:", perfil);
