import Link from "next/link";
import { Hourglass } from "lucide-react";

export default function Pendiente() {
  return (
    <main className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden">
      <div
        className="absolute inset-0"
        style={{ backgroundImage: "linear-gradient(150deg,#5f3a18 0%,#8a5a2c 50%,#c98a2a 100%)" }}
      />
      <div className="absolute -top-16 -left-10 w-56 h-56 rounded-full bg-[#e0a32e]/30" />
      <div className="absolute -bottom-16 -right-8 w-52 h-52 rounded-full bg-white/10" />
      <div className="absolute top-16 right-24 w-16 h-16 rounded-full bg-white/10" />

      <div className="relative bg-white/95 backdrop-blur rounded-3xl p-9 max-w-md w-full text-center shadow-2xl">
        <div
          className="w-20 h-20 rounded-3xl mx-auto mb-5 flex items-center justify-center shadow-lg"
          style={{ backgroundImage: "linear-gradient(135deg,#8a5a2c,#e0a32e)" }}
        >
          <Hourglass className="text-white" size={40} />
        </div>
        <h1 className="text-2xl font-extrabold text-gray-900">¡Casi listo! 🌱</h1>
        <p className="text-[#8a5a2c] font-semibold mt-1">Tu solicitud está en revisión</p>
        <p className="text-gray-600 mt-3 leading-relaxed">
          El administrador de AMT revisará tu cuenta muy pronto. Apenas la apruebe,
          vas a poder entrar al sistema.
        </p>

        <div className="flex items-center justify-center gap-2 mt-5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#8a5a2c]" />
          <span className="w-2.5 h-2.5 rounded-full bg-[#c98a2a]" />
          <span className="w-2.5 h-2.5 rounded-full bg-[#e7dccb]" />
        </div>

        <Link
          href="/login"
          className="inline-block mt-6 border-2 border-[#8a5a2c] text-[#8a5a2c] font-bold rounded-full px-7 py-2.5 hover:bg-[#8a5a2c] hover:text-white transition-colors"
        >
          Volver a ingresar
        </Link>
      </div>
    </main>
  );
}
