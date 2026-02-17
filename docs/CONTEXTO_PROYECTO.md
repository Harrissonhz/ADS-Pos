## 1. Descripción General del Proyecto

ADS-POS es un **sistema de Punto de Venta (POS) web** orientado a pequeñas y medianas empresas de retail.  
Permite gestionar de forma integrada:

- **Ventas y facturación**
- **Inventario y movimientos de stock**
- **Compras y proveedores**
- **Clientes**
- **Caja, finanzas y reportes**

**Propósito principal**  
Centralizar en una sola aplicación la operación diaria de una tienda física o comercio electrónico, desde la venta en mostrador hasta el control de inventario y análisis financiero.

**Problemas que resuelve**

- Falta de visibilidad sobre **stock**, productos con **inventario bajo** y valor de inventario.
- Dificultad para consolidar **ventas, compras, gastos y flujo de caja**.
- Gestión dispersa de **clientes y proveedores**.
- Necesidad de un POS moderno, accesible desde navegador y preparado para **facturación electrónica**.

**Público objetivo**

- Comercios minoristas.
- Tiendas físicas con o sin ecommerce.
- Pequeñas y medianas empresas que necesitan un POS moderno, pero sin infraestructura propia de backend (se apoya en Supabase).

---

## 2. Arquitectura del Proyecto

### 2.1 Tipo de aplicación

- **Frontend:** Aplicación web **multi‑página (MPA)** estática (HTML + JS) desplegada en Vercel.
- **Backend:** Sin servidor propio; usa **Supabase** como Backend‑as‑a‑Service (PostgreSQL + API REST + autenticación).
- **Patrón general:**  
  - Páginas HTML independientes bajo `pages/`.  
  - Cada página carga JavaScript específico que se conecta a Supabase mediante `assets/js/database.js` y `assets/js/auth.js`.

### 2.2 Tecnologías principales

- **Frontend**
  - HTML5, CSS3, JavaScript ES6+
  - **Bootstrap 5** (layout responsive y componentes)
  - **Font Awesome 6** (iconos)
  - **Google Fonts – Poppins** (tipografía)
  - CSS propios: `assets/css/main.css`, `assets/css/pos.css`, `assets/css/components.css`, `assets/css/landing.css`

- **Backend / Datos**
  - **Supabase** (PostgreSQL gestionado + API REST auto‑generada)
  - Autenticación Supabase (email/password)
  - Row Level Security (RLS) activado
  - Scripts SQL en el repositorio para **crear, poblar y limpiar** la base:
    - `crear_base_datos_supabase.sql`
    - `limpiar_todas_las_tablas.sql`, `limpiar_e_insertar_datos.sql`, etc.

- **Infraestructura**
  - **Vercel** para hosting del frontend (configurado vía `vercel.json`).
  - GitHub como repositorio principal (según README).

### 2.3 Estructura de carpetas

Raíz del proyecto:

- `index.html`  
  Landing / entrada principal a la app.

- `pages/`  
  Todas las páginas funcionales del sistema POS:
  - `login.html` – Autenticación.
  - `Menu.html` – Menú principal de módulos.
  - `panel.html` – Dashboard principal (KPIs, gráficos).
  - `ventas.html`, `ventas-historial.html` – Módulo de ventas.
  - `facturacion.html` – Facturación.
  - `compras.html` – Gestión de compras.
  - `inventario.html`, `movimientos.html` – Control y movimientos de inventario.
  - `caja-apertura.html`, `caja-cierre.html`, `caja-historial.html` – Módulo de caja.
  - `categorias.html`, `productos.html` – Catálogo de productos.
  - `clientes.html`, `proveedores.html` – Gestión de terceros.
  - `usuarios.html`, `perfil.html`, `configuracion.html`, `ayuda.html`, `reportes.html`.
  - `calculadora.html` – Calculadora avanzada de costos y precio de venta.

