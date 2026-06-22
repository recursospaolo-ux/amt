import Link from "next/link";

export default function PublicoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col min-h-screen">
      <header className="flex items-center justify-between p-4 border-b">
        <Link href="/" className="font-bold text-[#7a4f28]">
          AMT Agroindustria
        </Link>
        <nav className="flex items-center gap-4 text-sm">
          <Link href="/nosotros" className="hover:text-[#8a5a2c]">
            Nosotros
          </Link>
          <Link href="/catalogo" className="hover:text-[#8a5a2c]">
            Catálogo
          </Link>
          <Link href="/contacto" className="hover:text-[#8a5a2c]">
            Contacto
          </Link>
          <Link
            href="/login"
            className="bg-cacao-grad text-white rounded-full px-4 py-1.5 font-semibold"
          >
            Ingresar
          </Link>
        </nav>
      </header>
      <div className="flex-1">{children}</div>
      <footer className="p-4 border-t text-center text-sm text-gray-600">
        AMT Agroindustria S.A.C. — Aguaytía, Padre Abad, Ucayali, Perú
      </footer>
    </div>
  );
}
