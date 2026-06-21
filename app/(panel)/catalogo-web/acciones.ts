"use server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function guardarCatalogo(productoId: string, formData: FormData) {
  const supabase = await createClient();
  const precio = formData.get("precio_referencial");
  const { error } = await supabase
    .from("productos")
    .update({
      visible_web: formData.get("visible_web") === "on",
      descripcion: String(formData.get("descripcion") || "").trim() || null,
      precio_referencial: precio ? Number(precio) : null,
    })
    .eq("id", productoId);
  if (error) throw new Error("No se pudo guardar: " + error.message);
  revalidatePath("/catalogo-web");
  revalidatePath("/catalogo");
}
