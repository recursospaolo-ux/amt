# Sistema de Gestión — AMT Agroindustria S.A.C.
**Documento de diseño**

- **Fecha:** 2026-06-21
- **Estado:** Aprobado (Partes 1–4). Sujeto a cambios iterativos solicitados por el cliente.
- **Empresa:** AMT Agroindustria S.A.C. — RUC 20394036502

---

## 1. Contexto de la empresa (investigación)

| Dato | Valor |
|---|---|
| Razón social | AMT Agroindustria S.A.C. |
| RUC | 20394036502 |
| Tipo | Sociedad Anónima Cerrada |
| Inscripción | 16 de junio de 2014 |
| Inicio de actividades | 31 de julio de 2014 |
| Estado / Condición | ACTIVO / HABIDO |
| Domicilio fiscal / planta | Carretera Federico Basadre Km. 166 (Carretera Aguaytía – Boquerón), Padre Abad, Ucayali |
| Anexos | Lima (Miraflores) y Ucayali |
| CIIU principal | 4620 — Venta mayorista de materias primas agropecuarias |
| CIIU secundarios | 0150 (cultivo mixto + cría) · 0163 (actividades poscosecha) |
| Gerente General | Edgar Amadeo Mestanza Ramírez |
| Gerente | Harry Mestanza Zambrano |
| Tamaño | Micro/pequeña, familiar; ~2 trabajadores en planilla (ene-2024) |

**Negocio:** agroindustria de **cacao** en Aguaytía. Compra grano a pequeños productores,
lo procesa (fermentado/secado/clasificación) y lo clasifica por tamaño: grano pequeño →
**chocolate local**, grano grande → **exportación**. Plan futuro declarado: línea de
**chifles (plátano)**. Ha postulado a fondos de innovación (ProInnóvate).

**Fuentes:** Veritrade (RUC 20394036502), Directorio Nacional (Ucayali/Padre Abad),
Inforegión ("ATM Agroindustria presenta su nueva planta de cacao"), ProInnóvate (PAI).

---

## 2. Alcance acordado

Sistema integral con 5 módulos + sitio web público + control de acceso:

1. **Acopio y trazabilidad de cacao**
2. **Inventario y producción**
3. **Caja / Tesorería** (dinero ingresado y retirado)
4. **Ventas y registro comercial**
5. **Sitio web / catálogo público**
6. **Acceso:** dueño con control total + trabajadores con registro aprobado por el dueño

### Decisiones de alcance confirmadas
- **Facturación:** solo **registro interno** de ventas (sin emisión electrónica SUNAT por ahora).
- **Datos iniciales:** se arranca **desde cero** (sin migración).
- **Moneda:** única, **soles (S/)**.
- **Acopio:** cada productor trae su cacao **en baba (fresco)** o **seco**, y lo vende a
  AMT según el **precio del mercado del día**. Cada entrega = un lote (trazabilidad por productor).

### Fuera de alcance (por ahora)
- Emisión de comprobantes electrónicos ante SUNAT (OSE/PSE).
- Manejo multimoneda (dólares).
- App móvil nativa (la web es responsiva y se usa desde el celular).
- Funcionamiento sin conexión (offline). Requiere internet.

---

## 3. Arquitectura

Una sola aplicación **Next.js (App Router, TypeScript)** con dos zonas:

```
SITIO WEB PÚBLICO  → Inicio · Nosotros · Catálogo · Contacto
        │  (botón "Ingresar")
        ▼
PANEL PRIVADO (login) → Acopio · Inventario · Caja · Ventas · Panel del Dueño
```

- **UI:** Tailwind CSS + shadcn/ui, en español, responsiva (celular y PC).
- **Backend / Base de datos / Auth / Archivos:** **Supabase** (PostgreSQL gestionado,
  Supabase Auth, Storage para fotos/comprobantes).
- **Seguridad:** **Row Level Security (RLS)** en la base de datos — las reglas de acceso
  se aplican a nivel de datos, no solo en pantalla.
- **Despliegue:** **Vercel**. Previsualización local (`npm run dev` → `localhost:3000`) y
  URL en la nube por cada publicación; dominio propio opcional a futuro.

### Consideración: conectividad
Aguaytía es zona rural amazónica con internet intermitente. El diseño prioriza una app
liviana; no se implementa modo offline en esta etapa (se revisará si es necesario).

---

## 4. Control de acceso y roles

- **Dueño / Administrador (Edgar Mestanza):** su correo se configura como **super-admin**
  desde el inicio (semilla). Acceso total. Único que aprueba usuarios.
- **Trabajadores:** se registran (correo + contraseña) → quedan **Pendiente** → el dueño
  **aprueba o rechaza**. Al aprobar, asigna **permisos por módulo** (casillas).
- **Estados de usuario:** Pendiente · Activo · Suspendido.
- **Auditoría:** cada operación importante registra quién y cuándo.

> Cargos predefinidos (ej. "Acopiador", "Almacenero", "Vendedor") como plantillas de
> permisos: opcional, a confirmar con el cliente. Por defecto, permisos por casillas.

---

## 5. Modelo de datos

### 5.1 Acceso
- **usuarios:** nombre, correo, rol (dueño/trabajador), estado (pendiente/activo/suspendido),
  permisos por módulo, aprobado_por, fecha_aprobación.

### 5.2 Acopio y trazabilidad
- **productores:** nombre, DNI, comunidad/zona, teléfono, certificado (orgánico s/n), notas.
- **lotes_acopio:** código_lote, productor, fecha, **estado_recepción (en baba / seco)**,
  peso_kg, % humedad, **precio_kg (mercado del día)**, monto_total (calculado),
  estado (recibido → fermentado → secado → clasificado), usuario_registró.
