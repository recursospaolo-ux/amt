import { createClient } from "@/lib/supabase/server";
import { guardarCatalogo } from "./acciones";

export default async function CatalogoWeb() {
  const supabase = await createClient();
  const { data: productos } = await supabase
    .from("productos")
    .select("id, nombre, categoria, descripcion, precio_referencial, visible_web")
    .order("nombre");

  return (
    <div className="space-y-6 max-w-3xl">
      <h1 className="text-2xl font-semibold">Catálogo web</h1>
      <p className="text-sm text-gray-600">
        Elegí qué productos se muestran en el sitio público, con su descripción y
        precio referencial.
      </p>

      {productos?.map((p) => (
        <form
          key={p.id}
          action={guardarCatalogo.bind(null, p.id)}
          className="bg-white border rounded-lg p-4 space-y-3"
        >
          <div className="flex items-center justify-between">
            <div>
              <span className="font-medium">{p.nombre}</span>
              {p.categoria && (
                <span className="text-xs text-gray-500 ml-2">{p.categoria}</span>
              )}
            </div>
            <label className="text-sm flex items-center gap-2">
              <input type="checkbox" name="visible_web" defaultChecked={p.visible_web} />
              Visible en web
            </label>
          </div>
          <label className="text-sm block">
            Descripción
            <textarea
              name="descripcion"
              defaultValue={p.descripcion ?? ""}
              rows={2}
              className="w-full border rounded p-2 mt-1"
            />
          </label>
          <div className="flex items-end gap-3">
            <label className="text-sm">
              Precio referencial (S/)
              <input
                name="precio_referencial"
                type="number"
                step="0.01"
                min="0"
                defaultValue={p.precio_referencial ?? ""}
                className="w-full border rounded p-2 mt-1"
              />
            </label>
            <button className="bg-green-700 text-white rounded px-4 py-2">Guardar</button>
          </div>
        </form>
      ))}
    </div>
  );
}
