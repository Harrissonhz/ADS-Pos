# 🗄️ Documentación de Base de Datos - ADS-POS

## 📋 **INFORMACIÓN GENERAL**

- **Motor:** PostgreSQL 15+
- **Hosting:** Supabase
- **URL:** https://ndrjhdwjcyomzpxiwnhr.supabase.co
- **Seguridad:** Row Level Security (RLS) habilitado
- **Auditoría:** Campos de auditoría en todas las tablas
- **Script de Creación:** `crear_base_datos_supabase.sql`

---

## 🗂️ **ESTRUCTURA DE TABLAS**

### **1. usuarios**
**Propósito:** Gestión de usuarios del sistema

| Campo | Tipo | Descripción | Restricciones |
|-------|------|-------------|---------------|
| `id` | UUID | Clave primaria | PRIMARY KEY, DEFAULT uuid_generate_v4() |
| `nombre_completo` | VARCHAR(200) | Nombre completo del usuario | NOT NULL |
| `usuario` | VARCHAR(50) | Nombre de usuario | UNIQUE, NOT NULL |
| `email` | VARCHAR(100) | Correo electrónico | UNIQUE, NOT NULL |
| `telefono` | VARCHAR(20) | Teléfono de contacto | |
| `documento` | VARCHAR(20) | Documento de identidad | |
| `fecha_nacimiento` | DATE | Fecha de nacimiento | |
| `direccion` | TEXT | Dirección del usuario | |
| `rol` | VARCHAR(20) | Rol del usuario | NOT NULL, DEFAULT 'vendedor' |
| `permisos` | JSONB | Permisos específicos | DEFAULT '{}' |
| `activo` | BOOLEAN | Estado del usuario | DEFAULT TRUE |
| `ultimo_acceso` | TIMESTAMPTZ | Último acceso al sistema | |
| `password_hash` | VARCHAR(255) | Hash de la contraseña | NOT NULL |
| `created_at` | TIMESTAMPTZ | Fecha de creación | DEFAULT NOW() |
| `updated_at` | TIMESTAMPTZ | Fecha de actualización | DEFAULT NOW() |
| `created_by` | UUID | Usuario que creó el registro | REFERENCES usuarios(id) |
| `updated_by` | UUID | Usuario que actualizó el registro | REFERENCES usuarios(id) |
| `deleted_at` | TIMESTAMPTZ | Fecha de eliminación lógica | NULL |

**Roles disponibles:**
- `admin` - Administrador del sistema
- `vendedor` - Vendedor
- `cajero` - Cajero

---

### **2. categorias**
**Propósito:** Categorías de productos

| Campo | Tipo | Descripción | Restricciones |
|-------|------|-------------|---------------|
| `id` | UUID | Clave primaria | PRIMARY KEY, DEFAULT uuid_generate_v4() |
| `nombre` | VARCHAR(100) | Nombre de la categoría | NOT NULL, UNIQUE |
| `descripcion` | TEXT | Descripción de la categoría | |
| `color` | VARCHAR(7) | Color hexadecimal | DEFAULT '#007bff' |
| `activa` | BOOLEAN | Estado de la categoría | DEFAULT TRUE |
| `created_at` | TIMESTAMPTZ | Fecha de creación | DEFAULT NOW() |
| `updated_at` | TIMESTAMPTZ | Fecha de actualización | DEFAULT NOW() |
| `created_by` | UUID | Usuario que creó el registro | REFERENCES usuarios(id) |
| `updated_by` | UUID | Usuario que actualizó el registro | REFERENCES usuarios(id) |
| `deleted_at` | TIMESTAMPTZ | Fecha de eliminación lógica | NULL |

---

### **3. productos**
**Propósito:** Productos con precios y stock

