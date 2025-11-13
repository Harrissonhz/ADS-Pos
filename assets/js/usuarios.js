// ===== USUARIOS - LISTADO Y FILTROS =====
(function () {
    function debounce(fn, delay) {
        let t; return (...args) => { clearTimeout(t); t = setTimeout(() => fn.apply(this, args), delay); };
    }

    document.addEventListener('DOMContentLoaded', async () => {
        const tbody = document.getElementById('usersBody');
        const form = document.getElementById('userForm');
        const saveBtn = form ? form.querySelector('button[type="submit"]') : null;
        const fullName = document.getElementById('fullName');
        const username = document.getElementById('userName');
        const email = document.getElementById('userEmail');
        const phone = document.getElementById('phone');
        const documentId = document.getElementById('documentId');
        const birthDate = document.getElementById('birthDate');
        const address = document.getElementById('address');
        const userRole = document.getElementById('userRole');
        const userStatus = document.getElementById('userStatus');
        const password = document.getElementById('userPassword');
        const confirmPassword = document.getElementById('confirmUserPassword');
        const togglePasswordBtn = document.getElementById('togglePassword');
        const searchTerm = document.getElementById('searchTerm');
        const filterRole = document.getElementById('filterRole');
        const filterStatus = document.getElementById('filterStatus');
        const usersPagination = (function(){
            let el = document.getElementById('usersPagination');
            if (!el) {
                // crear debajo de la tabla si no existe
                const table = tbody?.closest('table');
                const wrapper = table?.parentElement;
                el = document.createElement('div');
                el.id = 'usersPagination';
                el.className = 'd-flex justify-content-center mt-3';
                wrapper?.parentElement?.appendChild(el);
            }
            return el;
        })();

        let currentPage = 1;
        const pageSize = 5;
        let totalUsers = 0;

        function renderRows(users) {
            if (!tbody) return;
            tbody.innerHTML = '';
            if (!users || users.length === 0) {
                const tr = document.createElement('tr');
                tr.innerHTML = '<td colspan="7" class="text-center text-muted py-4"><i class="fas fa-inbox fa-2x mb-2"></i><br>No hay usuarios</td>';
                tbody.appendChild(tr);
                return;
            }
            users.forEach(u => {
                const tr = document.createElement('tr');
                const estadoBadge = u.activo ? '<span class="badge bg-success">Activo</span>' : '<span class="badge bg-secondary">Inactivo</span>';
                const ultimo = u.ultimo_acceso ? new Date(u.ultimo_acceso).toLocaleString('es-CO') : '-';
                tr.innerHTML = `
                    <td>
                        <div class="d-flex align-items-center">
                            <div class="bg-primary rounded-circle d-flex align-items-center justify-content-center me-2" style="width: 32px; height: 32px;">
                                <i class="fas fa-user text-white"></i>
                            </div>
                            <strong>${u.usuario || '-'}</strong>
                        </div>
                    </td>
                    <td>${u.nombre_completo || '-'}</td>
                    <td>${u.email || '-'}</td>
                    <td><span class="badge ${u.rol === 'admin' ? 'bg-danger' : 'bg-info'}">${u.rol || '-'}</span></td>
                    <td>${estadoBadge}</td>
                    <td>${ultimo}</td>
                    <td style="width: 120px;">
                        <button type="button" class="btn btn-sm btn-outline-primary me-1" title="Editar" data-action="edit" data-id="${u.id}"><i class="fas fa-edit"></i></button>
                        <button type="button" class="btn btn-sm btn-outline-secondary" title="Estado" data-action="toggle" data-id="${u.id}"><i class="fas fa-user-cog"></i></button>
                    </td>`;
                tbody.appendChild(tr);
            });
        }

        function renderPagination() {
            if (!usersPagination) return;
            usersPagination.innerHTML = '';
            const totalPages = Math.max(1, Math.ceil(totalUsers / pageSize));
            const prev = document.createElement('button');
            prev.className = 'btn btn-sm btn-outline-light me-2';
            prev.type = 'button';
            prev.disabled = currentPage <= 1;
            prev.textContent = 'Anterior';
            prev.onclick = async () => { if (currentPage > 1) { currentPage--; await loadUsers(); } };
            const info = document.createElement('span');
            info.className = 'text-white-50';
            info.textContent = `Página ${currentPage} de ${totalPages}`;
            const next = document.createElement('button');
            next.className = 'btn btn-sm btn-outline-light ms-2';
            next.type = 'button';
            next.disabled = currentPage >= totalPages;
            next.textContent = 'Siguiente';
            next.onclick = async () => { if (currentPage < totalPages) { currentPage++; await loadUsers(); } };
            usersPagination.appendChild(prev);
            usersPagination.appendChild(info);
            usersPagination.appendChild(next);
        }

        async function loadUsers() {
            try {
                if (tbody) {
                    tbody.innerHTML = '<tr><td colspan="7" class="text-center text-muted py-4"><i class="fas fa-spinner fa-spin fa-2x mb-2"></i><br>Cargando usuarios...</td></tr>';
                }
                // Asegurar sesión
                try { await window.ensureAuthenticated?.(); } catch (_) {}
                const offset = (currentPage - 1) * pageSize;
                const search = (searchTerm?.value || '').trim();
                const role = filterRole?.value || '';
                const status = filterStatus?.value || '';
                const { data, error, count } = await window.db.getUsuarios({ search, role, status, limit: pageSize, offset, orderBy: 'nombre_completo', ascending: true });
                if (error) throw error;
                totalUsers = Number(count || 0);
                // Actualizar contadores resumen (excepto En Línea)
                try {
                    const totalEl = document.getElementById('totalUsersCount');
                    const adminsEl = document.getElementById('adminsCount');
                    const blockedEl = document.getElementById('blockedCount');
                    if (totalEl) totalEl.textContent = String(totalUsers);
                    // Conteo de admins y bloqueados con una consulta adicional pequeña
                    const { data: allPage, error: errAll } = await window.db.getUsuarios({ limit: 1, offset: 0 });
                    if (!errAll) {
                        // Hacer agregados rápidos con otra consulta con filtros
                        const { count: adminCount } = await window.db.getUsuarios({ role: 'admin', limit: 1, offset: 0 });
                        const { count: blockedCount } = await window.db.getUsuarios({ status: 'inactive', limit: 1, offset: 0 });
                        if (adminsEl && typeof adminCount === 'number') adminsEl.textContent = String(adminCount);
                        if (blockedEl && typeof blockedCount === 'number') blockedEl.textContent = String(blockedCount);
                    }
                } catch (_) {}
                renderRows(data || []);
                renderPagination();
            } catch (err) {
                console.error('❌ Error al cargar usuarios:', err);
                if (tbody) tbody.innerHTML = '<tr><td colspan="7" class="text-center text-danger py-4">No se pudieron cargar los usuarios</td></tr>';
            }
        }

        // Crear usuario: signUp (Auth) + insertar/actualizar en usuarios
        async function handleCreateUser(e) {
            e?.preventDefault?.();
            if (!form.checkValidity()) {
                form.reportValidity();
                return;
            }
            if (!password || !confirmPassword) {
                alert('Error: No se encontraron los campos de contraseña');
                return;
            }
            if (password.value !== confirmPassword.value) {
                alert('Las contraseñas no coinciden');
                return;
            }
            try {
                // UI loading state
                const original = saveBtn ? saveBtn.innerHTML : '';
                if (saveBtn) {
                    saveBtn.disabled = true;
                    saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-1"></i>Guardando...';
                }
                const isEditing = form.getAttribute('data-editing') === 'true';
                if (isEditing) {
                    const targetId = form.getAttribute('data-id');
                    if (!targetId) throw new Error('Falta ID para actualización');
                    // Validar username disponible al editar (si cambió)
                    const desiredUsername = (username.value || '').trim();
                    if (desiredUsername) {
                        const check = await window.db.isUsernameAvailableFor(desiredUsername, targetId);
                        if (check.error) { console.error('Error validando usuario único:', check.error); }
                        if (!check.available) {
                            alert('El nombre de usuario ya existe. Por favor elige otro.');
                            return;
                        }
                    }
                    const updates = {
                        nombre_completo: fullName.value.trim(),
                        usuario: desiredUsername,
                        email: (email.value || '').trim(),
                        telefono: phone.value.trim(),
                        documento: documentId.value.trim(),
                        fecha_nacimiento: birthDate.value || null,
                        direccion: address.value.trim(),
                        rol: userRole.value,
                        activo: userStatus.value === 'active'
                    };
                    const up = await window.db.updateUsuarioApp(targetId, updates);
                    if (up.error) {
                        console.error('updateUsuarioApp error:', up.error);
                        const msg = up.error?.message || '';
                        if (/duplicate|unique/i.test(msg)) {
                            alert('El nombre de usuario ya existe. Por favor elige otro.');
                        } else {
                            alert('No se pudo actualizar el usuario.');
                        }
                        return;
                    }
                    alert('Usuario actualizado correctamente');
                    form.removeAttribute('data-editing');
                    form.removeAttribute('data-id');
                    if (saveBtn) saveBtn.innerHTML = '<i class="fas fa-save me-1"></i>Guardar Usuario';
                    form.reset();
                    await loadUsers();
                } else {
                    // Validar username disponible
                    const desiredUsername = (username.value || '').trim();
                    if (desiredUsername) {
                        const check = await window.db.isUsernameAvailable(desiredUsername);
                        if (check.error) { console.error('Error validando usuario único:', check.error); }
                        if (!check.available) {
                            alert('El nombre de usuario ya existe. Por favor elige otro.');
                            return;
                        }
                    }
                    // 1) Crear cuenta en Auth
                    const signUpEmail = email.value.trim();
                    const signUpPassword = password.value;
                    const { data: reg, error: regErr } = await window.supabaseClient.auth.signUp({
                        email: signUpEmail,
                        password: signUpPassword,
                        options: { data: { name: fullName.value.trim(), role: userRole.value } }
                    });
                    if (regErr) { alert(regErr.message || 'Error creando cuenta'); return; }
                    const authUser = reg.user;
                    // 2) ensureAppUser con ese usuario
                    await window.db.ensureAppUser(authUser);
                    // 3) Actualizar datos adicionales en tabla usuarios
                    const updates = {
                        nombre_completo: fullName.value.trim(),
                        usuario: desiredUsername || (signUpEmail.split('@')[0] + '_' + authUser.id.substring(0,8)),
                        email: signUpEmail,
                        telefono: phone.value.trim(),
                        documento: documentId.value.trim(),
                        fecha_nacimiento: birthDate.value || null,
                        direccion: address.value.trim(),
                        rol: userRole.value,
                        activo: userStatus.value === 'active'
                    };
                    const up = await window.db.updateUsuarioApp(authUser.id, updates);
                    if (up.error) {
                        console.error('updateUsuarioApp error:', up.error);
                        const msg = up.error?.message || '';
                        if (/duplicate|unique/i.test(msg)) {
                            alert('El nombre de usuario ya existe. Por favor elige otro.');
                        } else {
                            alert('No se pudo actualizar el usuario de la aplicación.');
                        }
                        return;
                    }
                    alert('Usuario creado correctamente');
                    form.reset();
                    currentPage = 1;
                    await loadUsers();
                }
                if (saveBtn) {
                    saveBtn.disabled = false;
                    saveBtn.innerHTML = original;
                }
            } catch (err) {
                console.error('❌ Error creando usuario:', err);
                alert('No se pudo crear el usuario');
            } finally {
                if (saveBtn) {
                    // Restaurar si no se restauró arriba
                    saveBtn.disabled = false;
                    // Evitar dejar el spinner si ya se cambió antes
                    if (saveBtn.innerHTML.includes('fa-spinner')) {
                        saveBtn.innerHTML = '<i class="fas fa-save me-1"></i>Guardar Usuario';
                    }
                }
            }
        }

        if (form) form.addEventListener('submit', handleCreateUser);

        // Delegación para editar/activar-bloquear (sólo estado por ahora)
        if (tbody) tbody.addEventListener('click', async (e) => {
            const btn = e.target.closest('button');
            if (!btn) return;
            const id = btn.getAttribute('data-id');
            const action = btn.getAttribute('data-action');
            if (!id || !action) return;
            if (action === 'toggle') {
                try {
                    // Leer estado actual de fila (5a col Estado)
                    const row = btn.closest('tr');
                    const isActive = row?.querySelector('td:nth-child(5) .badge')?.classList.contains('bg-success');
                    const { error } = await window.db.setUsuarioActivo(id, !isActive);
                    if (error) throw error;
                    await loadUsers();
                } catch (err) {
                    console.error('❌ Error cambiando estado:', err);
                    alert('No se pudo cambiar el estado del usuario');
                }
            } else if (action === 'edit') {
                try {
                    const { data, error } = await window.db.getUsuarioById(id);
                    if (error || !data) throw error || new Error('Usuario no encontrado');
                    fullName.value = data.nombre_completo || '';
                    username.value = data.usuario || '';
                    email.value = data.email || '';
                    phone.value = data.telefono || '';
                    documentId.value = data.documento || '';
                    birthDate.value = data.fecha_nacimiento || '';
                    address.value = data.direccion || '';
                    userRole.value = data.rol || '';
                    userStatus.value = data.activo ? 'active' : 'inactive';
                    // Marcar modo edición en el botón y formulario
                    form.setAttribute('data-editing', 'true');
                    form.setAttribute('data-id', id);
                    if (saveBtn) {
                        saveBtn.innerHTML = '<i class="fas fa-save me-1"></i>Actualizar Usuario';
                    }
                    // Passwords no se rellenan por seguridad
                    password.value = '';
                    confirmPassword.value = '';
                    // Scroll al formulario
                    form.scrollIntoView({ behavior: 'smooth', block: 'start' });
                } catch (err) {
                    console.error('❌ Error cargando usuario:', err);
                    alert('No se pudo cargar el usuario para edición');
                }
            }
        });

        // Listeners filtros
        if (searchTerm) searchTerm.addEventListener('input', debounce(() => { currentPage = 1; loadUsers(); }, 300));
        if (filterRole) filterRole.addEventListener('change', () => { currentPage = 1; loadUsers(); });
        if (filterStatus) filterStatus.addEventListener('change', () => { currentPage = 1; loadUsers(); });

        // Carga inicial
        await loadUsers();

        // Toggle visibilidad de contraseñas
        if (togglePasswordBtn && password && confirmPassword) {
            togglePasswordBtn.addEventListener('click', () => {
                const toType = password.getAttribute('type') === 'password' ? 'text' : 'password';
                password.setAttribute('type', toType);
                confirmPassword.setAttribute('type', toType);
                const icon = togglePasswordBtn.querySelector('i');
                if (icon) {
                    icon.classList.toggle('fa-eye');
                    icon.classList.toggle('fa-eye-slash');
                }
            });
        }
    });
})();


