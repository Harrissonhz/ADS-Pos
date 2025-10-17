-- Script para solucionar el problema de RLS en la tabla categorias
-- Ejecuta este script en el SQL Editor de Supabase

-- Opción 1: Deshabilitar RLS temporalmente para testing
-- (Comenta esta línea cuando estés listo para producción)
ALTER TABLE categorias DISABLE ROW LEVEL SECURITY;

-- Opción 2: Crear una política que permita insertar sin autenticación
-- (Descomenta estas líneas si prefieres mantener RLS habilitado)
-- DROP POLICY IF EXISTS "Allow anonymous inserts" ON categorias;
-- CREATE POLICY "Allow anonymous inserts" ON categorias
--     FOR INSERT WITH CHECK (true);

-- Opción 3: Crear una política más específica para usuarios autenticados
-- (Descomenta estas líneas si quieres mantener RLS con autenticación)
-- DROP POLICY IF EXISTS "Allow authenticated users to insert" ON categorias;
-- CREATE POLICY "Allow authenticated users to insert" ON categorias
--     FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Verificar el estado actual de RLS
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'categorias';

-- Ver las políticas existentes
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'categorias';