| Campo | Tipo | Descripción | Restricciones |
|-------|------|-------------|---------------|
| `id` | UUID | Clave primaria | PRIMARY KEY, DEFAULT uuid_generate_v4() |
| `nombre` | VARCHAR(200) | Nombre del producto | NOT NULL |
| `codigo_barras` | VARCHAR(50) | Código de barras | UNIQUE |
| `codigo_interno` | VARCHAR(50) | Código interno | UNIQUE |
| `categoria_id` | UUID | ID de la categoría | REFERENCES categorias(id) |
| `marca` | VARCHAR(100) | Marca del producto | |
| `modelo` | VARCHAR(100) | Modelo del producto | |
| `descripcion` | TEXT | Descripción detallada | |
| `precio_compra` | DECIMAL(10,2) | Precio de compra | |
| `precio_venta` | DECIMAL(10,2) | Precio de venta | NOT NULL |
| `precio_mayorista` | DECIMAL(10,2) | Precio al por mayor | |
| `margen_ganancia` | DECIMAL(5,2) | Margen de ganancia (%) | |
| `descuento_max` | DECIMAL(5,2) | Descuento máximo (%) | DEFAULT 0 |
| `tasa_impuesto` | DECIMAL(5,2) | Tasa de impuesto (%) | DEFAULT 19.00 |
| `stock_actual` | INTEGER | Cantidad en stock | DEFAULT 0 |
| `stock_min` | INTEGER | Stock mínimo | DEFAULT 0 |
| `stock_max` | INTEGER | Stock máximo | DEFAULT 0 |
| `peso` | DECIMAL(8,3) | Peso en kg | |
| `dimensiones` | VARCHAR(50) | Dimensiones del producto | |
| `activo` | BOOLEAN | Estado del producto | DEFAULT TRUE |
| `created_at` | TIMESTAMPTZ | Fecha de creación | DEFAULT NOW() |
| `updated_at` | TIMESTAMPTZ | Fecha de actualización | DEFAULT NOW() |
| `created_by` | UUID | Usuario que creó el registro | REFERENCES usuarios(id) |
| `updated_by` | UUID | Usuario que actualizó el registro | REFERENCES usuarios(id) |
| `deleted_at` | TIMESTAMPTZ | Fecha de eliminación lógica | NULL |

---

### **4. clientes**
**Propósito:** Clientes (personas y empresas)

| Campo | Tipo | Descripción | Restricciones |
|-------|------|-------------|---------------|
| `id` | UUID | Clave primaria | PRIMARY KEY, DEFAULT uuid_generate_v4() |
| `tipo_id` | VARCHAR(10) | Tipo de identificación | NOT NULL |
| `numero_id` | VARCHAR(20) | Número de identificación | NOT NULL |
| `nombre_completo` | VARCHAR(200) | Nombre completo | NOT NULL |
| `primer_nombre` | VARCHAR(100) | Primer nombre | |
| `segundo_nombre` | VARCHAR(100) | Segundo nombre | |
| `primer_apellido` | VARCHAR(100) | Primer apellido | |
| `segundo_apellido` | VARCHAR(100) | Segundo apellido | |
| `direccion` | VARCHAR(300) | Dirección | |
| `ciudad` | VARCHAR(100) | Ciudad | |
| `departamento` | VARCHAR(100) | Departamento | |
| `telefono` | VARCHAR(20) | Teléfono fijo | |
| `celular` | VARCHAR(20) | Teléfono móvil | |
| `email` | VARCHAR(100) | Correo electrónico | |
| `fecha_nacimiento` | DATE | Fecha de nacimiento | |
| `genero` | VARCHAR(10) | Género | |
| `activo` | BOOLEAN | Estado del cliente | DEFAULT TRUE |
| `notas` | TEXT | Observaciones | |
| `created_at` | TIMESTAMPTZ | Fecha de creación | DEFAULT NOW() |
| `updated_at` | TIMESTAMPTZ | Fecha de actualización | DEFAULT NOW() |
| `created_by` | UUID | Usuario que creó el registro | REFERENCES usuarios(id) |
| `updated_by` | UUID | Usuario que actualizó el registro | REFERENCES usuarios(id) |
| `deleted_at` | TIMESTAMPTZ | Fecha de eliminación lógica | NULL |

**Tipos de identificación:**
- `CC` - Cédula de Ciudadanía
- `NIT` - Número de Identificación Tributaria
- `CE` - Cédula de Extranjería
- `TI` - Tarjeta de Identidad
- `PP` - Pasaporte

---

### **5. proveedores**
**Propósito:** Proveedores

