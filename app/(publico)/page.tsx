import { redirect } from "next/navigation";

// La app es el frente del sistema: la ruta principal va directo al panel.
// Si no hay sesión, /inicio redirige a /login. El sitio web público sigue
// disponible en /nosotros, /catalogo y /contacto.
export default function Home() {
  redirect("/inicio");
}