- `assets/css/`
  - `main.css` – Estilos base y tema general.
  - `pos.css` – Estilos específicos del flujo POS (panel, formularios, offcanvas, etc.).
  - `components.css`, `landing.css` – Estilos de componentes y landing.

- `assets/js/`
  - `supabase-config.js` – Inicialización del cliente Supabase y `ensureAuthenticated`.
  - `database.js` – Clase `DatabaseService` con funciones **genéricas (select/insert/update/delete)** y **específicas por entidad** (`getProductos`, `createMovimientoInventario`, `getFinanzasMensualesRango`, etc.).
  - `auth.js` – Lógica de autenticación de usuarios en el frontend.
  - Módulos por dominio:
    - `ventas.js`, `compras.js`, `gastos.js`
    - `inventario.js`, `movimientos.js`
    - `productos.js`, `categorias.js`, `clientes.js`, `proveedores.js`
    - `usuarios.js`

- `assets/img/` – Imágenes (logo, fondos, etc.).

- `docs` y archivos de documentación en raíz (nombres existentes):
  - `DOCUMENTACION_COMPLETA.md`, `DOCUMENTACION_FRONTEND.md`, `DOCUMENTACION_BASE_DATOS.md`
  - `ANALISIS_CAMPOS_BD.md`, `MODELO_OPTIMIZADO_FINAL.md`
  - `CONFIGURACION_PROYECTO.md`, `PROJECT_STATUS.md`, `README.md`

- `crear_base_datos_supabase.sql` – Script maestro de creación de tablas, índices, triggers, etc.

- `vercel.json` – Configuración de despliegue estático en Vercel.

---

## 3. Flujo General de la Aplicación

### 3.1 Inicio

1. El usuario accede a `index.html` o directamente a una página en `pages/` (en producción, vía Vercel).
2. La autenticación se maneja con Supabase:
   - En `supabase-config.js` se crea el cliente y se define `ensureAuthenticated()`.
   - Para entornos de desarrollo, `ensureAuthenticated()` inicia sesión automáticamente con un usuario sembrado (admin por defecto).
3. Una vez autenticado, el usuario llega a:
   - `login.html` → valida credenciales y redirige, o
   - `Menu.html` / `panel.html` si ya tiene sesión activa.

### 3.2 Navegación de usuario

- `Menu.html` funciona como **hub visual**:
  - Cada “módulo” (Ventas, Inventario, Compras, etc.) es una tarjeta con botones que enlazan a las páginas correspondientes en `pages/`.
  - Incluye un acceso directo a la **Calculadora de Costos** (`calculadora.html`) dentro del módulo de Compras.

- `panel.html` (Dashboard):
  - Muestra KPIs financieros (ventas del mes, gastos, utilidad, flujo operativo, margen, comparativos).
  - Muestra **KPIs operativos** (ventas totales históricas, gastos totales, punto de equilibrio, productos con stock bajo, total de productos, valor de inventario).
  - Incluye gráficos (Chart.js) de ventas por periodo, comparativos anuales y flujo operativo.

- Los demás módulos (`ventas.html`, `compras.html`, `inventario.html`, etc.) utilizan un layout común:
  - Navbar superior tipo POS.
  - Sidebar offcanvas con navegación lateral hacia otros módulos.

### 3.3 Flujo de datos

1. **Frontend (página HTML)** carga el JS específico (por ejemplo, `ventas.js`).
2. El JS del módulo:
   - Asegura sesión (`window.ensureAuthenticated()`).
   - Usa `window.db` (`DatabaseService` de `database.js`) o el cliente Supabase directo (`window.supabaseClient`) para:
     - Consultar tablas.
     - Insertar/actualizar registros.
3. **Supabase** expone una API REST basada en tablas (por ejemplo `from('ventas')`, `from('productos')`).
4. Los datos retornan como JSON, se formatean y se renderizan en tablas, tarjetas o gráficos (p.ej. en `panel.html` via Chart.js).

---

## 4. Lógica de Negocio

