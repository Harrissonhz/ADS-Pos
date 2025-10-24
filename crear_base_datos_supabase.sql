-- ================================================
-- MODELO DE BASE DE DATOS OPTIMIZADO - ADS-POS
-- Compatible con Supabase (PostgreSQL)
-- Combinación optimizada de ambos modelos
-- ================================================

-- Extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ================================================
-- 1. Tabla: usuarios
-- ================================================
CREATE TABLE usuarios (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre_completo VARCHAR(200) NOT NULL,
    usuario VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    telefono VARCHAR(20),
    documento VARCHAR(20),
    fecha_nacimiento DATE,
    direccion TEXT,
    rol VARCHAR(20) NOT NULL DEFAULT 'vendedor', -- admin, vendedor, cajero
    permisos JSONB DEFAULT '{}',
    activo BOOLEAN DEFAULT TRUE,
    ultimo_acceso TIMESTAMPTZ,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES usuarios(id),
    updated_by UUID REFERENCES usuarios(id),
    deleted_at TIMESTAMPTZ NULL
);

-- ================================================
-- 2. Tabla: categorias
-- ================================================
-- Tabla para gestionar categorías de productos con jerarquía
-- - codigo: Código único opcional para la categoría
-- - categoria_padre_id: Referencia a categoría padre (auto-referencia)
-- - Permite crear jerarquías de categorías (ej: Electrónicos > Smartphones)
CREATE TABLE categorias (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre VARCHAR(100) NOT NULL UNIQUE,
    codigo VARCHAR(20) UNIQUE,
    categoria_padre_id UUID REFERENCES categorias(id) ON DELETE SET NULL,
    descripcion TEXT,
    color VARCHAR(7) DEFAULT '#007bff',
    activa BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES usuarios(id),
    updated_by UUID REFERENCES usuarios(id),
    deleted_at TIMESTAMPTZ NULL
);

-- ================================================
-- 3. Tabla: productos
-- ================================================
CREATE TABLE productos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre VARCHAR(200) NOT NULL,
    codigo_barras VARCHAR(50) UNIQUE,
    codigo_interno VARCHAR(50) UNIQUE,
    categoria_id UUID REFERENCES categorias(id) ON DELETE SET NULL,
    marca VARCHAR(100),
    modelo VARCHAR(100),
    descripcion TEXT,
    precio_compra DECIMAL(10,2),
    precio_venta DECIMAL(10,2) NOT NULL,
    precio_mayorista DECIMAL(10,2),
    margen_ganancia DECIMAL(5,2),
    descuento_max DECIMAL(5,2) DEFAULT 0,
    tasa_impuesto DECIMAL(5,2) DEFAULT 19.00,
    stock_actual INTEGER DEFAULT 0,
    stock_min INTEGER DEFAULT 0,
    stock_max INTEGER DEFAULT 0,
    peso DECIMAL(8,3),
    dimensiones VARCHAR(50),
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES usuarios(id),
    updated_by UUID REFERENCES usuarios(id),
    deleted_at TIMESTAMPTZ NULL
);

-- ================================================
-- 4. Tabla: clientes
-- ================================================
CREATE TABLE clientes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tipo_id VARCHAR(10) NOT NULL, -- CC, NIT, CE, TI, PP
    numero_id VARCHAR(20) NOT NULL,
    nombre_completo VARCHAR(200) NOT NULL,
    primer_nombre VARCHAR(100),
    segundo_nombre VARCHAR(100),
    primer_apellido VARCHAR(100),
    segundo_apellido VARCHAR(100),
    direccion VARCHAR(300),
    ciudad VARCHAR(100),
    departamento VARCHAR(100),
    telefono VARCHAR(20),
    celular VARCHAR(20),
    email VARCHAR(100),
    fecha_nacimiento DATE,
    genero VARCHAR(10),
    activo BOOLEAN DEFAULT TRUE,
    notas TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES usuarios(id),
    updated_by UUID REFERENCES usuarios(id),
    deleted_at TIMESTAMPTZ NULL,
    UNIQUE(tipo_id, numero_id)
);

