# Fase 0 — Fundación: Plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Tener la aplicación corriendo con el sitio web público base, login, y registro de trabajadores que el dueño aprueba (con permisos por módulo), todo protegido por seguridad a nivel de base de datos.

**Architecture:** App Next.js (App Router) con dos zonas — sitio público y panel privado. Supabase provee base de datos (PostgreSQL), autenticación y seguridad por fila (RLS). El correo del dueño se configura como super-admin por variable de entorno; un trigger crea el perfil de cada usuario nuevo en estado "pendiente" salvo el dueño.

**Tech Stack:** Next.js 15 (App Router, TypeScript), Tailwind CSS, shadcn/ui, Supabase (`@supabase/supabase-js`, `@supabase/ssr`), Vitest (pruebas unitarias), Vercel (despliegue).

## Global Constraints

- Idioma de la interfaz: **Español (Perú)**. Todos los textos visibles en español.
- Moneda: **Soles (S/)** (relevante en fases posteriores; no en Fase 0).
- Roles: `dueno` | `trabajador`. Estados de usuario: `pendiente` | `activo` | `suspendido`.
- El **dueño** se define por la variable de entorno `OWNER_EMAIL` (un solo correo super-admin).
- Permisos por módulo, almacenados como JSON: claves `acopio`, `inventario`, `caja`, `ventas` (booleanos). El dueño siempre tiene todos en `true`.
- Seguridad real en base de datos vía **RLS** (no solo en la interfaz).
- Mensajes de error siempre legibles en español.

---

## Prerrequisitos (una sola vez, fuera de los pasos de código)

Estos requieren cuentas del cliente. Confirmar antes de empezar:
- Cuenta de **Supabase** (gratuita) → crear un proyecto → obtener `Project URL`, `anon key` y `service_role key`.
- Cuenta de **Vercel** (gratuita) para el despliegue (se usa al final).
- Node.js 20+ instalado en la máquina de desarrollo.

> Si el cliente no tiene estas cuentas, el primer paso real es crearlas juntos. Las claves van en `.env.local` (nunca se suben a git; ya está en `.gitignore`).

---

## Estructura de archivos (Fase 0)

```
SITEMA PAOLO/
├─ app/
│  ├─ (publico)/                 # sitio público
│  │  ├─ layout.tsx              # header/footer público
│  │  ├─ page.tsx                # Inicio
│  │  ├─ nosotros/page.tsx
│  │  ├─ catalogo/page.tsx       # placeholder (se llena en Fase 5)
│  │  └─ contacto/page.tsx       # placeholder
│  ├─ (panel)/                   # panel privado
│  │  ├─ layout.tsx              # sidebar + guardia de sesión
│  │  ├─ inicio/page.tsx         # dashboard placeholder
│  │  └─ solicitudes/page.tsx    # aprobación de usuarios (solo dueño)
│  ├─ login/page.tsx
│  ├─ registro/page.tsx
│  ├─ pendiente/page.tsx         # pantalla "esperando aprobación"
│  ├─ layout.tsx                 # layout raíz (idioma es)
│  └─ globals.css
├─ lib/
│  ├─ supabase/
│  │  ├─ client.ts               # cliente para navegador
│  │  ├─ server.ts               # cliente para servidor (SSR)
│  │  └─ middleware.ts           # refresco de sesión
│  ├─ auth/
│  │  └─ permisos.ts             # helpers de permisos/roles (PURO, testeable)
│  └─ types.ts                   # tipos compartidos (Usuario, Permisos, etc.)
├─ middleware.ts                 # protección de rutas
├─ supabase/
│  └─ migrations/                # SQL de esquema + RLS + trigger
├─ tests/
│  └─ permisos.test.ts
├─ .env.local                    # claves (no en git)
├─ .env.example                  # plantilla de claves (sí en git)
└─ (config: package.json, tsconfig, tailwind, etc.)
```

---

### Task 1: Crear el proyecto Next.js y verificar que arranca

