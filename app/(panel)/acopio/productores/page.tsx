import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { crearProductor, eliminarProductor } from "../acciones";
import { Eliminar } from "../../_components/eliminar";
import { esDueno } from "@/lib/auth/esDueno";

export default async function Productores() {
  const supabase = await createClient();
  const admin = await esDueno();
  const { data: productores } = await supabase
    .from("productores")
    .select("id, nombre, dni, zona, telefono, organico")
    .order("nombre");

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Productores</h1>
        <Link href="/acopio" className="text-sm text-[#8a5a2c] underline">
          ← Volver a acopio
        </Link>
      </div>

      <section className="bg-white border border-gray-200 rounded-2xl p-4">
        <h2 className="font-medium mb-3">Nuevo productor</h2>
        <form action={crearProductor} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <label className="text-sm">
            Nombre
            <input name="nombre" required className="w-full border rounded p-2 mt-1" />
          </label>
          <label className="text-sm">
            DNI
            <input name="dni" className="w-full border rounded p-2 mt-1" />
          </label>
          <label className="text-sm">
            Zona / comunidad
            <input name="zona" className="w-full border rounded p-2 mt-1" />
          </label>
          <label className="text-sm">
            Teléfono
            <input name="telefono" className="w-full border rounded p-2 mt-1" />
          </label>
          <label className="text-sm flex items-center gap-2 mt-2">
            <input name="organico" type="checkbox" />
            Productor orgánico / certificado
          </label>
          <div className="flex items-end">
            <button className="bg-cacao-grad text-white rounded-full px-5 py-2.5 font-semibold shadow-md w-full">
              Guardar productor
            </button>
          </div>
        </form>
      </section>

      <section>
        <h2 className="font-medium mb-3">Listado</h2>
        {!productores || productores.length === 0 ? (
          <p className="text-sm text-gray-600">Aún no hay productores.</p>
        ) : (
          <div className="overflow-x-auto bg-white border border-gray-200 rounded-2xl">
            <table className="w-full min-w-[600px] text-sm">
              <thead className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-600">
                <tr>
                  <th className="p-2">Nombre</th>
                  <th className="p-2">DNI</th>
                  <th className="p-2">Zona</th>
                  <th className="p-2">Teléfono</th>
                  <th className="p-2">Orgánico</th>
                  <th className="p-2">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {productores.map((p) => (
                  <tr key={p.id} className="border-t">
                    <td className="p-2">{p.nombre}</td>
                    <td className="p-2">{p.dni ?? "—"}</td>
                    <td className="p-2">{p.zona ?? "—"}</td>
                    <td className="p-2">{p.telefono ?? "—"}</td>
                    <td className="p-2">{p.organico ? "Sí" : "No"}</td>
                    <td className="p-2">
                      <div className="flex items-center gap-3">
                        <Link
                          href={`/acopio/productores/${p.id}/editar`}
                          className="text-[#8a5a2c] underline"
                        >
                          Editar
                        </Link>
                        {admin && (
                          <Eliminar
                            action={eliminarProductor.bind(null, p.id)}
                            mensaje="¿Eliminar este productor?"
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
