"use server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function crearMovimientoCaja(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { error } = await supabase.from("caja_movimientos").insert({
    tipo: String(formData.get("tipo")),
    categoria: String(formData.get("categoria") || "").trim() || null,
    monto: Number(formData.get("monto")),
    descripcion: String(formData.get("descripcion") || "").trim() || null,
    creado_por: user?.id ?? null,
  });
  if (error) throw new Error("No se pudo registrar el movimiento: " + error.message);
  revalidatePath("/caja");
}

export async function eliminarMovimientoCaja(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("caja_movimientos").delete().eq("id", id);
  if (error) throw new Error("No se pudo eliminar: " + error.message);
  revalidatePath("/caja");
}
