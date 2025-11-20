// ===== GASTOS - SISTEMA ADS-POS =====
(function () {
    let isEditing = false;
    let currentGastoId = null;
    let ventaSearchTimeout = null;
    let ventaSelectedIndex = -1;
    let isInteractingWithVentaSuggestions = false;

    // Función para formatear moneda
    function formatCOP(value) {
        return new Intl.NumberFormat('es-CO', {
            style: 'currency',
            currency: 'COP',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(value);
    }

    // Función para formatear fecha
    function formatFecha(fecha) {
        if (!fecha) return '—';
        const date = new Date(fecha);
        return date.toLocaleDateString('es-CO', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        });
    }

    // Nombres de meses
    const meses = [
        '', 'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];

    // ===== PAGINACIÓN =====
    let gastosData = [];
    let currentPageGastos = 1;
    const pageSizeGastos = 10;
    let totalGastosCount = 0;

    // ===== VARIABLES GLOBALES =====
    let comisionMercadoLibreId = null; // ID de la categoría "Comision MercadoLibre"

    // ===== INICIALIZACIÓN =====

    async function init() {
        try {
            // Cargar categorías
            await loadCategorias();
            
            // Inicializar años
            initAnios();
            
            // Establecer valores por defecto
            const anioActual = new Date().getFullYear();
            const mesActual = new Date().getMonth() + 1;
            document.getElementById('gastoAnio').value = anioActual;
            document.getElementById('gastoMes').value = mesActual;
            document.getElementById('filtroAnio').value = anioActual;
            document.getElementById('filtroMes').value = mesActual;

            // Cargar datos iniciales
            await loadGastos();
            await updateKPIs();
            await loadResumenCategoria();

            // Event listeners
            setupEventListeners();
        } catch (error) {
            console.error('Error inicializando módulo de gastos:', error);
            showAlert('Error al inicializar el módulo de gastos', 'danger');
        }
    }

    // Cargar categorías de gastos
    async function loadCategorias() {
        try {
            const { data, error } = await window.db.getGastoCategorias();
            
            if (error) {
                console.error('Error cargando categorías:', error);
                return;
            }

            const selectCategoria = document.getElementById('gastoCategoria');
            const selectFiltroCategoria = document.getElementById('filtroCategoria');

            // Limpiar opciones existentes (excepto la primera)
            selectCategoria.innerHTML = '<option value="">Seleccionar categoría</option>';
            selectFiltroCategoria.innerHTML = '<option value="">Todas las categorías</option>';

            // Agregar categorías
            comisionMercadoLibreId = null;
            (data || []).forEach(categoria => {
                const option = document.createElement('option');
                option.value = categoria.id;
                option.textContent = categoria.nombre;
                selectCategoria.appendChild(option);

                const optionFiltro = option.cloneNode(true);
                selectFiltroCategoria.appendChild(optionFiltro);

                // Buscar la categoría "Comision MercadoLibre" para establecerla por defecto
                if (categoria.nombre && categoria.nombre.toLowerCase().includes('comision') && 
                    categoria.nombre.toLowerCase().includes('mercadolibre')) {
                    comisionMercadoLibreId = categoria.id;
                }
            });

            // Establecer "Comision MercadoLibre" como valor por defecto si existe
            if (comisionMercadoLibreId && selectCategoria) {
                selectCategoria.value = comisionMercadoLibreId;
            }
        } catch (error) {
            console.error('Excepción cargando categorías:', error);
        }
    }

    // Inicializar años en los selects
    function initAnios() {
        const anioActual = new Date().getFullYear();
        const selectAnio = document.getElementById('gastoAnio');
        const selectFiltroAnio = document.getElementById('filtroAnio');

        // Limpiar opciones existentes
        selectAnio.innerHTML = '<option value="">Seleccionar año</option>';
        selectFiltroAnio.innerHTML = '<option value="">Todos los años</option>';

        // Agregar años (últimos 5 y próximos 2)
        for (let i = anioActual - 5; i <= anioActual + 2; i++) {
            const option = document.createElement('option');
            option.value = i;
            option.textContent = i;
            selectAnio.appendChild(option);

            const optionFiltro = option.cloneNode(true);
            selectFiltroAnio.appendChild(optionFiltro);
        }
    }

    // Configurar event listeners
    function setupEventListeners() {
        // console.log('🔧 Configurando event listeners...');
        
        // Formulario
        const gastosForm = document.getElementById('gastosForm');
        if (gastosForm) {
            gastosForm.addEventListener('submit', handleSubmit);
            // console.log('✅ Formulario encontrado y configurado');
        } else {
            console.error('❌ Formulario no encontrado');
        }

        // Botón limpiar
        const limpiarBtn = document.getElementById('limpiarFormBtn');
        if (limpiarBtn) {
            limpiarBtn.addEventListener('click', limpiarFormulario);
            // console.log('✅ Botón limpiar encontrado y configurado');
        } else {
            console.error('❌ Botón limpiar no encontrado');
        }

        // Búsqueda de ventas
        const ventaSearch = document.getElementById('ventaSearch');
        if (ventaSearch) {
            // console.log('✅ Campo ventaSearch encontrado');
            ventaSearch.addEventListener('input', handleVentaSearch);
            ventaSearch.addEventListener('keydown', handleVentaSearchKeydown);
            ventaSearch.addEventListener('blur', () => {
                if (!isInteractingWithVentaSuggestions) {
                    hideVentaSuggestions();
                }
            });
            // console.log('✅ Event listeners de ventaSearch configurados');
        } else {
            console.error('❌ Campo ventaSearch NO encontrado');
        }

        const searchVentaBtn = document.getElementById('searchVentaBtn');
        if (searchVentaBtn) {
            // console.log('✅ Botón searchVentaBtn encontrado');
            searchVentaBtn.addEventListener('click', () => {
                const query = ventaSearch ? ventaSearch.value.trim() : '';
                // console.log('🔍 Botón búsqueda clickeado - Query:', query);
                if (query) {
                    searchVentas(query);
                } else {
                    showAlert('Por favor ingresa al menos 2 caracteres para buscar', 'warning');
                }
            });
            // console.log('✅ Event listener de searchVentaBtn configurado');
        } else {
            console.error('❌ Botón searchVentaBtn NO encontrado');
        }

        const clearVentaBtn = document.getElementById('clearVentaBtn');
        if (clearVentaBtn) {
            clearVentaBtn.addEventListener('click', clearVentaAsociada);
        }

        // Filtros
        const filtroAnio = document.getElementById('filtroAnio');
        const filtroMes = document.getElementById('filtroMes');
        const filtroCategoria = document.getElementById('filtroCategoria');

        if (filtroAnio) {
            filtroAnio.addEventListener('change', applyFilters);
        }
        if (filtroMes) {
            filtroMes.addEventListener('change', applyFilters);
        }
        if (filtroCategoria) {
            filtroCategoria.addEventListener('change', applyFilters);
        }

        // Cerrar sugerencias al hacer clic fuera
        document.addEventListener('click', (e) => {
            if (!e.target.closest('#ventaSearch') && !e.target.closest('#ventaSuggestions')) {
                hideVentaSuggestions();
            }
        });

        // Reposicionar sugerencias al hacer scroll
        let scrollTimeout = null;
        window.addEventListener('scroll', () => {
            const container = document.getElementById('ventaSuggestions');
            if (container && container.style.display === 'block') {
                // Debounce para evitar demasiadas actualizaciones
                if (scrollTimeout) {
                    clearTimeout(scrollTimeout);
                }
                scrollTimeout = setTimeout(() => {
                    positionVentaSuggestions();
                }, 10);
            }
        }, { passive: true });

        // Reposicionar sugerencias al redimensionar la ventana
        window.addEventListener('resize', () => {
            const container = document.getElementById('ventaSuggestions');
            if (container && container.style.display === 'block') {
                positionVentaSuggestions();
            }
        }, { passive: true });
    }

    // ===== BÚSQUEDA DE VENTAS =====

    function handleVentaSearch(e) {
        const query = e.target.value.trim();
        // console.log('🔍 handleVentaSearch - Query:', query);
        
        if (ventaSearchTimeout) {
            clearTimeout(ventaSearchTimeout);
        }

        if (query.length < 2) {
            hideVentaSuggestions();
            return;
        }

        ventaSearchTimeout = setTimeout(() => {
            // console.log('🔍 Ejecutando búsqueda de ventas con query:', query);
            searchVentas(query);
        }, 300);
    }

    function handleVentaSearchKeydown(e) {
        const container = document.getElementById('ventaSuggestions');
        if (!container || container.style.display === 'none') return;

        const items = container.querySelectorAll('.venta-suggestion-item');
        if (items.length === 0) return;

        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                ventaSelectedIndex = (ventaSelectedIndex < items.length - 1) ? ventaSelectedIndex + 1 : 0;
                highlightVentaItem(items, ventaSelectedIndex);
                break;
            case 'ArrowUp':
                e.preventDefault();
                ventaSelectedIndex = (ventaSelectedIndex > 0) ? ventaSelectedIndex - 1 : items.length - 1;
                highlightVentaItem(items, ventaSelectedIndex);
                break;
            case 'Enter':
                e.preventDefault();
                if (ventaSelectedIndex >= 0 && ventaSelectedIndex < items.length) {
                    selectVenta(items[ventaSelectedIndex]);
                }
                break;
            case 'Escape':
                e.preventDefault();
                hideVentaSuggestions();
                break;
        }
    }

    function highlightVentaItem(items, index) {
        items.forEach((item, i) => {
            if (i === index) {
                item.style.backgroundColor = '#0d6efd';
                item.style.color = 'white';
            } else {
                item.style.backgroundColor = '';
                item.style.color = '';
            }
        });
    }

    async function searchVentas(query) {
        try {
            // console.log('🔍 searchVentas - Iniciando búsqueda con query:', query);
            
            if (!query || query.trim() === '') {
                // console.log('🔍 Query vacío, cancelando búsqueda');
                return;
            }

            if (!window.db) {
                console.error('❌ window.db no está disponible');
                showAlert('Error: Servicio de base de datos no disponible', 'danger');
                return;
            }

            // console.log('🔍 Llamando a window.db.searchVentas...');
            const { data, error } = await window.db.searchVentas(query, 10);

            if (error) {
                console.error('❌ Error buscando ventas:', error);
                showAlert('Error al buscar ventas: ' + (error.message || 'Error desconocido'), 'danger');
                return;
            }

            // console.log('✅ Ventas encontradas:', data?.length || 0);
            showVentaSuggestions(data || []);
        } catch (error) {
            console.error('❌ Excepción buscando ventas:', error);
            showAlert('Error inesperado al buscar ventas', 'danger');
        }
    }

    function showVentaSuggestions(ventas) {
        // console.log('📋 showVentaSuggestions - Ventas recibidas:', ventas?.length || 0);
        
        const container = document.getElementById('ventaSuggestions');
        if (!container) {
            console.error('❌ Contenedor ventaSuggestions NO encontrado');
            return;
        }

        // console.log('✅ Contenedor encontrado:', container);

        if (!ventas || ventas.length === 0) {
            // console.log('⚠️ No hay ventas para mostrar');
            container.innerHTML = '<div class="p-2 text-muted text-center">No se encontraron ventas</div>';
            container.style.display = 'block';
            positionVentaSuggestions();
            return;
        }

        const inputElement = document.getElementById('ventaSearch');
        if (!inputElement) {
            console.error('❌ Input ventaSearch no encontrado');
            return;
        }

        const inputRect = inputElement.getBoundingClientRect();
        // console.log('📍 Posición del input:', inputRect);
        // console.log('📍 window.scrollY:', window.scrollY, 'window.scrollX:', window.scrollX);

        // Configurar estilos del contenedor
        // getBoundingClientRect() devuelve coordenadas relativas al viewport
        // Para position: fixed, NO debemos sumar window.scrollY/scrollX
        container.style.position = 'fixed';
        container.style.left = `${inputRect.left}px`;
        container.style.width = `${inputRect.width}px`;
        
        // Calcular posición vertical considerando el espacio disponible
        const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
        const containerHeight = 300; // max-height del contenedor
        const spaceBelow = viewportHeight - inputRect.bottom;
        
        // Si no hay suficiente espacio abajo, mostrar arriba del input
        if (spaceBelow < containerHeight && inputRect.top > containerHeight) {
            container.style.top = `${inputRect.top - containerHeight - 5}px`;
        } else {
            container.style.top = `${inputRect.bottom + 5}px`;
        }
        container.style.backgroundColor = 'white';
        container.style.border = '1px solid #dee2e6';
        container.style.borderRadius = '0.375rem';
        container.style.boxShadow = '0 0.5rem 1rem rgba(0, 0, 0, 0.15)';
        container.style.maxHeight = '300px';
        container.style.overflowY = 'auto';
        container.style.zIndex = '99999';
        container.style.display = 'block';
        container.style.visibility = 'visible';
        container.style.opacity = '1';
        container.style.pointerEvents = 'auto';

        // console.log('📍 Estilos aplicados - Top:', container.style.top, 'Left:', container.style.left, 'Width:', container.style.width);

        // Generar HTML
        const html = ventas.map((venta, index) => {
            const fecha = formatFecha(venta.fecha_venta);
            const cliente = venta.clientes?.nombre_completo || 'Cliente general';
            const total = formatCOP(venta.total);
            
            return `
                <div class="venta-suggestion-item p-2 border-bottom" 
                     data-venta-id="${venta.id}" 
                     data-venta-numero="${venta.numero_venta}"
                     style="cursor: pointer; color: #000;">
                    <div class="fw-bold" style="color: #000;">${venta.numero_venta || 'Sin número'}</div>
                    <small style="color: #6c757d;">${fecha} - ${cliente} - ${total}</small>
                </div>
            `;
        }).join('');

        container.innerHTML = html;
        // console.log('✅ HTML generado y asignado. Items creados:', container.querySelectorAll('.venta-suggestion-item').length);
        // console.log('📄 Contenido HTML del contenedor:', container.innerHTML.substring(0, 200));
        // console.log('📏 Dimensiones del contenedor:', {
        //     offsetHeight: container.offsetHeight,
        //     offsetWidth: container.offsetWidth,
        //     scrollHeight: container.scrollHeight,
        //     clientHeight: container.clientHeight
        // });

        // Event listeners para items
        container.querySelectorAll('.venta-suggestion-item').forEach(item => {
            item.addEventListener('mouseenter', function() {
                ventaSelectedIndex = Array.from(container.querySelectorAll('.venta-suggestion-item')).indexOf(this);
                highlightVentaItem(container.querySelectorAll('.venta-suggestion-item'), ventaSelectedIndex);
            });
            item.addEventListener('mousedown', function(e) {
                e.preventDefault();
                selectVenta(this);
            });
        });

        container.addEventListener('mouseenter', () => {
            isInteractingWithVentaSuggestions = true;
        });
        container.addEventListener('mouseleave', () => {
            isInteractingWithVentaSuggestions = false;
        });

        // console.log('✅ Contenedor visible:', container.style.display);
        // console.log('✅ Contenedor en DOM:', container.parentElement);
        // console.log('🔍 Verificación final - getBoundingClientRect:', container.getBoundingClientRect());
        
        // Forzar reflow para asegurar que el navegador renderice
        container.offsetHeight;
        
        ventaSelectedIndex = -1;
        
        // Verificar si realmente es visible (comentado para producción)
        // setTimeout(() => {
        //     const rect = container.getBoundingClientRect();
        //     const isVisible = rect.width > 0 && rect.height > 0 && 
        //                      rect.top >= 0 && rect.left >= 0 &&
        //                      rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
        //                      rect.right <= (window.innerWidth || document.documentElement.clientWidth);
        //     console.log('👁️ Contenedor visible en viewport:', isVisible, 'Rect:', rect);
        //     if (!isVisible) {
        //         console.warn('⚠️ El contenedor está fuera del viewport o tiene dimensiones 0');
        //     }
        // }, 100);
    }

    function positionVentaSuggestions() {
        const container = document.getElementById('ventaSuggestions');
        const inputElement = document.getElementById('ventaSearch');
        if (!container || !inputElement) return;

        const inputRect = inputElement.getBoundingClientRect();
        
        // Para position: fixed, usar coordenadas del viewport directamente
        // getBoundingClientRect() devuelve coordenadas relativas al viewport
        container.style.position = 'fixed';
        container.style.top = `${inputRect.bottom + 5}px`;
        container.style.left = `${inputRect.left}px`;
        container.style.width = `${inputRect.width}px`;
        
        // Asegurar que el contenedor esté visible en el viewport
        const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
        const containerHeight = 300; // max-height del contenedor
        const spaceBelow = viewportHeight - inputRect.bottom;
        
        // Si no hay suficiente espacio abajo, mostrar arriba del input
        if (spaceBelow < containerHeight && inputRect.top > containerHeight) {
            container.style.top = `${inputRect.top - containerHeight - 5}px`;
        } else {
            container.style.top = `${inputRect.bottom + 5}px`;
        }
    }

    function hideVentaSuggestions() {
        const container = document.getElementById('ventaSuggestions');
        if (container) {
            container.style.display = 'none';
        }
        ventaSelectedIndex = -1;
    }

    function selectVenta(item) {
        const ventaId = item.getAttribute('data-venta-id');
        const ventaNumero = item.getAttribute('data-venta-numero');

        document.getElementById('selectedVentaId').value = ventaId;
        document.getElementById('ventaSearch').value = ventaNumero;
        document.getElementById('clearVentaBtn').style.display = 'block';

        hideVentaSuggestions();
    }

    function clearVentaAsociada() {
        document.getElementById('selectedVentaId').value = '';
        document.getElementById('ventaSearch').value = '';
        document.getElementById('clearVentaBtn').style.display = 'none';
    }

    // ===== FORMULARIO =====

    async function handleSubmit(e) {
        e.preventDefault();

        const guardarBtn = document.getElementById('guardarGastoBtn');
        const originalText = guardarBtn.innerHTML;
        
        try {
            guardarBtn.disabled = true;
            guardarBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Guardando...';

            const gastoData = {
                anio: document.getElementById('gastoAnio').value,
                mes: document.getElementById('gastoMes').value,
                categoria_id: document.getElementById('gastoCategoria').value,
                monto: document.getElementById('gastoMonto').value,
                venta_id: document.getElementById('selectedVentaId').value || null,
                notas: document.getElementById('gastoNotas').value
            };

            // Validaciones
            if (!gastoData.anio || !gastoData.mes || !gastoData.categoria_id) {
                showAlert('Por favor completa todos los campos obligatorios', 'warning');
                guardarBtn.disabled = false;
                guardarBtn.innerHTML = originalText;
                return;
            }

            if (!gastoData.monto || Number(gastoData.monto) <= 0) {
                showAlert('El monto debe ser mayor a cero', 'warning');
                guardarBtn.disabled = false;
                guardarBtn.innerHTML = originalText;
                return;
            }

            let result;
            if (isEditing && currentGastoId) {
                // Actualizar
                result = await window.db.updateGasto(currentGastoId, gastoData);
            } else {
                // Crear
                result = await window.db.createGasto(gastoData);
            }

            if (result.error) {
                showAlert(result.error.message || 'Error al guardar el gasto', 'danger');
                guardarBtn.disabled = false;
                guardarBtn.innerHTML = originalText;
                return;
            }

            const wasEditing = isEditing;
            
            showAlert(
                wasEditing ? 'Gasto actualizado exitosamente' : 'Gasto registrado exitosamente',
                'success'
            );

            // Limpiar formulario y recargar datos
            limpiarFormulario();
            
            // Si es un nuevo gasto, ir a la primera página para verlo
            if (!wasEditing) {
                currentPageGastos = 1;
            }
            
            await loadGastos();
            await updateKPIs();
            await loadResumenCategoria();

        } catch (error) {
            console.error('Error guardando gasto:', error);
            showAlert('Error al guardar el gasto', 'danger');
        } finally {
            guardarBtn.disabled = false;
            guardarBtn.innerHTML = originalText;
        }
    }

    function limpiarFormulario() {
        isEditing = false;
        currentGastoId = null;

        const anioActual = new Date().getFullYear();
        const mesActual = new Date().getMonth() + 1;

        document.getElementById('gastoAnio').value = anioActual;
        document.getElementById('gastoMes').value = mesActual;
        
        // Establecer "Comision MercadoLibre" como valor por defecto si existe
        const selectCategoria = document.getElementById('gastoCategoria');
        if (comisionMercadoLibreId && selectCategoria) {
            selectCategoria.value = comisionMercadoLibreId;
        } else {
            selectCategoria.value = '';
        }
        
        document.getElementById('gastoMonto').value = '';
        document.getElementById('gastoNotas').value = '';
        clearVentaAsociada();

        const guardarBtn = document.getElementById('guardarGastoBtn');
        guardarBtn.innerHTML = '<i class="fas fa-save me-2"></i>Guardar Gasto';
    }

    // ===== CARGAR Y MOSTRAR GASTOS =====

    async function loadGastos() {
        try {
            if (!window.supabaseClient) {
                showGastosError();
                return;
            }

            // Mostrar indicador de carga
            const tableBody = document.getElementById('gastosTableBody');
            const mobileBody = document.getElementById('gastosMobileBody');
            if (tableBody && tableBody.querySelector('tr td[colspan]') === null) {
                tableBody.innerHTML = `
                    <tr>
                        <td colspan="6" class="text-center text-white-50 py-4">
                            <i class="fas fa-spinner fa-spin fa-2x mb-2"></i><br>
                            Cargando gastos...
                        </td>
                    </tr>
                `;
            }
            if (mobileBody && !mobileBody.querySelector('.fa-spinner')) {
                mobileBody.innerHTML = `
                    <div class="text-center text-white-50 py-5">
                        <i class="fas fa-spinner fa-spin fa-3x mb-3"></i>
                        <p class="mb-0">Cargando gastos...</p>
                    </div>
                `;
            }

            const filters = {
                anio: document.getElementById('filtroAnio').value || null,
                mes: document.getElementById('filtroMes').value || null,
                categoria_id: document.getElementById('filtroCategoria').value || null
            };

            const offset = (currentPageGastos - 1) * pageSizeGastos;

            // Construir query con paginación
            let query = window.supabaseClient
                .from('gastos_mensuales_detalle')
                .select(`
                    *,
                    categoria:gasto_categorias (
                        id,
                        nombre,
                        descripcion
                    ),
                    ventas:venta_id (
                        id,
                        numero_venta,
                        fecha_venta,
                        total
                    )
                `, { count: 'exact' })
                .is('deleted_at', null);

            // Aplicar filtros
            if (filters.anio) {
                query = query.eq('anio', parseInt(filters.anio));
            }

            if (filters.mes) {
                query = query.eq('mes', parseInt(filters.mes));
            }

            if (filters.categoria_id) {
                query = query.eq('categoria_id', filters.categoria_id);
            }

            // Ordenar por fecha de creación descendente y aplicar paginación
            query = query
                .order('created_at', { ascending: false })
                .range(offset, offset + pageSizeGastos - 1);

            const { data: gastos, error, count } = await query;

            if (error) {
                console.error('Error cargando gastos:', error);
                showGastosError();
                return;
            }

            totalGastosCount = count || 0;
            gastosData = gastos || [];

            renderGastos(gastosData);
            renderPaginationGastos();
        } catch (error) {
            console.error('Excepción cargando gastos:', error);
            showGastosError();
        }
    }

    function renderGastos(gastos) {
        // Vista desktop
        const tableBody = document.getElementById('gastosTableBody');
        if (tableBody) {
            if (gastos.length === 0) {
                tableBody.innerHTML = `
                    <tr>
                        <td colspan="6" class="text-center text-white-50">
                            No hay gastos registrados
                        </td>
                    </tr>
                `;
            } else {
                tableBody.innerHTML = gastos.map(gasto => {
                    const fecha = formatFecha(gasto.created_at);
                    const categoria = gasto.categoria?.nombre || 'Sin categoría';
                    const monto = formatCOP(gasto.monto);
                    const venta = gasto.ventas ? gasto.ventas.numero_venta : '—';
                    const notas = gasto.notas || '—';
                    
                    // Truncar notas si son muy largas (máximo 40 caracteres para el ancho reducido)
                    const notasTruncadas = notas.length > 40 ? notas.substring(0, 40) + '...' : notas;

                    return `
                        <tr>
                            <td>${fecha}</td>
                            <td>${categoria}</td>
                            <td class="fw-bold text-success">${monto}</td>
                            <td class="text-nowrap">${venta}</td>
                            <td><small class="text-white-50" title="${notas}">${notasTruncadas}</small></td>
                            <td>
                                <button type="button" class="btn btn-sm btn-outline-info me-1" title="Ver detalles" onclick="window.gastosModule.verDetalleGasto('${gasto.id}')">
                                    <i class="fas fa-eye"></i>
                                </button>
                                <button class="btn btn-sm btn-primary me-1" onclick="window.gastosModule.editGasto('${gasto.id}')" title="Editar">
                                    <i class="fas fa-edit"></i>
                                </button>
                                <button class="btn btn-sm btn-danger" onclick="window.gastosModule.deleteGasto('${gasto.id}')" title="Eliminar">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </td>
                        </tr>
                    `;
                }).join('');
            }
        }

        // Vista móvil
        const mobileBody = document.getElementById('gastosMobileBody');
        if (mobileBody) {
            if (gastos.length === 0) {
                mobileBody.innerHTML = `
                    <div class="text-center text-white-50 p-3">
                        No hay gastos registrados
                    </div>
                `;
            } else {
                mobileBody.innerHTML = gastos.map(gasto => {
                    const fecha = formatFecha(gasto.created_at);
                    const categoria = gasto.categoria?.nombre || 'Sin categoría';
                    const monto = formatCOP(gasto.monto);
                    const venta = gasto.ventas ? gasto.ventas.numero_venta : '—';
                    const notas = gasto.notas || '—';

                    return `
                        <div class="card mb-3 bg-transparent border-secondary">
                            <div class="card-body">
                                <div class="d-flex justify-content-between align-items-start mb-2">
                                    <div>
                                        <h6 class="mb-1 text-white">${categoria}</h6>
                                        <small class="text-white-50">${fecha}</small>
                                    </div>
                                    <div class="text-end">
                                        <div class="fw-bold text-success">${monto}</div>
                                        <small class="text-white-50">Venta: ${venta}</small>
                                    </div>
                                </div>
                                ${notas !== '—' ? `<p class="text-white-50 small mb-2">${notas}</p>` : ''}
                                <div class="d-flex gap-2">
                                    <button type="button" class="btn btn-sm btn-outline-info flex-fill" onclick="window.gastosModule.verDetalleGasto('${gasto.id}')">
                                        <i class="fas fa-eye me-1"></i>Ver Detalle
                                    </button>
                                    <button class="btn btn-sm btn-primary flex-fill" onclick="window.gastosModule.editGasto('${gasto.id}')">
                                        <i class="fas fa-edit me-1"></i>Editar
                                    </button>
                                    <button class="btn btn-sm btn-danger flex-fill" onclick="window.gastosModule.deleteGasto('${gasto.id}')">
                                        <i class="fas fa-trash me-1"></i>Eliminar
                                    </button>
                                </div>
                            </div>
                        </div>
                    `;
                }).join('');
            }
        }
    }

    function showGastosError() {
        const tableBody = document.getElementById('gastosTableBody');
        const mobileBody = document.getElementById('gastosMobileBody');

        if (tableBody) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="6" class="text-center text-danger">
                        Error al cargar los gastos
                    </td>
                </tr>
            `;
        }

        if (mobileBody) {
            mobileBody.innerHTML = `
                <div class="text-center text-danger p-3">
                    Error al cargar los gastos
                </div>
            `;
        }
    }

    // ===== EDITAR GASTO =====

    async function editGasto(gastoId) {
        try {
            const filters = {};
            const { data: gastos, error } = await window.db.getGastos(filters);

            if (error) {
                showAlert('Error al cargar el gasto', 'danger');
                return;
            }

            const gasto = gastos.find(g => g.id === gastoId);
            if (!gasto) {
                showAlert('Gasto no encontrado', 'warning');
                return;
            }

            isEditing = true;
            currentGastoId = gastoId;

            // Llenar formulario
            document.getElementById('gastoAnio').value = gasto.anio;
            document.getElementById('gastoMes').value = gasto.mes;
            document.getElementById('gastoCategoria').value = gasto.categoria_id;
            document.getElementById('gastoMonto').value = gasto.monto;
            document.getElementById('gastoNotas').value = gasto.notas || '';

            if (gasto.venta_id) {
                document.getElementById('selectedVentaId').value = gasto.venta_id;
                document.getElementById('ventaSearch').value = gasto.ventas?.numero_venta || '';
                document.getElementById('clearVentaBtn').style.display = 'block';
            } else {
                clearVentaAsociada();
            }

            // Cambiar texto del botón
            const guardarBtn = document.getElementById('guardarGastoBtn');
            guardarBtn.innerHTML = '<i class="fas fa-save me-2"></i>Actualizar Gasto';

            // Scroll al formulario
            document.getElementById('registrarGasto').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        } catch (error) {
            console.error('Error editando gasto:', error);
            showAlert('Error al cargar el gasto', 'danger');
        }
    }

    // ===== ELIMINAR GASTO =====

    async function deleteGasto(gastoId) {
        if (!confirm('¿Estás seguro de que deseas eliminar este gasto?')) {
            return;
        }

        try {
            const { error } = await window.db.deleteGasto(gastoId);

            if (error) {
                showAlert(error.message || 'Error al eliminar el gasto', 'danger');
                return;
            }

            showAlert('Gasto eliminado exitosamente', 'success');

            // Si eliminamos el último elemento de la página y no es la primera página, retroceder
            if (gastosData.length === 1 && currentPageGastos > 1) {
                currentPageGastos--;
            }

            // Recargar datos
            await loadGastos();
            await updateKPIs();
            await loadResumenCategoria();
        } catch (error) {
            console.error('Error eliminando gasto:', error);
            showAlert('Error al eliminar el gasto', 'danger');
        }
    }

    // ===== FILTROS =====

    async function applyFilters() {
        // Resetear a la primera página cuando se cambian los filtros
        currentPageGastos = 1;
        await loadGastos();
        await updateKPIs();
        await loadResumenCategoria();
    }

    // ===== PAGINACIÓN =====

    function renderPaginationGastos() {
        const container = document.getElementById('gastosPagination');
        if (!container) {
            console.log('No se encontró el contenedor de paginación de gastos');
            return;
        }

        container.innerHTML = '';
        
        const totalPages = Math.max(1, Math.ceil(totalGastosCount / pageSizeGastos));
        
        if (totalPages <= 1) {
            return;
        }

        // Botón Previous
        const prevBtn = document.createElement('button');
        prevBtn.className = 'btn btn-sm btn-outline-light me-2';
        prevBtn.type = 'button';
        prevBtn.disabled = currentPageGastos <= 1;
        prevBtn.textContent = 'Anterior';
        prevBtn.onclick = async (e) => {
            e.preventDefault();
            if (currentPageGastos > 1) {
                currentPageGastos--;
                await loadGastos();
            }
        };
        container.appendChild(prevBtn);

        // Indicador de página
        const pageInfo = document.createElement('span');
        pageInfo.className = 'text-white-50';
        pageInfo.textContent = `Página ${currentPageGastos} de ${totalPages}`;
        container.appendChild(pageInfo);

        // Botón Next
        const nextBtn = document.createElement('button');
        nextBtn.className = 'btn btn-sm btn-outline-light ms-2';
        nextBtn.type = 'button';
        nextBtn.disabled = currentPageGastos >= totalPages;
        nextBtn.textContent = 'Siguiente';
        nextBtn.onclick = async (e) => {
            e.preventDefault();
            if (currentPageGastos < totalPages) {
                currentPageGastos++;
                await loadGastos();
            }
        };
        container.appendChild(nextBtn);
    }

    // ===== KPIs =====

    async function updateKPIs() {
        try {
            const filters = {
                anio: document.getElementById('filtroAnio').value || null,
                mes: document.getElementById('filtroMes').value || null
            };

            const { data, error } = await window.db.getGastos(filters);

            if (error) {
                console.error('Error actualizando KPIs:', error);
                return;
            }

            const gastos = data || [];
            const totalGastos = gastos.reduce((sum, g) => sum + Number(g.monto || 0), 0);
            const totalRegistros = gastos.length;
            const gastosConVenta = gastos.filter(g => g.venta_id).length;
            const gastosOperativos = totalRegistros - gastosConVenta;

            document.getElementById('totalGastosMes').textContent = formatCOP(totalGastos);
            document.getElementById('totalRegistros').textContent = totalRegistros;
            document.getElementById('gastosConVenta').textContent = gastosConVenta;
            document.getElementById('gastosOperativos').textContent = gastosOperativos;
        } catch (error) {
            console.error('Excepción actualizando KPIs:', error);
        }
    }

    // ===== RESUMEN POR CATEGORÍA =====

    async function loadResumenCategoria() {
        try {
            const filters = {
                anio: document.getElementById('filtroAnio').value || null,
                mes: document.getElementById('filtroMes').value || null
            };

            const { data, error } = await window.db.getGastosResumen(filters);

            if (error) {
                console.error('Error cargando resumen:', error);
                showResumenError();
                return;
            }

            renderResumen(data);
        } catch (error) {
            console.error('Excepción cargando resumen:', error);
            showResumenError();
        }
    }

    function renderResumen(resumenData) {
        const tbody = document.getElementById('resumenCategoriaBody');
        if (!tbody) return;

        if (!resumenData || !resumenData.resumen || resumenData.resumen.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="4" class="text-center text-white-50">
                        No hay datos para mostrar
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = resumenData.resumen.map(item => {
            return `
                <tr>
                    <td>${item.categoria_nombre}</td>
                    <td class="text-end">${item.cantidad}</td>
                    <td class="text-end fw-bold text-success">${formatCOP(item.total)}</td>
                    <td class="text-end">${item.porcentaje}%</td>
                </tr>
            `;
        }).join('');
    }

    function showResumenError() {
        const tbody = document.getElementById('resumenCategoriaBody');
        if (tbody) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="4" class="text-center text-danger">
                        Error al cargar el resumen
                    </td>
                </tr>
            `;
        }
    }

    // ===== UTILIDADES =====

    function showAlert(message, type = 'info') {
        // Crear alerta Bootstrap
        const alertDiv = document.createElement('div');
        alertDiv.className = `alert alert-${type} alert-dismissible fade show position-fixed`;
        alertDiv.style.top = '20px';
        alertDiv.style.right = '20px';
        alertDiv.style.zIndex = '9999';
        alertDiv.style.minWidth = '300px';
        alertDiv.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;

        document.body.appendChild(alertDiv);

        // Auto-remover después de 5 segundos
        setTimeout(() => {
            if (alertDiv.parentNode) {
                alertDiv.remove();
            }
        }, 5000);
    }

    // ===== VER DETALLE DE GASTO =====

    async function verDetalleGasto(gastoId) {
        try {
            if (!window.supabaseClient) {
                alert('Error: No hay conexión con la base de datos');
                return;
            }

            // Obtener datos del gasto con información de categoría y venta
            const { data: gasto, error: gastoError } = await window.supabaseClient
                .from('gastos_mensuales_detalle')
                .select(`
                    id,
                    anio,
                    mes,
                    monto,
                    notas,
                    created_at,
                    updated_at,
                    categoria_id,
                    venta_id,
                    gasto_categorias:categoria_id(
                        id,
                        nombre,
                        descripcion
                    ),
                    ventas:venta_id(
                        id,
                        numero_venta,
                        fecha_venta,
                        total,
                        clientes:cliente_id(
                            id,
                            nombre_completo,
                            tipo_id,
                            numero_id,
                            email,
                            telefono
                        )
                    )
                `)
                .eq('id', gastoId)
                .single();

            if (gastoError || !gasto) {
                console.error('Error cargando gasto:', gastoError);
                alert('No se pudo cargar la información del gasto');
                return;
            }

            // Poblar encabezado del modal
            const gastoIdEl = document.getElementById('detailGastoId');
            const categoriaEl = document.getElementById('detailCategoria');
            const montoEl = document.getElementById('detailMonto');
            const fechaRegistroEl = document.getElementById('detailFechaRegistro');
            const fechaActualizacionEl = document.getElementById('detailFechaActualizacion');
            const anioEl = document.getElementById('detailAnio');
            const mesEl = document.getElementById('detailMes');
            const notasEl = document.getElementById('detailNotas');
            const notasSectionEl = document.getElementById('detailNotasSection');
            const ventaSectionEl = document.getElementById('detailVentaSection');
            const ventaNumeroEl = document.getElementById('detailVentaNumero');
            const ventaFechaEl = document.getElementById('detailVentaFecha');
            const ventaTotalEl = document.getElementById('detailVentaTotal');
            const ventaClienteEl = document.getElementById('detailVentaCliente');
            const ventaClienteExtraEl = document.getElementById('detailVentaClienteExtra');

            // ID del gasto
            if (gastoIdEl) gastoIdEl.textContent = `#${gasto.id.substring(0, 8)}...`;

            // Categoría
            if (categoriaEl) {
                categoriaEl.textContent = gasto.gasto_categorias?.nombre || 'Sin categoría';
            }

            // Monto
            if (montoEl) montoEl.textContent = formatCOP(Number(gasto.monto) || 0);

            // Fecha de registro
            if (fechaRegistroEl) {
                const fechaRegistro = new Date(gasto.created_at);
                fechaRegistroEl.textContent = fechaRegistro.toLocaleString('es-CO', {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit'
                }) || '—';
            }

            // Fecha de actualización
            if (fechaActualizacionEl) {
                if (gasto.updated_at && gasto.updated_at !== gasto.created_at) {
                    const fechaActualizacion = new Date(gasto.updated_at);
                    fechaActualizacionEl.textContent = fechaActualizacion.toLocaleString('es-CO', {
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit'
                    }) || '—';
                } else {
                    fechaActualizacionEl.textContent = '—';
                }
            }

            // Año y Mes
            if (anioEl) anioEl.textContent = gasto.anio || '—';
            if (mesEl) mesEl.textContent = meses[gasto.mes] || '—';

            // Observaciones
            if (notasEl && notasSectionEl) {
                if (gasto.notas && gasto.notas.trim()) {
                    notasEl.textContent = gasto.notas;
                    notasSectionEl.style.display = 'block';
                } else {
                    notasEl.textContent = '—';
                    notasSectionEl.style.display = 'none';
                }
            }

            // Información de venta asociada
            if (ventaSectionEl) {
                if (gasto.ventas && gasto.venta_id) {
                    ventaSectionEl.style.display = 'block';
                    
                    if (ventaNumeroEl) {
                        ventaNumeroEl.textContent = gasto.ventas.numero_venta || '—';
                    }
                    
                    if (ventaFechaEl) {
                        const fechaVenta = new Date(gasto.ventas.fecha_venta);
                        ventaFechaEl.textContent = fechaVenta.toLocaleString('es-CO', {
                            year: 'numeric',
                            month: '2-digit',
                            day: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit'
                        }) || '—';
                    }
                    
                    if (ventaTotalEl) {
                        ventaTotalEl.textContent = formatCOP(Number(gasto.ventas.total) || 0);
                    }
                    
                    // Cliente de la venta
                    if (ventaClienteEl) {
                        if (gasto.ventas.clientes && gasto.ventas.clientes.nombre_completo) {
                            ventaClienteEl.textContent = gasto.ventas.clientes.nombre_completo;
                        } else {
                            ventaClienteEl.textContent = 'Cliente General';
                        }
                    }
                    
                    // Información extra del cliente
                    if (ventaClienteExtraEl && gasto.ventas.clientes) {
                        const clienteInfo = [];
                        if (gasto.ventas.clientes.tipo_id && gasto.ventas.clientes.numero_id) {
                            clienteInfo.push(`${gasto.ventas.clientes.tipo_id}: ${gasto.ventas.clientes.numero_id}`);
                        }
                        if (gasto.ventas.clientes.telefono) {
                            clienteInfo.push(`Tel: ${gasto.ventas.clientes.telefono}`);
                        }
                        if (gasto.ventas.clientes.email) {
                            clienteInfo.push(`Email: ${gasto.ventas.clientes.email}`);
                        }
                        ventaClienteExtraEl.innerHTML = clienteInfo.length > 0 
                            ? `<span class="text-white" style="opacity:1;">${clienteInfo.join(' | ')}</span>`
                            : '<span class="text-white" style="opacity:1;">&nbsp;</span>';
                    } else if (ventaClienteExtraEl) {
                        ventaClienteExtraEl.innerHTML = '<span class="text-white" style="opacity:1;">&nbsp;</span>';
                    }
                } else {
                    ventaSectionEl.style.display = 'none';
                }
            }

            // Mostrar modal
            const modalEl = document.getElementById('gastoDetailModal');
            if (modalEl) {
                const modal = new bootstrap.Modal(modalEl);
                modal.show();
            }
        } catch (error) {
            console.error('Error en verDetalleGasto:', error);
            alert('Ocurrió un error al cargar los detalles del gasto');
        }
    }

    // ===== EXPORTAR FUNCIONES PÚBLICAS =====

    window.gastosModule = {
        editGasto,
        deleteGasto,
        verDetalleGasto
    };

    // Inicializar cuando el DOM esté listo
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();

