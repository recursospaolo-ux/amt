// Prueba e2e de los módulos: acopio → clasificación → inventario → venta → caja.
// Crea datos de prueba y los borra al final (deja la base limpia).
// Uso: SUPABASE_ACCESS_TOKEN=sbp_xxx node --env-file=.env.local scripts/e2e-modulos.mjs
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const token = process.env.SUPABASE_ACCESS_TOKEN;
const ref = "qemmhlklzbizmwfyhhpj";
const ownerEmail = "dueno.modulos@example.com";
const pass = "prueba123456";

async function sql(query) {
  const r = await fetch(`https://api.supabase.com/v1/projects/${ref}/database/query`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ query }),
  });
  return r.ok;
}
async function limpiar() {
  await sql(`truncate table public.procesos_lote, public.inventario_movimientos,
    public.venta_items, public.ventas, public.caja_movimientos,
    public.lotes_acopio, public.clientes, public.productores cascade;`);
  await sql(`delete from auth.users where email = '${ownerEmail}';`);
}

const s = createClient(url, key, { auth: { persistSession: false } });
let fallos = 0;
const chk = (cond, msg) => { console.log((cond ? "✅" : "❌") + " " + msg); if (!cond) fallos++; };

try {
  await limpiar();

  // Dueño
  const r = await s.auth.signUp({ email: ownerEmail, password: pass, options: { data: { nombre: "Dueño Módulos" } } });
  if (r.error) throw new Error("signUp: " + r.error.message);

  // Productor + lote (seco → se clasifica directo)
  const { data: prod } = await s.from("productores").insert({ nombre: "Productor Prueba", organico: true }).select("id").single();
  chk(!!prod?.id, "Crear productor");
  const { data: lote } = await s.from("lotes_acopio").insert({
    codigo: "L-TEST", productor_id: prod.id, estado_recepcion: "seco", peso_kg: 100, precio_kg: 5, estado: "recibido",
  }).select("id, monto_total").single();
  chk(Number(lote?.monto_total) === 500, "Lote con monto calculado (100kg × S/5 = S/500)");

  // Clasificar → inventario
  const { error: eClas } = await s.rpc("clasificar_lote", { p_lote: lote.id, p_kg_pequeno: 40, p_kg_grande: 50, p_merma: 10 });
  chk(!eClas, "Clasificar lote (RPC)");
  const { data: stock1 } = await s.from("stock_actual").select("categoria, cantidad");
  const grande1 = Number(stock1?.find((x) => x.categoria === "grano grande")?.cantidad);
  const peq1 = Number(stock1?.find((x) => x.categoria === "grano pequeño")?.cantidad);
  chk(peq1 === 40 && grande1 === 50, `Inventario tras clasificar (pequeño ${peq1}, grande ${grande1})`);

  // Cliente + venta (vende 10kg de grano grande a S/20) cobrada
  const { data: prodGrande } = await s.from("productos").select("id").eq("categoria", "grano grande").single();
  const { data: cli } = await s.from("clientes").insert({ nombre: "Cliente Prueba", tipo: "local" }).select("id").single();
  const { error: eVenta } = await s.rpc("registrar_venta", {
    p_cliente: cli.id, p_tipo: "local", p_codigo: "V-TEST",
    p_items: [{ producto_id: prodGrande.id, cantidad: 10, precio_unit: 20 }], p_cobrar: true,
  });
  chk(!eVenta, "Registrar venta (RPC)");

  // Stock descontado + caja sumada
  const { data: stock2 } = await s.from("stock_actual").select("categoria, cantidad");
  const grande2 = Number(stock2?.find((x) => x.categoria === "grano grande")?.cantidad);
  chk(grande2 === 40, `Stock grande descontado tras venta (${grande2}, esperado 40)`);
  const { data: caja } = await s.from("caja_movimientos").select("tipo, monto");
  const saldo = (caja ?? []).reduce((a, m) => a + (m.tipo === "ingreso" ? Number(m.monto) : -Number(m.monto)), 0);
  chk(saldo === 200, `Caja con ingreso de la venta (S/${saldo}, esperado 200)`);

  // Validación de stock insuficiente
  const { error: eMal } = await s.rpc("registrar_venta", {
    p_cliente: cli.id, p_tipo: "local", p_codigo: "V-TEST2",
    p_items: [{ producto_id: prodGrande.id, cantidad: 9999, precio_unit: 1 }], p_cobrar: false,
  });
  chk(!!eMal, "Rechaza venta con stock insuficiente");

  console.log(fallos === 0 ? "\n✅ TODOS LOS MÓDULOS FUNCIONAN" : `\n❌ ${fallos} fallo(s)`);
  process.exitCode = fallos === 0 ? 0 : 3;
} catch (e) {
  console.log("ERROR:", e.message);
  process.exitCode = 2;
} finally {
  await limpiar();
  console.log("(datos de prueba eliminados)");
}
