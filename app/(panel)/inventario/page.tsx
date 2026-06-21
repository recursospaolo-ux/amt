import { createClient } from "@/lib/supabase/server";
import { kg, fecha } from "@/lib/format";
import { crearProducto, crearMovimiento } from "./acciones";

export default async function Inventario() {
  const supabase = await createClient();
  const { data: stock } = await supabase
    .from("stock_actual")
    .select("producto_id, nombre, categoria, unidad, cantidad")
    .order("nombre");
  const { data: productos } = await supabase
    .from("productos")
    .select("id, nombre")
    .order("nombre");
  const { data: movimientos } = await supabase
    .from("inventario_movimientos")
    .select("tipo, cantidad, motivo, fecha, productos(nombre)")
    .order("creado_en", { ascending: false })
    .limit(20);

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold text-gray-900">Inventario y producción</h1>

      <section>
        <h2 className="font-medium mb-3">Stock actual</h2>
        <div className="overflow-x-auto bg-white border border-gray-200 rounded-xl">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
              <tr>
                <th className="p-2">Producto</th>
                <th className="p-2">Categoría</th>
                <th className="p-2">Cantidad</th>
              </tr>
            </thead>
            <tbody>
              {stock?.map((s) => (
                <tr key={s.producto_id} className="border-t">
                  <td className="p-2">{s.nombre}</td>
                  <td className="p-2">{s.categoria ?? "—"}</td>
                  <td className="p-2 font-medium">
                    {new Intl.NumberFormat("es-PE").format(Number(s.cantidad) || 0)} {s.unidad}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section className="bg-white border border-gray-200 rounded-xl p-4">
          <h2 className="font-medium mb-3">Nuevo movimiento</h2>
          <form action={crearMovimiento} className="space-y-3">
            <label className="text-sm block">
              Producto
              <select name="producto_id" required className="w-full border rounded p-2 mt-1">
                {productos?.map((p) => (
                  <option key={p.id} value={p.id}>{p.nombre}</option>
                ))}
              </select>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="text-sm">
                Tipo
                <select name="tipo" required className="w-full border rounded p-2 mt-1">
                  <option value="entrada">Entrada</option>
                  <option value="salida">Salida</option>
                  <option value="ajuste">Ajuste</option>
                  <option value="merma">Merma</option>
                </select>
              </label>
              <label className="text-sm">
                Cantidad
                <input name="cantidad" type="number" step="0.01" min="0.01" required className="w-full border rounded p-2 mt-1" />
              </label>
            </div>
            <label className="text-sm block">
              Motivo
              <input name="motivo" className="w-full border rounded p-2 mt-1" />
            </label>
            <button className="bg-[#8a5a2c] text-white rounded px-4 py-2">Registrar</button>
          </form>
        </section>

        <section className="bg-white border border-gray-200 rounded-xl p-4">
          <h2 className="font-medium mb-3">Nuevo producto</h2>
          <form action={crearProducto} className="space-y-3">
            <label className="text-sm block">
              Nombre
              <input name="nombre" required className="w-full border rounded p-2 mt-1" />
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="text-sm">
                Categoría
                <input name="categoria" placeholder="chocolate, chifles…" className="w-full border rounded p-2 mt-1" />
              </label>
              <label className="text-sm">
                Unidad
                <input name="unidad" defaultValue="kg" className="w-full border rounded p-2 mt-1" />
              </label>
            </div>
            <label className="text-sm flex items-center gap-2">
              <input name="es_para_venta" type="checkbox" defaultChecked />
              Se vende
            </label>
            <button className="bg-[#8a5a2c] text-white rounded px-4 py-2">Crear producto</button>
          </form>
        </section>
      </div>

      <section>
        <h2 className="font-medium mb-3">Últimos movimientos</h2>
        {!movimientos || movimientos.length === 0 ? (
          <p className="text-sm text-gray-600">Sin movimientos todavía.</p>
        ) : (
          <div className="overflow-x-auto bg-white border border-gray-200 rounded-xl">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
                <tr>
                  <th className="p-2">Fecha</th>
                  <th className="p-2">Producto</th>
                  <th className="p-2">Tipo</th>
                  <th className="p-2">Cantidad</th>
                  <th className="p-2">Motivo</th>
                </tr>
              </thead>
              <tbody>
                {movimientos.map((m, i) => {
                  const p = m.productos as { nombre?: string } | null;
                  return (
                    <tr key={i} className="border-t">
                      <td className="p-2">{fecha(m.fecha)}</td>
                      <td className="p-2">{p?.nombre ?? "—"}</td>
                      <td className="p-2">{m.tipo}</td>
                      <td className="p-2">{kg(m.cantidad)}</td>
                      <td className="p-2">{m.motivo ?? "—"}</td>
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
