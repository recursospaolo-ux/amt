import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { soles, kg, fecha } from "@/lib/format";
import { crearLote } from "./acciones";

export default async function Acopio() {
  const supabase = await createClient();
  const { data: productores } = await supabase
    .from("productores")
    .select("id, nombre")
    .order("nombre");
  const { data: lotes } = await supabase
    .from("lotes_acopio")
    .select("id, codigo, fecha, estado_recepcion, peso_kg, monto_total, estado, productores(nombre)")
    .order("creado_en", { ascending: false });

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Acopio y trazabilidad</h1>
        <Link
          href="/acopio/productores"
          className="text-sm bg-green-700 text-white rounded px-3 py-1"
        >
          Productores
        </Link>
      </div>

      <section className="bg-white border rounded-lg p-4">
        <h2 className="font-medium mb-3">Nuevo acopio (compra de grano)</h2>
        {!productores || productores.length === 0 ? (
          <p className="text-sm text-gray-600">
            Primero registrá un{" "}
            <Link href="/acopio/productores" className="text-green-700 underline">
              productor
            </Link>
            .
          </p>
        ) : (
          <form action={crearLote} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="text-sm">
              Productor
              <select name="productor_id" required className="w-full border rounded p-2 mt-1">
                {productores.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nombre}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm">
              Estado de recepción
              <select name="estado_recepcion" required className="w-full border rounded p-2 mt-1">
                <option value="baba">En baba (fresco)</option>
                <option value="seco">Seco</option>
              </select>
            </label>
            <label className="text-sm">
              Peso (kg)
              <input name="peso_kg" type="number" step="0.01" min="0.01" required className="w-full border rounded p-2 mt-1" />
            </label>
            <label className="text-sm">
              Humedad (%) <span className="text-gray-400">(opcional)</span>
              <input name="humedad" type="number" step="0.1" min="0" className="w-full border rounded p-2 mt-1" />
            </label>
            <label className="text-sm">
              Precio por kg (S/)
              <input name="precio_kg" type="number" step="0.01" min="0" required className="w-full border rounded p-2 mt-1" />
            </label>
            <div className="flex items-end">
              <button className="bg-green-700 text-white rounded px-4 py-2 w-full">
                Registrar acopio
              </button>
            </div>
          </form>
        )}
      </section>

      <section>
        <h2 className="font-medium mb-3">Lotes</h2>
        {!lotes || lotes.length === 0 ? (
          <p className="text-sm text-gray-600">Aún no hay lotes registrados.</p>
        ) : (
          <div className="overflow-x-auto bg-white border rounded-lg">
            <table className="w-full text-sm">
              <thead className="bg-gray-100 text-left">
                <tr>
                  <th className="p-2">Código</th>
                  <th className="p-2">Productor</th>
                  <th className="p-2">Fecha</th>
                  <th className="p-2">Recepción</th>
                  <th className="p-2">Peso</th>
                  <th className="p-2">Monto</th>
                  <th className="p-2">Estado</th>
                  <th className="p-2"></th>
                </tr>
              </thead>
              <tbody>
                {lotes.map((l) => {
                  const prod = l.productores as { nombre?: string } | null;
                  return (
                    <tr key={l.id} className="border-t">
                      <td className="p-2 font-mono">{l.codigo}</td>
                      <td className="p-2">{prod?.nombre ?? "—"}</td>
                      <td className="p-2">{fecha(l.fecha)}</td>
                      <td className="p-2">{l.estado_recepcion}</td>
                      <td className="p-2">{kg(l.peso_kg)}</td>
                      <td className="p-2">{soles(l.monto_total)}</td>
                      <td className="p-2">
                        <span className="rounded bg-green-100 text-green-800 px-2 py-0.5 text-xs">
                          {l.estado}
                        </span>
                      </td>
                      <td className="p-2">
                        <Link href={`/acopio/${l.id}`} className="text-green-700 underline">
                          Ver
                        </Link>
                      </td>
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
