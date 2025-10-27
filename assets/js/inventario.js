// ===== INVENTARIO - SISTEMA ADS-POS =====
(function() {
    // Prevenir el parpadeo del offcanvas y sincronizar chevrons
    document.addEventListener('DOMContentLoaded', function() {
        const offcanvasElement = document.getElementById('posSidebar');
        if (offcanvasElement) {
            const offcanvas = new bootstrap.Offcanvas(offcanvasElement);
            offcanvasElement.addEventListener('show.bs.offcanvas', function() { this.classList.add('show'); });
            offcanvasElement.addEventListener('hide.bs.offcanvas', function() { this.classList.remove('show'); });
        }

        // Sincronizar chevrons de secciones colapsables
        const sections = ['invFiltros','invControl','invLista','invReportes','invAcciones'];
        sections.forEach(id => {
            const el = document.getElementById(id);
            if (!el) return;
            const btn = document.querySelector(`[data-bs-target="#${id}"]`);
            const icon = btn ? btn.querySelector('i') : null;
            if (!icon) return;
            el.addEventListener('show.bs.collapse', () => { icon.classList.remove('fa-chevron-down'); icon.classList.add('fa-chevron-up'); });
            el.addEventListener('hide.bs.collapse', () => { icon.classList.remove('fa-chevron-up'); icon.classList.add('fa-chevron-down'); });
        });
    });

    // Lógica de Inventario (migrado desde el inline script)
    document.addEventListener('DOMContentLoaded', function() {
        const form = document.getElementById('inventoryForm');
        const clearBtn = document.getElementById('clearBtn');
        const searchBtn = document.getElementById('searchBtn');
        const searchBtn2 = document.getElementById('searchBtn2');
        const adjustBtn = document.getElementById('adjustBtn');
        const exportBtn = document.getElementById('exportBtn');
        const searchInput = document.getElementById('searchProduct');
        const filterInternalCode = document.getElementById('filterInternalCode');
        const filterStock = document.getElementById('filterStock');
        const movementType = document.getElementById('movementType');
        const productCode = document.getElementById('productCode');
        const quantity = document.getElementById('quantity');
        const reason = document.getElementById('reason');
        const reference = document.getElementById('reference');

        // Formateador COP
        function formatCOP(value) {
            return new Intl.NumberFormat('es-CO', {
                style: 'currency',
                currency: 'COP',
                minimumFractionDigits: 0
            }).format(Number(value) || 0);
        }

        // Renderizar filas de inventario desde productos
        const inventoryBody = document.getElementById('inventoryBody');
        const inventoryPagination = document.getElementById('inventoryPagination');
        let inventoryPage = 1;
        const inventoryPageSize = 5;
        let inventoryTotal = 0;

        function renderInventoryRows(products) {
            if (!inventoryBody) return;
            inventoryBody.innerHTML = '';
            if (!products || products.length === 0) {
                const tr = document.createElement('tr');
                tr.innerHTML = '<td colspan="10" class="text-center text-muted py-4"><i class="fas fa-inbox fa-2x mb-2"></i><br>Sin productos para mostrar</td>';
                inventoryBody.appendChild(tr);
                return;
            }

            products.forEach(p => {
                const nombre = p.nombre || '';
                const marcaModelo = `${p.marca || ''}${p.modelo ? ' - ' + p.modelo : ''}`;
                const codigo = p.codigo_interno || p.codigo_barras || '-';
                const categoria = (p.categoria && p.categoria.nombre) ? p.categoria.nombre : '-';
                const stockActual = Number(p.stock_actual) || 0;
                const stockMin = Number(p.stock_min) || 0;
                const precio = Number(p.precio_venta) || 0;
                const valorTotal = stockActual * precio;

                let estado = 'Normal';
                let badge = 'success';
                if (stockActual <= 0) { estado = 'Agotado'; badge = 'danger'; }
                else if (stockActual <= stockMin) { estado = 'Bajo'; badge = 'warning'; }

                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td><i class="fas fa-box text-primary"></i></td>
                    <td>
                        <div>
                            <strong>${nombre}</strong><br>
                            <small class="text-muted">${marcaModelo || '&nbsp;'}</small>
                        </div>
                    </td>
                    <td>${codigo}</td>
                    <td>${categoria}</td>
                    <td class="text-end"><strong>${stockActual}</strong></td>
                    <td class="text-end">${stockMin}</td>
                    <td class="text-end">${formatCOP(precio)}</td>
                    <td class="text-center"><span class="badge bg-${badge}">${estado}</span></td>
                    <td class="text-end">${formatCOP(valorTotal)}</td>
                    <td>
                        <button type="button" class="btn btn-sm btn-outline-primary me-1" title="Ajustar stock">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button type="button" class="btn btn-sm btn-outline-info" title="Ver historial">
                            <i class="fas fa-history"></i>
                        </button>
                    </td>`;
                inventoryBody.appendChild(tr);
            });
        }

        async function loadInventoryProducts() {
            if (!inventoryBody) return;
            inventoryBody.innerHTML = '<tr><td colspan="10" class="text-center text-muted py-4"><i class="fas fa-spinner fa-spin"></i> Cargando productos...</td></tr>';
            try {
                // Asegurar sesión para RLS
                try { await window.ensureAuthenticated?.(); } catch (_) {}
                if (!window.db) {
                    throw new Error('Servicio de base de datos no disponible');
                }
                const offset = (inventoryPage - 1) * inventoryPageSize;
                const search = (searchInput?.value || '').trim();
                const internalCode = (filterInternalCode?.value || '').trim();
                const stockFilter = (filterStock?.value || '').trim();
                const { data, error, count } = await window.db.getProductos({ orderBy: 'nombre', ascending: true, limit: inventoryPageSize, offset, search, internalCode });
                if (error) {
                    console.error('Error cargando productos (inventario):', error);
                    inventoryBody.innerHTML = '<tr><td colspan="10" class="text-center text-danger py-4">Error al cargar productos</td></tr>';
                    return;
                }
                let rows = Array.isArray(data) ? data : [];
                if (stockFilter) {
                    rows = rows.filter(p => {
                        const stock = Number(p.stock_actual) || 0;
                        const min = Number(p.stock_min) || 0;
                        const activo = !!p.activo;
                        if (stockFilter === 'Sin Stock') return stock <= 0;
                        if (stockFilter === 'Stock Bajo') return stock > 0 && stock <= min;
                        if (stockFilter === 'Activo') return activo;
                        if (stockFilter === 'Inactivo') return !activo;
                        return true;
                    });
                }
                inventoryTotal = Number(count || 0);
                if (stockFilter) inventoryTotal = rows.length + offset;
                renderInventoryRows(rows);
                renderInventoryPagination();
            } catch (err) {
                console.error('Error general cargando inventario:', err);
                inventoryBody.innerHTML = '<tr><td colspan="10" class="text-center text-danger py-4">Error inesperado</td></tr>';
            }
        }

        function renderInventoryPagination() {
            if (!inventoryPagination) return;
            inventoryPagination.innerHTML = '';
            const totalPages = Math.max(1, Math.ceil(inventoryTotal / inventoryPageSize));

            const prev = document.createElement('button');
            prev.type = 'button';
            prev.className = 'btn btn-sm btn-outline-light';
            prev.textContent = 'Anterior';
            prev.disabled = inventoryPage <= 1;
            prev.onclick = async (e) => {
                e.preventDefault();
                if (inventoryPage > 1) { inventoryPage--; await loadInventoryProducts(); }
            };

            const info = document.createElement('span');
            info.className = 'text-white-50 mx-2';
            info.textContent = `Página ${inventoryPage} de ${totalPages}`;

            const next = document.createElement('button');
            next.type = 'button';
            next.className = 'btn btn-sm btn-outline-light';
            next.textContent = 'Siguiente';
            next.disabled = inventoryPage >= totalPages;
            next.onclick = async (e) => {
                e.preventDefault();
                if (inventoryPage < totalPages) { inventoryPage++; await loadInventoryProducts(); }
            };

            inventoryPagination.appendChild(prev);
            inventoryPagination.appendChild(info);
            inventoryPagination.appendChild(next);
        }

        // Filtros server-side y actualización de KPIs
        function triggerServerSearch() {
            inventoryPage = 1;
            loadInventoryProducts();
            updateKPIsWithFilters();
        }
        if (searchInput) searchInput.addEventListener('input', debounce(triggerServerSearch, 300));
        if (filterInternalCode) filterInternalCode.addEventListener('input', debounce(triggerServerSearch, 300));
        if (filterStock) filterStock.addEventListener('change', triggerServerSearch);

        // Buscar
        function performSearch() { triggerServerSearch(); }
        if (searchBtn) searchBtn.addEventListener('click', performSearch);
        if (searchBtn2) searchBtn2.addEventListener('click', performSearch);

        // Ajustar stock
        if (adjustBtn) {
            adjustBtn.addEventListener('click', () => {
                const type = movementType ? movementType.value : '';
                const product = productCode ? productCode.value.trim() : '';
                const qty = quantity ? quantity.value : '';
                const reasonText = reason ? reason.value.trim() : '';
                if (!type || !product || !qty || !reasonText) {
                    alert('Por favor complete todos los campos para ajustar el stock');
                    return;
                }
                const action = type === 'entrada' ? 'agregar' : type === 'salida' ? 'quitar' : 'ajustar';
                alert(`Stock ${action}do: ${qty} unidades del producto "${product}". Motivo: ${reasonText}`);
                if (movementType) movementType.value = '';
                if (productCode) productCode.value = '';
                if (quantity) quantity.value = '';
                if (reason) reason.value = '';
                if (reference) reference.value = '';
            });
        }

        // Exportar
        if (exportBtn) {
            exportBtn.addEventListener('click', () => {
                alert('Exportando inventario a Excel...');
            });
        }

        // Reportes
        const stockReportBtn = document.getElementById('stockReportBtn');
        const lowStockReportBtn = document.getElementById('lowStockReportBtn');
        const movementReportBtn = document.getElementById('movementReportBtn');
        if (stockReportBtn) stockReportBtn.addEventListener('click', () => { alert('Generando reporte de stock...'); });
        if (lowStockReportBtn) lowStockReportBtn.addEventListener('click', () => { alert('Generando reporte de productos con stock bajo...'); });
        if (movementReportBtn) movementReportBtn.addEventListener('click', () => { alert('Generando reporte de movimientos de inventario...'); });

        // Limpiar formulario
        if (clearBtn) {
            clearBtn.addEventListener('click', () => {
                if (form) form.reset();
                triggerServerSearch();
            });
        }

        // Actualizar resumen (simulación)
        function updateSummary() {
            console.log('Actualizando resumen del inventario...');
        }
        updateSummary();

        // Evitar parpadeo: ocultar KPIs hasta que carguen
        const kpiIds = ['totalProductos','stockBajo','sinStock','valorInventarioCosto','valorInventario'];
        const kpiEls = kpiIds.map(id => document.getElementById(id)).filter(Boolean);
        kpiEls.forEach(el => el.style.visibility = 'hidden');

        // Cargar datos y luego mostrar KPIs
        (async () => {
            await Promise.all([
                loadInventoryProducts(),
                (async () => { await new Promise(r => setTimeout(r, 0)); })()
            ]);

            // Actualizar totales iniciales
            await Promise.all([
                (async () => { /* totalProductos */ })(),
                (async () => { /* KPIs globales abajo */ })()
            ]);

            // Mostrar KPIs cuando ya se han actualizado por los métodos existentes
            kpiEls.forEach(el => el.style.visibility = 'visible');
        })();

        // Actualizar tarjeta: Total Productos
        (async function updateTotalProductos() {
            try {
                const el = document.getElementById('totalProductos');
                if (!el || !window.db) return;
                // Asegurar sesión
                try { await window.ensureAuthenticated?.(); } catch (_) {}
                // Obtener solo el conteo, sin necesidad de datos
                const { data, error, count } = await window.db.getProductos({ limit: 1, offset: 0 });
                if (error) return;
                const total = Number(count || (Array.isArray(data) ? data.length : 0));
                el.textContent = total.toLocaleString('es-CO');
                el.style.visibility = 'visible';
            } catch (_) {}
        })();

        // Actualizar tarjetas: Stock Bajo, Sin Stock, Valor Total
        ;(async function updateInventoryKPIs() {
            try {
                if (!window.db) return;
                try { await window.ensureAuthenticated?.(); } catch (_) {}

                // Traer un lote grande para KPIs. Si hay muchos, se puede migrar a endpoints específicos o funciones SQL.
                const { data, error, count } = await window.db.getProductos({ orderBy: 'nombre', ascending: true, limit: 1000, offset: 0 });
                if (error) return;
                const products = Array.isArray(data) ? data : [];

                let lowStock = 0;
                let outOfStock = 0;
                let totalValueSale = 0;
                let totalValueCost = 0;
                products.forEach(p => {
                    const stock = Number(p.stock_actual) || 0;
                    const min = Number(p.stock_min) || 0;
                    const price = Number(p.precio_venta) || 0;
                    const cost = Number(p.precio_compra) || 0;
                    if (stock <= 0) outOfStock += 1;
                    else if (stock <= min) lowStock += 1;
                    totalValueSale += stock * price;
                    totalValueCost += stock * cost;
                });

                const lowEl = document.getElementById('stockBajo');
                if (lowEl) lowEl.textContent = lowStock.toLocaleString('es-CO');
                const outEl = document.getElementById('sinStock');
                if (outEl) outEl.textContent = outOfStock.toLocaleString('es-CO');
                const valSaleEl = document.getElementById('valorInventario');
                if (valSaleEl) valSaleEl.textContent = formatCOP(totalValueSale);
                const valCostEl = document.getElementById('valorInventarioCosto');
                if (valCostEl) valCostEl.textContent = formatCOP(totalValueCost);
                // Mostrar KPIs al estar listos
                kpiEls.forEach(el => el.style.visibility = 'visible');
            } catch (_) {}
        })();

        // KPIs con filtros aplicados
        async function updateKPIsWithFilters() {
            try {
                if (!window.db) return;
                try { await window.ensureAuthenticated?.(); } catch (_) {}
                const search = (searchInput?.value || '').trim();
                const internalCode = (filterInternalCode?.value || '').trim();
                const stockFilter = (filterStock?.value || '').trim();
                const { data, error } = await window.db.getProductos({ orderBy: 'nombre', ascending: true, limit: 1000, offset: 0, search, internalCode });
                if (error) return;
                let rows = Array.isArray(data) ? data : [];
                if (stockFilter) {
                    rows = rows.filter(p => {
                        const stock = Number(p.stock_actual) || 0;
                        const min = Number(p.stock_min) || 0;
                        const activo = !!p.activo;
                        if (stockFilter === 'Sin Stock') return stock <= 0;
                        if (stockFilter === 'Stock Bajo') return stock > 0 && stock <= min;
                        if (stockFilter === 'Activo') return activo;
                        if (stockFilter === 'Inactivo') return !activo;
                        return true;
                    });
                }
                const totalProductos = rows.length;
                let lowStock = 0, outOfStock = 0, totalValueSale = 0, totalValueCost = 0;
                rows.forEach(p => {
                    const stock = Number(p.stock_actual) || 0;
                    const min = Number(p.stock_min) || 0;
                    const price = Number(p.precio_venta) || 0;
                    const cost = Number(p.precio_compra) || 0;
                    if (stock <= 0) outOfStock += 1; else if (stock <= min) lowStock += 1;
                    totalValueSale += stock * price;
                    totalValueCost += stock * cost;
                });
                const totalEl = document.getElementById('totalProductos');
                if (totalEl) totalEl.textContent = totalProductos.toLocaleString('es-CO');
                const lowEl = document.getElementById('stockBajo');
                if (lowEl) lowEl.textContent = lowStock.toLocaleString('es-CO');
                const outEl = document.getElementById('sinStock');
                if (outEl) outEl.textContent = outOfStock.toLocaleString('es-CO');
                const valSaleEl = document.getElementById('valorInventario');
                if (valSaleEl) valSaleEl.textContent = formatCOP(totalValueSale);
                const valCostEl = document.getElementById('valorInventarioCosto');
                if (valCostEl) valCostEl.textContent = formatCOP(totalValueCost);
            } catch (_) {}
        }

        function debounce(fn, delay) {
            let t; return (...args) => { clearTimeout(t); t = setTimeout(() => fn.apply(this, args), delay); };
        }
    });
})();


