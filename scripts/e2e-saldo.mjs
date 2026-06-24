// Verifica: (1) no se puede comprar sin saldo suficiente; (2) con saldo sí;
// (3) un nuevo registro genera notificación al admin.
// Uso: SUPABASE_ACCESS_TOKEN=sbp_xxx node --env-file=.env.local scripts/e2e-saldo.mjs
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const token = process.env.SUPABASE_ACCESS_TOKEN;
const ref = "qemmhlklzbizmwfyhhpj";
const R = "registro.test@example.com";
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
let fallos = 0;
const chk = (c, m) => { console.log((c ? "✅" : "❌") + " " + m); if (!c) fallos++; };
let okLoteId, regUid;

try {
  await sql(`alter table public.notificaciones disable trigger al_enviar_push;`);
  const svc = await serviceKey();
  const admin = createClient(url, svc, { auth: { persistSession: false } });

  const due = await sql(`select id from public.usuarios where rol='dueno' limit 1;`);
  const dueId = due?.[0]?.id;
  const prov = await sql(`select id from public.productores limit 1;`);
  let provId = prov?.[0]?.id;
  if (!provId) {
    const np = await admin.from("productores").insert({ nombre: "Prov Saldo Test" }).select("id").single();
    provId = np.data.id;
  }

  // Inyectar capital de prueba para tener margen conocido
  await admin.from("caja_movimientos").insert({ tipo: "ingreso", categoria: "aporte de capital", monto: 10000, descripcion: "TEST-SALDO", creado_por: dueId });
  const s = await sql(`select coalesce(sum(case when tipo='ingreso' then monto else -monto end),0)::float as saldo from public.caja_movimientos;`);
  const p = await sql(`select coalesce(sum(monto_total),0)::float as pend from public.lotes_acopio where pago_estado='pendiente';`);
  const disponible = s[0].saldo - p[0].pend;

  // (1) Compra por más del disponible -> debe FALLAR
  const grande = await admin.from("lotes_acopio").insert({
    codigo: "L-SALDOX", productor_id: provId, estado_recepcion: "seco", peso_kg: 1, precio_kg: disponible + 1000, estado: "recibido", creado_por: dueId,
  }).select("id").single();
  chk(!!grande.error, "Bloquea compra mayor al saldo disponible" + (grande.error ? "" : " (¡se permitió!)"));

  // (2) Compra dentro del disponible -> debe FUNCIONAR
  const okc = await admin.from("lotes_acopio").insert({
    codigo: "L-SALDOOK", productor_id: provId, estado_recepcion: "seco", peso_kg: 1, precio_kg: 500, estado: "recibido", creado_por: dueId,
  }).select("id, pago_estado").single();
  chk(!okc.error && okc.data?.pago_estado === "pendiente", "Permite compra con saldo (queda pendiente)" + (okc.error ? " — " + okc.error.message : ""));
  okLoteId = okc.data?.id;

  // (3) Registro -> notificación al admin
  for (let i = 0; i < 4; i++) {
    const r = await admin.auth.admin.createUser({ email: R, password: pass, email_confirm: true, user_metadata: { nombre: "Registro Test", tipo: "trabajador" } });
    if (!r.error) { regUid = r.data.user.id; break; }
    await new Promise((x) => setTimeout(x, 2500));
  }
  const nreg = await sql(`select count(*)::int as n from public.notificaciones where creado_por='${regUid}' and tipo='registro' and para is null;`);
  chk(nreg?.[0]?.n === 1, `Notificación de registro al admin (${nreg?.[0]?.n ?? 0})`);

  console.log(fallos === 0 ? "\n✅ SALDO Y REGISTRO OK" : `\n❌ ${fallos} fallo(s)`);
  process.exitCode = fallos === 0 ? 0 : 3;
} catch (e) {
  console.log("ERROR:", e.message);
  process.exitCode = 2;
} finally {
  if (okLoteId) await sql(`delete from public.notificaciones where lote_id='${okLoteId}'; delete from public.caja_movimientos where lote_id='${okLoteId}'; delete from public.actividad where descripcion like '%L-SALDOOK%'; delete from public.lotes_acopio where id='${okLoteId}';`);
  await sql(`delete from public.caja_movimientos where descripcion='TEST-SALDO';`);
  await sql(`delete from public.lotes_acopio where codigo in ('L-SALDOX');`);
  await sql(`delete from public.productores where nombre='Prov Saldo Test';`);
  if (regUid) { await sql(`delete from public.notificaciones where creado_por='${regUid}';`); await sql(`delete from auth.users where email='${R}';`); }
  await sql(`alter table public.notificaciones enable trigger al_enviar_push;`);
  console.log("(datos de prueba eliminados, push reactivado)");
}
