import Link from "next/link";
import { ShoppingCart, Package, Users, Clock } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { soles, kg, fecha } from "@/lib/format";

export default async function Dashboard() {
  const supabase = await createClient();

  const desde = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);

  const [
    { data: lotesSemana },
    { data: stock },
    { count: nProductores },
    { count: nPendientes },
    { data: recientes },
    { data: caja },
  ] = await Promise.all([
    supabase.from("lotes_acopio").select("peso_kg").gte("fecha", desde),
    supabase.from("stock_actual").select("categoria, cantidad"),
    supabase.from("productores").select("id", { count: "exact", head: true }),
    supabase
      .from("usuarios")
      .select("id", { count: "exact", head: true })
      .eq("estado", "pendiente"),
    supabase
      .from("lotes_acopio")
      .select("codigo, fecha, estado_recepcion, peso_kg, monto_total, productores(nombre)")
      .order("creado_en", { ascending: false })
      .limit(5),
    supabase.from("caja_movimientos").select("tipo, monto"),
  ]);

  const saldo = (caja ?? []).reduce(
    (a, m) => a + (m.tipo === "ingreso" ? Number(m.monto) : -Number(m.monto)),
    0
  );
  const ingresos = (caja ?? [])
    .filter((m) => m.tipo === "ingreso")
    .reduce((a, m) => a + Number(m.monto), 0);
  const egresos = (caja ?? [])
    .filter((m) => m.tipo === "egreso")
    .reduce((a, m) => a + Number(m.monto), 0);
  const kgSemana = (lotesSemana ?? []).reduce((a, l) => a + Number(l.peso_kg), 0);
  const inventarioTotal = (stock ?? []).reduce((a, s) => a + Number(s.cantidad), 0);
  const porTipo = (stock ?? []).filter((s) => Number(s.cantidad) > 0);
  const maxTipo = Math.max(1, ...porTipo.map((s) => Number(s.cantidad)));

  const tarjetas = [
    { label: "KG acopiados (semana)", valor: kg(kgSemana), icon: ShoppingCart, grad: "linear-gradient(135deg,#8a5a2c,#b6803c)" },
    { label: "Inventario total", valor: kg(inventarioTotal), icon: Package, grad: "linear-gradient(135deg,#c98a2a,#e0a32e)" },
    { label: "Productores", valor: String(nProductores ?? 0), icon: Users, grad: "linear-gradient(135deg,#2f8f5b,#5bbd83)" },
    { label: "Usuarios pendientes", valor: String(nPendientes ?? 0), icon: Clock, grad: "linear-gradient(135deg,#b5532a,#e07a3e)" },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-1">Resumen de AMT Agroindustria</p>
      </div>

      <div
        className="rounded-2xl p-6 text-white shadow-md flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
        style={{ backgroundImage: "linear-gradient(135deg,#5f3a18,#8a5a2c,#c98a2a)" }}
      >
        <div>
          <div className="text-sm uppercase tracking-wide text-white/85">Saldo en caja</div>
          <div className="text-4xl font-extrabold mt-1">{soles(saldo)}</div>
          <div className="text-xs text-white/80 mt-2">
            Ingresos {soles(ingresos)} · Egresos {soles(egresos)}
          </div>
        </div>
        <Link
          href="/caja"
          className="self-start bg-white/20 hover:bg-white/30 transition-colors text-white font-semibold rounded-full px-5 py-2.5"
        >
          Gestionar dinero →
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {tarjetas.map((t) => {
          const Icon = t.icon;
          return (
            <div
              key={t.label}
              className="rounded-2xl p-5 text-white shadow-md"
              style={{ backgroundImage: t.grad }}
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-xs uppercase tracking-wide text-white/85">
                    {t.label}
                  </div>
                  <div className="text-3xl font-extrabold mt-2">{t.valor}</div>
                </div>
                <Icon className="text-white/80" size={28} />
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl p-6">
        <h2 className="font-semibold mb-4">Inventario por tipo</h2>
        {porTipo.length === 0 ? (
          <p className="text-sm text-gray-600">
            Aún no hay stock. Registrá y clasificá lotes para verlo aquí.
          </p>
        ) : (
          <div className="flex items-end gap-8 h-48">
            {porTipo.map((s) => (
              <div key={s.categoria} className="flex flex-col items-center flex-1 max-w-[160px]">
                <div className="text-sm font-medium text-gray-700 mb-1">
                  {new Intl.NumberFormat("es-PE").format(Number(s.cantidad))} kg
                </div>
                <div
                  className="w-full bg-cacao-grad rounded-t"
                  style={{ height: `${(Number(s.cantidad) / maxTipo) * 100}%` }}
                />
                <div className="text-xs text-gray-600 mt-2 text-center">{s.categoria}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold">Compras recientes</h2>
          <Link href="/acopio" className="text-sm text-[#8a5a2c] hover:underline">
            Ver todas →
          </Link>
        </div>
        {!recientes || recientes.length === 0 ? (
          <p className="text-sm text-gray-600">Aún no hay compras registradas.</p>
        ) : (
          <div className="overflow-x-auto bg-white border border-gray-200 rounded-2xl">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-600">
                <tr>
                  <th className="p-3">Código</th>
                  <th className="p-3">Fecha</th>
                  <th className="p-3">Productor</th>
                  <th className="p-3">Tipo</th>
                  <th className="p-3">Peso</th>
                  <th className="p-3 text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {recientes.map((l, i) => {
                  const prod = l.productores as { nombre?: string } | null;
                  return (
                    <tr key={i} className="border-t border-gray-100">
                      <td className="p-3 font-mono">{l.codigo}</td>
                      <td className="p-3">{fecha(l.fecha)}</td>
                      <td className="p-3">{prod?.nombre ?? "—"}</td>
                      <td className="p-3">
                        <span className="rounded bg-[#efe7db] text-[#8a5a2c] px-2 py-0.5 text-xs">
                          {l.estado_recepcion}
                        </span>
                      </td>
                      <td className="p-3">{kg(l.peso_kg)}</td>
                      <td className="p-3 text-right font-medium">{soles(l.monto_total)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
