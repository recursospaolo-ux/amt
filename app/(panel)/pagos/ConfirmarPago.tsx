"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";

export function ConfirmarPago({
  action,
  resumen,
}: {
  action: () => Promise<void>;
  resumen: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function onClick() {
    if (!window.confirm(`¿Confirmar el pago de ${resumen}?\n\nSe descontará del saldo en caja.`)) return;
    setBusy(true);
    try {
      await action();
      router.refresh();
    } catch (e) {
      alert("No se pudo confirmar: " + (e as Error).message);
      setBusy(false);
    }
  }

  return (
    <button
      onClick={onClick}
      disabled={busy}
      className="inline-flex items-center gap-2 bg-cacao-grad text-white rounded-full px-4 py-2 text-sm font-semibold shadow-md disabled:opacity-60"
    >
      <Check size={16} />
      {busy ? "Confirmando…" : "Confirmar pago"}
    </button>
  );
}
