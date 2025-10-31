// ===== CATEGORÍAS - SISTEMA ADS-POS =====
// Versión 5.3 - BÚSQUEDA CORREGIDA

// Variables globales
let categories = [];
let isConnected = false;
let currentPage = 1;
const pageSize = 5;
let totalCategories = 0;

// Función para mostrar mensajes (solo en consola)
function showMessage(message, type = 'info') {
    // Solo mostrar en consola, sin actualizar el DOM
    const iconMap = {
        'success': '✅',
        'error': '❌',
        'warning': '⚠️',
        'info': 'ℹ️'
    };
    
    const icon = iconMap[type] || 'ℹ️';
    console.log(`${icon} [${type.toUpperCase()}] ${message}`);
}

// Función para mostrar notificación temporal de éxito
function showSuccessNotification(message, duration = 3000) {
    // Crear elemento de notificación
    const notification = document.createElement('div');
    notification.className = 'alert alert-success position-fixed';
    notification.style.cssText = `
        top: 20px;
        right: 20px;
        z-index: 9999;
        min-width: 300px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        border: none;
        border-radius: 8px;
        animation: slideInRight 0.3s ease-out;
    `;
    notification.innerHTML = `
        <div class="d-flex align-items-center">
            <i class="fas fa-check-circle me-2"></i>
            <span>${message}</span>
            <button type="button" class="btn-close ms-auto" onclick="this.parentElement.parentElement.remove()"></button>
        </div>
    `;

    // Agregar estilos de animación
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideInRight {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        @keyframes slideOutRight {
            from { transform: translateX(0); opacity: 1; }
            to { transform: translateX(100%); opacity: 0; }
        }
    `;
    document.head.appendChild(style);

    // Agregar al DOM
    document.body.appendChild(notification);

    // Auto-remover después del tiempo especificado
    setTimeout(() => {
        if (notification.parentElement) {
            notification.style.animation = 'slideOutRight 0.3s ease-in';
            setTimeout(() => {
                if (notification.parentElement) {
                    notification.remove();
                }
            }, 300);
        }
    }, duration);
}

// Función para probar conexión
async function testConnection() {
    try {
        console.log('🔌 ===== INICIANDO PRUEBA DE CONEXIÓN =====');
        console.log('📅 Timestamp:', new Date().toISOString());
        showMessage('Probando conexión con Supabase...', 'info');
        
        console.log('🔍 Verificando cliente de Supabase...');
        if (!window.supabaseClient) {
            throw new Error('Cliente de Supabase no inicializado');
        }
        console.log('✅ Cliente de Supabase encontrado');

        console.log('🔍 Verificando servicio de base de datos...');
        if (!window.db) {
            throw new Error('Servicio de base de datos no disponible');
        }
        console.log('✅ Servicio de base de datos encontrado');

        // Probar conexión con la tabla categorias
        console.log('📡 ===== PROBANDO CONEXIÓN CON TABLA CATEGORIAS =====');
        console.log('📡 URL de Supabase:', window.supabaseClient.supabaseUrl);
        console.log('📡 Clave de Supabase:', window.supabaseClient.supabaseKey ? 'Presente' : 'Ausente');
        
        // Probar una consulta simple a la tabla categorias
        const { data, error } = await window.supabaseClient
            .from('categorias')
            .select('count')
            .limit(1);

        console.log('📡 Resultado de consulta:', { data, error });

        if (error) {
            console.error('❌ Error en consulta:', error);
            throw error;
        }

        console.log('✅ Conexión exitosa con Supabase');
        isConnected = true;
        showMessage('✅ Conexión exitosa con Supabase', 'success');
        return true;
    } catch (error) {
        console.error('❌ ===== ERROR DE CONEXIÓN =====');
        console.error('❌ Error:', error);
        isConnected = false;
        showMessage(`❌ Error de conexión: ${error.message}`, 'error');
        return false;
    }
}

// Función para cargar categorías
async function loadCategories() {
    try {
        if (!isConnected) {
            showMessage('No hay conexión con Supabase', 'error');
            renderCategories(); // Mostrar estado de error
            return;
        }

        console.log('📋 Cargando categorías desde Supabase...');
        
        // Mostrar estado de carga en la tabla
        const tbody = document.getElementById('categoriesBody');
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="text-center text-muted py-4">
                    <i class="fas fa-spinner fa-spin fa-2x mb-2"></i><br>
                    Cargando categorías desde la base de datos...
                </td>
            </tr>
        `;

        // Llamar a la función de base de datos
        const offset = (currentPage - 1) * pageSize;
        const code = (document.getElementById('filterCategoryCode')?.value || '').trim();
        const nameSearch = (document.getElementById('searchCategory')?.value || '').trim();
        const search = code || nameSearch;
        const result = await window.db.getCategorias({
            onlyActive: false,
            orderBy: 'nombre',
            ascending: true,
            limit: pageSize,
            offset,
            search
        });

        if (result.error) {
            throw new Error(result.error.message || 'Error al cargar categorías');
        }

        categories = result.data || [];
        totalCategories = result.count || 0;
        console.log(`✅ ${categories.length} categorías cargadas desde la base de datos`);
        console.log('📋 Datos de categorías cargadas:', categories);
        
        // Verificar campos específicos en cada categoría
        categories.forEach((cat, index) => {
            console.log(`🔍 Categoría ${index + 1}:`, {
                nombre: cat.nombre,
                codigo: cat.codigo,
                categoria_padre_id: cat.categoria_padre_id
            });
        });
        
        // Renderizar categorías
        renderCategories();
        renderCategoriesPagination();
        
        // Cargar categorías padre en el select
        loadParentCategories();
        
        // Actualizar mensaje de estado solo si hay categorías
        if (categories.length > 0) {
            showMessage(`✅ ${categories.length} categorías cargadas`, 'success');
        } else {
            showMessage('ℹ️ No hay categorías registradas', 'info');
        }

    } catch (error) {
        console.error('❌ Error al cargar categorías:', error);
        showMessage(`❌ Error al cargar categorías: ${error.message}`, 'error');
        categories = [];
        renderCategories();
    }
}