| Campo | Tipo | Descripción | Restricciones |
|-------|------|-------------|---------------|
| `id` | UUID | Clave primaria | PRIMARY KEY, DEFAULT uuid_generate_v4() |
| `tipo_id` | VARCHAR(10) | Tipo de identificación | NOT NULL |
| `numero_id` | VARCHAR(20) | Número de identificación | NOT NULL |
| `razon_social` | VARCHAR(200) | Razón social | NOT NULL |
| `nombre_comercial` | VARCHAR(200) | Nombre comercial | |
| `codigo` | VARCHAR(50) | Código del proveedor | UNIQUE |
| `categoria` | VARCHAR(50) | Categoría del proveedor | |
| `direccion` | VARCHAR(300) | Dirección | |
| `ciudad` | VARCHAR(100) | Ciudad | |
| `departamento` | VARCHAR(100) | Departamento | |
| `telefono` | VARCHAR(20) | Teléfono | |
| `celular` | VARCHAR(20) | Teléfono móvil | |
| `email` | VARCHAR(100) | Correo electrónico | |
| `sitio_web` | VARCHAR(200) | Sitio web | |
| `persona_contacto` | VARCHAR(200) | Persona de contacto | |
| `terminos_pago` | VARCHAR(50) | Términos de pago | |
| `limite_credito` | DECIMAL(12,2) | Límite de crédito | DEFAULT 0 |
| `activo` | BOOLEAN | Estado del proveedor | DEFAULT TRUE |
| `notas` | TEXT | Observaciones | |
| `created_at` | TIMESTAMPTZ | Fecha de creación | DEFAULT NOW() |
| `updated_at` | TIMESTAMPTZ | Fecha de actualización | DEFAULT NOW() |
| `created_by` | UUID | Usuario que creó el registro | REFERENCES usuarios(id) |
| `updated_by` | UUID | Usuario que actualizó el registro | REFERENCES usuarios(id) |
| `deleted_at` | TIMESTAMPTZ | Fecha de eliminación lógica | NULL |

---

### **6. ventas**
**Propósito:** Ventas principales

| Campo | Tipo | Descripción | Restricciones |
|-------|------|-------------|---------------|
| `id` | UUID | Clave primaria | PRIMARY KEY, DEFAULT uuid_generate_v4() |
| `numero_venta` | VARCHAR(50) | Número de venta | UNIQUE, NOT NULL |
| `cliente_id` | UUID | ID del cliente | REFERENCES clientes(id) |
| `usuario_id` | UUID | ID del vendedor | REFERENCES usuarios(id), NOT NULL |
| `fecha_venta` | TIMESTAMPTZ | Fecha y hora de venta | NOT NULL |
| `metodo_pago` | VARCHAR(20) | Método de pago | NOT NULL |
| `estado` | VARCHAR(20) | Estado de la venta | NOT NULL, DEFAULT 'completada' |
| `subtotal` | DECIMAL(10,2) | Subtotal | NOT NULL, DEFAULT 0 |
| `impuesto` | DECIMAL(10,2) | Impuesto | NOT NULL, DEFAULT 0 |
| `descuento` | DECIMAL(10,2) | Descuento | NOT NULL, DEFAULT 0 |
| `total` | DECIMAL(10,2) | Total | NOT NULL, DEFAULT 0 |
| `notas` | TEXT | Observaciones | |
| `created_at` | TIMESTAMPTZ | Fecha de creación | DEFAULT NOW() |
| `updated_at` | TIMESTAMPTZ | Fecha de actualización | DEFAULT NOW() |
| `created_by` | UUID | Usuario que creó el registro | REFERENCES usuarios(id) |
| `updated_by` | UUID | Usuario que actualizó el registro | REFERENCES usuarios(id) |
| `deleted_at` | TIMESTAMPTZ | Fecha de eliminación lógica | NULL |

**Métodos de pago:**
- `efectivo` - Efectivo
- `tarjeta` - Tarjeta de crédito/débito
- `transferencia` - Transferencia bancaria
- `mixto` - Pago mixto

**Estados de venta:**
- `completada` - Venta completada
- `pendiente` - Venta pendiente
- `cancelada` - Venta cancelada
- `reembolsada` - Venta reembolsada

---

### **7. ventas_detalle**
**Propósito:** Detalles de cada venta

