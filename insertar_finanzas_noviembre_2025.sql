-- ================================================
-- INSERTAR DATOS DE FINANZAS - NOVIEMBRE 2025
-- ================================================
-- Este script inserta:
-- 1. Categorías de gastos (si no existen)
-- 2. Registro en finanzas_mensuales para noviembre 2025
-- 3. Detalles de gastos mensuales para noviembre 2025
-- ================================================

BEGIN;

-- ================================================
-- PASO 1: Crear categorías de gastos si no existen
-- ================================================
-- Usamos INSERT ... ON CONFLICT para evitar duplicados
-- Obtener el ID del usuario admin para created_by y updated_by

DO $$
DECLARE
    v_admin_id UUID;
BEGIN
    -- Obtener el ID del usuario admin
    SELECT id INTO v_admin_id 
    FROM usuarios 
    WHERE usuario = 'admin' 
    LIMIT 1;
    
    -- Si no existe admin, usar el primer usuario disponible
    IF v_admin_id IS NULL THEN
        SELECT id INTO v_admin_id 
        FROM usuarios 
        LIMIT 1;
    END IF;
    
    -- Insertar categorías de gastos
    INSERT INTO gasto_categorias (nombre, descripcion, activa, created_by, updated_by)
    VALUES
        ('Pago Proveedores', 'Pagos realizados a proveedores por compra de mercancía', true, v_admin_id, v_admin_id),
        ('Comision MercadoLibre', 'Comisiones pagadas a MercadoLibre por ventas realizadas', true, v_admin_id, v_admin_id),
        ('Insumos Tecnologicos', 'Gastos en insumos y equipos tecnológicos', true, v_admin_id, v_admin_id),
        ('Material Empaque', 'Gastos en materiales de empaque y embalaje', true, v_admin_id, v_admin_id),
        ('Reembolso Cliente MercaLib', 'Reembolsos realizados a clientes por devoluciones en MercadoLibre', true, v_admin_id, v_admin_id),
        ('Flete Por Devolucion Mercad', 'Gastos de flete por devoluciones de MercadoLibre', true, v_admin_id, v_admin_id)
    ON CONFLICT (nombre) DO NOTHING;
    
    RAISE NOTICE 'Categorías de gastos verificadas/creadas';
END $$;

-- ================================================
-- PASO 2: Insertar o actualizar registro en finanzas_mensuales
-- ================================================
-- Datos de noviembre 2025:
-- - Ventas netas: 687,688 (del CSV IngresosPorAño.csv)
-- - Los demás campos se pueden calcular o dejar en 0

INSERT INTO finanzas_mensuales (
    anio,
    mes,
    ventas_brutas,
    devoluciones,
    descuentos,
    ventas_netas,
    costo_mercaderia_vendida,
    compras_total,
    gastos_operativos_total,
    inversion_marketing,
    otros_ingresos,
    otros_gastos,
    utilidad_bruta,
    utilidad_neta,
    notas
)
VALUES (
    2025,
    11,
    687688,  -- ventas_brutas: asumiendo que ventas_netas = ventas_brutas (sin descuentos ni devoluciones)
    0,       -- devoluciones
    0,       -- descuentos
    687688,  -- ventas_netas: del CSV
    0,       -- costo_mercaderia_vendida: se calculará con los triggers o se actualizará después
    0,       -- compras_total: se calculará con los triggers o se actualizará después
    0,       -- gastos_operativos_total: se calculará automáticamente con el trigger al insertar gastos_mensuales_detalle
    0,       -- inversion_marketing
    0,       -- otros_ingresos
    0,       -- otros_gastos
    0,       -- utilidad_bruta: se calculará después
    0,       -- utilidad_neta: se calculará automáticamente con el trigger al insertar gastos
    'Datos importados desde CSV - Noviembre 2025'
)
ON CONFLICT (anio, mes)
DO UPDATE SET
    ventas_brutas = EXCLUDED.ventas_brutas,
    ventas_netas = EXCLUDED.ventas_netas,
    notas = EXCLUDED.notas,
    updated_at = NOW();

