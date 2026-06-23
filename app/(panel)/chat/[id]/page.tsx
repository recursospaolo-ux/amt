import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Conversacion } from "./Conversacion";

type Contacto = { id: string; nombre: string; rol: string };

export default async function ChatThread({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: otherId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) notFound();

  const { data: contactos } = await supabase.rpc("chat_contactos");
  const otro = ((contactos ?? []) as Contacto[]).find((c) => c.id === otherId);
  if (!otro) notFound();

  const { data: mensajes } = await supabase
    .from("mensajes_chat")
    .select("id, de, para, texto, imagen_url, creado_en")
    .or(
      `and(de.eq.${user.id},para.eq.${otherId}),and(de.eq.${otherId},para.eq.${user.id})`
    )
    .order("creado_en", { ascending: true })
    .limit(300);

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-3 pb-3 border-b border-gray-200">
        <Link href="/chat" className="text-gray-600 hover:text-[#8a5a2c]" aria-label="Volver">
          <ArrowLeft size={22} />
        </Link>
        <span
          className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
          style={{ backgroundImage: "linear-gradient(135deg,#8a5a2c,#e0a32e)" }}
        >
          {(otro.nombre || "?").charAt(0).toUpperCase()}
        </span>
        <div>
          <div className="font-semibold text-gray-900 leading-tight">{otro.nombre}</div>
          <div className="text-xs text-gray-500">{otro.rol === "dueno" ? "Administrador" : "Equipo"}</div>
        </div>
      </div>

      <Conversacion meId={user.id} otherId={otherId} initial={(mensajes ?? []) as never} />
    </div>
  );
}
