-- =====================================================
-- SCRIPT SIMPLE PARA LIMPIAR SUPABASE
-- =====================================================
-- ⚠️  ADVERTENCIA: Este script eliminará TODAS las tablas y datos

-- Eliminar todas las tablas de una vez
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;

-- Restaurar permisos por defecto
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO public;

-- Verificar que todo se eliminó
SELECT 'LIMPIEZA COMPLETA' as estado;
