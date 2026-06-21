import { ContactoForm } from "./ContactoForm";

export default function Contacto() {
  return (
    <main className="max-w-3xl mx-auto p-8">
      <h1 className="text-2xl font-semibold">Contacto</h1>
      <p className="mt-3 text-gray-700">
        Escribínos y te responderemos a la brevedad. También nos encontrás en
        Aguaytía, Padre Abad, Ucayali.
      </p>
      <ContactoForm />
    </main>
  );
}