// Función para renderizar categorías en la tabla
function renderCategories() {
    const tbody = document.getElementById('categoriesBody');
    tbody.innerHTML = '';

    if (categories.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="text-center text-muted py-4">
                    <i class="fas fa-inbox fa-2x mb-2"></i><br>
                    No hay categorías registradas
                </td>
            </tr>
        `;
        return;
    }

    categories.forEach(category => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>
                <div class="d-flex align-items-center">
                    <div class="color-indicator me-2" style="background-color: ${category.color || '#007bff'}; width: 20px; height: 20px; border-radius: 50%;"></div>
                    <i class="fas fa-tag text-primary"></i>
                </div>
            </td>
            <td>
                <div class="fw-medium text-white">${escapeHtml(category.nombre)}</div>
                ${category.descripcion ? `<small class="text-light" style="opacity: 0.8;">${escapeHtml(category.descripcion)}</small>` : ''}
            </td>
            <td>
                <span class="badge bg-secondary">${category.codigo || 'Sin código'}</span>
            </td>
            <td>
                ${category.categoria_padre_id ? 
                    `<span class="text-info">${getParentCategoryName(category.categoria_padre_id)}</span>` : 
                    '<span class="text-muted">-</span>'
                }
            </td>
            <td><span class="badge ${category.activa ? 'bg-success' : 'bg-secondary'}">${category.activa ? 'Activa' : 'Inactiva'}</span></td>
            <td>0</td>
            <td>
                <div class="btn-group btn-group-sm" role="group">
                    <button type="button" class="btn btn-outline-primary" title="Editar" onclick="editCategory('${category.id}')">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button type="button" class="btn btn-outline-danger" title="Eliminar" onclick="deleteCategory('${category.id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        `;
        tbody.appendChild(row);
    });
}

function renderCategoriesPagination() {
    const container = document.getElementById('categoriesPagination');
    if (!container) return;
    container.innerHTML = '';
    const totalPages = Math.max(1, Math.ceil(totalCategories / pageSize));
    const prev = document.createElement('button');
    prev.className = 'btn btn-sm btn-outline-light me-2';
    prev.type = 'button';
    prev.disabled = currentPage <= 1;
    prev.textContent = 'Anterior';
    prev.onclick = async (e) => { e.preventDefault(); if (currentPage > 1) { currentPage--; await loadCategories(); } };
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
    next.onclick = async (e) => { e.preventDefault(); if (currentPage < totalPages) { currentPage++; await loadCategories(); } };
    container.appendChild(next);
}

// Función para escapar HTML y prevenir XSS
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Función para obtener el nombre de la categoría padre
function getParentCategoryName(parentId) {
    const parentCategory = categories.find(cat => cat.id === parentId);
    return parentCategory ? parentCategory.nombre : 'Categoría no encontrada';
}