| Campo | Tipo | Descripción | Restricciones |
|-------|------|-------------|---------------|
| `id` | UUID | Clave primaria | PRIMARY KEY, DEFAULT uuid_generate_v4() |
| `venta_id` | UUID | ID de la venta | REFERENCES ventas(id), ON DELETE CASCADE |
| `producto_id` | UUID | ID del producto | REFERENCES productos(id), NOT NULL |
| `cantidad` | INTEGER | Cantidad vendida | NOT NULL |
| `precio_unitario` | DECIMAL(10,2) | Precio unitario | NOT NULL |
| `descuento` | DECIMAL(5,2) | Descuento (%) | DEFAULT 0 |
| `tasa_impuesto` | DECIMAL(5,2) | Tasa de impuesto (%) | DEFAULT 19.00 |
| `subtotal` | DECIMAL(10,2) | Subtotal | NOT NULL |
| `impuesto` | DECIMAL(10,2) | Impuesto | NOT NULL |
| `total` | DECIMAL(10,2) | Total | NOT NULL |
| `created_at` | TIMESTAMPTZ | Fecha de creación | DEFAULT NOW() |

---

### **8. facturacion**
**Propósito:** Facturación electrónica

| Campo | Tipo | Descripción | Restricciones |
|-------|------|-------------|---------------|
| `id` | UUID | Clave primaria | PRIMARY KEY, DEFAULT uuid_generate_v4() |
| `venta_id` | UUID | ID de la venta | REFERENCES ventas(id), UNIQUE |
| `tipo_comprobante` | VARCHAR(20) | Tipo de comprobante | NOT NULL |
| `serie` | VARCHAR(10) | Serie del comprobante | NOT NULL |
| `numero` | VARCHAR(20) | Número del comprobante | NOT NULL |
| `fecha_emision` | DATE | Fecha de emisión | NOT NULL |
| `moneda` | VARCHAR(3) | Moneda | DEFAULT 'COP' |
| `condicion_venta` | VARCHAR(20) | Condición de venta | DEFAULT 'contado' |
| `dias_credito` | INTEGER | Días de crédito | DEFAULT 0 |
| `cliente_tipo_id` | VARCHAR(10) | Tipo de ID del cliente | |
| `cliente_numero_id` | VARCHAR(20) | Número de ID del cliente | |
| `cliente_nombre` | VARCHAR(200) | Nombre del cliente | |
| `cliente_direccion` | VARCHAR(300) | Dirección del cliente | |
| `cliente_email` | VARCHAR(100) | Email del cliente | |
| `cliente_telefono` | VARCHAR(20) | Teléfono del cliente | |
| `subtotal` | DECIMAL(10,2) | Subtotal | NOT NULL |
| `impuesto` | DECIMAL(10,2) | Impuesto | NOT NULL |
| `total` | DECIMAL(10,2) | Total | NOT NULL |
| `estado` | VARCHAR(20) | Estado del comprobante | DEFAULT 'pendiente' |
| `created_at` | TIMESTAMPTZ | Fecha de creación | DEFAULT NOW() |
| `updated_at` | TIMESTAMPTZ | Fecha de actualización | DEFAULT NOW() |
| `created_by` | UUID | Usuario que creó el registro | REFERENCES usuarios(id) |

**Tipos de comprobante:**
- `factura` - Factura de venta
- `boleta` - Boleta de venta
- `nc` - Nota crédito
- `nd` - Nota débito

**Condiciones de venta:**
- `contado` - Pago al contado
- `credito` - Pago a crédito

**Estados del comprobante:**
- `pendiente` - Pendiente de envío
- `enviada` - Enviada a DIAN
- `aceptada` - Aceptada por DIAN
- `rechazada` - Rechazada por DIAN

---

### **9. compras**
**Propósito:** Compras a proveedores

