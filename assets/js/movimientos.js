// ================================================
// MOVIMIENTOS DE INVENTARIO - ADS-POS
// ================================================

let movimientosData = [];
let currentPage = 1;
const pageSize = 10;
let totalMovimientosCount = 0;
let selectedProductId = null;

// Elementos del DOM
const movementsBody = document.getElementById('movementsBody');
const searchTerm = document.getElementById('searchTerm');
const filterType = document.getElementById('filterType');
const filterProduct = document.getElementById('filterProduct');
const dateFrom = document.getElementById('dateFrom');
const dateTo = document.getElementById('dateTo');
const searchBtn = document.getElementById('searchBtn');
const searchBtn2 = document.getElementById('searchBtn2');
const clearBtn = document.getElementById('clearBtn');

// Formulario de nuevo movimiento
const movementType = document.getElementById('movementType');
const productCode = document.getElementById('productCode');
const productSuggestions = document.getElementById('productSuggestions');
const quantity = document.getElementById('quantity');
const reason = document.getElementById('reason');
const reference = document.getElementById('reference');
const notes = document.getElementById('notes');
const addMovementBtn = document.getElementById('addMovementBtn');

// Resumen de movimientos
const entradasHoy = document.getElementById('entradasHoy');
const salidasHoy = document.getElementById('salidasHoy');
const productosStockBajo = document.getElementById('productosStockBajo');
const totalMovimientos = document.getElementById('totalMovimientos');

// ================================================
// FUNCIONES PRINCIPALES
// ================================================

async function initMovimientos() {
    try {
        await loadMovimientos();
        await loadResumenMovimientos();
        setupEventListeners();
    } catch (error) {
        console.error('Error inicializando movimientos:', error);
    }
}

async function loadMovimientos() {
    try {
        if (!window.db) return;
        
        const offset = (currentPage - 1) * pageSize;
        
        // Obtener valores de filtros
        const search = searchTerm?.value.trim() || '';
        const tipo = filterType?.value || '';
        const productoFilter = filterProduct?.value || '';
        const fechaDesde = dateFrom?.value || '';
        const fechaHasta = dateTo?.value || '';
        
        // Si hay búsqueda por texto, buscar productos con LIKE primero
        let productoIdsParaBusqueda = null;
        let buscarEnMovimientos = false; // Flag para buscar también en referencia/motivo/notas
        
        if (search) {
            try {
                // Buscar productos por código y por descripción usando las funciones de database.js
                const searchTerm = search.trim();
                
                // Buscar por código
                const { data: productosPorCodigo, error: errorCodigo } = await window.db?.searchProductosPorCodigo(searchTerm, { limit: 1000, onlyActive: false }) || { data: null, error: null };
                
                // Buscar por nombre/descripción
                const { data: productosPorDesc, error: errorDesc } = await window.db?.searchProductosPorDescripcion(searchTerm, { limit: 1000, onlyActive: false }) || { data: null, error: null };
                
                // Combinar resultados únicos por ID
                const productosMap = new Map();
                if (productosPorCodigo && !errorCodigo) {
                    productosPorCodigo.forEach(p => productosMap.set(p.id, p));
                }
                if (productosPorDesc && !errorDesc) {
                    productosPorDesc.forEach(p => productosMap.set(p.id, p));
                }
                
                const productosEncontrados = Array.from(productosMap.values());
                
                if (productosEncontrados.length > 0) {
                    productoIdsParaBusqueda = productosEncontrados.map(p => p.id);
                    // También buscar en referencia/motivo/notas para incluir ambos resultados
                    buscarEnMovimientos = true;
                } else {
                    // Si no se encuentran productos, buscar solo en referencia, motivo y notas del movimiento en DB
                    buscarEnMovimientos = true;
                    productoIdsParaBusqueda = null; // No filtrar por producto
                }
            } catch (e) {
                console.error('Error buscando productos:', e);
                buscarEnMovimientos = true;
                productoIdsParaBusqueda = null;
            }
        }
        
        // Construir query base
        let query = window.supabaseClient
            .from('movimientos_inventario')
            .select(`
                id,
                tipo_movimiento,
                cantidad,
                motivo,
                referencia,
                notas,
                fecha,
                created_by,
                productos:producto_id(
                    id,
                    nombre,
                    codigo_interno,
                    codigo_barras,
                    stock_actual
                )
            `, { count: 'exact' });
        
        // Aplicar filtros
        if (tipo) {
            query = query.eq('tipo_movimiento', tipo);
        }
        
        if (fechaDesde) {
            query = query.gte('fecha', `${fechaDesde}T00:00:00`);
        }
        
        if (fechaHasta) {
            query = query.lte('fecha', `${fechaHasta}T23:59:59`);
        }
        
        // Si hay búsqueda por texto y encontramos productos, filtrar por producto_id
        if (search && productoIdsParaBusqueda && productoIdsParaBusqueda.length > 0) {
            // Filtrar por los productos encontrados (no necesitamos buscar en referencia/motivo si ya encontramos productos)
            query = query.in('producto_id', productoIdsParaBusqueda);
        } else if (search && buscarEnMovimientos) {
            // Si no se encontraron productos, buscar en referencia, motivo y notas con LIKE
            query = query.or(`referencia.ilike.%${search}%,motivo.ilike.%${search}%,notas.ilike.%${search}%`);
        }
        
        if (productoFilter) {
            // Buscar el producto por código para obtener su ID
            const { data: prod, error: prodErr } = await window.supabaseClient
                .from('productos')
                .select('id')
                .is('deleted_at', null)
                .or(`codigo_interno.eq.${productoFilter},codigo_barras.eq.${productoFilter}`)
                .limit(1);
            
            if (!prodErr && prod && prod.length > 0) {
                query = query.eq('producto_id', prod[0].id);
            } else {
                // Si no se encuentra el producto, retornar sin resultados
                query = query.eq('producto_id', '00000000-0000-0000-0000-000000000000');
            }
        }
        
        // Ordenar y paginar
        query = query.order('fecha', { ascending: false })
                     .range(offset, offset + pageSize - 1);
        
        const { data: movimientos, error, count } = await query;

        if (error) {
            console.error('Error cargando movimientos:', error);
            return;
        }

        // Los movimientos ya vienen filtrados desde la base de datos
        totalMovimientosCount = count || 0;
        movimientosData = movimientos || [];
        console.log('Movimientos cargados:', movimientosData.length);
        renderMovimientos();
        renderPagination();
    } catch (error) {
        console.error('Error en loadMovimientos:', error);
    }
}

