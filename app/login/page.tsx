"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function Login() {
  const router = useRouter();
  const [correo, setCorreo] = useState("");
  const [clave, setClave] = useState("");
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);

  async function ingresar(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setCargando(true);
    const supabase = createClient();
    const { data: login, error } = await supabase.auth.signInWithPassword({
      email: correo,
      password: clave,
    });
    if (error) {
      setError("Correo o contraseña incorrectos.");
      setCargando(false);
      return;
    }
    const { data: perfil } = await supabase
      .from("usuarios")
      .select("estado")
      .eq("id", login.user.id)
      .single();
    if (perfil?.estado === "activo") {
      router.push("/inicio");
    } else {
      router.push("/pendiente");
    }
  }

  return (
    <main className="mx-auto max-w-sm p-6 mt-10">
      <h1 className="text-xl font-semibold mb-1">Ingresar</h1>
      <p className="text-sm text-gray-500 mb-4">AMT Agroindustria</p>
      <form onSubmit={ingresar} className="space-y-3">
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
          placeholder="Contraseña"
          value={clave}
          onChange={(e) => setClave(e.target.value)}
          required
        />
        {error && <p className="text-red-600 text-sm">{error}</p>}
        <button
          className="w-full bg-green-700 text-white rounded p-2 disabled:opacity-60"
          disabled={cargando}
        >
          {cargando ? "Ingresando..." : "Ingresar"}
        </button>
      </form>
      <p className="text-sm text-gray-600 mt-4">
        ¿No tenés cuenta?{" "}
        <Link href="/registro" className="text-green-700 underline">
          Crear cuenta
        </Link>
      </p>
    </main>
  );
}
