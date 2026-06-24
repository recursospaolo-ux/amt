import { createClient } from "@/lib/supabase/server";
import { MiCuentaForm } from "./MiCuentaForm";

export default async function MiCuenta() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: perfil } = await supabase
    .from("usuarios")
    .select("id, nombre, correo, dni, tipo, rol, avatar_url, fecha_nacimiento, telefono")
    .eq("id", user?.id ?? "")
    .single();

  if (!perfil) return null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Mi cuenta</h1>
        <p className="text-gray-600 mt-1">Tu foto y tus datos personales.</p>
      </div>
      <MiCuentaForm perfil={perfil} />
    </div>
  );
}
