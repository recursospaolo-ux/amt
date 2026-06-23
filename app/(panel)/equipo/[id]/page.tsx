import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { soles, kg, fechaHora } from "@/lib/format";

export default async function TrabajadorDetalle({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: t } = await supabase
    .from("usuarios")
    .select("id, nombre, correo, dni, tipo, estado")
    .eq("id", id)
    .single();
  if (!t) notFound();

  const [{ data: compras }, { data: movs }, { data: ventas }] = await Promise.all([
    supabase
      .from("lotes_acopio")
      .select("id, codigo, fecha, creado_en, peso_kg, monto_total, estado_recepcion, productores(nombre)")
      .eq("creado_por", id)
      .order("creado_en", { ascending: false }),
    supabase
      .from("caja_movimientos")
      .select("tipo, categoria, monto, descripcion, fecha, creado_en")
      .eq("creado_por", id)
      .order("creado_en", { ascending: false }),
    supabase
      .from("ventas")
      .select("codigo, fecha, total")
      .eq("creado_por", id)
      .order("creado_en", { ascending: false }),
  ]);

  const totalComprado = (compras ?? []).reduce((a, c) => a + Number(c.monto_total), 0);
  const totalGastos = (movs ?? [])
    .filter((m) => m.tipo === "egreso")
    .reduce((a, m) => a + Number(m.monto), 0);
  const totalVendido = (ventas ?? []).reduce((a, v) => a + Number(v.total), 0);

  const tarjetas = [
    { label: "Compras", valor: String(compras?.length ?? 0), grad: "linear-gradient(135deg,#8a5a2c,#b6803c)" },
    { label: "Total comprado", valor: soles(totalComprado), grad: "linear-gradient(135deg,#c98a2a,#e0a32e)" },
    { label: "Gastos (caja)", valor: soles(totalGastos), grad: "linear-gradient(135deg,#b5532a,#e07a3e)" },
    { label: "Ventas", valor: soles(totalVendido), grad: "linear-gradient(135deg,#2f8f5b,#5bbd83)" },
  ];

  return (
    <div className="space-y-6">
      <Link href="/equipo" className="text-sm text-[#8a5a2c] underline">
        ← Volver al equipo
      </Link>
      <div>
        <h1 className="text-3xl font-bold text-gray-900">{t.nombre || "(sin nombre)"}</h1>
        <p className="text-gray-600 mt-1">
          {t.correo} · DNI {t.dni || "—"} · {t.tipo || "trabajador"} · {t.estado}
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {tarjetas.map((c) => (
          <div key={c.label} className="rounded-2xl p-5 text-white shadow-md" style={{ backgroundImage: c.grad }}>
            <div className="text-xs uppercase tracking-wide text-white/85">{c.label}</div>
            <div className="text-2xl font-extrabold mt-1">{c.valor}</div>
          </div>
        ))}
      </div>

      <section>
        <h2 className="font-semibold mb-3">Historial de compras</h2>
        {!compras || compras.length === 0 ? (
          <p className="text-sm text-gray-600">Sin compras registradas.</p>
        ) : (
          <div className="overflow-x-auto bg-white border border-gray-200 rounded-2xl">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-600">
                <tr>
                  <th className="p-3">Fecha y hora</th>
                  <th className="p-3">Código</th>
                  <th className="p-3">Proveedor</th>
                  <th className="p-3">Peso</th>
                  <th className="p-3 text-right">Monto</th>
                </tr>
              </thead>
              <tbody>
                {compras.map((c) => {
                  const prod = c.productores as { nombre?: string } | null;
                  return (
                    <tr key={c.id} className="border-t border-gray-100">
                      <td className="p-3">{fechaHora(c.creado_en)}</td>
                      <td className="p-3 font-mono">{c.codigo}</td>
                      <td className="p-3">{prod?.nombre ?? "—"}</td>
                      <td className="p-3">{kg(c.peso_kg)}</td>
                      <td className="p-3 text-right font-medium">{soles(c.monto_total)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section>
        <h2 className="font-semibold mb-3">Movimientos de dinero</h2>
        {!movs || movs.length === 0 ? (
          <p className="text-sm text-gray-600">Sin movimientos de caja.</p>
        ) : (
          <div className="overflow-x-auto bg-white border border-gray-200 rounded-2xl">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-600">
                <tr>
                  <th className="p-3">Fecha y hora</th>
                  <th className="p-3">Tipo</th>
                  <th className="p-3">Categoría</th>
                  <th className="p-3">Descripción</th>
                  <th className="p-3 text-right">Monto</th>
                </tr>
              </thead>
              <tbody>
                {movs.map((m, i) => (
                  <tr key={i} className="border-t border-gray-100">
                    <td className="p-3">{fechaHora(m.creado_en)}</td>
                    <td className="p-3">
                      <span className={m.tipo === "ingreso" ? "text-green-700" : "text-red-600"}>
                        {m.tipo}
                      </span>
                    </td>
                    <td className="p-3">{m.categoria ?? "—"}</td>
                    <td className="p-3">{m.descripcion ?? "—"}</td>
                    <td className="p-3 text-right font-medium">
                      {m.tipo === "ingreso" ? "+" : "−"} {soles(m.monto)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