-- ================================================
-- 5. Tabla: proveedores
-- ================================================
CREATE TABLE proveedores (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tipo_id VARCHAR(10) NOT NULL, -- NIT, CC, CE, PP
    numero_id VARCHAR(20) NOT NULL,
    razon_social VARCHAR(200) NOT NULL,
    nombre_comercial VARCHAR(200),
    codigo VARCHAR(50) UNIQUE,
    categoria VARCHAR(50),
    direccion VARCHAR(300),
    ciudad VARCHAR(100),
    departamento VARCHAR(100),
    telefono VARCHAR(20),
    celular VARCHAR(20),
    email VARCHAR(100),
    sitio_web VARCHAR(200),
    persona_contacto VARCHAR(200),
    terminos_pago VARCHAR(50),
    limite_credito DECIMAL(12,2) DEFAULT 0,
    activo BOOLEAN DEFAULT TRUE,
    notas TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES usuarios(id),
    updated_by UUID REFERENCES usuarios(id),
    deleted_at TIMESTAMPTZ NULL,
    UNIQUE(tipo_id, numero_id)
);

-- ================================================
-- 6. Tabla: ventas
-- ================================================
CREATE TABLE ventas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    numero_venta VARCHAR(50) UNIQUE NOT NULL,
    cliente_id UUID REFERENCES clientes(id) ON DELETE SET NULL,
    usuario_id UUID REFERENCES usuarios(id) NOT NULL,
    fecha_venta TIMESTAMPTZ NOT NULL,
    metodo_pago VARCHAR(20) NOT NULL, -- efectivo, tarjeta, transferencia, mixto
    estado VARCHAR(20) NOT NULL DEFAULT 'completada', -- completada, pendiente, cancelada, reembolsada
    subtotal DECIMAL(10,2) NOT NULL DEFAULT 0,
    impuesto DECIMAL(10,2) NOT NULL DEFAULT 0,
    descuento DECIMAL(10,2) NOT NULL DEFAULT 0,
    total DECIMAL(10,2) NOT NULL DEFAULT 0,
    notas TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES usuarios(id),
    updated_by UUID REFERENCES usuarios(id),
    deleted_at TIMESTAMPTZ NULL
);

