// Verifica "Mi cuenta": editar perfil propio, subir avatar y que NO se pueda
// cambiar rol/estado/permisos (sin escalada de privilegios).
// Uso: SUPABASE_ACCESS_TOKEN=sbp_xxx node --env-file=.env.local scripts/e2e-perfil.mjs
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const token = process.env.SUPABASE_ACCESS_TOKEN;
const ref = "qemmhlklzbizmwfyhhpj";
const W = "perfil.test@example.com";
const pass = "prueba123456";

async function sql(q) {
  const r = await fetch(`https://api.supabase.com/v1/projects/${ref}/database/query`, {
    method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ query: q }),
  });
  return r.ok ? r.json() : { error: await r.text() };
}
async function serviceKey() {
  const r = await fetch(`https://api.supabase.com/v1/projects/${ref}/api-keys?reveal=true`, { headers: { Authorization: `Bearer ${token}` } });
  return (await r.json()).find((k) => k.name === "service_role").api_key;
}
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
let fallos = 0;
const chk = (c, m) => { console.log((c ? "✅" : "❌") + " " + m); if (!c) fallos++; };
let wId, avatarPath;

try {
  const svc = await serviceKey();
  const admin = createClient(url, svc, { auth: { persistSession: false } });
  await sql(`delete from auth.users where email='${W}';`);
  for (let i = 0; i < 4; i++) { const r = await admin.auth.admin.createUser({ email: W, password: pass, email_confirm: true, user_metadata: { nombre: "Perfil Test", dni: "44444444", tipo: "trabajador" } }); if (!r.error) { wId = r.data.user.id; break; } await wait(2500); }
  await sql(`update public.usuarios set estado='activo', permisos='{"acopio":true}'::jsonb where id='${wId}';`);

  const sw = createClient(url, anon, { auth: { persistSession: false } });
  await sw.auth.signInWithPassword({ email: W, password: pass });

  // (1) Intento de escalar privilegios por update directo -> RLS lo bloquea
  await sw.from("usuarios").update({ rol: "dueno", estado: "activo" }).eq("id", wId);
  const r1 = await sql(`select rol::text as rol from public.usuarios where id='${wId}';`);
  chk(r1?.[0]?.rol === "trabajador", "No puede cambiarse el rol por update directo (RLS)");

  // (2) Editar perfil con la RPC -> actualiza solo lo permitido
  const up = await sw.rpc("actualizar_mi_perfil", { p_nombre: "Nombre Editado", p_avatar: "https://x/y.jpg", p_nacimiento: "1990-05-05", p_telefono: "999111222" });
  chk(!up.error, "Guarda el perfil con la RPC" + (up.error ? " — " + up.error.message : ""));
  const r2 = await sql(`select nombre, telefono, fecha_nacimiento::text as fn, rol::text as rol from public.usuarios where id='${wId}';`);
  chk(r2?.[0]?.nombre === "Nombre Editado" && r2?.[0]?.telefono === "999111222" && r2?.[0]?.fn === "1990-05-05", "Nombre, teléfono y nacimiento guardados");
  chk(r2?.[0]?.rol === "trabajador", "La RPC no tocó el rol");

  // (3) Subir avatar a Storage
  avatarPath = `${wId}/avatar`;
  const upa = await sw.storage.from("avatars").upload(avatarPath, Buffer.from("img"), { contentType: "image/png", upsert: true });
  chk(!upa.error, "Sube avatar a Storage" + (upa.error ? " — " + upa.error.message : ""));
  const pub = sw.storage.from("avatars").getPublicUrl(avatarPath).data.publicUrl;
  const f = await fetch(pub);
  chk(f.ok, `Avatar accesible por URL (${f.status})`);

  console.log(fallos === 0 ? "\n✅ MI CUENTA OK" : `\n❌ ${fallos} fallo(s)`);
  process.exitCode = fallos === 0 ? 0 : 3;
} catch (e) {
  console.log("ERROR:", e.message);
  process.exitCode = 2;
} finally {
  if (avatarPath) { const svc = await serviceKey(); const admin = createClient(url, svc, { auth: { persistSession: false } }); await admin.storage.from("avatars").remove([avatarPath]); }
  await sql(`delete from auth.users where email='${W}';`);
  console.log("(datos de prueba eliminados)");
}