// Función para cargar categorías padre en el select
function loadParentCategories() {
    const parentSelect = document.getElementById('parentCategory');
    
    // Limpiar opciones existentes (excepto la primera)
    parentSelect.innerHTML = '<option value="">Sin categoría padre</option>';
    
    // Agregar categorías existentes como opciones
    categories.forEach(category => {
        const option = document.createElement('option');
        option.value = category.id; // Usar UUID real
        option.textContent = category.nombre;
        parentSelect.appendChild(option);
    });
    
    console.log('✅ Categorías padre cargadas en el select');
}

// Función para limpiar búsqueda y mostrar todas las categorías
function clearSearch() {
    console.log('🧹 Limpiando búsqueda...');
    
    // Limpiar campos de búsqueda
    document.getElementById('searchCategory').value = '';
    document.getElementById('filterStatus').value = '';
    
    // Mostrar todas las categorías
    renderCategories();
    
    console.log('✅ Búsqueda limpiada, mostrando todas las categorías');
}

// Función para resetear el formulario y restaurar botones
function resetForm() {
    const form = document.getElementById('categoryForm');
    const saveBtn = document.getElementById('saveBtn');
    const clearBtn = document.getElementById('clearBtn');

    // Limpiar formulario
    form.reset();
    document.getElementById('categoryColor').value = '#007bff';
    
    // Restaurar botones a estado original
    saveBtn.innerHTML = '<i class="fas fa-save me-1"></i>Guardar';
    saveBtn.removeAttribute('data-editing');
    saveBtn.removeAttribute('data-category-id');
    
    clearBtn.innerHTML = '<i class="fas fa-eraser me-1"></i>Limpiar';
    clearBtn.removeAttribute('data-editing');
    
    console.log('✅ Formulario reseteado a estado original');
}

// Función para guardar/actualizar categoría
async function saveCategory() {
    try {
        const saveBtn = document.getElementById('saveBtn');
        const isEditing = saveBtn.getAttribute('data-editing') === 'true';
        const categoryId = saveBtn.getAttribute('data-category-id');
        
        if (isEditing) {
            console.log('✏️ ===== ACTUALIZANDO CATEGORÍA =====');
            console.log('📅 Timestamp:', new Date().toISOString());
            console.log('🆔 ID de categoría:', categoryId);
        } else {
            console.log('🚀 ===== CREANDO CATEGORÍA =====');
            console.log('📅 Timestamp:', new Date().toISOString());
        }
        
        const form = document.getElementById('categoryForm');
        
        if (!form.checkValidity()) {
            form.reportValidity();
            return;
        }

        if (!isConnected) {
            showMessage('No hay conexión con Supabase', 'error');
            return;
        }

        // Obtener datos del formulario
        const categoryData = {
            nombre: document.getElementById('categoryName').value.trim(),
            codigo: document.getElementById('categoryCode').value.trim() || null,
            categoria_padre_id: document.getElementById('parentCategory').value || null,
            descripcion: document.getElementById('categoryDescription').value.trim(),
            color: document.getElementById('categoryColor').value,
            activa: document.getElementById('categoryStatus').value === 'activa'
        };

        console.log('📝 Datos capturados:', categoryData);
        console.log('🔍 Código capturado:', categoryData.codigo);
        console.log('🔍 Categoría padre capturada:', categoryData.categoria_padre_id);

        // Validar datos requeridos
        if (!categoryData.nombre) {
            showMessage('El nombre de la categoría es obligatorio', 'error');
            return;
        }

        // Mostrar estado de carga
        const originalText = saveBtn.innerHTML;
        saveBtn.disabled = true;
        saveBtn.innerHTML = isEditing 
            ? '<i class="fas fa-spinner fa-spin me-1"></i>Actualizando...'
            : '<i class="fas fa-spinner fa-spin me-1"></i>Guardando...';

        try {
            let result;
            
            if (isEditing) {
                // Actualizar categoría existente
                console.log('📤 Actualizando categoría en Supabase...');
                result = await window.db.updateCategoria(categoryId, categoryData);
                
                if (result.error) {
                    throw new Error(result.error.message || 'Error al actualizar la categoría');
                }

                console.log('✅ Categoría actualizada exitosamente:', result.data);
                showMessage('✅ Categoría actualizada exitosamente', 'success');
                showSuccessNotification(`✅ Categoría "${categoryData.nombre}" actualizada correctamente`, 4000);
                
            } else {
                // Crear nueva categoría
                console.log('📤 Creando nueva categoría en Supabase...');
                result = await window.db.createCategoria(categoryData);
                
                if (result.error) {
                    throw new Error(result.error.message || 'Error al crear la categoría');
                }

                console.log('✅ Categoría creada exitosamente:', result.data);
                showMessage('✅ Categoría creada exitosamente', 'success');
                showSuccessNotification(`✅ Categoría "${categoryData.nombre}" guardada correctamente`, 4000);
            }
            
            // Limpiar formulario y restaurar botones
            resetForm();
            
            // Recargar lista de categorías
            await loadCategories();

        } catch (dbError) {
            console.error('❌ Error en base de datos:', dbError);
            showMessage(`❌ Error al ${isEditing ? 'actualizar' : 'guardar'}: ${dbError.message}`, 'error');
        } finally {
            // Restaurar botón siempre a "Guardar"
            saveBtn.disabled = false;
            saveBtn.innerHTML = '<i class="fas fa-save me-1"></i>Guardar';
        }
        
    } catch (error) {
        console.error('❌ Error general:', error);
        showMessage(`❌ Error al ${isEditing ? 'actualizar' : 'guardar'}: ${error.message}`, 'error');
    }
}

