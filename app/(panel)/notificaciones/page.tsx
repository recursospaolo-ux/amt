import { ShoppingCart } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { fecha } from "@/lib/format";
import { MarcarLeidas } from "./MarcarLeidas";

export default async function Notificaciones() {
  const supabase = await createClient();
  const { data: notis } = await supabase
    .from("notificaciones")
    .select("id, mensaje, leida, creado_en")
    .order("creado_en", { ascending: false })
    .limit(100);

  const hayNoLeidas = (notis ?? []).some((n) => !n.leida);

  return (
    <div className="space-y-6 max-w-2xl">
      <MarcarLeidas hayNoLeidas={hayNoLeidas} />
      <h1 className="text-3xl font-bold text-gray-900">Notificaciones</h1>

      {!notis || notis.length === 0 ? (
        <p className="text-gray-600">No hay notificaciones todavía.</p>
      ) : (
        <ul className="space-y-2">
          {notis.map((n) => (
            <li
              key={n.id}
              className={`rounded-2xl p-4 border flex items-start gap-3 ${
                n.leida ? "bg-white border-gray-200" : "bg-[#faf3e8] border-[#e6dccb]"
              }`}
            >
              <span
                className="w-9 h-9 rounded-full flex items-center justify-center text-white shrink-0"
                style={{ backgroundImage: "linear-gradient(135deg,#8a5a2c,#e0a32e)" }}
              >
                <ShoppingCart size={18} />
              </span>
              <div>
                <p className="text-sm text-gray-800">{n.mensaje}</p>
                <p className="text-xs text-gray-500 mt-1">{fecha(n.creado_en)}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