**Files:**
- Create: proyecto base (`package.json`, `tsconfig.json`, `app/layout.tsx`, `app/page.tsx`, `app/globals.css`, config de Tailwind)

**Interfaces:**
- Produces: proyecto Next.js ejecutable con `npm run dev`.

- [ ] **Step 1: Scaffold del proyecto en el directorio actual**

```bash
cd "/Users/pedroreyescalderon/Downloads/SITEMA PAOLO"
npx create-next-app@latest . --typescript --tailwind --app --eslint --src-dir=false --import-alias "@/*" --use-npm --yes
```

- [ ] **Step 2: Fijar el idioma a español en el layout raíz**

En `app/layout.tsx`, cambiar la etiqueta html:

```tsx
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es-PE">
      <body>{children}</body>
    </html>
  );
}
```

- [ ] **Step 3: Arrancar el servidor y verificar**

Run: `npm run dev`
Expected: servidor en `http://localhost:3000` muestra la página por defecto sin errores.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "chore: scaffold proyecto Next.js (TS, Tailwind, App Router)"
```

---

### Task 2: Instalar Vitest y dependencias de Supabase

**Files:**
- Create: `vitest.config.ts`
- Modify: `package.json` (script `test`)

**Interfaces:**
- Produces: comando `npm test` operativo; paquetes de Supabase disponibles.

- [ ] **Step 1: Instalar dependencias**

```bash
npm install @supabase/supabase-js @supabase/ssr
npm install -D vitest
```

- [ ] **Step 2: Crear `vitest.config.ts`**

```ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: { environment: "node", include: ["tests/**/*.test.ts"] },
});
```

- [ ] **Step 3: Agregar script de test en `package.json`**

```json
"scripts": {
  "test": "vitest run"
}
```

- [ ] **Step 4: Verificar que el runner funciona (sin tests aún)**

Run: `npm test`
Expected: termina sin error indicando "no test files" (o 0 tests).

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "chore: configurar Vitest y dependencias de Supabase"
```

---

### Task 3: Definir tipos compartidos y helper de permisos (con pruebas)

Esta es la pieza de lógica pura más importante de la Fase 0: decidir si un usuario puede acceder a un módulo. Se prueba con TDD.

**Files:**
- Create: `lib/types.ts`, `lib/auth/permisos.ts`, `tests/permisos.test.ts`

**Interfaces:**
- Produces:
  - `type Rol = "dueno" | "trabajador"`
  - `type EstadoUsuario = "pendiente" | "activo" | "suspendido"`
  - `type Modulo = "acopio" | "inventario" | "caja" | "ventas"`
  - `type Permisos = Record<Modulo, boolean>`
  - `interface Usuario { id: string; nombre: string; correo: string; rol: Rol; estado: EstadoUsuario; permisos: Permisos }`
  - `function puedeAcceder(usuario: Usuario, modulo: Modulo): boolean`
  - `function puedeIngresar(usuario: Usuario): boolean` (true solo si estado === "activo")
  - `const PERMISOS_VACIOS: Permisos`

- [ ] **Step 1: Escribir el test que falla**

