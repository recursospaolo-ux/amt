"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

// El administrador edita los permisos de un trabajador.
export async function actualizarPermisos(userId: string, formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("No autenticado");

  const { data: yo } = await supabase
    .from("usuarios")
    .select("rol, estado")
    .eq("id", user.id)
    .single();
  if (yo?.rol !== "dueno" || yo?.estado !== "activo") {
    throw new Error("Solo el administrador puede cambiar permisos");
  }

  const permisos = {
    acopio: formData.get("acopio") === "on",
    inventario: formData.get("inventario") === "on",
    caja: formData.get("caja") === "on",
    ventas: formData.get("ventas") === "on",
  };

  const { error } = await supabase
    .from("usuarios")
    .update({ permisos })
    .eq("id", userId);
  if (error) throw new Error("No se pudo actualizar: " + error.message);

  revalidatePath(`/equipo/${userId}`);
  revalidatePath("/equipo");
}
