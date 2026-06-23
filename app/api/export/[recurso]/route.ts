import { createClient } from "@/lib/supabase/server";

type Col = { header: string; value: (row: Record<string, unknown>) => unknown };

function csv(rows: Record<string, unknown>[], cols: Col[]): string {
  const esc = (v: unknown) => {
    const s = v === null || v === undefined ? "" : String(v);
    return `"${s.replace(/"/g, '""')}"`;
  };
  const head = cols.map((c) => esc(c.header)).join(";");
  const body = rows.map((r) => cols.map((c) => esc(c.value(r))).join(";")).join("\n");
  // BOM para que Excel respete los acentos
  return "﻿" + head + "\n" + body;
}

const fmtFecha = (s: unknown) => (s ? new Date(String(s)).toLocaleDateString("es-PE") : "");

export async function GET(
  req: Request,
  { params }: { params: Promise<{ recurso: string }> }
) {
  const { recurso } = await params;
  const supabase = await createClient();
  const sp = new URL(req.url).searchParams;
  const desde = sp.get("desde");
  const hasta = sp.get("hasta");
  const rango = desde || hasta ? `-${desde ?? "inicio"}_a_${hasta ?? "hoy"}` : "";

  // Aplica el filtro de fechas (columna `fecha`) si vienen desde/hasta.
  const conFechas = <T extends { gte: (c: string, v: string) => T; lte: (c: string, v: string) => T }>(q: T): T => {
    let r = q;
    if (desde) r = r.gte("fecha", desde);
    if (hasta) r = r.lte("fecha", hasta);
    return r;
  };

  let rows: Record<string, unknown>[] = [];
  let cols: Col[] = [];
  let nombre = recurso;

  if (recurso === "compras" || recurso === "lotes") {
    nombre = "compras";
    const { data } = await conFechas(
      supabase
        .from("lotes_acopio")
        .select("codigo, fecha, estado_recepcion, peso_kg, humedad, precio_kg, monto_total, estado, productores(nombre)")
    ).order("fecha", { ascending: false });
    rows = data ?? [];
    cols = [
      { header: "Código", value: (r) => r.codigo },
      { header: "Fecha", value: (r) => fmtFecha(r.fecha) },
      { header: "Proveedor", value: (r) => (r.productores as { nombre?: string } | null)?.nombre ?? "" },
      { header: "Recepción", value: (r) => r.estado_recepcion },
      { header: "Peso (kg)", value: (r) => r.peso_kg },
      { header: "Humedad (%)", value: (r) => r.humedad ?? "" },
      { header: "Precio/kg (S/)", value: (r) => r.precio_kg },
      { header: "Monto total (S/)", value: (r) => r.monto_total },
      { header: "Estado", value: (r) => r.estado },
    ];
  } else if (recurso === "ventas") {
    const { data } = await conFechas(
      supabase.from("ventas").select("codigo, fecha, tipo, estado, total, clientes(nombre)")
    ).order("fecha", { ascending: false });
    rows = data ?? [];
    cols = [
      { header: "Código", value: (r) => r.codigo },
      { header: "Fecha", value: (r) => fmtFecha(r.fecha) },
      { header: "Cliente", value: (r) => (r.clientes as { nombre?: string } | null)?.nombre ?? "" },
      { header: "Tipo", value: (r) => r.tipo },
      { header: "Estado", value: (r) => r.estado },
      { header: "Total (S/)", value: (r) => r.total },
    ];
  } else if (recurso === "caja") {
    const { data } = await conFechas(
      supabase.from("caja_movimientos").select("fecha, tipo, categoria, descripcion, monto")
    ).order("fecha", { ascending: false });
    rows = data ?? [];
    cols = [
      { header: "Fecha", value: (r) => fmtFecha(r.fecha) },
      { header: "Tipo", value: (r) => r.tipo },
      { header: "Categoría", value: (r) => r.categoria ?? "" },
      { header: "Descripción", value: (r) => r.descripcion ?? "" },
      { header: "Monto (S/)", value: (r) => r.monto },
    ];
  } else if (recurso === "inventario") {
    const { data } = await conFechas(
      supabase
        .from("inventario_movimientos")
        .select("fecha, tipo, cantidad, motivo, productos(nombre)")
    ).order("fecha", { ascending: false });
    rows = data ?? [];
    cols = [
      { header: "Fecha", value: (r) => fmtFecha(r.fecha) },
      { header: "Producto", value: (r) => (r.productos as { nombre?: string } | null)?.nombre ?? "" },
      { header: "Tipo", value: (r) => r.tipo },
      { header: "Cantidad (kg)", value: (r) => r.cantidad },
      { header: "Motivo", value: (r) => r.motivo ?? "" },
    ];
  } else {
    return new Response("Recurso no válido", { status: 400 });
  }

  return new Response(csv(rows, cols), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${nombre}${rango}-amt.csv"`,
    },
  });
}
