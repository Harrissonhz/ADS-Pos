// ===== CLIENTES - SISTEMA ADS-POS =====
(function () {
    function showToast(message, type = 'success') {
        const div = document.createElement('div');
        div.className = `alert alert-${type} position-fixed`;
        div.style.cssText = 'top:20px;right:20px;z-index:9999;min-width:280px;box-shadow:0 4px 12px rgba(0,0,0,0.3)';
        div.innerHTML = `<div class="d-flex align-items-center"><span>${message}</span><button type="button" class="btn-close ms-auto" onclick="this.parentElement.parentElement.remove()"></button></div>`;
        document.body.appendChild(div);
        setTimeout(() => div.remove(), 3500);
    }

    function getClienteFormData() {
        return {
            tipo_id: document.getElementById('idType').value,
            numero_id: document.getElementById('idNumber').value,
            nombre_completo: document.getElementById('fullName').value,
            primer_nombre: document.getElementById('firstName').value,
            segundo_nombre: document.getElementById('secondName').value,
            primer_apellido: document.getElementById('firstLastName').value,
            segundo_apellido: document.getElementById('secondLastName').value,
            direccion: document.getElementById('address').value,
            ciudad: document.getElementById('city').value,
            departamento: document.getElementById('department').value,
            telefono: document.getElementById('phone').value,
            celular: document.getElementById('mobile').value,
            email: document.getElementById('email').value,
            clientType: document.getElementById('clientType').value,
            category: document.getElementById('category').value,
            creditLimit: document.getElementById('creditLimit').value,
            creditDays: document.getElementById('creditDays').value,
            profession: document.getElementById('profession').value,
            company: document.getElementById('company').value,
            notas: document.getElementById('notes').value
        };
    }

    document.addEventListener('DOMContentLoaded', () => {
        // Offcanvas y sincronización de chevrons
        const offcanvasElement = document.getElementById('posSidebar');
        if (offcanvasElement) {
            const offcanvas = new bootstrap.Offcanvas(offcanvasElement);
            offcanvasElement.addEventListener('show.bs.offcanvas', function() { this.classList.add('show'); });
            offcanvasElement.addEventListener('hide.bs.offcanvas', function() { this.classList.remove('show'); });
        }

        const sections = ['infoPersonal','infoContacto','infoComercial','observaciones','acciones'];
        sections.forEach(id => {
            const el = document.getElementById(id);
            if (!el) return;
            const btn = document.querySelector(`[data-bs-target="#${id}"]`);
            const icon = btn ? btn.querySelector('i') : null;
            if (!icon) return;
            el.addEventListener('show.bs.collapse', () => { icon.classList.remove('fa-chevron-down'); icon.classList.add('fa-chevron-up'); });
            el.addEventListener('hide.bs.collapse', () => { icon.classList.remove('fa-chevron-up'); icon.classList.add('fa-chevron-down'); });
        });

        const form = document.getElementById('clientForm');
        const clearBtn = document.getElementById('clearBtn');
        const searchBtn = document.getElementById('searchBtn');
        const saveBtn = document.getElementById('saveBtn');
        const searchClient = document.getElementById('searchClient');
        const filterClientStatus = document.getElementById('filterClientStatus');
        const filterNumeroId = document.getElementById('filterNumeroId');

        // Cargar lista inicial de clientes
        loadClients();

        // Reemplazar lógicas inline
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
                // Enfocar el primer campo inválido requerido
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
                const payload = getClienteFormData();
                // Mapear algunos alias a columnas reales
                payload.genero = null;
                payload.fecha_nacimiento = null;
                payload.activo = (document.getElementById('clientStatus')?.value || 'activo') === 'activo';

                const isEditing = saveBtn.getAttribute('data-editing') === 'true';
                const editingId = saveBtn.getAttribute('data-id');

                const result = isEditing
                    ? await window.db.updateCliente(editingId, payload)
                    : await window.db.createCliente(payload);
                if (result.error) {
                    alert(result.error.message || (isEditing ? 'Error al actualizar el cliente' : 'Error al guardar el cliente'));
                    console.error('Error guardando cliente:', result.error);
                } else {
                    showToast(`Cliente "${result.data.nombre_completo}" ${isEditing ? 'actualizado' : 'creado'} correctamente`);
                    form.reset();
                    // Si veníamos de edición, restaurar botones
                    if (isEditing) {
                        saveBtn.innerHTML = '<i class="fas fa-save me-1"></i>Guardar';
                        saveBtn.removeAttribute('data-editing');
                        saveBtn.removeAttribute('data-id');
                    }
                    // Reiniciar paginación y recargar lista
                    currentPage = 1;
                    await loadClients();
                }
            } catch (e) {
                console.error('Error en guardado de cliente:', e);
                alert('Error inesperado al guardar');
            } finally {
                saveBtn.disabled = false;
                // Siempre volver a modo "Guardar"
                saveBtn.innerHTML = '<i class="fas fa-save me-1"></i>Guardar';
            }
        });
        // Filtros
        if (searchClient) searchClient.addEventListener('input', debounce(applyFilters, 300));
        if (filterClientStatus) filterClientStatus.addEventListener('change', applyFilters);
        if (filterNumeroId) filterNumeroId.addEventListener('input', debounce(applyFilters, 300));

        async function applyFilters() {
            currentPage = 1;
            await loadClients();
        }

        function debounce(fn, delay) {
            let t;
            return (...args) => {
                clearTimeout(t);
                t = setTimeout(() => fn.apply(this, args), delay);
            };
        }
    });

    // Estado de paginación clientes
    let currentPage = 1;
    const pageSize = 5;
    let totalClients = 0;

    async function loadClients() {
        try {
            const tbody = document.getElementById('clientsBody');
            if (tbody) {
                tbody.innerHTML = `
                    <tr>
                        <td colspan="7" class="text-center text-muted py-4">
                            <i class="fas fa-spinner fa-spin fa-2x mb-2"></i><br>
                            Cargando clientes...
                        </td>
                    </tr>
                `;
            }

            const search = (document.getElementById('searchClient')?.value || '').trim();
            const statusVal = (document.getElementById('filterClientStatus')?.value || '').trim();
            const onlyActive = statusVal === 'activo';
            const numeroId = (document.getElementById('filterNumeroId')?.value || '').trim();

            const offset = (currentPage - 1) * pageSize;
            const result = await window.db.getClientes({ search, numeroId, onlyActive, orderBy: 'nombre_completo', ascending: true, limit: pageSize, offset });
            if (result.error) throw result.error;
            totalClients = Number(result.count || 0);
            renderClients(result.data || [], statusVal);
            renderClientsPagination();
        } catch (err) {
            console.error('Error al cargar clientes:', err);
            renderClients([], '');
        }
    }

    function renderClients(clients, statusFilter) {
        const tbody = document.getElementById('clientsBody');
        if (!tbody) return;
        tbody.innerHTML = '';
        const rows = (clients || []).filter(c => {
            if (statusFilter === 'inactivo') return c.activo === false;
            return true;
        });
        if (rows.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" class="text-center text-muted py-4">
                        <i class="fas fa-inbox fa-2x mb-2"></i><br>
                        No hay clientes registrados
                    </td>
                </tr>
            `;
            return;
        }
        rows.forEach(c => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><i class="fas fa-user text-info"></i></td>
                <td>
                    <div>
                        <strong>${c.nombre_completo || ''}</strong><br>
                        <small class="text-white" style="opacity:0.85;">${(c.email || '')}</small>
                    </div>
                </td>
                <td>${c.tipo_id || ''} ${c.numero_id || ''}</td>
                <td>${c.telefono || ''} ${c.celular ? ' / ' + c.celular : ''}</td>
                <td>${c.ciudad || ''}</td>
                <td><span class="badge ${c.activo ? 'bg-success' : 'bg-secondary'}">${c.activo ? 'Activo' : 'Inactivo'}</span></td>
                <td>
                    <button type="button" class="btn btn-sm btn-outline-primary me-1" title="Editar" data-action="edit" data-id="${c.id}"><i class="fas fa-edit"></i></button>
                    <button type="button" class="btn btn-sm btn-outline-danger" title="Eliminar" data-action="delete" data-id="${c.id}"><i class="fas fa-trash"></i></button>
                </td>
            `;
            tbody.appendChild(tr);
        });

        // Eventos de acciones
        tbody.querySelectorAll('button[data-action="edit"]').forEach(btn => {
            btn.addEventListener('click', async () => {
                const id = btn.getAttribute('data-id');
                await startEditClient(id);
            });
        });
        tbody.querySelectorAll('button[data-action="delete"]').forEach(btn => {
            btn.addEventListener('click', async () => {
                const id = btn.getAttribute('data-id');
                await confirmAndDeleteClient(id);
            });
        });
    }

    async function startEditClient(id) {
        try {
            const { data, error } = await window.supabaseClient
                .from('clientes')
                .select('*')
                .eq('id', id)
                .single();
            if (error) throw error;
            const c = data;

            document.getElementById('idType').value = c.tipo_id || 'CC';
            document.getElementById('idNumber').value = c.numero_id || '';
            document.getElementById('fullName').value = c.nombre_completo || '';
            document.getElementById('firstName').value = c.primer_nombre || '';
            document.getElementById('secondName').value = c.segundo_nombre || '';
            document.getElementById('firstLastName').value = c.primer_apellido || '';
            document.getElementById('secondLastName').value = c.segundo_apellido || '';
            document.getElementById('address').value = c.direccion || '';
            document.getElementById('city').value = c.ciudad || '';
            document.getElementById('department').value = c.departamento || '';
            document.getElementById('phone').value = c.telefono || '';
            document.getElementById('mobile').value = c.celular || '';
            document.getElementById('email').value = c.email || '';
            document.getElementById('clientType').value = c.clientType || 'persona';
            document.getElementById('category').value = c.category || 'regular';
            document.getElementById('creditLimit').value = c.creditLimit ?? '';
            document.getElementById('creditDays').value = c.creditDays ?? '';
            document.getElementById('profession').value = c.profession || '';
            document.getElementById('company').value = c.company || '';
            const statusSel = document.getElementById('clientStatus');
            if (statusSel) statusSel.value = c.activo ? 'activo' : 'inactivo';
            document.getElementById('notes').value = c.notas || '';

            const saveBtn = document.getElementById('saveBtn');
            saveBtn.innerHTML = '<i class="fas fa-save me-1"></i>Actualizar';
            saveBtn.setAttribute('data-editing', 'true');
            saveBtn.setAttribute('data-id', id);

            const nameInput = document.getElementById('fullName');
            if (nameInput) { nameInput.focus(); nameInput.select(); }
        } catch (err) {
            console.error('Error al cargar cliente:', err);
            alert('No se pudo cargar el cliente');
        }
    }

    async function confirmAndDeleteClient(id) {
        try {
            if (!confirm('¿Seguro que deseas eliminar este cliente?')) return;
            const { error } = await window.db.deleteCliente(id);
            if (error) throw error;
            showToast('Cliente eliminado');
            const tbody = document.getElementById('clientsBody');
            if (tbody && tbody.querySelectorAll('tr').length === 1 && currentPage > 1) currentPage--;
            await loadClients();
        } catch (err) {
            console.error('Error al eliminar cliente:', err);
            alert('No se pudo eliminar el cliente');
        }
    }

    function renderClientsPagination() {
        const container = document.getElementById('clientsPagination');
        if (!container) return;
        container.innerHTML = '';
        const totalPages = Math.max(1, Math.ceil(totalClients / pageSize));

        const prev = document.createElement('button');
        prev.className = 'btn btn-sm btn-outline-light me-2';
        prev.type = 'button';
        prev.disabled = currentPage <= 1;
        prev.textContent = 'Anterior';
        prev.onclick = async (e) => { e.preventDefault(); if (currentPage > 1) { currentPage--; await loadClients(); } };
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
        next.onclick = async (e) => { e.preventDefault(); if (currentPage < totalPages) { currentPage++; await loadClients(); } };
        container.appendChild(next);
    }
})();


