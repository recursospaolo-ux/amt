"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

async function usuarioActual() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, userId: user?.id ?? null };
}

export async function crearProductor(formData: FormData) {
  const { supabase } = await usuarioActual();
  const { error } = await supabase.from("productores").insert({
    nombre: String(formData.get("nombre") || "").trim(),
    dni: String(formData.get("dni") || "").trim() || null,
    zona: String(formData.get("zona") || "").trim() || null,
    telefono: String(formData.get("telefono") || "").trim() || null,
    organico: formData.get("organico") === "on",
  });
  if (error) throw new Error("No se pudo guardar el productor: " + error.message);
  revalidatePath("/acopio/productores");
  revalidatePath("/acopio");
}

export async function crearLote(formData: FormData) {
  const { supabase, userId } = await usuarioActual();
  const peso = Number(formData.get("peso_kg"));
  const codigo = "L-" + Date.now().toString(36).toUpperCase();

  // Proveedor: existente o nuevo (creado al vuelo).
  let productorId = String(formData.get("productor_id") || "").trim();
  if (!productorId) {
    const nuevoNombre = String(formData.get("nuevo_nombre") || "").trim();
    if (!nuevoNombre) throw new Error("Indicá el proveedor (elegí uno o creá uno nuevo).");
    const { data: np, error: ep } = await supabase
      .from("productores")
      .insert({
        nombre: nuevoNombre,
        dni: String(formData.get("nuevo_dni") || "").trim() || null,
      })
      .select("id")
      .single();
    if (ep) throw new Error("No se pudo crear el proveedor: " + ep.message);
    productorId = np.id;
  }

  const { data, error } = await supabase
    .from("lotes_acopio")
    .insert({
      codigo,
      productor_id: productorId,
      estado_recepcion: String(formData.get("estado_recepcion")),
      peso_kg: peso,
      humedad: formData.get("humedad") ? Number(formData.get("humedad")) : null,
      precio_kg: Number(formData.get("precio_kg")),
      estado: "recibido",
      creado_por: userId,
    })
    .select("id")
    .single();
  if (error) throw new Error("No se pudo registrar el acopio: " + error.message);

  await supabase.from("procesos_lote").insert({
    lote_id: data.id,
    etapa: "recepcion",
    peso_resultante: peso,
    creado_por: userId,
  });

  revalidatePath("/acopio");
  redirect(`/acopio/${data.id}`);
}

export async function registrarEtapa(
  loteId: string,
  etapa: "fermentado" | "secado",
  formData: FormData
) {
  const { supabase, userId } = await usuarioActual();
  const { error } = await supabase.from("procesos_lote").insert({
    lote_id: loteId,
    etapa,
    peso_resultante: formData.get("peso_resultante")
      ? Number(formData.get("peso_resultante"))
      : null,
    merma: formData.get("merma") ? Number(formData.get("merma")) : null,
    observaciones: String(formData.get("observaciones") || "").trim() || null,
    creado_por: userId,
  });
  if (error) throw new Error("No se pudo registrar la etapa: " + error.message);
  await supabase.from("lotes_acopio").update({ estado: etapa }).eq("id", loteId);
  revalidatePath(`/acopio/${loteId}`);
}

export async function clasificarLote(loteId: string, formData: FormData) {
  const { supabase } = await usuarioActual();
  const { error } = await supabase.rpc("clasificar_lote", {
    p_lote: loteId,
    p_kg_pequeno: Number(formData.get("kg_pequeno") || 0),
    p_kg_grande: Number(formData.get("kg_grande") || 0),
    p_merma: Number(formData.get("merma") || 0),
  });
  if (error) throw new Error("No se pudo clasificar: " + error.message);
  revalidatePath(`/acopio/${loteId}`);
  revalidatePath("/inventario");
}

export async function actualizarProductor(id: string, formData: FormData) {
  const { supabase } = await usuarioActual();
  const { error } = await supabase
    .from("productores")
    .update({
      nombre: String(formData.get("nombre") || "").trim(),
      dni: String(formData.get("dni") || "").trim() || null,
      zona: String(formData.get("zona") || "").trim() || null,
      telefono: String(formData.get("telefono") || "").trim() || null,
      organico: formData.get("organico") === "on",
    })
    .eq("id", id);
  if (error) throw new Error("No se pudo actualizar: " + error.message);
  revalidatePath("/acopio/productores");
  redirect("/acopio/productores");
}

export async function eliminarProductor(id: string) {
  const { supabase } = await usuarioActual();
  const { error } = await supabase.from("productores").delete().eq("id", id);
  if (error)
    throw new Error(
      "No se pudo eliminar (puede tener lotes registrados): " + error.message
    );
  revalidatePath("/acopio/productores");
}

export async function eliminarLote(id: string) {
  const { supabase } = await usuarioActual();
  const { error } = await supabase.rpc("eliminar_lote", { p_lote: id });
  if (error) throw new Error("No se pudo eliminar el lote: " + error.message);
  revalidatePath("/acopio");
  revalidatePath("/inventario");
}