// Función para editar categoría
async function editCategory(id) {
    try {
        console.log('✏️ ===== EDITANDO CATEGORÍA =====');
        console.log('📅 Timestamp:', new Date().toISOString());
        console.log('🆔 ID de categoría:', id);

        if (!isConnected) {
            showMessage('No hay conexión con Supabase', 'error');
            return;
        }

        // Buscar la categoría para cargar sus datos
        const category = categories.find(cat => cat.id === id);
        if (!category) {
            showMessage('❌ Categoría no encontrada', 'error');
            return;
        }

        console.log('📋 Categoría encontrada:', category);

        // Cargar datos en el formulario
        document.getElementById('categoryName').value = category.nombre || '';
        document.getElementById('categoryCode').value = category.codigo || '';
        document.getElementById('parentCategory').value = category.categoria_padre_id || '';
        document.getElementById('categoryDescription').value = category.descripcion || '';
        document.getElementById('categoryColor').value = category.color || '#007bff';
        document.getElementById('categoryStatus').value = category.activa ? 'activa' : 'inactiva';

        // Cambiar el botón de Guardar a Actualizar
        const saveBtn = document.getElementById('saveBtn');
        saveBtn.innerHTML = '<i class="fas fa-save me-1"></i>Actualizar';
        saveBtn.setAttribute('data-editing', 'true');
        saveBtn.setAttribute('data-category-id', id);

        // Cambiar el botón de Limpiar a Cancelar
        const clearBtn = document.getElementById('clearBtn');
        clearBtn.innerHTML = '<i class="fas fa-times me-1"></i>Cancelar';
        clearBtn.setAttribute('data-editing', 'true');

        // Mostrar mensaje informativo
        showMessage(`✏️ Editando categoría: "${category.nombre}"`, 'info');
        
        // Scroll al formulario
        document.getElementById('categoryForm').scrollIntoView({ behavior: 'smooth' });

        console.log('✅ Formulario cargado para edición');

    } catch (error) {
        console.error('❌ Error al editar categoría:', error);
        showMessage(`❌ Error al cargar categoría: ${error.message}`, 'error');
    }
}

// Función para eliminar categoría
async function deleteCategory(id) {
    try {
        console.log('🗑️ ===== ELIMINANDO CATEGORÍA =====');
        console.log('📅 Timestamp:', new Date().toISOString());
        console.log('🆔 ID de categoría:', id);

        if (!isConnected) {
            showMessage('No hay conexión con Supabase', 'error');
            return;
        }

        // Buscar la categoría para mostrar información en la confirmación
        const category = categories.find(cat => cat.id === id);
        if (!category) {
            showMessage('❌ Categoría no encontrada', 'error');
            return;
        }

        console.log('📋 Categoría encontrada:', category);

        // Mostrar confirmación más detallada
        const confirmMessage = `¿Estás seguro de que quieres eliminar la categoría "${category.nombre}"?\n\nEsta acción no se puede deshacer.`;
        
        if (!confirm(confirmMessage)) {
            console.log('❌ Eliminación cancelada por el usuario');
            return;
        }

        console.log('✅ Confirmación recibida, procediendo con la eliminación...');

        // Mostrar estado de carga
        showMessage('Eliminando categoría...', 'info');

        // Llamar a la función de eliminación de la base de datos
        const result = await window.db.deleteCategoria(id);

        if (result.error) {
            throw new Error(result.error.message || 'Error al eliminar la categoría');
        }

        // Éxito
        console.log('✅ Categoría eliminada exitosamente');
        showMessage('✅ Categoría eliminada exitosamente', 'success');
        
        // Mostrar notificación de éxito temporal
        showSuccessNotification(`✅ Categoría "${category.nombre}" eliminada correctamente`, 4000);
        
        // Recargar lista de categorías
        await loadCategories();

    } catch (error) {
        console.error('❌ Error al eliminar categoría:', error);
        showMessage(`❌ Error al eliminar: ${error.message}`, 'error');
    }
}

