// Verifica: compra de un trabajador → descuenta caja + crea notificación.
// Uso: SUPABASE_ACCESS_TOKEN=sbp_xxx node --env-file=.env.local scripts/e2e-trabajador.mjs
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const token = process.env.SUPABASE_ACCESS_TOKEN;
const ref = "qemmhlklzbizmwfyhhpj";
const email = "trab.test@example.com";
const pass = "prueba123456";

async function sql(query) {
  const r = await fetch(`https://api.supabase.com/v1/projects/${ref}/database/query`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ query }),
  });
  return r.ok ? r.json() : { error: await r.text() };
}

let fallos = 0;
const chk = (c, m) => { console.log((c ? "✅" : "❌") + " " + m); if (!c) fallos++; };
let loteId, pid, uid;

try {
  await sql(`delete from auth.users where email='${email}';`);

  const s = createClient(url, anon, { auth: { persistSession: false } });
  const reg = await s.auth.signUp({ email, password: pass, options: { data: { nombre: "Trabajador Test", dni: "99999999", tipo: "trabajador" } } });
  if (reg.error) throw new Error("signUp: " + reg.error.message);
  uid = reg.data.user.id;

  // Aprobar como trabajador con permisos (lo hace el admin; acá vía SQL)
  await sql(`update public.usuarios set estado='activo', permisos='{"acopio":true,"inventario":true,"caja":true,"ventas":true}'::jsonb where id='${uid}';`);

  // El trabajador crea un proveedor y una compra (100kg x S/5 = S/500)
  const { data: prov, error: ep } = await s.from("productores").insert({ nombre: "Prov Test Trabajador" }).select("id").single();
  if (ep) throw new Error("crear productor: " + ep.message);
  pid = prov.id;
  const { data: lote, error: el } = await s.from("lotes_acopio").insert({
    codigo: "L-TRABTEST", productor_id: pid, estado_recepcion: "seco", peso_kg: 100, precio_kg: 5, estado: "recibido", creado_por: uid,
  }).select("id, monto_total").single();
  if (el) throw new Error("crear lote: " + el.message);
  loteId = lote.id;
  chk(Number(lote.monto_total) === 500, "Compra registrada (S/500)");

  // La compra debe haber generado un egreso en caja
  const { data: caja } = await s.from("caja_movimientos").select("tipo, monto, categoria").eq("lote_id", loteId);
  const egreso = (caja ?? []).find((m) => m.tipo === "egreso");
  chk(egreso && Number(egreso.monto) === 500, `Caja descontó la compra (egreso S/${egreso?.monto ?? 0}, categoría ${egreso?.categoria})`);

  // Debe existir una notificación para el admin
  const notif = await sql(`select count(*)::int as n from public.notificaciones where lote_id='${loteId}';`);
  chk(notif?.[0]?.n === 1, `Notificación al admin creada (${notif?.[0]?.n ?? 0})`);

  console.log(fallos === 0 ? "\n✅ DINERO Y NOTIFICACIONES OK" : `\n❌ ${fallos} fallo(s)`);
  process.exitCode = fallos === 0 ? 0 : 3;
} catch (e) {
  console.log("ERROR:", e.message);
  process.exitCode = 2;
} finally {
  if (loteId) await sql(`delete from public.notificaciones where lote_id='${loteId}'; delete from public.caja_movimientos where lote_id='${loteId}'; delete from public.inventario_movimientos where lote_origen_id='${loteId}'; delete from public.lotes_acopio where id='${loteId}';`);
  if (pid) await sql(`delete from public.productores where id='${pid}';`);
  await sql(`delete from auth.users where email='${email}';`);
  console.log("(datos de prueba eliminados)");
}
