"use client";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function CerrarSesion() {
  const router = useRouter();
  async function salir() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }
  return (
    <button
      onClick={salir}
      className="text-left text-sm text-green-200 hover:text-white"
    >
      Cerrar sesión
    </button>
  );
}
