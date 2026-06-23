import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { crearCliente, eliminarCliente } from "../acciones";
import { Eliminar } from "../../_components/eliminar";
import { esDueno } from "@/lib/auth/esDueno";

export default async function Clientes() {
  const supabase = await createClient();
  const admin = await esDueno();
  const { data: clientes } = await supabase
    .from("clientes")
    .select("id, nombre, doc, tipo, pais, contacto")
    .order("nombre");

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Clientes</h1>
        <Link href="/ventas" className="text-sm text-[#8a5a2c] underline">
          ← Volver a ventas
        </Link>
      </div>

      <section className="bg-white border border-gray-200 rounded-2xl p-4">
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
            <button className="bg-cacao-grad text-white rounded-full px-5 py-2.5 font-semibold shadow-md w-full">
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
          <div className="overflow-x-auto bg-white border border-gray-200 rounded-2xl">
            <table className="w-full min-w-[600px] text-sm">
              <thead className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-600">
                <tr>
                  <th className="p-2">Nombre</th>
                  <th className="p-2">Doc</th>
                  <th className="p-2">Tipo</th>
                  <th className="p-2">País</th>
                  <th className="p-2">Contacto</th>
                  <th className="p-2">Acciones</th>
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
                    <td className="p-2">
                      <div className="flex items-center gap-3">
                        <Link
                          href={`/ventas/clientes/${c.id}/editar`}
                          className="text-[#8a5a2c] underline"
                        >
                          Editar
                        </Link>
                        {admin && (
                          <Eliminar
                            action={eliminarCliente.bind(null, c.id)}
                            mensaje="¿Eliminar este cliente?"
                          />
                        )}
                      </div>
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
