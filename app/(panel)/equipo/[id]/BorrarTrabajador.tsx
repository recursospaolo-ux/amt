"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";

export function BorrarTrabajador({
  action,
  nombre,
}: {
  action: () => Promise<void>;
  nombre: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function onClick() {
    const ok = window.confirm(
      `¿Eliminar la cuenta de ${nombre}?\n\n` +
        `Ya no podrá iniciar sesión. El historial de sus movimientos ` +
        `(compras, ventas, dinero) se conserva en el sistema.`
    );
    if (!ok) return;
    setBusy(true);
    try {
      await action();
      router.push("/equipo");
      router.refresh();
    } catch (e) {
      alert("No se pudo eliminar: " + (e as Error).message);
      setBusy(false);
    }
  }

  return (
    <button
      onClick={onClick}
      disabled={busy}
      className="inline-flex items-center gap-2 rounded-full border border-red-300 text-red-600 px-5 py-2.5 font-semibold hover:bg-red-50 disabled:opacity-60"
    >
      <Trash2 size={16} />
      {busy ? "Eliminando…" : "Eliminar cuenta"}
    </button>
  );
}