```ts
// tests/permisos.test.ts
import { describe, it, expect } from "vitest";
import { puedeAcceder, puedeIngresar, PERMISOS_VACIOS } from "@/lib/auth/permisos";
import type { Usuario } from "@/lib/types";

const dueno: Usuario = {
  id: "1", nombre: "Edgar", correo: "edgar@amt.pe",
  rol: "dueno", estado: "activo",
  permisos: { acopio: true, inventario: true, caja: true, ventas: true },
};
const trabajadorVentas: Usuario = {
  id: "2", nombre: "Ana", correo: "ana@amt.pe",
  rol: "trabajador", estado: "activo",
  permisos: { ...PERMISOS_VACIOS, ventas: true },
};
const pendiente: Usuario = { ...trabajadorVentas, id: "3", estado: "pendiente" };

describe("permisos", () => {
  it("el dueño accede a todos los módulos", () => {
    expect(puedeAcceder(dueno, "caja")).toBe(true);
    expect(puedeAcceder(dueno, "acopio")).toBe(true);
  });
  it("el trabajador solo accede a sus módulos permitidos", () => {
    expect(puedeAcceder(trabajadorVentas, "ventas")).toBe(true);
    expect(puedeAcceder(trabajadorVentas, "caja")).toBe(false);
  });
  it("un usuario suspendido o pendiente nunca accede", () => {
    expect(puedeAcceder(pendiente, "ventas")).toBe(false);
  });
  it("solo los usuarios activos pueden ingresar", () => {
    expect(puedeIngresar(dueno)).toBe(true);
    expect(puedeIngresar(pendiente)).toBe(false);
  });
});
```

- [ ] **Step 2: Crear `lib/types.ts`**

```ts
export type Rol = "dueno" | "trabajador";
export type EstadoUsuario = "pendiente" | "activo" | "suspendido";
export type Modulo = "acopio" | "inventario" | "caja" | "ventas";
export type Permisos = Record<Modulo, boolean>;

export interface Usuario {
  id: string;
  nombre: string;
  correo: string;
  rol: Rol;
  estado: EstadoUsuario;
  permisos: Permisos;
}
```

- [ ] **Step 3: Correr el test para verificar que falla**

Run: `npm test`
Expected: FALLA — `puedeAcceder` no está definido.

- [ ] **Step 4: Implementar `lib/auth/permisos.ts`**

```ts
import type { Usuario, Modulo, Permisos } from "@/lib/types";

export const PERMISOS_VACIOS: Permisos = {
  acopio: false, inventario: false, caja: false, ventas: false,
};

export function puedeIngresar(usuario: Usuario): boolean {
  return usuario.estado === "activo";
}

export function puedeAcceder(usuario: Usuario, modulo: Modulo): boolean {
  if (!puedeIngresar(usuario)) return false;
  if (usuario.rol === "dueno") return true;
  return usuario.permisos[modulo] === true;
}
```

- [ ] **Step 5: Correr el test para verificar que pasa**

Run: `npm test`
Expected: PASA (4 tests verdes).

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: tipos compartidos y helper de permisos con pruebas"
```

---

### Task 4: Esquema de base de datos, RLS y trigger de alta de usuario

**Files:**
- Create: `supabase/migrations/0001_usuarios.sql`
- Create: `.env.example`

**Interfaces:**
- Produces: tabla `usuarios` ligada a `auth.users`; políticas RLS; trigger que crea el perfil en `pendiente` (o `dueno`/`activo` si el correo coincide con el del dueño).

- [ ] **Step 1: Crear `.env.example` (plantilla de claves)**

```bash
# .env.example
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
OWNER_EMAIL=
```

> Copiar a `.env.local` y rellenar con las claves reales del proyecto Supabase + el correo del dueño.

- [ ] **Step 2: Escribir la migración SQL**

```sql
-- supabase/migrations/0001_usuarios.sql
create type rol_usuario as enum ('dueno', 'trabajador');
create type estado_usuario as enum ('pendiente', 'activo', 'suspendido');

create table public.usuarios (
  id uuid primary key references auth.users(id) on delete cascade,
  nombre text not null default '',
  correo text not null,
  rol rol_usuario not null default 'trabajador',
  estado estado_usuario not null default 'pendiente',
  permisos jsonb not null default
    '{"acopio":false,"inventario":false,"caja":false,"ventas":false}'::jsonb,
  aprobado_por uuid references public.usuarios(id),
  aprobado_en timestamptz,
  creado_en timestamptz not null default now()
);

alter table public.usuarios enable row level security;

-- ¿Es el usuario actual un dueño activo? (helper para políticas)
create or replace function public.es_dueno_activo()
returns boolean language sql security definer stable as $$
  select exists (
    select 1 from public.usuarios u
    where u.id = auth.uid() and u.rol = 'dueno' and u.estado = 'activo'
  );