| Campo | Tipo | Descripción | Restricciones |
|-------|------|-------------|---------------|
| `id` | UUID | Clave primaria | PRIMARY KEY, DEFAULT uuid_generate_v4() |
| `numero_orden` | VARCHAR(50) | Número de orden | UNIQUE, NOT NULL |
| `proveedor_id` | UUID | ID del proveedor | REFERENCES proveedores(id), NOT NULL |
| `usuario_id` | UUID | ID del usuario | REFERENCES usuarios(id), NOT NULL |
| `fecha_compra` | DATE | Fecha de compra | NOT NULL |
| `fecha_entrega` | DATE | Fecha esperada de entrega | |
| `estado` | VARCHAR(20) | Estado de la compra | NOT NULL, DEFAULT 'pendiente' |
| `subtotal` | DECIMAL(10,2) | Subtotal | NOT NULL, DEFAULT 0 |
| `impuesto` | DECIMAL(10,2) | Impuesto | NOT NULL, DEFAULT 0 |
| `descuento` | DECIMAL(10,2) | Descuento | NOT NULL, DEFAULT 0 |
| `total` | DECIMAL(10,2) | Total | NOT NULL, DEFAULT 0 |
| `notas` | TEXT | Observaciones | |
| `created_at` | TIMESTAMPTZ | Fecha de creación | DEFAULT NOW() |
| `updated_at` | TIMESTAMPTZ | Fecha de actualización | DEFAULT NOW() |
| `created_by` | UUID | Usuario que creó el registro | REFERENCES usuarios(id) |
| `updated_by` | UUID | Usuario que actualizó el registro | REFERENCES usuarios(id) |
| `deleted_at` | TIMESTAMPTZ | Fecha de eliminación lógica | NULL |

**Estados de compra:**
- `pendiente` - Compra pendiente
- `confirmada` - Compra confirmada
- `enviada` - Compra enviada
- `recibida` - Compra recibida
- `cancelada` - Compra cancelada

---

### **10. compras_detalle**
**Propósito:** Detalles de cada compra

| Campo | Tipo | Descripción | Restricciones |
|-------|------|-------------|---------------|
| `id` | UUID | Clave primaria | PRIMARY KEY, DEFAULT uuid_generate_v4() |
| `compra_id` | UUID | ID de la compra | REFERENCES compras(id), ON DELETE CASCADE |
| `producto_id` | UUID | ID del producto | REFERENCES productos(id), NOT NULL |
| `cantidad` | INTEGER | Cantidad comprada | NOT NULL |
| `precio_unitario` | DECIMAL(10,2) | Precio unitario | NOT NULL |
| `descuento` | DECIMAL(5,2) | Descuento (%) | DEFAULT 0 |
| `tasa_impuesto` | DECIMAL(5,2) | Tasa de impuesto (%) | DEFAULT 19.00 |
| `subtotal` | DECIMAL(10,2) | Subtotal | NOT NULL |
| `impuesto` | DECIMAL(10,2) | Impuesto | NOT NULL |
| `total` | DECIMAL(10,2) | Total | NOT NULL |
| `created_at` | TIMESTAMPTZ | Fecha de creación | DEFAULT NOW() |

---

### **11. movimientos_inventario**
**Propósito:** Movimientos de inventario

| Campo | Tipo | Descripción | Restricciones |
|-------|------|-------------|---------------|
| `id` | UUID | Clave primaria | PRIMARY KEY, DEFAULT uuid_generate_v4() |
| `producto_id` | UUID | ID del producto | REFERENCES productos(id), NOT NULL |
| `tipo_movimiento` | VARCHAR(20) | Tipo de movimiento | NOT NULL |
| `cantidad` | INTEGER | Cantidad del movimiento | NOT NULL |
| `motivo` | VARCHAR(200) | Motivo del movimiento | |
| `referencia` | VARCHAR(100) | Referencia del movimiento | |
| `notas` | TEXT | Observaciones | |
| `fecha` | TIMESTAMPTZ | Fecha del movimiento | DEFAULT NOW() |
| `created_by` | UUID | Usuario que creó el registro | REFERENCES usuarios(id), NOT NULL |

**Tipos de movimiento:**
- `entrada` - Entrada de inventario
- `salida` - Salida de inventario
- `ajuste` - Ajuste de inventario
- `transferencia` - Transferencia entre ubicaciones

---

### **12. caja_apertura**
**Propósito:** Aperturas y cierres de caja

