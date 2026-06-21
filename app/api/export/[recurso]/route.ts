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

const fecha = (s: unknown) => (s ? new Date(String(s)).toLocaleDateString("es-PE") : "");

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ recurso: string }> }
) {
  const { recurso } = await params;
  const supabase = await createClient();

  let rows: Record<string, unknown>[] = [];
  let cols: Col[] = [];
  let nombre = recurso;

  if (recurso === "compras" || recurso === "lotes") {
    nombre = "compras";
    const { data } = await supabase
      .from("lotes_acopio")
      .select("codigo, fecha, estado_recepcion, peso_kg, humedad, precio_kg, monto_total, estado, productores(nombre)")
      .order("creado_en", { ascending: false });
    rows = data ?? [];
    cols = [
      { header: "Código", value: (r) => r.codigo },
      { header: "Fecha", value: (r) => fecha(r.fecha) },
      { header: "Productor", value: (r) => (r.productores as { nombre?: string } | null)?.nombre ?? "" },
      { header: "Recepción", value: (r) => r.estado_recepcion },
      { header: "Peso (kg)", value: (r) => r.peso_kg },
      { header: "Humedad (%)", value: (r) => r.humedad ?? "" },
      { header: "Precio/kg (S/)", value: (r) => r.precio_kg },
      { header: "Monto total (S/)", value: (r) => r.monto_total },
      { header: "Estado", value: (r) => r.estado },
    ];
  } else if (recurso === "ventas") {
    const { data } = await supabase
      .from("ventas")
      .select("codigo, fecha, tipo, estado, total, clientes(nombre)")
      .order("creado_en", { ascending: false });
    rows = data ?? [];
    cols = [
      { header: "Código", value: (r) => r.codigo },
      { header: "Fecha", value: (r) => fecha(r.fecha) },
      { header: "Cliente", value: (r) => (r.clientes as { nombre?: string } | null)?.nombre ?? "" },
      { header: "Tipo", value: (r) => r.tipo },
      { header: "Estado", value: (r) => r.estado },
      { header: "Total (S/)", value: (r) => r.total },
    ];
  } else if (recurso === "caja") {
    const { data } = await supabase
      .from("caja_movimientos")
      .select("fecha, tipo, categoria, descripcion, monto")
      .order("creado_en", { ascending: false });
    rows = data ?? [];
    cols = [
      { header: "Fecha", value: (r) => fecha(r.fecha) },
      { header: "Tipo", value: (r) => r.tipo },
      { header: "Categoría", value: (r) => r.categoria ?? "" },
      { header: "Descripción", value: (r) => r.descripcion ?? "" },
      { header: "Monto (S/)", value: (r) => r.monto },
    ];
  } else {
    return new Response("Recurso no válido", { status: 400 });
  }

  return new Response(csv(rows, cols), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${nombre}-amt.csv"`,
    },
  });
}
