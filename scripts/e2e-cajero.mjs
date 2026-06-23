// Verifica el flujo de cajero:
//  - El que atiende registra una compra -> queda PENDIENTE, NO descuenta caja, avisa al cajero.
//  - El cajero confirma el pago -> descuenta caja, marca pagado, avisa al admin.
// Uso: SUPABASE_ACCESS_TOKEN=sbp_xxx node --env-file=.env.local scripts/e2e-cajero.mjs
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const token = process.env.SUPABASE_ACCESS_TOKEN;
const ref = "qemmhlklzbizmwfyhhpj";
const A = "atiende.test@example.com";
const C = "cajero.test@example.com";
const pass = "prueba123456";

async function sql(query) {
  const r = await fetch(`https://api.supabase.com/v1/projects/${ref}/database/query`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ query }),
  });
  return r.ok ? r.json() : { error: await r.text() };
}
async function serviceKey() {
  const r = await fetch(`https://api.supabase.com/v1/projects/${ref}/api-keys?reveal=true`, { headers: { Authorization: `Bearer ${token}` } });
  return (await r.json()).find((k) => k.name === "service_role").api_key;
}

let fallos = 0;
const chk = (c, m) => { console.log((c ? "✅" : "❌") + " " + m); if (!c) fallos++; };
let loteId, pid, aUid, cUid;

try {
  await sql(`alter table public.notificaciones disable trigger al_enviar_push;`);
  await sql(`delete from auth.users where email in ('${A}','${C}');`);

  const svc = await serviceKey();
  const admin = createClient(url, svc, { auth: { persistSession: false } });
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  async function crear(email, meta, etiqueta) {
    for (let i = 0; i < 4; i++) {
      const res = await admin.auth.admin.createUser({ email, password: pass, email_confirm: true, user_metadata: meta });
      if (!res.error) return res.data.user.id;
      console.log(`  reintento ${etiqueta} (${res.error.message || res.error.name || "err"})`);
      await wait(3000);
    }
    throw new Error("no se pudo crear " + etiqueta);
  }

  aUid = await crear(A, { nombre: "Atiende Test", dni: "11111111", tipo: "trabajador" }, "atiende");
  await wait(2000);
  cUid = await crear(C, { nombre: "Cajero Test", dni: "22222222", tipo: "cajero" }, "cajero");

  await sql(`update public.usuarios set estado='activo', permisos='{"acopio":true,"inventario":true,"caja":true,"ventas":true}'::jsonb where id='${aUid}';`);
  await sql(`update public.usuarios set estado='activo', permisos='{"pagos":true}'::jsonb where id='${cUid}';`);

  // Sesión del atiende (para respetar RLS)
  const sa = createClient(url, anon, { auth: { persistSession: false } });
  const la = await sa.auth.signInWithPassword({ email: A, password: pass });
  if (la.error) throw new Error("login atiende: " + la.error.message);

  // El atiende registra la compra (50kg x S/4 = S/200)
  const { data: prov, error: ep } = await sa.from("productores").insert({ nombre: "Prov Cajero Test", dni: "33333333" }).select("id").single();
  if (ep) throw new Error("crear productor: " + ep.message);
  pid = prov.id;
  const { data: lote, error: el } = await sa.from("lotes_acopio").insert({
    codigo: "L-CAJTEST", productor_id: pid, estado_recepcion: "seco", peso_kg: 50, precio_kg: 4, estado: "recibido", creado_por: aUid,
  }).select("id, monto_total, pago_estado").single();
  if (el) throw new Error("crear lote: " + el.message);
  loteId = lote.id;
  chk(Number(lote.monto_total) === 200, "Compra registrada (S/200)");
  chk(lote.pago_estado === "pendiente", `Queda PENDIENTE de pago (${lote.pago_estado})`);

  const cajaAntes = await sql(`select count(*)::int as n from public.caja_movimientos where lote_id='${loteId}';`);
  chk(cajaAntes?.[0]?.n === 0, `Caja NO se descontó al registrar (movimientos: ${cajaAntes?.[0]?.n})`);

  const notifCaj = await sql(`select count(*)::int as n from public.notificaciones where lote_id='${loteId}' and para='${cUid}' and tipo='pago';`);
  chk(notifCaj?.[0]?.n === 1, `Aviso al cajero creado (${notifCaj?.[0]?.n})`);

  // El cajero confirma el pago
  const sc = createClient(url, anon, { auth: { persistSession: false } });
  const lc = await sc.auth.signInWithPassword({ email: C, password: pass });
  if (lc.error) throw new Error("login cajero: " + lc.error.message);
  const { error: erpc } = await sc.rpc("confirmar_pago", { p_lote: loteId });
  chk(!erpc, "Cajero confirmó el pago" + (erpc ? " — " + erpc.message : ""));

  const cajaDesp = await sql(`select tipo, monto::float as monto, categoria from public.caja_movimientos where lote_id='${loteId}';`);
  const egreso = (cajaDesp || []).find((m) => m.tipo === "egreso");
  chk(egreso && egreso.monto === 200, `Caja descontó al confirmar (egreso S/${egreso?.monto ?? 0}, ${egreso?.categoria})`);

  const estado = await sql(`select pago_estado from public.lotes_acopio where id='${loteId}';`);
  chk(estado?.[0]?.pago_estado === "pagado", `Lote marcado como pagado (${estado?.[0]?.pago_estado})`);

  const notifAdmin = await sql(`select count(*)::int as n from public.notificaciones where lote_id='${loteId}' and para is null and mensaje like '✅%';`);
  chk(notifAdmin?.[0]?.n === 1, `Aviso al administrador creado (${notifAdmin?.[0]?.n})`);

  // No se puede confirmar dos veces
  const { error: e2 } = await sc.rpc("confirmar_pago", { p_lote: loteId });
  chk(!!e2, "No deja confirmar el mismo pago dos veces");

  console.log(fallos === 0 ? "\n✅ FLUJO DE CAJERO OK" : `\n❌ ${fallos} fallo(s)`);
  process.exitCode = fallos === 0 ? 0 : 3;
} catch (e) {
  console.log("ERROR:", e.message);
  process.exitCode = 2;
} finally {
  if (loteId) await sql(`delete from public.notificaciones where lote_id='${loteId}'; delete from public.caja_movimientos where lote_id='${loteId}'; delete from public.actividad where descripcion like '%L-CAJTEST%'; delete from public.lotes_acopio where id='${loteId}';`);
  if (pid) await sql(`delete from public.productores where id='${pid}';`);
  await sql(`delete from auth.users where email in ('${A}','${C}');`);
  await sql(`alter table public.notificaciones enable trigger al_enviar_push;`);
  console.log("(datos de prueba eliminados, push reactivado)");
}