| Campo | Tipo | Descripción | Restricciones |
|-------|------|-------------|---------------|
| `id` | UUID | Clave primaria | PRIMARY KEY, DEFAULT uuid_generate_v4() |
| `cajero_id` | UUID | ID del cajero | REFERENCES usuarios(id), NOT NULL |
| `fecha_apertura` | TIMESTAMPTZ | Fecha de apertura | NOT NULL |
| `fecha_cierre` | TIMESTAMPTZ | Fecha de cierre | |
| `observaciones` | TEXT | Observaciones | |
| `billetes_100k` | INTEGER | Billetes de $100,000 | DEFAULT 0 |
| `billetes_50k` | INTEGER | Billetes de $50,000 | DEFAULT 0 |
| `billetes_20k` | INTEGER | Billetes de $20,000 | DEFAULT 0 |
| `billetes_10k` | INTEGER | Billetes de $10,000 | DEFAULT 0 |
| `billetes_5k` | INTEGER | Billetes de $5,000 | DEFAULT 0 |
| `billetes_2k` | INTEGER | Billetes de $2,000 | DEFAULT 0 |
| `billetes_1k` | INTEGER | Billetes de $1,000 | DEFAULT 0 |
| `monedas_500` | INTEGER | Monedas de $500 | DEFAULT 0 |
| `monedas_200` | INTEGER | Monedas de $200 | DEFAULT 0 |
| `monedas_100` | INTEGER | Monedas de $100 | DEFAULT 0 |
| `monedas_50` | INTEGER | Monedas de $50 | DEFAULT 0 |
| `monto_inicial` | DECIMAL(12,2) | Monto inicial | NOT NULL |
| `monto_final` | DECIMAL(12,2) | Monto final | |
| `monto_esperado` | DECIMAL(12,2) | Monto esperado | |
| `diferencia` | DECIMAL(12,2) | Diferencia | |
| `estado` | VARCHAR(20) | Estado de la caja | DEFAULT 'abierta' |
| `created_at` | TIMESTAMPTZ | Fecha de creación | DEFAULT NOW() |
| `updated_at` | TIMESTAMPTZ | Fecha de actualización | DEFAULT NOW() |

**Estados de caja:**
- `abierta` - Caja abierta
- `cerrada` - Caja cerrada

---

### **13. configuracion_empresa**
**Propósito:** Configuración del sistema

| Campo | Tipo | Descripción | Restricciones |
|-------|------|-------------|---------------|
| `id` | UUID | Clave primaria | PRIMARY KEY, DEFAULT uuid_generate_v4() |
| `nombre_empresa` | VARCHAR(200) | Nombre de la empresa | NOT NULL |
| `nit` | VARCHAR(20) | NIT de la empresa | NOT NULL |
| `direccion` | TEXT | Dirección de la empresa | NOT NULL |
| `telefono` | VARCHAR(20) | Teléfono de la empresa | NOT NULL |
| `email` | VARCHAR(100) | Email de la empresa | NOT NULL |
| `sitio_web` | VARCHAR(200) | Sitio web de la empresa | |
| `resolucion_dian` | VARCHAR(50) | Resolución DIAN | |
| `rango_desde` | INTEGER | Rango desde | |
| `rango_hasta` | INTEGER | Rango hasta | |
| `impuesto_default` | DECIMAL(5,2) | Impuesto por defecto (%) | DEFAULT 19.00 |
| `moneda` | VARCHAR(3) | Moneda por defecto | DEFAULT 'COP' |
| `zona_horaria` | VARCHAR(50) | Zona horaria | DEFAULT 'America/Bogota' |
| `created_at` | TIMESTAMPTZ | Fecha de creación | DEFAULT NOW() |
| `updated_at` | TIMESTAMPTZ | Fecha de actualización | DEFAULT NOW() |
| `updated_by` | UUID | Usuario que actualizó el registro | REFERENCES usuarios(id) |

---

## 🔗 **RELACIONES ENTRE TABLAS**

### **Relaciones Principales**

1. **usuarios** → **productos** (created_by, updated_by)
2. **usuarios** → **categorias** (created_by, updated_by)
3. **usuarios** → **clientes** (created_by, updated_by)
4. **usuarios** → **proveedores** (created_by, updated_by)
5. **usuarios** → **ventas** (usuario_id, created_by, updated_by)
6. **usuarios** → **compras** (usuario_id, created_by, updated_by)
7. **usuarios** → **movimientos_inventario** (created_by)
8. **usuarios** → **caja_apertura** (cajero_id)

