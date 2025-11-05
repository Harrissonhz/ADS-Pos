-- ================================================
-- SCRIPT PARA LIMPIAR Y INSERTAR DATOS REALES
-- ADS-POS - Sistema de Punto de Venta
-- ================================================
-- 
-- ⚠️ IMPORTANTE: Este script SOLO BORRA REGISTROS (datos)
-- NO elimina las estructuras de las tablas (tablas, índices, triggers, etc.)
-- 
-- Usa DELETE FROM para eliminar solo los datos, manteniendo intacta la estructura
-- 
-- IMPORTANTE: Este script debe ejecutarse en el orden correcto
-- debido a las relaciones entre tablas (foreign keys)

-- ================================================
-- PASO 1: LIMPIAR DATOS DE PRUEBA (SOLO REGISTROS)
-- ================================================
-- Orden de eliminación respetando las dependencias
-- Las tablas y su estructura se mantienen intactas

-- 1. Eliminar tablas dependientes (con CASCADE se eliminan automáticamente)
-- pero las eliminamos explícitamente para tener control

-- 1.1. Eliminar detalles que dependen de ventas/compras
DELETE FROM gastos_mensuales_detalle;
DELETE FROM finanzas_mensuales;

-- 1.2. Eliminar ventas_detalle y facturacion (se eliminan con CASCADE, pero lo hacemos explícito)
DELETE FROM ventas_detalle;
DELETE FROM facturacion;
DELETE FROM ventas;

-- 1.3. Eliminar compras_detalle (se elimina con CASCADE, pero lo hacemos explícito)
DELETE FROM compras_detalle;
DELETE FROM compras;

-- 1.4. Eliminar movimientos de inventario
DELETE FROM movimientos_inventario;

-- 1.5. Eliminar productos (depende de categorias)
DELETE FROM productos;

-- 1.6. Eliminar caja_apertura
DELETE FROM caja_apertura;

-- 1.7. Eliminar categorías (tiene auto-referencia, pero ON DELETE SET NULL)
-- Primero las categorías hijas, luego las padres
DELETE FROM categorias WHERE categoria_padre_id IS NOT NULL;
DELETE FROM categorias;

-- 1.8. Eliminar gasto_categorias
DELETE FROM gasto_categorias;

-- 1.9. Eliminar clientes y proveedores
DELETE FROM clientes;
DELETE FROM proveedores;

-- 1.10. Eliminar usuarios (excepto el admin si existe)
-- CUIDADO: Esto eliminará todos los usuarios excepto el admin por defecto
-- Si quieres mantener otros usuarios, ajusta esta condición
DELETE FROM usuarios WHERE usuario != 'admin' OR email != 'admin@adsstore.com';

-- 1.11. Opcional: Si quieres mantener configuracion_empresa, no la borres
-- DELETE FROM configuracion_empresa;

-- ================================================
-- PASO 2: INSERTAR DATOS REALES - CATEGORIAS
-- ================================================

-- Primero, insertar categorías padre
INSERT INTO categorias (nombre, codigo, descripcion, color, activa, created_by, updated_by)
VALUES
    ('Electrónicos', 'ELEC', 'Dispositivos electrónicos y tecnología', '#007bff', true, 
     (SELECT id FROM usuarios WHERE usuario = 'admin' LIMIT 1),
     (SELECT id FROM usuarios WHERE usuario = 'admin' LIMIT 1)),
    
    ('Ropa y Accesorios', 'ROPA', 'Ropa, calzado y accesorios de moda', '#28a745', true,
     (SELECT id FROM usuarios WHERE usuario = 'admin' LIMIT 1),
     (SELECT id FROM usuarios WHERE usuario = 'admin' LIMIT 1)),
    
    ('Hogar y Jardín', 'HOGAR', 'Artículos para el hogar y jardín', '#ffc107', true,
     (SELECT id FROM usuarios WHERE usuario = 'admin' LIMIT 1),
     (SELECT id FROM usuarios WHERE usuario = 'admin' LIMIT 1)),
    
    ('Deportes y Fitness', 'DEPORTES', 'Artículos deportivos y fitness', '#dc3545', true,
     (SELECT id FROM usuarios WHERE usuario = 'admin' LIMIT 1),
     (SELECT id FROM usuarios WHERE usuario = 'admin' LIMIT 1)),
    
    ('Belleza y Cuidado Personal', 'BELLEZA', 'Productos de belleza y cuidado personal', '#e83e8c', true,
     (SELECT id FROM usuarios WHERE usuario = 'admin' LIMIT 1),
     (SELECT id FROM usuarios WHERE usuario = 'admin' LIMIT 1)),
    
    ('Alimentación', 'ALIMENTOS', 'Alimentos y bebidas', '#fd7e14', true,
     (SELECT id FROM usuarios WHERE usuario = 'admin' LIMIT 1),
     (SELECT id FROM usuarios WHERE usuario = 'admin' LIMIT 1)),
    
    ('Libros y Papelería', 'LIBROS', 'Libros, cuadernos y artículos de papelería', '#6f42c1', true,
     (SELECT id FROM usuarios WHERE usuario = 'admin' LIMIT 1),
     (SELECT id FROM usuarios WHERE usuario = 'admin' LIMIT 1)),
    
    ('Juguetes y Juegos', 'JUGUETES', 'Juguetes y juegos para todas las edades', '#20c997', true,
     (SELECT id FROM usuarios WHERE usuario = 'admin' LIMIT 1),
     (SELECT id FROM usuarios WHERE usuario = 'admin' LIMIT 1));

