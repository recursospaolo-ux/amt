import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { actualizarProductor } from "../../../acciones";

export default async function EditarProductor({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: p } = await supabase
    .from("productores")
    .select("id, nombre, dni, zona, telefono, organico")
    .eq("id", id)
    .single();
  if (!p) notFound();

  return (
    <div className="max-w-xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Editar productor</h1>
        <Link href="/acopio/productores" className="text-sm text-[#8a5a2c] underline">
          ← Volver
        </Link>
      </div>

      <form
        action={actualizarProductor.bind(null, p.id)}
        className="bg-white border border-gray-200 rounded-2xl p-4 grid grid-cols-1 sm:grid-cols-2 gap-3"
      >
        <label className="text-sm">
          Nombre
          <input
            name="nombre"
            required
            defaultValue={p.nombre ?? ""}
            className="w-full border rounded p-2 mt-1"
          />
        </label>
        <label className="text-sm">
          DNI
          <input name="dni" defaultValue={p.dni ?? ""} className="w-full border rounded p-2 mt-1" />
        </label>
        <label className="text-sm">
          Zona / comunidad
          <input name="zona" defaultValue={p.zona ?? ""} className="w-full border rounded p-2 mt-1" />
        </label>
        <label className="text-sm">
          Teléfono
          <input
            name="telefono"
            defaultValue={p.telefono ?? ""}
            className="w-full border rounded p-2 mt-1"
          />
        </label>
        <label className="text-sm flex items-center gap-2 mt-2">
          <input name="organico" type="checkbox" defaultChecked={p.organico} />
          Productor orgánico / certificado
        </label>
        <div className="flex items-end">
          <button className="bg-cacao-grad hover:brightness-110 text-white rounded-full px-5 py-2.5 font-semibold shadow-md w-full">
            Guardar cambios
          </button>
        </div>
      </form>
    </div>
  );
}
