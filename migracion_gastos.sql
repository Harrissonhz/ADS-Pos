-- ================================================
-- MIGRACIÓN: Módulo de Gastos
-- Ejecutar este script en Supabase SQL Editor
-- ================================================
-- Este script:
-- 1. Agrega campo venta_id a gastos_mensuales_detalle
-- 2. Elimina el constraint UNIQUE (anio, mes, categoria_id)
-- 3. Agrega índice para venta_id
-- 4. Agrega política RLS para DELETE
-- 5. Crea función trigger para actualizar finanzas_mensuales
-- 6. Crea trigger para ejecutar la función
-- ================================================

-- Paso 1: Agregar campo venta_id a la tabla gastos_mensuales_detalle
ALTER TABLE gastos_mensuales_detalle
ADD COLUMN IF NOT EXISTS venta_id UUID REFERENCES ventas(id) ON DELETE SET NULL;

-- Paso 2: Eliminar el constraint UNIQUE (anio, mes, categoria_id)
-- Primero necesitamos encontrar el nombre del constraint
DO $$
DECLARE
    constraint_name TEXT;
BEGIN
    -- Buscar el nombre del constraint UNIQUE
    SELECT conname INTO constraint_name
    FROM pg_constraint
    WHERE conrelid = 'gastos_mensuales_detalle'::regclass
      AND contype = 'u'
      AND array_length(conkey, 1) = 3;
    
    -- Si existe, eliminarlo
    IF constraint_name IS NOT NULL THEN
        EXECUTE format('ALTER TABLE gastos_mensuales_detalle DROP CONSTRAINT IF EXISTS %I', constraint_name);
        RAISE NOTICE 'Constraint eliminado: %', constraint_name;
    ELSE
        RAISE NOTICE 'No se encontró el constraint UNIQUE (anio, mes, categoria_id)';
    END IF;
END $$;

-- Paso 3: Crear índice para venta_id (optimización)
CREATE INDEX IF NOT EXISTS idx_gastos_mensuales_venta 
ON gastos_mensuales_detalle(venta_id);

-- Paso 4: Agregar política RLS para DELETE en gastos_mensuales_detalle
CREATE POLICY IF NOT EXISTS "Usuarios autenticados pueden eliminar gastos_mensuales_detalle" 
ON gastos_mensuales_detalle 
FOR DELETE 
USING (auth.role() = 'authenticated');

-- Paso 5: Crear función trigger para actualizar finanzas_mensuales cuando se crea, actualiza o elimina un gasto
CREATE OR REPLACE FUNCTION update_finanzas_mensuales_on_gasto()
RETURNS TRIGGER AS $$
DECLARE
    v_anio INTEGER;
    v_mes INTEGER;
    v_monto DECIMAL(14,2) := 0;
    v_old_anio INTEGER;
    v_old_mes INTEGER;
    v_old_monto DECIMAL(14,2) := 0;
BEGIN
    -- Determinar año y mes según la operación
    IF TG_OP = 'DELETE' THEN
        v_anio := OLD.anio;
        v_mes := OLD.mes;
        v_monto := OLD.monto;
    ELSE
        v_anio := NEW.anio;
        v_mes := NEW.mes;
        v_monto := NEW.monto;
    END IF;
    
    -- Si es UPDATE, revertir el gasto anterior
    IF TG_OP = 'UPDATE' THEN
        v_old_anio := OLD.anio;
        v_old_mes := OLD.mes;
        v_old_monto := OLD.monto;
        
        -- Revertir el gasto del mes anterior (si cambió de mes)
        IF v_old_anio != v_anio OR v_old_mes != v_mes THEN
            UPDATE finanzas_mensuales
            SET
                gastos_operativos_total = gastos_operativos_total - v_old_monto,
                utilidad_neta = utilidad_neta + v_old_monto, -- Al revertir gasto, aumenta utilidad
                updated_at = NOW()
            WHERE anio = v_old_anio AND mes = v_old_mes;
        END IF;
    END IF;
    
    -- Si es DELETE, restar el gasto
    IF TG_OP = 'DELETE' THEN
        UPDATE finanzas_mensuales
        SET
            gastos_operativos_total = gastos_operativos_total - v_monto,
            utilidad_neta = utilidad_neta + v_monto, -- Al eliminar gasto, aumenta utilidad
            updated_at = NOW()
        WHERE anio = v_anio AND mes = v_mes;
        
        RETURN OLD;
    END IF;
    
    -- Para INSERT o UPDATE: agregar/actualizar el gasto
    -- Si es UPDATE en el mismo mes, primero revertir el monto anterior
    IF TG_OP = 'UPDATE' AND v_old_anio = v_anio AND v_old_mes = v_mes THEN
        -- Revertir el monto anterior en el mismo mes
        UPDATE finanzas_mensuales
        SET
            gastos_operativos_total = gastos_operativos_total - v_old_monto,
            utilidad_neta = utilidad_neta + v_old_monto,
            updated_at = NOW()
        WHERE anio = v_anio AND mes = v_mes;
    END IF;
    
    -- Insertar o actualizar el registro mensual (UPSERT)
    INSERT INTO finanzas_mensuales (anio, mes, gastos_operativos_total, utilidad_neta)
    VALUES (
        v_anio,
        v_mes,
        v_monto,
        -v_monto  -- Los gastos reducen la utilidad neta
    )
    ON CONFLICT (anio, mes)
    DO UPDATE SET
        gastos_operativos_total = finanzas_mensuales.gastos_operativos_total + v_monto,
        utilidad_neta = finanzas_mensuales.utilidad_neta - v_monto,
        updated_at = NOW();
    
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Paso 6: Crear trigger para ejecutar la función
DROP TRIGGER IF EXISTS update_finanzas_mensuales_on_gasto_trigger ON gastos_mensuales_detalle;

CREATE TRIGGER update_finanzas_mensuales_on_gasto_trigger
    AFTER INSERT OR UPDATE OR DELETE ON gastos_mensuales_detalle
    FOR EACH ROW EXECUTE FUNCTION update_finanzas_mensuales_on_gasto();

-- ================================================
-- VERIFICACIÓN
-- ================================================
-- Verificar que el campo venta_id fue agregado
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'gastos_mensuales_detalle' 
  AND column_name = 'venta_id';

-- Verificar que el constraint UNIQUE fue eliminado
SELECT conname, contype
FROM pg_constraint
WHERE conrelid = 'gastos_mensuales_detalle'::regclass
  AND contype = 'u';

-- Verificar que el trigger fue creado
SELECT trigger_name, event_manipulation, event_object_table
FROM information_schema.triggers
WHERE trigger_name = 'update_finanzas_mensuales_on_gasto_trigger';

-- ================================================
-- FIN DE LA MIGRACIÓN
-- ================================================