$$;

-- Cada usuario lee su propia ficha; el dueño lee todas.
create policy "leer propio o dueno" on public.usuarios
  for select using (id = auth.uid() or public.es_dueno_activo());

-- Solo el dueño actualiza fichas (aprobar/suspender/permisos).
create policy "dueno actualiza" on public.usuarios
  for update using (public.es_dueno_activo());

-- Trigger: al registrarse en auth.users, crear ficha en public.usuarios.
create or replace function public.crear_perfil_usuario()
returns trigger language plpgsql security definer as $$
declare
  correo_dueno text := current_setting('app.owner_email', true);
begin
  if new.email = correo_dueno then
    insert into public.usuarios (id, correo, nombre, rol, estado, permisos, aprobado_en)
    values (new.id, new.email, '', 'dueno', 'activo',
      '{"acopio":true,"inventario":true,"caja":true,"ventas":true}'::jsonb, now());
  else
    insert into public.usuarios (id, correo, nombre)
    values (new.id, new.email, '');
  end if;
  return new;
end;
$$;

create trigger al_crear_usuario
  after insert on auth.users
  for each row execute function public.crear_perfil_usuario();
```

- [ ] **Step 3: Aplicar la migración en Supabase**

Aplicar el SQL en el proyecto Supabase (panel SQL del proyecto, o `supabase db push` con la CLI). Antes de probar el trigger, fijar el correo del dueño a nivel de base de datos:

```sql
alter database postgres set app.owner_email = 'CORREO_DEL_DUENO@ejemplo.com';
```

> Reemplazar por el correo real del dueño (el mismo que `OWNER_EMAIL`).

- [ ] **Step 4: Verificar el esquema**

En el panel de Supabase, confirmar que existe la tabla `usuarios` con las columnas y que RLS está activado.
Expected: tabla visible, candado de RLS encendido, dos políticas presentes.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: esquema usuarios con RLS y trigger de alta"
```

---

### Task 5: Clientes de Supabase y middleware de sesión

**Files:**
- Create: `lib/supabase/client.ts`, `lib/supabase/server.ts`, `lib/supabase/middleware.ts`, `middleware.ts`

**Interfaces:**
- Consumes: variables de entorno de Task 4.
- Produces:
  - `createClient()` (navegador) en `client.ts`
  - `createClient()` (servidor, async) en `server.ts`
  - `updateSession(request)` en `middleware.ts` (lib)
  - middleware raíz que refresca la sesión en cada request

- [ ] **Step 1: `lib/supabase/client.ts` (navegador)**

```ts
import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
```

- [ ] **Step 2: `lib/supabase/server.ts` (servidor)**

```ts
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options));
          } catch { /* llamado desde Server Component: ignorar */ }
        },
      },
    }
  );
}
```

- [ ] **Step 3: `lib/supabase/middleware.ts` (refresco de sesión)**

```ts
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll(); },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value);
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );
  await supabase.auth.getUser();
  return response;
}
```

- [ ] **Step 4: `middleware.ts` (raíz)**

```ts
import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
```

- [ ] **Step 5: Verificar build**

