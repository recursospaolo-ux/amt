"use client";
import { useState } from "react";
import Link from "next/link";
import { Menu, Bell } from "lucide-react";
import { Sidebar } from "./nav";
import type { Permisos } from "@/lib/types";

export function Shell({
  nombre,
  correo,
  rol,
  permisos,
  notifCount = 0,
  children,
}: {
  nombre: string;
  correo: string;
  rol: string;
  permisos: Permisos;
  notifCount?: number;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const esDueno = rol === "dueno";

  return (
    <div className="flex min-h-screen bg-[#faf9f7]">
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

      {open && (
        <div
          className="fixed inset-0 bg-black/40 z-30 md:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      <div className="flex-1 flex flex-col min-w-0">
        <header className="flex items-center justify-between md:justify-end gap-3 px-4 md:px-6 py-3 border-b border-gray-200 bg-white">
          <button
            onClick={() => setOpen(true)}
            aria-label="Abrir menú"
            className="md:hidden text-gray-700"
          >
            <Menu size={24} />
          </button>
          <span className="md:hidden font-bold text-[#8a5a2c]">AMT Agroindustria</span>
          <div className="flex items-center gap-4">
            {esDueno && (
              <Link
                href="/notificaciones"
                aria-label="Notificaciones"
                className="relative text-gray-700 hover:text-[#8a5a2c]"
              >
                <Bell size={20} />
                {notifCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-600 text-white text-[10px] font-bold rounded-full min-w-[16px] h-[16px] px-1 flex items-center justify-center">
                    {notifCount > 9 ? "9+" : notifCount}
                  </span>
                )}
              </Link>
            )}
            <span className="flex items-center gap-2 text-xs text-gray-600 bg-gray-100 rounded-full px-3 py-1">
              <span className="w-2 h-2 rounded-full bg-green-500" />
              En línea
            </span>
          </div>
        </header>
        <main className="flex-1 p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
