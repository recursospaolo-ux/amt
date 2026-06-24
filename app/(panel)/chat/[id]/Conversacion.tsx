"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ImagePlus, Send, MoreVertical } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { fechaHora } from "@/lib/format";

type Msg = {
  id: string;
  de: string;
  para: string;
  texto: string | null;
  imagen_url: string | null;
  eliminado_todos?: boolean;
  oculto_para?: string[];
  creado_en: string;
};

export function Conversacion({
  meId,
  otherId,
  initial,
}: {
  meId: string;
  otherId: string;
  initial: Msg[];
}) {
  const router = useRouter();
  const supabase = createClient();
  const [mensajes, setMensajes] = useState<Msg[]>(initial);
  const [texto, setTexto] = useState("");
  const [subiendo, setSubiendo] = useState(false);
  const [menuId, setMenuId] = useState<string | null>(null);
  const finRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    finRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [mensajes]);

  async function marcarLeido() {
    await supabase
      .from("mensajes_chat")
      .update({ leido: true })
      .eq("de", otherId)
      .eq("para", meId)
      .eq("leido", false);
    router.refresh();
  }

  function aplicar(m: Msg) {
    setMensajes((prev) => {
      if ((m.oculto_para ?? []).includes(meId)) return prev.filter((x) => x.id !== m.id);
      if (prev.some((x) => x.id === m.id)) return prev.map((x) => (x.id === m.id ? m : x));
      return [...prev, m];
    });
  }

  useEffect(() => {
    marcarLeido();
    const enConv = (m: Msg) =>
      (m.de === otherId && m.para === meId) || (m.de === meId && m.para === otherId);
    const canal = supabase
      .channel(`chat-${meId}-${otherId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "mensajes_chat" }, (p) => {
        const m = p.new as Msg;
        if (!enConv(m)) return;
        aplicar(m);
        if (m.de === otherId) marcarLeido();
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "mensajes_chat" }, (p) => {
        const m = p.new as Msg;
        if (!enConv(m)) return;
        aplicar(m);
      })
      .subscribe();
    return () => {
      supabase.removeChannel(canal);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [meId, otherId]);

  async function enviarTexto() {
    const t = texto.trim();
    if (!t) return;
    setTexto("");
    const { data, error } = await supabase
      .from("mensajes_chat")
      .insert({ de: meId, para: otherId, texto: t })
      .select()
      .single();
    if (error) {
      alert("No se pudo enviar: " + error.message);
      setTexto(t);
      return;
    }
    aplicar(data as Msg);
  }

  async function subirFoto(file: File) {
    setSubiendo(true);
    const limpio = file.name.replace(/[^a-zA-Z0-9.\-_]/g, "_");
    const path = `${meId}/${Date.now()}-${limpio}`;
    const up = await supabase.storage.from("chat").upload(path, file);
    if (up.error) {
      alert("No se pudo subir la foto: " + up.error.message);
      setSubiendo(false);
      return;
    }
    const url = supabase.storage.from("chat").getPublicUrl(path).data.publicUrl;
    const { data, error } = await supabase
      .from("mensajes_chat")
      .insert({ de: meId, para: otherId, imagen_url: url })
      .select()
      .single();
    setSubiendo(false);
    if (error) {
      alert("No se pudo enviar la foto: " + error.message);
      return;
    }
    aplicar(data as Msg);
  }

  async function eliminarParaMi(id: string) {
    setMenuId(null);
    setMensajes((prev) => prev.filter((x) => x.id !== id));
    await supabase.rpc("chat_eliminar_para_mi", { p_msg: id });
  }

  async function eliminarParaTodos(id: string) {
    setMenuId(null);
    setMensajes((prev) =>
      prev.map((x) => (x.id === id ? { ...x, eliminado_todos: true, texto: null, imagen_url: null } : x))
    );
    const { error } = await supabase.rpc("chat_eliminar_para_todos", { p_msg: id });
    if (error) alert("No se pudo eliminar: " + error.message);
  }

  return (
    <div className="flex flex-col h-[calc(100vh-9rem)]">
      <div className="flex-1 overflow-y-auto space-y-2 p-1">
        {mensajes.length === 0 && (
          <p className="text-center text-sm text-gray-400 mt-8">Iniciá la conversación 👋</p>
        )}
        {mensajes.map((m) => {
          const mio = m.de === meId;
          const borrado = m.eliminado_todos;
          return (
            <div key={m.id} className={`flex items-center gap-1 ${mio ? "justify-end" : "justify-start"}`}>
              {mio && !borrado && (
                <BotonMenu
                  abierto={menuId === m.id}
                  onToggle={() => setMenuId(menuId === m.id ? null : m.id)}
                  mio={mio}
                  onParaMi={() => eliminarParaMi(m.id)}
                  onParaTodos={() => eliminarParaTodos(m.id)}
                />
              )}
              <div
                className={`max-w-[78%] rounded-2xl px-3 py-2 shadow-sm ${
                  borrado
                    ? "bg-gray-100 text-gray-500 italic"
                    : mio
                    ? "bg-cacao-grad text-white"
                    : "bg-white border border-gray-200 text-gray-900"
                }`}
              >
                {borrado ? (
                  <p className="text-sm">🚫 Se eliminó este mensaje</p>
                ) : (
                  <>
                    {m.imagen_url && (
                      <a href={m.imagen_url} target="_blank" rel="noreferrer">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={m.imagen_url} alt="foto" className="rounded-lg max-h-64 mb-1" />
                      </a>
                    )}
                    {m.texto && <p className="text-sm whitespace-pre-wrap break-words">{m.texto}</p>}
                  </>
                )}
                <p className={`text-[10px] mt-1 ${mio && !borrado ? "text-white/70" : "text-gray-400"}`}>
                  {fechaHora(m.creado_en)}
                </p>
              </div>
              {!mio && (
                <BotonMenu
                  abierto={menuId === m.id}
                  onToggle={() => setMenuId(menuId === m.id ? null : m.id)}
                  mio={mio}
                  onParaMi={() => eliminarParaMi(m.id)}
                  onParaTodos={() => eliminarParaTodos(m.id)}
                />
              )}
            </div>
          );
        })}
        <div ref={finRef} />
      </div>

      <div className="flex items-end gap-2 pt-3 border-t border-gray-200 bg-[#faf9f7]">
        <label
          className="w-11 h-11 rounded-full bg-white border border-gray-300 flex items-center justify-center text-[#8a5a2c] cursor-pointer hover:bg-[#f3ece1] shrink-0"
          title="Enviar foto"
        >
          <ImagePlus size={20} />
          <input
            type="file"
            accept="image/*"
            className="hidden"
            disabled={subiendo}
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) subirFoto(f);
              e.target.value = "";
            }}
          />
        </label>
        <textarea
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              enviarTexto();
            }
          }}
          rows={1}
          placeholder={subiendo ? "Subiendo foto…" : "Escribí un mensaje…"}
          className="flex-1 resize-none border border-gray-300 rounded-2xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#8a5a2c] max-h-32"
        />
        <button
          onClick={enviarTexto}
          className="w-11 h-11 rounded-full bg-cacao-grad text-white flex items-center justify-center shadow-md shrink-0"
          aria-label="Enviar"
        >
          <Send size={18} />
        </button>
      </div>
    </div>
  );
}

function BotonMenu({
  abierto,
  onToggle,
  mio,
  onParaMi,
  onParaTodos,
}: {
  abierto: boolean;
  onToggle: () => void;
  mio: boolean;
  onParaMi: () => void;
  onParaTodos: () => void;
}) {
  return (
    <div className="relative shrink-0">
      <button onClick={onToggle} className="text-gray-400 hover:text-gray-700 p-1" aria-label="Opciones del mensaje">
        <MoreVertical size={16} />
      </button>
      {abierto && (
        <>
          <div className="fixed inset-0 z-10" onClick={onToggle} />
          <div className="absolute right-0 mt-1 z-20 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden min-w-[190px]">
            <button onClick={onParaMi} className="block w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50">
              Eliminar para mí
            </button>
            {mio && (
              <button onClick={onParaTodos} className="block w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50">
                Eliminar para todos
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}