Run: `npm run build`
Expected: compila sin errores de tipos.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: clientes Supabase (navegador/servidor) y middleware de sesión"
```

---

### Task 6: Páginas de registro, login y "pendiente"

**Files:**
- Create: `app/registro/page.tsx`, `app/login/page.tsx`, `app/pendiente/page.tsx`

**Interfaces:**
- Consumes: `createClient()` del navegador (Task 5).
- Produces: flujo de registro (crea usuario en auth → trigger lo deja `pendiente`) y login que redirige según estado.

- [ ] **Step 1: Página de registro**

```tsx
// app/registro/page.tsx
"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function Registro() {
  const router = useRouter();
  const [nombre, setNombre] = useState("");
  const [correo, setCorreo] = useState("");
  const [clave, setClave] = useState("");
  const [error, setError] = useState("");

  async function registrar(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const supabase = createClient();
    const { data, error } = await supabase.auth.signUp({ email: correo, password: clave });
    if (error) { setError("No se pudo registrar: " + error.message); return; }
    if (data.user) {
      await supabase.from("usuarios").update({ nombre }).eq("id", data.user.id);
    }
    router.push("/pendiente");
  }

  return (
    <main className="mx-auto max-w-sm p-6">
      <h1 className="text-xl font-semibold mb-4">Crear cuenta</h1>
      <form onSubmit={registrar} className="space-y-3">
        <input className="w-full border rounded p-2" placeholder="Nombre completo"
          value={nombre} onChange={(e) => setNombre(e.target.value)} required />
        <input className="w-full border rounded p-2" type="email" placeholder="Correo"
          value={correo} onChange={(e) => setCorreo(e.target.value)} required />
        <input className="w-full border rounded p-2" type="password" placeholder="Contraseña"
          value={clave} onChange={(e) => setClave(e.target.value)} required minLength={6} />
        {error && <p className="text-red-600 text-sm">{error}</p>}
        <button className="w-full bg-green-700 text-white rounded p-2">Registrarme</button>
      </form>
    </main>
  );
}
```

- [ ] **Step 2: Página "pendiente"**

```tsx
// app/pendiente/page.tsx
export default function Pendiente() {
  return (
    <main className="mx-auto max-w-md p-6 text-center">
      <h1 className="text-xl font-semibold mb-2">Cuenta en revisión</h1>
      <p>Tu solicitud fue enviada. El dueño debe aprobarla antes de que puedas ingresar.</p>
    </main>
  );
}
```

- [ ] **Step 3: Página de login**

```tsx
// app/login/page.tsx
"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function Login() {
  const router = useRouter();
  const [correo, setCorreo] = useState("");
  const [clave, setClave] = useState("");
  const [error, setError] = useState("");

  async function ingresar(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const supabase = createClient();
    const { data: login, error } = await supabase.auth.signInWithPassword({
      email: correo, password: clave });
    if (error) { setError("Correo o contraseña incorrectos."); return; }
    const { data: perfil } = await supabase
      .from("usuarios").select("estado").eq("id", login.user.id).single();
    if (perfil?.estado === "activo") { router.push("/inicio"); }
    else { router.push("/pendiente"); }
  }

  return (
    <main className="mx-auto max-w-sm p-6">
      <h1 className="text-xl font-semibold mb-4">Ingresar</h1>
      <form onSubmit={ingresar} className="space-y-3">
        <input className="w-full border rounded p-2" type="email" placeholder="Correo"
          value={correo} onChange={(e) => setCorreo(e.target.value)} required />
        <input className="w-full border rounded p-2" type="password" placeholder="Contraseña"
          value={clave} onChange={(e) => setClave(e.target.value)} required />
        {error && <p className="text-red-600 text-sm">{error}</p>}
        <button className="w-full bg-green-700 text-white rounded p-2">Ingresar</button>
      </form>
    </main>
  );
}
```

- [ ] **Step 4: Verificación manual del flujo**

Con `.env.local` configurado y `npm run dev`:
1. Ir a `/registro`, crear una cuenta con un correo distinto al del dueño → redirige a `/pendiente`.
2. En Supabase, confirmar que aparece una fila en `usuarios` con `estado = pendiente`.
3. Registrar/ingresar con el correo del dueño → la fila tiene `rol = dueno`, `estado = activo`.
Expected: comportamiento descrito; sin errores en consola.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: páginas de registro, login y pendiente"
```

---

### Task 7: Layout del panel privado con guardia de sesión

**Files:**
- Create: `app/(panel)/layout.tsx`, `app/(panel)/inicio/page.tsx`

