"use server";

import { revalidatePath } from "next/cache";
import { createClient as createAdminClient } from "@supabase/supabase-js";
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
    pagos: formData.get("pagos") === "on",
  };

  const { error } = await supabase
    .from("usuarios")
    .update({ permisos })
    .eq("id", userId);
  if (error) throw new Error("No se pudo actualizar: " + error.message);

  revalidatePath(`/equipo/${userId}`);
  revalidatePath("/equipo");
}

// El administrador elimina la cuenta de un trabajador.
// El historial de sus movimientos (compras, ventas, dinero, auditoría) se conserva.
export async function eliminarTrabajador(userId: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("No autenticado");
  if (userId === user.id) throw new Error("No podés eliminar tu propia cuenta");

  const { data: yo } = await supabase
    .from("usuarios")
    .select("rol, estado")
    .eq("id", user.id)
    .single();
  if (yo?.rol !== "dueno" || yo?.estado !== "activo") {
    throw new Error("Solo el administrador puede eliminar cuentas");
  }

  const { data: objetivo } = await supabase
    .from("usuarios")
    .select("rol")
    .eq("id", userId)
    .single();
  if (objetivo?.rol === "dueno") {
    throw new Error("No se puede eliminar la cuenta del administrador");
  }

  const admin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Quitar referencias de "aprobado_por" para no bloquear el borrado
  await admin.from("usuarios").update({ aprobado_por: null }).eq("aprobado_por", userId);

  // Borrar la cuenta de acceso (cascada: perfil en usuarios y suscripciones de push)
  const { error } = await admin.auth.admin.deleteUser(userId);
  if (error) throw new Error("No se pudo eliminar la cuenta: " + error.message);

  revalidatePath("/equipo");
}