### **Relaciones de Negocio**

1. **categorias** → **productos** (categoria_id)
2. **clientes** → **ventas** (cliente_id)
3. **proveedores** → **compras** (proveedor_id)
4. **ventas** → **ventas_detalle** (venta_id)
5. **ventas** → **facturacion** (venta_id)
6. **compras** → **compras_detalle** (compra_id)
7. **productos** → **ventas_detalle** (producto_id)
8. **productos** → **compras_detalle** (producto_id)
9. **productos** → **movimientos_inventario** (producto_id)

---

## 📊 **ÍNDICES**

### **Índices de Búsqueda Frecuente**
```sql
CREATE INDEX idx_productos_nombre ON productos(nombre);
CREATE INDEX idx_productos_codigo_barras ON productos(codigo_barras);
CREATE INDEX idx_productos_codigo_interno ON productos(codigo_interno);
CREATE INDEX idx_clientes_tipo_numero ON clientes(tipo_id, numero_id);
CREATE INDEX idx_proveedores_tipo_numero ON proveedores(tipo_id, numero_id);
CREATE INDEX idx_ventas_fecha ON ventas(fecha_venta);
CREATE INDEX idx_ventas_cliente ON ventas(cliente_id);
CREATE INDEX idx_movimientos_producto ON movimientos_inventario(producto_id);
CREATE INDEX idx_movimientos_fecha ON movimientos_inventario(fecha);
```

### **Índices de Claves Foráneas**
```sql
CREATE INDEX idx_productos_categoria ON productos(categoria_id);
CREATE INDEX idx_ventas_usuario ON ventas(usuario_id);
CREATE INDEX idx_ventas_detalle_venta ON ventas_detalle(venta_id);
CREATE INDEX idx_ventas_detalle_producto ON ventas_detalle(producto_id);
CREATE INDEX idx_compras_proveedor ON compras(proveedor_id);
CREATE INDEX idx_compras_usuario ON compras(usuario_id);
CREATE INDEX idx_compras_detalle_compra ON compras_detalle(compra_id);
CREATE INDEX idx_compras_detalle_producto ON compras_detalle(producto_id);
CREATE INDEX idx_caja_apertura_cajero ON caja_apertura(cajero_id);
```

### **Índices de Soft Deletes**
```sql
CREATE INDEX idx_usuarios_deleted_at ON usuarios(deleted_at);
CREATE INDEX idx_categorias_deleted_at ON categorias(deleted_at);
CREATE INDEX idx_productos_deleted_at ON productos(deleted_at);
CREATE INDEX idx_clientes_deleted_at ON clientes(deleted_at);
CREATE INDEX idx_proveedores_deleted_at ON proveedores(deleted_at);
CREATE INDEX idx_ventas_deleted_at ON ventas(deleted_at);
CREATE INDEX idx_compras_deleted_at ON compras(deleted_at);
```

---

## 🔒 **SEGURIDAD (RLS)**

### **Políticas de Seguridad**
Todas las tablas tienen RLS habilitado con políticas básicas:

```sql
-- Política para SELECT
CREATE POLICY "Usuarios autenticados pueden ver datos" 
ON tabla FOR SELECT 
USING (auth.role() = 'authenticated');

-- Política para INSERT
CREATE POLICY "Usuarios autenticados pueden insertar datos" 
ON tabla FOR INSERT 
WITH CHECK (auth.role() = 'authenticated');

-- Política para UPDATE
CREATE POLICY "Usuarios autenticados pueden actualizar datos" 
ON tabla FOR UPDATE 
USING (auth.role() = 'authenticated');
```

### **Tablas con RLS Habilitado**
- ✅ usuarios
- ✅ categorias
- ✅ productos
- ✅ clientes
- ✅ proveedores
- ✅ ventas
- ✅ ventas_detalle
- ✅ facturacion
- ✅ compras
- ✅ compras_detalle
- ✅ movimientos_inventario
- ✅ caja_apertura
- ✅ configuracion_empresa

---

## ⚡ **FUNCIONES Y TRIGGERS**

### **Funciones Auxiliares**

#### **update_updated_at_column()**
```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';
```

