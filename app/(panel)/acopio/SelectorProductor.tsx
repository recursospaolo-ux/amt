"use client";
import { useState, useMemo } from "react";

type Prod = { id: string; nombre: string; dni: string | null };

export function SelectorProductor({ productores }: { productores: Prod[] }) {
  const [query, setQuery] = useState("");
  const [elegido, setElegido] = useState<Prod | null>(null);
  const [nuevo, setNuevo] = useState(false);
  const [nuevoDni, setNuevoDni] = useState("");

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return productores.slice(0, 6);
    return productores
      .filter(
        (p) =>
          p.nombre.toLowerCase().includes(q) ||
          (p.dni ?? "").toLowerCase().includes(q)
      )
      .slice(0, 6);
  }, [query, productores]);

  const exacto = productores.some(
    (p) => p.nombre.trim().toLowerCase() === query.trim().toLowerCase()
  );

  if (elegido) {
    return (
      <div>
        <input type="hidden" name="productor_id" value={elegido.id} />
        <div className="flex items-center justify-between border-2 border-[#8a5a2c] rounded-lg p-2.5 bg-[#faf3e8]">
          <span className="text-sm font-medium text-[#5f3a18]">
            {elegido.nombre}
            {elegido.dni ? <span className="text-gray-600"> · {elegido.dni}</span> : null}
          </span>
          <button
            type="button"
            onClick={() => {
              setElegido(null);
              setQuery("");
            }}
            className="text-xs text-[#8a5a2c] underline"
          >
            Cambiar
          </button>
        </div>
      </div>
    );
  }

  if (nuevo) {
    return (
      <div className="space-y-2">
        <input type="hidden" name="nuevo_nombre" value={query} />
        <div className="flex items-center justify-between border-2 border-[#2f8f5b] rounded-lg p-2.5 bg-[#eafaf0]">
          <span className="text-sm font-medium text-[#1f6e43]">
            Nuevo proveedor: {query}
          </span>
          <button
            type="button"
            onClick={() => setNuevo(false)}
            className="text-xs text-[#8a5a2c] underline"
          >
            Cambiar
          </button>
        </div>
        <input
          name="nuevo_dni"
          value={nuevoDni}
          onChange={(e) => setNuevoDni(e.target.value)}
          inputMode="numeric"
          placeholder="DNI del proveedor (opcional)"
          className="w-full border rounded p-2 text-sm"
        />
      </div>
    );
  }

  return (
    <div className="relative">
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Buscá por nombre o DNI…"
        className="w-full border rounded p-2 mt-1"
        autoComplete="off"
      />
      {query.trim() && (
        <div className="mt-1 border border-gray-200 rounded-lg overflow-hidden bg-white">
          {matches.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setElegido(p)}
              className="block w-full text-left px-3 py-2 text-sm hover:bg-[#f3ece1]"
            >
              {p.nombre}
              {p.dni ? <span className="text-gray-600"> · {p.dni}</span> : null}
            </button>
          ))}
          {!exacto && (
            <button
              type="button"
              onClick={() => setNuevo(true)}
              className="block w-full text-left px-3 py-2 text-sm font-semibold text-[#2f8f5b] hover:bg-[#eafaf0] border-t border-gray-100"
            >
              + Crear proveedor &ldquo;{query.trim()}&rdquo;
            </button>
          )}
        </div>
      )}
    </div>
  );
}
