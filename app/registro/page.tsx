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
    <main className="min-h-screen flex">
      {/* Lado izquierdo: imagen */}
      <div className="hidden md:flex md:w-1/2 relative bg-[#3b2415]">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: "url(/cacao.jpg)" }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-black/20" />
        <div className="relative z-10 flex flex-col justify-end p-12 text-white">
          <h1 className="text-5xl lg:text-6xl font-bold leading-tight drop-shadow">
            AMT Agroindustria
          </h1>
          <p className="text-xl mt-4 text-amber-50/95">Sistema de Acopio de Cacao</p>
          <p className="text-sm mt-2 text-amber-100/80">Ucayali, Perú</p>
        </div>
      </div>

      {/* Lado derecho: formulario */}
      <div className="w-full md:w-1/2 flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-md">
          <h2 className="text-3xl font-bold text-gray-900">Crear Cuenta</h2>
          <p className="text-gray-500 mt-1">
            Registrate para acceder al sistema. El primer registro es el dueño.
          </p>

          <form onSubmit={registrar} className="mt-8 space-y-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Nombre completo
              </label>
              <input
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                required
                className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-[#8a5a2c]/40 focus:border-[#8a5a2c]"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Correo Electrónico
              </label>
              <input
                type="email"
                value={correo}
                onChange={(e) => setCorreo(e.target.value)}
                required
                placeholder="tucorreo@ejemplo.com"
                className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-[#8a5a2c]/40 focus:border-[#8a5a2c]"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Contraseña
              </label>
              <input
                type="password"
                value={clave}
                onChange={(e) => setClave(e.target.value)}
                required
                minLength={6}
                placeholder="Mínimo 6 caracteres"
                className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-[#8a5a2c]/40 focus:border-[#8a5a2c]"
              />
            </div>
            {error && <p className="text-red-600 text-sm">{error}</p>}
            <button
              className="w-full bg-[#8a5a2c] hover:bg-[#6f4722] text-white font-medium rounded-lg p-3 transition-colors disabled:opacity-60"
              disabled={cargando}
            >
              {cargando ? "Registrando..." : "Registrarme"}
            </button>
          </form>

          <p className="text-center text-sm text-gray-600 mt-6">
            ¿Ya tenés cuenta?{" "}
            <Link href="/login" className="text-[#8a5a2c] font-semibold hover:underline">
              Iniciar sesión
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
