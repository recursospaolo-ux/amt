"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  ShoppingCart,
  Users,
  Package,
  Wallet,
  TrendingUp,
  Globe,
  MessageSquare,
  UserCheck,
  LogOut,
  X,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { Permisos } from "@/lib/types";

export function Sidebar({
  nombre,
  correo,
  rol,
  permisos,
  onNavigate,
}: {
  nombre: string;
  correo: string;
  rol: string;
  permisos: Permisos;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const esDueno = rol === "dueno";
  const p = permisos;

  const items = [
    { href: "/inicio", label: "Dashboard", icon: LayoutDashboard, show: true,
      active: pathname === "/inicio" },
    { href: "/acopio", label: "Compras", icon: ShoppingCart, show: esDueno || p.acopio,
      active: pathname === "/acopio" || (pathname.startsWith("/acopio/") && !pathname.startsWith("/acopio/productores")) },
    { href: "/acopio/productores", label: "Productores", icon: Users, show: esDueno || p.acopio,
      active: pathname.startsWith("/acopio/productores") },
    { href: "/inventario", label: "Inventario", icon: Package, show: esDueno || p.inventario,
      active: pathname.startsWith("/inventario") },
    { href: "/caja", label: "Caja", icon: Wallet, show: esDueno || p.caja,
      active: pathname.startsWith("/caja") },
    { href: "/ventas", label: "Ventas", icon: TrendingUp, show: esDueno || p.ventas,
      active: pathname === "/ventas" || pathname.startsWith("/ventas/") },
    { href: "/catalogo-web", label: "Catálogo web", icon: Globe, show: esDueno || p.inventario,
      active: pathname.startsWith("/catalogo-web") },
    { href: "/mensajes", label: "Mensajes", icon: MessageSquare, show: esDueno || p.ventas,
      active: pathname.startsWith("/mensajes") },
    { href: "/solicitudes", label: "Aprobar Usuarios", icon: UserCheck, show: esDueno,
      active: pathname.startsWith("/solicitudes") },
  ];

  async function salir() {
    const supabase = createClient();
    await supabase.auth.signOut();
    onNavigate?.();
    router.push("/login");
    router.refresh();
  }

  return (
    <aside className="w-64 h-full overflow-y-auto bg-white border-r border-gray-200 flex flex-col">
      <div className="px-5 py-5 flex items-start justify-between">
        <div>
          <div className="text-xl font-bold text-[#8a5a2c] leading-tight">
            AMT Agroindustria
          </div>
          <div className="text-xs text-gray-600 mt-1">Sistema de Acopio</div>
        </div>
        {onNavigate && (
          <button
            onClick={onNavigate}
            aria-label="Cerrar menú"
            className="md:hidden text-gray-600 hover:text-gray-800"
          >
            <X size={20} />
          </button>
        )}
      </div>

      <nav className="flex-1 px-3 space-y-1">
        {items
          .filter((i) => i.show)
          .map((i) => {
            const Icon = i.icon;
            return (
              <Link
                key={i.href}
                href={i.href}
                onClick={onNavigate}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                  i.active
                    ? "bg-cacao-grad text-white font-semibold shadow-md"
                    : "text-gray-700 hover:bg-[#f3ece1]"
                }`}
              >
                <Icon size={18} />
                {i.label}
              </Link>
            );
          })}
      </nav>

      <div className="px-4 py-4 border-t border-gray-200">
        <div className="text-sm font-medium text-gray-900">{nombre}</div>
        <div className="text-xs text-gray-600 truncate">{correo}</div>
        <span className="inline-block mt-1.5 text-[10px] uppercase tracking-wide bg-cacao-grad text-white rounded px-1.5 py-0.5">
          {esDueno ? "Admin" : "Trabajador"}
        </span>
        <button
          onClick={salir}
          className="flex items-center gap-2 text-sm text-gray-600 hover:text-[#8a5a2c] mt-3"
        >
          <LogOut size={16} />
          Cerrar Sesión
        </button>
      </div>
    </aside>
  );
}
