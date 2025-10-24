// ===== COMPRAS - SISTEMA ADS-POS =====
(function () {
    function showToast(message, type = 'success') {
        const div = document.createElement('div');
        div.className = `alert alert-${type} position-fixed`;
        div.style.cssText = 'top:20px;right:20px;z-index:9999;min-width:280px;box-shadow:0 4px 12px rgba(0,0,0,0.3)';
        div.innerHTML = `<div class="d-flex align-items-center"><span>${message}</span><button type="button" class="btn-close ms-auto" onclick="this.parentElement.parentElement.remove()"></button></div>`;
        document.body.appendChild(div);
        setTimeout(() => div.remove(), 3500);
    }

    document.addEventListener('DOMContentLoaded', async () => {
        // Offcanvas
        const offcanvasElement = document.getElementById('posSidebar');
        if (offcanvasElement) {
            const offcanvas = new bootstrap.Offcanvas(offcanvasElement);
            offcanvasElement.addEventListener('show.bs.offcanvas', function() { this.classList.add('show'); });
            offcanvasElement.addEventListener('hide.bs.offcanvas', function() { this.classList.remove('show'); });
        }

        // Sincronizar chevrons en headers colapsables
        const collapseButtons = document.querySelectorAll('.card-header button[data-bs-toggle="collapse"]');
        collapseButtons.forEach(btn => {
            const targetSel = btn.getAttribute('data-bs-target');
            const targetEl = document.querySelector(targetSel);
            if (!targetEl) return;
            const icon = btn.querySelector('i');
            const syncIcon = () => {
                if (!icon) return;
                if (targetEl.classList.contains('show')) {
                    icon.classList.remove('fa-chevron-down');
                    icon.classList.add('fa-chevron-up');
                } else {
                    icon.classList.remove('fa-chevron-up');
                    icon.classList.add('fa-chevron-down');
                }
            };
            targetEl.addEventListener('shown.bs.collapse', syncIcon);
            targetEl.addEventListener('hidden.bs.collapse', syncIcon);
            syncIcon();
        });

        const form = document.getElementById('purchaseForm');
        const clearBtn = document.getElementById('clearBtn');
        const searchBtn = document.getElementById('searchBtn');
        const draftBtn = document.getElementById('draftBtn');
        const saveBtn = document.getElementById('saveBtn');
        const supplierSelect = document.getElementById('supplier');
        const contactInput = document.getElementById('contactPerson');
        const phoneInput = document.getElementById('supplierPhone');
        const emailInput = document.getElementById('supplierEmail');
        const addProductBtn = document.getElementById('addProduct');
        const productsBody = document.getElementById('productsBody');
        const uiSubtotal = document.getElementById('uiSubtotal');
        const uiVat = document.getElementById('uiVat');
        const uiTotal = document.getElementById('uiTotal');
        const globalDiscount = document.getElementById('globalDiscount');
        const searchProductCodeInput = document.getElementById('searchProductCode');
        const productCodeSuggestions = document.getElementById('productCodeSuggestions');
        const searchProductDescInput = document.getElementById('searchProductDesc');
        const productDescSuggestions = document.getElementById('productDescSuggestions');
        const orderNumberInput = document.getElementById('orderNumber');

        const suppliersById = new Map();
        const productsById = new Map(); // id -> producto
        let codeSuggestionItems = [];
        let codeActiveIndex = -1;
        let descSuggestionItems = [];
        let descActiveIndex = -1;

        async function loadSuppliers() {
            if (!window.db) return;
            // Poblar proveedores activos, ordenados por razón social
            const { data, error } = await window.db.getProveedores({ onlyActive: true, orderBy: 'razon_social', ascending: true, limit: 1000 });
            if (error) {
                console.error('Error cargando proveedores:', error);
                showToast('No fue posible cargar proveedores', 'danger');
                return;
            }
            suppliersById.clear();
            if (supplierSelect) {
                supplierSelect.innerHTML = '<option value="">Seleccionar proveedor</option>';
                (data || []).forEach(p => {
                    suppliersById.set(p.id, p);
                    const option = document.createElement('option');
                    option.value = p.id; // UUID
                    const etiqueta = p.razon_social || p.nombre_comercial || p.codigo || 'Proveedor';
                    option.textContent = etiqueta + (p.numero_id ? ` - ${p.numero_id}` : '');
                    supplierSelect.appendChild(option);
                });
            }
        }

        async function suggestNextOrderNumber() {
            try {
                if (!window.supabaseClient || !orderNumberInput) return;
                if (orderNumberInput.value && orderNumberInput.value.toString().trim() !== '') return;
                const { data, error } = await window.supabaseClient
                    .from('compras')
                    .select('numero_orden')
                    .order('numero_orden', { ascending: false })
                    .limit(1);
                if (error) { console.warn('No se pudo sugerir número de orden:', error); return; }
                const last = Array.isArray(data) && data.length ? Number(data[0].numero_orden) : 0;
                const next = Number.isFinite(last) ? last + 1 : 1;
                orderNumberInput.value = String(next);
            } catch (e) {
                console.warn('Sugerencia número de orden falló:', e);
            }
        }

        function fillSupplierInfo(id) {
            const prov = suppliersById.get(id);
            if (prov) {
                contactInput && (contactInput.value = prov.persona_contacto || '');
                const telefono = prov.telefono || prov.celular || '';
                phoneInput && (phoneInput.value = telefono);
                emailInput && (emailInput.value = prov.email || '');
            } else {
                contactInput && (contactInput.value = '');
                phoneInput && (phoneInput.value = '');
                emailInput && (emailInput.value = '');
            }
        }

        async function searchProductsLike(term) {
            if (!window.db) return { data: [], error: null };
            const { data, error } = await window.db.getProductos({ search: term, onlyActive: true, orderBy: 'nombre', ascending: true, limit: 20 });
            return { data: data || [], error };
        }

        function hideSuggestions(which) {
            const el = which === 'code' ? productCodeSuggestions : productDescSuggestions;
            if (el) { el.style.display = 'none'; el.innerHTML = ''; }
            if (which === 'code') { codeSuggestionItems = []; codeActiveIndex = -1; } else { descSuggestionItems = []; descActiveIndex = -1; }
        }

        function showSuggestions(which, items) {
            const el = which === 'code' ? productCodeSuggestions : productDescSuggestions;
            if (!el) return;
            if (!items.length) { hideSuggestions(which); return; }
            el.innerHTML = '';
            items.forEach((p, idx) => {
                productsById.set(p.id, p);
                const codigo = p.codigo_interno || p.codigo_barras || '';
                const btn = document.createElement('button');
                btn.type = 'button';
                btn.className = 'list-group-item list-group-item-action d-flex justify-content-between align-items-center';
                btn.innerHTML = `<span><strong>${p.nombre}</strong>${codigo ? ` <small class="text-muted">(${codigo})</small>` : ''}</span><small class="text-white-50">${formatCOP(p.precio_venta ?? p.precio_compra ?? 0)}</small>`;
                btn.addEventListener('click', () => selectSuggestion(which, idx));
                el.appendChild(btn);
            });
            if (which === 'code') { codeSuggestionItems = Array.from(el.children); codeActiveIndex = -1; } else { descSuggestionItems = Array.from(el.children); descActiveIndex = -1; }
            el.style.display = 'block';
        }

        function highlightSuggestion(which, index) {
            const items = which === 'code' ? codeSuggestionItems : descSuggestionItems;
            if (!items.length) return;
            items.forEach(el => el.classList.remove('active'));
            if (index >= 0 && index < items.length) {
                items[index].classList.add('active');
                items[index].scrollIntoView({ block: 'nearest' });
            }
        }

        function selectSuggestion(which, index) {
            const items = which === 'code' ? codeSuggestionItems : descSuggestionItems;
            if (index < 0 || index >= items.length) return;
            const p = (which === 'code' ? currentCodeResults : currentDescResults)[index];
            if (!p) return;
            const codeVal = p.codigo_interno || p.codigo_barras || '';
            const nameVal = p.nombre || '';
            // Rellenar ambos campos y productId
            if (searchProductCodeInput) {
                searchProductCodeInput.value = codeVal;
                searchProductCodeInput.dataset.productId = p.id;
            }
            if (searchProductDescInput) {
                searchProductDescInput.value = nameVal;
                searchProductDescInput.dataset.productId = p.id;
            }
            const priceField = document.getElementById('unitPrice');
            if (priceField) priceField.value = Number(p.precio_compra ?? p.precio_venta ?? 0);
            hideSuggestions('code');
            hideSuggestions('desc');
            // Refrescar catálogo con el filtro seleccionado
            try { catalogPage = 1; loadCatalog(); } catch (_) {}
        }

        let currentCodeResults = [];
        let currentDescResults = [];

        // ===== Catálogo de productos con paginación (para seleccionar) =====
        const catalogBody = document.getElementById('catalogBody');
        const catalogPagination = document.getElementById('catalogPagination');
        let catalogPage = 1;
        const catalogPageSize = 5;
        let catalogTotal = 0;

        function renderCatalog(products) {
            if (!catalogBody) return;
            catalogBody.innerHTML = '';
            if (!products || products.length === 0) {
                const tr = document.createElement('tr');
                tr.innerHTML = '<td colspan="5" class="text-center text-muted py-3">Sin resultados</td>';
                catalogBody.appendChild(tr);
                renderCatalogPagination();
                return;
            }
            products.forEach(p => {
                productsById.set(p.id, p);
                const codigo = p.codigo_interno || p.codigo_barras || '-';
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>
                        <div>
                            <strong>${p.nombre || ''}</strong><br>
                            <small class="text-white">${codigo}</small>
                        </div>
                    </td>
                    <td class="text-white">${codigo}</td>
                    <td class="text-center"><span class="badge ${Number(p.stock_actual) > 0 ? 'bg-success' : 'bg-secondary'}">${Number(p.stock_actual) || 0}</span></td>
                    <td class="text-end">${formatCOP(Number(p.precio_compra ?? p.precio_venta ?? 0))}</td>
                    <td class="text-end">${formatCOP(Number(p.precio_venta ?? p.precio_compra ?? 0))}</td>
                    <td class="text-end">
                        <button type="button" class="btn btn-sm btn-outline-success" data-action="pick" data-id="${p.id}"><i class="fas fa-plus"></i></button>
                    </td>`;
                catalogBody.appendChild(tr);
            });
            // Delegación: seleccionar producto del catálogo
            catalogBody.querySelectorAll('button[data-action="pick"]').forEach(btn => {
                btn.addEventListener('click', () => {
                    const id = btn.getAttribute('data-id');
                    const p = productsById.get(id);
                    if (!p) return;
                    // Prefijar campos de búsqueda y precio
                    if (searchProductCodeInput) {
                        searchProductCodeInput.value = p.codigo_interno || p.codigo_barras || '';
                        searchProductCodeInput.dataset.productId = p.id;
                    }
                    if (searchProductDescInput) {
                        searchProductDescInput.value = p.nombre || '';
                        searchProductDescInput.dataset.productId = p.id;
                    }
                    const priceField = document.getElementById('unitPrice');
                    if (priceField) priceField.value = Number(p.precio_compra ?? p.precio_venta ?? 0);
                    const qtyField = document.getElementById('quantity');
                    if (qtyField) qtyField.focus();
                    hideSuggestions('code');
                    hideSuggestions('desc');
                });
            });
            renderCatalogPagination();
        }

        function renderCatalogPagination() {
            if (!catalogPagination) return;
            catalogPagination.innerHTML = '';
            const totalPages = Math.max(1, Math.ceil(catalogTotal / catalogPageSize));
            const prev = document.createElement('button');
            prev.type = 'button';
            prev.className = 'btn btn-sm btn-outline-light';
            prev.textContent = 'Anterior';
            prev.disabled = catalogPage <= 1;
            prev.onclick = async () => { if (catalogPage > 1) { catalogPage--; await loadCatalog(); } };
            const info = document.createElement('span');
            info.className = 'text-white-50 mx-2';
            info.textContent = `Página ${catalogPage} de ${totalPages}`;
            const next = document.createElement('button');
            next.type = 'button';
            next.className = 'btn btn-sm btn-outline-light';
            next.textContent = 'Siguiente';
            next.disabled = catalogPage >= totalPages;
            next.onclick = async () => { if (catalogPage < totalPages) { catalogPage++; await loadCatalog(); } };
            catalogPagination.appendChild(prev);
            catalogPagination.appendChild(info);
            catalogPagination.appendChild(next);
        }

        async function loadCatalog() {
            if (!catalogBody) return;
            // Loading row
            catalogBody.innerHTML = '<tr><td colspan="5" class="text-center text-muted py-3"><i class="fas fa-spinner fa-spin"></i> Cargando...</td></tr>';
            const codeTerm = (searchProductCodeInput?.value || '').trim();
            const descTerm = (searchProductDescInput?.value || '').trim();
            const offset = (catalogPage - 1) * catalogPageSize;
            // Preferimos filtro específico por código y búsqueda general por desc/nombre
            const { data, error, count } = await window.db.getProductos({
                search: codeTerm || descTerm,
                internalCode: '',
                onlyActive: true,
                orderBy: 'nombre',
                ascending: true,
                limit: catalogPageSize,
                offset
            });
            if (error) {
                console.error('Error cargando catálogo:', error);
                catalogBody.innerHTML = '<tr><td colspan="5" class="text-center text-danger py-3">Error al cargar</td></tr>';
                catalogTotal = 0;
                renderCatalogPagination();
                return;
            }
            catalogTotal = Number(count || 0);
            renderCatalog(data || []);
        }

        function getSelectedProductFromInput() {
            const id = searchProductInput?.dataset?.productId;
            if (id && productsById.has(id)) return productsById.get(id);
            return null;
        }

        function debounce(fn, wait) {
            let t;
            return (...args) => {
                clearTimeout(t);
                t = setTimeout(() => fn(...args), wait);
            };
        }

        function parseCurrency(text) {
            const raw = String(text)
                .trim()
                .replace(/\s/g, '')
                .replace(/\$/g, '')
                .replace(/\./g, '')
                .replace(/,/g, '.');
            const n = Number(raw);
            return Number.isFinite(n) ? n : 0;
        }

        function formatCOP(value) {
            return new Intl.NumberFormat('es-CO', {
                style: 'currency',
                currency: 'COP',
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            }).format(Number(value) || 0);
        }

        function calculateTotals() {
            let sumBaseBeforeGlobal = 0;
            let sumTaxAfterGlobal = 0;
            const globalDiscPct = Number(globalDiscount?.value || 0);
            for (const row of productsBody.querySelectorAll('tr')) {
                const quantity = Number(row.querySelector('.prod-qty')?.textContent || 0);
                const unitPrice = parseCurrency(row.querySelector('.prod-price')?.textContent || 0);
                const discount = Number((row.querySelector('.prod-disc')?.textContent || '0').replace('%', ''));
                const taxRate = Number(row.dataset.taxRate || 0); // porcentaje
                const lineBase = quantity * unitPrice * (1 - discount / 100);
                sumBaseBeforeGlobal += lineBase;
                const lineBaseAfterGlobal = lineBase * (1 - globalDiscPct / 100);
                sumTaxAfterGlobal += lineBaseAfterGlobal * (taxRate / 100);
            }
            const discountAmt = Math.max(0, sumBaseBeforeGlobal * globalDiscPct / 100);
            const subtotal = sumBaseBeforeGlobal - discountAmt;
            const vat = sumTaxAfterGlobal;
            const total = subtotal + vat;
            uiSubtotal.textContent = formatCOP(subtotal);
            uiVat.textContent = formatCOP(vat);
            uiTotal.textContent = formatCOP(total);
            return { subtotal, vat, total, descuento: discountAmt };
        }

        if (addProductBtn) addProductBtn.addEventListener('click', () => {
            const selected = (function(){
                const id = searchProductCodeInput?.dataset?.productId || searchProductDescInput?.dataset?.productId;
                return id && productsById.has(id) ? productsById.get(id) : null;
            })();
            const searchTerm = (searchProductDescInput?.value || searchProductCodeInput?.value || '').trim();
            const quantity = Number(document.getElementById('quantity').value || 1);
            const unitPrice = Number(document.getElementById('unitPrice').value || (selected?.precio_compra ?? 0));
            const discountEl = document.getElementById('discount');
            const discount = Number(discountEl?.value || 0);
            if ((!selected && !searchTerm) || unitPrice <= 0) { alert('Por favor seleccione un producto y precio válido'); return; }
            const tr = document.createElement('tr');
            if (selected?.id) tr.dataset.productId = selected.id;
            const codigoCell = (selected?.codigo_interno || selected?.codigo_barras || searchTerm).toString();
            const taxRate = Number(selected?.tasa_impuesto ?? 0);
            tr.dataset.taxRate = String(taxRate);
            tr.innerHTML = `
                <td><i class="fas fa-box text-primary"></i></td>
                <td>
                    <div>
                        <strong>${selected?.nombre || searchTerm}</strong>
                    </div>
                </td>
                <td class="text-white">${codigoCell}</td>
                <td class="text-end prod-qty">${quantity}</td>
                <td class="text-end prod-price">${formatCOP(unitPrice)}</td>
                <td class="text-end"><strong>${formatCOP(quantity * unitPrice * (1 - discount / 100))}</strong></td>
                <td>
                    <button type="button" class="btn btn-sm btn-outline-danger" title="Eliminar">
                        <i class="fas fa-times"></i>
                    </button>
                </td>`;
            productsBody.appendChild(tr);
            if (searchProductCodeInput) { searchProductCodeInput.value = ''; delete searchProductCodeInput.dataset.productId; hideSuggestions('code'); }
            if (searchProductDescInput) { searchProductDescInput.value = ''; delete searchProductDescInput.dataset.productId; hideSuggestions('desc'); }
            document.getElementById('quantity').value = '1';
            document.getElementById('unitPrice').value = '';
            if (discountEl) discountEl.value = '0';
            calculateTotals();
        });

        function setupSearchField(which) {
            const input = which === 'code' ? searchProductCodeInput : searchProductDescInput;
            if (!input) return;
            const doSearch = debounce(async () => {
                const term = input.value.trim();
                delete input.dataset.productId;
                if (!term) { hideSuggestions(which); return; }
                const { data, error } = which === 'code'
                    ? await window.db.searchProductosPorCodigo(term, { limit: 20 })
                    : await window.db.searchProductosPorDescripcion(term, { limit: 20 });
                if (error) { console.error('Error búsqueda productos:', error); hideSuggestions(which); return; }
                if (which === 'code') { currentCodeResults = data; } else { currentDescResults = data; }
                showSuggestions(which, data);
            }, 250);

            input.addEventListener('input', doSearch);
            // También recargar el catálogo con debounce al escribir
            input.addEventListener('input', debounce(async () => { catalogPage = 1; await loadCatalog(); }, 300));
            input.addEventListener('keydown', (e) => {
                const items = which === 'code' ? codeSuggestionItems : descSuggestionItems;
                if (!items.length) return;
                if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    if (which === 'code') { codeActiveIndex = Math.min((codeActiveIndex + 1), items.length - 1); if (codeActiveIndex < 0) codeActiveIndex = 0; highlightSuggestion('code', codeActiveIndex); }
                    else { descActiveIndex = Math.min((descActiveIndex + 1), items.length - 1); if (descActiveIndex < 0) descActiveIndex = 0; highlightSuggestion('desc', descActiveIndex); }
                } else if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    if (which === 'code') { codeActiveIndex = Math.max(codeActiveIndex - 1, 0); highlightSuggestion('code', codeActiveIndex); }
                    else { descActiveIndex = Math.max(descActiveIndex - 1, 0); highlightSuggestion('desc', descActiveIndex); }
                } else if (e.key === 'Enter') {
                    const idx = which === 'code' ? (codeActiveIndex === -1 ? 0 : codeActiveIndex) : (descActiveIndex === -1 ? 0 : descActiveIndex);
                    if (items.length) { e.preventDefault(); selectSuggestion(which, idx); }
                } else if (e.key === 'Escape') {
                    hideSuggestions(which);
                }
            });

            input.addEventListener('change', () => {
                const id = input.dataset.productId;
                if (id && productsById.has(id)) {
                    const p = productsById.get(id);
                    const priceField = document.getElementById('unitPrice');
                    if (priceField) priceField.value = Number(p.precio_compra ?? p.precio_venta ?? 0);
                }
            });

            input.addEventListener('blur', () => setTimeout(() => hideSuggestions(which), 150));
        }

        setupSearchField('code');
        setupSearchField('desc');

        productsBody.addEventListener('click', (e) => {
            if (e.target.closest('.btn-outline-danger')) {
                e.target.closest('tr').remove();
                calculateTotals();
            }
        });

        if (globalDiscount) globalDiscount.addEventListener('input', calculateTotals);
        if (clearBtn) clearBtn.addEventListener('click', () => { form.reset(); productsBody.innerHTML = ''; calculateTotals(); });
        if (searchBtn) searchBtn.addEventListener('click', () => { alert('Búsqueda de compras pendiente de implementar.'); });
        if (draftBtn) draftBtn.addEventListener('click', () => { alert('Orden de compra guardada como borrador'); });

        if (supplierSelect) {
            supplierSelect.addEventListener('change', (e) => {
                const id = e.target.value;
                fillSupplierInfo(id);
            });
        }

        if (saveBtn) saveBtn.addEventListener('click', async () => {
            if (!form.checkValidity()) { form.reportValidity(); return; }
            if (!window.db || !window.supabaseClient) { alert('No hay conexión con el servicio.'); return; }
            const original = saveBtn.innerHTML; saveBtn.disabled = true; saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-1"></i>Creando...';
            try {
                const totals = calculateTotals();
                // Obtener usuario actual (para usuario_id requerido por la tabla)
                let currentUserId = null;
                try {
                    currentUserId = window.auth?.getCurrentUser?.()?.id || null;
                    if (!currentUserId && window.supabaseClient) {
                        const { data: { session } } = await window.supabaseClient.auth.getSession();
                        currentUserId = session?.user?.id || null;
                    }
                } catch (_) {}

                const compraData = {
                    numero_orden: Number(document.getElementById('orderNumber').value) || undefined,
                    fecha_compra: document.getElementById('purchaseDate').value,
                    fecha_entrega: document.getElementById('expectedDelivery').value || null,
                    proveedor_id: supplierSelect && supplierSelect.value ? supplierSelect.value : null,
                    estado: document.getElementById('purchaseStatus').value,
                    usuario_id: currentUserId,
                    subtotal: totals.subtotal,
                    impuesto: totals.vat,
                    descuento: totals.descuento,
                    total: totals.total,
                    notas: document.getElementById('notes').value
                };
                const detalles = Array.from(productsBody.querySelectorAll('tr')).map(row => ({
                    producto_id: row.dataset.productId || null,
                    cantidad: Number(row.querySelector('.prod-qty')?.textContent || 0),
                    precio_unitario: parseCurrency(row.querySelector('.prod-price')?.textContent || 0),
                    descuento: Number((row.querySelector('.prod-disc')?.textContent || '0').replace('%', '')),
                    tasa_impuesto: 19.0,
                    subtotal: 0, impuesto: 0, total: 0
                }));

                const result = await window.db.createCompra(compraData, detalles);
                if (result.error) {
                    alert(result.error.message || 'Error al crear la orden de compra');
                    console.error('Error creando compra:', result.error);
                } else {
                    showToast(`Orden "${result.data.numero_orden}" creada correctamente`);
                    form.reset(); productsBody.innerHTML = ''; calculateTotals();
                    if (supplierSelect) fillSupplierInfo('');
                }
            } catch (e) {
                console.error('Error al crear compra:', e);
                alert('Error inesperado al crear la orden');
            } finally {
                saveBtn.disabled = false; saveBtn.innerHTML = original;
            }
        });

        // Iniciales
        const purchaseDate = document.getElementById('purchaseDate');
        if (purchaseDate) purchaseDate.valueAsDate = new Date();
        // Autenticación para permitir consultas con RLS
        try { await window.ensureAuthenticated?.(); } catch (_) {}
        loadSuppliers();
        await suggestNextOrderNumber();
        calculateTotals();
        // Cargar catálogo inicial
        await loadCatalog();
    });
})();


