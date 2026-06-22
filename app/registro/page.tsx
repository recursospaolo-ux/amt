"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function Registro() {
  const router = useRouter();
  const [nombre, setNombre] = useState("");
  const [dni, setDni] = useState("");
  const [tipo, setTipo] = useState("");
  const [correo, setCorreo] = useState("");
  const [clave, setClave] = useState("");
  const [verClave, setVerClave] = useState(false);
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);

  async function registrar(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setCargando(true);
    const supabase = createClient();
    const { data, error } = await supabase.auth.signUp({
      email: correo.trim(),
      password: clave,
      options: { data: { nombre, dni, tipo } },
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
      {/* Lado izquierdo: imagen con el logo centrado */}
      <div className="hidden md:flex md:w-1/2 relative bg-[#3b2415]">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: "url(/cacao.jpg)" }}
        />
        <div className="absolute inset-0 bg-black/55" />
        <div className="relative z-10 flex flex-col items-center justify-center text-center w-full p-12 text-white">
          <h1 className="text-5xl lg:text-6xl font-extrabold leading-tight drop-shadow-lg">
            AMT Agroindustria
          </h1>
          <p className="text-xl mt-4 text-white font-medium drop-shadow">
            Sistema de Acopio de Cacao
          </p>
          <p className="text-sm mt-2 text-amber-100 drop-shadow">Ucayali, Perú</p>
        </div>
      </div>

      {/* Lado derecho: formulario */}
      <div className="w-full md:w-1/2 flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-md">
          <h2 className="text-3xl font-bold text-gray-900">Crear Cuenta</h2>
          <p className="text-gray-600 mt-1">
            Registrate para acceder. Tu solicitud quedará pendiente de aprobación.
          </p>

          <form onSubmit={registrar} className="mt-6 space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-1">
                Nombre completo
              </label>
              <input
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                required
                className="w-full border-2 border-gray-300 rounded-lg p-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#8a5a2c]"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-1">
                DNI
              </label>
              <input
                value={dni}
                onChange={(e) => setDni(e.target.value)}
                required
                inputMode="numeric"
                placeholder="Documento de identidad"
                className="w-full border-2 border-gray-300 rounded-lg p-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#8a5a2c]"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-1">
                ¿Eres proveedor o trabajador?
              </label>
              <select
                value={tipo}
                onChange={(e) => setTipo(e.target.value)}
                required
                className="w-full border-2 border-gray-300 rounded-lg p-3 text-gray-900 focus:outline-none focus:border-[#8a5a2c]"
              >
                <option value="" disabled>
                  Seleccioná una opción
                </option>
                <option value="proveedor">Proveedor (entrego cacao)</option>
                <option value="trabajador">Trabajador (personal de AMT)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-1">
                Correo Electrónico
              </label>
              <input
                type="email"
                value={correo}
                onChange={(e) => setCorreo(e.target.value)}
                required
                placeholder="tucorreo@ejemplo.com"
                className="w-full border-2 border-gray-300 rounded-lg p-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#8a5a2c]"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-1">
                Contraseña
              </label>
              <div className="relative">
                <input
                  type={verClave ? "text" : "password"}
                  value={clave}
                  onChange={(e) => setClave(e.target.value)}
                  required
                  minLength={6}
                  placeholder="Mínimo 6 caracteres"
                  className="w-full border-2 border-gray-300 rounded-lg p-3 pr-11 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#8a5a2c]"
                />
                <button
                  type="button"
                  onClick={() => setVerClave((v) => !v)}
                  aria-label={verClave ? "Ocultar contraseña" : "Ver contraseña"}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 hover:text-[#8a5a2c]"
                >
                  {verClave ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>
            {error && <p className="text-red-600 text-sm font-medium">{error}</p>}
            <button
              className="w-full bg-cacao-grad hover:brightness-110 text-white font-semibold rounded-full p-3 transition-colors disabled:opacity-60"
              disabled={cargando}
            >
              {cargando ? "Registrando..." : "Registrarme"}
            </button>
          </form>

          <p className="text-center text-sm text-gray-700 mt-6">
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
