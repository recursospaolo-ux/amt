"use client";

export function Eliminar({
  action,
  mensaje,
  texto = "Eliminar",
}: {
  action: () => Promise<void>;
  mensaje?: string;
  texto?: string;
}) {
  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (!confirm(mensaje || "¿Eliminar este registro? No se puede deshacer.")) {
          e.preventDefault();
        }
      }}
      className="inline"
    >
      <button className="text-red-600 text-sm hover:underline">{texto}</button>
    </form>
  );
}