// Función para buscar categorías
function searchCategories() {
    console.log('🔍 ===== EJECUTANDO BÚSQUEDA =====');
    console.log('📅 Timestamp:', new Date().toISOString());
    
    // Capturar valores con debugging adicional
    const searchInput = document.getElementById('searchCategory');
    const searchTerm = searchInput.value.toLowerCase();
    const status = document.getElementById('filterStatus').value;
    
    console.log('🔍 Campo de búsqueda encontrado:', !!searchInput);
    console.log('🔍 Valor crudo del campo:', searchInput.value);
    console.log('🔍 Término de búsqueda procesado:', searchTerm);
    console.log('🔍 Filtro de estado:', status);
    console.log('🔍 Total de categorías disponibles:', categories.length);
    
    const filteredCategories = categories.filter(category => {
        const matchesSearch = !searchTerm || 
            category.nombre.toLowerCase().includes(searchTerm) ||
            (category.codigo && category.codigo.toLowerCase().includes(searchTerm)) ||
            (category.descripcion && category.descripcion.toLowerCase().includes(searchTerm));
        
        const matchesStatus = !status || 
            (status === 'activa' && category.activa) ||
            (status === 'inactiva' && !category.activa);
        
        const matches = matchesSearch && matchesStatus;
        
        console.log(`🔍 Categoría "${category.nombre}":`, {
            matchesSearch,
            matchesStatus,
            matches,
            searchTerm,
            status
        });
        
        return matches;
    });
    
    console.log('🔍 Categorías filtradas encontradas:', filteredCategories.length);

    // Mostrar mensaje informativo
    if (searchTerm || status) {
        const searchMessage = `🔍 Búsqueda: "${searchTerm || 'sin texto'}" | Estado: "${status || 'todos'}" | Resultados: ${filteredCategories.length}`;
        console.log(searchMessage);
        showMessage(searchMessage, 'info');
    }

    // Renderizar categorías filtradas
    const tbody = document.getElementById('categoriesBody');
    tbody.innerHTML = '';

    if (filteredCategories.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="text-center text-muted py-4">
                    <i class="fas fa-search fa-2x mb-2"></i><br>
                    No se encontraron categorías que coincidan con los criterios de búsqueda
                </td>
            </tr>
        `;
        return;
    }

    filteredCategories.forEach(category => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>
                <div class="d-flex align-items-center">
                    <div class="color-indicator me-2" style="background-color: ${category.color || '#007bff'}; width: 20px; height: 20px; border-radius: 50%;"></div>
                    <i class="fas fa-tag text-primary"></i>
                </div>
            </td>
            <td>
                <div class="fw-medium text-white">${escapeHtml(category.nombre)}</div>
                ${category.descripcion ? `<small class="text-light" style="opacity: 0.8;">${escapeHtml(category.descripcion)}</small>` : ''}
            </td>
            <td>
                <span class="badge bg-secondary">${category.codigo || 'Sin código'}</span>
            </td>
            <td>
                ${category.categoria_padre_id ? 
                    `<span class="text-info">${getParentCategoryName(category.categoria_padre_id)}</span>` : 
                    '<span class="text-muted">-</span>'
                }
            </td>
            <td><span class="badge ${category.activa ? 'bg-success' : 'bg-secondary'}">${category.activa ? 'Activa' : 'Inactiva'}</span></td>
            <td>0</td>
            <td>
                <div class="btn-group btn-group-sm" role="group">
                    <button type="button" class="btn btn-outline-primary" title="Editar" onclick="editCategory('${category.id}')">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button type="button" class="btn btn-outline-danger" title="Eliminar" onclick="deleteCategory('${category.id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        `;
        tbody.appendChild(row);
    });
}

