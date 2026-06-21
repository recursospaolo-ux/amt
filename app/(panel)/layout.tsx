import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Sidebar } from "./_components/nav";
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

  return (
    <div className="flex min-h-screen bg-[#faf9f7]">
      <Sidebar
        nombre={perfil.nombre || (user.email ?? "")}
        correo={user.email ?? ""}
        rol={perfil.rol}
        permisos={perfil.permisos as Permisos}
      />
      <div className="flex-1 flex flex-col min-w-0">
        <header className="flex justify-end items-center px-6 py-3 border-b border-gray-200 bg-white">
          <span className="flex items-center gap-2 text-xs text-gray-600 bg-gray-100 rounded-full px-3 py-1">
            <span className="w-2 h-2 rounded-full bg-green-500" />
            En línea
          </span>
        </header>
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
