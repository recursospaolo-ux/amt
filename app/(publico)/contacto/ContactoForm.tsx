"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function ContactoForm() {
  const [nombre, setNombre] = useState("");
  const [correo, setCorreo] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [estado, setEstado] = useState<"" | "enviando" | "ok" | "error">("");

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setEstado("enviando");
    const supabase = createClient();
    const { error } = await supabase
      .from("contacto_mensajes")
      .insert({ nombre, correo, mensaje });
    if (error) {
      setEstado("error");
      return;
    }
    setEstado("ok");
    setNombre("");
    setCorreo("");
    setMensaje("");
  }

  if (estado === "ok") {
    return (
      <p className="mt-4 text-[#8a5a2c]">
        ¡Gracias! Recibimos tu mensaje y te responderemos pronto.
      </p>
    );
  }

  return (
    <form onSubmit={enviar} className="mt-4 space-y-3 max-w-md">
      <input
        className="w-full border rounded p-2"
        placeholder="Tu nombre"
        value={nombre}
        onChange={(e) => setNombre(e.target.value)}
        required
      />
      <input
        className="w-full border rounded p-2"
        type="email"
        placeholder="Tu correo"
        value={correo}
        onChange={(e) => setCorreo(e.target.value)}
        required
      />
      <textarea
        className="w-full border rounded p-2"
        placeholder="Tu mensaje"
        rows={4}
        value={mensaje}
        onChange={(e) => setMensaje(e.target.value)}
        required
      />
      {estado === "error" && (
        <p className="text-red-600 text-sm">No se pudo enviar. Intentá de nuevo.</p>
      )}
      <button
        className="bg-[#8a5a2c] text-white rounded px-4 py-2 disabled:opacity-60"
        disabled={estado === "enviando"}
      >
        {estado === "enviando" ? "Enviando..." : "Enviar mensaje"}
      </button>
    </form>
  );
}
