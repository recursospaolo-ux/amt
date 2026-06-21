import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { crearProductor } from "../acciones";

export default async function Productores() {
  const supabase = await createClient();
  const { data: productores } = await supabase
    .from("productores")
    .select("id, nombre, dni, zona, telefono, organico")
    .order("nombre");

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Productores</h1>
        <Link href="/acopio" className="text-sm text-green-700 underline">
          ← Volver a acopio
        </Link>
      </div>

      <section className="bg-white border rounded-lg p-4">
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
            <button className="bg-green-700 text-white rounded px-4 py-2 w-full">
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
          <div className="overflow-x-auto bg-white border rounded-lg">
            <table className="w-full text-sm">
              <thead className="bg-gray-100 text-left">
                <tr>
                  <th className="p-2">Nombre</th>
                  <th className="p-2">DNI</th>
                  <th className="p-2">Zona</th>
                  <th className="p-2">Teléfono</th>
                  <th className="p-2">Orgánico</th>
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
