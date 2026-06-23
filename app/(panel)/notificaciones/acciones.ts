"use server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function marcarLeidas() {
  const supabase = await createClient();
  await supabase.from("notificaciones").update({ leida: true }).eq("leida", false);
  revalidatePath("/notificaciones");
  revalidatePath("/inicio");
}