#### **update_product_stock()**
```sql
CREATE OR REPLACE FUNCTION update_product_stock()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        IF NEW.tipo_movimiento = 'entrada' THEN
            UPDATE productos SET stock_actual = stock_actual + NEW.cantidad WHERE id = NEW.producto_id;
        ELSIF NEW.tipo_movimiento = 'salida' THEN
            UPDATE productos SET stock_actual = stock_actual - NEW.cantidad WHERE id = NEW.producto_id;
        END IF;
    -- ... lógica para UPDATE y DELETE
    END IF;
    RETURN COALESCE(NEW, OLD);
END;
$$ language 'plpgsql';
```

#### **generate_sale_number()**
```sql
CREATE OR REPLACE FUNCTION generate_sale_number()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.numero_venta IS NULL OR NEW.numero_venta = '' THEN
        NEW.numero_venta = 'V-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(nextval('sale_sequence')::TEXT, 4, '0');
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';
```

### **Triggers**

#### **Triggers de Timestamps**
```sql
CREATE TRIGGER update_usuarios_updated_at 
BEFORE UPDATE ON usuarios 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
-- ... (para todas las tablas con updated_at)
```

#### **Trigger de Stock**
```sql
CREATE TRIGGER update_stock_on_movement
    AFTER INSERT OR UPDATE OR DELETE ON movimientos_inventario
    FOR EACH ROW EXECUTE FUNCTION update_product_stock();
```

#### **Trigger de Número de Venta**
```sql
CREATE TRIGGER generate_sale_number_trigger
    BEFORE INSERT ON ventas
    FOR EACH ROW EXECUTE FUNCTION generate_sale_number();
```

---

## 📈 **CONSULTAS ÚTILES**

### **Verificar Estructura de Tablas**
```sql
SELECT 
    schemaname,
    tablename,
    tableowner,
    hasindexes,
    hasrules,
    hastriggers
FROM pg_tables 
WHERE schemaname = 'public' 
    AND tablename IN (
        'usuarios', 'categorias', 'productos', 'clientes', 
        'proveedores', 'ventas', 'ventas_detalle', 'facturacion',
        'compras', 'compras_detalle', 'movimientos_inventario',
        'caja_apertura', 'configuracion_empresa'
    )
ORDER BY tablename;
```

### **Verificar Índices**
```sql
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes 
WHERE schemaname = 'public'
ORDER BY tablename, indexname;
```

### **Verificar Triggers**
```sql
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement
FROM information_schema.triggers 
WHERE trigger_schema = 'public'
ORDER BY event_object_table, trigger_name;
```

### **Verificar Políticas RLS**
```sql
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```

---

## 🚀 **MIGRACIONES Y ACTUALIZACIONES**

### **Script de Creación Inicial**
El archivo `crear_base_datos_supabase.sql` contiene:
- ✅ Creación de todas las tablas
- ✅ Índices optimizados
- ✅ Políticas RLS
- ✅ Funciones auxiliares
- ✅ Triggers automáticos
- ✅ Datos iniciales

### **Datos Iniciales Incluidos**
```sql
-- Usuario administrador
INSERT INTO usuarios (nombre_completo, usuario, email, rol, password_hash) 
VALUES ('Administrador', 'admin', 'admin@adsstore.com', 'admin', 'hash_password');

-- Configuración de empresa
INSERT INTO configuracion_empresa (nombre_empresa, nit, direccion, telefono, email) 
VALUES ('ADS Store', '900123456-7', 'Calle 123 #45-67, Bogotá, Colombia', '+57 1 234 5678', 'info@adsstore.com');
```

---

## 📊 **MÉTRICAS Y MONITOREO**

### **Consultas de Monitoreo**

#### **Tamaño de Base de Datos**
```sql
SELECT 
    pg_size_pretty(pg_database_size(current_database())) as database_size;
```

#### **Tamaño por Tabla**
```sql
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

#### **Estadísticas de Uso**
```sql
SELECT 
    schemaname,
    tablename,
    n_tup_ins as inserts,
    n_tup_upd as updates,
    n_tup_del as deletes
FROM pg_stat_user_tables 
WHERE schemaname = 'public'
ORDER BY n_tup_ins + n_tup_upd + n_tup_del DESC;
```

---

*Documentación de Base de Datos - ADS-POS v1.0.0*
*Última actualización: $(date)*
