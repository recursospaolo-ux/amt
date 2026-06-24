"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MoreVertical, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export function MenuConversacion({ otherId }: { otherId: string }) {
  const router = useRouter();
  const supabase = createClient();
  const [abierto, setAbierto] = useState(false);
  const [busy, setBusy] = useState(false);

  async function eliminarConversacion() {
    setAbierto(false);
    if (!window.confirm("¿Eliminar toda la conversación de tu vista? La otra persona la seguirá viendo.")) return;
    setBusy(true);
    const { error } = await supabase.rpc("chat_eliminar_conversacion", { p_otro: otherId });
    setBusy(false);
    if (error) {
      alert("No se pudo eliminar: " + error.message);
      return;
    }
    router.push("/chat");
    router.refresh();
  }

  return (
    <div className="relative">
      <button
        onClick={() => setAbierto((v) => !v)}
        disabled={busy}
        className="text-gray-600 hover:text-[#8a5a2c] p-1"
        aria-label="Opciones"
      >
        <MoreVertical size={20} />
      </button>
      {abierto && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setAbierto(false)} />
          <div className="absolute right-0 mt-1 z-20 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden min-w-[200px]">
            <button
              onClick={eliminarConversacion}
              className="flex items-center gap-2 w-full text-left px-4 py-3 text-sm text-red-600 hover:bg-red-50"
            >
              <Trash2 size={16} />
              Eliminar conversación
            </button>
          </div>
        </>
      )}
    </div>
  );
}