-- Insertar subcategorías (categorías hijas)
-- Electrónicos
INSERT INTO categorias (nombre, codigo, categoria_padre_id, descripcion, color, activa, created_by, updated_by)
VALUES
    ('Computadoras', 'ELEC-COMP', (SELECT id FROM categorias WHERE codigo = 'ELEC' LIMIT 1),
     'Laptops, PCs y accesorios', '#0056b3', true,
     (SELECT id FROM usuarios WHERE usuario = 'admin' LIMIT 1),
     (SELECT id FROM usuarios WHERE usuario = 'admin' LIMIT 1)),
    
    ('Smartphones', 'ELEC-SMART', (SELECT id FROM categorias WHERE codigo = 'ELEC' LIMIT 1),
     'Teléfonos inteligentes y accesorios', '#0056b3', true,
     (SELECT id FROM usuarios WHERE usuario = 'admin' LIMIT 1),
     (SELECT id FROM usuarios WHERE usuario = 'admin' LIMIT 1)),
    
    ('Audio y Video', 'ELEC-AUDIO', (SELECT id FROM categorias WHERE codigo = 'ELEC' LIMIT 1),
     'Auriculares, parlantes y dispositivos de audio', '#0056b3', true,
     (SELECT id FROM usuarios WHERE usuario = 'admin' LIMIT 1),
     (SELECT id FROM usuarios WHERE usuario = 'admin' LIMIT 1));

-- Ropa y Accesorios
INSERT INTO categorias (nombre, codigo, categoria_padre_id, descripcion, color, activa, created_by, updated_by)
VALUES
    ('Ropa Masculina', 'ROPA-MASC', (SELECT id FROM categorias WHERE codigo = 'ROPA' LIMIT 1),
     'Ropa para hombres', '#1e7e34', true,
     (SELECT id FROM usuarios WHERE usuario = 'admin' LIMIT 1),
     (SELECT id FROM usuarios WHERE usuario = 'admin' LIMIT 1)),
    
    ('Ropa Femenina', 'ROPA-FEM', (SELECT id FROM categorias WHERE codigo = 'ROPA' LIMIT 1),
     'Ropa para mujeres', '#1e7e34', true,
     (SELECT id FROM usuarios WHERE usuario = 'admin' LIMIT 1),
     (SELECT id FROM usuarios WHERE usuario = 'admin' LIMIT 1)),
    
    ('Calzado', 'ROPA-CALZ', (SELECT id FROM categorias WHERE codigo = 'ROPA' LIMIT 1),
     'Zapatos y calzado', '#1e7e34', true,
     (SELECT id FROM usuarios WHERE usuario = 'admin' LIMIT 1),
     (SELECT id FROM usuarios WHERE usuario = 'admin' LIMIT 1));

-- Hogar y Jardín
INSERT INTO categorias (nombre, codigo, categoria_padre_id, descripcion, color, activa, created_by, updated_by)
VALUES
    ('Muebles', 'HOGAR-MUEB', (SELECT id FROM categorias WHERE codigo = 'HOGAR' LIMIT 1),
     'Muebles para el hogar', '#e0a800', true,
     (SELECT id FROM usuarios WHERE usuario = 'admin' LIMIT 1),
     (SELECT id FROM usuarios WHERE usuario = 'admin' LIMIT 1)),
    
    ('Decoración', 'HOGAR-DEC', (SELECT id FROM categorias WHERE codigo = 'HOGAR' LIMIT 1),
     'Artículos de decoración', '#e0a800', true,
     (SELECT id FROM usuarios WHERE usuario = 'admin' LIMIT 1),
     (SELECT id FROM usuarios WHERE usuario = 'admin' LIMIT 1)),
    
    ('Cocina', 'HOGAR-COC', (SELECT id FROM categorias WHERE codigo = 'HOGAR' LIMIT 1),
     'Utensilios y electrodomésticos de cocina', '#e0a800', true,
     (SELECT id FROM usuarios WHERE usuario = 'admin' LIMIT 1),
     (SELECT id FROM usuarios WHERE usuario = 'admin' LIMIT 1));

-- ================================================
-- NOTAS IMPORTANTES:
-- ================================================
-- ✅ Este script SOLO BORRA REGISTROS (datos), NO elimina las tablas
-- ✅ Las estructuras de las tablas (columnas, índices, triggers, etc.) se mantienen
-- ✅ Usa DELETE FROM (no DROP TABLE ni TRUNCATE)
-- 
-- 1. Este script elimina TODOS los datos de prueba
-- 2. Mantiene el usuario admin por defecto
-- 3. Mantiene configuracion_empresa (comentado, puedes descomentar si quieres borrarlo)
-- 4. Las categorías se insertan con jerarquía (padres e hijas)
-- 5. Las categorías usan el usuario 'admin' para created_by y updated_by
-- 
-- ================================================
-- PARA EJECUTAR SOLO LA LIMPIEZA DE CATEGORÍAS:
-- ================================================
-- DELETE FROM categorias WHERE categoria_padre_id IS NOT NULL;  -- Primero hijas
-- DELETE FROM categorias;  -- Luego padres
-- 
-- Luego ejecutar solo los INSERT de categorías (desde la línea del PASO 2)
-- 
-- ================================================
-- ALTERNATIVA: Si quieres borrar TODO y empezar desde cero:
-- ================================================
-- Ejecuta todo el PASO 1 completo
-- Luego ejecuta los INSERT de cada tabla en orden:
-- 1. Usuarios (si necesitas más usuarios)
-- 2. Categorías (este script)
-- 3. Productos (siguiente script)
-- 4. Clientes, Proveedores, etc.

