"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { registrarVenta } from "./acciones";

type Producto = { id: string; nombre: string };
type Cliente = { id: string; nombre: string };
type Fila = { producto_id: string; cantidad: string; precio_unit: string };

export function VentaForm({
  clientes,
  productos,
}: {
  clientes: Cliente[];
  productos: Producto[];
}) {
  const router = useRouter();
  const [clienteId, setClienteId] = useState(clientes[0]?.id ?? "");
  const [tipo, setTipo] = useState("local");
  const [cobrar, setCobrar] = useState(true);
  const [filas, setFilas] = useState<Fila[]>([
    { producto_id: productos[0]?.id ?? "", cantidad: "", precio_unit: "" },
  ]);
  const [error, setError] = useState("");
  const [ok, setOk] = useState(false);
  const [enviando, setEnviando] = useState(false);

  const total = filas.reduce(
    (a, f) => a + (Number(f.cantidad) || 0) * (Number(f.precio_unit) || 0),
    0
  );

  function actualizar(i: number, campo: keyof Fila, valor: string) {
    setFilas((prev) => prev.map((f, j) => (j === i ? { ...f, [campo]: valor } : f)));
  }
  function agregarFila() {
    setFilas((prev) => [...prev, { producto_id: productos[0]?.id ?? "", cantidad: "", precio_unit: "" }]);
  }
  function quitarFila(i: number) {
    setFilas((prev) => prev.filter((_, j) => j !== i));
  }

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setOk(false);
    setEnviando(true);
    const res = await registrarVenta({
      cliente_id: clienteId,
      tipo,
      cobrar,
      items: filas.map((f) => ({
        producto_id: f.producto_id,
        cantidad: Number(f.cantidad),
        precio_unit: Number(f.precio_unit),
      })),
    });
    setEnviando(false);
    if (!res.ok) {
      setError(res.error || "No se pudo registrar la venta.");
      return;
    }
    setOk(true);
    setFilas([{ producto_id: productos[0]?.id ?? "", cantidad: "", precio_unit: "" }]);
    router.refresh();
  }

  if (productos.length === 0) {
    return (
      <p className="text-sm text-gray-600">
        No hay productos en stock para vender. Clasificá lotes o creá productos en
        Inventario.
      </p>
    );
  }

  return (
    <form onSubmit={enviar} className="space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <label className="text-sm">
          Cliente
          <select
            value={clienteId}
            onChange={(e) => setClienteId(e.target.value)}
            className="w-full border rounded p-2 mt-1"
          >
            <option value="">(sin cliente)</option>
            {clientes.map((c) => (
              <option key={c.id} value={c.id}>{c.nombre}</option>
            ))}
          </select>
        </label>
        <label className="text-sm">
          Tipo
          <select value={tipo} onChange={(e) => setTipo(e.target.value)} className="w-full border rounded p-2 mt-1">
            <option value="local">Local</option>
            <option value="exportacion">Exportación</option>
          </select>
        </label>
        <label className="text-sm flex items-center gap-2 mt-6">
          <input type="checkbox" checked={cobrar} onChange={(e) => setCobrar(e.target.checked)} />
          Cobrada (suma a caja)
        </label>
      </div>

      <div className="space-y-2">
        {filas.map((f, i) => (
          <div key={i} className="grid grid-cols-12 gap-2 items-end">
            <label className="text-sm col-span-5">
              {i === 0 && "Producto"}
              <select
                value={f.producto_id}
                onChange={(e) => actualizar(i, "producto_id", e.target.value)}
                className="w-full border rounded p-2 mt-1"
              >
                {productos.map((p) => (
                  <option key={p.id} value={p.id}>{p.nombre}</option>
                ))}
              </select>
            </label>
            <label className="text-sm col-span-3">
              {i === 0 && "Cantidad"}
              <input
                type="number" step="0.01" min="0"
                value={f.cantidad}
                onChange={(e) => actualizar(i, "cantidad", e.target.value)}
                className="w-full border rounded p-2 mt-1"
              />
            </label>
            <label className="text-sm col-span-3">
              {i === 0 && "Precio/u (S/)"}
              <input
                type="number" step="0.01" min="0"
                value={f.precio_unit}
                onChange={(e) => actualizar(i, "precio_unit", e.target.value)}
                className="w-full border rounded p-2 mt-1"
              />
            </label>
            <div className="col-span-1">
              {filas.length > 1 && (
                <button type="button" onClick={() => quitarFila(i)} className="text-red-600 p-2">
                  ✕
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      <button type="button" onClick={agregarFila} className="text-sm text-[#8a5a2c] underline">
        + Agregar producto
      </button>

      <div className="flex items-center justify-between pt-2 border-t">
        <span className="font-medium">
          Total: {new Intl.NumberFormat("es-PE", { style: "currency", currency: "PEN" }).format(total)}
        </span>
        <button
          className="bg-[#8a5a2c] text-white rounded px-4 py-2 disabled:opacity-60"
          disabled={enviando}
        >
          {enviando ? "Registrando..." : "Registrar venta"}
        </button>
      </div>
      {error && <p className="text-red-600 text-sm">{error}</p>}
      {ok && <p className="text-[#8a5a2c] text-sm">✓ Venta registrada.</p>}
    </form>
  );
}
