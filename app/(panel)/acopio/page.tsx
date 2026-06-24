import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { soles, kg, fechaHora } from "@/lib/format";
import { eliminarLote } from "./acciones";
import { Eliminar } from "../_components/eliminar";
import { NuevaCompra } from "./NuevaCompra";
import { esDueno } from "@/lib/auth/esDueno";

export default async function Acopio() {
  const supabase = await createClient();
  const admin = await esDueno();
  const { data: productores } = await supabase
    .from("productores")
    .select("id, nombre, dni")
    .order("nombre");
  const { data: lotes } = await supabase
    .from("lotes_acopio")
    .select("id, codigo, fecha, creado_en, estado_recepcion, peso_kg, monto_total, estado, productores(nombre)")
    .order("creado_en", { ascending: false });

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Compras y Acopio</h1>
          <p className="text-gray-600 mt-1">Registro de compras de cacao</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <a
            href="/api/export/compras"
            className="text-sm border border-[#8a5a2c] text-[#8a5a2c] rounded-lg px-4 py-2 hover:bg-[#efe7db]"
          >
            Exportar Excel
          </a>
          <Link
            href="/acopio/productores"
            className="text-sm bg-cacao-grad hover:brightness-110 text-white rounded-lg px-4 py-2"
          >
            Productores
          </Link>
        </div>
      </div>

      <section className="bg-white border border-gray-200 rounded-2xl p-4">
        <h2 className="font-medium mb-1">Nueva compra de cacao</h2>
        <p className="text-xs text-gray-600 mb-3">
          Queda <b>pendiente de pago</b>: el cajero la confirma y recién ahí se
          descuenta de la caja. Necesita saldo suficiente en caja.
        </p>
        <NuevaCompra productores={productores ?? []} />
      </section>

      <section>
        <h2 className="font-medium mb-3">Lotes</h2>
        {!lotes || lotes.length === 0 ? (
          <p className="text-sm text-gray-600">Aún no hay lotes registrados.</p>
        ) : (
          <div className="overflow-x-auto bg-white border border-gray-200 rounded-2xl">
            <table className="w-full min-w-[600px] text-sm">
              <thead className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-600">
                <tr>
                  <th className="p-2">Código</th>
                  <th className="p-2">Productor</th>
                  <th className="p-2">Fecha y hora</th>
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
                      <td className="p-2">{fechaHora(l.creado_en)}</td>
                      <td className="p-2">{l.estado_recepcion}</td>
                      <td className="p-2">{kg(l.peso_kg)}</td>
                      <td className="p-2">{soles(l.monto_total)}</td>
                      <td className="p-2">
                        <span className="rounded bg-[#efe7db] text-[#8a5a2c] px-2 py-0.5 text-xs">
                          {l.estado}
                        </span>
                      </td>
                      <td className="p-2">
                        <div className="flex items-center gap-3">
                          <Link href={`/acopio/${l.id}`} className="text-[#8a5a2c] underline">
                            Ver
                          </Link>
                          {admin && (
                            <Eliminar
                              action={eliminarLote.bind(null, l.id)}
                              mensaje="¿Eliminar este lote? Se quitará también su stock del inventario."
                            />
                          )}
                        </div>
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
