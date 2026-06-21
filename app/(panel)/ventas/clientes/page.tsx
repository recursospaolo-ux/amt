import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { crearCliente } from "../acciones";

export default async function Clientes() {
  const supabase = await createClient();
  const { data: clientes } = await supabase
    .from("clientes")
    .select("id, nombre, doc, tipo, pais, contacto")
    .order("nombre");

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Clientes</h1>
        <Link href="/ventas" className="text-sm text-green-700 underline">
          ← Volver a ventas
        </Link>
      </div>

      <section className="bg-white border rounded-lg p-4">
        <h2 className="font-medium mb-3">Nuevo cliente</h2>
        <form action={crearCliente} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <label className="text-sm">
            Nombre / razón social
            <input name="nombre" required className="w-full border rounded p-2 mt-1" />
          </label>
          <label className="text-sm">
            RUC / DNI
            <input name="doc" className="w-full border rounded p-2 mt-1" />
          </label>
          <label className="text-sm">
            Tipo
            <select name="tipo" className="w-full border rounded p-2 mt-1">
              <option value="local">Local</option>
              <option value="exportacion">Exportación</option>
            </select>
          </label>
          <label className="text-sm">
            País
            <input name="pais" defaultValue="Perú" className="w-full border rounded p-2 mt-1" />
          </label>
          <label className="text-sm sm:col-span-2">
            Contacto (teléfono / correo)
            <input name="contacto" className="w-full border rounded p-2 mt-1" />
          </label>
          <div className="flex items-end">
            <button className="bg-green-700 text-white rounded px-4 py-2 w-full">
              Guardar cliente
            </button>
          </div>
        </form>
      </section>

      <section>
        <h2 className="font-medium mb-3">Listado</h2>
        {!clientes || clientes.length === 0 ? (
          <p className="text-sm text-gray-600">Aún no hay clientes.</p>
        ) : (
          <div className="overflow-x-auto bg-white border rounded-lg">
            <table className="w-full text-sm">
              <thead className="bg-gray-100 text-left">
                <tr>
                  <th className="p-2">Nombre</th>
                  <th className="p-2">Doc</th>
                  <th className="p-2">Tipo</th>
                  <th className="p-2">País</th>
                  <th className="p-2">Contacto</th>
                </tr>
              </thead>
              <tbody>
                {clientes.map((c) => (
                  <tr key={c.id} className="border-t">
                    <td className="p-2">{c.nombre}</td>
                    <td className="p-2">{c.doc ?? "—"}</td>
                    <td className="p-2">{c.tipo}</td>
                    <td className="p-2">{c.pais ?? "—"}</td>
                    <td className="p-2">{c.contacto ?? "—"}</td>
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
