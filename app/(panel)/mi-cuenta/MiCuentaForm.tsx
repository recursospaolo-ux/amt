"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Camera } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type Perfil = {
  id: string;
  nombre: string | null;
  correo: string | null;
  dni: string | null;
  tipo: string | null;
  rol: string;
  avatar_url: string | null;
  fecha_nacimiento: string | null;
  telefono: string | null;
};

export function MiCuentaForm({ perfil }: { perfil: Perfil }) {
  const router = useRouter();
  const supabase = createClient();
  const [nombre, setNombre] = useState(perfil.nombre ?? "");
  const [nacimiento, setNacimiento] = useState(perfil.fecha_nacimiento ?? "");
  const [telefono, setTelefono] = useState(perfil.telefono ?? "");
  const [avatar, setAvatar] = useState(perfil.avatar_url ?? "");
  const [busy, setBusy] = useState(false);
  const [subiendo, setSubiendo] = useState(false);
  const [ok, setOk] = useState(false);
  const [error, setError] = useState("");

  async function subirAvatar(file: File) {
    setSubiendo(true);
    setError("");
    const path = `${perfil.id}/avatar`;
    const up = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
    if (up.error) {
      setError("No se pudo subir la foto: " + up.error.message);
      setSubiendo(false);
      return;
    }
    const url = supabase.storage.from("avatars").getPublicUrl(path).data.publicUrl + "?t=" + Date.now();
    setAvatar(url);
    setSubiendo(false);
  }

  async function guardar(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setOk(false);
    setError("");
    const { error } = await supabase.rpc("actualizar_mi_perfil", {
      p_nombre: nombre,
      p_avatar: avatar || null,
      p_nacimiento: nacimiento || null,
      p_telefono: telefono || null,
    });
    setBusy(false);
    if (error) {
      setError(error.message);
      return;
    }
    setOk(true);
    router.refresh();
    setTimeout(() => setOk(false), 4000);
  }

  return (
    <form onSubmit={guardar} className="bg-white border border-gray-200 rounded-2xl p-5 space-y-5 max-w-lg">
      <div className="flex items-center gap-4">
        <div className="relative">
          {avatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={avatar} alt="foto" className="w-20 h-20 rounded-full object-cover border border-gray-200" />
          ) : (
            <span
              className="w-20 h-20 rounded-full flex items-center justify-center text-white text-2xl font-bold"
              style={{ backgroundImage: "linear-gradient(135deg,#8a5a2c,#e0a32e)" }}
            >
              {(nombre || perfil.correo || "?").charAt(0).toUpperCase()}
            </span>
          )}
          <label className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-cacao-grad text-white flex items-center justify-center cursor-pointer shadow-md" title="Cambiar foto">
            <Camera size={15} />
            <input
              type="file"
              accept="image/*"
              className="hidden"
              disabled={subiendo}
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) subirAvatar(f);
                e.target.value = "";
              }}
            />
          </label>
        </div>
        <div className="text-sm text-gray-600">
          <div className="font-medium text-gray-900">{perfil.correo}</div>
          <div className="capitalize">{perfil.rol === "dueno" ? "Administrador" : perfil.tipo || "Trabajador"}</div>
          {subiendo && <div className="text-xs text-[#8a5a2c]">Subiendo foto…</div>}
        </div>
      </div>

      <label className="block text-sm font-medium text-gray-800">
        Nombre completo
        <input value={nombre} onChange={(e) => setNombre(e.target.value)} className="w-full border border-gray-300 rounded-lg p-2.5 mt-1" />
      </label>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <label className="block text-sm font-medium text-gray-800">
          Fecha de nacimiento
          <input type="date" value={nacimiento} onChange={(e) => setNacimiento(e.target.value)} className="w-full border border-gray-300 rounded-lg p-2.5 mt-1" />
        </label>
        <label className="block text-sm font-medium text-gray-800">
          Teléfono
          <input value={telefono} onChange={(e) => setTelefono(e.target.value)} inputMode="tel" placeholder="999 999 999" className="w-full border border-gray-300 rounded-lg p-2.5 mt-1" />
        </label>
      </div>

      <label className="block text-sm font-medium text-gray-500">
        DNI
        <input value={perfil.dni ?? ""} disabled className="w-full border border-gray-200 bg-gray-50 rounded-lg p-2.5 mt-1 text-gray-500" />
      </label>

      {error && <p className="text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-sm">{error}</p>}
      {ok && <p className="text-green-800 bg-green-50 border border-green-200 rounded-lg px-3 py-2 text-sm">✓ Datos guardados</p>}

      <button disabled={busy || subiendo} className="bg-cacao-grad text-white rounded-full px-6 py-2.5 font-semibold shadow-md disabled:opacity-60">
        {busy ? "Guardando…" : "Guardar cambios"}
      </button>
    </form>
  );
}
