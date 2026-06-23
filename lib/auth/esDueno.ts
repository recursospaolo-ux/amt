import { createClient } from "@/lib/supabase/server";

// ¿El usuario actual es el administrador (dueño)?
export async function esDueno(): Promise<boolean> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;
  const { data } = await supabase
    .from("usuarios")
    .select("rol")
    .eq("id", user.id)
    .single();
  return data?.rol === "dueno";
}
