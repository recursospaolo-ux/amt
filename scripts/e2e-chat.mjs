// Verifica el chat interno: enviar mensaje, RLS (solo emisor/receptor), contactos,
// no leídos, marcar leído y subida de foto a Storage.
// Uso: SUPABASE_ACCESS_TOKEN=sbp_xxx node --env-file=.env.local scripts/e2e-chat.mjs
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const token = process.env.SUPABASE_ACCESS_TOKEN;
const ref = "qemmhlklzbizmwfyhhpj";
const A = "chatA.test@example.com", B = "chatB.test@example.com", C = "chatC.test@example.com";
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
let aId, bId, cId, fotoPath;

try {
  await sql(`alter table public.mensajes_chat disable trigger al_push_chat;`);
  await sql(`delete from auth.users where email in ('${A}','${B}','${C}');`);

  const svc = await serviceKey();
  const admin = createClient(url, svc, { auth: { persistSession: false } });
  async function crear(email, nombre) {
    for (let i = 0; i < 4; i++) {
      const r = await admin.auth.admin.createUser({ email, password: pass, email_confirm: true, user_metadata: { nombre, tipo: "trabajador" } });
      if (!r.error) return r.data.user.id;
      await wait(2500);
    }
    throw new Error("no se pudo crear " + email);
  }
  aId = await crear(A, "Chat A");
  bId = await crear(B, "Chat B");
  cId = await crear(C, "Chat C");
  await sql(`update public.usuarios set estado='activo', permisos='{"acopio":true}'::jsonb where id in ('${aId}','${bId}','${cId}');`);

  const sa = createClient(url, anon, { auth: { persistSession: false } });
  const sb = createClient(url, anon, { auth: { persistSession: false } });
  const sc = createClient(url, anon, { auth: { persistSession: false } });
  await sa.auth.signInWithPassword({ email: A, password: pass });
  await sb.auth.signInWithPassword({ email: B, password: pass });
  await sc.auth.signInWithPassword({ email: C, password: pass });

  // A le escribe a B
  const ins = await sa.from("mensajes_chat").insert({ de: aId, para: bId, texto: "Hola, pagá el lote L-1" }).select().single();
  chk(!ins.error, "A envió un mensaje a B" + (ins.error ? " — " + ins.error.message : ""));

  // B lee la conversación
  const leeB = await sb.from("mensajes_chat").select("texto")
    .or(`and(de.eq.${aId},para.eq.${bId}),and(de.eq.${bId},para.eq.${aId})`);
  chk((leeB.data ?? []).length === 1, `B ve el mensaje (${leeB.data?.length ?? 0})`);

  // C NO puede ver la conversación de A y B
  const leeC = await sc.from("mensajes_chat").select("id")
    .or(`and(de.eq.${aId},para.eq.${bId}),and(de.eq.${bId},para.eq.${aId})`);
  chk((leeC.data ?? []).length === 0, `C NO puede leer la conversación ajena (${leeC.data?.length ?? 0})`);

  // contactos de B: A con 1 no leído
  const contB = await sb.rpc("chat_contactos");
  const aEnB = (contB.data ?? []).find((x) => x.id === aId);
  chk(aEnB && Number(aEnB.no_leidos) === 1, `Contactos de B: A con ${aEnB?.no_leidos ?? 0} no leído(s)`);
  chk(aEnB?.ultimo?.includes("L-1"), "Muestra el último mensaje");

  // B marca leído
  await sb.from("mensajes_chat").update({ leido: true }).eq("de", aId).eq("para", bId).eq("leido", false);
  const contB2 = await sb.rpc("chat_contactos");
  const aEnB2 = (contB2.data ?? []).find((x) => x.id === aId);
  chk(Number(aEnB2?.no_leidos ?? -1) === 0, `Tras marcar leído, no leídos = ${aEnB2?.no_leidos}`);

  // Subida de foto a Storage por A
  fotoPath = `${aId}/${Date.now()}-boleta.txt`;
  const up = await sa.storage.from("chat").upload(fotoPath, Buffer.from("boleta de prueba"), { contentType: "text/plain" });
  chk(!up.error, "A subió una foto al chat" + (up.error ? " — " + up.error.message : ""));
  const pub = sa.storage.from("chat").getPublicUrl(fotoPath).data.publicUrl;
  const fetchFoto = await fetch(pub);
  chk(fetchFoto.ok, `La foto es accesible por URL (${fetchFoto.status})`);

  console.log(fallos === 0 ? "\n✅ CHAT OK" : `\n❌ ${fallos} fallo(s)`);
  process.exitCode = fallos === 0 ? 0 : 3;
} catch (e) {
  console.log("ERROR:", e.message);
  process.exitCode = 2;
} finally {
  if (aId) await sql(`delete from public.mensajes_chat where de in ('${aId}','${bId}','${cId}') or para in ('${aId}','${bId}','${cId}');`);
  if (fotoPath) {
    const svc = await serviceKey();
    const admin = createClient(url, svc, { auth: { persistSession: false } });
    await admin.storage.from("chat").remove([fotoPath]);
  }
  await sql(`delete from auth.users where email in ('${A}','${B}','${C}');`);
  await sql(`alter table public.mensajes_chat enable trigger al_push_chat;`);
  console.log("(datos de prueba eliminados, push reactivado)");
}
