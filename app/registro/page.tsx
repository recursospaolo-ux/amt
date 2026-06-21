"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function Registro() {
  const router = useRouter();
  const [nombre, setNombre] = useState("");
  const [correo, setCorreo] = useState("");
  const [clave, setClave] = useState("");
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);

  async function registrar(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setCargando(true);
    const supabase = createClient();
    const { data, error } = await supabase.auth.signUp({
      email: correo,
      password: clave,
      options: { data: { nombre } },
    });
    if (error) {
      setError("No se pudo registrar: " + error.message);
      setCargando(false);
      return;
    }
    // El primer usuario queda activo (dueño) → al panel; el resto → pendiente.
    const uid = data.user?.id;
    if (uid) {
      const { data: perfil } = await supabase
        .from("usuarios")
        .select("estado")
        .eq("id", uid)
        .single();
      if (perfil?.estado === "activo") {
        router.push("/inicio");
        return;
      }
    }
    router.push("/pendiente");
  }

  return (
    <main className="mx-auto max-w-sm p-6 mt-10">
      <h1 className="text-xl font-semibold mb-1">Crear cuenta</h1>
      <p className="text-sm text-gray-500 mb-4">AMT Agroindustria</p>
      <form onSubmit={registrar} className="space-y-3">
        <input
          className="w-full border rounded p-2"
          placeholder="Nombre completo"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          required
        />
        <input
          className="w-full border rounded p-2"
          type="email"
          placeholder="Correo"
          value={correo}
          onChange={(e) => setCorreo(e.target.value)}
          required
        />
        <input
          className="w-full border rounded p-2"
          type="password"
          placeholder="Contraseña (mínimo 6 caracteres)"
          value={clave}
          onChange={(e) => setClave(e.target.value)}
          required
          minLength={6}
        />
        {error && <p className="text-red-600 text-sm">{error}</p>}
        <button
          className="w-full bg-green-700 text-white rounded p-2 disabled:opacity-60"
          disabled={cargando}
        >
          {cargando ? "Registrando..." : "Registrarme"}
        </button>
      </form>
      <p className="text-sm text-gray-600 mt-4">
        ¿Ya tenés cuenta?{" "}
        <Link href="/login" className="text-green-700 underline">
          Ingresar
        </Link>
      </p>
    </main>
  );
}
