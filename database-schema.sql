-- Esquema de base de datos para ADS-POS
-- Ejecuta este script en el SQL Editor de Supabase

-- ===== EXTENSIONES =====
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ===== TABLA DE USUARIOS =====
CREATE TABLE usuarios (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    telefono VARCHAR(20),
    rol VARCHAR(20) DEFAULT 'vendedor' CHECK (rol IN ('admin', 'vendedor', 'cajero')),
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===== TABLA DE CATEGORÍAS =====
CREATE TABLE categorias (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL UNIQUE,
    descripcion TEXT,
    activa BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===== TABLA DE PRODUCTOS =====
CREATE TABLE productos (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    codigo VARCHAR(50) UNIQUE NOT NULL,
    nombre VARCHAR(200) NOT NULL,
    descripcion TEXT,
    categoria_id UUID REFERENCES categorias(id),
    precio DECIMAL(10,2) NOT NULL,
    costo DECIMAL(10,2),
    stock INTEGER DEFAULT 0,
    stock_minimo INTEGER DEFAULT 0,
    imagen_url TEXT,
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===== TABLA DE CLIENTES =====
CREATE TABLE clientes (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    email VARCHAR(100),
    telefono VARCHAR(20),
    direccion TEXT,
    rfc VARCHAR(20),
    tipo VARCHAR(20) DEFAULT 'persona' CHECK (tipo IN ('persona', 'empresa')),
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===== TABLA DE PROVEEDORES =====
CREATE TABLE proveedores (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    email VARCHAR(100),
    telefono VARCHAR(20),
    direccion TEXT,
    rfc VARCHAR(20),
    contacto VARCHAR(100),
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===== TABLA DE VENTAS =====
CREATE TABLE ventas (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    numero_factura VARCHAR(20) UNIQUE NOT NULL,
    cliente_id UUID REFERENCES clientes(id),
    usuario_id UUID REFERENCES usuarios(id),
    subtotal DECIMAL(10,2) NOT NULL,
    impuestos DECIMAL(10,2) DEFAULT 0,
    descuento DECIMAL(10,2) DEFAULT 0,
    total DECIMAL(10,2) NOT NULL,
    metodo_pago VARCHAR(20) DEFAULT 'efectivo' CHECK (metodo_pago IN ('efectivo', 'tarjeta', 'transferencia', 'mixto')),
    estado VARCHAR(20) DEFAULT 'completada' CHECK (estado IN ('pendiente', 'completada', 'cancelada')),
    observaciones TEXT,
    fecha TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===== TABLA DE DETALLES DE VENTA =====
CREATE TABLE detalles_venta (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    venta_id UUID REFERENCES ventas(id) ON DELETE CASCADE,
    producto_id UUID REFERENCES productos(id),
    cantidad INTEGER NOT NULL,
    precio_unitario DECIMAL(10,2) NOT NULL,
    descuento DECIMAL(10,2) DEFAULT 0,
    subtotal DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===== TABLA DE COMPRAS =====
CREATE TABLE compras (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    numero_factura VARCHAR(20) NOT NULL,
    proveedor_id UUID REFERENCES proveedores(id),
    usuario_id UUID REFERENCES usuarios(id),
    subtotal DECIMAL(10,2) NOT NULL,
    impuestos DECIMAL(10,2) DEFAULT 0,
    total DECIMAL(10,2) NOT NULL,
    estado VARCHAR(20) DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'recibida', 'cancelada')),
    fecha TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===== TABLA DE DETALLES DE COMPRA =====
CREATE TABLE detalles_compra (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    compra_id UUID REFERENCES compras(id) ON DELETE CASCADE,
    producto_id UUID REFERENCES productos(id),
    cantidad INTEGER NOT NULL,
    precio_unitario DECIMAL(10,2) NOT NULL,
    subtotal DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===== TABLA DE MOVIMIENTOS DE INVENTARIO =====
CREATE TABLE movimientos_inventario (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    producto_id UUID REFERENCES productos(id),
    tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('entrada', 'salida', 'ajuste')),
    cantidad INTEGER NOT NULL,
    motivo VARCHAR(100),
    referencia VARCHAR(100), -- ID de venta, compra, etc.
    usuario_id UUID REFERENCES usuarios(id),
    fecha TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===== TABLA DE APERTURA DE CAJA =====
CREATE TABLE caja_apertura (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    usuario_id UUID REFERENCES usuarios(id),
    fecha_apertura TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    fecha_cierre TIMESTAMP WITH TIME ZONE,
    monto_inicial DECIMAL(10,2) NOT NULL,
    monto_final DECIMAL(10,2),
    ventas_efectivo DECIMAL(10,2) DEFAULT 0,
    ventas_tarjeta DECIMAL(10,2) DEFAULT 0,
    ventas_transferencia DECIMAL(10,2) DEFAULT 0,
    total_ventas DECIMAL(10,2) DEFAULT 0,
    observaciones TEXT,
    estado VARCHAR(20) DEFAULT 'abierta' CHECK (estado IN ('abierta', 'cerrada'))
);

-- ===== ÍNDICES PARA OPTIMIZACIÓN =====
CREATE INDEX idx_productos_categoria ON productos(categoria_id);
CREATE INDEX idx_productos_activo ON productos(activo);
CREATE INDEX idx_ventas_fecha ON ventas(fecha);
CREATE INDEX idx_ventas_cliente ON ventas(cliente_id);
CREATE INDEX idx_ventas_usuario ON ventas(usuario_id);
CREATE INDEX idx_detalles_venta_venta ON detalles_venta(venta_id);
CREATE INDEX idx_detalles_venta_producto ON detalles_venta(producto_id);
CREATE INDEX idx_movimientos_producto ON movimientos_inventario(producto_id);
CREATE INDEX idx_movimientos_fecha ON movimientos_inventario(fecha);

-- ===== FUNCIONES DE ACTUALIZACIÓN DE TIMESTAMP =====
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Aplicar trigger a todas las tablas con updated_at
CREATE TRIGGER update_usuarios_updated_at BEFORE UPDATE ON usuarios FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_categorias_updated_at BEFORE UPDATE ON categorias FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_productos_updated_at BEFORE UPDATE ON productos FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_clientes_updated_at BEFORE UPDATE ON clientes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_proveedores_updated_at BEFORE UPDATE ON proveedores FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ===== FUNCIÓN PARA ACTUALIZAR STOCK =====
CREATE OR REPLACE FUNCTION actualizar_stock()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        -- Actualizar stock al crear detalle de venta
        UPDATE productos 
        SET stock = stock - NEW.cantidad,
            updated_at = NOW()
        WHERE id = NEW.producto_id;
        
        -- Registrar movimiento de inventario
        INSERT INTO movimientos_inventario (producto_id, tipo, cantidad, motivo, referencia, usuario_id)
        VALUES (NEW.producto_id, 'salida', NEW.cantidad, 'Venta', NEW.venta_id::text, 
                (SELECT usuario_id FROM ventas WHERE id = NEW.venta_id));
        
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        -- Actualizar stock al modificar detalle de venta
        UPDATE productos 
        SET stock = stock + OLD.cantidad - NEW.cantidad,
            updated_at = NOW()
        WHERE id = NEW.producto_id;
        
        -- Actualizar movimiento de inventario
        UPDATE movimientos_inventario 
        SET cantidad = NEW.cantidad
        WHERE producto_id = NEW.producto_id AND referencia = NEW.venta_id::text;
        
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        -- Restaurar stock al eliminar detalle de venta
        UPDATE productos 
        SET stock = stock + OLD.cantidad,
            updated_at = NOW()
        WHERE id = OLD.producto_id;
        
        -- Eliminar movimiento de inventario
        DELETE FROM movimientos_inventario 
        WHERE producto_id = OLD.producto_id AND referencia = OLD.venta_id::text;
        
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ language 'plpgsql';

-- Aplicar trigger a detalles_venta
CREATE TRIGGER trigger_actualizar_stock
    AFTER INSERT OR UPDATE OR DELETE ON detalles_venta
    FOR EACH ROW EXECUTE FUNCTION actualizar_stock();

-- ===== DATOS INICIALES =====
-- Insertar categorías por defecto
INSERT INTO categorias (nombre, descripcion) VALUES 
('General', 'Productos sin categoría específica'),
('Electrónicos', 'Dispositivos y accesorios electrónicos'),
('Ropa', 'Vestimenta y accesorios'),
('Hogar', 'Artículos para el hogar'),
('Deportes', 'Equipos y accesorios deportivos');

-- Insertar usuario administrador por defecto
INSERT INTO usuarios (nombre, email, rol) VALUES 
('Administrador', 'admin@ads-pos.com', 'admin');

-- ===== POLÍTICAS RLS (Row Level Security) =====
-- Habilitar RLS en todas las tablas
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE categorias ENABLE ROW LEVEL SECURITY;
ALTER TABLE productos ENABLE ROW LEVEL SECURITY;
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE proveedores ENABLE ROW LEVEL SECURITY;
ALTER TABLE ventas ENABLE ROW LEVEL SECURITY;
ALTER TABLE detalles_venta ENABLE ROW LEVEL SECURITY;
ALTER TABLE compras ENABLE ROW LEVEL SECURITY;
ALTER TABLE detalles_compra ENABLE ROW LEVEL SECURITY;
ALTER TABLE movimientos_inventario ENABLE ROW LEVEL SECURITY;
ALTER TABLE caja_apertura ENABLE ROW LEVEL SECURITY;

-- Políticas básicas (permitir todo para usuarios autenticados)
-- En producción, deberías crear políticas más específicas según los roles

CREATE POLICY "Usuarios autenticados pueden ver todo" ON usuarios FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Usuarios autenticados pueden insertar usuarios" ON usuarios FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Usuarios autenticados pueden actualizar usuarios" ON usuarios FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Usuarios autenticados pueden ver categorías" ON categorias FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Usuarios autenticados pueden ver productos" ON productos FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Usuarios autenticados pueden ver clientes" ON clientes FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Usuarios autenticados pueden ver proveedores" ON proveedores FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Usuarios autenticados pueden ver ventas" ON ventas FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Usuarios autenticados pueden ver detalles_venta" ON detalles_venta FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Usuarios autenticados pueden ver compras" ON compras FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Usuarios autenticados pueden ver detalles_compra" ON detalles_compra FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Usuarios autenticados pueden ver movimientos" ON movimientos_inventario FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Usuarios autenticados pueden ver caja" ON caja_apertura FOR ALL USING (auth.role() = 'authenticated');