- **procesos_lote** (trazabilidad): lote, etapa (recepción/fermentado/secado/clasificación),
  fecha, peso_resultante, merma, observaciones, usuario.
  - Si entra **en baba**: recepción → fermentado → secado → clasificación.
  - Si entra **seco**: recepción → clasificación (se omiten fermentado/secado).
- **clasificación:** por lote, kg de **grano pequeño** y kg de **grano grande** →
  generan entradas de inventario.

### 5.3 Inventario y producción
- **productos:** nombre, categoría (grano pequeño, grano grande, chocolate, chifles…),
  unidad (kg/unidad), es_para_venta, visible_web.
- **inventario_movimientos:** producto, tipo (entrada/salida/ajuste/merma), cantidad,
  lote_origen, fecha, motivo, usuario. **Stock actual = suma de movimientos.**
- **ordenes_producción** (opcional): producto_resultante, insumos consumidos,
  cantidad_producida, merma, fecha, usuario.

### 5.4 Caja / Tesorería
- **caja_movimientos:** tipo (ingreso/egreso), categoría (venta, compra cacao,
  pago productor, gasto operativo, sueldo, otro), monto, fecha, descripción,
  relacionado_con (venta/lote), comprobante (adjunto opcional), usuario.
  **Saldo = suma de movimientos.**

### 5.5 Ventas
- **clientes:** nombre/razón social, RUC/DNI, tipo (local/exportación), país, contacto, notas.
- **ventas:** código, cliente, fecha, tipo, estado (cotización→confirmada→entregada→pagada),
  total, usuario.
- **venta_items:** venta, producto, cantidad, precio_unit, subtotal, **lote_origen**
  (trazabilidad: de qué lote salió lo vendido).
- Venta cobrada → genera **ingreso en caja** automáticamente.

### 5.6 Sitio web
- **catálogo:** productos con `visible_web = true` (foto, descripción, precio referencial opcional).
- **contacto_mensajes:** nombre, correo, mensaje, fecha.

### 5.7 Hilo de trazabilidad
```
Productor → Lote de acopio → Procesos (baba/seco) → Inventario por calidad → Venta (lote_origen)
```
Dada una venta, se puede rastrear el productor y lote de origen del cacao.

---

## 6. Módulos y pantallas

- **Inicio (Dashboard):** saldo de caja, stock por calidad, lotes recientes, ventas del mes;
  el dueño ve solicitudes de acceso pendientes.
- **Acopio:** Productores (CRUD) · Nuevo acopio (productor, baba/seco, peso, humedad,
  precio/kg → monto y código de lote; pago opcional a Caja) · Lotes (línea de tiempo por
  etapas) · Clasificación (kg pequeño/grande → inventario).
- **Inventario:** Stock actual · Movimientos · Producción (opcional).
- **Caja:** Saldo y movimientos (filtros fecha/categoría) · Nuevo movimiento ·
  integración con ventas y pagos a productores.
- **Ventas:** Clientes · Nueva venta (descuenta stock, suma a caja) · Lista de ventas con estado.
- **Panel del Dueño:** Solicitudes de acceso · Usuarios · Reportes.
- **Sitio web público:** Inicio · Nosotros · Catálogo · Contacto.

---

## 7. Calidad, validaciones y respaldos

- **Validaciones:** campos obligatorios, formatos (DNI/RUC), números positivos,
  **prohibido stock negativo / sobreventa**, confirmación en acciones destructivas,
  mensajes de error claros en español.
- **Seguridad:** contraseñas cifradas (Supabase Auth), RLS, auditoría de operaciones clave.
- **Respaldos:** backups automáticos de Supabase + exportación a Excel.
- **Pruebas:** automáticas para lógica crítica (cálculo de stock, saldo de caja,
  encadenado de trazabilidad, descuento de inventario al vender) + pruebas manuales por flujo.

---

## 8. Plan de construcción por fases

Cada fase deja la app desplegable/previsualizable.

| Fase | Contenido |
|---|---|
| 0. Fundación | Next.js + Supabase, login con aprobación del dueño, estructura del panel y sitio público |
| 1. Acopio y trazabilidad | Productores, lotes, procesos (baba/seco), clasificación |
| 2. Inventario | Stock por calidad y movimientos (conectado a clasificación) |
| 3. Caja | Ingresos/egresos y saldo |
| 4. Ventas | Clientes y ventas (descuenta stock + suma a caja) |
| 5. Sitio web | Inicio, Nosotros, Catálogo, Contacto |
| 6. Reportes y pulido | Dashboard, reportes, ajustes finales |

---

## 9. Stack técnico (resumen)

- **Framework:** Next.js (App Router) + TypeScript
- **UI:** Tailwind CSS + shadcn/ui
- **Datos/Auth/Archivos:** Supabase (PostgreSQL + Auth + Storage, RLS)
- **Despliegue:** Vercel
- **Idioma de la interfaz:** Español (Perú)
- **Moneda:** Soles (S/)

---

## 10. Preguntas abiertas / a confirmar con el cliente
- ¿Usar cargos predefinidos (plantillas de permisos) o permisos por casillas libres?
- ¿Registrar el % de merma esperado por etapa como referencia?
- ¿Necesitan registrar el precio de mercado del día de forma centralizada, o basta con
  ingresarlo en cada compra?
- ¿Las ventas de exportación se registran en soles (confirmado) aunque el cobro real sea en
  dólares? (impacto en reportes)