**Interfaces:**
- Consumes: `createClient()` servidor (Task 5), `puedeIngresar` (Task 3).
- Produces: layout que bloquea el panel a quien no esté `activo`, con barra lateral de módulos.

- [ ] **Step 1: Layout del panel con guardia**

```tsx
// app/(panel)/layout.tsx
import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: perfil } = await supabase
    .from("usuarios")
    .select("nombre, rol, estado, permisos")
    .eq("id", user.id)
    .single();

  if (!perfil || perfil.estado !== "activo") redirect("/pendiente");

  const p = perfil.permisos as Record<string, boolean>;
  const esDueno = perfil.rol === "dueno";

  return (
    <div className="flex min-h-screen">
      <aside className="w-56 bg-green-900 text-white p-4 space-y-2">
        <div className="font-bold mb-4">AMT Agroindustria</div>
        <Link className="block" href="/inicio">Inicio</Link>
        {(esDueno || p.acopio) && <Link className="block" href="/acopio">Acopio</Link>}
        {(esDueno || p.inventario) && <Link className="block" href="/inventario">Inventario</Link>}
        {(esDueno || p.caja) && <Link className="block" href="/caja">Caja</Link>}
        {(esDueno || p.ventas) && <Link className="block" href="/ventas">Ventas</Link>}
        {esDueno && <Link className="block mt-4" href="/solicitudes">Solicitudes</Link>}
      </aside>
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}
```

- [ ] **Step 2: Dashboard placeholder**

```tsx
// app/(panel)/inicio/page.tsx
export default function Inicio() {
  return (
    <div>
      <h1 className="text-2xl font-semibold">Bienvenido</h1>
      <p className="text-gray-600">Aquí irá el resumen (caja, stock, ventas).</p>
    </div>
  );
}
```

- [ ] **Step 3: Verificación manual**

1. Sin sesión, abrir `/inicio` → redirige a `/login`.
2. Con usuario `pendiente`, abrir `/inicio` → redirige a `/pendiente`.
3. Con el dueño, abrir `/inicio` → ve el panel con todos los enlaces.
Expected: comportamiento descrito.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: layout del panel con guardia de sesión y barra de módulos"
```

---

### Task 8: Página del dueño para aprobar solicitudes y asignar permisos

**Files:**
- Create: `app/(panel)/solicitudes/page.tsx`, `app/(panel)/solicitudes/acciones.ts`

**Interfaces:**
- Consumes: `createClient()` servidor, `es_dueno_activo()` (RLS, Task 4).
- Produces: server actions `aprobarUsuario(id, permisos)`, `rechazarUsuario(id)`, `suspenderUsuario(id)`.

- [ ] **Step 1: Server actions**

```ts
// app/(panel)/solicitudes/acciones.ts
"use server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { Permisos } from "@/lib/types";

async function exigirDueno() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("No autenticado");
  const { data } = await supabase.from("usuarios")
    .select("rol, estado").eq("id", user.id).single();
  if (data?.rol !== "dueno" || data?.estado !== "activo")
    throw new Error("Solo el dueño puede hacer esto");
  return { supabase, ownerId: user.id };
}

export async function aprobarUsuario(id: string, permisos: Permisos) {
  const { supabase, ownerId } = await exigirDueno();
  const { error } = await supabase.from("usuarios").update({
    estado: "activo", permisos, aprobado_por: ownerId, aprobado_en: new Date().toISOString(),
  }).eq("id", id);
  if (error) throw new Error("No se pudo aprobar: " + error.message);
  revalidatePath("/solicitudes");
}

export async function rechazarUsuario(id: string) {
  const { supabase } = await exigirDueno();
  const { error } = await supabase.from("usuarios").update({ estado: "suspendido" }).eq("id", id);
  if (error) throw new Error("No se pudo rechazar: " + error.message);
  revalidatePath("/solicitudes");
}
```

- [ ] **Step 2: Página de solicitudes**

```tsx
// app/(panel)/solicitudes/page.tsx
import { createClient } from "@/lib/supabase/server";
import { aprobarUsuario, rechazarUsuario } from "./acciones";

