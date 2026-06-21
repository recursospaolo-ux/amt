import { createClient } from "@/lib/supabase/server";
import { soles } from "@/lib/format";

export default async function Catalogo() {
  const supabase = await createClient();
  const { data: productos } = await supabase
    .from("productos")
    .select("id, nombre, categoria, descripcion, precio_referencial")
    .eq("visible_web", true)
    .order("nombre");

  return (
    <main className="max-w-4xl mx-auto p-8">
      <h1 className="text-2xl font-semibold">Catálogo</h1>
      {!productos || productos.length === 0 ? (
        <p className="mt-4 text-gray-600">
          Próximamente publicaremos nuestros productos de cacao.
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
          {productos.map((p) => (
            <article key={p.id} className="bg-white border rounded-lg p-4">
              <h2 className="font-semibold text-green-900">{p.nombre}</h2>
              {p.categoria && (
                <div className="text-xs text-gray-500 mt-0.5">{p.categoria}</div>
              )}
              {p.descripcion && (
                <p className="text-sm text-gray-700 mt-2">{p.descripcion}</p>
              )}
              {p.precio_referencial != null && (
                <div className="mt-3 font-medium text-green-800">
                  {soles(p.precio_referencial)}
                </div>
              )}
            </article>
          ))}
        </div>
      )}
    </main>
  );
}
