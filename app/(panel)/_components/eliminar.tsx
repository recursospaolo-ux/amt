"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export function Eliminar({
  action,
  mensaje,
  texto = "Eliminar",
}: {
  action: () => Promise<void>;
  mensaje?: string;
  texto?: string;
}) {
  const router = useRouter();
  const [cargando, setCargando] = useState(false);

  async function onClick() {
    if (!confirm(mensaje || "¿Eliminar este registro? No se puede deshacer.")) {
      return;
    }
    setCargando(true);
    try {
      await action();
      router.refresh();
    } catch (e) {
      alert("No se pudo eliminar: " + ((e as Error)?.message || "intentá de nuevo"));
    } finally {
      setCargando(false);
    }
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={cargando}
      className="text-red-600 text-sm hover:underline disabled:opacity-50"
    >
      {cargando ? "..." : texto}
    </button>
  );
}
