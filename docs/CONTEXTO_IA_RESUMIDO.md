## 1. Qué es ADS-POS

- **Tipo**: Sistema de Punto de Venta (POS) web, multi‑página (MPA) estática.
- **Stack**:
  - Frontend: HTML5, CSS3, JS ES6+, Bootstrap 5, Font Awesome, Poppins.
  - Backend/Datos: Supabase (PostgreSQL + Auth + API REST automática).
  - Hosting: Vercel (frontend), Supabase (BD).
- **Dominio funcional**:
  - Ventas, facturación, caja.
  - Inventario, movimientos, compras.
  - Clientes, proveedores, usuarios.
  - Dashboard de KPIs y reportes.

**Objetivo**: Centralizar la operación de una tienda (ventas, stock, finanzas) en una app web sin backend propio, apoyada en Supabase.

---

## 2. Arquitectura y organización

- **Estructura principal**:
  - `index.html` – entrada general.
  - `pages/` – cada módulo es una página HTML:
    - `login`, `Menu`, `panel` (dashboard).
    - `ventas`, `ventas-historial`, `facturacion`.
    - `compras`, `inventario`, `movimientos`.
    - `caja-*` (apertura/cierre/historial).
    - `categorias`, `productos`, `clientes`, `proveedores`, `usuarios`, `configuracion`, `reportes`, `ayuda`, `perfil`.
    - `calculadora` – calculadora de costos/precio de venta.
  - `assets/css/` – estilos globales (`main.css`, `pos.css`, `components.css`, `landing.css`).
  - `assets/js/` – lógica por dominio:
    - Core: `supabase-config.js`, `database.js`, `auth.js`.
    - Módulos: `ventas.js`, `compras.js`, `inventario.js`, `movimientos.js`, `productos.js`, `categorias.js`, `clientes.js`, `proveedores.js`, `usuarios.js`, `gastos.js`.
  - `crear_base_datos_supabase.sql` + documentación en `DOCUMENTACION_*` – definen el modelo de BD.

- **PWA (Progressive Web App)**:
  - `manifest.json` en la raíz con:
    - `start_url: /index.html`, `display: "standalone"`, `theme_color: "#007bff"`.
    - Iconos: `/assets/img/icon-192.png`, `/assets/img/icon-512.png`.
  - `service-worker.js`:
    - Precacha el shell de la app (index, login, menú, panel, CSS/JS base, logos).
    - Ignora llamadas a Supabase (`supabase.co`) para que siempre vayan a red.

- **Conexión a Supabase**:
  - `supabase-config.js` crea `window.supabaseClient` y `window.ensureAuthenticated()` (login automático con admin sembrado en desarrollo).
  - `database.js` expone `DatabaseService` (usualmente `window.db`) con:
    - CRUD genérico (`select`, `insert`, `update`, `delete`).
    - Métodos específicos (`getProductos`, `getCategorias`, `getFinanzasMensualesRango`, `createMovimientoInventario`, etc.).

---

## 3. Modelo de datos (muy resumido)

- Base de datos PostgreSQL en Supabase (RLS activo).
- Tablas clave (ver detalles en `DOCUMENTACION_BASE_DATOS.md`):
  - `usuarios`, `categorias`, `productos`, `clientes`, `proveedores`.
  - `ventas`, `ventas_detalle`, `compras`, `compras_detalle`.
  - `movimientos_inventario`.
  - `finanzas_mensuales`, `gastos_mensuales_detalle`.
  - `caja_*`, `configuracion_empresa`.

**Relaciones típicas**:
- `productos.categoria_id` → `categorias.id`
- `ventas_detalle.venta_id` → `ventas.id` (y cada detalle referencia un `producto_id`).
- `compras_detalle.compra_id` → `compras.id`.
- `movimientos_inventario.producto_id` → `productos.id`.

Triggers en SQL actualizan:
- `productos.stock_actual` a partir de `movimientos_inventario`, ventas y compras.
- Agregados en `finanzas_mensuales` a partir de ventas, compras y gastos.

---

## 4. Lógica de negocio clave

### 4.1 Ventas / Compras / Inventario

