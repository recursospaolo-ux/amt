import { createClient } from "@/lib/supabase/server";
import { soles, fechaHora } from "@/lib/format";

const COLOR: Record<string, string> = {
  compra: "bg-[#efe7db] text-[#8a5a2c]",
  venta: "bg-[#e6f7ec] text-[#137a3a]",
  dinero: "bg-[#fdeede] text-[#9a6a1a]",
  inventario: "bg-[#eef2ff] text-[#3949ab]",
};

export default async function Actividad({
  searchParams,
}: {
  searchParams: Promise<{ desde?: string; hasta?: string }>;
}) {
  const sp = await searchParams;
  const supabase = await createClient();

  let q = supabase
    .from("actividad")
    .select("actor_nombre, rol, tipo, descripcion, monto, creado_en")
    .order("creado_en", { ascending: false })
    .limit(300);
  if (sp.desde) q = q.gte("fecha", sp.desde);
  if (sp.hasta) q = q.lte("fecha", sp.hasta);
  const { data: items } = await q;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Actividad del equipo</h1>
        <p className="text-gray-600 mt-1">
          Historial permanente de todos los movimientos. Queda registrado aunque
          después se borre el movimiento.
        </p>
      </div>

      <form method="get" className="bg-white border border-gray-200 rounded-2xl p-4 flex flex-wrap items-end gap-3">
        <label className="text-sm">
          Desde
          <input type="date" name="desde" defaultValue={sp.desde ?? ""} className="block w-full border rounded p-2 mt-1" />
        </label>
        <label className="text-sm">
          Hasta
          <input type="date" name="hasta" defaultValue={sp.hasta ?? ""} className="block w-full border rounded p-2 mt-1" />
        </label>
        <button className="bg-cacao-grad text-white rounded-full px-5 py-2.5 font-semibold shadow-md">
          Filtrar
        </button>
        <a href="/api/export/caja" className="text-sm text-[#8a5a2c] underline self-center">
          (exportar dinero en Dinero/Reportes)
        </a>
      </form>

      {!items || items.length === 0 ? (
        <p className="text-sm text-gray-600">Aún no hay actividad registrada.</p>
      ) : (
        <div className="overflow-x-auto bg-white border border-gray-200 rounded-2xl">
          <table className="w-full min-w-[600px] text-sm">
            <thead className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-600">
              <tr>
                <th className="p-3">Fecha y hora</th>
                <th className="p-3">Quién</th>
                <th className="p-3">Tipo</th>
                <th className="p-3">Detalle</th>
                <th className="p-3 text-right">Monto</th>
              </tr>
            </thead>
            <tbody>
              {items.map((a, i) => (
                <tr key={i} className="border-t border-gray-100">
                  <td className="p-3 whitespace-nowrap">{fechaHora(a.creado_en)}</td>
                  <td className="p-3">
                    {a.actor_nombre || "—"}
                    <span className="text-xs text-gray-500"> · {a.rol === "dueno" ? "admin" : a.rol}</span>
                  </td>
                  <td className="p-3">
                    <span className={`rounded px-2 py-0.5 text-xs capitalize ${COLOR[a.tipo ?? ""] ?? "bg-gray-100 text-gray-700"}`}>
                      {a.tipo}
                    </span>
                  </td>
                  <td className="p-3">{a.descripcion}</td>
                  <td className="p-3 text-right font-medium">{a.monto != null ? soles(a.monto) : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
