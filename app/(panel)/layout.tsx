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

  const permisos = (perfil.permisos ?? {}) as Permisos;
  let notifCount = 0;
  if (perfil.rol === "dueno") {
    const { count } = await supabase
      .from("notificaciones")
      .select("id", { count: "exact", head: true })
      .eq("leida", false);
    notifCount = count ?? 0;
  } else if (permisos.pagos) {
    const { count } = await supabase
      .from("notificaciones")
      .select("id", { count: "exact", head: true })
      .eq("leida", false)
      .eq("para", user.id);
    notifCount = count ?? 0;
  }

  const { count: chatUnread } = await supabase
    .from("mensajes_chat")
    .select("id", { count: "exact", head: true })
    .eq("para", user.id)
    .eq("leido", false);

  return (
    <Shell
      nombre={perfil.nombre || (user.email ?? "")}
      correo={user.email ?? ""}
      rol={perfil.rol}
      permisos={perfil.permisos as Permisos}
      notifCount={notifCount}
      chatUnread={chatUnread ?? 0}
    >
      {children}
    </Shell>
  );
}