- Al registrar una **venta**:
  - Se crean filas en `ventas` y `ventas_detalle`.
  - Se registran movimientos de inventario (salida) y se ajusta `productos.stock_actual`.
  - Se actualizan totales en `finanzas_mensuales` (ventas netas, impuestos, etc.).

- Al registrar una **compra**:
  - Se crean `compras` y `compras_detalle`.
  - Se generan movimientos de inventario (entrada) y se incrementa `stock_actual`.
  - Se actualizan compras/costos en `finanzas_mensuales`.

- `inventario.js`:
  - Calcula KPIs: productos totales, stock bajo, sin stock, valor inventario a costo y a precio de venta.
  - Usa `window.db.getProductos` para traer lotes de productos (limit ≈ 1000).

### 4.2 Dashboard (panel.html)

- **KPIs mensuales** (sección “KPIs Principales”):
  - Fuente: `finanzas_mensuales` (año/mes actual) mediante `window.db.getFinanzasMensuales`.
  - Muestra: Ventas del mes, gastos del mes, utilidad, flujo operativo, margen (%).

- **KPIs operativos** (históricos, sección “KPIs Operativos”):
  - `cargarKPIsOperativos()`:
    - `Ventas Totales` = suma de `finanzas_mensuales.ventas_netas`.
    - `Gastos Totales` = suma histórica de `gastos_mensuales_detalle.monto`.
    - `Punto Equilibrio Total` = Ventas Totales − (Gastos Totales + Compras Totales).
    - **Inventario**:
      - `Productos con Stock Bajo` = conteo de productos con `stock_actual <= 0` o `stock_actual <= stock_min`.
      - `Total Productos` = número total de productos.
      - `Valor Inventario` = suma de (`stock_actual * precio_venta`).
    - Datos de productos via `window.db.getProductos({ limit: 1000, ... })`.

- **Gráficos** (Chart.js):
  - Ventas mensuales por año, comparativas de años, flujo operativo (ventas vs gastos vs flujo).
  - Datos obtenidos con `getFinanzasMensualesRango`.

### 4.3 Calculadora de costos (calculadora.html)

- Combina:
  - **Costos de importación** (precio unitario, TRM, envío, impuestos, IVA importación, otros).
  - **Costos fijos de Mercado Libre** (comisión en COP, costo fijo, envío, retenciones, IVA, otros).
  - **Margen de ganancia deseado (%)**.
- Cálculos:
  - Costo total de compra y costo unitario real.
  - Costos ML por unidad = (comisión + fijos) / cantidad.
  - Precio de venta sugerido = `(costoUnitario + costosMLUnidad) / (1 − margenDeseado)`.
  - Ganancia neta por unidad y rentabilidad (%).
  - Estado: “Rentable / No rentable” según si la rentabilidad ≥ margen deseado.

---

## 5. Puntos a tener en cuenta al modificar código

- **Autenticación**:
  - Siempre usar `window.ensureAuthenticated()` antes de operaciones críticas contra Supabase.

- **Acceso a datos**:
  - Preferir `window.db` (DatabaseService) en lugar de llamar a Supabase directo, salvo casos especiales.
  - Respetar filtros `deleted_at IS NULL` para entidades con soft‑delete.

- **KPIs y cálculos**:
  - Muchos KPIs del dashboard dependen de:
    - `finanzas_mensuales` (agregados por mes/año).
    - `gastos_mensuales_detalle` (detalle de gastos).
    - `productos` (stock y precios).
  - Antes de cambiar fórmulas, revisar `DOCUMENTACION_BASE_DATOS.md` y lógica actual en `panel.html`, `inventario.js`.

- **Inventario**:
  - No actualizar `stock_actual` manualmente desde el frontend; usar funciones/APIs que generen **movimientos de inventario**, dejando que los triggers mantengan el stock consistente.

- **Seguridad**:
  - No exponer nuevas credenciales en el frontend.
  - Mantener el uso del cliente Supabase dentro de las capacidades previstas (RLS ya configurado).

Si se necesita más detalle de alguna área, usar como referencia ampliada `docs/CONTEXTO_PROYECTO.md` y los documentos `DOCUMENTACION_*` existentes en el repositorio.

