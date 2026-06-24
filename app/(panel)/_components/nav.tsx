"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  ShoppingCart,
  Users,
  Package,
  Wallet,
  HandCoins,
  TrendingUp,
  Globe,
  MessageSquare,
  MessageCircle,
  UserCheck,
  Briefcase,
  BarChart3,
  History,
  UserCircle,
  LogOut,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { Permisos } from "@/lib/types";

export function Sidebar({
  nombre,
  correo,
  rol,
  permisos,
  chatUnread = 0,
  avatarUrl,
  onNavigate,
}: {
  nombre: string;
  correo: string;
  rol: string;
  permisos: Permisos;
  chatUnread?: number;
  avatarUrl?: string | null;
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
    { href: "/caja", label: "Dinero", icon: Wallet, show: esDueno || p.caja,
      active: pathname.startsWith("/caja") },
    { href: "/pagos", label: "Pagos", icon: HandCoins, show: esDueno || p.pagos,
      active: pathname.startsWith("/pagos") },
    { href: "/ventas", label: "Ventas", icon: TrendingUp, show: esDueno || p.ventas,
      active: pathname === "/ventas" || pathname.startsWith("/ventas/") },
    { href: "/reportes", label: "Reportes", icon: BarChart3,
      show: esDueno || p.acopio || p.inventario || p.caja || p.ventas,
      active: pathname.startsWith("/reportes") },
    { href: "/catalogo-web", label: "Catálogo web", icon: Globe, show: esDueno || p.inventario,
      active: pathname.startsWith("/catalogo-web") },
    { href: "/chat", label: "Chat", icon: MessageCircle, show: true,
      active: pathname.startsWith("/chat"), badge: chatUnread },
    { href: "/mensajes", label: "Mensajes", icon: MessageSquare, show: esDueno || p.ventas,
      active: pathname.startsWith("/mensajes") },
    { href: "/equipo", label: "Equipo", icon: Briefcase, show: esDueno,
      active: pathname.startsWith("/equipo") },
    { href: "/actividad", label: "Actividad", icon: History, show: esDueno,
      active: pathname.startsWith("/actividad") },
    { href: "/solicitudes", label: "Aprobar Usuarios", icon: UserCheck, show: esDueno,
      active: pathname.startsWith("/solicitudes") },
    { href: "/mi-cuenta", label: "Mi cuenta", icon: UserCircle, show: true,
      active: pathname.startsWith("/mi-cuenta") },
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
      <div className="px-5 pt-16 pb-5 md:pt-5">
        <div className="text-xl font-bold text-[#8a5a2c] leading-tight">
          AMT Agroindustria
        </div>
        <div className="text-xs text-gray-600 mt-1">Sistema de Acopio</div>
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
                <span className="flex-1">{i.label}</span>
                {(i as { badge?: number }).badge ? (
                  <span className="bg-red-600 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] px-1 flex items-center justify-center">
                    {(i as { badge?: number }).badge! > 9 ? "9+" : (i as { badge?: number }).badge}
                  </span>
                ) : null}
              </Link>
            );
          })}
      </nav>

      <div className="px-4 py-4 border-t border-gray-200">
        <Link href="/mi-cuenta" onClick={onNavigate} className="flex items-center gap-3 group">
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={avatarUrl} alt="foto" className="w-10 h-10 rounded-full object-cover border border-gray-200 shrink-0" />
          ) : (
            <span
              className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold shrink-0"
              style={{ backgroundImage: "linear-gradient(135deg,#8a5a2c,#e0a32e)" }}
            >
              {(nombre || correo || "?").charAt(0).toUpperCase()}
            </span>
          )}
          <div className="min-w-0">
            <div className="text-sm font-medium text-gray-900 truncate group-hover:text-[#8a5a2c]">{nombre}</div>
            <div className="text-xs text-gray-600 truncate">{correo}</div>
          </div>
        </Link>
        <span className="inline-block mt-2 text-[10px] uppercase tracking-wide bg-cacao-grad text-white rounded px-1.5 py-0.5">
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