function renderMovimientos() {
    if (!movementsBody) return;
    
    movementsBody.innerHTML = '';
    
    if (!movimientosData || movimientosData.length === 0) {
        const tr = document.createElement('tr');
        tr.innerHTML = '<td colspan="8" class="text-center text-muted py-4"><i class="fas fa-inbox fa-2x mb-2"></i><br>Sin movimientos para mostrar</td>';
        movementsBody.appendChild(tr);
        return;
    }

    movimientosData.forEach(movimiento => {
        const fecha = new Date(movimiento.fecha);
        const fechaStr = fecha.toLocaleDateString('es-CO');
        const horaStr = fecha.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        
        const tipoMovimiento = movimiento.tipo_movimiento;
        const cantidad = Number(movimiento.cantidad);
        const cantidadStr = cantidad > 0 ? `+${cantidad}` : `${cantidad}`;
        
        const productoNombre = movimiento.productos?.nombre || 'Producto no encontrado';
        const productoCodigo = movimiento.productos?.codigo_interno || movimiento.productos?.codigo_barras || '-';
        const stockActual = movimiento.productos?.stock_actual || 0;
        
        // Calcular stock anterior (aproximado)
        const stockAnterior = stockActual - cantidad;
        
        // Determinar badge color según tipo de movimiento
        let badgeClass = 'secondary';
        let tipoTexto = tipoMovimiento;
        
        switch (tipoMovimiento) {
            case 'entrada':
                badgeClass = 'success';
                tipoTexto = 'Entrada';
                break;
            case 'salida':
                badgeClass = 'danger';
                tipoTexto = 'Salida';
                break;
            default:
                badgeClass = 'secondary';
                tipoTexto = tipoMovimiento || 'Desconocido';
                break;
        }

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>
                <div>
                    <strong>${fechaStr}</strong><br>
                    <small class="text-white">${horaStr}</small>
                </div>
            </td>
            <td><span class="badge bg-${badgeClass}">${tipoTexto}</span></td>
            <td>
                <div>
                    <strong>${productoNombre}</strong><br>
                    <small class="text-white">${productoCodigo}</small>
                </div>
            </td>
            <td class="text-end"><strong>${cantidadStr}</strong></td>
            <td class="text-end">${stockAnterior}</td>
            <td class="text-end"><strong>${stockActual}</strong></td>
            <td>
                <button type="button" class="btn btn-sm btn-outline-info" title="Ver detalles" onclick="verDetallesMovimiento('${movimiento.id}')">
                    <i class="fas fa-eye"></i>
                </button>
            </td>`;
        
        movementsBody.appendChild(tr);
    });
}

function renderPagination() {
    const container = document.getElementById('movementsPagination');
    if (!container) {
        console.log('No se encontró el contenedor de paginación');
        return;
    }

    container.innerHTML = '';
    
    const totalPages = Math.max(1, Math.ceil(totalMovimientosCount / pageSize));
    console.log('Total movimientos:', totalMovimientosCount, 'Páginas:', totalPages, 'Página actual:', currentPage);
    
    if (totalPages <= 1) {
        console.log('Solo hay 1 página o menos, no se muestra paginación');
        return;
    }

    // Botón Previous
    const prevBtn = document.createElement('button');
    prevBtn.className = 'btn btn-sm btn-outline-light me-2';
    prevBtn.type = 'button';
    prevBtn.disabled = currentPage <= 1;
    prevBtn.textContent = 'Anterior';
    prevBtn.onclick = async (e) => {
        e.preventDefault();
        if (currentPage > 1) {
            currentPage--;
            await loadMovimientos();
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
            await loadMovimientos();
        }
    };
    container.appendChild(nextBtn);
    console.log('Paginación renderizada correctamente');
}

async function loadResumenMovimientos() {
    try {
        if (!window.db) return;
        
        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);
        const manana = new Date(hoy);
        manana.setDate(manana.getDate() + 1);
        
        // Obtener movimientos de hoy (incluyendo producto_id para calcular stock bajo)
        const { data: movimientosHoy, error } = await window.supabaseClient
            .from('movimientos_inventario')
            .select('tipo_movimiento, producto_id')
            .gte('fecha', hoy.toISOString())
            .lt('fecha', manana.toISOString());

        if (error) {
            console.error('Error cargando resumen:', error);
            return;
        }

        // Contar por tipo de movimiento
        const conteos = {
            entrada: 0,
            salida: 0,
            ajuste: 0,
            transferencia: 0
        };

        // Obtener IDs únicos de productos que tuvieron movimientos hoy
        const productosIds = new Set();
        movimientosHoy?.forEach(mov => {
            if (conteos.hasOwnProperty(mov.tipo_movimiento)) {
                conteos[mov.tipo_movimiento]++;
            }
            // Guardar el producto_id si existe en el movimiento
            if (mov.producto_id) {
                productosIds.add(mov.producto_id);
            }
        });

        const totalHoy = Object.values(conteos).reduce((sum, count) => sum + count, 0);

        // Calcular productos con stock bajo tras movimientos de hoy
        let productosStockBajoCount = 0;
        if (productosIds.size > 0) {
            // Obtener información de stock de los productos que tuvieron movimientos hoy
            const { data: productos, error: productosError } = await window.supabaseClient
                .from('productos')
                .select('id, stock_actual, stock_min')
                .in('id', Array.from(productosIds));

            if (!productosError && productos) {
                productos.forEach(producto => {
                    const stockActual = Number(producto.stock_actual) || 0;
                    const stockMin = Number(producto.stock_min) || 0;
                    // Producto con stock bajo: stock actual <= stock mínimo O stock actual = 0
                    if (stockActual <= stockMin || stockActual === 0) {
                        productosStockBajoCount++;
                    }
                });
            }
        }

        // Obtener el total de todos los movimientos (para el KPI "Total Movimientos")
        const { count: totalAllMovimientos, error: countErrorTotal } = await window.supabaseClient
            .from('movimientos_inventario')
            .select('*', { count: 'exact', head: true });

        // Actualizar resumen
        if (entradasHoy) entradasHoy.textContent = conteos.entrada || 0;
        if (salidasHoy) salidasHoy.textContent = conteos.salida || 0;
        if (productosStockBajo) productosStockBajo.textContent = productosStockBajoCount || 0;
        if (totalMovimientos) {
            totalMovimientos.textContent = (countErrorTotal) ? totalHoy : (totalAllMovimientos || 0);
        }
        
    } catch (error) {
        console.error('Error en loadResumenMovimientos:', error);
    }
}



// ================================================
// FUNCIONES DE BÚSQUEDA Y FILTROS
// ================================================

// Función debounce para optimizar búsquedas
function debounce(fn, delay) {
    let t;
    return (...args) => {
        clearTimeout(t);
        t = setTimeout(() => fn.apply(this, args), delay);
    };
}

async function applyFiltersAndReload() {
    currentPage = 1;
    await loadMovimientos();
}

// ================================================
// FUNCIONES DE BÚSQUEDA DE PRODUCTOS
// ================================================

// Búsqueda de productos con LIKE (código o nombre)
async function searchProductsForControl(term) {
    try {
        if (!window.db) return { items: [] };
        const trimmed = (term || '').trim();
        if (!trimmed) return { items: [] };
        
        // Buscar por código y por descripción, combinar sin duplicar
        const [byCode, byDesc] = await Promise.all([
            window.db.searchProductosPorCodigo(trimmed, { limit: 10 }),
            window.db.searchProductosPorDescripcion(trimmed, { limit: 10 })
        ]);
        
        const map = new Map();
        const addAll = (arr) => Array.isArray(arr) && arr.forEach(p => {
            if (p && !map.has(p.id)) map.set(p.id, p);
        });
        
        if (!byCode.error) addAll(byCode.data);
        if (!byDesc.error) addAll(byDesc.data);
        
        return { items: Array.from(map.values()) };
    } catch (_) {
        return { items: [] };
    }
}

// Ocultar sugerencias de productos
function hideProductSuggestions() {
    if (productSuggestions) {
        productSuggestions.style.display = 'none';
        productSuggestions.innerHTML = '';
    }
}

// Mostrar sugerencias de productos
function showProductSuggestions(products) {
    if (!productSuggestions) return;
    hideProductSuggestions();
    if (!products || products.length === 0) return;
    
    products.forEach(p => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'list-group-item list-group-item-action text-white';
        btn.style.backgroundColor = '#2c3e50';
        btn.style.borderColor = '#34495e';
        btn.innerHTML = `<strong>${p.nombre || 'Sin nombre'}</strong><br><small>${p.codigo_interno || p.codigo_barras || 'Sin código'} - Stock: ${p.stock_actual || 0}</small>`;
        btn.addEventListener('click', () => {
            productCode.value = p.nombre || '';
            productCode.dataset.productId = p.id || '';
            selectedProductId = p.id;
            hideProductSuggestions();
            quantity && quantity.focus();
        });
        productSuggestions.appendChild(btn);
    });
    productSuggestions.style.display = 'block';
}

// Ocultar sugerencias del filtro de producto
function hideFilterProductSuggestions() {
    const suggestions = document.getElementById('filterProductSuggestions');
    if (suggestions) {
        suggestions.style.display = 'none';
        suggestions.innerHTML = '';
    }
}

// Mostrar sugerencias del filtro de producto
function showFilterProductSuggestions(products) {
    const suggestions = document.getElementById('filterProductSuggestions');
    const input = document.getElementById('filterProduct');
    
    if (!suggestions || !input) {
        console.error('No se encontró el elemento filterProductSuggestions o filterProduct');
        return;
    }
    
    hideFilterProductSuggestions();
    if (!products || products.length === 0) return;
    
    // Obtener la posición del input (getBoundingClientRect ya da posición relativa al viewport)
    const inputRect = input.getBoundingClientRect();
    
    // Posicionar el dropdown debajo del input usando position fixed (relativo al viewport)
    suggestions.style.position = 'fixed';
    suggestions.style.top = `${inputRect.bottom}px`;
    suggestions.style.left = `${inputRect.left}px`;
    suggestions.style.width = `${inputRect.width}px`;
    suggestions.style.zIndex = '1050';
    suggestions.style.backgroundColor = 'white';
    suggestions.style.border = '1px solid #dee2e6';
    suggestions.style.borderRadius = '0.375rem';
    suggestions.style.boxShadow = '0 0.5rem 1rem rgba(0, 0, 0, 0.15)';
    suggestions.style.maxHeight = '300px';
    suggestions.style.overflowY = 'auto';
    
    // Configurar listener de scroll dentro del contenedor si no existe
    if (!suggestions.dataset.scrollListenerAdded) {
        suggestions.addEventListener('scroll', () => {
            window.isInteractingWithSuggestions = true;
        }, { passive: true });
        suggestions.dataset.scrollListenerAdded = 'true';
    }
    
    // Resetear la flag cuando se muestran nuevas sugerencias
    window.isInteractingWithSuggestions = false;
    
    products.forEach(p => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'list-group-item list-group-item-action';
        btn.style.border = 'none';
        btn.style.borderBottom = '1px solid #dee2e6';
        btn.style.textAlign = 'left';
        btn.style.padding = '0.5rem 1rem';
        btn.style.cursor = 'pointer';
        btn.innerHTML = `<strong>${p.nombre || 'Sin nombre'}</strong><br><small class="text-muted">${p.codigo_interno || p.codigo_barras || 'Sin código'} - Stock: ${p.stock_actual || 0}</small>`;
        btn.addEventListener('mouseenter', () => {
            btn.style.backgroundColor = '#f8f9fa';
        });
        btn.addEventListener('mouseleave', () => {
            btn.style.backgroundColor = 'white';
        });
        btn.addEventListener('click', () => {
            // Guardar el código (interno o de barras) en el campo para usar en el filtro
            const codigo = p.codigo_interno || p.codigo_barras || '';
            input.value = codigo;
            input.dataset.productId = p.id || '';
            hideFilterProductSuggestions();
            // Recargar movimientos con el filtro aplicado
            loadMovimientos();
        });
        suggestions.appendChild(btn);
    });
    suggestions.style.display = 'block';
}

// ================================================
// FUNCIONES DE MOVIMIENTOS
// ================================================

// Función para mostrar notificaciones toast
function showToast(message, type = 'success') {
    const div = document.createElement('div');
    div.className = `alert alert-${type} position-fixed`;
    div.style.cssText = 'top:20px;right:20px;z-index:9999;min-width:280px;box-shadow:0 4px 12px rgba(0,0,0,0.3)';
    div.innerHTML = `<div class="d-flex align-items-center"><span>${message}</span><button type="button" class="btn-close ms-auto" onclick="this.parentElement.parentElement.remove()"></button></div>`;
    document.body.appendChild(div);
    setTimeout(() => div.remove(), 3500);
}

// Función para limpiar el formulario
function limpiarFormulario() {
    if (movementType) movementType.value = '';
    if (productCode) {
        productCode.value = '';
        delete productCode.dataset.productId;
    }
    if (quantity) quantity.value = '';
    if (reason) reason.value = '';
    if (reference) reference.value = '';
    if (notes) notes.value = '';
    selectedProductId = null;
    hideProductSuggestions();
}

async function agregarMovimiento() {
    try {
        if (!window.db) return;
        
        // Validar campos
        const type = movementType ? movementType.value : '';
        const productId = productCode?.dataset?.productId || '';
        const productText = productCode ? productCode.value.trim() : '';
        const qty = Number(quantity ? quantity.value : '');
        const reasonText = reason ? reason.value.trim() : '';
        const refText = reference ? reference.value.trim() : '';
        const notesText = notes ? notes.value.trim() : '';

        if (!type || !productText || !qty || !reasonText) {
            showToast('Por favor complete todos los campos requeridos', 'warning');
            return;
        }
        
        if (!Number.isFinite(qty) || qty <= 0) {
            showToast('La cantidad debe ser un número mayor a 0', 'warning');
            return;
        }

        // Resolver producto_id si no se seleccionó de sugerencias
        let resolvedProductId = productId || selectedProductId;
        if (!resolvedProductId) {
            const term = productText;
            const found = await searchProductsForControl(term);
            if (found.items && found.items.length === 1) {
                resolvedProductId = found.items[0].id;
            }
        }
        
        if (!resolvedProductId) {
            showToast('Seleccione un producto válido de la lista de sugerencias', 'warning');
            return;
        }

        // Obtener usuario actual
        let currentUserId = null;
        try {
            currentUserId = window.auth?.getCurrentUser?.()?.id || null;
            if (!currentUserId && window.supabaseClient) {
                const { data: { session } } = await window.supabaseClient.auth.getSession();
                currentUserId = session?.user?.id || null;
            }
        } catch (_) {}
        
        if (!currentUserId) {
            showToast('No hay usuario autenticado', 'danger');
            return;
        }

        // Procesar según tipo de movimiento
        if (type === 'entrada' || type === 'salida') {
            // Para 'entrada' y 'salida': insertar movimiento directo (el trigger ajusta stock)
            const { data, error } = await window.db.createMovimientoInventario({
                producto_id: resolvedProductId,
                tipo_movimiento: type,
                cantidad: qty,
                motivo: reasonText,
                referencia: refText,
                notas: notesText,
                usuario_id: currentUserId
            });
            
            if (error) {
                console.error('Error creando movimiento:', error);
                showToast('Error al registrar el movimiento', 'danger');
                return;
            }
            
        } else if (type === 'ajuste') {
            // Ajuste: calcular delta vs stock actual
            const { data: prod, error: pErr } = await window.supabaseClient
                .from('productos')
                .select('id, stock_actual')
                .eq('id', resolvedProductId)
                .maybeSingle();
            
            if (pErr) {
                console.error('Error obteniendo producto:', pErr);
                showToast('Error al obtener información del producto', 'danger');
                return;
            }
            
            const actual = Number(prod?.stock_actual) || 0;
            const delta = qty - actual; // qty interpretado como nuevo stock deseado
            
            if (delta === 0) {
                showToast('El stock ingresado es igual al actual, no hay cambios', 'warning');
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
                notas: notesText,
                usuario_id: currentUserId
            });
            
            if (movErr) {
                console.error('Error creando movimiento de ajuste:', movErr);
                showToast('Error al registrar el ajuste', 'danger');
                return;
            }
            
        } else {
            showToast('Tipo de movimiento no válido', 'warning');
            return;
        }

        // Refrescar UI/KPIs e informar
        await Promise.all([
            loadMovimientos(),
            loadResumenMovimientos()
        ]);
        
        // Limpiar formulario
        if (movementType) movementType.value = '';
        if (productCode) {
            productCode.value = '';
            delete productCode.dataset.productId;
        }
        if (quantity) quantity.value = '';
        if (reason) reason.value = '';
        if (reference) reference.value = '';
        if (notes) notes.value = '';
        selectedProductId = null;
        hideProductSuggestions();
        
        showToast('Movimiento registrado y stock actualizado', 'success');
        
    } catch (error) {
        console.error('Error en agregarMovimiento:', error);
        showToast('Error al procesar el movimiento', 'danger');
    }
}

async function verDetallesMovimiento(movimientoId) {
    try {
        // Buscar el movimiento en los datos cargados
        let movimiento = movimientosData.find(m => m.id === movimientoId);
        
        // Si no se encuentra en los datos cargados, obtenerlo directamente de la base de datos
        if (!movimiento) {
            const { data: movimientoData, error } = await window.supabaseClient
                .from('movimientos_inventario')
                .select(`
                    id,
                    tipo_movimiento,
                    cantidad,
                    motivo,
                    referencia,
                    notas,
                    fecha,
                    created_by,
                    productos:producto_id(
                        nombre,
                        codigo_interno,
                        codigo_barras,
                        stock_actual
                    )
                `)
                .eq('id', movimientoId)
                .single();
            
            if (error || !movimientoData) {
                alert('Movimiento no encontrado');
                return;
            }
            
            movimiento = movimientoData;
        }

        // Esperar a que el modal exista en el DOM
        await new Promise(resolve => setTimeout(resolve, 100));

        // Mostrar modal
        const modalEl = document.getElementById('movementDetailModal');
        if (!modalEl) {
            console.error('Modal no encontrado en el DOM');
            alert('Modal no encontrado');
            return;
        }

        const modal = new bootstrap.Modal(modalEl);
        
        // Formatear fecha y hora
        const fecha = new Date(movimiento.fecha);
        const fechaStr = fecha.toLocaleDateString('es-CO');
        const horaStr = fecha.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

        // Determinar badge color y texto según tipo de movimiento
        let badgeClass = 'secondary';
        let tipoTexto = movimiento.tipo_movimiento;
        
        switch (movimiento.tipo_movimiento) {
            case 'entrada':
                badgeClass = 'success';
                tipoTexto = 'Entrada';
                break;
            case 'salida':
                badgeClass = 'danger';
                tipoTexto = 'Salida';
                break;
            default:
                badgeClass = 'secondary';
                tipoTexto = movimiento.tipo_movimiento || 'Desconocido';
                break;
        }

        // Llenar información del producto
        const productNameEl = document.getElementById('detailProductName');
        const productCodeEl = document.getElementById('detailProductCode');
        const stockActualEl = document.getElementById('detailStockActual');

        if (productNameEl) productNameEl.textContent = movimiento.productos?.nombre || '—';
        if (productCodeEl) productCodeEl.textContent = movimiento.productos?.codigo_interno || movimiento.productos?.codigo_barras || '—';
        if (stockActualEl) stockActualEl.textContent = movimiento.productos?.stock_actual || 0;

        // Llenar tipo de movimiento
        const movementTypeEl = document.getElementById('detailMovementType');
        if (movementTypeEl) {
            movementTypeEl.className = `badge bg-${badgeClass}`;
            movementTypeEl.textContent = tipoTexto;
        }

        // Llenar fecha y hora
        const movementDateEl = document.getElementById('detailMovementDate');
        const movementTimeEl = document.getElementById('detailMovementTime');
        
        if (movementDateEl) movementDateEl.textContent = fechaStr;
        if (movementTimeEl) movementTimeEl.textContent = horaStr;

        // Llenar información de stock
        const cantidad = Number(movimiento.cantidad) || 0;
        const stockActual = movimiento.productos?.stock_actual || 0;
        
        // Calcular stock anterior basándose en el tipo de movimiento
        let stockAnterior = stockActual;
        if (movimiento.tipo_movimiento === 'entrada') {
            stockAnterior = stockActual - cantidad; // Si fue entrada, restamos para obtener el anterior
        } else if (movimiento.tipo_movimiento === 'salida') {
            stockAnterior = stockActual + cantidad; // Si fue salida, sumamos para obtener el anterior
        } else if (movimiento.tipo_movimiento === 'ajuste') {
            // Para ajustes, el stock anterior es complicado, usamos un valor aproximado
            stockAnterior = Math.max(0, stockActual - cantidad);
        }
        stockAnterior = Math.max(0, stockAnterior); // Asegurar que no sea negativo

        const stockAnteriorEl = document.getElementById('detailStockAnterior');
        const cantidadEl = document.getElementById('detailCantidad');
        const stockNuevoEl = document.getElementById('detailStockNuevo');

        if (stockAnteriorEl) stockAnteriorEl.textContent = stockAnterior;
        if (cantidadEl) {
            const cantidadSigno = movimiento.tipo_movimiento === 'entrada' ? '+' : (movimiento.tipo_movimiento === 'salida' ? '-' : '±');
            cantidadEl.textContent = `${cantidadSigno}${cantidad}`;
        }
        if (stockNuevoEl) stockNuevoEl.textContent = stockActual;

        // Llenar información adicional - asegurar que los campos se llenen correctamente
        const motivoEl = document.getElementById('detailMotivo');
        const referenciaEl = document.getElementById('detailReferencia');
        const notasEl = document.getElementById('detailNotas');

        // Usar operador de coalescencia nula para manejar null, undefined y strings vacíos
        const motivo = movimiento.motivo && movimiento.motivo.trim() !== '' ? movimiento.motivo : '—';
        const referencia = movimiento.referencia && movimiento.referencia.trim() !== '' ? movimiento.referencia : '—';
        const notas = movimiento.notas && movimiento.notas.trim() !== '' ? movimiento.notas : '—';

        if (motivoEl) {
            motivoEl.textContent = motivo;
        } else {
            console.error('Elemento detailMotivo no encontrado');
        }

        if (referenciaEl) {
            referenciaEl.textContent = referencia;
        } else {
            console.error('Elemento detailReferencia no encontrado');
        }

        if (notasEl) {
            notasEl.textContent = notas;
        } else {
            console.error('Elemento detailNotas no encontrado');
        }

        // Mostrar modal
        modal.show();
    } catch (error) {
        console.error('Error al cargar detalles del movimiento:', error);
        alert('Error al cargar los detalles del movimiento');
    }
}

// ================================================
// EVENT LISTENERS
// ================================================

function setupEventListeners() {
    // Búsqueda de productos en tiempo real con LIKE
    if (productCode) {
        const doSearch = debounce(async () => {
            const term = productCode.value;
            const { items } = await searchProductsForControl(term);
            showProductSuggestions(items);
        }, 250);
        
        productCode.addEventListener('input', () => {
            delete productCode.dataset.productId;
            selectedProductId = null;
            doSearch();
        });
        
        productCode.addEventListener('focus', () => {
            const v = productCode.value.trim();
            if (v) doSearch();
        });
        
        productCode.addEventListener('blur', () => {
            setTimeout(hideProductSuggestions, 150);
        });
        
        productCode.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') hideProductSuggestions();
        });
    }

    // Búsqueda en tiempo real con debounce para filtros
    if (searchTerm) {
        searchTerm.addEventListener('input', debounce(applyFiltersAndReload, 300));
    }

    // Búsqueda de productos en el filtro con sugerencias
    if (filterProduct) {
        const doFilterProductSearch = debounce(async () => {
            const term = filterProduct.value.trim();
            if (!term) {
                hideFilterProductSuggestions();
                // Si el campo está vacío, limpiar el filtro y recargar
                delete filterProduct.dataset.productId;
                applyFiltersAndReload();
                return;
            }
            console.log('Buscando productos con término:', term);
            const { items } = await searchProductsForControl(term);
            console.log('Productos encontrados:', items);
            showFilterProductSuggestions(items);
        }, 250);
        
        filterProduct.addEventListener('input', () => {
            delete filterProduct.dataset.productId;
            doFilterProductSearch();
        });
        
        filterProduct.addEventListener('focus', () => {
            const v = filterProduct.value.trim();
            if (v) doFilterProductSearch();
        });
        
        // Variable global para rastrear si estamos interactuando con las sugerencias
        window.isInteractingWithSuggestions = false;
        
        filterProduct.addEventListener('blur', (e) => {
            // Delay para permitir clicks en las sugerencias
            setTimeout(() => {
                // Solo ocultar si no estamos interactuando con las sugerencias
                if (!window.isInteractingWithSuggestions) {
                    const suggestions = document.getElementById('filterProductSuggestions');
                    if (suggestions && suggestions.style.display !== 'none') {
                        // Verificar si el nuevo elemento activo está dentro de las sugerencias
                        const activeElement = document.activeElement;
                        if (!suggestions.contains(activeElement)) {
                            hideFilterProductSuggestions();
                        }
                    }
                }
            }, 250);
        });
        
        filterProduct.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                hideFilterProductSuggestions();
                window.isInteractingWithSuggestions = false;
            } else if (e.key === 'Enter') {
                // Si presiona Enter y hay sugerencias, aplicar filtro si el campo tiene valor
                const v = filterProduct.value.trim();
                if (v) {
                    hideFilterProductSuggestions();
                    window.isInteractingWithSuggestions = false;
                    applyFiltersAndReload();
                }
            }
        });
        
        // Manejar scroll de la página (reposicionar sugerencias)
        window.addEventListener('scroll', () => {
            const suggestions = document.getElementById('filterProductSuggestions');
            if (suggestions && suggestions.style.display !== 'none') {
                // Si estamos interactuando con las sugerencias, no hacer nada
                if (window.isInteractingWithSuggestions) {
                    return;
                }
                
                // Reposicionar las sugerencias según la nueva posición del input
                const inputRect = filterProduct.getBoundingClientRect();
                suggestions.style.top = `${inputRect.bottom}px`;
                suggestions.style.left = `${inputRect.left}px`;
            }
        }, true);
        
        // Detectar cuando el usuario interactúa con las sugerencias
        document.addEventListener('mousedown', (e) => {
            const suggestions = document.getElementById('filterProductSuggestions');
            if (suggestions && suggestions.contains(e.target)) {
                window.isInteractingWithSuggestions = true;
                e.preventDefault(); // Evita que el input pierda el focus
            } else {
                window.isInteractingWithSuggestions = false;
            }
        });
        
        // Detectar cuando el usuario hace scroll dentro de la lista
        document.addEventListener('wheel', (e) => {
            const suggestions = document.getElementById('filterProductSuggestions');
            if (suggestions && suggestions.style.display !== 'none') {
                // Verificar si el scroll es dentro de la lista de sugerencias
                if (suggestions.contains(e.target)) {
                    window.isInteractingWithSuggestions = true;
                    // Permitir que el scroll funcione dentro de la lista
                    // No hacer nada más, solo marcar que estamos interactuando
                }
            }
        }, { passive: true });
        
        // El listener de scroll del contenedor se configura dinámicamente en showFilterProductSuggestions
        
        // Ocultar sugerencias al hacer clic fuera del input y de las sugerencias
        document.addEventListener('click', (e) => {
            const suggestions = document.getElementById('filterProductSuggestions');
            if (suggestions && suggestions.style.display !== 'none') {
                // Si el click no es ni en el input ni en las sugerencias, ocultarlas
                if (e.target !== filterProduct && !suggestions.contains(e.target)) {
                    hideFilterProductSuggestions();
                    window.isInteractingWithSuggestions = false;
                }
            }
        });
        
        // Reposicionar o ocultar sugerencias al redimensionar
        window.addEventListener('resize', () => {
            const suggestions = document.getElementById('filterProductSuggestions');
            const input = document.getElementById('filterProduct');
            if (suggestions && input && suggestions.style.display !== 'none') {
                const inputRect = input.getBoundingClientRect();
                suggestions.style.top = `${inputRect.bottom}px`;
                suggestions.style.left = `${inputRect.left}px`;
                suggestions.style.width = `${inputRect.width}px`;
            }
        });
    }

    // Filtros
    if (filterType) filterType.addEventListener('change', applyFiltersAndReload);
    if (dateFrom) dateFrom.addEventListener('change', applyFiltersAndReload);
    if (dateTo) dateTo.addEventListener('change', applyFiltersAndReload);

    // Botones de búsqueda
    if (searchBtn) searchBtn.addEventListener('click', applyFiltersAndReload);
    if (searchBtn2) searchBtn2.addEventListener('click', applyFiltersAndReload);

    // Botón agregar movimiento
    if (addMovementBtn) {
        addMovementBtn.addEventListener('click', agregarMovimiento);
    }

    // Botón limpiar
    if (clearBtn) {
        clearBtn.addEventListener('click', async () => {
            limpiarFormulario();
            
            const form = document.getElementById('movementsForm');
            if (form) form.reset();
            
            // Limpiar también los campos de búsqueda
            if (searchTerm) searchTerm.value = '';
            if (filterType) filterType.value = '';
            if (filterProduct) {
                filterProduct.value = '';
                delete filterProduct.dataset.productId;
            }
            hideFilterProductSuggestions();
            if (dateFrom) dateFrom.value = '';
            if (dateTo) dateTo.value = '';
            
            // Reiniciar paginación y recargar
            currentPage = 1;
            await loadMovimientos();
        });
    }

    // NO establecer fechas por defecto para mostrar todos los movimientos
    // const today = new Date();
    // const lastWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    // if (dateFrom) dateFrom.valueAsDate = lastWeek;
    // if (dateTo) dateTo.valueAsDate = today;
}

// ================================================
// FUNCIONES DE REPORTES
// ================================================

// Función genérica para exportar movimientos a CSV
async function exportMovimientosToCsv(movimientos, nombreArchivo) {
    if (!movimientos || movimientos.length === 0) {
        alert('No hay movimientos para exportar');
        return;
    }

    // Crear CSV
    const headers = [
        'fecha_movimiento',
        'tipo_movimiento',
        'producto_codigo',
        'producto_nombre',
        'cantidad',
        'motivo',
        'referencia',
        'notas'
    ];
    const lines = [headers.join(',')];

    movimientos.forEach(m => {
        const fecha = new Date(m.fecha).toLocaleString('es-CO');
        const tipo = m.tipo_movimiento || '';
        const codigo = m.productos?.codigo_interno || m.productos?.codigo_barras || '';
        const nombre = m.productos?.nombre || '';
        const cantidad = Number(m.cantidad) || 0;
        const motivo = m.motivo || '';
        const referencia = m.referencia || '';
        const notas = m.notas || '';

        const row = [
            csvEscape(fecha),
            csvEscape(tipo),
            csvEscape(codigo),
            csvEscape(nombre),
            cantidad,
            csvEscape(motivo),
            csvEscape(referencia),
            csvEscape(notas)
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
    const name = `${nombreArchivo}_${ts.getFullYear()}${pad(ts.getMonth()+1)}${pad(ts.getDate())}_${pad(ts.getHours())}${pad(ts.getMinutes())}${pad(ts.getSeconds())}.csv`;
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// ===== Exportación CSV: Reporte Diario =====
async function exportDailyReport() {
    try {
        if (!window.db) return alert('Servicio no disponible');
        
        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);
        const manana = new Date(hoy);
        manana.setDate(manana.getDate() + 1);
        
        const { data: movimientos, error } = await window.supabaseClient
            .from('movimientos_inventario')
            .select(`
                id,
                tipo_movimiento,
                cantidad,
                motivo,
                referencia,
                notas,
                fecha,
                productos:producto_id(
                    nombre,
                    codigo_interno,
                    codigo_barras
                )
            `)
            .gte('fecha', hoy.toISOString())
            .lt('fecha', manana.toISOString())
            .order('fecha', { ascending: false });

        if (error) {
            console.error('Error exportando reporte diario:', error);
            alert('Error al exportar reporte diario');
            return;
        }

        await exportMovimientosToCsv(movimientos || [], 'reporte_movimientos_diario');
        showToast('Reporte diario exportado correctamente', 'success');
        
    } catch (error) {
        console.error('Error exportando reporte diario:', error);
        alert('Error al exportar reporte diario');
    }
}

// ===== Exportación CSV: Reporte Mensual =====
async function exportMonthlyReport() {
    try {
        if (!window.db) return alert('Servicio no disponible');
        
        const hoy = new Date();
        const primerDiaMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
        primerDiaMes.setHours(0, 0, 0, 0);
        const primerDiaSiguienteMes = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 1);
        
        const { data: movimientos, error } = await window.supabaseClient
            .from('movimientos_inventario')
            .select(`
                id,
                tipo_movimiento,
                cantidad,
                motivo,
                referencia,
                notas,
                fecha,
                productos:producto_id(
                    nombre,
                    codigo_interno,
                    codigo_barras
                )
            `)
            .gte('fecha', primerDiaMes.toISOString())
            .lt('fecha', primerDiaSiguienteMes.toISOString())
            .order('fecha', { ascending: false });

        if (error) {
            console.error('Error exportando reporte mensual:', error);
            alert('Error al exportar reporte mensual');
            return;
        }

        await exportMovimientosToCsv(movimientos || [], 'reporte_movimientos_mensual');
        showToast('Reporte mensual exportado correctamente', 'success');
        
    } catch (error) {
        console.error('Error exportando reporte mensual:', error);
        alert('Error al exportar reporte mensual');
    }
}

// ===== Exportación CSV: Reporte por Producto =====
async function exportProductReport() {
    try {
        if (!window.db) return alert('Servicio no disponible');
        
        // Obtener el producto seleccionado del filtro
        const productoFilter = filterProduct?.value || '';
        
        if (!productoFilter) {
            alert('Por favor seleccione un producto del filtro "Producto" para generar el reporte');
            return;
        }

        // Buscar el producto por código
        const { data: productos, error: prodError } = await window.supabaseClient
            .from('productos')
            .select('id, nombre, codigo_interno, codigo_barras')
            .or(`codigo_interno.eq.${productoFilter},codigo_barras.eq.${productoFilter}`)
            .is('deleted_at', null)
            .limit(1);

        if (prodError || !productos || productos.length === 0) {
            alert('Producto no encontrado');
            return;
        }

        const productoId = productos[0].id;
        
        // Obtener todos los movimientos del producto
        const { data: movimientos, error } = await window.supabaseClient
            .from('movimientos_inventario')
            .select(`
                id,
                tipo_movimiento,
                cantidad,
                motivo,
                referencia,
                notas,
                fecha,
                productos:producto_id(
                    nombre,
                    codigo_interno,
                    codigo_barras
                )
            `)
            .eq('producto_id', productoId)
            .order('fecha', { ascending: false });

        if (error) {
            console.error('Error exportando reporte por producto:', error);
            alert('Error al exportar reporte por producto');
            return;
        }

        const nombreProducto = productos[0].nombre || 'producto';
        const codigoProducto = productos[0].codigo_interno || productos[0].codigo_barras || '';
        const nombreArchivo = `reporte_movimientos_producto_${codigoProducto}`.replace(/[^a-zA-Z0-9_]/g, '_');
        
        await exportMovimientosToCsv(movimientos || [], nombreArchivo);
        showToast(`Reporte del producto "${nombreProducto}" exportado correctamente`, 'success');
        
    } catch (error) {
        console.error('Error exportando reporte por producto:', error);
        alert('Error al exportar reporte por producto');
    }
}

async function exportMovimientosCsv() {
    try {
        if (!window.db) return alert('Servicio no disponible');
        
        const { data: movimientos, error } = await window.supabaseClient
            .from('movimientos_inventario')
            .select(`
                id,
                tipo_movimiento,
                cantidad,
                motivo,
                referencia,
                notas,
                fecha,
                productos:producto_id(
                    nombre,
                    codigo_interno,
                    codigo_barras
                )
            `)
            .order('fecha', { ascending: false });

        if (error) {
            console.error('Error exportando movimientos:', error);
            alert('Error al exportar movimientos');
            return;
        }

        await exportMovimientosToCsv(movimientos || [], 'movimientos_inventario');
        showToast('Todos los movimientos exportados correctamente', 'success');
        
    } catch (error) {
        console.error('Error exportando CSV:', error);
        alert('Error al exportar CSV');
    }
}

function csvEscape(str) {
    if (str === null || str === undefined) return '';
    const s = String(str);
    if (s.includes(',') || s.includes('"') || s.includes('\n')) {
        return '"' + s.replace(/"/g, '""') + '"';
    }
    return s;
}

// ================================================
// INICIALIZACIÓN
// ================================================

document.addEventListener('DOMContentLoaded', initMovimientos);

// Exportar funciones globales
window.verDetallesMovimiento = verDetallesMovimiento;
window.exportMovimientosCsv = exportMovimientosCsv;
window.exportDailyReport = exportDailyReport;
window.exportMonthlyReport = exportMonthlyReport;
window.exportProductReport = exportProductReport;
