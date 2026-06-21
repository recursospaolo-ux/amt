"use server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { Permisos } from "@/lib/types";

async function exigirDueno() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("No autenticado");
  const { data } = await supabase
    .from("usuarios")
    .select("rol, estado")
    .eq("id", user.id)
    .single();
  if (data?.rol !== "dueno" || data?.estado !== "activo") {
    throw new Error("Solo el dueño puede realizar esta acción");
  }
  return { supabase, ownerId: user.id };
}

export async function aprobarUsuario(id: string, permisos: Permisos) {
  const { supabase, ownerId } = await exigirDueno();
  const { error } = await supabase
    .from("usuarios")
    .update({
      estado: "activo",
      permisos,
      aprobado_por: ownerId,
      aprobado_en: new Date().toISOString(),
    })
    .eq("id", id);
  if (error) throw new Error("No se pudo aprobar: " + error.message);
  revalidatePath("/solicitudes");
}

export async function rechazarUsuario(id: string) {
  const { supabase } = await exigirDueno();
  const { error } = await supabase
    .from("usuarios")
    .update({ estado: "suspendido" })
    .eq("id", id);
  if (error) throw new Error("No se pudo rechazar: " + error.message);
  revalidatePath("/solicitudes");
}