// Inicializar cuando se carga la página
document.addEventListener('DOMContentLoaded', async function() {
    console.log('🚀 Inicializando página de categorías - Versión 5.3 - BÚSQUEDA CORREGIDA');
    console.log('📅 Timestamp:', new Date().toISOString());
    
    // Guardia de autenticación: requerir sesión como en el resto de páginas
    try {
        const { data: { session } } = await window.supabaseClient.auth.getSession();
        if (!session) {
            console.warn('🔒 Sin sesión activa: redirigiendo a login');
            if (window.auth && typeof window.auth.redirectToLogin === 'function') {
                window.auth.redirectToLogin();
            } else {
                // Fallback en caso de que window.auth no esté disponible aún
                if (window.location.pathname.includes('/pages/')) {
                    window.location.href = 'login.html';
                } else {
                    window.location.href = 'pages/login.html';
                }
            }
            return; // Detener inicialización si no hay sesión
        }
    } catch (e) {
        console.error('❌ Error verificando sesión:', e);
        return;
    }
    
    // Prevenir el parpadeo del offcanvas
    const offcanvasElement = document.getElementById('posSidebar');
    if (offcanvasElement) {
        const offcanvas = new bootstrap.Offcanvas(offcanvasElement);
        
        // Manejar eventos del offcanvas
        offcanvasElement.addEventListener('show.bs.offcanvas', function() {
            this.classList.add('show');
        });
        
        offcanvasElement.addEventListener('hide.bs.offcanvas', function() {
            this.classList.remove('show');
        });
    }
    
    // Manejar el cambio de iconos de chevron en los collapses
    const collapsibleSections = ['datosCategoria', 'configuracionAdicional', 'listaCategories', 'acciones'];
    
    collapsibleSections.forEach(sectionId => {
        const collapseElement = document.getElementById(sectionId);
        if (collapseElement) {
            // Encontrar el botón asociado
            const button = document.querySelector(`[data-bs-target="#${sectionId}"]`);
            const icon = button ? button.querySelector('i') : null;
            
            if (icon) {
                // Escuchar eventos de collapse
                collapseElement.addEventListener('show.bs.collapse', function() {
                    icon.classList.remove('fa-chevron-down');
                    icon.classList.add('fa-chevron-up');
                });
                
                collapseElement.addEventListener('hide.bs.collapse', function() {
                    icon.classList.remove('fa-chevron-up');
                    icon.classList.add('fa-chevron-down');
                });
            }
        }
    });
    
    // Configurar event listeners
    document.getElementById('clearBtn').addEventListener('click', () => {
        const clearBtn = document.getElementById('clearBtn');
        const isEditing = clearBtn.getAttribute('data-editing') === 'true';
        
        if (isEditing) {
            // Cancelar edición
            console.log('❌ Cancelando edición de categoría');
            showMessage('❌ Edición cancelada', 'info');
            resetForm();
        } else {
            // Limpiar formulario normal
            resetForm();
        }
    });

    document.getElementById('searchBtn').addEventListener('click', (e) => {
        e.preventDefault(); // Prevenir comportamiento por defecto
        console.log('🔍 Botón Buscar clickeado');
        
        // Agregar un pequeño delay para evitar conflictos de timing
        setTimeout(() => {
            searchCategories();
        }, 100);
    });
    
    document.getElementById('clearSearchBtn').addEventListener('click', () => {
        console.log('🧹 Botón Limpiar Búsqueda clickeado');
        clearSearch();
    });
    
    document.getElementById('saveBtn').addEventListener('click', saveCategory);

    // Búsqueda en tiempo real
    document.getElementById('searchCategory').addEventListener('input', searchCategories);
    document.getElementById('filterStatus').addEventListener('change', async () => { currentPage = 1; await loadCategories(); });
    const filterCategoryCode = document.getElementById('filterCategoryCode');
    if (filterCategoryCode) filterCategoryCode.addEventListener('input', debounce(async () => { currentPage = 1; await loadCategories(); }, 300));

    function debounce(fn, delay) {
        let t; return (...args) => { clearTimeout(t); t = setTimeout(() => fn.apply(this, args), delay); };
    }

    // Probar conexión y cargar datos
    const connectionOk = await testConnection();
    if (connectionOk) {
        await loadCategories();
    }
});

