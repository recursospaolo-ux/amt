"use server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

async function ctx() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, userId: user?.id ?? null };
}

export async function crearProducto(formData: FormData) {
  const { supabase } = await ctx();
  const { error } = await supabase.from("productos").insert({
    nombre: String(formData.get("nombre") || "").trim(),
    categoria: String(formData.get("categoria") || "").trim() || null,
    unidad: String(formData.get("unidad") || "kg").trim(),
    es_para_venta: formData.get("es_para_venta") === "on",
  });
  if (error) throw new Error("No se pudo crear el producto: " + error.message);
  revalidatePath("/inventario");
}

export async function crearMovimiento(formData: FormData) {
  const { supabase, userId } = await ctx();
  const { error } = await supabase.from("inventario_movimientos").insert({
    producto_id: String(formData.get("producto_id")),
    tipo: String(formData.get("tipo")),
    cantidad: Number(formData.get("cantidad")),
    motivo: String(formData.get("motivo") || "").trim() || null,
    creado_por: userId,
  });
  if (error) throw new Error("No se pudo registrar el movimiento: " + error.message);
  revalidatePath("/inventario");
}

export async function eliminarMovimiento(id: string) {
  const { supabase } = await ctx();
  const { error } = await supabase.from("inventario_movimientos").delete().eq("id", id);
  if (error) throw new Error("No se pudo eliminar: " + error.message);
  revalidatePath("/inventario");
}

export async function eliminarProducto(id: string) {
  const { supabase } = await ctx();
  const { error } = await supabase.from("productos").delete().eq("id", id);
  if (error)
    throw new Error(
      "No se pudo eliminar (puede tener movimientos o ventas): " + error.message
    );
  revalidatePath("/inventario");
}
