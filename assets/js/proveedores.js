// ===== PROVEEDORES - SISTEMA ADS-POS =====
(function () {
    function showToast(message, type = 'success') {
        const div = document.createElement('div');
        div.className = `alert alert-${type} position-fixed`;
        div.style.cssText = 'top:20px;right:20px;z-index:9999;min-width:280px;box-shadow:0 4px 12px rgba(0,0,0,0.3)';
        div.innerHTML = `<div class="d-flex align-items-center"><span>${message}</span><button type="button" class="btn-close ms-auto" onclick="this.parentElement.parentElement.remove()"></button></div>`;
        document.body.appendChild(div);
        setTimeout(() => div.remove(), 3500);
    }

    function getProveedorFormData() {
        return {
            tipo_id: document.getElementById('idType').value,
            numero_id: document.getElementById('idNumber').value,
            razon_social: document.getElementById('companyName').value,
            nombre_comercial: document.getElementById('tradeName').value,
            codigo: document.getElementById('supplierCode').value,
            categoria: document.getElementById('category').value,
            direccion: document.getElementById('address').value,
            ciudad: document.getElementById('city').value,
            departamento: document.getElementById('department').value,
            telefono: document.getElementById('phone').value,
            celular: document.getElementById('mobile').value,
            email: document.getElementById('email').value,
            persona_contacto: document.getElementById('contactName').value,
            contacto_cargo: document.getElementById('contactPosition').value,
            contacto_telefono: document.getElementById('contactPhone').value,
            contacto_email: document.getElementById('contactEmail').value,
            terminos_pago: document.getElementById('paymentTerms').value,
            limite_credito: document.getElementById('creditLimit').value,
            productos_servicios: document.getElementById('productsServices').value,
            notas: document.getElementById('notes').value,
            activo: (document.getElementById('status')?.value || 'activo') === 'activo'
        };
    }

    document.addEventListener('DOMContentLoaded', () => {
        // Offcanvas
        const offcanvasElement = document.getElementById('posSidebar');
        if (offcanvasElement) {
            const offcanvas = new bootstrap.Offcanvas(offcanvasElement);
            offcanvasElement.addEventListener('show.bs.offcanvas', function() { this.classList.add('show'); });
            offcanvasElement.addEventListener('hide.bs.offcanvas', function() { this.classList.remove('show'); });
        }

        const form = document.getElementById('supplierForm');
        const clearBtn = document.getElementById('clearBtn');
        const searchBtn = document.getElementById('searchBtn');
        const saveBtn = document.getElementById('saveBtn');
        const searchSupplier = document.getElementById('searchSupplier');
        const filterSupplierStatus = document.getElementById('filterSupplierStatus');
        const filterSupplierNumeroId = document.getElementById('filterSupplierNumeroId');

        // Lista inicial
        loadSuppliers();

        if (clearBtn) clearBtn.addEventListener('click', function() {
            if (confirm('¿Estás seguro de que quieres limpiar todos los campos?')) {
                form.reset();
            }
        });

        if (searchBtn) searchBtn.addEventListener('click', function() {
            const idNumber = document.getElementById('idNumber').value.trim();
            if (!idNumber) {
                alert('Por favor ingresa el número de identificación para buscar.');
                return;
            }
            alert('Funcionalidad de búsqueda pendiente de implementar.');
        });

        if (saveBtn) saveBtn.addEventListener('click', async function() {
            if (!form.checkValidity()) {
                form.classList.add('was-validated');
                const firstInvalid = form.querySelector(':invalid');
                if (firstInvalid && typeof firstInvalid.focus === 'function') {
                    firstInvalid.focus();
                    if (typeof firstInvalid.select === 'function') firstInvalid.select();
                    firstInvalid.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
                return;
            }
            if (!window.db || !window.supabaseClient) {
                alert('No hay conexión con el servicio.');
                return;
            }
            const original = saveBtn.innerHTML;
            saveBtn.disabled = true;
            saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-1"></i>Guardando...';
            try {
                const payload = getProveedorFormData();
                const isEditing = saveBtn.getAttribute('data-editing') === 'true';
                const editingId = saveBtn.getAttribute('data-id');
                const result = isEditing
                    ? await window.db.updateProveedor(editingId, payload)
                    : await window.db.createProveedor(payload);
                if (result.error) {
                    alert(result.error.message || (isEditing ? 'Error al actualizar el proveedor' : 'Error al guardar el proveedor'));
                    console.error('Error guardando proveedor:', result.error);
                } else {
                    showToast(`Proveedor "${result.data.razon_social}" ${isEditing ? 'actualizado' : 'creado'} correctamente`);
                    form.reset();
                    if (isEditing) {
                        saveBtn.innerHTML = '<i class="fas fa-save me-1"></i>Guardar';
                        saveBtn.removeAttribute('data-editing');
                        saveBtn.removeAttribute('data-id');
                    }
                    // Recargar lista
                    currentPage = 1;
                    await loadSuppliers();
                }
            } catch (e) {
                console.error('Error en guardado de proveedor:', e);
                alert('Error inesperado al guardar');
            } finally {
                saveBtn.disabled = false;
                // Siempre volver a modo "Guardar" tras completar la operación
                saveBtn.innerHTML = '<i class="fas fa-save me-1"></i>Guardar';
            }
        });

        if (searchSupplier) searchSupplier.addEventListener('input', debounce(applyFilters, 300));
        if (filterSupplierStatus) filterSupplierStatus.addEventListener('change', applyFilters);
        if (filterSupplierNumeroId) filterSupplierNumeroId.addEventListener('input', debounce(applyFilters, 300));

        async function applyFilters() {
            currentPage = 1;
            await loadSuppliers();
        }

        function debounce(fn, delay) {
            let t;
            return (...args) => { clearTimeout(t); t = setTimeout(() => fn.apply(this, args), delay); };
        }
    });

    // Paginación proveedores
    let currentPage = 1;
    const pageSize = 5;
    let totalSuppliers = 0;

    async function loadSuppliers() {
        try {
            const tbody = document.getElementById('suppliersBody');
            if (tbody) {
                tbody.innerHTML = `
                    <tr>
                        <td colspan="7" class="text-center text-muted py-4">
                            <i class=\"fas fa-spinner fa-spin fa-2x mb-2\"></i><br>
                            Cargando proveedores...
                        </td>
                    </tr>`;
            }
            const search = (document.getElementById('searchSupplier')?.value || '').trim();
            const statusVal = (document.getElementById('filterSupplierStatus')?.value || '').trim();
            const onlyActive = statusVal === 'activo';
            const numeroId = (document.getElementById('filterSupplierNumeroId')?.value || '').trim();
            const offset = (currentPage - 1) * pageSize;
            const result = await window.db.getProveedores({ search, numeroId, onlyActive, orderBy: 'razon_social', ascending: true, limit: pageSize, offset });
            if (result.error) throw result.error;
            totalSuppliers = Number(result.count || 0);
            renderSuppliers(result.data || [], statusVal);
            renderSuppliersPagination();
        } catch (err) {
            console.error('Error al cargar proveedores:', err);
            renderSuppliers([], '');
        }
    }

    function renderSuppliers(suppliers, statusFilter) {
        const tbody = document.getElementById('suppliersBody');
        if (!tbody) return;
        tbody.innerHTML = '';
        const rows = (suppliers || []).filter(s => statusFilter === 'inactivo' ? s.activo === false : true);
        if (rows.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan=\"7\" class=\"text-center text-muted py-4\">\n                        <i class=\"fas fa-inbox fa-2x mb-2\"></i><br>\n                        No hay proveedores registrados\n                    </td>
                </tr>`;
            return;
        }
        rows.forEach(s => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><i class=\"fas fa-truck text-warning\"></i></td>
                <td><strong>${s.razon_social || ''}</strong><br><small class=\"text-white\" style=\"opacity:0.85;\">${s.nombre_comercial || ''}</small></td>
                <td>${s.tipo_id || ''} ${s.numero_id || ''}</td>
                <td>${s.telefono || ''} ${s.celular ? ' / ' + s.celular : ''}</td>
                <td>${s.ciudad || ''}</td>
                <td><span class=\"badge ${s.activo ? 'bg-success' : 'bg-secondary'}\">${s.activo ? 'Activo' : 'Inactivo'}</span></td>
                <td>
                    <button type=\"button\" class=\"btn btn-sm btn-outline-primary me-1\" title=\"Editar\" data-action=\"edit\" data-id=\"${s.id}\"><i class=\"fas fa-edit\"></i></button>
                    <button type=\"button\" class=\"btn btn-sm btn-outline-danger\" title=\"Eliminar\" data-action=\"delete\" data-id=\"${s.id}\"><i class=\"fas fa-trash\"></i></button>
                </td>`;
            tbody.appendChild(tr);
        });

        // Delegar acciones
        tbody.querySelectorAll('button[data-action="edit"]').forEach(btn => {
            btn.addEventListener('click', async () => {
                const id = btn.getAttribute('data-id');
                await startEditSupplier(id);
            });
        });
        tbody.querySelectorAll('button[data-action="delete"]').forEach(btn => {
            btn.addEventListener('click', async () => {
                const id = btn.getAttribute('data-id');
                await confirmAndDeleteSupplier(id);
            });
        });
    }

    async function startEditSupplier(id) {
        try {
            const { data, error } = await window.supabaseClient
                .from('proveedores').select('*').eq('id', id).single();
            if (error) throw error;
            const s = data;

            document.getElementById('idType').value = s.tipo_id || 'NIT';
            document.getElementById('idNumber').value = s.numero_id || '';
            document.getElementById('companyName').value = s.razon_social || '';
            document.getElementById('tradeName').value = s.nombre_comercial || '';
            document.getElementById('supplierCode').value = s.codigo || '';
            document.getElementById('category').value = s.categoria || 'productos';
            document.getElementById('address').value = s.direccion || '';
            document.getElementById('city').value = s.ciudad || '';
            document.getElementById('department').value = s.departamento || '';
            document.getElementById('phone').value = s.telefono || '';
            document.getElementById('mobile').value = s.celular || '';
            document.getElementById('email').value = s.email || '';
            document.getElementById('contactName').value = s.persona_contacto || '';
            document.getElementById('contactPosition').value = s.contacto_cargo || '';
            document.getElementById('contactPhone').value = s.contacto_telefono || '';
            document.getElementById('contactEmail').value = s.contacto_email || '';
            document.getElementById('paymentTerms').value = s.terminos_pago || 'contado';
            document.getElementById('creditLimit').value = s.limite_credito ?? '';
            document.getElementById('productsServices').value = s.productos_servicios || '';
            document.getElementById('notes').value = s.notas || '';
            document.getElementById('status').value = s.activo ? 'activo' : 'inactivo';

            const saveBtn = document.getElementById('saveBtn');
            saveBtn.innerHTML = '<i class="fas fa-save me-1"></i>Actualizar';
            saveBtn.setAttribute('data-editing', 'true');
            saveBtn.setAttribute('data-id', id);

            const focusEl = document.getElementById('companyName');
            if (focusEl) { focusEl.focus(); focusEl.select(); }
        } catch (err) {
            console.error('Error al cargar proveedor:', err);
            alert('No se pudo cargar el proveedor');
        }
    }

    async function confirmAndDeleteSupplier(id) {
        try {
            if (!confirm('¿Seguro que deseas eliminar este proveedor?')) return;
            const { error } = await window.db.deleteProveedor(id);
            if (error) throw error;
            showToast('Proveedor eliminado');
            const tbody = document.getElementById('suppliersBody');
            if (tbody && tbody.querySelectorAll('tr').length === 1 && currentPage > 1) currentPage--;
            await loadSuppliers();
        } catch (err) {
            console.error('Error al eliminar proveedor:', err);
            alert('No se pudo eliminar el proveedor');
        }
    }

    function renderSuppliersPagination() {
        const container = document.getElementById('suppliersPagination');
        if (!container) return;
        container.innerHTML = '';
        const totalPages = Math.max(1, Math.ceil(totalSuppliers / pageSize));
        const prev = document.createElement('button');
        prev.className = 'btn btn-sm btn-outline-light me-2';
        prev.type = 'button';
        prev.disabled = currentPage <= 1;
        prev.textContent = 'Anterior';
        prev.onclick = async (e) => { e.preventDefault(); if (currentPage > 1) { currentPage--; await loadSuppliers(); } };
        container.appendChild(prev);
        const info = document.createElement('span');
        info.className = 'text-white-50';
        info.textContent = `Página ${currentPage} de ${totalPages}`;
        container.appendChild(info);
        const next = document.createElement('button');
        next.className = 'btn btn-sm btn-outline-light ms-2';
        next.type = 'button';
        next.disabled = currentPage >= totalPages;
        next.textContent = 'Siguiente';
        next.onclick = async (e) => { e.preventDefault(); if (currentPage < totalPages) { currentPage++; await loadSuppliers(); } };
        container.appendChild(next);
    }
})();


