import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { fechaHora } from "@/lib/format";

type Contacto = {
  id: string;
  nombre: string;
  rol: string;
  no_leidos: number;
  ultimo: string | null;
  ultimo_en: string | null;
};

export default async function Chat() {
  const supabase = await createClient();
  const { data } = await supabase.rpc("chat_contactos");
  const contactos = ((data ?? []) as Contacto[]).sort((a, b) => {
    if (!a.ultimo_en) return 1;
    if (!b.ultimo_en) return -1;
    return a.ultimo_en < b.ultimo_en ? 1 : -1;
  });

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Chat del equipo</h1>
        <p className="text-gray-600 mt-1">
          Conversá con el equipo y enviá fotos de boletas o comprobantes.
        </p>
      </div>

      {contactos.length === 0 ? (
        <p className="text-sm text-gray-600">Todavía no hay otros miembros del equipo.</p>
      ) : (
        <ul className="bg-white border border-gray-200 rounded-2xl divide-y divide-gray-100 overflow-hidden">
          {contactos.map((c) => (
            <li key={c.id}>
              <Link href={`/chat/${c.id}`} className="flex items-center gap-3 p-4 hover:bg-[#faf3e8]">
                <span
                  className="w-11 h-11 rounded-full flex items-center justify-center text-white font-bold shrink-0"
                  style={{ backgroundImage: "linear-gradient(135deg,#8a5a2c,#e0a32e)" }}
                >
                  {(c.nombre || "?").charAt(0).toUpperCase()}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium text-gray-900 truncate">
                      {c.nombre}
                      <span className="text-xs text-gray-400 font-normal ml-1">
                        {c.rol === "dueno" ? "admin" : "equipo"}
                      </span>
                    </span>
                    {c.ultimo_en && (
                      <span className="text-[11px] text-gray-400 shrink-0">{fechaHora(c.ultimo_en)}</span>
                    )}
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm text-gray-500 truncate">{c.ultimo || "Iniciar conversación"}</span>
                    {c.no_leidos > 0 && (
                      <span className="bg-red-600 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] px-1 flex items-center justify-center shrink-0">
                        {c.no_leidos > 9 ? "9+" : c.no_leidos}
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
