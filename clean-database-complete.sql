-- =====================================================
-- SCRIPT COMPLETO PARA LIMPIAR SUPABASE COMPLETAMENTE
-- =====================================================
-- ⚠️  ADVERTENCIA: Este script eliminará TODAS las tablas y datos
-- ⚠️  Ejecutar SOLO si estás seguro de querer empezar desde cero

-- ===== 1. ELIMINAR TODAS LAS TABLAS EN ORDEN CORRECTO =====
-- (Eliminar primero las tablas que tienen foreign keys)

-- Eliminar tablas de detalles primero
DROP TABLE IF EXISTS detalles_venta CASCADE;
DROP TABLE IF EXISTS detalles_compra CASCADE;
DROP TABLE IF EXISTS movimientos_inventario CASCADE;

-- Eliminar tablas principales
DROP TABLE IF EXISTS ventas CASCADE;
DROP TABLE IF EXISTS compras CASCADE;
DROP TABLE IF EXISTS caja_apertura CASCADE;
DROP TABLE IF EXISTS productos CASCADE;
DROP TABLE IF EXISTS categorias CASCADE;
DROP TABLE IF EXISTS clientes CASCADE;
DROP TABLE IF EXISTS proveedores CASCADE;
DROP TABLE IF EXISTS usuarios CASCADE;

-- ===== 2. ELIMINAR TODAS LAS FUNCIONES PERSONALIZADAS =====
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS actualizar_stock() CASCADE;

-- ===== 3. ELIMINAR TODAS LAS EXTENSIONES (OPCIONAL) =====
-- Descomenta las siguientes líneas si quieres eliminar también las extensiones
-- DROP EXTENSION IF EXISTS "uuid-ossp" CASCADE;

-- ===== 4. ELIMINAR TODOS LOS TIPOS PERSONALIZADOS =====
-- (Si tienes algún tipo personalizado, agréguelo aquí)

-- ===== 5. ELIMINAR TODAS LAS SECUENCIAS =====
-- (Si tienes secuencias personalizadas, agréguelas aquí)

-- ===== 6. ELIMINAR TODAS LAS VISTAS =====
-- (Si tienes vistas personalizadas, agréguelas aquí)

-- ===== 7. ELIMINAR TODOS LOS ÍNDICES PERSONALIZADOS =====
-- (Los índices se eliminan automáticamente con las tablas)

-- ===== 8. ELIMINAR TODAS LAS POLÍTICAS RLS =====
-- (Las políticas se eliminan automáticamente con las tablas)

-- ===== 9. ELIMINAR TODOS LOS TRIGGERS =====
-- (Los triggers se eliminan automáticamente con las tablas)

-- ===== 10. VERIFICAR QUE TODO SE ELIMINÓ =====
-- Verificar que no queden tablas
SELECT 
    schemaname, 
    tablename 
FROM pg_tables 
WHERE schemaname = 'public' 
    AND tablename NOT IN ('spatial_ref_sys')  -- Excluir tablas del sistema
ORDER BY tablename;

-- Verificar que no queden funciones personalizadas
SELECT 
    n.nspname as schema_name,
    p.proname as function_name
FROM pg_proc p
LEFT JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
    AND p.proname NOT LIKE 'pg_%'
    AND p.proname NOT LIKE 'sql_%'
ORDER BY p.proname;

-- Verificar que no queden tipos personalizados
SELECT 
    n.nspname as schema_name,
    t.typname as type_name
FROM pg_type t
LEFT JOIN pg_namespace n ON t.typnamespace = n.oid
WHERE n.nspname = 'public'
    AND t.typname NOT LIKE 'pg_%'
    AND t.typname NOT LIKE 'sql_%'
ORDER BY t.typname;

-- ===== 11. LIMPIAR METADATOS =====
-- Vaciar la tabla de estadísticas (opcional)
-- ANALYZE;

-- ===== 12. VERIFICACIÓN FINAL =====
-- Mostrar el estado final de la base de datos
SELECT 
    'TABLAS RESTANTES' as tipo,
    COUNT(*) as cantidad
FROM pg_tables 
WHERE schemaname = 'public' 
    AND tablename NOT IN ('spatial_ref_sys')

UNION ALL

SELECT 
    'FUNCIONES RESTANTES' as tipo,
    COUNT(*) as cantidad
FROM pg_proc p
LEFT JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
    AND p.proname NOT LIKE 'pg_%'
    AND p.proname NOT LIKE 'sql_%'

UNION ALL

SELECT 
    'TIPOS RESTANTES' as tipo,
    COUNT(*) as cantidad
FROM pg_type t
LEFT JOIN pg_namespace n ON t.typnamespace = n.oid
WHERE n.nspname = 'public'
    AND t.typname NOT LIKE 'pg_%'
    AND t.typname NOT LIKE 'sql_%';

-- =====================================================
-- FIN DEL SCRIPT DE LIMPIEZA
-- =====================================================
-- Si todo salió bien, deberías ver:
-- - TABLAS RESTANTES: 0
-- - FUNCIONES RESTANTES: 0  
-- - TIPOS RESTANTES: 0
-- =====================================================