-- ================================================
-- PASO 3: Insertar detalles de gastos mensuales para noviembre 2025
-- ================================================
-- Datos del CSV Gastos2025.csv - Columna Noviembre:
-- - Pago Proveedores: 121,764
-- - Comision MercadoLibre: 260,988
-- - Insumos Tecnologicos: 0
-- - Material Empaque: 0
-- - Reembolso Cliente MercaLib: 0
-- - Flete Por Devolucion Mercad: 0

DO $$
DECLARE
    v_categoria_pago_proveedores UUID;
    v_categoria_comision_ml UUID;
    v_categoria_insumos_tec UUID;
    v_categoria_material_empaque UUID;
    v_categoria_reembolso UUID;
    v_categoria_flete UUID;
BEGIN
    -- Obtener IDs de las categorías de gastos
    SELECT id INTO v_categoria_pago_proveedores 
    FROM gasto_categorias 
    WHERE nombre = 'Pago Proveedores' 
    LIMIT 1;
    
    SELECT id INTO v_categoria_comision_ml 
    FROM gasto_categorias 
    WHERE nombre = 'Comision MercadoLibre' 
    LIMIT 1;
    
    SELECT id INTO v_categoria_insumos_tec 
    FROM gasto_categorias 
    WHERE nombre = 'Insumos Tecnologicos' 
    LIMIT 1;
    
    SELECT id INTO v_categoria_material_empaque 
    FROM gasto_categorias 
    WHERE nombre = 'Material Empaque' 
    LIMIT 1;
    
    SELECT id INTO v_categoria_reembolso 
    FROM gasto_categorias 
    WHERE nombre = 'Reembolso Cliente MercaLib' 
    LIMIT 1;
    
    SELECT id INTO v_categoria_flete 
    FROM gasto_categorias 
    WHERE nombre = 'Flete Por Devolucion Mercad' 
    LIMIT 1;
    
    -- Insertar gastos solo si el monto es mayor a 0
    -- Pago Proveedores: 121,764
    IF v_categoria_pago_proveedores IS NOT NULL THEN
        INSERT INTO gastos_mensuales_detalle (
            anio,
            mes,
            categoria_id,
            monto,
            notas
        )
        VALUES (
            2025,
            11,
            v_categoria_pago_proveedores,
            121764,
            'Pago a proveedores - Noviembre 2025'
        );
    END IF;
    
    -- Comision MercadoLibre: 260,988
    IF v_categoria_comision_ml IS NOT NULL THEN
        INSERT INTO gastos_mensuales_detalle (
            anio,
            mes,
            categoria_id,
            monto,
            notas
        )
        VALUES (
            2025,
            11,
            v_categoria_comision_ml,
            260988,
            'Comisión MercadoLibre - Noviembre 2025'
        );
    END IF;
    
    -- Insumos Tecnologicos: 0 (no se inserta)
    -- Material Empaque: 0 (no se inserta)
    -- Reembolso Cliente MercaLib: 0 (no se inserta)
    -- Flete Por Devolucion Mercad: 0 (no se inserta)
    
    RAISE NOTICE 'Gastos mensuales insertados para noviembre 2025';
END $$;

COMMIT;

-- ================================================
-- VERIFICACIÓN
-- ================================================
-- Verificar el registro en finanzas_mensuales
SELECT 
    anio,
    mes,
    ventas_netas,
    gastos_operativos_total,
    utilidad_neta
FROM finanzas_mensuales
WHERE anio = 2025 AND mes = 11;

-- Verificar los gastos insertados
SELECT 
    gmd.anio,
    gmd.mes,
    gc.nombre AS categoria,
    gmd.monto
FROM gastos_mensuales_detalle gmd
JOIN gasto_categorias gc ON gc.id = gmd.categoria_id
WHERE gmd.anio = 2025 AND gmd.mes = 11
ORDER BY gmd.monto DESC;

-- ================================================
-- NOTAS IMPORTANTES:
-- ================================================
-- ✅ Este script crea las categorías de gastos si no existen
-- ✅ Usa INSERT ... ON CONFLICT para evitar duplicados
-- ✅ Los triggers automáticamente actualizarán gastos_operativos_total y utilidad_neta
-- ✅ Solo inserta gastos con monto > 0
-- ✅ El total de gastos operativos será: 121,764 + 260,988 = 382,752
-- ✅ La utilidad neta se calculará automáticamente: ventas_netas - gastos_operativos_total
-- ================================================

