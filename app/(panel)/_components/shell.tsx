"use client";
import { useState } from "react";
import { Menu } from "lucide-react";
import { Sidebar } from "./nav";
import type { Permisos } from "@/lib/types";

export function Shell({
  nombre,
  correo,
  rol,
  permisos,
  children,
}: {
  nombre: string;
  correo: string;
  rol: string;
  permisos: Permisos;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-[#faf9f7]">
      {/* Sidebar: cajón deslizante en móvil, fijo en escritorio */}
      <div
        className={`fixed inset-y-0 left-0 z-40 w-64 transform transition-transform duration-200 md:static md:translate-x-0 md:z-auto ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <Sidebar
          nombre={nombre}
          correo={correo}
          rol={rol}
          permisos={permisos}
          onNavigate={() => setOpen(false)}
        />
      </div>

      {/* Fondo oscuro en móvil cuando el menú está abierto */}
      {open && (
        <div
          className="fixed inset-0 bg-black/40 z-30 md:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      <div className="flex-1 flex flex-col min-w-0">
        <header className="flex items-center justify-between md:justify-end px-4 md:px-6 py-3 border-b border-gray-200 bg-white">
          <button
            onClick={() => setOpen(true)}
            aria-label="Abrir menú"
            className="md:hidden text-gray-700"
          >
            <Menu size={24} />
          </button>
          <span className="md:hidden font-bold text-[#8a5a2c]">AMT Agroindustria</span>
          <span className="flex items-center gap-2 text-xs text-gray-600 bg-gray-100 rounded-full px-3 py-1">
            <span className="w-2 h-2 rounded-full bg-green-500" />
            En línea
          </span>
        </header>
        <main className="flex-1 p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