-- ================================================
-- 7. Tabla: ventas_detalle
-- ================================================
CREATE TABLE ventas_detalle (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    venta_id UUID REFERENCES ventas(id) ON DELETE CASCADE,
    producto_id UUID REFERENCES productos(id) NOT NULL,
    cantidad INTEGER NOT NULL,
    precio_unitario DECIMAL(10,2) NOT NULL,
    descuento DECIMAL(5,2) DEFAULT 0,
    tasa_impuesto DECIMAL(5,2) DEFAULT 19.00,
    subtotal DECIMAL(10,2) NOT NULL,
    impuesto DECIMAL(10,2) NOT NULL,
    total DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================
-- 8. Tabla: facturacion
-- ================================================
CREATE TABLE facturacion (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    venta_id UUID UNIQUE REFERENCES ventas(id) ON DELETE CASCADE,
    tipo_comprobante VARCHAR(20) NOT NULL, -- factura, boleta, nc, nd
    serie VARCHAR(10) NOT NULL,
    numero VARCHAR(20) NOT NULL,
    fecha_emision DATE NOT NULL,
    moneda VARCHAR(3) DEFAULT 'COP',
    condicion_venta VARCHAR(20) DEFAULT 'contado', -- contado, credito
    dias_credito INTEGER DEFAULT 0,
    cliente_tipo_id VARCHAR(10),
    cliente_numero_id VARCHAR(20),
    cliente_nombre VARCHAR(200),
    cliente_direccion VARCHAR(300),
    cliente_email VARCHAR(100),
    cliente_telefono VARCHAR(20),
    subtotal DECIMAL(10,2) NOT NULL,
    impuesto DECIMAL(10,2) NOT NULL,
    total DECIMAL(10,2) NOT NULL,
    estado VARCHAR(20) DEFAULT 'pendiente', -- pendiente, enviada, aceptada, rechazada
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES usuarios(id),
    UNIQUE(serie, numero)
);

-- ================================================
-- 9. Tabla: compras
-- ================================================
-- Secuencia para numero_orden de compras (debe existir antes de la tabla)
CREATE SEQUENCE IF NOT EXISTS compras_numero_orden_seq START 1;

CREATE TABLE compras (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    numero_orden BIGINT UNIQUE NOT NULL DEFAULT nextval('compras_numero_orden_seq'),
    proveedor_id UUID REFERENCES proveedores(id) NOT NULL,
    usuario_id UUID REFERENCES usuarios(id) NOT NULL,
    fecha_compra DATE NOT NULL,
    fecha_entrega DATE,
    estado VARCHAR(20) NOT NULL DEFAULT 'pendiente', -- pendiente, confirmada, enviada, recibida, cancelada
    subtotal DECIMAL(10,2) NOT NULL DEFAULT 0,
    impuesto DECIMAL(10,2) NOT NULL DEFAULT 0,
    descuento DECIMAL(10,2) NOT NULL DEFAULT 0,
    total DECIMAL(10,2) NOT NULL DEFAULT 0,
    notas TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES usuarios(id),
    updated_by UUID REFERENCES usuarios(id),
    deleted_at TIMESTAMPTZ NULL
);

-- ================================================
-- 10. Tabla: compras_detalle
-- ================================================
CREATE TABLE compras_detalle (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    compra_id UUID REFERENCES compras(id) ON DELETE CASCADE,
    producto_id UUID REFERENCES productos(id) NOT NULL,
    cantidad INTEGER NOT NULL,
    precio_unitario DECIMAL(10,2) NOT NULL,
    descuento DECIMAL(5,2) DEFAULT 0,
    tasa_impuesto DECIMAL(5,2) DEFAULT 19.00,
    subtotal DECIMAL(10,2) NOT NULL,
    impuesto DECIMAL(10,2) NOT NULL,
    total DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================
-- 11. Tabla: movimientos_inventario
-- ================================================
CREATE TABLE movimientos_inventario (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    producto_id UUID REFERENCES productos(id) NOT NULL,
    tipo_movimiento VARCHAR(20) NOT NULL, -- entrada, salida, ajuste, transferencia
    cantidad INTEGER NOT NULL,
    motivo VARCHAR(200),
    referencia VARCHAR(100),
    notas TEXT,
    fecha TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES usuarios(id) NOT NULL
);

-- ================================================
-- 12. Tabla: caja_apertura
-- ================================================
CREATE TABLE caja_apertura (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cajero_id UUID REFERENCES usuarios(id) NOT NULL,
    fecha_apertura TIMESTAMPTZ NOT NULL,
    fecha_cierre TIMESTAMPTZ,
    observaciones TEXT,
    billetes_100k INTEGER DEFAULT 0,
    billetes_50k INTEGER DEFAULT 0,
    billetes_20k INTEGER DEFAULT 0,
    billetes_10k INTEGER DEFAULT 0,
    billetes_5k INTEGER DEFAULT 0,
    billetes_2k INTEGER DEFAULT 0,
    billetes_1k INTEGER DEFAULT 0,
    monedas_500 INTEGER DEFAULT 0,
    monedas_200 INTEGER DEFAULT 0,
    monedas_100 INTEGER DEFAULT 0,
    monedas_50 INTEGER DEFAULT 0,
    monto_inicial DECIMAL(12,2) NOT NULL,
    monto_final DECIMAL(12,2),
    monto_esperado DECIMAL(12,2),
    diferencia DECIMAL(12,2),
    estado VARCHAR(20) DEFAULT 'abierta', -- abierta, cerrada
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================
-- 13. Tabla: configuracion_empresa
-- ================================================
CREATE TABLE configuracion_empresa (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre_empresa VARCHAR(200) NOT NULL,
    nit VARCHAR(20) NOT NULL,
    direccion TEXT NOT NULL,
    telefono VARCHAR(20) NOT NULL,
    email VARCHAR(100) NOT NULL,
    sitio_web VARCHAR(200),
    resolucion_dian VARCHAR(50),
    rango_desde INTEGER,
    rango_hasta INTEGER,
    impuesto_default DECIMAL(5,2) DEFAULT 19.00,
    moneda VARCHAR(3) DEFAULT 'COP',
    zona_horaria VARCHAR(50) DEFAULT 'America/Bogota',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    updated_by UUID REFERENCES usuarios(id)
);

-- ================================================
-- ÍNDICES OPTIMIZADOS
-- ================================================

-- Índices para búsquedas frecuentes
CREATE INDEX idx_categorias_codigo ON categorias(codigo);
CREATE INDEX idx_categorias_padre ON categorias(categoria_padre_id);
CREATE INDEX idx_productos_nombre ON productos(nombre);
CREATE INDEX idx_productos_codigo_barras ON productos(codigo_barras);
CREATE INDEX idx_productos_codigo_interno ON productos(codigo_interno);
CREATE INDEX idx_clientes_tipo_numero ON clientes(tipo_id, numero_id);
CREATE INDEX idx_proveedores_tipo_numero ON proveedores(tipo_id, numero_id);
CREATE INDEX idx_ventas_fecha ON ventas(fecha_venta);
CREATE INDEX idx_ventas_cliente ON ventas(cliente_id);
CREATE INDEX idx_movimientos_producto ON movimientos_inventario(producto_id);
CREATE INDEX idx_movimientos_fecha ON movimientos_inventario(fecha);

-- Índices para claves foráneas
CREATE INDEX idx_productos_categoria ON productos(categoria_id);
CREATE INDEX idx_ventas_usuario ON ventas(usuario_id);
CREATE INDEX idx_ventas_detalle_venta ON ventas_detalle(venta_id);
CREATE INDEX idx_ventas_detalle_producto ON ventas_detalle(producto_id);
CREATE INDEX idx_compras_proveedor ON compras(proveedor_id);
CREATE INDEX idx_compras_usuario ON compras(usuario_id);
CREATE INDEX idx_compras_detalle_compra ON compras_detalle(compra_id);
CREATE INDEX idx_compras_detalle_producto ON compras_detalle(producto_id);
CREATE INDEX idx_caja_apertura_cajero ON caja_apertura(cajero_id);

-- Índices para soft deletes
CREATE INDEX idx_usuarios_deleted_at ON usuarios(deleted_at);
CREATE INDEX idx_categorias_deleted_at ON categorias(deleted_at);
CREATE INDEX idx_productos_deleted_at ON productos(deleted_at);
CREATE INDEX idx_clientes_deleted_at ON clientes(deleted_at);
CREATE INDEX idx_proveedores_deleted_at ON proveedores(deleted_at);
CREATE INDEX idx_ventas_deleted_at ON ventas(deleted_at);
CREATE INDEX idx_compras_deleted_at ON compras(deleted_at);

-- ================================================
-- ROW LEVEL SECURITY (RLS)
-- ================================================

-- Habilitar RLS en todas las tablas
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE categorias ENABLE ROW LEVEL SECURITY;
ALTER TABLE productos ENABLE ROW LEVEL SECURITY;
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE proveedores ENABLE ROW LEVEL SECURITY;
ALTER TABLE ventas ENABLE ROW LEVEL SECURITY;
ALTER TABLE ventas_detalle ENABLE ROW LEVEL SECURITY;
ALTER TABLE facturacion ENABLE ROW LEVEL SECURITY;
ALTER TABLE compras ENABLE ROW LEVEL SECURITY;
ALTER TABLE compras_detalle ENABLE ROW LEVEL SECURITY;
ALTER TABLE movimientos_inventario ENABLE ROW LEVEL SECURITY;
ALTER TABLE caja_apertura ENABLE ROW LEVEL SECURITY;
ALTER TABLE configuracion_empresa ENABLE ROW LEVEL SECURITY;

-- Políticas básicas para usuarios autenticados
CREATE POLICY "Usuarios autenticados pueden ver datos" ON usuarios FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Usuarios autenticados pueden insertar datos" ON usuarios FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Usuarios autenticados pueden actualizar datos" ON usuarios FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Usuarios autenticados pueden ver categorias" ON categorias FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Usuarios autenticados pueden insertar categorias" ON categorias FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Usuarios autenticados pueden actualizar categorias" ON categorias FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Usuarios autenticados pueden ver productos" ON productos FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Usuarios autenticados pueden insertar productos" ON productos FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Usuarios autenticados pueden actualizar productos" ON productos FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Usuarios autenticados pueden ver clientes" ON clientes FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Usuarios autenticados pueden insertar clientes" ON clientes FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Usuarios autenticados pueden actualizar clientes" ON clientes FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Usuarios autenticados pueden ver proveedores" ON proveedores FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Usuarios autenticados pueden insertar proveedores" ON proveedores FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Usuarios autenticados pueden actualizar proveedores" ON proveedores FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Usuarios autenticados pueden ver ventas" ON ventas FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Usuarios autenticados pueden insertar ventas" ON ventas FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Usuarios autenticados pueden actualizar ventas" ON ventas FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Usuarios autenticados pueden ver ventas_detalle" ON ventas_detalle FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Usuarios autenticados pueden insertar ventas_detalle" ON ventas_detalle FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Usuarios autenticados pueden actualizar ventas_detalle" ON ventas_detalle FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Usuarios autenticados pueden ver facturacion" ON facturacion FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Usuarios autenticados pueden insertar facturacion" ON facturacion FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Usuarios autenticados pueden actualizar facturacion" ON facturacion FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Usuarios autenticados pueden ver compras" ON compras FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Usuarios autenticados pueden insertar compras" ON compras FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Usuarios autenticados pueden actualizar compras" ON compras FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Usuarios autenticados pueden ver compras_detalle" ON compras_detalle FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Usuarios autenticados pueden insertar compras_detalle" ON compras_detalle FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Usuarios autenticados pueden actualizar compras_detalle" ON compras_detalle FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Usuarios autenticados pueden ver movimientos_inventario" ON movimientos_inventario FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Usuarios autenticados pueden insertar movimientos_inventario" ON movimientos_inventario FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Usuarios autenticados pueden actualizar movimientos_inventario" ON movimientos_inventario FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Usuarios autenticados pueden ver caja_apertura" ON caja_apertura FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Usuarios autenticados pueden insertar caja_apertura" ON caja_apertura FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Usuarios autenticados pueden actualizar caja_apertura" ON caja_apertura FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Usuarios autenticados pueden ver configuracion_empresa" ON configuracion_empresa FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Usuarios autenticados pueden insertar configuracion_empresa" ON configuracion_empresa FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Usuarios autenticados pueden actualizar configuracion_empresa" ON configuracion_empresa FOR UPDATE USING (auth.role() = 'authenticated');

-- ================================================
-- FUNCIONES AUXILIARES
-- ================================================

-- Función para actualizar timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Función para calcular stock automáticamente
CREATE OR REPLACE FUNCTION update_product_stock()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        IF NEW.tipo_movimiento = 'entrada' THEN
            UPDATE productos SET stock_actual = stock_actual + NEW.cantidad WHERE id = NEW.producto_id;
        ELSIF NEW.tipo_movimiento = 'salida' THEN
            UPDATE productos SET stock_actual = stock_actual - NEW.cantidad WHERE id = NEW.producto_id;
        END IF;
    ELSIF TG_OP = 'UPDATE' THEN
        -- Revertir movimiento anterior
        IF OLD.tipo_movimiento = 'entrada' THEN
            UPDATE productos SET stock_actual = stock_actual - OLD.cantidad WHERE id = OLD.producto_id;
        ELSIF OLD.tipo_movimiento = 'salida' THEN
            UPDATE productos SET stock_actual = stock_actual + OLD.cantidad WHERE id = OLD.producto_id;
        END IF;
        -- Aplicar nuevo movimiento
        IF NEW.tipo_movimiento = 'entrada' THEN
            UPDATE productos SET stock_actual = stock_actual + NEW.cantidad WHERE id = NEW.producto_id;
        ELSIF NEW.tipo_movimiento = 'salida' THEN
            UPDATE productos SET stock_actual = stock_actual - NEW.cantidad WHERE id = NEW.producto_id;
        END IF;
    ELSIF TG_OP = 'DELETE' THEN
        -- Revertir movimiento eliminado
        IF OLD.tipo_movimiento = 'entrada' THEN
            UPDATE productos SET stock_actual = stock_actual - OLD.cantidad WHERE id = OLD.producto_id;
        ELSIF OLD.tipo_movimiento = 'salida' THEN
            UPDATE productos SET stock_actual = stock_actual + OLD.cantidad WHERE id = OLD.producto_id;
        END IF;
    END IF;
    RETURN COALESCE(NEW, OLD);
END;
$$ language 'plpgsql';

-- Función para generar número de venta automático
CREATE OR REPLACE FUNCTION generate_sale_number()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.numero_venta IS NULL OR NEW.numero_venta = '' THEN
        NEW.numero_venta = 'V-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(nextval('sale_sequence')::TEXT, 4, '0');
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Crear secuencia para números de venta
CREATE SEQUENCE IF NOT EXISTS sale_sequence START 1;

-- ================================================
-- TRIGGERS
-- ================================================

-- Triggers para actualizar updated_at
CREATE TRIGGER update_usuarios_updated_at BEFORE UPDATE ON usuarios FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_categorias_updated_at BEFORE UPDATE ON categorias FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_productos_updated_at BEFORE UPDATE ON productos FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_clientes_updated_at BEFORE UPDATE ON clientes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_proveedores_updated_at BEFORE UPDATE ON proveedores FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_ventas_updated_at BEFORE UPDATE ON ventas FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_facturacion_updated_at BEFORE UPDATE ON facturacion FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_compras_updated_at BEFORE UPDATE ON compras FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_caja_apertura_updated_at BEFORE UPDATE ON caja_apertura FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_configuracion_empresa_updated_at BEFORE UPDATE ON configuracion_empresa FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger para actualizar stock automáticamente
CREATE TRIGGER update_stock_on_movement
    AFTER INSERT OR UPDATE OR DELETE ON movimientos_inventario
    FOR EACH ROW EXECUTE FUNCTION update_product_stock();

-- Trigger para generar número de venta automático
CREATE TRIGGER generate_sale_number_trigger
    BEFORE INSERT ON ventas
    FOR EACH ROW EXECUTE FUNCTION generate_sale_number();

-- ================================================
-- DATOS INICIALES
-- ================================================

-- Insertar usuario administrador por defecto
INSERT INTO usuarios (nombre_completo, usuario, email, rol, password_hash) 
VALUES ('Administrador', 'admin', 'admin@adsstore.com', 'admin', '$2a$10$rQZ8K9vL2mN3pO4qR5sT6uV7wX8yZ9aB0cD1eF2gH3iJ4kL5mN6oP7qR8sT9uV');

-- Insertar configuración inicial de empresa
INSERT INTO configuracion_empresa (nombre_empresa, nit, direccion, telefono, email) 
VALUES ('ADS Store', '900123456-7', 'Calle 123 #45-67, Bogotá, Colombia', '+57 1 234 5678', 'info@adsstore.com');

-- ================================================
-- COMENTARIOS FINALES
-- ================================================

-- Este modelo optimizado combina:
-- ✅ Nomenclatura en español (del modelo HZ)
-- ✅ Auditoría completa (del modelo sugerido)
-- ✅ RLS y seguridad (del modelo sugerido)
-- ✅ Triggers y funciones (del modelo sugerido)
-- ✅ Índices optimizados (combinación de ambos)
-- ✅ Soft deletes (del modelo sugerido)
-- ✅ Datos iniciales (nuevo)
-- ✅ Campos adicionales para categorías (código, categoría padre)

-- Total de tablas: 13
-- Total de campos: 200+
-- Compatible con Supabase
-- Listo para producción
-- Incluye jerarquía de categorías y códigos únicos

-- ================================================
-- FIN DEL SCRIPT OPTIMIZADO
-- ================================================
