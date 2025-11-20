-- ================================================
-- SCRIPTS PARA EJECUTAR MANUALMENTE EN SUPABASE
-- Módulo de Gastos - Fase 1
-- ================================================
-- Ejecuta cada script en orden en el SQL Editor de Supabase
-- ================================================

-- ================================================
-- SCRIPT 1: Agregar campo venta_id
-- ================================================
ALTER TABLE gastos_mensuales_detalle
ADD COLUMN IF NOT EXISTS venta_id UUID REFERENCES ventas(id) ON DELETE SET NULL;

-- ================================================
-- SCRIPT 2: Eliminar constraint UNIQUE
-- ================================================
DO $$
DECLARE
    constraint_name TEXT;
BEGIN
    SELECT conname INTO constraint_name
    FROM pg_constraint
    WHERE conrelid = 'gastos_mensuales_detalle'::regclass
      AND contype = 'u'
      AND array_length(conkey, 1) = 3;
    
    IF constraint_name IS NOT NULL THEN
        EXECUTE format('ALTER TABLE gastos_mensuales_detalle DROP CONSTRAINT IF EXISTS %I', constraint_name);
        RAISE NOTICE 'Constraint eliminado: %', constraint_name;
    ELSE
        RAISE NOTICE 'No se encontró el constraint UNIQUE';
    END IF;
END $$;

-- ================================================
-- SCRIPT 3: Crear índice para venta_id
-- ================================================
CREATE INDEX IF NOT EXISTS idx_gastos_mensuales_venta 
ON gastos_mensuales_detalle(venta_id);

-- ================================================
-- SCRIPT 4: Agregar política RLS para DELETE
-- ================================================
DROP POLICY IF EXISTS "Usuarios autenticados pueden eliminar gastos_mensuales_detalle" ON gastos_mensuales_detalle;

CREATE POLICY "Usuarios autenticados pueden eliminar gastos_mensuales_detalle" 
ON gastos_mensuales_detalle 
FOR DELETE 
USING (auth.role() = 'authenticated');

-- ================================================
-- SCRIPT 5: Crear función trigger
-- ================================================
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
                utilidad_neta = utilidad_neta + v_old_monto,
                updated_at = NOW()
            WHERE anio = v_old_anio AND mes = v_old_mes;
        END IF;
    END IF;
    
    -- Si es DELETE, restar el gasto
    IF TG_OP = 'DELETE' THEN
        UPDATE finanzas_mensuales
        SET
            gastos_operativos_total = gastos_operativos_total - v_monto,
            utilidad_neta = utilidad_neta + v_monto,
            updated_at = NOW()
        WHERE anio = v_anio AND mes = v_mes;
        
        RETURN OLD;
    END IF;
    
    -- Para INSERT o UPDATE: agregar/actualizar el gasto
    -- Si es UPDATE en el mismo mes, primero revertir el monto anterior
    IF TG_OP = 'UPDATE' AND v_old_anio = v_anio AND v_old_mes = v_mes THEN
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
        -v_monto
    )
    ON CONFLICT (anio, mes)
    DO UPDATE SET
        gastos_operativos_total = finanzas_mensuales.gastos_operativos_total + v_monto,
        utilidad_neta = finanzas_mensuales.utilidad_neta - v_monto,
        updated_at = NOW();
    
    RETURN NEW;
END;
$$ language 'plpgsql';

-- ================================================
-- SCRIPT 6: Crear trigger
-- ================================================
DROP TRIGGER IF EXISTS update_finanzas_mensuales_on_gasto_trigger ON gastos_mensuales_detalle;

CREATE TRIGGER update_finanzas_mensuales_on_gasto_trigger
    AFTER INSERT OR UPDATE OR DELETE ON gastos_mensuales_detalle
    FOR EACH ROW EXECUTE FUNCTION update_finanzas_mensuales_on_gasto();

-- ================================================
-- VERIFICACIONES (Opcional - ejecutar para confirmar)
-- ================================================

-- Verificar campo venta_id
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'gastos_mensuales_detalle' 
  AND column_name = 'venta_id';

-- Verificar que no hay constraint UNIQUE
SELECT conname, contype
FROM pg_constraint
WHERE conrelid = 'gastos_mensuales_detalle'::regclass
  AND contype = 'u';

-- Verificar trigger creado
SELECT trigger_name, event_manipulation, event_object_table
FROM information_schema.triggers
WHERE trigger_name = 'update_finanzas_mensuales_on_gasto_trigger';

