// Verifica borrado del chat: para mí, para todos (solo propios) y conversación.
// Uso: SUPABASE_ACCESS_TOKEN=sbp_xxx node --env-file=.env.local scripts/e2e-chat-delete.mjs
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const token = process.env.SUPABASE_ACCESS_TOKEN;
const ref = "qemmhlklzbizmwfyhhpj";
const A = "delA.test@example.com", B = "delB.test@example.com";
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
let aId, bId;

async function visibles(client, me, otro) {
  const { data } = await client.from("mensajes_chat").select("id, texto, eliminado_todos, oculto_para")
    .or(`and(de.eq.${me},para.eq.${otro}),and(de.eq.${otro},para.eq.${me})`);
  return (data ?? []).filter((m) => !(m.oculto_para ?? []).includes(me));
}

try {
  await sql(`alter table public.mensajes_chat disable trigger al_push_chat;`);
  await sql(`delete from auth.users where email in ('${A}','${B}');`);
  const svc = await serviceKey();
  const admin = createClient(url, svc, { auth: { persistSession: false } });
  async function crear(email, n) {
    for (let i = 0; i < 4; i++) { const r = await admin.auth.admin.createUser({ email, password: pass, email_confirm: true, user_metadata: { nombre: n, tipo: "trabajador" } }); if (!r.error) return r.data.user.id; await wait(2500); }
    throw new Error("crear " + email);
  }
  aId = await crear(A, "Del A");
  bId = await crear(B, "Del B");
  await sql(`update public.usuarios set estado='activo', permisos='{"acopio":true}'::jsonb where id in ('${aId}','${bId}');`);

  const sa = createClient(url, anon, { auth: { persistSession: false } });
  const sb = createClient(url, anon, { auth: { persistSession: false } });
  await sa.auth.signInWithPassword({ email: A, password: pass });
  await sb.auth.signInWithPassword({ email: B, password: pass });

  const m1 = (await sa.from("mensajes_chat").insert({ de: aId, para: bId, texto: "uno" }).select().single()).data;
  const m2 = (await sa.from("mensajes_chat").insert({ de: aId, para: bId, texto: "dos" }).select().single()).data;
  const m3 = (await sb.from("mensajes_chat").insert({ de: bId, para: aId, texto: "tres" }).select().single()).data;

  // Eliminar para mí (B oculta m1)
  await sb.rpc("chat_eliminar_para_mi", { p_msg: m1.id });
  const vB1 = await visibles(sb, bId, aId);
  const vA1 = await visibles(sa, aId, bId);
  chk(!vB1.some((m) => m.id === m1.id), "Eliminar para mí: B ya no ve el mensaje");
  chk(vA1.some((m) => m.id === m1.id), "Eliminar para mí: A SÍ lo sigue viendo");

  // Eliminar para todos (A borra su m2)
  await sa.rpc("chat_eliminar_para_todos", { p_msg: m2.id });
  const row2 = await sql(`select eliminado_todos, texto from public.mensajes_chat where id='${m2.id}';`);
  chk(row2?.[0]?.eliminado_todos === true && row2?.[0]?.texto === null, "Eliminar para todos: marca y borra contenido");

  // A NO puede eliminar para todos un mensaje ajeno (m3 de B)
  await sa.rpc("chat_eliminar_para_todos", { p_msg: m3.id });
  const row3 = await sql(`select eliminado_todos from public.mensajes_chat where id='${m3.id}';`);
  chk(row3?.[0]?.eliminado_todos === false, "No deja eliminar para todos un mensaje ajeno");

  // Eliminar conversación (A)
  await sa.rpc("chat_eliminar_conversacion", { p_otro: bId });
  const vA2 = await visibles(sa, aId, bId);
  const vB2 = await visibles(sb, bId, aId);
  chk(vA2.length === 0, `Eliminar conversación: A no ve nada (${vA2.length})`);
  chk(vB2.length >= 1, `Eliminar conversación: B sigue viendo lo suyo (${vB2.length})`);

  console.log(fallos === 0 ? "\n✅ BORRADO DE CHAT OK" : `\n❌ ${fallos} fallo(s)`);
  process.exitCode = fallos === 0 ? 0 : 3;
} catch (e) {
  console.log("ERROR:", e.message);
  process.exitCode = 2;
} finally {
  if (aId) await sql(`delete from public.mensajes_chat where de in ('${aId}','${bId}') or para in ('${aId}','${bId}');`);
  await sql(`delete from auth.users where email in ('${A}','${B}');`);
  await sql(`alter table public.mensajes_chat enable trigger al_push_chat;`);
  console.log("(datos de prueba eliminados, push reactivado)");
}
