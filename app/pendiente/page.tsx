import Link from "next/link";

export default function Pendiente() {
  return (
    <main className="mx-auto max-w-md p-6 mt-16 text-center">
      <h1 className="text-xl font-semibold mb-2">Cuenta en revisión</h1>
      <p className="text-gray-700">
        Tu solicitud fue enviada. El dueño debe aprobarla antes de que puedas
        ingresar al sistema.
      </p>
      <p className="mt-6 text-sm">
        <Link href="/login" className="text-green-700 underline">
          Volver a ingresar
        </Link>
      </p>
    </main>
  );
}
