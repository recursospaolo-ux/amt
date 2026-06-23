import { createClient } from "@/lib/supabase/server";
import { soles, fechaHora } from "@/lib/format";
import { crearMovimientoCaja, eliminarMovimientoCaja } from "./acciones";
import { Eliminar } from "../_components/eliminar";

const CATEGORIAS = [
  "aporte de capital",
  "venta",
  "compra cacao",
  "pago productor",
  "servicio externo",
  "gasto operativo",
  "sueldo",
  "otro",
];

export default async function Caja() {
  const supabase = await createClient();
  const { data: movimientos } = await supabase
    .from("caja_movimientos")
    .select("id, tipo, categoria, monto, descripcion, fecha, creado_en")
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
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Dinero</h1>
        <a
          href="/api/export/caja"
          className="text-sm border border-[#8a5a2c] text-[#8a5a2c] rounded-lg px-4 py-2 hover:bg-[#efe7db]"
        >
          Exportar Excel
        </a>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-gray-200 rounded-2xl p-4">
          <div className="text-sm text-gray-600">Saldo</div>
          <div className="text-3xl font-bold text-gray-900">{soles(saldo)}</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-2xl p-4">
          <div className="text-sm text-gray-600">Ingresos</div>
          <div className="text-3xl font-bold text-gray-900 text-[#8a5a2c]">{soles(ingresos)}</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-2xl p-4">
          <div className="text-sm text-gray-600">Egresos</div>
          <div className="text-3xl font-bold text-gray-900 text-red-600">{soles(egresos)}</div>
        </div>
      </div>

      <section className="bg-white border border-gray-200 rounded-2xl p-4">
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
            <button className="bg-cacao-grad text-white rounded-full px-5 py-2.5 font-semibold shadow-md">Registrar</button>
          </div>
        </form>
      </section>

      <section>
        <h2 className="font-medium mb-3">Movimientos</h2>
        {!movimientos || movimientos.length === 0 ? (
          <p className="text-sm text-gray-600">Sin movimientos todavía.</p>
        ) : (
          <div className="overflow-x-auto bg-white border border-gray-200 rounded-2xl">
            <table className="w-full min-w-[600px] text-sm">
              <thead className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-600">
                <tr>
                  <th className="p-2">Fecha y hora</th>
                  <th className="p-2">Tipo</th>
                  <th className="p-2">Categoría</th>
                  <th className="p-2">Descripción</th>
                  <th className="p-2 text-right">Monto</th>
                  <th className="p-2"></th>
                </tr>
              </thead>
              <tbody>
                {movimientos.map((m, i) => (
                  <tr key={i} className="border-t">
                    <td className="p-2">{fechaHora(m.creado_en)}</td>
                    <td className="p-2">
                      <span className={m.tipo === "ingreso" ? "text-[#8a5a2c]" : "text-red-600"}>
                        {m.tipo}
                      </span>
                    </td>
                    <td className="p-2">{m.categoria ?? "—"}</td>
                    <td className="p-2">{m.descripcion ?? "—"}</td>
                    <td className="p-2 text-right font-medium">
                      {m.tipo === "ingreso" ? "+" : "−"} {soles(m.monto)}
                    </td>
                    <td className="p-2 text-right">
                      <Eliminar
                        action={eliminarMovimientoCaja.bind(null, m.id)}
                        mensaje="¿Eliminar este movimiento de caja?"
                      />
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
