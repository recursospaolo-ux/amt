"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { SelectorProductor } from "./SelectorProductor";
import { crearLote } from "./acciones";

type P = { id: string; nombre: string; dni: string | null };

export function NuevaCompra({ productores }: { productores: P[] }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [ok, setOk] = useState(false);
  const [busy, setBusy] = useState(false);
  const [resetKey, setResetKey] = useState(0);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    setError("");
    setOk(false);
    setBusy(true);
    const res = await crearLote(new FormData(form));
    setBusy(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    setOk(true);
    form.reset();
    setResetKey((k) => k + 1);
    router.refresh();
    setTimeout(() => setOk(false), 5000);
  }

  return (
    <form onSubmit={onSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <label className="text-sm sm:col-span-2">
        Proveedor
        <SelectorProductor key={resetKey} productores={productores} />
      </label>
      <label className="text-sm">
        Estado de recepción
        <select name="estado_recepcion" required className="w-full border rounded p-2 mt-1">
          <option value="baba">En baba (fresco)</option>
          <option value="seco">Seco</option>
        </select>
      </label>
      <label className="text-sm">
        Peso (kg)
        <input name="peso_kg" type="number" step="0.01" min="0.01" required className="w-full border rounded p-2 mt-1" />
      </label>
      <label className="text-sm">
        Humedad (%) <span className="text-gray-400">(opcional)</span>
        <input name="humedad" type="number" step="0.1" min="0" className="w-full border rounded p-2 mt-1" />
      </label>
      <label className="text-sm">
        Precio por kg (S/)
        <input name="precio_kg" type="number" step="0.01" min="0" required className="w-full border rounded p-2 mt-1" />
      </label>

      {error && (
        <p className="sm:col-span-2 text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-sm font-medium">
          {error}
        </p>
      )}
      {ok && (
        <p className="sm:col-span-2 text-green-800 bg-green-50 border border-green-200 rounded-lg px-3 py-2 text-sm font-medium">
          ✓ Compra registrada. Queda <b>pendiente de pago</b> y le avisamos al cajero.
        </p>
      )}

      <div className="flex items-end sm:col-span-2">
        <button
          disabled={busy}
          className="bg-cacao-grad text-white rounded-full px-5 py-2.5 font-semibold shadow-md w-full sm:w-auto disabled:opacity-60"
        >
          {busy ? "Registrando…" : "Registrar compra"}
        </button>
      </div>
    </form>
  );
}
