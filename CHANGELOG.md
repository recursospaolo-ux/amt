# Registro de cambios — AMT Agroindustria

## Construcción inicial del sistema

Sistema de gestión integral para AMT Agroindustria S.A.C. (acopio de cacao, Ucayali).

### Plataforma
- App **Next.js** (App Router, TypeScript) + **Tailwind CSS** + **Supabase** (PostgreSQL, Auth, RLS).
- Desplegada en **Vercel** con auto-deploy desde GitHub (`recursospaolo-ux/amt`, rama `main`).
- Pruebas con **Vitest**.

### Acceso y seguridad
- Login y registro con seguridad real a nivel de base de datos (RLS).
- **Administrador único**; los demás se registran y quedan **pendientes** hasta aprobación.
- En el registro se solicita **nombre, DNI y tipo (proveedor/trabajador)**.
- Botón para **ver/ocultar contraseña**.

### Módulos
- **Acopio y trazabilidad**: productores, lotes (en baba / seco), procesos por etapa, clasificación → inventario.
- **Inventario**: stock por calidad (vista calculada) y movimientos.
- **Caja**: ingresos/egresos con saldo automático.
- **Ventas**: clientes y ventas (descuentan stock y suman a caja vía funciones de base de datos).
- **Sitio web**: catálogo dinámico y formulario de contacto.

### Identidad visual
- Paleta **cacao** unificada (`#8a5a2c`, crema `#efe7db`) en todo el panel.
- Login/registro con diseño **split-screen** (foto de cacao + formulario), logo centrado y alto contraste.
- Barra lateral con íconos, ítem activo resaltado y tarjeta de usuario.

### Base de datos (migraciones)
- `0001_usuarios.sql` — perfiles, RLS y trigger de alta (primer usuario = dueño).
- `0002_modulos.sql` — tablas de módulos, RLS por permiso, vista de stock, funciones `clasificar_lote` y `registrar_venta`.
- `0003_usuario_dni_tipo.sql` — DNI y tipo (proveedor/trabajador) en el registro.
