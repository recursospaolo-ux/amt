export default function Inicio() {
  return (
    <div>
      <h1 className="text-2xl font-semibold">Bienvenido</h1>
      <p className="text-gray-600 mt-2">
        Este es el panel de AMT Agroindustria. Próximamente verás aquí el resumen
        de caja, stock y ventas.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
        <div className="bg-white border rounded-lg p-4">
          <div className="text-sm text-gray-500">Saldo de caja</div>
          <div className="text-2xl font-semibold text-gray-400">—</div>
        </div>
        <div className="bg-white border rounded-lg p-4">
          <div className="text-sm text-gray-500">Stock total</div>
          <div className="text-2xl font-semibold text-gray-400">—</div>
        </div>
        <div className="bg-white border rounded-lg p-4">
          <div className="text-sm text-gray-500">Ventas del mes</div>
          <div className="text-2xl font-semibold text-gray-400">—</div>
        </div>
      </div>
    </div>
  );
}