export default async function Solicitudes() {
  const supabase = await createClient();
  const { data: pendientes } = await supabase
    .from("usuarios").select("id, nombre, correo, creado_en")
    .eq("estado", "pendiente").order("creado_en");

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-4">Solicitudes de acceso</h1>
      {(!pendientes || pendientes.length === 0) && <p>No hay solicitudes pendientes.</p>}
      <ul className="space-y-4">
        {pendientes?.map((u) => (
          <li key={u.id} className="border rounded p-4">
            <p className="font-medium">{u.nombre || "(sin nombre)"} — {u.correo}</p>
            <form action={async (formData: FormData) => {
              "use server";
              await aprobarUsuario(u.id, {
                acopio: formData.get("acopio") === "on",
                inventario: formData.get("inventario") === "on",
                caja: formData.get("caja") === "on",
                ventas: formData.get("ventas") === "on",
              });
            }} className="mt-2 space-x-3">
              <label><input type="checkbox" name="acopio" /> Acopio</label>
              <label><input type="checkbox" name="inventario" /> Inventario</label>
              <label><input type="checkbox" name="caja" /> Caja</label>
              <label><input type="checkbox" name="ventas" /> Ventas</label>
              <button className="bg-green-700 text-white rounded px-3 py-1">Aprobar</button>
            </form>
            <form action={async () => { "use server"; await rechazarUsuario(u.id); }} className="mt-2">
              <button className="text-red-600 text-sm">Rechazar</button>
            </form>
          </li>
        ))}
      </ul>
    </div>
  );
}
```

- [ ] **Step 3: Verificación manual del flujo completo**

1. Como dueño, abrir `/solicitudes` → ver al usuario pendiente creado en Task 6.
2. Marcar "Ventas" y aprobar → la fila pasa a `estado = activo`, `permisos.ventas = true`.
3. Ingresar con ese usuario → entra al panel y ve solo "Inicio" y "Ventas".
Expected: comportamiento descrito; RLS impide que un no-dueño abra `/solicitudes` (verificar que redirige/no muestra datos).

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: aprobación de usuarios y asignación de permisos por el dueño"
```

---

### Task 9: Sitio web público (estructura base)

**Files:**
- Create: `app/(publico)/layout.tsx`, `app/(publico)/page.tsx`, `app/(publico)/nosotros/page.tsx`, `app/(publico)/catalogo/page.tsx`, `app/(publico)/contacto/page.tsx`
- Modify: eliminar `app/page.tsx` por defecto (la home pasa a ser `(publico)/page.tsx`)

**Interfaces:**
- Produces: sitio público navegable con enlace "Ingresar" al login.

- [ ] **Step 1: Layout público con navegación**

```tsx
// app/(publico)/layout.tsx
import Link from "next/link";

export default function PublicoLayout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <header className="flex items-center justify-between p-4 border-b">
        <Link href="/" className="font-bold text-green-900">AMT Agroindustria</Link>
        <nav className="space-x-4 text-sm">
          <Link href="/nosotros">Nosotros</Link>
          <Link href="/catalogo">Catálogo</Link>
          <Link href="/contacto">Contacto</Link>
          <Link href="/login" className="bg-green-700 text-white rounded px-3 py-1">Ingresar</Link>
        </nav>
      </header>
      {children}
      <footer className="p-4 border-t text-center text-sm text-gray-500">
        AMT Agroindustria S.A.C. — Aguaytía, Ucayali, Perú
      </footer>
    </div>
  );
}
```

- [ ] **Step 2: Páginas públicas (Inicio, Nosotros, Catálogo, Contacto)**

```tsx
// app/(publico)/page.tsx
export default function Home() {
  return (
    <main className="p-8 max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold text-green-900">Cacao fino de la Amazonía peruana</h1>
      <p className="mt-3 text-gray-700">
        AMT Agroindustria acopia y procesa cacao de pequeños productores de Padre Abad, Ucayali.
      </p>
    </main>
  );
}
```

