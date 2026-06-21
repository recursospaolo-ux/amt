import { createClient } from "@/lib/supabase/server";
import { soles, fecha } from "@/lib/format";
import { crearMovimientoCaja } from "./acciones";

const CATEGORIAS = [
  "venta",
  "compra cacao",
  "pago productor",
  "gasto operativo",
  "sueldo",
  "otro",
];

export default async function Caja() {
  const supabase = await createClient();
  const { data: movimientos } = await supabase
    .from("caja_movimientos")
    .select("tipo, categoria, monto, descripcion, fecha")
    .order("creado_en", { ascending: false });

  const saldo = (movimientos ?? []).reduce(
    (acc, m) => acc + (m.tipo === "ingreso" ? Number(m.monto) : -Number(m.monto)),
    0
  );
  const ingresos = (movimientos ?? [])
    .filter((m) => m.tipo === "ingreso")
    .reduce((a, m) => a + Number(m.monto), 0);
  const egresos = (movimientos ?? [])
    .filter((m) => m.tipo === "egreso")
    .reduce((a, m) => a + Number(m.monto), 0);

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-semibold">Caja</h1>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border rounded-lg p-4">
          <div className="text-sm text-gray-500">Saldo</div>
          <div className="text-2xl font-semibold">{soles(saldo)}</div>
        </div>
        <div className="bg-white border rounded-lg p-4">
          <div className="text-sm text-gray-500">Ingresos</div>
          <div className="text-2xl font-semibold text-green-700">{soles(ingresos)}</div>
        </div>
        <div className="bg-white border rounded-lg p-4">
          <div className="text-sm text-gray-500">Egresos</div>
          <div className="text-2xl font-semibold text-red-600">{soles(egresos)}</div>
        </div>
      </div>

      <section className="bg-white border rounded-lg p-4">
        <h2 className="font-medium mb-3">Nuevo movimiento</h2>
        <form action={crearMovimientoCaja} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <label className="text-sm">
            Tipo
            <select name="tipo" required className="w-full border rounded p-2 mt-1">
              <option value="ingreso">Ingreso</option>
              <option value="egreso">Egreso</option>
            </select>
          </label>
          <label className="text-sm">
            Categoría
            <select name="categoria" className="w-full border rounded p-2 mt-1">
              {CATEGORIAS.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </label>
          <label className="text-sm">
            Monto (S/)
            <input name="monto" type="number" step="0.01" min="0" required className="w-full border rounded p-2 mt-1" />
          </label>
          <label className="text-sm">
            Descripción
            <input name="descripcion" className="w-full border rounded p-2 mt-1" />
          </label>
          <div className="flex items-end sm:col-span-2">
            <button className="bg-green-700 text-white rounded px-4 py-2">Registrar</button>
          </div>
        </form>
      </section>

      <section>
        <h2 className="font-medium mb-3">Movimientos</h2>
        {!movimientos || movimientos.length === 0 ? (
          <p className="text-sm text-gray-600">Sin movimientos todavía.</p>
        ) : (
          <div className="overflow-x-auto bg-white border rounded-lg">
            <table className="w-full text-sm">
              <thead className="bg-gray-100 text-left">
                <tr>
                  <th className="p-2">Fecha</th>
                  <th className="p-2">Tipo</th>
                  <th className="p-2">Categoría</th>
                  <th className="p-2">Descripción</th>
                  <th className="p-2 text-right">Monto</th>
                </tr>
              </thead>
              <tbody>
                {movimientos.map((m, i) => (
                  <tr key={i} className="border-t">
                    <td className="p-2">{fecha(m.fecha)}</td>
                    <td className="p-2">
                      <span className={m.tipo === "ingreso" ? "text-green-700" : "text-red-600"}>
                        {m.tipo}
                      </span>
                    </td>
                    <td className="p-2">{m.categoria ?? "—"}</td>
                    <td className="p-2">{m.descripcion ?? "—"}</td>
                    <td className="p-2 text-right font-medium">
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
