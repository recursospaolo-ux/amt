import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { actualizarCliente } from "../../../acciones";

export default async function EditarCliente({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: c } = await supabase
    .from("clientes")
    .select("id, nombre, doc, tipo, pais, contacto")
    .eq("id", id)
    .single();
  if (!c) notFound();

  return (
    <div className="max-w-xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Editar cliente</h1>
        <Link href="/ventas/clientes" className="text-sm text-[#8a5a2c] underline">
          ← Volver
        </Link>
      </div>

      <form
        action={actualizarCliente.bind(null, c.id)}
        className="bg-white border border-gray-200 rounded-xl p-4 grid grid-cols-1 sm:grid-cols-2 gap-3"
      >
        <label className="text-sm">
          Nombre / razón social
          <input
            name="nombre"
            required
            defaultValue={c.nombre ?? ""}
            className="w-full border rounded p-2 mt-1"
          />
        </label>
        <label className="text-sm">
          RUC / DNI
          <input name="doc" defaultValue={c.doc ?? ""} className="w-full border rounded p-2 mt-1" />
        </label>
        <label className="text-sm">
          Tipo
          <select
            name="tipo"
            defaultValue={c.tipo ?? "local"}
            className="w-full border rounded p-2 mt-1"
          >
            <option value="local">Local</option>
            <option value="exportacion">Exportación</option>
          </select>
        </label>
        <label className="text-sm">
          País
          <input name="pais" defaultValue={c.pais ?? ""} className="w-full border rounded p-2 mt-1" />
        </label>
        <label className="text-sm sm:col-span-2">
          Contacto (teléfono / correo)
          <input
            name="contacto"
            defaultValue={c.contacto ?? ""}
            className="w-full border rounded p-2 mt-1"
          />
        </label>
        <div className="flex items-end">
          <button className="bg-[#8a5a2c] hover:bg-[#6f4722] text-white rounded px-4 py-2 w-full">
            Guardar cambios
          </button>
        </div>
      </form>
    </div>
  );
}
