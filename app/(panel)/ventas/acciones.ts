"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function crearCliente(formData: FormData) {
  const supabase = await createClient();
  const { error } = await supabase.from("clientes").insert({
    nombre: String(formData.get("nombre") || "").trim(),
    doc: String(formData.get("doc") || "").trim() || null,
    tipo: String(formData.get("tipo") || "local"),
    pais: String(formData.get("pais") || "").trim() || null,
    contacto: String(formData.get("contacto") || "").trim() || null,
  });
  if (error) throw new Error("No se pudo guardar el cliente: " + error.message);
  revalidatePath("/ventas/clientes");
  revalidatePath("/ventas");
}

export type ItemVenta = {
  producto_id: string;
  cantidad: number;
  precio_unit: number;
};

export async function registrarVenta(payload: {
  cliente_id: string;
  tipo: string;
  cobrar: boolean;
  items: ItemVenta[];
}) {
  const supabase = await createClient();
  const codigo = "V-" + Date.now().toString(36).toUpperCase();
  const items = payload.items
    .filter((i) => i.producto_id && Number(i.cantidad) > 0)
    .map((i) => ({
      producto_id: i.producto_id,
      cantidad: Number(i.cantidad),
      precio_unit: Number(i.precio_unit),
    }));
  if (items.length === 0) {
    return { ok: false, error: "Agregá al menos un producto con cantidad." };
  }
  const { error } = await supabase.rpc("registrar_venta", {
    p_cliente: payload.cliente_id || null,
    p_tipo: payload.tipo || "local",
    p_codigo: codigo,
    p_items: items,
    p_cobrar: !!payload.cobrar,
  });
  if (error) return { ok: false, error: error.message };
  revalidatePath("/ventas");
  revalidatePath("/caja");
  revalidatePath("/inventario");
  return { ok: true };
}

export async function eliminarVenta(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.rpc("eliminar_venta", { p_venta: id });
  if (error) throw new Error("No se pudo eliminar la venta: " + error.message);
  revalidatePath("/ventas");
  revalidatePath("/caja");
  revalidatePath("/inventario");
}

export async function actualizarCliente(id: string, formData: FormData) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("clientes")
    .update({
      nombre: String(formData.get("nombre") || "").trim(),
      doc: String(formData.get("doc") || "").trim() || null,
      tipo: String(formData.get("tipo") || "local"),
      pais: String(formData.get("pais") || "").trim() || null,
      contacto: String(formData.get("contacto") || "").trim() || null,
    })
    .eq("id", id);
  if (error) throw new Error("No se pudo actualizar: " + error.message);
  revalidatePath("/ventas/clientes");
  redirect("/ventas/clientes");
}

export async function eliminarCliente(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("clientes").delete().eq("id", id);
  if (error)
    throw new Error(
      "No se pudo eliminar (puede tener ventas registradas): " + error.message
    );
  revalidatePath("/ventas/clientes");
}