> Nota: se resumen reglas observadas en el código y en la documentación; algunos detalles de negocio finos pueden no estar completamente implementados o estar “en progreso”.

### 4.1 Ventas

- Cada venta:
  - Registra **cabecera** (cliente, fecha, totales, forma de pago).
  - Registra **detalle** (`ventas_detalle`) con productos, cantidades, precios unitarios, impuestos y descuentos.
- Al confirmar una venta:
  - Se actualizan **finanzas mensuales** (`finanzas_mensuales`) agregando ventas netas, impuestos, etc. (según lógica de triggers/servicios definidos en los scripts SQL).
  - Se crean **movimientos de inventario** ligados a `movimientos_inventario`.
  - Se descuenta `stock_actual` en `productos`.
- Validaciones típicas (implícitas en JS + BD):
  - No permitir cantidades negativas.
  - Confirmaciones cuando la cantidad vendida supera el stock disponible.
  - Control de ventas con stock = 0 (puede permitirlo con confirmación explícita).

### 4.2 Compras

- `compras.html` gestiona:
  - Datos de compra (proveedor, fechas, estado).
  - Detalle de productos comprados (cantidades, precios, impuestos).
- Al registrar una compra:
  - Se crean movimientos de inventario de tipo **entrada**.
  - Triggers de BD actualizan `stock_actual` en `productos`.
  - Se actualizan métricas de **finanzas mensuales** (compras, costo de mercadería vendida, etc.) según el script SQL.

### 4.3 Inventario y movimientos

- `inventario.html` y `inventario.js`:
  - Listan productos con `stock_actual`, `stock_min`, `stock_max`, indicadores de “Agotado”, “Stock Bajo”, “Activo/Inactivo”.
  - Calculan:
    - **Valor inventario a precio de venta** (`stock_actual * precio_venta`).
    - **Valor inventario a costo** (`stock_actual * precio_compra`).
  - KPIs: total productos, stock bajo, sin stock, valor inventario (venta y costo).

- `movimientos.html` y `movimientos.js`:
  - Registran entradas, salidas y ajustes de inventario.
  - Calculan **stock anterior / posterior** por movimiento.
  - Delegan el update real de `stock_actual` a los triggers en la base.

### 4.4 Caja y finanzas

- Módulos de caja (`caja-apertura`, `caja-cierre`, `caja-historial`) controlan:
  - Apertura y cierre de turno.
  - Saldo inicial/final.
  - Diferencias de caja.

- `finanzas_mensuales` almacena agregados por año/mes:
  - `ventas_netas`, `compras_total`, `gastos_operativos_total`, `utilidad_neta`, `flujo_operativo`, entre otros.
  - Usado en `panel.html` para:
    - KPIs mensuales.
    - Gráficos comparativos por año.
    - Cálculo de **flujo operativo** = ventas netas − (compras + gastos).

### 4.5 Dashboard (panel.html)

- KPIs principales del mes:
  - Ventas del mes, gastos del mes, utilidad neta, flujo operativo, margen de utilidad.
  - Colores de KPIs cambian según si son positivos/negativos o por umbrales (margen).

- KPIs comparativos:
  - Ventas mensuales por año.
  - Comparación entre años.
  - Flujo operativo anual (ventas vs gastos totales vs flujo).

- KPIs operativos (históricos):
  - **Ventas Totales**: suma histórica de `ventas_netas`.
  - **Gastos Totales**: suma histórica de `gastos_mensuales_detalle.monto` (y/o agregados financieros).
  - **Punto Equilibrio Total**: `Ventas Totales − (Gastos Totales + Compras Totales)`.
  - **Productos con Stock Bajo**: conteo de productos donde `stock_actual <= 0` o `stock_actual <= stock_min`.
  - **Total Productos**: número total de productos en la tabla `productos`.
  - **Valor Inventario**: suma de `stock_actual * precio_venta` para todos los productos.

### 4.6 Calculadora de Costos (calculadora.html)

