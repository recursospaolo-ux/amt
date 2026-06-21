# AMT Agroindustria — Sistema de Acopio de Cacao

Sistema de gestión para **AMT Agroindustria S.A.C.** (Aguaytía, Padre Abad, Ucayali).

## Módulos
- **Acopio y trazabilidad** — productores, lotes (baba/seco), procesos por etapa, clasificación.
- **Inventario** — stock por calidad, movimientos.
- **Caja** — ingresos/egresos y saldo.
- **Ventas** — clientes y ventas (descuenta stock, suma a caja).
- **Sitio web** — catálogo dinámico y formulario de contacto.
- **Acceso** — administrador único; los trabajadores se registran y esperan aprobación.

## Tecnología
Next.js (App Router, TypeScript) · Tailwind CSS · Supabase (PostgreSQL + Auth + RLS) · Vercel.

## Desarrollo
```bash
npm install
npm run dev      # http://localhost:3000
npm test         # pruebas
```
Variables de entorno en `.env.local` (ver `.env.example`).

## Despliegue
Conectado a Vercel: cada push a `main` se publica automáticamente.
