import { createClient } from "@/lib/supabase/server";
import { aprobarUsuario, rechazarUsuario } from "./acciones";

export default async function Solicitudes() {
  const supabase = await createClient();
  const { data: pendientes } = await supabase
    .from("usuarios")
    .select("id, nombre, correo, creado_en")
    .eq("estado", "pendiente")
    .order("creado_en");

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-4">Solicitudes de acceso</h1>
      {(!pendientes || pendientes.length === 0) && (
        <p className="text-gray-600">No hay solicitudes pendientes.</p>
      )}
      <ul className="space-y-4">
        {pendientes?.map((u) => (
          <li key={u.id} className="bg-white border rounded-lg p-4">
            <p className="font-medium">
              {u.nombre || "(sin nombre)"} — {u.correo}
            </p>
            <form
              action={async (formData: FormData) => {
                "use server";
                await aprobarUsuario(u.id, {
                  acopio: formData.get("acopio") === "on",
                  inventario: formData.get("inventario") === "on",
                  caja: formData.get("caja") === "on",
                  ventas: formData.get("ventas") === "on",
                });
              }}
              className="mt-3 flex flex-wrap items-center gap-4"
            >
              <label className="text-sm">
                <input type="checkbox" name="acopio" className="mr-1" />
                Acopio
              </label>
              <label className="text-sm">
                <input type="checkbox" name="inventario" className="mr-1" />
                Inventario
              </label>
              <label className="text-sm">
                <input type="checkbox" name="caja" className="mr-1" />
                Caja
              </label>
              <label className="text-sm">
                <input type="checkbox" name="ventas" className="mr-1" />
                Ventas
              </label>
              <button className="bg-green-700 text-white rounded px-3 py-1 text-sm">
                Aprobar
              </button>
            </form>
            <form
              action={async () => {
                "use server";
                await rechazarUsuario(u.id);
              }}
              className="mt-2"
            >
              <button className="text-red-600 text-sm hover:underline">
                Rechazar
              </button>
            </form>
          </li>
        ))}
      </ul>
    </div>
  );
}
