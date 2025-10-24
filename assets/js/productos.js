// ===== PRODUCTOS - SISTEMA ADS-POS =====
// Versión inicial: INSERT + UI básica

(function () {
    // Estado de conexión (igual que en categorías)
    let isConnected = false;

    async function testConnection() {
        try {
            console.log('🔌 ===== INICIANDO PRUEBA DE CONEXIÓN (PRODUCTOS) =====');
            console.log('📅 Timestamp:', new Date().toISOString());
            console.log('ℹ️ Probando conexión con Supabase...');

            if (!window.supabaseClient) {
                throw new Error('Cliente de Supabase no inicializado');
            }
            console.log('✅ Cliente de Supabase encontrado');

            if (!window.db) {
                throw new Error('Servicio de base de datos no disponible');
            }
            console.log('✅ Servicio de base de datos encontrado');

            // Consulta simple para verificar permisos/estado (hará 401 si no hay sesión para RLS de productos)
            const { data, error } = await window.supabaseClient
                .from('productos')
                .select('id')
                .limit(1);

            console.log('📡 Resultado de consulta (productos):', { data, error });
            if (error) throw error;

            console.log('✅ Conexión exitosa con Supabase (productos)');
            // Igual que categorías: si el SELECT funciona, consideramos conexión OK para lectura
            isConnected = true;
            return true;
        } catch (error) {
            console.error('❌ ERROR DE CONEXIÓN (PRODUCTOS):', error);
            isConnected = false;
            return false;
        }
    }
    // Helpers UI
    function showToastSuccess(message) {
        const div = document.createElement('div');
        div.className = 'alert alert-success position-fixed';
        div.style.cssText = 'top:20px;right:20px;z-index:9999;min-width:280px;box-shadow:0 4px 12px rgba(0,0,0,0.3)';
        div.innerHTML = `<div class="d-flex align-items-center"><i class="fas fa-check-circle me-2"></i><span>${message}</span><button type="button" class="btn-close ms-auto" onclick="this.parentElement.parentElement.remove()"></button></div>`;
        document.body.appendChild(div);
        setTimeout(() => div.remove(), 3500);
    }

    // Cargar categorías desde la base de datos para el selector del formulario y el filtro
    async function loadProductCategories() {
        try {
            const categorySelect = document.getElementById('category');
            const filterCategory = document.getElementById('filterCategory');
            if (!categorySelect && !filterCategory) return;

            // Limpiar y colocar placeholder
            if (categorySelect) {
                categorySelect.innerHTML = '<option value="">Seleccionar categoría</option>';
            }
            if (filterCategory) {
                filterCategory.innerHTML = '<option value="">Todas las categorías</option>';
            }

            if (!isConnected) {
                console.warn('No conectado; categorías no cargadas');
                return;
            }

            const result = await window.db.getCategorias({ onlyActive: true, orderBy: 'nombre', ascending: true });
            if (result.error) throw result.error;

            const categorias = result.data || [];
            categorias.forEach(cat => {
                if (categorySelect) {
                    const opt = document.createElement('option');
                    opt.value = cat.id; // UUID
                    opt.textContent = cat.nombre;
                    categorySelect.appendChild(opt);
                }
                if (filterCategory) {
                    const opt2 = document.createElement('option');
                    opt2.value = cat.id; // usar UUID para filtros futuros
                    opt2.textContent = cat.nombre;
                    filterCategory.appendChild(opt2);
                }
            });
        } catch (err) {
            console.error('❌ Error al cargar categorías (productos):', err);
        }
    }

    // Calcular margen de ganancia
    function calculateProfitMargin() {
        const salePrice = document.getElementById('salePrice');
        const purchasePrice = document.getElementById('purchasePrice');
        const profitMargin = document.getElementById('profitMargin');
        const sale = parseFloat(salePrice.value) || 0;
        const purchase = parseFloat(purchasePrice.value) || 0;
        if (purchase > 0) {
            const margin = ((sale - purchase) / purchase) * 100;
            profitMargin.value = margin.toFixed(2);
        } else {
            profitMargin.value = '';
        }
    }

    // Estado de paginación
    let currentPage = 1;
    const pageSize = 5;
    let totalProducts = 0;

    // Renderizar productos en la tabla
    function renderProducts(products) {
        const tbody = document.getElementById('productsBody');
        if (!tbody) return;
        tbody.innerHTML = '';
        if (!products || products.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="8" class="text-center text-muted py-4">
                        <i class="fas fa-inbox fa-2x mb-2"></i><br>
                        No hay productos registrados
                    </td>
                </tr>
            `;
            return;
        }
        products.forEach(p => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td><i class="fas fa-box text-primary"></i></td>
                <td>
                    <div>
                        <strong>${p.nombre || ''}</strong><br>
                        <small class="text-white" style="opacity:0.85;">${(p.marca || '') + (p.modelo ? ' - ' + p.modelo : '')}</small>
                    </div>
                </td>
                <td>${p.codigo_interno || p.codigo_barras || '-'}</td>
                <td>${p.categoria?.nombre || '-'}</td>
                <td><span class="badge ${Number(p.stock_actual) > 0 ? 'bg-success' : 'bg-danger'}">${Number(p.stock_actual) || 0}</span></td>
                <td>$ ${Number(p.precio_venta || 0).toLocaleString('es-CO')}</td>
                <td><span class="badge ${p.activo ? 'bg-success' : 'bg-secondary'}">${p.activo ? 'Activo' : 'Inactivo'}</span></td>
                <td>
                    <button type="button" class="btn btn-sm btn-outline-primary me-1" title="Editar" data-action="edit" data-id="${p.id}">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button type="button" class="btn btn-sm btn-outline-danger" title="Eliminar" data-action="delete" data-id="${p.id}">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            `;
            tbody.appendChild(row);
        });
        // Delegación de eventos para Edit/Delete
        tbody.querySelectorAll('button[data-action="edit"]').forEach(btn => {
            btn.addEventListener('click', async () => {
                const id = btn.getAttribute('data-id');
                await startEditProduct(id);
            });
        });
        tbody.querySelectorAll('button[data-action="delete"]').forEach(btn => {
            btn.addEventListener('click', async () => {
                const id = btn.getAttribute('data-id');
                await confirmAndDeleteProduct(id);
            });
        });

        renderPagination();
    }

    function renderPagination() {
        const container = document.getElementById('productsPagination');
        if (!container) return;
        container.innerHTML = '';

        const totalPages = Math.max(1, Math.ceil(totalProducts / pageSize));

        // Botón Prev
        const prevBtn = document.createElement('button');
        prevBtn.className = 'btn btn-sm btn-outline-light me-2';
        prevBtn.type = 'button';
        prevBtn.disabled = currentPage <= 1;
        prevBtn.textContent = 'Anterior';
        prevBtn.onclick = async (e) => {
            e.preventDefault();
            if (currentPage > 1) {
                currentPage--;
                await loadProducts();
            }
        };
        container.appendChild(prevBtn);

        // Indicador de página
        const pageInfo = document.createElement('span');
        pageInfo.className = 'text-white-50';
        pageInfo.textContent = `Página ${currentPage} de ${totalPages}`;
        container.appendChild(pageInfo);

        // Botón Next
        const nextBtn = document.createElement('button');
        nextBtn.className = 'btn btn-sm btn-outline-light ms-2';
        nextBtn.type = 'button';
        nextBtn.disabled = currentPage >= totalPages;
        nextBtn.textContent = 'Siguiente';
        nextBtn.onclick = async (e) => {
            e.preventDefault();
            if (currentPage < totalPages) {
                currentPage++;
                await loadProducts();
            }
        };
        container.appendChild(nextBtn);
    }

    // Cargar productos desde Supabase (gating por isConnected)
    async function loadProducts() {
        try {
            const tbody = document.getElementById('productsBody');
            if (tbody) {
                tbody.innerHTML = `
                    <tr>
                        <td colspan="8" class="text-center text-muted py-4">
                            <i class="fas fa-spinner fa-spin fa-2x mb-2"></i><br>
                            Cargando productos desde la base de datos...
                        </td>
                    </tr>
                `;
            }

            if (!isConnected) {
                console.warn('No hay conexión/Sesión. No se cargan productos.');
                renderProducts([]);
                return;
            }

            const offset = (currentPage - 1) * pageSize;
            const internalCode = (document.getElementById('filterInternalCode')?.value || '').trim();
            const result = await window.db.getProductos({ orderBy: 'nombre', ascending: true, limit: pageSize, offset, internalCode });
            if (result.error) throw result.error;
            totalProducts = Number(result.count || 0);
            console.log(`✅ ${result.data?.length || 0} productos cargados (total: ${totalProducts})`);
            renderProducts(result.data || []);
        } catch (err) {
            console.error('❌ Error al cargar productos:', err);
            renderProducts([]);
        }
    }

    // Cargar datos del producto al formulario para edición
    async function startEditProduct(id) {
        try {
            // Traer el producto por id desde Supabase para asegurar datos frescos
            const { data, error } = await window.supabaseClient
                .from('productos')
                .select('*')
                .eq('id', id)
                .single();
            if (error) throw error;
            const p = data;

            document.getElementById('productName').value = p.nombre || '';
            document.getElementById('barcode').value = p.codigo_barras || '';
            document.getElementById('internalCode').value = p.codigo_interno || '';
            const catSel = document.getElementById('category');
            if (catSel) catSel.value = p.categoria_id || '';
            document.getElementById('brand').value = p.marca || '';
            document.getElementById('model').value = p.modelo || '';
            document.getElementById('description').value = p.descripcion || '';
            document.getElementById('salePrice').value = p.precio_venta ?? '';
            document.getElementById('purchasePrice').value = p.precio_compra ?? '';
            document.getElementById('profitMargin').value = p.margen_ganancia ?? '';
            document.getElementById('wholesalePrice').value = p.precio_mayorista ?? '';
            document.getElementById('maxDiscount').value = p.descuento_max ?? '';
            document.getElementById('taxRate').value = p.tasa_impuesto ?? 19;
            document.getElementById('currentStock').value = p.stock_actual ?? 0;
            document.getElementById('minStock').value = p.stock_min ?? 0;
            document.getElementById('maxStock').value = p.stock_max ?? 0;
            document.getElementById('weight').value = p.peso ?? '';
            document.getElementById('dimensions').value = p.dimensiones ?? '';
            document.getElementById('status').value = p.activo ? 'activo' : 'inactivo';

            const saveBtn = document.getElementById('saveBtn');
            saveBtn.innerHTML = '<i class="fas fa-save me-1"></i>Actualizar';
            saveBtn.setAttribute('data-editing', 'true');
            saveBtn.setAttribute('data-id', id);
            document.getElementById('clearBtn').innerHTML = '<i class="fas fa-times me-1"></i>Cancelar';

            // Enfocar el primer campo del formulario
            const nameInput = document.getElementById('productName');
            if (nameInput) {
                nameInput.focus();
                nameInput.select();
            }
        } catch (err) {
            console.error('❌ Error al preparar edición:', err);
            alert('No se pudo cargar el producto');
        }
    }

    // Confirmar y hacer soft delete
    async function confirmAndDeleteProduct(id) {
        try {
            if (!confirm('¿Seguro que deseas eliminar este producto?')) return;
            const { error } = await window.db.deleteProducto(id);
            if (error) throw error;
            showToastSuccess('Producto eliminado');
            if (document.querySelectorAll('#productsBody tr').length === 1 && currentPage > 1) {
                currentPage--;
            }
            await loadProducts();
        } catch (err) {
            console.error('❌ Error al eliminar producto:', err);
            alert('No se pudo eliminar el producto');
        }
    }
    // Utilidad: validar UUID
    function isValidUUID(value) {
        return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
    }

    // Capturar datos del formulario y mapear a columnas reales
    function getProductFormData() {
        const rawCategory = document.getElementById('category').value;
        const categoriaId = isValidUUID(rawCategory) ? rawCategory : null;
        return {
            nombre: document.getElementById('productName').value.trim(),
            codigo_barras: document.getElementById('barcode').value.trim(),
            codigo_interno: document.getElementById('internalCode').value.trim(),
            categoria_id: categoriaId,
            marca: document.getElementById('brand').value.trim(),
            modelo: document.getElementById('model').value.trim(),
            descripcion: document.getElementById('description').value.trim(),
            precio_venta: document.getElementById('salePrice').value,
            precio_compra: document.getElementById('purchasePrice').value,
            margen_ganancia: document.getElementById('profitMargin').value,
            precio_mayorista: document.getElementById('wholesalePrice').value,
            descuento_max: document.getElementById('maxDiscount').value,
            tasa_impuesto: document.getElementById('taxRate').value,
            stock_actual: document.getElementById('currentStock').value,
            stock_min: document.getElementById('minStock').value,
            stock_max: document.getElementById('maxStock').value,
            peso: document.getElementById('weight').value,
            dimensiones: document.getElementById('dimensions').value,
            activo: document.getElementById('status').value !== 'inactivo'
        };
    }

    async function handleSave() {
        try {
            const form = document.getElementById('productForm');
            const saveBtn = document.getElementById('saveBtn');
            const original = saveBtn ? saveBtn.innerHTML : '';
            if (!form.checkValidity()) {
                form.reportValidity();
                return;
            }

            if (!window.supabaseClient || !window.db) {
                console.error('Supabase o servicio DB no disponibles');
                alert('No hay conexión con el servicio.');
                return;
            }

            // Igual que categorías: usamos la sesión existente; además validamos conexión
            if (!isConnected) {
                alert('No hay conexión con Supabase (permiso o sesión).');
                return;
            }

            if (saveBtn) {
                saveBtn.disabled = true;
                saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-1"></i>Guardando...';
            }

            const data = getProductFormData();
            console.log('📝 Datos a guardar/actualizar (producto):', data);

            const isEditing = saveBtn.getAttribute('data-editing') === 'true';
            const editingId = saveBtn.getAttribute('data-id');

            const result = isEditing
                ? await window.db.updateProducto(editingId, data)
                : await window.db.createProducto(data);
            if (result.error) {
                console.error('❌ Error guardando producto:', result.error);
                alert(result.error.message || (isEditing ? 'Error al actualizar el producto' : 'Error al guardar el producto'));
            } else {
                console.log('✅ Producto guardado:', result.data);
                showToastSuccess(`Producto "${result.data.nombre}" ${isEditing ? 'actualizado' : 'creado'} correctamente`);
                form.reset();
                calculateProfitMargin();
                // Restablecer botones si veníamos de edición
                if (isEditing) {
                    saveBtn.innerHTML = '<i class="fas fa-save me-1"></i>Guardar';
                    saveBtn.removeAttribute('data-editing');
                    saveBtn.removeAttribute('data-id');
                    document.getElementById('clearBtn').innerHTML = '<i class="fas fa-eraser me-1"></i>Limpiar';
                }
                // Reiniciar a la primera página y recargar
                currentPage = 1;
                await loadProducts();
            }

            saveBtn.disabled = false;
            // Siempre volver a modo "Guardar" tras completar
            saveBtn.innerHTML = '<i class="fas fa-save me-1"></i>Guardar';
        } catch (e) {
            console.error('❌ Error general en guardado:', e);
            alert('Error inesperado al guardar');
            const saveBtn = document.getElementById('saveBtn');
            if (saveBtn) {
                saveBtn.disabled = false;
                saveBtn.innerHTML = '<i class="fas fa-save me-1"></i>Guardar';
            }
        }
    }

    // Inicialización
    document.addEventListener('DOMContentLoaded', async () => {
        await testConnection();
        // Cargar categorías primero (como patrón de categorías)
        await loadProductCategories();
        // Luego cargar productos
        await loadProducts();
        // Listeners UI migrados del HTML
        const salePrice = document.getElementById('salePrice');
        const purchasePrice = document.getElementById('purchasePrice');
        if (salePrice) salePrice.addEventListener('input', calculateProfitMargin);
        if (purchasePrice) purchasePrice.addEventListener('input', calculateProfitMargin);

        const clearBtn = document.getElementById('clearBtn');
        if (clearBtn) clearBtn.addEventListener('click', () => {
            document.getElementById('productForm').reset();
            calculateProfitMargin();
        });

        const saveBtn = document.getElementById('saveBtn');
        if (saveBtn) saveBtn.addEventListener('click', handleSave);

        // Búsqueda y filtros (placeholder, se migrarán a funciones con datos reales luego)
        const searchInput = document.getElementById('searchProduct');
        const filterInternalCode = document.getElementById('filterInternalCode');
        const filterStatus = document.getElementById('filterStatus');
        if (searchInput) {
            searchInput.addEventListener('input', () => {
                const term = searchInput.value.toLowerCase();
                const rows = document.querySelectorAll('#productsBody tr');
                rows.forEach(row => {
                    const productName = row.cells[1]?.textContent.toLowerCase() || '';
                    const code = row.cells[2]?.textContent.toLowerCase() || '';
                    row.style.display = (productName.includes(term) || code.includes(term)) ? '' : 'none';
                });
            });
        }
        async function applyFilters() {
            currentPage = 1;
            await loadProducts();
        }
        if (filterInternalCode) filterInternalCode.addEventListener('input', debounce(applyFilters, 300));
        if (filterStatus) filterStatus.addEventListener('change', applyFilters);

        function debounce(fn, delay) {
            let t;
            return (...args) => {
                clearTimeout(t);
                t = setTimeout(() => fn.apply(this, args), delay);
            };
        }
    });
})();