```tsx
// app/(publico)/nosotros/page.tsx
export default function Nosotros() {
  return (
    <main className="p-8 max-w-3xl mx-auto">
      <h1 className="text-2xl font-semibold">Nosotros</h1>
      <p className="mt-3 text-gray-700">
        Empresa familiar de Aguaytía dedicada al acopio, procesamiento y comercialización de cacao.
      </p>
    </main>
  );
}
```

```tsx
// app/(publico)/catalogo/page.tsx
export default function Catalogo() {
  return (
    <main className="p-8 max-w-3xl mx-auto">
      <h1 className="text-2xl font-semibold">Catálogo</h1>
      <p className="mt-3 text-gray-600">Próximamente: nuestros productos de cacao.</p>
    </main>
  );
}
```

```tsx
// app/(publico)/contacto/page.tsx
export default function Contacto() {
  return (
    <main className="p-8 max-w-3xl mx-auto">
      <h1 className="text-2xl font-semibold">Contacto</h1>
      <p className="mt-3 text-gray-600">Próximamente: formulario de contacto.</p>
    </main>
  );
}
```

- [ ] **Step 3: Eliminar la home por defecto del scaffold**

```bash
rm -f app/page.tsx
```

- [ ] **Step 4: Verificación**

Run: `npm run dev`
Expected: `/` muestra el sitio público; la navegación funciona; "Ingresar" lleva a `/login`.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: sitio web público base (inicio, nosotros, catálogo, contacto)"
```

---

### Task 10: Despliegue en Vercel

**Files:**
- (Sin cambios de código; configuración de despliegue)

**Interfaces:**
- Produces: URL pública previsualizable.

- [ ] **Step 1: Subir el repositorio a GitHub** (o conectar directamente con Vercel CLI)

```bash
# Opción CLI:
npm i -g vercel
vercel
```

- [ ] **Step 2: Cargar variables de entorno en Vercel**

Cargar en el proyecto de Vercel: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `OWNER_EMAIL` (mismos valores que `.env.local`).

- [ ] **Step 3: Configurar URL de redirección en Supabase Auth**

En Supabase → Authentication → URL Configuration, agregar la URL de Vercel a "Site URL" y "Redirect URLs".

- [ ] **Step 4: Desplegar a producción y verificar**

```bash
vercel --prod
```
Expected: la URL pública abre el sitio; registro/login/aprobación funcionan igual que en local.

- [ ] **Step 5: Commit (config si aplica)**

```bash
git add -A
git commit -m "chore: despliegue inicial en Vercel" --allow-empty
```

---

## Self-Review (cobertura del spec)

- **Arquitectura (spec §3):** Tasks 1, 5, 7, 9 (Next.js, Supabase, dos zonas). ✅
- **Control de acceso y roles (spec §4):** Tasks 3, 4, 6, 7, 8 (super-admin por env, registro→pendiente→aprobación, permisos por módulo, RLS). ✅
- **Modelo de datos — usuarios (spec §5.1):** Task 4. ✅ (Las tablas de acopio/inventario/caja/ventas son de fases posteriores, fuera de Fase 0.)
- **Calidad/seguridad (spec §7):** RLS en Task 4, validaciones básicas y mensajes en español en Tasks 6/8, pruebas unitarias en Task 3. ✅
- **Sitio web (spec §5.6/§6):** Task 9 (estructura base; catálogo/contacto se completan en Fase 5). ✅
- **Despliegue (spec §3):** Task 10. ✅

**Nota de alcance:** Esta Fase 0 NO implementa los módulos de negocio (acopio, inventario, caja, ventas) ni el catálogo dinámico — esos son las Fases 1–5, cada una con su propio plan. La Fase 0 entrega: app desplegada + sitio público + login + aprobación de usuarios con permisos.
