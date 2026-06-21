import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { soles, fecha } from "@/lib/format";
import { VentaForm } from "./VentaForm";

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
        <h1 className="text-2xl font-semibold">Ventas</h1>
        <Link href="/ventas/clientes" className="text-sm bg-green-700 text-white rounded px-3 py-1">
          Clientes
        </Link>
      </div>

      <section className="bg-white border rounded-lg p-4">
        <h2 className="font-medium mb-3">Nueva venta</h2>
        <VentaForm clientes={clientes ?? []} productos={productos ?? []} />
      </section>

      <section>
        <h2 className="font-medium mb-3">Ventas registradas</h2>
        {!ventas || ventas.length === 0 ? (
          <p className="text-sm text-gray-600">Aún no hay ventas.</p>
        ) : (
          <div className="overflow-x-auto bg-white border rounded-lg">
            <table className="w-full text-sm">
              <thead className="bg-gray-100 text-left">
                <tr>
                  <th className="p-2">Código</th>
                  <th className="p-2">Fecha</th>
                  <th className="p-2">Cliente</th>
                  <th className="p-2">Tipo</th>
                  <th className="p-2">Estado</th>
                  <th className="p-2 text-right">Total</th>
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
                        <span className="rounded bg-green-100 text-green-800 px-2 py-0.5 text-xs">
                          {v.estado}
                        </span>
                      </td>
                      <td className="p-2 text-right font-medium">{soles(v.total)}</td>
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