- Bloques:
  - **Datos del producto** (nombre, SKU, plataforma, cantidad).
  - **Costes de compra** (precio unitario COP/USD, TRM, envío, impuestos, IVA importación, otros).
  - **Costos ML** (tipo publicación, comisión fija en COP, costo fijo, envío, retención, IVA comisión, otros gastos operativos).
  - **Margen deseado** (% ganancia).

- Cálculos clave:
  - Costo total producto = `(precio_unitario * TRM opcional) + envío + impuestos + IVA_import + otros`.
  - Costo unitario real = `costo_total / cantidad`.
  - Costos ML por unidad = `(comisión ML en COP + costos fijos ML) / cantidad`.
  - Precio venta sugerido = `(costo_unitario + costosML_unidad) / (1 − margenDeseado)`.
  - Ganancia neta por unidad = `precioVenta − costoUnitario − costosML_unidad`.
  - Rentabilidad (%) = `ganancia / precioVenta`.
  - Indicador Rentable / No rentable según si la rentabilidad real ≥ margen deseado.

### 4.7 Validaciones y procesos automatizados

- Validaciones de campos requeridos (por ejemplo en `DatabaseService.createCategoria`).
- RLS en PostgreSQL (seguridad por usuario/rol).
- Triggers SQL:
  - Actualización automática de `stock_actual` al registrar movimientos y compras/ventas.
  - Actualización de `finanzas_mensuales` ante registros de ventas, compras y gastos.

---

## 5. Estructura de Base de Datos

> Esta sección se basa en `crear_base_datos_supabase.sql` y `DOCUMENTACION_BASE_DATOS.md`.

### 5.1 Tablas principales (resumen)

- `usuarios` – Gestión de usuarios, roles, permisos, auditoría.
- `categorias` – Categorías de productos.
- `productos` – Catálogo de productos, precios, impuestos, stock y estados.
- `clientes` – Información de clientes (personas y empresas).
- `proveedores` – Información de proveedores.
- `ventas`, `ventas_detalle` – Cabecera y detalle de ventas.
- `compras`, `compras_detalle` – Cabecera y detalle de compras.
- `movimientos_inventario` – Movimientos de stock (entrada, salida, ajuste).
- `caja_apertura` / `caja_cierre` / `caja_historial` – Flujo de caja.
- `finanzas_mensuales` – Agregados financieros por mes y año.
- `gastos_mensuales_detalle` – Detalle de gastos por categoría, mes y año.
- `configuracion_empresa` – Parámetros globales de la empresa/sistema.

### 5.2 Relaciones clave (alto nivel)

- `productos.categoria_id` → `categorias.id`
- `ventas.cliente_id` → `clientes.id`
- `compras.proveedor_id` → `proveedores.id`
- `ventas_detalle.venta_id` → `ventas.id`
- `compras_detalle.compra_id` → `compras.id`
- `movimientos_inventario.producto_id` → `productos.id`
- Tablas de auditoría y configuración referencian `usuarios.id` para `created_by` / `updated_by`.

Detalles exactos de campos y restricciones están documentados tabla por tabla en `DOCUMENTACION_BASE_DATOS.md`.  
Si se requiere un modelo ER formal, debe construirse a partir de ese documento y del script SQL.

---

## 6. Endpoints o Servicios

No hay **endpoints HTTP personalizados** implementados en este repositorio (no existe backend propio tipo Node/Express).  
Toda la comunicación con la base de datos se realiza a través de:

1. **API REST automática de Supabase**  
   Ejemplo de patrón en código:
   - `supabaseClient.from('productos').select('*')`
   - `supabaseClient.from('ventas').insert([...])`
   - Filtros con `eq`, `or`, `range`, `order`, etc.

2. **Capa de servicios de `DatabaseService` (`assets/js/database.js`)**  
   Esto actúa como “SDK interno”:
   - Métodos genéricos:
     - `select(table, options)`
     - `insert(table, data)`
     - `update(table, id, updates)`
     - `delete(table, id)`
   - Métodos específicos:
     - `getCategorias`, `createCategoria`, `updateCategoria`, etc.
     - `getProductos`, `createProducto`, etc.
     - `getFinanzasMensuales`, `getFinanzasMensualesRango`
     - `createMovimientoInventario`, entre otros.

