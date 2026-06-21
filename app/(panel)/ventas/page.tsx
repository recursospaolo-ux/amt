import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { soles, fecha } from "@/lib/format";
import { VentaForm } from "./VentaForm";
import { eliminarVenta } from "./acciones";
import { Eliminar } from "../_components/eliminar";

export default async function Ventas() {
  const supabase = await createClient();
  const { data: clientes } = await supabase
    .from("clientes")
    .select("id, nombre")
    .order("nombre");
  const { data: productos } = await supabase
    .from("productos")
    .select("id, nombre")
    .eq("es_para_venta", true)
    .order("nombre");
  const { data: ventas } = await supabase
    .from("ventas")
    .select("id, codigo, fecha, tipo, estado, total, clientes(nombre)")
    .order("creado_en", { ascending: false });

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Ventas</h1>
        <div className="flex gap-2">
          <a
            href="/api/export/ventas"
            className="text-sm border border-[#8a5a2c] text-[#8a5a2c] rounded-lg px-4 py-2 hover:bg-[#efe7db]"
          >
            Exportar Excel
          </a>
          <Link
            href="/ventas/clientes"
            className="text-sm bg-[#8a5a2c] hover:bg-[#6f4722] text-white rounded-lg px-4 py-2"
          >
            Clientes
          </Link>
        </div>
      </div>

      <section className="bg-white border border-gray-200 rounded-xl p-4">
        <h2 className="font-medium mb-3">Nueva venta</h2>
        <VentaForm clientes={clientes ?? []} productos={productos ?? []} />
      </section>

      <section>
        <h2 className="font-medium mb-3">Ventas registradas</h2>
        {!ventas || ventas.length === 0 ? (
          <p className="text-sm text-gray-600">Aún no hay ventas.</p>
        ) : (
          <div className="overflow-x-auto bg-white border border-gray-200 rounded-xl">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
                <tr>
                  <th className="p-2">Código</th>
                  <th className="p-2">Fecha</th>
                  <th className="p-2">Cliente</th>
                  <th className="p-2">Tipo</th>
                  <th className="p-2">Estado</th>
                  <th className="p-2 text-right">Total</th>
                  <th className="p-2"></th>
                </tr>
              </thead>
              <tbody>
                {ventas.map((v) => {
                  const c = v.clientes as { nombre?: string } | null;
                  return (
                    <tr key={v.id} className="border-t">
                      <td className="p-2 font-mono">{v.codigo}</td>
                      <td className="p-2">{fecha(v.fecha)}</td>
                      <td className="p-2">{c?.nombre ?? "—"}</td>
                      <td className="p-2">{v.tipo}</td>
                      <td className="p-2">
                        <span className="rounded bg-[#efe7db] text-[#8a5a2c] px-2 py-0.5 text-xs">
                          {v.estado}
                        </span>
                      </td>
                      <td className="p-2 text-right font-medium">{soles(v.total)}</td>
                      <td className="p-2 text-right">
                        <Eliminar
                          action={eliminarVenta.bind(null, v.id)}
                          mensaje="¿Eliminar esta venta? Se devolverá el stock y se quitará el ingreso de caja."
                        />
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
