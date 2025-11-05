-- ================================================
-- SCRIPT PARA LIMPIAR TODAS LAS TABLAS
-- ADS-POS - Sistema de Punto de Venta
-- ================================================
-- 
-- ⚠️ IMPORTANTE: Este script SOLO BORRA REGISTROS (datos)
-- NO elimina las estructuras de las tablas (tablas, columnas, índices, triggers, etc.)
-- 
-- ✅ Usa DELETE FROM para eliminar solo los datos, manteniendo intacta la estructura
-- ✅ Las tablas, índices, triggers, foreign keys, etc. se mantienen intactos
-- 
-- ⚠️ ADVERTENCIA: Este script eliminará TODOS los datos de TODAS las tablas
-- Asegúrate de tener un backup antes de ejecutar
-- 
-- ================================================
-- ORDEN DE ELIMINACIÓN (respetando dependencias)
-- ================================================
-- Se eliminan primero las tablas dependientes (hijas) y luego las independientes (padres)

BEGIN;

-- ================================================
-- 1. ELIMINAR TABLAS CON DEPENDENCIAS (CASCADE)
-- ================================================
-- Estas tablas se eliminan automáticamente con CASCADE, pero lo hacemos explícito

-- 1.1. Detalles de gastos mensuales
DELETE FROM gastos_mensuales_detalle;

-- 1.2. Finanzas mensuales
DELETE FROM finanzas_mensuales;

-- 1.3. Detalles de ventas (depende de ventas y productos)
DELETE FROM ventas_detalle;

-- 1.4. Facturación (depende de ventas)
DELETE FROM facturacion;

-- 1.5. Ventas (depende de clientes y usuarios)
DELETE FROM ventas;

-- 1.6. Detalles de compras (depende de compras y productos)
DELETE FROM compras_detalle;

-- 1.7. Compras (depende de proveedores y usuarios)
DELETE FROM compras;

-- 1.8. Movimientos de inventario (depende de productos y usuarios)
DELETE FROM movimientos_inventario;

-- ================================================
-- 2. ELIMINAR PRODUCTOS (depende de categorias y usuarios)
-- ================================================
DELETE FROM productos;

-- ================================================
-- 3. ELIMINAR CAJA (depende de usuarios)
-- ================================================
DELETE FROM caja_apertura;

-- ================================================
-- 4. ELIMINAR CATEGORÍAS (tiene auto-referencia)
-- ================================================
-- Primero las categorías hijas (que tienen categoria_padre_id)
DELETE FROM categorias WHERE categoria_padre_id IS NOT NULL;
-- Luego las categorías padres
DELETE FROM categorias;

-- ================================================
-- 5. ELIMINAR CATEGORÍAS DE GASTOS (depende de usuarios)
-- ================================================
DELETE FROM gasto_categorias;

-- ================================================
-- 6. ELIMINAR CLIENTES (depende de usuarios)
-- ================================================
DELETE FROM clientes;

-- ================================================
-- 7. ELIMINAR PROVEEDORES (depende de usuarios)
-- ================================================
DELETE FROM proveedores;

-- ================================================
-- 8. ELIMINAR CONFIGURACIÓN DE EMPRESA (ANTES de usuarios)
-- ================================================
-- IMPORTANTE: Debe borrarse ANTES de usuarios porque tiene foreign key a usuarios
-- Si quieres mantener la configuración, comenta esta línea y actualiza updated_by a NULL
DELETE FROM configuracion_empresa;
-- O si quieres mantenerla pero limpiar la referencia:
-- UPDATE configuracion_empresa SET updated_by = NULL WHERE updated_by IS NOT NULL;

-- ================================================
-- 9. ELIMINAR USUARIOS (tiene auto-referencia)
-- ================================================
-- Primero actualizar las referencias circulares a NULL
UPDATE usuarios SET created_by = NULL WHERE created_by IS NOT NULL;
UPDATE usuarios SET updated_by = NULL WHERE updated_by IS NOT NULL;
-- Luego eliminar todos los usuarios
DELETE FROM usuarios;

-- ================================================
-- 10. REINICIAR SECUENCIAS (opcional pero recomendado)
-- ================================================
-- Reinicia las secuencias para que empiecen desde 1
ALTER SEQUENCE IF EXISTS compras_numero_orden_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS sale_sequence RESTART WITH 1;

COMMIT;

-- ================================================
-- VERIFICACIÓN
-- ================================================
-- Descomenta las siguientes líneas para verificar que las tablas están vacías:

-- SELECT 'categorias' as tabla, COUNT(*) as registros FROM categorias
-- UNION ALL
-- SELECT 'productos', COUNT(*) FROM productos
-- UNION ALL
-- SELECT 'clientes', COUNT(*) FROM clientes
-- UNION ALL
-- SELECT 'proveedores', COUNT(*) FROM proveedores
-- UNION ALL
-- SELECT 'ventas', COUNT(*) FROM ventas
-- UNION ALL
-- SELECT 'compras', COUNT(*) FROM compras
-- UNION ALL
-- SELECT 'usuarios', COUNT(*) FROM usuarios
-- UNION ALL
-- SELECT 'movimientos_inventario', COUNT(*) FROM movimientos_inventario;

-- ================================================
-- NOTAS FINALES
-- ================================================
-- ✅ Todas las tablas ahora están vacías
-- ✅ Las estructuras de las tablas se mantienen intactas
-- ✅ Los índices, triggers, foreign keys, etc. siguen funcionando
-- ✅ Puedes comenzar a insertar datos reales desde cero
-- 
-- ⚠️ RECUERDA: Después de ejecutar este script, necesitarás:
-- 1. Insertar al menos un usuario administrador
-- 2. Insertar categorías (ver limpiar_e_insertar_datos.sql)
-- 3. Insertar productos, clientes, proveedores, etc.
-- 
-- ================================================
-- FIN DEL SCRIPT
-- ================================================