**Conclusión:**  
Los “servicios” del sistema son las combinaciones de estas funciones contra las tablas de Supabase. No se define un catálogo de endpoints HTTP clásicos (URL + método) más allá de lo que expone Supabase internamente.

---

## 7. Componentes o Módulos Principales

### 7.1 Módulos de páginas (`pages/`)

- `login.html` – Formulario de login, usa `auth.js`.
- `Menu.html` – Menú principal con tarjetas de acceso a cada módulo.
- `panel.html` – Dashboard con:
  - KPIs financieros (mensuales y comparativos).
  - KPIs operativos (totales históricos, inventario).
  - Gráficas con Chart.js.
- `ventas.html` / `ventas-historial.html` – Flujo de ventas y su historial.
- `compras.html` – Creación y gestión de compras.
- `inventario.html` – Vista de inventario y KPIs de stock.
- `movimientos.html` – Alta y consulta de movimientos de inventario.
- `caja-*.html` – Apertura, cierre y reporte de caja.
- `productos.html`, `categorias.html` – ABM de catálogo.
- `clientes.html`, `proveedores.html` – ABM de terceros.
- `usuarios.html`, `perfil.html`, `configuracion.html` – Administración del sistema.
- `reportes.html` – Reportes agregados (estructura base, lógica ajustable).
- `ayuda.html` – Información de ayuda.
- `calculadora.html` – Calculadora de costos y precio de venta.

### 7.2 Módulos JavaScript (`assets/js/`)

- `supabase-config.js`
  - Inicializa `supabaseClient` con `SUPABASE_URL` y `SUPABASE_ANON_KEY`.
  - Implementa `ensureAuthenticated()` con login automático de un usuario administrador sembrado.
  - Expone `window.supabaseClient` y `window.ensureAuthenticated`.

- `database.js`
  - Define la clase `DatabaseService`.
  - Centraliza funciones **CRUD genéricas** y **operaciones específicas** por entidad.
  - Incluye manejo básico de errores y logging por consola.
  - Expuesto típicamente como `window.db`.

- `auth.js`
  - Maneja login, logout y estado de sesión en el frontend.
  - Usa Supabase Auth.

- `inventario.js`
  - Gestiona la lista de inventario filtrable.
  - Calcula KPIs de inventario (stock bajo, sin stock, valor inventario a venta/costo).
  - Exporta reportes a CSV / Excel (según implementación).

- `ventas.js`, `compras.js`, `gastos.js`, `movimientos.js`, `productos.js`, `categorias.js`, `clientes.js`, `proveedores.js`, `usuarios.js`
  - Cada archivo orquesta la lógica de UI para su módulo:
    - Carga de datos desde `DatabaseService` / Supabase.
    - Manejo de formularios, validaciones básicas, actualizaciones y borrados.
    - Render de tablas, filtros y acciones (editar, eliminar, ver detalle).

---

## 8. Variables de Entorno

En el frontend se usan **constantes embebidas** para Supabase (en desarrollo) y se espera que en producción sean reemplazadas por el proceso de build/deploy:

- En `assets/js/supabase-config.js`:

  - `SUPABASE_URL`  
    URL del proyecto Supabase.

  - `SUPABASE_ANON_KEY`  
    Clave pública “anon” de Supabase, usada por el cliente JS.

No se observan otros archivos `.env` en este repositorio.  
Para despliegue profesional, se recomienda:

- Mover estos valores a variables de entorno en Vercel.
- Inyectarlos en tiempo de build o mediante un script de configuración.

---

## 9. Historial de Cambios Relevantes

> El repositorio incluye mucha documentación pero no un changelog estructurado; esta sección resume lo que se infiere del estado actual.  
> Para un historial exhaustivo se debe consultar el historial de Git.  

