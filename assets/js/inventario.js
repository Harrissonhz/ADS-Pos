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
        const productSuggestions = document.getElementById('productSuggestions');
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
            adjustBtn.addEventListener('click', async () => {
                try {
                    const type = movementType ? movementType.value : '';
                    const productId = productCode?.dataset?.productId || '';
                    const productText = productCode ? productCode.value.trim() : '';
                    const qty = Number(quantity ? quantity.value : '');
                    const reasonText = reason ? reason.value.trim() : '';
                    const refText = reference ? reference.value.trim() : '';

                    if (!type || !productText || !qty || !reasonText) {
                        alert('Por favor complete todos los campos para ajustar el stock');
                        return;
                    }
                    if (!Number.isFinite(qty) || qty <= 0) {
                        alert('La cantidad debe ser un número mayor a 0');
                        return;
                    }
                    // Resolver producto_id si no se seleccionó de sugerencias: intentar buscar por código/nombre
                    let resolvedProductId = productId;
                    if (!resolvedProductId) {
                        const term = productText;
                        const found = await searchProductsForControl(term);
                        if (found.items && found.items.length === 1) {
                            resolvedProductId = found.items[0].id;
                        }
                    }
                    if (!resolvedProductId) {
                        alert('Seleccione un producto válido de la lista de sugerencias');
                        return;
                    }
                    // Usuario actual
                    let currentUserId = null;
                    try {
                        currentUserId = window.auth?.getCurrentUser?.()?.id || null;
                        if (!currentUserId && window.supabaseClient) {
                            const { data: { session } } = await window.supabaseClient.auth.getSession();
                            currentUserId = session?.user?.id || null;
                        }
                    } catch (_) {}
                    if (!currentUserId) {
                        alert('No hay usuario autenticado');
                        return;
                    }

                    // Para 'entrada' y 'salida' basta con insertar movimiento: trigger ajusta stock
                    if (type === 'entrada' || type === 'salida') {
                        const { data, error } = await window.db.createMovimientoInventario({
                            producto_id: resolvedProductId,
                            tipo_movimiento: type,
                            cantidad: qty,
                            motivo: reasonText,
                            referencia: refText,
                            usuario_id: currentUserId
                        });
                        if (error) throw error;
                    } else if (type === 'ajuste') {
                        // Ajuste: calcular delta vs stock actual
                        const { data: prod, error: pErr } = await window.supabaseClient
                            .from('productos')
                            .select('id, stock_actual')
                            .eq('id', resolvedProductId)
                            .maybeSingle();
                        if (pErr) throw pErr;
                        const actual = Number(prod?.stock_actual) || 0;
                        const delta = qty - actual; // qty interpretado como nuevo stock
                        if (delta === 0) {
                            alert('El stock ingresado es igual al actual, no hay cambios');
                            return;
                        }
                        const tipo = delta > 0 ? 'entrada' : 'salida';
                        const cantidadAbs = Math.abs(delta);
                        const { error: movErr } = await window.db.createMovimientoInventario({
                            producto_id: resolvedProductId,
                            tipo_movimiento: tipo,
                            cantidad: cantidadAbs,
                            motivo: reasonText || 'Ajuste Inventario',
                            referencia: refText,
                            usuario_id: currentUserId
                        });
                        if (movErr) throw movErr;
                    } else if (type === 'transferencia') {
                        alert('Transferencia: requiere origen/destino. No implementado en este flujo.');
                        return;
                    }

                    // Refrescar UI/KPIs e informar
                    await Promise.all([loadInventoryProducts(), updateKPIsWithFilters()]);
                    movementType.value = '';
                    productCode.value = '';
                    delete productCode.dataset.productId;
                    quantity.value = '';
                    reason.value = '';
                    reference.value = '';
                    alert('Movimiento registrado y stock actualizado');
                } catch (e) {
                    console.error('Error ajustando stock:', e);
                    alert('Error al ajustar stock');
                }
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
        if (stockReportBtn) stockReportBtn.addEventListener('click', exportStockCsv);
        if (lowStockReportBtn) lowStockReportBtn.addEventListener('click', exportLowStockCsv);
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

        // ===== Búsqueda de producto (código o nombre) con LIKE =====
        async function searchProductsForControl(term) {
            try {
                if (!window.db) return { items: [] };
                await window.ensureAuthenticated?.();
                const trimmed = (term || '').trim();
                if (!trimmed) return { items: [] };
                // Buscar por código y por descripción, combinar sin duplicar
                const [byCode, byDesc] = await Promise.all([
                    window.db.searchProductosPorCodigo(trimmed, { limit: 10 }),
                    window.db.searchProductosPorDescripcion(trimmed, { limit: 10 })
                ]);
                const map = new Map();
                const addAll = (arr) => Array.isArray(arr) && arr.forEach(p => { if (p && !map.has(p.id)) map.set(p.id, p); });
                if (!byCode.error) addAll(byCode.data);
                if (!byDesc.error) addAll(byDesc.data);
                return { items: Array.from(map.values()) };
            } catch (_) { return { items: [] }; }
        }

        function hideProductSuggestions() {
            if (productSuggestions) { productSuggestions.style.display = 'none'; productSuggestions.innerHTML = ''; }
        }

        function showProductSuggestions(items) {
            if (!productSuggestions) return;
            if (!items || !items.length) { hideProductSuggestions(); return; }
            productSuggestions.innerHTML = '';
            items.forEach(p => {
                const btn = document.createElement('button');
                btn.type = 'button';
                btn.className = 'list-group-item list-group-item-action d-flex justify-content-between align-items-center';
                const codigo = p.codigo_interno || p.codigo_barras || '';
                btn.innerHTML = `<span><strong>${csvEscape(p.nombre || '')}</strong>${codigo ? ` <small class="text-muted">(${csvEscape(codigo)})</small>` : ''}</span><small class="text-white-50">${formatCOP(p.precio_compra ?? p.precio_venta ?? 0)}</small>`;
                btn.addEventListener('click', () => {
                    if (productCode) productCode.value = codigo || (p.nombre || '');
                    productCode.dataset.productId = p.id || '';
                    hideProductSuggestions();
                    quantity && quantity.focus();
                });
                productSuggestions.appendChild(btn);
            });
            productSuggestions.style.display = 'block';
        }

        if (productCode) {
            const doSearch = debounce(async () => {
                const term = productCode.value;
                const { items } = await searchProductsForControl(term);
                showProductSuggestions(items);
            }, 250);
            productCode.addEventListener('input', () => { delete productCode.dataset.productId; doSearch(); });
            productCode.addEventListener('focus', () => { const v = productCode.value.trim(); if (v) doSearch(); });
            productCode.addEventListener('blur', () => setTimeout(hideProductSuggestions, 150));
            productCode.addEventListener('keydown', (e) => {
                if (e.key === 'Escape') hideProductSuggestions();
            });
        }

        // ===== Exportación CSV: Reporte de Stock =====
        function csvEscape(value) {
            const str = (value ?? '').toString();
            if (str.includes('"')) return '"' + str.replace(/"/g, '""') + '"';
            if (str.includes(',') || str.includes('\n') || str.includes('\r')) return '"' + str + '"';
            return str;
        }

        async function exportStockCsv() {
            try {
                if (!window.db) return alert('Servicio no disponible');
                try { await window.ensureAuthenticated?.(); } catch (_) {}

                const search = (searchInput?.value || '').trim();
                const internalCode = (filterInternalCode?.value || '').trim();
                const stockFilter = (filterStock?.value || '').trim();

                // Paginado por lotes para no exceder límites del free tier
                const batchSize = 1000;
                let offset = 0;
                let rows = [];
                // Primera consulta para conocer el total aproximado
                let { data, error, count } = await window.db.getProductos({ orderBy: 'nombre', ascending: true, limit: batchSize, offset, search, internalCode });
                if (error) { console.error(error); return alert('No se pudo generar el reporte'); }
                const total = Number(count || 0);
                rows = rows.concat(Array.isArray(data) ? data : []);
                while (rows.length < total) {
                    offset += batchSize;
                    const res = await window.db.getProductos({ orderBy: 'nombre', ascending: true, limit: batchSize, offset, search, internalCode });
                    if (res.error) { console.error(res.error); break; }
                    rows = rows.concat(Array.isArray(res.data) ? res.data : []);
                    if (!Array.isArray(res.data) || res.data.length === 0) break;
                }

                // Filtrado adicional por estado
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

                // Armar CSV
                const headers = [
                    'codigo', 'nombre', 'marca', 'modelo', 'categoria',
                    'stock_actual', 'stock_min', 'stock_max', 'estado',
                    'precio_venta', 'precio_compra', 'valor_total_venta', 'valor_total_costo',
                    'activo'
                ];
                const lines = [headers.join(',')];
                rows.forEach(p => {
                    const codigo = p.codigo_interno || p.codigo_barras || '';
                    const categoria = (p.categoria && p.categoria.nombre) ? p.categoria.nombre : '';
                    const stock = Number(p.stock_actual) || 0;
                    const min = Number(p.stock_min) || 0;
                    const max = Number(p.stock_max) || 0;
                    const precioVenta = Number(p.precio_venta) || 0;
                    const precioCompra = Number(p.precio_compra) || 0;
                    let estado = 'Normal';
                    if (stock <= 0) estado = 'Sin Stock'; else if (stock <= min) estado = 'Stock Bajo';
                    const valorVenta = stock * precioVenta;
                    const valorCosto = stock * precioCompra;
                    const row = [
                        csvEscape(codigo), csvEscape(p.nombre || ''), csvEscape(p.marca || ''), csvEscape(p.modelo || ''), csvEscape(categoria),
                        stock, min, max, csvEscape(estado),
                        precioVenta, precioCompra, valorVenta, valorCosto,
                        p.activo ? 'true' : 'false'
                    ];
                    lines.push(row.join(','));
                });

                const bom = '\uFEFF';
                const content = bom + lines.join('\n');
                const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                const ts = new Date();
                const pad = n => String(n).padStart(2, '0');
                const name = `inventario_stock_${ts.getFullYear()}${pad(ts.getMonth()+1)}${pad(ts.getDate())}_${pad(ts.getHours())}${pad(ts.getMinutes())}${pad(ts.getSeconds())}.csv`;
                a.href = url;
                a.download = name;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            } catch (e) {
                console.error('Error exportando CSV:', e);
                alert('Error al exportar CSV');
            }
        }

        // ===== Exportación CSV: Productos con Stock Bajo =====
        async function exportLowStockCsv() {
            try {
                if (!window.db) return alert('Servicio no disponible');
                try { await window.ensureAuthenticated?.(); } catch (_) {}

                const search = (searchInput?.value || '').trim();
                const internalCode = (filterInternalCode?.value || '').trim();
                // Forzar activos según criterio del reporte
                const onlyActive = true;

                // Paginado por lotes
                const batchSize = 1000;
                let offset = 0;
                let rows = [];
                let { data, error, count } = await window.db.getProductos({ orderBy: 'nombre', ascending: true, limit: batchSize, offset, search, internalCode, onlyActive });
                if (error) { console.error(error); return alert('No se pudo generar el reporte'); }
                const total = Number(count || 0);
                rows = rows.concat(Array.isArray(data) ? data : []);
                while (rows.length < total) {
                    offset += batchSize;
                    const res = await window.db.getProductos({ orderBy: 'nombre', ascending: true, limit: batchSize, offset, search, internalCode, onlyActive });
                    if (res.error) { console.error(res.error); break; }
                    rows = rows.concat(Array.isArray(res.data) ? res.data : []);
                    if (!Array.isArray(res.data) || res.data.length === 0) break;
                }

                // Filtrar: stock_actual > 0 AND stock_min IS NOT NULL AND stock_actual <= stock_min
                rows = rows.filter(p => {
                    const stock = Number(p.stock_actual);
                    const min = p.stock_min;
                    return Number.isFinite(stock) && stock > 0 && min !== null && min !== undefined && Number(stock) <= Number(min);
                });

                // Armar CSV
                const headers = [
                    'codigo', 'nombre', 'marca', 'modelo', 'categoria',
                    'stock_actual', 'stock_min', 'faltante', 'sugerido_compra',
                    'precio_compra', 'costo_reposicion'
                ];
                const lines = [headers.join(',')];
                rows.forEach(p => {
                    const codigo = p.codigo_interno || p.codigo_barras || '';
                    const categoria = (p.categoria && p.categoria.nombre) ? p.categoria.nombre : '';
                    const stock = Number(p.stock_actual) || 0;
                    const min = Number(p.stock_min) || 0;
                    const max = Number(p.stock_max) || 0;
                    const faltante = Math.max(0, min - stock);
                    const sugerido = Math.max(0, max - stock);
                    const precioCompra = Number(p.precio_compra) || 0;
                    const costoReposicion = faltante * precioCompra;
                    const row = [
                        csvEscape(codigo), csvEscape(p.nombre || ''), csvEscape(p.marca || ''), csvEscape(p.modelo || ''), csvEscape(categoria),
                        stock, min, faltante, sugerido,
                        precioCompra, costoReposicion
                    ];
                    lines.push(row.join(','));
                });

                if (lines.length === 1) {
                    return alert('No hay productos con stock bajo para exportar');
                }

                const bom = '\uFEFF';
                const content = bom + lines.join('\n');
                const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                const ts = new Date();
                const pad = n => String(n).padStart(2, '0');
                const name = `inventario_stock_bajo_${ts.getFullYear()}${pad(ts.getMonth()+1)}${pad(ts.getDate())}_${pad(ts.getHours())}${pad(ts.getMinutes())}${pad(ts.getSeconds())}.csv`;
                a.href = url;
                a.download = name;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            } catch (e) {
                console.error('Error exportando CSV (stock bajo):', e);
                alert('Error al exportar CSV');
            }
        }
    });
})();


