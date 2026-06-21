import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Shell } from "./_components/shell";
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
    <Shell
      nombre={perfil.nombre || (user.email ?? "")}
      correo={user.email ?? ""}
      rol={perfil.rol}
      permisos={perfil.permisos as Permisos}
    >
      {children}
    </Shell>
  );
}