- Migración/definición del **modelo de base de datos**:
  - Script completo en `crear_base_datos_supabase.sql`.
  - Documentación ampliada en `DOCUMENTACION_BASE_DATOS.md` y `MODELO_OPTIMIZADO_FINAL.md`.

- Estructuración del **frontend**:
  - Definición clara por módulos HTML (`DOCUMENTACION_FRONTEND.md`).
  - Separación de lógica de datos en `database.js` y `supabase-config.js`.

- Incorporación de **Dashboard avanzado**:
  - KPIs financieros mensuales y comparativos.
  - Gráficos con Chart.js.
  - KPIs operativos conectados a datos reales de ventas, gastos e inventario.

- Evolución de **inventario**:
  - Cálculo de valor de inventario (venta/costo).
  - Lógica para stock bajo, sin stock y exportes.

- Añadidos recientes (según el estado actual del código):
  - KPI “Valor Inventario” en el Dashboard, usando `productos.stock_actual` y `productos.precio_venta`.
  - KPI “Productos con Stock Bajo” conectado a `stock_actual` y `stock_min`.
  - Página `calculadora.html` con modelo detallado de costos de compra + ML + margen deseado.

Cambios más finos (como ajustes de UI, pequeños refactors o correcciones) no están centralizados en un registro; **no definidos explícitamente** fuera del historial de Git.

---

## 10. Posibles Mejoras Futuras

### 10.1 Técnicas y de arquitectura

- **Modularizar aún más la lógica de negocio**:
  - Extraer funciones de cálculo (por ejemplo, KPIs financieros, cálculo de precios, valor inventario) a un módulo JS compartido para reducir duplicación entre páginas.

- **EndPoints serverless dedicados (opcional)**:
  - Para operaciones de alto costo (ej. KPIs globales sobre gran volumen de datos), considerar endpoints serverless (Vercel Functions) o SQL Functions optimizadas en Supabase.

- **TypeScript / Tipado**:
  - Introducir TypeScript o al menos JSDoc estricto en los módulos JS para mejorar mantenibilidad y robustez de tipos.

### 10.2 Escalabilidad

- **Paginación y “lazy loading” más agresivos**:
  - Algunos cálculos (inventario, KPIs) traen hasta 1000 productos; si el catálogo crece, conviene:
    - Agregar **views o funciones SQL** específicas que ya devuelvan los agregados.
    - Implementar paginación real en listados grandes.

- **Refinar restricciones e índices en BD**:
  - Revisar índices según patrones reales de consulta (ventas por rango de fechas, productos más vendidos, etc.).

### 10.3 Seguridad

- **Gestión de secretos**:
  - Evitar exponer `SUPABASE_ANON_KEY` duro en el código para entornos productivos; usar variables de entorno inyectadas.

- **Refuerzo de RLS**:
  - Asegurar que todas las tablas sensibles tengan políticas RLS que restrinjan acceso según rol/usuario.

- **Auditoría y logs de negocio**:
  - Aunque existen campos de auditoría, se puede añadir:
    - Historial funcional de cambios críticos (precios, permisos de usuarios, configuraciones de impuestos).

### 10.4 Experiencia de usuario

- **Validaciones más ricas en frontend**:
  - Mensajes específicos por campo.
  - Indicaciones visuales de errores en tiempo real.

- **Wizard para procesos complejos**:
  - Por ejemplo, asistente paso a paso para alta de producto (datos básicos → precios → inventario → imágenes).

---

Este documento sirve como **contexto maestro** del proyecto ADS-POS para:

- Nuevos desarrolladores que se incorporen al equipo.
- Modelos de Inteligencia Artificial utilizados como asistentes de desarrollo o análisis.

Para detalles más profundos, se recomienda complementar con:

- `DOCUMENTACION_COMPLETA.md`
- `DOCUMENTACION_BASE_DATOS.md`
- `DOCUMENTACION_FRONTEND.md`
- `crear_base_datos_supabase.sql`

