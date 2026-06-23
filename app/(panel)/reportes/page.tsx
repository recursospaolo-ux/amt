import { ArrowDownToLine, ArrowUpFromLine, Wallet, Package } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { soles, kg, fecha, fechaHora } from "@/lib/format";

export default async function Reportes({
  searchParams,
}: {
  searchParams: Promise<{ desde?: string; hasta?: string }>;
}) {
  const sp = await searchParams;
  // Fechas calculadas en zona horaria de Perú
  const hoy = new Date().toLocaleDateString("en-CA", { timeZone: "America/Lima" });
  const base = new Date(hoy + "T00:00:00");
  const lunes = new Date(base);
  lunes.setDate(base.getDate() - ((base.getDay() + 6) % 7));
  const inicioSemana = lunes.toISOString().slice(0, 10);
  const inicioMes = hoy.slice(0, 8) + "01";
  const desde = sp.desde || hoy;
  const hasta = sp.hasta || hoy;

  const rangos = [
    { label: "Hoy", d: hoy, h: hoy },
    { label: "Esta semana", d: inicioSemana, h: hoy },
    { label: "Este mes", d: inicioMes, h: hoy },
  ];

  const supabase = await createClient();
  const [{ data: caja }, { data: inv }, { data: compras }, { data: ventas }] =
    await Promise.all([
      supabase
        .from("caja_movimientos")
        .select("fecha, creado_en, tipo, categoria, descripcion, monto")
        .gte("fecha", desde)
        .lte("fecha", hasta)
        .order("creado_en", { ascending: false }),
      supabase
        .from("inventario_movimientos")
        .select("fecha, creado_en, tipo, cantidad, motivo, productos(nombre)")
        .gte("fecha", desde)
        .lte("fecha", hasta)
        .order("creado_en", { ascending: false }),
      supabase
        .from("lotes_acopio")
        .select("codigo, fecha, peso_kg, monto_total, productores(nombre)")
        .gte("fecha", desde)
        .lte("fecha", hasta)
        .order("creado_en", { ascending: false }),
      supabase
        .from("ventas")
        .select("total")
        .gte("fecha", desde)
        .lte("fecha", hasta),
    ]);

  const cacaoEntra = (inv ?? [])
    .filter((m) => m.tipo === "entrada" || m.tipo === "ajuste")
    .reduce((a, m) => a + Number(m.cantidad), 0);
  const cacaoSale = (inv ?? [])
    .filter((m) => m.tipo === "salida" || m.tipo === "merma")
    .reduce((a, m) => a + Number(m.cantidad), 0);
  const dineroEntra = (caja ?? [])
    .filter((m) => m.tipo === "ingreso")
    .reduce((a, m) => a + Number(m.monto), 0);
  const dineroSale = (caja ?? [])
    .filter((m) => m.tipo === "egreso")
    .reduce((a, m) => a + Number(m.monto), 0);
  const comprasMonto = (compras ?? []).reduce((a, c) => a + Number(c.monto_total), 0);
  const ventasMonto = (ventas ?? []).reduce((a, v) => a + Number(v.total), 0);

  const q = `?desde=${desde}&hasta=${hasta}`;
  const cards = [
    { label: "Cacao ingresó", valor: kg(cacaoEntra), icon: ArrowDownToLine, grad: "linear-gradient(135deg,#2f8f5b,#5bbd83)" },
    { label: "Cacao salió", valor: kg(cacaoSale), icon: ArrowUpFromLine, grad: "linear-gradient(135deg,#b5532a,#e07a3e)" },
    { label: "Dinero ingresó", valor: soles(dineroEntra), icon: Wallet, grad: "linear-gradient(135deg,#8a5a2c,#b6803c)" },
    { label: "Dinero salió", valor: soles(dineroSale), icon: Package, grad: "linear-gradient(135deg,#c98a2a,#e0a32e)" },
  ];

  const mismoDia = desde === hasta;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Reportes</h1>
        <p className="text-gray-600 mt-1">
          {mismoDia ? `Día ${fecha(desde)}` : `Del ${fecha(desde)} al ${fecha(hasta)}`}
        </p>
      </div>

      {/* Rangos rápidos */}
      <div className="flex flex-wrap gap-2">
        {rangos.map((r) => {
          const activo = desde === r.d && hasta === r.h;
          return (
            <Link
              key={r.label}
              href={`/reportes?desde=${r.d}&hasta=${r.h}`}
              className={`text-sm rounded-full px-4 py-2 font-semibold ${
                activo
                  ? "bg-cacao-grad text-white shadow-md"
                  : "border border-[#8a5a2c] text-[#8a5a2c] hover:bg-[#efe7db]"
              }`}
            >
              {r.label}
            </Link>
          );
        })}
      </div>

      {/* Filtro por fecha y hora personalizado */}
      <form method="get" className="bg-white border border-gray-200 rounded-2xl p-4 flex flex-wrap items-end gap-3">
        <label className="text-sm">
          Desde
          <input type="date" name="desde" defaultValue={desde} className="block w-full border rounded p-2 mt-1" />
        </label>
        <label className="text-sm">
          Hasta
          <input type="date" name="hasta" defaultValue={hasta} className="block w-full border rounded p-2 mt-1" />
        </label>
        <button className="bg-cacao-grad text-white rounded-full px-5 py-2.5 font-semibold shadow-md">
          Filtrar
        </button>
      </form>

      {/* Resumen */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((c) => {
          const Icon = c.icon;
          return (
            <div key={c.label} className="rounded-2xl p-5 text-white shadow-md" style={{ backgroundImage: c.grad }}>
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-xs uppercase tracking-wide text-white/85">{c.label}</div>
                  <div className="text-2xl font-extrabold mt-1">{c.valor}</div>
                </div>
                <Icon className="text-white/80" size={26} />
              </div>
            </div>
          );
        })}
      </div>

      <div className="text-sm text-gray-700">
        Compras del periodo: <span className="font-semibold">{soles(comprasMonto)}</span> ·
        Ventas del periodo: <span className="font-semibold">{soles(ventasMonto)}</span>
      </div>

      {/* Exportar */}
      <div className="flex flex-wrap gap-2">
        <a href={`/api/export/caja${q}`} className="text-sm border border-[#8a5a2c] text-[#8a5a2c] rounded-lg px-4 py-2 hover:bg-[#efe7db]">Exportar dinero (Excel)</a>
        <a href={`/api/export/inventario${q}`} className="text-sm border border-[#8a5a2c] text-[#8a5a2c] rounded-lg px-4 py-2 hover:bg-[#efe7db]">Exportar cacao (Excel)</a>
        <a href={`/api/export/compras${q}`} className="text-sm border border-[#8a5a2c] text-[#8a5a2c] rounded-lg px-4 py-2 hover:bg-[#efe7db]">Exportar compras (Excel)</a>
        <a href={`/api/export/ventas${q}`} className="text-sm border border-[#8a5a2c] text-[#8a5a2c] rounded-lg px-4 py-2 hover:bg-[#efe7db]">Exportar ventas (Excel)</a>
      </div>

      {/* Movimientos de dinero */}
      <section>
        <h2 className="font-semibold mb-3">Movimientos de dinero</h2>
        {!caja || caja.length === 0 ? (
          <p className="text-sm text-gray-600">Sin movimientos de dinero en este periodo.</p>
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
                {caja.map((m, i) => (
                  <tr key={i} className="border-t border-gray-100">
                    <td className="p-3">{fechaHora(m.creado_en)}</td>
                    <td className="p-3">
                      <span className={m.tipo === "ingreso" ? "text-green-700" : "text-red-600"}>{m.tipo}</span>
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

      {/* Movimientos de cacao */}
      <section>
        <h2 className="font-semibold mb-3">Movimientos de cacao (inventario)</h2>
        {!inv || inv.length === 0 ? (
          <p className="text-sm text-gray-600">Sin movimientos de cacao en este periodo.</p>
        ) : (
          <div className="overflow-x-auto bg-white border border-gray-200 rounded-2xl">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-600">
                <tr>
                  <th className="p-3">Fecha y hora</th>
                  <th className="p-3">Producto</th>
                  <th className="p-3">Tipo</th>
                  <th className="p-3 text-right">Cantidad</th>
                  <th className="p-3">Motivo</th>
                </tr>
              </thead>
              <tbody>
                {inv.map((m, i) => {
                  const p = m.productos as { nombre?: string } | null;
                  return (
                    <tr key={i} className="border-t border-gray-100">
                      <td className="p-3">{fechaHora(m.creado_en)}</td>
                      <td className="p-3">{p?.nombre ?? "—"}</td>
                      <td className="p-3">{m.tipo}</td>
                      <td className="p-3 text-right">{kg(m.cantidad)}</td>
                      <td className="p-3">{m.motivo ?? "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
