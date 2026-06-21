import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { CerrarSesion } from "./_components/cerrar-sesion";
import type { Permisos } from "@/lib/types";

export default async function PanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: perfil } = await supabase
    .from("usuarios")
    .select("nombre, rol, estado, permisos")
    .eq("id", user.id)
    .single();

  if (!perfil || perfil.estado !== "activo") redirect("/pendiente");

  const p = perfil.permisos as Permisos;
  const esDueno = perfil.rol === "dueno";

  return (
    <div className="flex min-h-screen">
      <aside className="w-56 bg-green-900 text-white p-4 flex flex-col gap-2">
        <div className="font-bold text-lg mb-1">AMT Agroindustria</div>
        <div className="text-xs text-green-300 mb-4">
          {perfil.nombre || user.email} {esDueno && "· Dueño"}
        </div>
        <Link className="block hover:text-green-200" href="/inicio">
          Inicio
        </Link>
        {(esDueno || p.acopio) && (
          <Link className="block hover:text-green-200" href="/acopio">
            Acopio
          </Link>
        )}
        {(esDueno || p.inventario) && (
          <Link className="block hover:text-green-200" href="/inventario">
            Inventario
          </Link>
        )}
        {(esDueno || p.caja) && (
          <Link className="block hover:text-green-200" href="/caja">
            Caja
          </Link>
        )}
        {(esDueno || p.ventas) && (
          <Link className="block hover:text-green-200" href="/ventas">
            Ventas
          </Link>
        )}
        {esDueno && (
          <Link className="block hover:text-green-200 mt-4" href="/solicitudes">
            Solicitudes
          </Link>
        )}
        <div className="mt-auto pt-4 border-t border-green-800">
          <CerrarSesion />
        </div>
      </aside>
      <main className="flex-1 p-6 bg-gray-50">{children}</main>
    </div>
  );
}
