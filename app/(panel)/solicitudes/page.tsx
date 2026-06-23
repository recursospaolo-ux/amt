import { createClient } from "@/lib/supabase/server";
import { aprobarUsuario, rechazarUsuario } from "./acciones";

export default async function Solicitudes() {
  const supabase = await createClient();
  const { data: pendientes } = await supabase
    .from("usuarios")
    .select("id, nombre, correo, dni, tipo, creado_en")
    .eq("estado", "pendiente")
    .order("creado_en");

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-4">Solicitudes de acceso</h1>
      {(!pendientes || pendientes.length === 0) && (
        <p className="text-gray-600">No hay solicitudes pendientes.</p>
      )}
      <ul className="space-y-4">
        {pendientes?.map((u) => (
          <li key={u.id} className="bg-white border border-gray-200 rounded-2xl p-4">
            <p className="font-medium">
              {u.nombre || "(sin nombre)"} — {u.correo}
            </p>
            <p className="text-sm text-gray-600">
              DNI: {u.dni || "—"}
              {u.tipo && (
                <span className="ml-2 rounded bg-[#efe7db] text-[#8a5a2c] px-2 py-0.5 text-xs capitalize">
                  {u.tipo}
                </span>
              )}
            </p>
            <form
              action={async (formData: FormData) => {
                "use server";
                await aprobarUsuario(u.id, {
                  acopio: formData.get("acopio") === "on",
                  inventario: formData.get("inventario") === "on",
                  caja: formData.get("caja") === "on",
                  ventas: formData.get("ventas") === "on",
                  pagos: formData.get("pagos") === "on",
                });
              }}
              className="mt-3 flex flex-wrap items-center gap-4"
            >
              <label className="text-sm">
                <input type="checkbox" name="acopio" defaultChecked className="mr-1" />
                Acopio
              </label>
              <label className="text-sm">
                <input type="checkbox" name="inventario" defaultChecked className="mr-1" />
                Inventario
              </label>
              <label className="text-sm">
                <input type="checkbox" name="caja" defaultChecked className="mr-1" />
                Caja
              </label>
              <label className="text-sm">
                <input type="checkbox" name="ventas" defaultChecked className="mr-1" />
                Ventas
              </label>
              <label className="text-sm">
                <input type="checkbox" name="pagos" defaultChecked={u.tipo === "cajero"} className="mr-1" />
                Cajero (pagos)
              </label>
              <button className="bg-cacao-grad text-white rounded-full px-4 py-1.5 font-semibold text-sm">
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
