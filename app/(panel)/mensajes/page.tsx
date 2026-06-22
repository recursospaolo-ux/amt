import { createClient } from "@/lib/supabase/server";
import { fecha } from "@/lib/format";

export default async function Mensajes() {
  const supabase = await createClient();
  const { data: mensajes } = await supabase
    .from("contacto_mensajes")
    .select("nombre, correo, mensaje, creado_en")
    .order("creado_en", { ascending: false });

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Mensajes de contacto</h1>
      {!mensajes || mensajes.length === 0 ? (
        <p className="text-sm text-gray-600">No hay mensajes todavía.</p>
      ) : (
        <ul className="space-y-3">
          {mensajes.map((m, i) => (
            <li key={i} className="bg-white border border-gray-200 rounded-2xl p-4">
              <div className="flex items-center justify-between">
                <span className="font-medium">{m.nombre || "(sin nombre)"}</span>
                <span className="text-xs text-gray-600">{fecha(m.creado_en)}</span>
              </div>
              <div className="text-sm text-gray-600">{m.correo}</div>
              <p className="text-sm mt-2">{m.mensaje}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
