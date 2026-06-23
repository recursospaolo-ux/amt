"use server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function marcarLeidas() {
  const supabase = await createClient();
  await supabase.from("notificaciones").update({ leida: true }).eq("leida", false);
  revalidatePath("/notificaciones");
  revalidatePath("/inicio");
}

export async function guardarSuscripcion(sub: {
  endpoint: string;
  p256dh: string;
  auth: string;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "No autenticado" };
  const { error } = await supabase
    .from("push_subscriptions")
    .upsert(
      { user_id: user.id, endpoint: sub.endpoint, p256dh: sub.p256dh, auth: sub.auth },
      { onConflict: "endpoint" }
    );
  return { ok: !error, error: error?.message };
}
