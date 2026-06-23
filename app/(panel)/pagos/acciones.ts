"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

// El cajero (o el admin) confirma el pago de un lote: descuenta caja y avisa al admin.
export async function confirmarPago(loteId: string) {
  const supabase = await createClient();
  const { error } = await supabase.rpc("confirmar_pago", { p_lote: loteId });
  if (error) throw new Error(error.message);
  revalidatePath("/pagos");
  revalidatePath("/caja");
}
