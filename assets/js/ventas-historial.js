// ===== HISTORIAL DE VENTAS - SISTEMA ADS-POS =====
(function () {
    'use strict';

    // ===== FUNCIONES DE UTILIDAD =====
    
    /**
     * Formatea un valor numérico como moneda colombiana (COP)
     * @param {number} value - Valor a formatear
     * @returns {string} - Valor formateado como moneda
     */
    function formatCOP(value) {
        if (value === null || value === undefined || isNaN(value)) return '$ 0';
        return new Intl.NumberFormat('es-CO', {
            style: 'currency',
            currency: 'COP',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(value);
    }

    /**
     * Formatea una fecha en formato corto (DD MMM YYYY)
     * @param {Date|string} date - Fecha a formatear
     * @returns {string} - Fecha formateada
     */
    function formatDateShort(date) {
        if (!date) return '—';
        const d = new Date(date);
        const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
        const dia = d.getDate();
        const mes = meses[d.getMonth()];
        const año = d.getFullYear();
        return `${dia} ${mes} ${año}`;
    }

    /**
     * Obtiene el mejor día del mes (día con mayor ingreso)
     * @param {Array} ventas - Array de ventas del mes
     * @returns {Object|null} - Objeto con fecha y monto del mejor día, o null si no hay ventas
     */
    function obtenerMejorDia(ventas) {
        if (!ventas || ventas.length === 0) return null;

        // Agrupar ventas por día
        const ventasPorDia = {};
        
        ventas.forEach(venta => {
            const fechaVenta = new Date(venta.fecha_venta);
            const fechaKey = fechaVenta.toISOString().split('T')[0]; // YYYY-MM-DD
            
            if (!ventasPorDia[fechaKey]) {
                ventasPorDia[fechaKey] = {
                    fecha: fechaVenta,
                    total: 0
                };
            }
            
            ventasPorDia[fechaKey].total += Number(venta.total) || 0;
        });

        // Encontrar el día con mayor ingreso
        let mejorDia = null;
        let mayorTotal = 0;

        Object.values(ventasPorDia).forEach(dia => {
            if (dia.total > mayorTotal) {
                mayorTotal = dia.total;
                mejorDia = dia;
            }
        });

        return mejorDia ? {
            fecha: mejorDia.fecha,
            monto: mayorTotal
        } : null;
    }

    // ===== FUNCIONES PARA KPIs =====

    /**
     * Actualiza los KPIs del historial de ventas con datos del mes actual
     */
    async function actualizarKPIsHistorial() {
        try {
            if (!window.db) {
                console.warn('DatabaseService no está disponible');
                return;
            }

            // Obtener elementos de los KPIs
            const kpiTotalVentas = document.getElementById('kpiTotalVentasMes');
            const kpiIngresos = document.getElementById('kpiIngresosMes');
            const kpiPromedio = document.getElementById('kpiPromedioMes');
            const kpiMejorDiaMonto = document.getElementById('kpiMejorDiaMonto');
            const kpiMejorDiaFecha = document.getElementById('kpiMejorDiaFecha');

            // Mostrar indicador de carga
            if (kpiTotalVentas) kpiTotalVentas.textContent = '...';
            if (kpiIngresos) kpiIngresos.textContent = '...';
            if (kpiPromedio) kpiPromedio.textContent = '...';
            if (kpiMejorDiaMonto) kpiMejorDiaMonto.textContent = '...';
            if (kpiMejorDiaFecha) kpiMejorDiaFecha.textContent = '...';

            // Obtener fecha de inicio y fin del mes actual
            const ahora = new Date();
            const inicioMes = new Date(ahora.getFullYear(), ahora.getMonth(), 1);
            inicioMes.setHours(0, 0, 0, 0);
            
            const finMes = new Date(ahora.getFullYear(), ahora.getMonth() + 1, 0);
            finMes.setHours(23, 59, 59, 999);

            const fechaInicio = inicioMes.toISOString();
            const fechaFin = finMes.toISOString();

            // Consultar estadísticas del mes actual
            const stats = await window.db.getVentasStats({
                fechaInicio: fechaInicio,
                fechaFin: fechaFin
            });

            if (stats.error) {
                console.error('Error obteniendo estadísticas del mes:', stats.error);
                // Restaurar placeholders en caso de error
                if (kpiTotalVentas) kpiTotalVentas.textContent = '—';
                if (kpiIngresos) kpiIngresos.textContent = '—';
                if (kpiPromedio) kpiPromedio.textContent = '—';
                if (kpiMejorDiaMonto) kpiMejorDiaMonto.textContent = '—';
                if (kpiMejorDiaFecha) kpiMejorDiaFecha.textContent = '—';
                return;
            }

            const data = stats.data || {};

            // Actualizar KPI: Total Ventas
            if (kpiTotalVentas) {
                kpiTotalVentas.textContent = data.totalVentas || 0;
            }

            // Actualizar KPI: Ingresos
            if (kpiIngresos) {
                kpiIngresos.textContent = formatCOP(data.totalMonto || 0);
            }

            // Actualizar KPI: Promedio
            if (kpiPromedio) {
                kpiPromedio.textContent = formatCOP(data.promedio || 0);
            }

            // Para obtener el mejor día, necesitamos consultar todas las ventas del mes
            // ya que getVentasStats solo devuelve agregados
            try {
                const { data: ventasMes, error: errorVentas } = await window.db.supabase
                    .from('ventas')
                    .select('fecha_venta, total')
                    .eq('estado', 'completada')
                    .is('deleted_at', null)
                    .gte('fecha_venta', fechaInicio)
                    .lte('fecha_venta', fechaFin);

                if (!errorVentas && ventasMes && ventasMes.length > 0) {
                    const mejorDia = obtenerMejorDia(ventasMes);
                    
                    if (mejorDia) {
                        if (kpiMejorDiaMonto) {
                            kpiMejorDiaMonto.textContent = formatCOP(mejorDia.monto);
                        }
                        if (kpiMejorDiaFecha) {
                            kpiMejorDiaFecha.textContent = formatDateShort(mejorDia.fecha);
                        }
                    } else {
                        if (kpiMejorDiaMonto) kpiMejorDiaMonto.textContent = '—';
                        if (kpiMejorDiaFecha) kpiMejorDiaFecha.textContent = '—';
                    }
                } else {
                    if (kpiMejorDiaMonto) kpiMejorDiaMonto.textContent = '—';
                    if (kpiMejorDiaFecha) kpiMejorDiaFecha.textContent = '—';
                }
            } catch (error) {
                console.error('Error obteniendo mejor día:', error);
                if (kpiMejorDiaMonto) kpiMejorDiaMonto.textContent = '—';
                if (kpiMejorDiaFecha) kpiMejorDiaFecha.textContent = '—';
            }

        } catch (error) {
            console.error('Error actualizando KPIs del historial:', error);
        }
    }

    /**
     * Actualiza la sección "Estadísticas por Período" con datos reales desde la base de datos.
     * Períodos: Hoy, Esta Semana (lunes a hoy), Este Mes, Promedio Diario (del mes).
     */
    async function actualizarEstadisticasPorPeriodo() {
        try {
            if (!window.db) {
                console.warn('DatabaseService no está disponible');
                return;
            }

            const hoyVentas = document.getElementById('estadisticaHoyVentas');
            const hoyTotal = document.getElementById('estadisticaHoyTotal');
            const semanaVentas = document.getElementById('estadisticaSemanaVentas');
            const semanaTotal = document.getElementById('estadisticaSemanaTotal');
            const mesVentas = document.getElementById('estadisticaMesVentas');
            const mesTotal = document.getElementById('estadisticaMesTotal');
            const promedioVentas = document.getElementById('estadisticaPromedioVentas');
            const promedioTotal = document.getElementById('estadisticaPromedioTotal');

            const setPlaceholder = () => {
                [hoyVentas, hoyTotal, semanaVentas, semanaTotal, mesVentas, mesTotal, promedioVentas, promedioTotal].forEach(el => {
                    if (el) el.textContent = '—';
                });
            };

            const setLoading = () => {
                if (hoyVentas) hoyVentas.textContent = '...';
                if (hoyTotal) hoyTotal.textContent = '...';
                if (semanaVentas) semanaVentas.textContent = '...';
                if (semanaTotal) semanaTotal.textContent = '...';
                if (mesVentas) mesVentas.textContent = '...';
                if (mesTotal) mesTotal.textContent = '...';
                if (promedioVentas) promedioVentas.textContent = '...';
                if (promedioTotal) promedioTotal.textContent = '...';
            };

            setLoading();

            const ahora = new Date();
            const y = ahora.getFullYear();
            const m = ahora.getMonth();
            const d = ahora.getDate();

            // Hoy: inicio y fin del día en hora local
            const inicioHoy = new Date(y, m, d, 0, 0, 0, 0);
            const finHoy = new Date(y, m, d, 23, 59, 59, 999);

            // Esta semana: lunes 00:00:00 de la semana actual hasta fin de hoy
            const diaSemana = ahora.getDay(); // 0=domingo, 1=lunes, ...
            const diffLunes = diaSemana === 0 ? -6 : 1 - diaSemana; // días hacia atrás hasta el lunes
            const lunes = new Date(ahora);
            lunes.setDate(ahora.getDate() + diffLunes);
            const inicioSemana = new Date(lunes.getFullYear(), lunes.getMonth(), lunes.getDate(), 0, 0, 0, 0);
            const finSemana = finHoy;

            // Este mes: primer día 00:00:00 hasta último día 23:59:59
            const inicioMes = new Date(y, m, 1, 0, 0, 0, 0);
            const ultimoDiaMes = new Date(y, m + 1, 0);
            const finMes = new Date(y, m, ultimoDiaMes.getDate(), 23, 59, 59, 999);

            const fechaInicioHoy = inicioHoy.toISOString();
            const fechaFinHoy = finHoy.toISOString();
            const fechaInicioSemana = inicioSemana.toISOString();
            const fechaFinSemana = finSemana.toISOString();
            const fechaInicioMes = inicioMes.toISOString();
            const fechaFinMes = finMes.toISOString();

            const [statsHoy, statsSemana, statsMes] = await Promise.all([
                window.db.getVentasStats({ fechaInicio: fechaInicioHoy, fechaFin: fechaFinHoy }),
                window.db.getVentasStats({ fechaInicio: fechaInicioSemana, fechaFin: fechaFinSemana }),
                window.db.getVentasStats({ fechaInicio: fechaInicioMes, fechaFin: fechaFinMes })
            ]);

            if (statsHoy.error || statsSemana.error || statsMes.error) {
                setPlaceholder();
                return;
            }

            const dataHoy = statsHoy.data || {};
            const dataSemana = statsSemana.data || {};
            const dataMes = statsMes.data || {};

            if (hoyVentas) hoyVentas.textContent = dataHoy.totalVentas ?? 0;
            if (hoyTotal) hoyTotal.textContent = formatCOP(dataHoy.totalMonto ?? 0);
            if (semanaVentas) semanaVentas.textContent = dataSemana.totalVentas ?? 0;
            if (semanaTotal) semanaTotal.textContent = formatCOP(dataSemana.totalMonto ?? 0);
            if (mesVentas) mesVentas.textContent = dataMes.totalVentas ?? 0;
            if (mesTotal) mesTotal.textContent = formatCOP(dataMes.totalMonto ?? 0);

            // Promedio diario: basado en el mes actual (ventas y monto / días transcurridos del mes)
            const diasTranscurridos = Math.max(1, d);
            const promVentas = (dataMes.totalVentas ?? 0) / diasTranscurridos;
            const promMonto = (dataMes.totalMonto ?? 0) / diasTranscurridos;
            if (promedioVentas) promedioVentas.textContent = Number.isInteger(promVentas) ? promVentas : promVentas.toFixed(1);
            if (promedioTotal) promedioTotal.textContent = formatCOP(promMonto);

        } catch (error) {
            console.error('Error actualizando estadísticas por período:', error);
            const setPlaceholder = () => {
                ['estadisticaHoyVentas', 'estadisticaHoyTotal', 'estadisticaSemanaVentas', 'estadisticaSemanaTotal',
                    'estadisticaMesVentas', 'estadisticaMesTotal', 'estadisticaPromedioVentas', 'estadisticaPromedioTotal'].forEach(id => {
                    const el = document.getElementById(id);
                    if (el) el.textContent = '—';
                });
            };
            setPlaceholder();
        }
    }

    /**
     * Actualiza la sección "Top Vendedores" con datos reales.
     * Por defecto usa el mes actual (hasta hoy). Si el usuario define rango (Fecha desde/hasta),
     * se usa ese rango.
     */
    async function actualizarTopVendedores() {
        try {
            if (!window.db || !window.db.supabase) return;

            const container = document.getElementById('topVendedoresList');
            if (!container) return;

            container.innerHTML = `
                <div class="col-12">
                    <div class="text-center py-3 text-white-50">Cargando top vendedores...</div>
                </div>
            `;

            const filtros = obtenerFiltros();

            // Definir rango
            const now = new Date();
            const y = now.getFullYear();
            const m = now.getMonth();
            const d = now.getDate();

            let inicio;
            let fin;

            if (filtros.dateFrom || filtros.dateTo) {
                if (filtros.dateFrom) inicio = parseLocalDate(filtros.dateFrom);
                if (filtros.dateTo) fin = parseLocalDateEndOfDay(filtros.dateTo);

                // Si solo viene uno, completar el otro con el mismo día
                if (inicio && !fin) fin = new Date(inicio.getFullYear(), inicio.getMonth(), inicio.getDate(), 23, 59, 59, 999);
                if (!inicio && fin) inicio = new Date(fin.getFullYear(), fin.getMonth(), fin.getDate(), 0, 0, 0, 0);
            } else {
                // Mes actual hasta hoy
                inicio = new Date(y, m, 1, 0, 0, 0, 0);
                fin = new Date(y, m, d, 23, 59, 59, 999);
            }

            const fechaInicio = inicio.toISOString();
            const fechaFin = fin.toISOString();

            // Traer ventas en bloques para poder agrupar (evita depender de GROUP BY/RPC)
            const pageSize = 1000;
            const maxRows = 10000;
            let offset = 0;
            let allRows = [];

            while (offset < maxRows) {
                const { data, error } = await window.db.supabase
                    .from('ventas')
                    .select('usuario_id, total')
                    .eq('estado', 'completada')
                    .is('deleted_at', null)
                    .gte('fecha_venta', fechaInicio)
                    .lte('fecha_venta', fechaFin)
                    .range(offset, offset + pageSize - 1);

                if (error) {
                    console.error('Error cargando ventas para top vendedores:', error);
                    break;
                }

                if (!data || data.length === 0) break;

                allRows = allRows.concat(data);
                if (data.length < pageSize) break;
                offset += pageSize;
            }

            if (!allRows || allRows.length === 0) {
                container.innerHTML = `
                    <div class="col-12">
                        <div class="text-center py-3 text-white-50">No hay ventas en el período seleccionado.</div>
                    </div>
                `;
                return;
            }

            // Agrupar por usuario_id
            const agg = new Map();
            for (const row of allRows) {
                const uid = row.usuario_id || 'sin_usuario';
                const prev = agg.get(uid) || { usuario_id: uid, ventas: 0, monto: 0 };
                prev.ventas += 1;
                prev.monto += Number(row.total) || 0;
                agg.set(uid, prev);
            }

            // Ordenar por monto desc
            const ranking = Array.from(agg.values())
                .filter(x => x.usuario_id !== 'sin_usuario')
                .sort((a, b) => b.monto - a.monto)
                .slice(0, 4);

            if (ranking.length === 0) {
                container.innerHTML = `
                    <div class="col-12">
                        <div class="text-center py-3 text-white-50">No se encontraron vendedores para el período.</div>
                    </div>
                `;
                return;
            }

            const userIds = ranking.map(r => r.usuario_id);
            const { data: usuarios, error: errUsuarios } = await window.db.supabase
                .from('usuarios')
                .select('id, nombre_completo, usuario, email, rol')
                .in('id', userIds)
                .is('deleted_at', null);

            if (errUsuarios) {
                console.error('Error cargando usuarios para top vendedores:', errUsuarios);
            }

            const usuariosById = new Map((usuarios || []).map(u => [u.id, u]));
            const colors = ['primary', 'success', 'info', 'warning', 'danger', 'secondary'];

            container.innerHTML = ranking.map((r, idx) => {
                const u = usuariosById.get(r.usuario_id);
                const nombre = u?.nombre_completo || u?.usuario || u?.email || '—';
                const rolRaw = String(u?.rol || '').toLowerCase();
                const rolLabel =
                    rolRaw === 'admin' ? 'Administrador' :
                    rolRaw === 'cajero' ? 'Cajero' :
                    rolRaw === 'vendedor' ? 'Vendedor' :
                    (u?.rol || 'Usuario');

                const color = colors[idx % colors.length];

                return `
                    <div class="col-12 col-lg-6">
                        <div class="d-flex justify-content-between align-items-center p-3 border rounded">
                            <div class="d-flex align-items-center">
                                <div class="bg-${color} rounded-circle d-flex align-items-center justify-content-center me-3" style="width: 40px; height: 40px;">
                                    <i class="fas fa-user text-white"></i>
                                </div>
                                <div>
                                    <strong>${escapeHtml(nombre)}</strong><br>
                                    <small class="text-white-50">${escapeHtml(rolLabel)}</small>
                                </div>
                            </div>
                            <div class="text-end">
                                <strong>${formatCOP(r.monto)}</strong><br>
                                <small class="text-white-50">${r.ventas} ventas</small>
                            </div>
                        </div>
                    </div>
                `;
            }).join('');
        } catch (e) {
            console.error('Error en actualizarTopVendedores:', e);
            const container = document.getElementById('topVendedoresList');
            if (container) {
                container.innerHTML = `
                    <div class="col-12">
                        <div class="text-center py-3 text-white-50">No fue posible cargar el top de vendedores.</div>
                    </div>
                `;
            }
        }
    }

    function escapeHtml(value) {
        return String(value ?? '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/\"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    // ===== FUNCIONES DE AUTocompletado DE BÚSQUEDA =====

    let isInteractingWithSalesSearchSuggestions = false;
    let salesSearchSelectedIndex = -1;
    let searchTimeout = null;

    /**
     * Muestra las sugerencias de búsqueda de ventas
     * @param {Array} suggestions - Array de ventas sugeridas
     * @param {HTMLElement} inputElement - Elemento input que disparó la búsqueda
     */
    function showSalesSearchSuggestions(suggestions, inputElement) {
        const container = document.getElementById('salesSearchSuggestionsFixed');
        if (!container) return;

        container.style.backgroundColor = 'white';
        container.style.border = '1px solid #dee2e6';
        container.style.borderRadius = '0.375rem';
        container.style.boxShadow = '0 0.5rem 1rem rgba(0, 0, 0, 0.15)';
        container.style.maxHeight = '300px';
        container.style.overflowY = 'auto';

        if (!suggestions || suggestions.length === 0) {
            container.innerHTML = '<div class="p-2 text-muted text-center">No se encontraron ventas</div>';
            container.style.display = 'block';
            positionSalesSearchSuggestions(container, inputElement);
            return;
        }

        container.innerHTML = suggestions.map(venta => {
            const clienteNombre = venta.clientes?.nombre_completo || 'Cliente General';
            const clienteDoc = venta.clientes?.tipo_id && venta.clientes?.numero_id
                ? `${venta.clientes.tipo_id} ${venta.clientes.numero_id}`
                : '';
            const vendedorNombre = venta.usuarios?.nombre_completo || venta.usuarios?.usuario || venta.usuarios?.email || '—';
            const fecha = new Date(venta.fecha_venta);
            const fechaFormateada = fecha.toLocaleDateString('es-CO', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit'
            });
            
            return `
                <div class="p-2 border-bottom sales-search-suggestion-item" 
                     style="cursor: pointer;" 
                     data-venta-id="${venta.id}"
                     data-numero-venta="${venta.numero_venta || ''}"
                     data-cliente="${clienteNombre}"
                     data-vendedor="${vendedorNombre}">
                    <div class="fw-bold">${venta.numero_venta || 'Sin número'}</div>
                    <small class="text-muted">Cliente: ${clienteNombre}${clienteDoc ? ` (${clienteDoc})` : ''}</small>
                    <small class="text-muted d-block">Vendedor: ${vendedorNombre} - ${fechaFormateada} - ${formatCOP(Number(venta.total) || 0)}</small>
                </div>
            `;
        }).join('');

        // Agregar event listeners a los items
        container.querySelectorAll('.sales-search-suggestion-item').forEach((item, index) => {
            item.addEventListener('mouseenter', function() {
                salesSearchSelectedIndex = index;
                highlightSalesSearchItem(container.querySelectorAll('.sales-search-suggestion-item'), index);
            });
            item.addEventListener('click', function() {
                selectSalesSearch(item);
            });
        });

        container.style.display = 'block';
        positionSalesSearchSuggestions(container, inputElement);
    }

    /**
     * Resalta un item de las sugerencias
     * @param {NodeList} items - Lista de items
     * @param {number} index - Índice del item a resaltar
     */
    function highlightSalesSearchItem(items, index) {
        items.forEach((item, i) => {
            if (i === index) {
                item.style.backgroundColor = '#f8f9fa';
            } else {
                item.style.backgroundColor = '';
            }
        });
    }

    /**
     * Oculta las sugerencias de búsqueda de ventas
     * @param {boolean} force - Si es true, fuerza el ocultamiento
     */
    function hideSalesSearchSuggestions(force = false) {
        if (!force && isInteractingWithSalesSearchSuggestions) return;
        const container = document.getElementById('salesSearchSuggestionsFixed');
        if (container) {
            container.style.display = 'none';
            salesSearchSelectedIndex = -1;
            isInteractingWithSalesSearchSuggestions = false;
        }
    }

    /**
     * Posiciona las sugerencias debajo del input
     * @param {HTMLElement} container - Contenedor de sugerencias
     * @param {HTMLElement} inputElement - Elemento input
     */
    function positionSalesSearchSuggestions(container, inputElement) {
        const inputRect = inputElement.getBoundingClientRect();
        container.style.position = 'fixed';
        container.style.top = `${inputRect.bottom}px`;
        container.style.left = `${inputRect.left}px`;
        container.style.width = `${inputRect.width}px`;
        container.style.zIndex = '1050';
    }

    /**
     * Selecciona una venta de las sugerencias
     * @param {HTMLElement} item - Elemento HTML del item seleccionado
     */
    function selectSalesSearch(item) {
        const ventaId = item.getAttribute('data-venta-id');
        const numeroVenta = item.getAttribute('data-numero-venta');
        const cliente = item.getAttribute('data-cliente');
        const vendedor = item.getAttribute('data-vendedor');

        const searchInput = document.getElementById('searchTerm');
        if (searchInput) {
            // Mostrar información de la venta seleccionada
            searchInput.value = numeroVenta || '';
        }

        // Ocultar sugerencias
        hideSalesSearchSuggestions();

        // Recargar ventas con el filtro aplicado (el searchTerm ya está actualizado)
        currentPageHistorial = 1;
        cargarHistorialVentas();
    }

    /**
     * Busca ventas según el término de búsqueda usando LIKE en la base de datos
     * @param {string} query - Término de búsqueda
     */
    async function searchSales(query) {
        if (!query || query.length < 2) {
            hideSalesSearchSuggestions();
            return;
        }

        if (!window.db || !window.db.supabase) {
            console.error('No hay conexión con el servicio');
            return;
        }

        try {
            const searchTerm = query.trim();

            // Construir la consulta con filtros LIKE en múltiples campos
            // Necesitamos hacer una consulta que busque en:
            // - numero_venta (directo en ventas)
            // - clientes.nombre_completo (a través de JOIN)
            // - clientes.numero_id (a través de JOIN)
            // - usuarios.nombre_completo, usuario, email (a través de JOIN)

            // Primero, buscar por numero_venta directamente
            let queryBuilder = window.db.supabase
                .from('ventas')
                .select(`
                    id,
                    numero_venta,
                    fecha_venta,
                    total,
                    clientes:cliente_id(
                        nombre_completo,
                        tipo_id,
                        numero_id
                    ),
                    usuarios:usuario_id(
                        nombre_completo,
                        usuario,
                        email
                    )
                `)
                .is('deleted_at', null)
                .ilike('numero_venta', `%${searchTerm}%`)
                .order('fecha_venta', { ascending: false })
                .limit(10);

            const { data: ventasPorNumero, error: errorNumero } = await queryBuilder;

            // Buscar clientes que coincidan con el término
            const { data: clientesCoincidentes, error: errorClientes } = await window.db.supabase
                .from('clientes')
                .select('id')
                .or(`nombre_completo.ilike.%${searchTerm}%,numero_id.ilike.%${searchTerm}%`)
                .is('deleted_at', null)
                .limit(50);

            // Buscar usuarios que coincidan con el término
            const { data: usuariosCoincidentes, error: errorUsuarios } = await window.db.supabase
                .from('usuarios')
                .select('id')
                .or(`nombre_completo.ilike.%${searchTerm}%,usuario.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`)
                .is('deleted_at', null)
                .limit(50);

            // Si hay errores críticos, retornar
            if (errorNumero && errorClientes && errorUsuarios) {
                console.error('Error buscando ventas:', errorNumero || errorClientes || errorUsuarios);
                return;
            }

            // Obtener IDs de clientes y usuarios que coinciden
            const clienteIds = (clientesCoincidentes || []).map(c => c.id);
            const usuarioIds = (usuariosCoincidentes || []).map(u => u.id);

            // Combinar resultados: ventas por número + ventas por cliente + ventas por usuario
            const ventasIdsEncontradas = new Set();
            const ventasEncontradas = [];

            // Agregar ventas encontradas por número
            if (ventasPorNumero && ventasPorNumero.length > 0) {
                ventasPorNumero.forEach(v => {
                    if (!ventasIdsEncontradas.has(v.id)) {
                        ventasIdsEncontradas.add(v.id);
                        ventasEncontradas.push(v);
                    }
                });
            }

            // Buscar ventas por cliente_id si hay clientes coincidentes
            if (clienteIds.length > 0) {
                const { data: ventasPorCliente, error: errorVentasCliente } = await window.db.supabase
                    .from('ventas')
                    .select(`
                        id,
                        numero_venta,
                        fecha_venta,
                        total,
                        clientes:cliente_id(
                            nombre_completo,
                            tipo_id,
                            numero_id
                        ),
                        usuarios:usuario_id(
                            nombre_completo,
                            usuario,
                            email
                        )
                    `)
                    .in('cliente_id', clienteIds)
                    .is('deleted_at', null)
                    .order('fecha_venta', { ascending: false })
                    .limit(10);

                if (ventasPorCliente && ventasPorCliente.length > 0) {
                    ventasPorCliente.forEach(v => {
                        if (!ventasIdsEncontradas.has(v.id)) {
                            ventasIdsEncontradas.add(v.id);
                            ventasEncontradas.push(v);
                        }
                    });
                }
            }

            // Buscar ventas por usuario_id si hay usuarios coincidentes
            if (usuarioIds.length > 0) {
                const { data: ventasPorUsuario, error: errorVentasUsuario } = await window.db.supabase
                    .from('ventas')
                    .select(`
                        id,
                        numero_venta,
                        fecha_venta,
                        total,
                        clientes:cliente_id(
                            nombre_completo,
                            tipo_id,
                            numero_id
                        ),
                        usuarios:usuario_id(
                            nombre_completo,
                            usuario,
                            email
                        )
                    `)
                    .in('usuario_id', usuarioIds)
                    .is('deleted_at', null)
                    .order('fecha_venta', { ascending: false })
                    .limit(10);

                if (ventasPorUsuario && ventasPorUsuario.length > 0) {
                    ventasPorUsuario.forEach(v => {
                        if (!ventasIdsEncontradas.has(v.id)) {
                            ventasIdsEncontradas.add(v.id);
                            ventasEncontradas.push(v);
                        }
                    });
                }
            }

            // Ordenar por fecha descendente y limitar a 10 resultados
            ventasEncontradas.sort((a, b) => {
                const fechaA = new Date(a.fecha_venta);
                const fechaB = new Date(b.fecha_venta);
                return fechaB - fechaA;
            });

            const ventasFiltradas = ventasEncontradas.slice(0, 10);

            const inputElement = document.getElementById('searchTerm');
            if (inputElement) {
                showSalesSearchSuggestions(ventasFiltradas, inputElement);
            }
        } catch (error) {
            console.error('Error en búsqueda de ventas:', error);
        }
    }


    /**
     * Función debounce para optimizar búsquedas
     * @param {Function} func - Función a ejecutar
     * @param {number} wait - Tiempo de espera en ms
     * @returns {Function} - Función con debounce aplicado
     */
    function debounceSearch(func, wait) {
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(searchTimeout);
                func(...args);
            };
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(later, wait);
        };
    }

    // ===== FUNCIONES DE FILTROS Y BÚSQUEDA =====

    /**
     * Aplica los filtros seleccionados a la tabla de ventas
     */
    function applyFilters() {
        const filterStatus = document.getElementById('filterStatus');
        const filterPayment = document.getElementById('filterPayment');
        const filterSeller = document.getElementById('filterSeller');
        const dateFrom = document.getElementById('dateFrom');
        const dateTo = document.getElementById('dateTo');
        const minAmount = document.getElementById('minAmount');
        const maxAmount = document.getElementById('maxAmount');
        const customerFilter = document.getElementById('customerFilter');
        
        if (!filterStatus || !filterPayment || !filterSeller) return;

        const status = filterStatus.value;
        const payment = filterPayment.value;
        const seller = filterSeller.value;
        const fromDate = dateFrom ? dateFrom.value : '';
        const toDate = dateTo ? dateTo.value : '';
        const min = parseFloat(minAmount ? minAmount.value : 0) || 0;
        const max = parseFloat(maxAmount ? maxAmount.value : 0) || Infinity;
        const customer = customerFilter ? customerFilter.value.toLowerCase() : '';
        const rows = document.querySelectorAll('#salesBody tr');
        
        rows.forEach(row => {
            const statusCell = row.cells[10] ? row.cells[10].textContent.trim() : '';
            const paymentCell = row.cells[9] ? row.cells[9].textContent.trim() : '';
            const sellerCell = row.cells[3] ? row.cells[3].textContent.trim() : '';
            const customerCell = row.cells[2] ? row.cells[2].textContent.toLowerCase() : '';
            const totalCell = row.cells[8] ? row.cells[8].textContent.replace(/[^0-9]/g, '') : '0';
            const total = parseFloat(totalCell) || 0;
            
            let showRow = true;
            
            if (status && !statusCell.toLowerCase().includes(status)) {
                showRow = false;
            }
            
            if (payment && !paymentCell.toLowerCase().includes(payment)) {
                showRow = false;
            }
            
            if (seller && !sellerCell.includes(seller)) {
                showRow = false;
            }
            
            if (customer && !customerCell.includes(customer)) {
                showRow = false;
            }
            
            if (total < min || total > max) {
                showRow = false;
            }
            
            row.style.display = showRow ? '' : 'none';
        });
    }

    /**
     * Realiza una búsqueda aplicando todos los filtros
     */
    function performSearch() {
        // Ocultar sugerencias si están visibles
        hideSalesSearchSuggestions();
        
        // Recargar ventas con los filtros aplicados
        currentPageHistorial = 1;
        cargarHistorialVentas();
        actualizarTopVendedores();
    }

    /**
     * Limpia todos los filtros y recarga las ventas sin filtros
     */
    function clearFilters() {
        const form = document.getElementById('salesHistoryForm');
        if (form) {
            form.reset();
        }
        
        // Restablecer fechas por defecto
        setDefaultDates();
        
        // Resetear paginación y recargar
        currentPageHistorial = 1;
        cargarHistorialVentas();
        actualizarTopVendedores();
    }

    /**
     * Carga los usuarios disponibles para el selector de vendedor
     */
    async function cargarUsuariosParaFiltro() {
        try {
            if (!window.db || !window.db.supabase) return;

            const filterSeller = document.getElementById('filterSeller');
            if (!filterSeller) return;

            const { data: usuarios, error } = await window.db.supabase
                .from('usuarios')
                .select('id, nombre_completo, usuario, email')
                .eq('activo', true)
                .is('deleted_at', null)
                .order('nombre_completo', { ascending: true });

            if (error) {
                console.error('Error cargando usuarios:', error);
                return;
            }

            // Limpiar opciones existentes (excepto "Todos")
            filterSeller.innerHTML = '<option value="">Todos</option>';

            // Agregar usuarios
            if (usuarios && usuarios.length > 0) {
                usuarios.forEach(usuario => {
                    const option = document.createElement('option');
                    option.value = usuario.id;
                    const displayName = usuario.nombre_completo || usuario.usuario || usuario.email || 'Sin nombre';
                    option.textContent = displayName;
                    filterSeller.appendChild(option);
                });
            }
        } catch (error) {
            console.error('Error en cargarUsuariosParaFiltro:', error);
        }
    }

    /**
     * Establece las fechas por defecto (última semana)
     */
    function setDefaultDates() {
        const dateFrom = document.getElementById('dateFrom');
        const dateTo = document.getElementById('dateTo');
        
        if (dateFrom && dateTo) {
            const today = new Date();
            const lastWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
            
            dateFrom.valueAsDate = lastWeek;
            dateTo.valueAsDate = today;
        }
    }

    // ===== FUNCIONES DE ACCIONES =====

    /**
     * Exporta el historial de ventas a Excel
     */
    function exportToExcel() {
        // TODO: Implementar exportación a Excel
        console.log('Exportando historial de ventas a Excel...');
    }

    /**
     * Genera un reporte para impresión
     */
    function printReport() {
        // TODO: Implementar generación de reporte para impresión
        console.log('Generando reporte para impresión...');
    }

    /**
     * Genera un reporte detallado de ventas
     */
    function generateReport() {
        // TODO: Implementar generación de reporte detallado
        console.log('Generando reporte detallado de ventas...');
    }

    /**
     * Actualiza el historial de ventas
     */
    function refreshHistory() {
        actualizarKPIsHistorial();
        actualizarEstadisticasPorPeriodo();
        actualizarTopVendedores();
        currentPageHistorial = 1; // Resetear a la primera página al actualizar
        cargarHistorialVentas();
    }

    // ===== FUNCIONES PARA CARGAR HISTORIAL DE VENTAS =====

    // Variables de paginación
    let currentPageHistorial = 1;
    let pageSizeHistorial = 10;
    let totalVentasCountHistorial = 0;

    /**
     * Parsea una fecha en formato YYYY-MM-DD a un objeto Date en hora local
     * @param {string} dateString - Fecha en formato YYYY-MM-DD
     * @returns {Date} - Objeto Date en hora local
     */
    function parseLocalDate(dateString) {
        if (!dateString) return null;
        const [year, month, day] = dateString.split('-').map(Number);
        // month - 1 porque los meses en Date van de 0-11
        return new Date(year, month - 1, day, 0, 0, 0, 0);
    }

    /**
     * Parsea una fecha en formato YYYY-MM-DD a un objeto Date en hora local al final del día
     * @param {string} dateString - Fecha en formato YYYY-MM-DD
     * @returns {Date} - Objeto Date en hora local al final del día (23:59:59.999)
     */
    function parseLocalDateEndOfDay(dateString) {
        if (!dateString) return null;
        const [year, month, day] = dateString.split('-').map(Number);
        // month - 1 porque los meses en Date van de 0-11
        return new Date(year, month - 1, day, 23, 59, 59, 999);
    }

    /**
     * Obtiene los valores de los filtros del formulario
     * @returns {Object} - Objeto con los valores de los filtros
     */
    function obtenerFiltros() {
        const searchTerm = document.getElementById('searchTerm');
        const filterStatus = document.getElementById('filterStatus');
        const filterPayment = document.getElementById('filterPayment');
        const filterSeller = document.getElementById('filterSeller');
        const dateFrom = document.getElementById('dateFrom');
        const dateTo = document.getElementById('dateTo');
        const minAmount = document.getElementById('minAmount');
        const maxAmount = document.getElementById('maxAmount');
        const customerFilter = document.getElementById('customerFilter');
        const sortBy = document.getElementById('sortBy');

        return {
            searchTerm: searchTerm ? searchTerm.value.trim() : '',
            status: filterStatus ? filterStatus.value : '',
            payment: filterPayment ? filterPayment.value : '',
            seller: filterSeller ? filterSeller.value : '',
            dateFrom: dateFrom ? dateFrom.value : '',
            dateTo: dateTo ? dateTo.value : '',
            minAmount: minAmount ? parseFloat(minAmount.value) || null : null,
            maxAmount: maxAmount ? parseFloat(maxAmount.value) || null : null,
            customerFilter: customerFilter ? customerFilter.value.trim() : '',
            sortBy: sortBy ? sortBy.value : 'fecha_desc'
        };
    }

    /**
     * Carga el historial de ventas desde la base de datos con paginación y filtros
     */
    async function cargarHistorialVentas() {
        try {
            if (!window.db || !window.db.supabase) {
                console.warn('Supabase no está disponible');
                mostrarErrorHistorial('Base de datos no disponible');
                return;
            }

            const salesBody = document.getElementById('salesBody');
            if (!salesBody) return;

            // Obtener filtros
            const filtros = obtenerFiltros();

            // Mostrar indicador de carga
            salesBody.innerHTML = `
                <tr>
                    <td colspan="12" class="text-center py-4">
                        <div class="spinner-border text-primary" role="status">
                            <span class="visually-hidden">Cargando...</span>
                        </div>
                        <p class="text-muted mt-2 mb-0">Cargando historial de ventas...</p>
                    </td>
                </tr>
            `;

            // Calcular offset para paginación
            const offset = (currentPageHistorial - 1) * pageSizeHistorial;

            // Construir la consulta base
            let query = window.db.supabase
                .from('ventas')
                .select(`
                    id,
                    numero_venta,
                    fecha_venta,
                    metodo_pago,
                    estado,
                    subtotal,
                    impuesto,
                    descuento,
                    total,
                    notas,
                    cliente_id,
                    usuario_id,
                    clientes:cliente_id(
                        nombre_completo,
                        tipo_id,
                        numero_id,
                        telefono,
                        email
                    ),
                    usuarios:usuario_id(
                        nombre_completo,
                        usuario,
                        email
                    )
                `, { count: 'exact' })
                .is('deleted_at', null);

            // Aplicar filtro de estado
            if (filtros.status) {
                query = query.eq('estado', filtros.status);
            }

            // Aplicar filtro de método de pago
            if (filtros.payment) {
                query = query.eq('metodo_pago', filtros.payment);
            }

            // Aplicar filtros de fecha
            if (filtros.dateFrom) {
                const fechaDesde = parseLocalDate(filtros.dateFrom);
                query = query.gte('fecha_venta', fechaDesde.toISOString());
            }

            if (filtros.dateTo) {
                const fechaHasta = parseLocalDateEndOfDay(filtros.dateTo);
                query = query.lte('fecha_venta', fechaHasta.toISOString());
            }

            // Aplicar filtro de monto mínimo y máximo
            if (filtros.minAmount !== null && filtros.minAmount !== undefined) {
                query = query.gte('total', filtros.minAmount);
            }

            if (filtros.maxAmount !== null && filtros.maxAmount !== undefined) {
                query = query.lte('total', filtros.maxAmount);
            }

            // Aplicar filtro de número de venta (si hay searchTerm)
            if (filtros.searchTerm) {
                query = query.ilike('numero_venta', `%${filtros.searchTerm}%`);
            }

            // Aplicar ordenamiento
            switch (filtros.sortBy) {
                case 'fecha_asc':
                    query = query.order('fecha_venta', { ascending: true });
                    break;
                case 'fecha_desc':
                default:
                    query = query.order('fecha_venta', { ascending: false });
                    break;
                case 'monto_asc':
                    query = query.order('total', { ascending: true });
                    break;
                case 'monto_desc':
                    query = query.order('total', { ascending: false });
                    break;
                case 'cliente':
                    // Para ordenar por cliente necesitamos hacer un ordenamiento adicional después
                    query = query.order('fecha_venta', { ascending: false });
                    break;
            }

            // Aplicar paginación
            query = query.range(offset, offset + pageSizeHistorial - 1);

            // Ejecutar consulta
            const { data: ventas, error, count } = await query;

            if (error) {
                console.error('Error cargando ventas:', error);
                mostrarErrorHistorial('Error al cargar el historial de ventas');
                return;
            }

            let ventasFiltradas = ventas || [];

            // Variables para IDs de clientes y usuarios (para filtros complejos)
            let clienteIdsSearch = [];
            let usuarioIdsSearch = [];
            const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

            // Obtener IDs de clientes y usuarios para filtros complejos ANTES de aplicar filtros
            // Esto nos permite usar estos IDs tanto para filtrar como para el count

            // Filtro por cliente (buscar clientes que coincidan)
            if (filtros.customerFilter) {
                const { data: clientesCoincidentes } = await window.db.supabase
                    .from('clientes')
                    .select('id')
                    .or(`nombre_completo.ilike.%${filtros.customerFilter}%,numero_id.ilike.%${filtros.customerFilter}%`)
                    .is('deleted_at', null)
                    .limit(100);

                if (clientesCoincidentes && clientesCoincidentes.length > 0) {
                    clienteIdsSearch = clientesCoincidentes.map(c => c.id);
                    ventasFiltradas = ventasFiltradas.filter(v => 
                        v.cliente_id && clienteIdsSearch.includes(v.cliente_id)
                    );
                } else {
                    ventasFiltradas = [];
                }
            }

            // Filtro por vendedor (si es un ID de usuario, filtrar directamente)
            if (filtros.seller) {
                if (uuidRegex.test(filtros.seller)) {
                    // Si es UUID, filtrar directamente
                    ventasFiltradas = ventasFiltradas.filter(v => 
                        v.usuario_id === filtros.seller
                    );
                } else {
                    // Si no es UUID, buscar usuarios que coincidan
                    const { data: usuariosCoincidentes } = await window.db.supabase
                        .from('usuarios')
                        .select('id')
                        .or(`nombre_completo.ilike.%${filtros.seller}%,usuario.ilike.%${filtros.seller}%,email.ilike.%${filtros.seller}%`)
                        .is('deleted_at', null)
                        .limit(100);

                    if (usuariosCoincidentes && usuariosCoincidentes.length > 0) {
                        usuarioIdsSearch = usuariosCoincidentes.map(u => u.id);
                        ventasFiltradas = ventasFiltradas.filter(v => 
                            v.usuario_id && usuarioIdsSearch.includes(v.usuario_id)
                        );
                    } else {
                        ventasFiltradas = [];
                    }
                }
            }

            // Si hay searchTerm, también buscar por cliente y vendedor (además de numero_venta que ya se aplicó)
            if (filtros.searchTerm && ventasFiltradas.length < 10) {
                // Buscar clientes que coincidan
                const { data: clientesSearch } = await window.db.supabase
                    .from('clientes')
                    .select('id')
                    .or(`nombre_completo.ilike.%${filtros.searchTerm}%,numero_id.ilike.%${filtros.searchTerm}%`)
                    .is('deleted_at', null)
                    .limit(50);

                // Buscar usuarios que coincidan
                const { data: usuariosSearch } = await window.db.supabase
                    .from('usuarios')
                    .select('id')
                    .or(`nombre_completo.ilike.%${filtros.searchTerm}%,usuario.ilike.%${filtros.searchTerm}%,email.ilike.%${filtros.searchTerm}%`)
                    .is('deleted_at', null)
                    .limit(50);

                clienteIdsSearch = (clientesSearch || []).map(c => c.id);
                usuarioIdsSearch = (usuariosSearch || []).map(u => u.id);

                // Buscar ventas adicionales por cliente o usuario
                if (clienteIdsSearch.length > 0 || usuarioIdsSearch.length > 0) {
                    let queryAdicional = window.db.supabase
                        .from('ventas')
                        .select(`
                            id,
                            numero_venta,
                            fecha_venta,
                            metodo_pago,
                            estado,
                            subtotal,
                            impuesto,
                            descuento,
                            total,
                            notas,
                            cliente_id,
                            usuario_id,
                            clientes:cliente_id(
                                nombre_completo,
                                tipo_id,
                                numero_id,
                                telefono,
                                email
                            ),
                            usuarios:usuario_id(
                                nombre_completo,
                                usuario,
                                email
                            )
                        `)
                        .is('deleted_at', null);

                    // Aplicar los mismos filtros base
                    if (filtros.status) queryAdicional = queryAdicional.eq('estado', filtros.status);
                    if (filtros.payment) queryAdicional = queryAdicional.eq('metodo_pago', filtros.payment);
                    if (filtros.dateFrom) {
                        const fechaDesde = parseLocalDate(filtros.dateFrom);
                        queryAdicional = queryAdicional.gte('fecha_venta', fechaDesde.toISOString());
                    }
                    if (filtros.dateTo) {
                        const fechaHasta = parseLocalDateEndOfDay(filtros.dateTo);
                        queryAdicional = queryAdicional.lte('fecha_venta', fechaHasta.toISOString());
                    }
                    if (filtros.minAmount !== null) queryAdicional = queryAdicional.gte('total', filtros.minAmount);
                    if (filtros.maxAmount !== null) queryAdicional = queryAdicional.lte('total', filtros.maxAmount);

                    // Filtrar por cliente o usuario
                    if (clienteIdsSearch.length > 0 && usuarioIdsSearch.length > 0) {
                        queryAdicional = queryAdicional.or(`cliente_id.in.(${clienteIdsSearch.join(',')}),usuario_id.in.(${usuarioIdsSearch.join(',')})`);
                    } else if (clienteIdsSearch.length > 0) {
                        queryAdicional = queryAdicional.in('cliente_id', clienteIdsSearch);
                    } else if (usuarioIdsSearch.length > 0) {
                        queryAdicional = queryAdicional.in('usuario_id', usuarioIdsSearch);
                    }

                    queryAdicional = queryAdicional.order('fecha_venta', { ascending: false })
                        .limit(50);

                    const { data: ventasAdicionales } = await queryAdicional;

                    if (ventasAdicionales && ventasAdicionales.length > 0) {
                        // Combinar resultados evitando duplicados
                        const ventasIdsExistentes = new Set(ventasFiltradas.map(v => v.id));
                        ventasAdicionales.forEach(v => {
                            if (!ventasIdsExistentes.has(v.id)) {
                                ventasFiltradas.push(v);
                                ventasIdsExistentes.add(v.id);
                            }
                        });
                    }
                }
            }

            // Ordenar por cliente si es necesario
            if (filtros.sortBy === 'cliente') {
                ventasFiltradas.sort((a, b) => {
                    const clienteA = (a.clientes?.nombre_completo || '').toLowerCase();
                    const clienteB = (b.clientes?.nombre_completo || '').toLowerCase();
                    return clienteA.localeCompare(clienteB);
                });
            }

            // Determinar si necesitamos calcular el count real (cuando hay filtros complejos)
            const tieneFiltrosComplejos = filtros.customerFilter || 
                                          (filtros.seller && uuidRegex.test(filtros.seller)) ||
                                          (filtros.seller && !uuidRegex.test(filtros.seller) && usuarioIdsSearch.length > 0) ||
                                          (filtros.searchTerm && (clienteIdsSearch.length > 0 || usuarioIdsSearch.length > 0));

            // Calcular el count real si hay filtros complejos
            if (tieneFiltrosComplejos) {
                // Construir consulta para count sin paginación
                let countQuery = window.db.supabase
                    .from('ventas')
                    .select('id', { count: 'exact', head: true })
                    .is('deleted_at', null);

                // Aplicar los mismos filtros base
                if (filtros.status) countQuery = countQuery.eq('estado', filtros.status);
                if (filtros.payment) countQuery = countQuery.eq('metodo_pago', filtros.payment);
                if (filtros.dateFrom) {
                    const fechaDesde = parseLocalDate(filtros.dateFrom);
                    countQuery = countQuery.gte('fecha_venta', fechaDesde.toISOString());
                }
                if (filtros.dateTo) {
                    const fechaHasta = parseLocalDateEndOfDay(filtros.dateTo);
                    countQuery = countQuery.lte('fecha_venta', fechaHasta.toISOString());
                }
                if (filtros.minAmount !== null && filtros.minAmount !== undefined) {
                    countQuery = countQuery.gte('total', filtros.minAmount);
                }
                if (filtros.maxAmount !== null && filtros.maxAmount !== undefined) {
                    countQuery = countQuery.lte('total', filtros.maxAmount);
                }
                if (filtros.searchTerm) {
                    countQuery = countQuery.ilike('numero_venta', `%${filtros.searchTerm}%`);
                }

                // Aplicar filtros de cliente
                if (filtros.customerFilter && clienteIdsSearch.length > 0) {
                    countQuery = countQuery.in('cliente_id', clienteIdsSearch);
                } else if (filtros.searchTerm && clienteIdsSearch.length > 0) {
                    // Si hay searchTerm que coincide con clientes, aplicar filtro
                    countQuery = countQuery.in('cliente_id', clienteIdsSearch);
                }

                // Aplicar filtros de vendedor
                if (filtros.seller) {
                    if (uuidRegex.test(filtros.seller)) {
                        countQuery = countQuery.eq('usuario_id', filtros.seller);
                    } else if (usuarioIdsSearch.length > 0) {
                        countQuery = countQuery.in('usuario_id', usuarioIdsSearch);
                    }
                } else if (filtros.searchTerm && usuarioIdsSearch.length > 0) {
                    // Si hay searchTerm que coincide con usuarios, aplicar filtro
                    countQuery = countQuery.in('usuario_id', usuarioIdsSearch);
                }

                // Si hay múltiples filtros de búsqueda (cliente y usuario), usar OR
                if (filtros.searchTerm && clienteIdsSearch.length > 0 && usuarioIdsSearch.length > 0) {
                    // Ya aplicamos el filtro de numero_venta arriba, ahora agregar OR para cliente y usuario
                    // Necesitamos hacer una consulta más compleja
                    const { count: countReal } = await countQuery;
                    totalVentasCountHistorial = countReal || 0;
                } else {
                    const { count: countReal } = await countQuery;
                    totalVentasCountHistorial = countReal || ventasFiltradas.length;
                }
            } else {
                // Si no hay filtros complejos, usar el count de la consulta inicial
                totalVentasCountHistorial = count || ventasFiltradas.length;
            }

            // Limitar a pageSizeHistorial después de todos los filtros
            ventasFiltradas = ventasFiltradas.slice(0, pageSizeHistorial);

            if (ventasFiltradas.length === 0) {
                salesBody.innerHTML = `
                    <tr>
                        <td colspan="12" class="text-center py-4">
                            <i class="fas fa-inbox fa-3x text-muted mb-3"></i>
                            <p class="text-muted mb-0">No se encontraron ventas con los filtros aplicados</p>
                        </td>
                    </tr>
                `;
                renderPaginationHistorial();
                actualizarInfoPaginacion();
                return;
            }

            // Obtener conteo de productos para cada venta
            const ventasConProductos = await Promise.all(
                ventasFiltradas.map(async (venta) => {
                    const { count } = await window.db.supabase
                        .from('ventas_detalle')
                        .select('*', { count: 'exact', head: true })
                        .eq('venta_id', venta.id);
                    
                    return {
                        ...venta,
                        cantidadProductos: count || 0
                    };
                })
            );

            // Renderizar tabla y paginación
            renderizarTablaVentas(ventasConProductos);
            renderPaginationHistorial();
            actualizarInfoPaginacion();

        } catch (error) {
            console.error('Error en cargarHistorialVentas:', error);
            mostrarErrorHistorial('Error inesperado al cargar el historial');
        }
    }

    /**
     * Actualiza la información de paginación mostrada al usuario
     */
    function actualizarInfoPaginacion() {
        const infoElement = document.getElementById('historialPaginationInfo');
        if (!infoElement) return;

        const inicio = totalVentasCountHistorial === 0 ? 0 : (currentPageHistorial - 1) * pageSizeHistorial + 1;
        const fin = Math.min(currentPageHistorial * pageSizeHistorial, totalVentasCountHistorial);
        
        infoElement.textContent = `Mostrando ${inicio} - ${fin} de ${totalVentasCountHistorial} ventas`;
    }

    /**
     * Renderiza los controles de paginación
     */
    function renderPaginationHistorial() {
        const container = document.getElementById('historialPagination');
        if (!container) return;

        container.innerHTML = '';

        const totalPages = Math.max(1, Math.ceil(totalVentasCountHistorial / pageSizeHistorial));

        if (totalPages <= 1) {
            return;
        }

        // Botón Previous
        const prevBtn = document.createElement('button');
        prevBtn.className = 'btn btn-sm btn-outline-light';
        prevBtn.type = 'button';
        prevBtn.disabled = currentPageHistorial <= 1;
        prevBtn.innerHTML = '<i class="fas fa-chevron-left me-1"></i>Anterior';
        prevBtn.onclick = async (e) => {
            e.preventDefault();
            if (currentPageHistorial > 1) {
                currentPageHistorial--;
                await cargarHistorialVentas();
            }
        };
        container.appendChild(prevBtn);

        // Indicador de página
        const pageInfo = document.createElement('span');
        pageInfo.className = 'text-white px-3';
        pageInfo.textContent = `Página ${currentPageHistorial} de ${totalPages}`;
        container.appendChild(pageInfo);

        // Botón Next
        const nextBtn = document.createElement('button');
        nextBtn.className = 'btn btn-sm btn-outline-light';
        nextBtn.type = 'button';
        nextBtn.disabled = currentPageHistorial >= totalPages;
        nextBtn.innerHTML = 'Siguiente<i class="fas fa-chevron-right ms-1"></i>';
        nextBtn.onclick = async (e) => {
            e.preventDefault();
            if (currentPageHistorial < totalPages) {
                currentPageHistorial++;
                await cargarHistorialVentas();
            }
        };
        container.appendChild(nextBtn);
    }

    /**
     * Renderiza la tabla de ventas
     * @param {Array} ventas - Array de ventas con información completa
     */
    function renderizarTablaVentas(ventas) {
        const salesBody = document.getElementById('salesBody');
        if (!salesBody) return;

        if (ventas.length === 0) {
            salesBody.innerHTML = `
                <tr>
                    <td colspan="12" class="text-center py-4">
                        <i class="fas fa-inbox fa-3x text-muted mb-3"></i>
                        <p class="text-muted mb-0">No hay ventas registradas</p>
                    </td>
                </tr>
            `;
            return;
        }

        salesBody.innerHTML = '';

        ventas.forEach(venta => {
            const tr = document.createElement('tr');
            
            // Formatear fecha
            const fecha = new Date(venta.fecha_venta);
            const fechaFormateada = fecha.toLocaleDateString('es-CO', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit'
            });
            const horaFormateada = fecha.toLocaleTimeString('es-CO', {
                hour: '2-digit',
                minute: '2-digit'
            });

            // Cliente
            const clienteNombre = venta.clientes?.nombre_completo || 'Cliente General';
            const clienteDoc = venta.clientes?.tipo_id && venta.clientes?.numero_id
                ? `${venta.clientes.tipo_id} ${venta.clientes.numero_id}`
                : '-';

            // Vendedor
            const vendedorNombre = venta.usuarios?.nombre_completo || venta.usuarios?.usuario || venta.usuarios?.email || '—';

            // Estado badge
            const estado = String(venta.estado || 'completada').toLowerCase();
            let estadoBadgeClass = 'bg-secondary';
            if (estado === 'completada') estadoBadgeClass = 'bg-success';
            else if (estado === 'pendiente') estadoBadgeClass = 'bg-warning';
            else if (estado === 'cancelada') estadoBadgeClass = 'bg-danger';
            else if (estado === 'reembolsada') estadoBadgeClass = 'bg-info';

            // Método de pago badge
            const metodo = String(venta.metodo_pago || 'efectivo').toLowerCase();
            let metodoBadgeClass = 'bg-secondary';
            if (metodo === 'efectivo') metodoBadgeClass = 'bg-success';
            else if (metodo === 'tarjeta') metodoBadgeClass = 'bg-primary';
            else if (metodo === 'transferencia') metodoBadgeClass = 'bg-info';
            else if (metodo === 'mixto') metodoBadgeClass = 'bg-warning';

            tr.innerHTML = `
                <td>
                    <strong>${venta.numero_venta || '—'}</strong>
                </td>
                <td>
                    <div>
                        <strong>${fechaFormateada}</strong><br>
                        <small class="text-white-50">${horaFormateada}</small>
                    </div>
                </td>
                <td>
                    <div>
                        <strong>${clienteNombre}</strong><br>
                        <small class="text-white-50">${clienteDoc}</small>
                    </div>
                </td>
                <td>${vendedorNombre}</td>
                <td>
                    <span class="badge bg-info">${venta.cantidadProductos || 0} producto${venta.cantidadProductos !== 1 ? 's' : ''}</span>
                </td>
                <td class="text-end">${formatCOP(Number(venta.subtotal) || 0)}</td>
                <td class="text-end text-success">${formatCOP(Number(venta.descuento) || 0)}</td>
                <td class="text-end">${formatCOP(Number(venta.impuesto) || 0)}</td>
                <td class="text-end fw-bold text-primary">${formatCOP(Number(venta.total) || 0)}</td>
                <td><span class="badge ${metodoBadgeClass}">${venta.metodo_pago || '—'}</span></td>
                <td><span class="badge ${estadoBadgeClass}">${venta.estado || '—'}</span></td>
                <td>
                    <button type="button" class="btn btn-sm btn-outline-info" title="Ver detalles" onclick="verDetalleVenta('${venta.id}')">
                        <i class="fas fa-eye"></i>
                    </button>
                </td>
            `;
            
            salesBody.appendChild(tr);
        });
    }

    /**
     * Muestra un mensaje de error en la tabla
     * @param {string} mensaje - Mensaje de error a mostrar
     */
    function mostrarErrorHistorial(mensaje) {
        const salesBody = document.getElementById('salesBody');
        if (salesBody) {
            salesBody.innerHTML = `
                <tr>
                    <td colspan="12" class="text-center py-4">
                        <i class="fas fa-exclamation-triangle fa-3x text-warning mb-3"></i>
                        <p class="text-muted mb-0">${mensaje}</p>
                    </td>
                </tr>
            `;
        }
    }

    /**
     * Muestra el detalle de una venta en el modal
     * @param {string} ventaId - ID de la venta a mostrar
     */
    window.verDetalleVenta = async function(ventaId) {
        try {
            if (!ventaId || !window.db || !window.db.supabase) {
                alert('Error: No se pudo cargar la información de la venta');
                return;
            }

            // Obtener venta con relaciones
            const { data: venta, error: ventaError } = await window.db.supabase
                .from('ventas')
                .select(`
                    id,
                    numero_venta,
                    fecha_venta,
                    metodo_pago,
                    estado,
                    subtotal,
                    impuesto,
                    descuento,
                    total,
                    notas,
                    clientes:cliente_id(
                        nombre_completo,
                        tipo_id,
                        numero_id,
                        telefono,
                        email
                    ),
                    usuarios:usuario_id(
                        nombre_completo,
                        usuario,
                        email
                    )
                `)
                .eq('id', ventaId)
                .single();

            if (ventaError || !venta) {
                console.error('Error cargando venta:', ventaError);
                alert('No se pudo cargar la información de la venta');
                return;
            }

            // Obtener detalles de la venta con información de productos
            const { data: detalles, error: detallesError } = await window.db.supabase
                .from('ventas_detalle')
                .select(`
                    id,
                    cantidad,
                    precio_unitario,
                    descuento,
                    tasa_impuesto,
                    subtotal,
                    impuesto,
                    total,
                    productos:producto_id(
                        id,
                        nombre,
                        codigo_interno,
                        codigo_barras
                    )
                `)
                .eq('venta_id', ventaId);

            if (detallesError) {
                console.error('Error cargando detalles:', detallesError);
                alert('No se pudo cargar el detalle de productos');
                return;
            }

            // Poblar encabezado del modal
            const saleNumberEl = document.getElementById('detailSaleNumber');
            const statusBadgeEl = document.getElementById('detailStatusBadge');
            const clientEl = document.getElementById('detailClient');
            const clientExtraEl = document.getElementById('detailClientExtra');
            const saleDateEl = document.getElementById('detailSaleDate');
            const paymentMethodEl = document.getElementById('detailPaymentMethod');
            const salespersonEl = document.getElementById('detailSalesperson');
            const subtotalEl = document.getElementById('detailSubtotal');
            const discountEl = document.getElementById('detailDiscount');
            const taxEl = document.getElementById('detailTax');
            const totalEl = document.getElementById('detailTotal');
            const notesEl = document.getElementById('detailNotes');
            const notesSectionEl = document.getElementById('detailNotesSection');
            const itemsBody = document.getElementById('detailItemsBody');

            // Número de venta
            if (saleNumberEl) saleNumberEl.textContent = `#${venta.numero_venta || '—'}`;

            // Estado
            if (statusBadgeEl) {
                const estado = String(venta.estado || '—').toLowerCase();
                let cls = 'bg-secondary';
                if (estado === 'completada') cls = 'bg-success';
                else if (estado === 'pendiente') cls = 'bg-warning';
                else if (estado === 'cancelada') cls = 'bg-danger';
                else if (estado === 'reembolsada') cls = 'bg-info';
                statusBadgeEl.className = `badge ${cls}`;
                statusBadgeEl.textContent = venta.estado || '—';
            }

            // Cliente
            if (clientEl) {
                if (venta.clientes && venta.clientes.nombre_completo) {
                    clientEl.textContent = venta.clientes.nombre_completo;
                } else {
                    clientEl.textContent = 'Cliente General';
                }
            }

            // Información extra del cliente
            if (clientExtraEl && venta.clientes) {
                const clienteInfo = [];
                if (venta.clientes.tipo_id && venta.clientes.numero_id) {
                    clienteInfo.push(`${venta.clientes.tipo_id}: ${venta.clientes.numero_id}`);
                }
                if (venta.clientes.telefono) {
                    clienteInfo.push(`Tel: ${venta.clientes.telefono}`);
                }
                if (venta.clientes.email) {
                    clienteInfo.push(`Email: ${venta.clientes.email}`);
                }
                clientExtraEl.innerHTML = clienteInfo.length > 0 
                    ? `<span class="text-white" style="opacity:1;">${clienteInfo.join(' | ')}</span>`
                    : '<span class="text-white" style="opacity:1;">&nbsp;</span>';
            } else if (clientExtraEl) {
                clientExtraEl.innerHTML = '<span class="text-white" style="opacity:1;">&nbsp;</span>';
            }

            // Fecha
            if (saleDateEl) {
                const fecha = new Date(venta.fecha_venta);
                saleDateEl.textContent = fecha.toLocaleString('es-CO', {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit'
                }) || '—';
            }

            // Método de pago
            if (paymentMethodEl) {
                const metodos = {
                    'efectivo': 'Efectivo',
                    'tarjeta': 'Tarjeta',
                    'transferencia': 'Transferencia',
                    'mixto': 'Mixto'
                };
                paymentMethodEl.textContent = metodos[venta.metodo_pago] || venta.metodo_pago || '—';
            }

            // Vendedor
            if (salespersonEl) {
                if (venta.usuarios) {
                    salespersonEl.textContent = venta.usuarios.nombre_completo || venta.usuarios.usuario || venta.usuarios.email || '—';
                } else {
                    salespersonEl.textContent = '—';
                }
            }

            // Totales
            if (subtotalEl) subtotalEl.textContent = formatCOP(Number(venta.subtotal) || 0);
            if (discountEl) discountEl.textContent = formatCOP(Number(venta.descuento) || 0);
            if (taxEl) taxEl.textContent = formatCOP(Number(venta.impuesto) || 0);
            if (totalEl) totalEl.textContent = formatCOP(Number(venta.total) || 0);

            // Observaciones
            if (notesEl && notesSectionEl) {
                if (venta.notas && venta.notas.trim()) {
                    notesEl.textContent = venta.notas;
                    notesSectionEl.style.display = 'block';
                } else {
                    notesEl.textContent = '—';
                    notesSectionEl.style.display = 'none';
                }
            }

            // Poblar items
            if (itemsBody) {
                itemsBody.innerHTML = '';
                if (detalles && detalles.length > 0) {
                    detalles.forEach(d => {
                        const tr = document.createElement('tr');
                        const codigo = d.productos?.codigo_interno || d.productos?.codigo_barras || '-';
                        const descuentoPorcentaje = Number(d.descuento) || 0;
                        const descuentoTexto = descuentoPorcentaje > 0 ? `${descuentoPorcentaje}%` : formatCOP(0);
                        tr.innerHTML = `
                            <td><strong>${d.productos?.nombre || 'Producto'}</strong></td>
                            <td>${codigo}</td>
                            <td class="text-end">${Number(d.cantidad) || 0}</td>
                            <td class="text-end">${formatCOP(Number(d.precio_unitario) || 0)}</td>
                            <td class="text-end">${descuentoTexto}</td>
                            <td class="text-end">${formatCOP(Number(d.impuesto) || 0)}</td>
                            <td class="text-end">${formatCOP(Number(d.total) || 0)}</td>`;
                        itemsBody.appendChild(tr);
                    });
                } else {
                    const tr = document.createElement('tr');
                    tr.innerHTML = '<td colspan="7" class="text-center text-muted">No hay productos en esta venta</td>';
                    itemsBody.appendChild(tr);
                }
            }

            // Mostrar modal
            const modalEl = document.getElementById('saleDetailModal');
            if (modalEl) {
                const modal = new bootstrap.Modal(modalEl);
                modal.show();
            }
        } catch (error) {
            console.error('Error en verDetalleVenta:', error);
            alert('Ocurrió un error al cargar los detalles de la venta');
        }
    };

    // ===== INICIALIZACIÓN =====

    /**
     * Inicializa todos los event listeners y funcionalidades
     */
    function initialize() {
        // Esperar a que el DOM esté completamente cargado
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', initialize);
            return;
        }

        // Obtener elementos del DOM
        const searchTerm = document.getElementById('searchTerm');
        const searchBtn = document.getElementById('searchBtn');
        const clearFiltersBtn = document.getElementById('clearFiltersBtn');
        const exportBtn = document.getElementById('exportBtn');
        const printReportBtn = document.getElementById('printReportBtn');
        const generateReportBtn = document.getElementById('generateReportBtn');
        const refreshBtn = document.getElementById('refreshBtn');
        const filterStatus = document.getElementById('filterStatus');
        const filterPayment = document.getElementById('filterPayment');
        const filterSeller = document.getElementById('filterSeller');
        const dateFrom = document.getElementById('dateFrom');
        const dateTo = document.getElementById('dateTo');
        const minAmount = document.getElementById('minAmount');
        const maxAmount = document.getElementById('maxAmount');
        const customerFilter = document.getElementById('customerFilter');
        const sortBy = document.getElementById('sortBy');

        // Búsqueda con autocompletado
        if (searchTerm) {
            // Búsqueda mientras escribe (debounce de 300ms)
            searchTerm.addEventListener('input', debounceSearch((e) => {
                const query = e.target.value.trim();
                if (query.length >= 2) {
                    searchSales(query);
                } else {
                    hideSalesSearchSuggestions();
                    // Si hay menos de 2 caracteres, mostrar todas las filas
                    const rows = document.querySelectorAll('#salesBody tr');
                    rows.forEach(row => {
                        row.style.display = '';
                    });
                }
            }, 300));

            // Mostrar sugerencias al hacer focus si hay texto
            searchTerm.addEventListener('focus', function() {
                const query = this.value.trim();
                if (query.length >= 2) {
                    searchSales(query);
                }
            });

            // Ocultar sugerencias al perder focus
            searchTerm.addEventListener('blur', function() {
                setTimeout(() => {
                    const activeElement = document.activeElement;
                    const isFocusOnDropdown = activeElement && 
                        activeElement.closest('#salesSearchSuggestionsFixed') !== null;
                    if (!isInteractingWithSalesSearchSuggestions && !isFocusOnDropdown) {
                        hideSalesSearchSuggestions();
                    }
                }, 200);
            });

            // Navegación con teclado
            searchTerm.addEventListener('keydown', function(e) {
                const container = document.getElementById('salesSearchSuggestionsFixed');
                if (!container || container.style.display === 'none') {
                    if (e.key === 'Enter' && this.value.trim().length >= 2) {
                        e.preventDefault();
                        searchSales(this.value.trim());
                    }
                    return;
                }

                const items = container.querySelectorAll('.sales-search-suggestion-item');
                if (items.length === 0) return;

                switch (e.key) {
                    case 'ArrowDown':
                        e.preventDefault();
                        salesSearchSelectedIndex = (salesSearchSelectedIndex < items.length - 1) 
                            ? salesSearchSelectedIndex + 1 
                            : 0;
                        highlightSalesSearchItem(items, salesSearchSelectedIndex);
                        items[salesSearchSelectedIndex].scrollIntoView({ block: 'nearest' });
                        break;
                    case 'ArrowUp':
                        e.preventDefault();
                        salesSearchSelectedIndex = (salesSearchSelectedIndex > 0) 
                            ? salesSearchSelectedIndex - 1 
                            : items.length - 1;
                        highlightSalesSearchItem(items, salesSearchSelectedIndex);
                        items[salesSearchSelectedIndex].scrollIntoView({ block: 'nearest' });
                        break;
                    case 'Enter':
                        e.preventDefault();
                        if (salesSearchSelectedIndex >= 0 && salesSearchSelectedIndex < items.length) {
                            selectSalesSearch(items[salesSearchSelectedIndex]);
                        }
                        break;
                    case 'Escape':
                        e.preventDefault();
                        hideSalesSearchSuggestions();
                        salesSearchSelectedIndex = -1;
                        break;
                }
            });
        }

        // Event listeners para el contenedor de sugerencias
        const salesSearchSuggestionsContainer = document.getElementById('salesSearchSuggestionsFixed');
        if (salesSearchSuggestionsContainer) {
            salesSearchSuggestionsContainer.addEventListener('mouseenter', function() {
                isInteractingWithSalesSearchSuggestions = true;
            });
            salesSearchSuggestionsContainer.addEventListener('mouseleave', function() {
                isInteractingWithSalesSearchSuggestions = false;
            });
        }

        // Reposicionar sugerencias al hacer scroll
        window.addEventListener('scroll', function() {
            const inputElement = document.getElementById('searchTerm');
            const container = document.getElementById('salesSearchSuggestionsFixed');
            if (inputElement && container && container.style.display === 'block') {
                positionSalesSearchSuggestions(container, inputElement);
            }
        }, { passive: true });

        // Reposicionar sugerencias al redimensionar ventana
        window.addEventListener('resize', function() {
            const inputElement = document.getElementById('searchTerm');
            const container = document.getElementById('salesSearchSuggestionsFixed');
            if (inputElement && container && container.style.display === 'block') {
                positionSalesSearchSuggestions(container, inputElement);
            }
        });

        // Event listeners para filtros
        if (filterStatus) filterStatus.addEventListener('change', applyFilters);
        if (filterPayment) filterPayment.addEventListener('change', applyFilters);
        if (filterSeller) filterSeller.addEventListener('change', applyFilters);
        if (dateFrom) dateFrom.addEventListener('change', applyFilters);
        if (dateTo) dateTo.addEventListener('change', applyFilters);
        if (minAmount) minAmount.addEventListener('input', applyFilters);
        if (maxAmount) maxAmount.addEventListener('input', applyFilters);
        if (customerFilter) customerFilter.addEventListener('input', applyFilters);
        if (sortBy) sortBy.addEventListener('change', applyFilters);

        // Botones de acción
        if (searchBtn) searchBtn.addEventListener('click', performSearch);
        if (clearFiltersBtn) clearFiltersBtn.addEventListener('click', clearFilters);
        if (exportBtn) exportBtn.addEventListener('click', exportToExcel);
        if (printReportBtn) printReportBtn.addEventListener('click', printReport);
        if (generateReportBtn) generateReportBtn.addEventListener('click', generateReport);
        if (refreshBtn) {
            refreshBtn.addEventListener('click', function(e) {
                e.preventDefault();
                refreshHistory();
            });
        }

        // Establecer fechas por defecto
        setDefaultDates();

        // Event listener para cambiar el tamaño de página
        const pageSizeSelect = document.getElementById('pageSizeSelect');
        if (pageSizeSelect) {
            pageSizeSelect.addEventListener('change', function(e) {
                const newPageSize = parseInt(e.target.value, 10);
                if (newPageSize !== pageSizeHistorial) {
                    pageSizeHistorial = newPageSize;
                    currentPageHistorial = 1; // Resetear a la primera página
                    cargarHistorialVentas();
                }
            });
        }

        // Sincronizar iconos chevron con el estado de colapso
        const collapseElements = document.querySelectorAll('[data-bs-toggle="collapse"]');
        collapseElements.forEach(button => {
            const targetId = button.getAttribute('data-bs-target');
            const targetElement = document.querySelector(targetId);
            const chevronIcon = button.querySelector('i.fa-chevron-up, i.fa-chevron-down');
            
            if (targetElement && chevronIcon) {
                // Actualizar icono según el estado inicial
                if (targetElement.classList.contains('show')) {
                    chevronIcon.classList.remove('fa-chevron-down');
                    chevronIcon.classList.add('fa-chevron-up');
                } else {
                    chevronIcon.classList.remove('fa-chevron-up');
                    chevronIcon.classList.add('fa-chevron-down');
                }
                
                // Escuchar eventos de colapso
                targetElement.addEventListener('show.bs.collapse', function() {
                    chevronIcon.classList.remove('fa-chevron-down');
                    chevronIcon.classList.add('fa-chevron-up');
                });
                
                targetElement.addEventListener('hide.bs.collapse', function() {
                    chevronIcon.classList.remove('fa-chevron-up');
                    chevronIcon.classList.add('fa-chevron-down');
                });
            }
        });

        // Cargar KPIs y historial cuando window.db esté disponible
        if (window.db) {
            actualizarKPIsHistorial();
            actualizarEstadisticasPorPeriodo();
            actualizarTopVendedores();
            cargarUsuariosParaFiltro();
            cargarHistorialVentas();
        } else {
            // Si no está disponible inmediatamente, esperar un poco
            setTimeout(() => {
                if (window.db) {
                    actualizarKPIsHistorial();
                    actualizarEstadisticasPorPeriodo();
                    actualizarTopVendedores();
                    cargarUsuariosParaFiltro();
                    cargarHistorialVentas();
                }
            }, 500);
        }

        // Inicializar información de paginación
        actualizarInfoPaginacion();
    }

    // Inicializar cuando el script se carga
    initialize();

})();
