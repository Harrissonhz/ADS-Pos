// ===== VENTAS - SISTEMA ADS-POS =====
(function () {
    let searchTimeout;
    let isInteractingWithSuggestions = false;
    let isInteractingWithSalespersonSuggestions = false;
    
    // Índices para navegación con teclado
    let customerSelectedIndex = -1;
    let salespersonSelectedIndex = -1;
    let productSelectedIndex = -1;
    let categorySelectedIndex = -1;

    // Función para formatear moneda
    function formatCOP(value) {
        return new Intl.NumberFormat('es-CO', {
            style: 'currency',
            currency: 'COP',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(value);
    }

    // Función genérica para navegación con teclado en dropdowns
    function handleKeyboardNavigation(e, containerId, itemSelector, selectedIndex, setSelectedIndex, selectFunction) {
        const container = document.getElementById(containerId);
        if (!container || container.style.display === 'none') return false;

        const items = container.querySelectorAll(itemSelector);
        if (items.length === 0) return false;

        let newIndex = selectedIndex;

        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                newIndex = (selectedIndex < items.length - 1) ? selectedIndex + 1 : 0;
                setSelectedIndex(newIndex);
                highlightItem(items, newIndex);
                scrollToItem(items[newIndex], container);
                return true;
            case 'ArrowUp':
                e.preventDefault();
                newIndex = (selectedIndex > 0) ? selectedIndex - 1 : items.length - 1;
                setSelectedIndex(newIndex);
                highlightItem(items, newIndex);
                scrollToItem(items[newIndex], container);
                return true;
            case 'Enter':
                e.preventDefault();
                if (selectedIndex >= 0 && selectedIndex < items.length) {
                    selectFunction(items[selectedIndex]);
                }
                return true;
            case 'Escape':
                e.preventDefault();
                container.style.display = 'none';
                setSelectedIndex(-1);
                return true;
        }
        return false;
    }

    // Resaltar item seleccionado
    function highlightItem(items, index) {
        items.forEach((item, i) => {
            if (i === index) {
                item.style.backgroundColor = '#0d6efd';
                item.style.color = 'white';
                // Asegurar que los hijos también cambien de color
                const children = item.querySelectorAll('div, small');
                children.forEach(child => {
                    child.style.color = 'white';
                });
            } else {
                item.style.backgroundColor = '';
                item.style.color = '';
                // Restaurar color original de los hijos
                const children = item.querySelectorAll('div, small');
                children.forEach(child => {
                    child.style.color = '';
                });
            }
        });
    }

    // Scroll al item seleccionado
    function scrollToItem(item, container) {
        if (!item || !container) return;
        const containerRect = container.getBoundingClientRect();
        const itemRect = item.getBoundingClientRect();
        
        if (itemRect.bottom > containerRect.bottom) {
            item.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
        } else if (itemRect.top < containerRect.top) {
            item.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
        }
    }

    // Funciones de optimización
    let searchTimeouts = {}; // Múltiples timeouts para diferentes búsquedas
    let searchCache = {}; // Cache simple de búsquedas recientes (últimos 50 resultados)
    
    function debounce(func, delay, key = 'default') {
        return function (...args) {
            if (searchTimeouts[key]) {
                clearTimeout(searchTimeouts[key]);
            }
            searchTimeouts[key] = setTimeout(() => {
                func.apply(this, args);
                delete searchTimeouts[key];
            }, delay);
        };
    }

    // Throttle para scroll/resize
    function throttle(func, limit) {
        let inThrottle;
        return function(...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }

    // Función para obtener clave de cache
    function getCacheKey(type, query, filters = {}) {
        const filterStr = JSON.stringify(filters);
        return `${type}:${query}:${filterStr}`;
    }

    // Mostrar sugerencias de clientes
    function showCustomerSuggestions(suggestions, inputElement) {
        const container = document.getElementById('customerSuggestions');
        if (!container) return;

        // Aplicar estilos del contenedor
        container.style.backgroundColor = 'white';
        container.style.border = '1px solid #dee2e6';
        container.style.borderRadius = '0.375rem';
        container.style.boxShadow = '0 0.5rem 1rem rgba(0, 0, 0, 0.15)';
        container.style.maxHeight = '300px';
        container.style.overflowY = 'auto';

        if (!suggestions || suggestions.length === 0) {
            container.innerHTML = '<div class="p-2 text-muted text-center">No se encontraron clientes</div>';
            container.style.display = 'block';
            positionSuggestions(container, inputElement);
            return;
        }

        container.innerHTML = suggestions.map(client => `
            <div class="p-2 border-bottom customer-suggestion-item" 
                 style="cursor: pointer;" 
                 data-id="${client.id}"
                 data-nombre="${client.nombre_completo || ''}"
                 data-identificacion="${client.tipo_id || ''} ${client.numero_id || ''}">
                <div class="fw-bold">${client.nombre_completo || 'Sin nombre'}</div>
                <small class="text-muted">${client.tipo_id || ''} ${client.numero_id || ''}</small>
                ${client.email ? `<small class="text-muted d-block">${client.email}</small>` : ''}
            </div>
        `).join('');

        // Agregar eventos a los items
        container.querySelectorAll('.customer-suggestion-item').forEach((item, index) => {
            item.addEventListener('mouseenter', function() {
                customerSelectedIndex = index;
                highlightItem(container.querySelectorAll('.customer-suggestion-item'), index);
            });
            item.addEventListener('mouseleave', function() {
                // No quitamos el resaltado si está seleccionado con teclado
            });
            item.addEventListener('mousedown', function(e) {
                e.preventDefault();
                customerSelectedIndex = index;
                selectCustomer(this);
            });
        });

        // Resetear índice de selección
        customerSelectedIndex = -1;
        container.style.display = 'block';
        positionSuggestions(container, inputElement);
    }

    // Ocultar sugerencias
    function hideCustomerSuggestions(force = false) {
        if (!force && isInteractingWithSuggestions) return;
        const container = document.getElementById('customerSuggestions');
        if (container) {
            container.style.display = 'none';
            customerSelectedIndex = -1;
            isInteractingWithSuggestions = false;
        }
    }

    // Posicionar sugerencias debajo del input
    function positionSuggestions(container, inputElement) {
        const inputRect = inputElement.getBoundingClientRect();
        // Usar position fixed y posicionar directamente debajo del input (sin sumar scrollY)
        container.style.position = 'fixed';
        container.style.top = `${inputRect.bottom}px`;
        container.style.left = `${inputRect.left}px`;
        container.style.width = `${inputRect.width}px`;
        container.style.zIndex = '1050';
    }

    // Seleccionar cliente
    function selectCustomer(itemElement) {
        const customerId = itemElement.getAttribute('data-id');
        const customerName = itemElement.getAttribute('data-nombre');
        const customerIdNumber = itemElement.getAttribute('data-identificacion');

        document.getElementById('customerSearch').value = `${customerName} - ${customerIdNumber}`;
        document.getElementById('selectedCustomerId').value = customerId;

        hideCustomerSuggestions();
    }

    // Buscar clientes (optimizado con cache)
    async function searchCustomers(query) {
        if (!query || query.length < 1) {
            hideCustomerSuggestions();
            return;
        }

        if (!window.db || !window.supabaseClient) {
            console.error('No hay conexión con el servicio');
            return;
        }

        // Verificar cache (solo para consultas de al menos 2 caracteres)
        const cacheKey = getCacheKey('customer', query);
        if (query.length >= 2 && searchCache[cacheKey]) {
            const inputElement = document.getElementById('customerSearch');
            if (inputElement) {
                showCustomerSuggestions(searchCache[cacheKey], inputElement);
            }
            return;
        }

        try {
            const result = await window.db.getClientes({
                search: query,
                onlyActive: true,
                limit: 10,
                offset: 0
            });

            if (result.error) {
                console.error('Error buscando clientes:', result.error);
                return;
            }

            const data = result.data || [];
            
            // Guardar en cache (solo si hay al menos 2 caracteres)
            if (query.length >= 2 && data.length > 0) {
                searchCache[cacheKey] = data;
                // Limpiar cache si tiene más de 50 entradas
                const cacheKeys = Object.keys(searchCache);
                if (cacheKeys.length > 50) {
                    delete searchCache[cacheKeys[0]];
                }
            }

            const inputElement = document.getElementById('customerSearch');
            if (inputElement) {
                showCustomerSuggestions(data, inputElement);
            }
        } catch (error) {
            console.error('Error en búsqueda de clientes:', error);
        }
    }

    // Cargar cliente por defecto (99999)
    async function loadDefaultCustomer() {
        if (!window.db || !window.supabaseClient) {
            return;
        }

        try {
            const result = await window.db.getClientes({
                numeroId: '99999',
                onlyActive: true,
                limit: 1,
                offset: 0
            });

            if (result.error) {
                console.error('Error cargando cliente por defecto:', result.error);
                return;
            }

            if (result.data && result.data.length > 0) {
                const cliente = result.data[0];
                const customerSearch = document.getElementById('customerSearch');
                const selectedCustomerId = document.getElementById('selectedCustomerId');

                if (customerSearch && selectedCustomerId) {
                    customerSearch.value = `${cliente.nombre_completo || ''} - ${cliente.tipo_id || ''} ${cliente.numero_id || ''}`;
                    selectedCustomerId.value = cliente.id;
                }
            }
        } catch (error) {
            console.error('Error cargando cliente por defecto:', error);
        }
    }

    // ===== FUNCIONES PARA BÚSQUEDA DE VENDEDORES =====

    // Mostrar sugerencias de vendedores
    function showSalespersonSuggestions(suggestions, inputElement) {
        const container = document.getElementById('salespersonSuggestionsFixed');
        if (!container) return;

        // Aplicar estilos del contenedor
        container.style.backgroundColor = 'white';
        container.style.border = '1px solid #dee2e6';
        container.style.borderRadius = '0.375rem';
        container.style.boxShadow = '0 0.5rem 1rem rgba(0, 0, 0, 0.15)';
        container.style.maxHeight = '300px';
        container.style.overflowY = 'auto';

        if (!suggestions || suggestions.length === 0) {
            container.innerHTML = '<div class="p-2 text-muted text-center">No se encontraron vendedores</div>';
            container.style.display = 'block';
            positionSalespersonSuggestions(container, inputElement);
            return;
        }

        container.innerHTML = suggestions.map(vendedor => `
            <div class="p-2 border-bottom salesperson-suggestion-item" 
                 style="cursor: pointer;" 
                 data-id="${vendedor.id}"
                 data-nombre="${vendedor.nombre_completo || ''}"
                 data-usuario="${vendedor.usuario || ''}">
                <div class="fw-bold">${vendedor.nombre_completo || 'Sin nombre'}</div>
                <small class="text-muted">${vendedor.usuario || ''}</small>
                ${vendedor.email ? `<small class="text-muted d-block">${vendedor.email}</small>` : ''}
            </div>
        `).join('');

        // Agregar eventos a los items
        container.querySelectorAll('.salesperson-suggestion-item').forEach((item, index) => {
            item.addEventListener('mouseenter', function() {
                salespersonSelectedIndex = index;
                highlightItem(container.querySelectorAll('.salesperson-suggestion-item'), index);
            });
            item.addEventListener('mouseleave', function() {
                // No quitamos el resaltado si está seleccionado con teclado
            });
            item.addEventListener('mousedown', function(e) {
                e.preventDefault();
                salespersonSelectedIndex = index;
                selectSalesperson(this);
            });
        });

        // Resetear índice de selección
        salespersonSelectedIndex = -1;
        container.style.display = 'block';
        positionSalespersonSuggestions(container, inputElement);
    }

    // Ocultar sugerencias de vendedores
    function hideSalespersonSuggestions(force = false) {
        if (!force && isInteractingWithSalespersonSuggestions) return;
        const container = document.getElementById('salespersonSuggestionsFixed');
        if (container) {
            container.style.display = 'none';
            salespersonSelectedIndex = -1;
            isInteractingWithSalespersonSuggestions = false;
        }
    }

    // Posicionar sugerencias de vendedores debajo del input
    function positionSalespersonSuggestions(container, inputElement) {
        const inputRect = inputElement.getBoundingClientRect();
        // Usar position fixed y posicionar directamente debajo del input (sin sumar scrollY)
        container.style.position = 'fixed';
        container.style.top = `${inputRect.bottom}px`;
        container.style.left = `${inputRect.left}px`;
        container.style.width = `${inputRect.width}px`;
        container.style.zIndex = '1050';
    }

    // Seleccionar vendedor
    function selectSalesperson(itemElement) {
        const salespersonId = itemElement.getAttribute('data-id');
        const salespersonName = itemElement.getAttribute('data-nombre');
        const salespersonUsuario = itemElement.getAttribute('data-usuario');

        document.getElementById('salespersonSearch').value = `${salespersonName} - ${salespersonUsuario}`;
        document.getElementById('selectedSalespersonId').value = salespersonId;

        hideSalespersonSuggestions();
    }

    // Buscar vendedores (optimizado con cache)
    async function searchSalespersons(query) {
        if (!query || query.length < 1) {
            hideSalespersonSuggestions();
            return;
        }

        if (!window.db || !window.supabaseClient) {
            console.error('No hay conexión con el servicio');
            return;
        }

        // Verificar cache (solo para consultas de al menos 2 caracteres)
        const cacheKey = getCacheKey('salesperson', query, { role: 'Vendedor' });
        if (query.length >= 2 && searchCache[cacheKey]) {
            const inputElement = document.getElementById('salespersonSearch');
            if (inputElement) {
                showSalespersonSuggestions(searchCache[cacheKey], inputElement);
            }
            return;
        }

        try {
            const result = await window.db.getUsuarios({
                search: query,
                role: 'Vendedor',
                status: 'active',
                limit: 10,
                offset: 0
            });

            if (result.error) {
                console.error('Error buscando vendedores:', result.error);
                return;
            }

            const data = result.data || [];
            
            // Guardar en cache (solo si hay al menos 2 caracteres)
            if (query.length >= 2 && data.length > 0) {
                searchCache[cacheKey] = data;
                // Limpiar cache si tiene más de 50 entradas
                const cacheKeys = Object.keys(searchCache);
                if (cacheKeys.length > 50) {
                    delete searchCache[cacheKeys[0]];
                }
            }

            const inputElement = document.getElementById('salespersonSearch');
            if (inputElement) {
                showSalespersonSuggestions(data, inputElement);
            }
        } catch (error) {
            console.error('Error en búsqueda de vendedores:', error);
        }
    }

    // Cargar primer vendedor por defecto
    async function loadDefaultSalesperson() {
        if (!window.db || !window.supabaseClient) {
            return;
        }

        try {
            const result = await window.db.getUsuarios({
                role: 'Vendedor',
                status: 'active',
                limit: 1,
                offset: 0,
                orderBy: 'nombre_completo',
                ascending: true
            });

            if (result.error) {
                console.error('Error cargando vendedor por defecto:', result.error);
                return;
            }

            if (result.data && result.data.length > 0) {
                const vendedor = result.data[0];
                const salespersonSearch = document.getElementById('salespersonSearch');
                const selectedSalespersonId = document.getElementById('selectedSalespersonId');

                if (salespersonSearch && selectedSalespersonId) {
                    salespersonSearch.value = `${vendedor.nombre_completo || ''} - ${vendedor.usuario || ''}`;
                    selectedSalespersonId.value = vendedor.id;
                }
            }
        } catch (error) {
            console.error('Error cargando vendedor por defecto:', error);
        }
    }

    // ===== FUNCIONES PARA BÚSQUEDA DE PRODUCTOS =====
    let isInteractingWithProductSuggestions = false;

    // Mostrar sugerencias de productos
    function showProductSuggestions(suggestions, inputElement) {
        const container = document.getElementById('productSuggestionsFixed');
        if (!container) return;

        container.style.backgroundColor = 'white';
        container.style.border = '1px solid #dee2e6';
        container.style.borderRadius = '0.375rem';
        container.style.boxShadow = '0 0.5rem 1rem rgba(0, 0, 0, 0.15)';
        container.style.maxHeight = '300px';
        container.style.overflowY = 'auto';

        if (!suggestions || suggestions.length === 0) {
            container.innerHTML = '<div class="p-2 text-muted text-center">No se encontraron productos</div>';
            container.style.display = 'block';
            positionProductSuggestions(container, inputElement);
            return;
        }

        container.innerHTML = suggestions.map(producto => {
            const categoria = producto.categoria ? producto.categoria.nombre : 'Sin categoría';
            const categoriaId = producto.categoria ? producto.categoria.id : null;
            const categoriaCodigo = producto.categoria ? (producto.categoria.codigo || '') : '';
            const stock = producto.stock_actual || 0;
            const precio = producto.precio_venta || 0;
            const activo = producto.activo !== undefined ? producto.activo : true;
            const tasaImpuesto = producto.tasa_impuesto !== undefined && producto.tasa_impuesto !== null ? parseFloat(producto.tasa_impuesto) : 0;
            return `
                <div class="p-2 border-bottom product-suggestion-item" 
                     style="cursor: pointer;" 
                     data-id="${producto.id}"
                     data-nombre="${producto.nombre || ''}"
                     data-codigo="${producto.codigo_interno || producto.codigo_barras || ''}"
                     data-categoria-id="${categoriaId || ''}"
                     data-categoria-nombre="${categoria || ''}"
                     data-categoria-codigo="${categoriaCodigo}"
                     data-precio="${precio}"
                     data-stock="${stock}"
                     data-activo="${activo}"
                     data-tasa-impuesto="${tasaImpuesto}">
                    <div class="fw-bold">${producto.nombre || 'Sin nombre'}</div>
                    <small class="text-muted">Código: ${producto.codigo_interno || producto.codigo_barras || 'Sin código'}</small>
                    <small class="text-muted d-block">${categoria} - Stock: ${stock} - Precio: ${formatCOP(precio)}</small>
                </div>
            `;
        }).join('');

        container.querySelectorAll('.product-suggestion-item').forEach((item, index) => {
            item.addEventListener('mouseenter', function() {
                productSelectedIndex = index;
                highlightItem(container.querySelectorAll('.product-suggestion-item'), index);
            });
            item.addEventListener('mouseleave', function() {
                // No quitamos el resaltado si está seleccionado con teclado
            });
            item.addEventListener('mousedown', function(e) {
                e.preventDefault();
                productSelectedIndex = index;
                if (window.selectProduct) {
                    window.selectProduct(this);
                } else {
                    // Fallback si selectProduct aún no está disponible
                    console.error('selectProduct no está disponible aún');
                }
            });
        });

        // Resetear índice de selección
        productSelectedIndex = -1;
        container.style.display = 'block';
        positionProductSuggestions(container, inputElement);
    }

    // Ocultar sugerencias de productos
    function hideProductSuggestions(force = false) {
        if (!force && isInteractingWithProductSuggestions) return;
        const container = document.getElementById('productSuggestionsFixed');
        if (container) {
            container.style.display = 'none';
            productSelectedIndex = -1;
            isInteractingWithProductSuggestions = false;
        }
    }

    // Posicionar sugerencias de productos
    function positionProductSuggestions(container, inputElement) {
        const inputRect = inputElement.getBoundingClientRect();
        container.style.position = 'fixed';
        container.style.top = `${inputRect.bottom}px`;
        container.style.left = `${inputRect.left}px`;
        container.style.width = `${inputRect.width}px`;
        container.style.zIndex = '1050';
    }

    // Seleccionar producto (esta función necesita acceso a 'cart', así que la moveremos dentro de DOMContentLoaded)
    // Esta función se define después dentro del scope de DOMContentLoaded

    // Buscar productos (optimizado con cache)
    async function searchProducts(query) {
        if (!query || query.length < 1) {
            hideProductSuggestions();
            return;
        }

        if (!window.db || !window.supabaseClient) {
            console.error('No hay conexión con el servicio');
            return;
        }

        try {
            // Obtener categoría seleccionada si existe
            const selectedCategoryId = document.getElementById('selectedCategoryId')?.value;
            const filters = {};
            
            // Si hay una categoría seleccionada, filtrar productos por esa categoría
            if (selectedCategoryId) {
                filters.categoria_id = selectedCategoryId;
            }

            // Verificar cache (solo para consultas de al menos 2 caracteres)
            const cacheKey = getCacheKey('product', query, filters);
            if (query.length >= 2 && searchCache[cacheKey]) {
                const inputElement = document.getElementById('productSearch');
                if (inputElement) {
                    showProductSuggestions(searchCache[cacheKey], inputElement);
                }
                return;
            }

            const result = await window.db.getProductos({
                search: query,
                filters: filters,
                onlyActive: true,
                limit: 10,
                offset: 0
            });

            if (result.error) {
                console.error('Error buscando productos:', result.error);
                return;
            }

            const data = result.data || [];
            
            // Guardar en cache (solo si hay al menos 2 caracteres)
            if (query.length >= 2 && data.length > 0) {
                searchCache[cacheKey] = data;
                // Limpiar cache si tiene más de 50 entradas
                const cacheKeys = Object.keys(searchCache);
                if (cacheKeys.length > 50) {
                    delete searchCache[cacheKeys[0]];
                }
            }

            const inputElement = document.getElementById('productSearch');
            if (inputElement) {
                showProductSuggestions(data, inputElement);
            }
        } catch (error) {
            console.error('Error en búsqueda de productos:', error);
        }
    }

    // Listar todos los productos (con filtro de categoría si aplica)
    async function listAllProducts() {
        if (!window.db || !window.supabaseClient) {
            console.error('No hay conexión con el servicio');
            return;
        }

        try {
            // Obtener categoría seleccionada si existe
            const selectedCategoryId = document.getElementById('selectedCategoryId')?.value;
            const filters = {};
            
            // Si hay una categoría seleccionada, filtrar productos por esa categoría
            if (selectedCategoryId) {
                filters.categoria_id = selectedCategoryId;
            }

            // Listar más productos (50) para dar una buena vista con scroll
            const result = await window.db.getProductos({
                filters: filters,
                onlyActive: true,
                limit: 50,
                offset: 0,
                orderBy: 'nombre',
                ascending: true
            });

            if (result.error) {
                console.error('Error listando productos:', result.error);
                return;
            }

            const inputElement = document.getElementById('productSearch');
            if (inputElement) {
                showProductSuggestions(result.data || [], inputElement);
            }
        } catch (error) {
            console.error('Error en listado de productos:', error);
        }
    }

    // ===== FUNCIONES PARA BÚSQUEDA DE CATEGORÍAS =====
    let isInteractingWithCategorySuggestions = false;

    // Mostrar sugerencias de categorías
    function showCategorySuggestions(suggestions, inputElement) {
        const container = document.getElementById('categorySuggestionsFixed');
        if (!container) return;

        container.style.backgroundColor = 'white';
        container.style.border = '1px solid #dee2e6';
        container.style.borderRadius = '0.375rem';
        container.style.boxShadow = '0 0.5rem 1rem rgba(0, 0, 0, 0.15)';
        container.style.maxHeight = '300px';
        container.style.overflowY = 'auto';

        if (!suggestions || suggestions.length === 0) {
            container.innerHTML = '<div class="p-2 text-muted text-center">No se encontraron categorías</div>';
            container.style.display = 'block';
            positionCategorySuggestions(container, inputElement);
            return;
        }

        container.innerHTML = suggestions.map(categoria => `
            <div class="p-2 border-bottom category-suggestion-item" 
                 style="cursor: pointer;" 
                 data-id="${categoria.id}"
                 data-nombre="${categoria.nombre || ''}"
                 data-codigo="${categoria.codigo || ''}">
                <div class="fw-bold">${categoria.nombre || 'Sin nombre'}</div>
                <small class="text-muted">Código: ${categoria.codigo || 'Sin código'}</small>
            </div>
        `).join('');

        container.querySelectorAll('.category-suggestion-item').forEach((item, index) => {
            item.addEventListener('mouseenter', function() {
                categorySelectedIndex = index;
                highlightItem(container.querySelectorAll('.category-suggestion-item'), index);
            });
            item.addEventListener('mouseleave', function() {
                // No quitamos el resaltado si está seleccionado con teclado
            });
            item.addEventListener('mousedown', function(e) {
                e.preventDefault();
                categorySelectedIndex = index;
                selectCategory(this);
            });
        });

        // Resetear índice de selección
        categorySelectedIndex = -1;
        container.style.display = 'block';
        positionCategorySuggestions(container, inputElement);
    }

    // Ocultar sugerencias de categorías
    function hideCategorySuggestions(force = false) {
        if (!force && isInteractingWithCategorySuggestions) return;
        const container = document.getElementById('categorySuggestionsFixed');
        if (container) {
            container.style.display = 'none';
            categorySelectedIndex = -1;
            isInteractingWithCategorySuggestions = false;
        }
    }

    // Posicionar sugerencias de categorías
    function positionCategorySuggestions(container, inputElement) {
        const inputRect = inputElement.getBoundingClientRect();
        container.style.position = 'fixed';
        container.style.top = `${inputRect.bottom}px`;
        container.style.left = `${inputRect.left}px`;
        container.style.width = `${inputRect.width}px`;
        container.style.zIndex = '1050';
    }

        // Seleccionar categoría
        function selectCategory(itemElement) {
            const categoryId = itemElement.getAttribute('data-id');
            const categoryName = itemElement.getAttribute('data-nombre');
            const categoryCode = itemElement.getAttribute('data-codigo');

            const categoryInput = document.getElementById('productCategory');
            const selectedCategoryId = document.getElementById('selectedCategoryId');
            const productSearch = document.getElementById('productSearch');
            const selectedProductId = document.getElementById('selectedProductId');
            const productPriceInput = document.getElementById('productPrice');
            const productStockInput = document.getElementById('productStock');
            const productStatusInput = document.getElementById('productStatus');

            // Actualizar campo de categoría
            const categoryDisplay = categoryCode 
                ? `${categoryName} - ${categoryCode}` 
                : categoryName;
            
            // Marcar que esta es una selección del dropdown (no escritura manual)
            categoryInput.dataset.isSelection = 'true';
            categoryInput.value = categoryDisplay;
            if (selectedCategoryId) {
                selectedCategoryId.value = categoryId;
            }

            // Si hay un producto seleccionado, limpiarlo y sus campos relacionados
            if (selectedProductId && selectedProductId.value) {
                productSearch.value = '';
                selectedProductId.value = '';
                if (productPriceInput) productPriceInput.value = '';
                if (productStockInput) productStockInput.value = '';
                if (productStatusInput) {
                    productStatusInput.value = '';
                    productStatusInput.className = 'form-control';
                }
            }

            // Si hay texto en el campo de producto, buscar automáticamente productos de esta categoría
            const productSearchValue = productSearch?.value.trim() || '';
            if (productSearchValue.length >= 1) {
                // Usar requestAnimationFrame en lugar de setTimeout para mejor sincronización
                requestAnimationFrame(() => {
                    searchProducts(productSearchValue);
                });
            }

            hideCategorySuggestions();
        }

    // Buscar categorías (optimizado con cache)
    async function searchCategories(query) {
        if (!query || query.length < 1) {
            hideCategorySuggestions();
            return;
        }

        if (!window.db || !window.supabaseClient) {
            console.error('No hay conexión con el servicio');
            return;
        }

        // Verificar cache (solo para consultas de al menos 2 caracteres)
        const cacheKey = getCacheKey('category', query);
        if (query.length >= 2 && searchCache[cacheKey]) {
            const inputElement = document.getElementById('productCategory');
            if (inputElement) {
                showCategorySuggestions(searchCache[cacheKey], inputElement);
            }
            return;
        }

        try {
            const result = await window.db.getCategorias({
                search: query,
                onlyActive: true,
                limit: 10,
                offset: 0
            });

            if (result.error) {
                console.error('Error buscando categorías:', result.error);
                return;
            }

            const data = result.data || [];
            
            // Guardar en cache (solo si hay al menos 2 caracteres)
            if (query.length >= 2 && data.length > 0) {
                searchCache[cacheKey] = data;
                // Limpiar cache si tiene más de 50 entradas
                const cacheKeys = Object.keys(searchCache);
                if (cacheKeys.length > 50) {
                    delete searchCache[cacheKeys[0]];
                }
            }

            const inputElement = document.getElementById('productCategory');
            if (inputElement) {
                showCategorySuggestions(data, inputElement);
            }
        } catch (error) {
            console.error('Error en búsqueda de categorías:', error);
        }
    }

    document.addEventListener('DOMContentLoaded', async () => {
        // ===== ESTRUCTURA DEL CARRITO =====
        let cart = []; // Array para almacenar productos en el carrito
        
        // Estructura de un item del carrito:
        // {
        //     productId: string,
        //     code: string,
        //     name: string,
        //     category: string,
        //     price: number,
        //     quantity: number,
        //     discount: number, // porcentaje
        //     subtotal: number,
        //     stock: number,
        //     taxRate: number // tasa de impuesto del producto (porcentaje)
        // }

        // ===== FUNCIONES DEL CARRITO =====
        
        // Calcular subtotal de un item
        function calculateItemSubtotal(price, quantity, discount) {
            const subtotal = price * quantity;
            const discountAmount = subtotal * (discount / 100);
            return subtotal - discountAmount;
        }

        // Agregar producto al carrito
        function addToCart(productId, code, name, category, price, stock, quantityParam = null, taxRate = 0) {
            // Verificar si el producto ya está en el carrito
            const existingIndex = cart.findIndex(item => item.productId === productId && item.price === parseFloat(price));
            const quantityInput = document.getElementById('productQuantity');
            // Usar quantityParam si se proporciona, sino usar el input del formulario, sino 1
            const quantity = quantityParam !== null ? quantityParam : parseInt(quantityInput?.value || 1);

            if (existingIndex >= 0) {
                // Si ya existe con el mismo precio, incrementar la cantidad
                cart[existingIndex].quantity += quantity;
                cart[existingIndex].subtotal = calculateItemSubtotal(
                    cart[existingIndex].price,
                    cart[existingIndex].quantity,
                    cart[existingIndex].discount
                );
            } else {
                // Si no existe, agregarlo al carrito
                const newItem = {
                    productId: productId,
                    code: code,
                    name: name,
                    category: category,
                    price: parseFloat(price),
                    quantity: quantity,
                    discount: 0,
                    subtotal: calculateItemSubtotal(parseFloat(price), quantity, 0),
                    stock: parseInt(stock),
                    taxRate: parseFloat(taxRate) || 0 // Tasa de impuesto del producto
                };
                cart.push(newItem);
            }

            // Renderizar carrito y actualizar totales
            renderCart();
            updateCartTotals();
        }

        // Renderizar el carrito en el HTML
        function renderCart() {
            const cartBody = document.getElementById('cartBody');
            const cartBodyMobile = document.getElementById('cartBodyMobile');
            
            if (!cartBody || !cartBodyMobile) return;

            if (cart.length === 0) {
                // Vista vacía para tabla desktop
                cartBody.innerHTML = `
                    <tr>
                        <td colspan="7" class="text-center text-muted py-4">
                            <i class="fas fa-shopping-cart fa-2x mb-2"></i><br>
                            El carrito está vacío
                        </td>
                    </tr>
                `;
                // Vista vacía para móvil
                cartBodyMobile.innerHTML = `
                    <div class="text-center text-muted py-5">
                        <i class="fas fa-shopping-cart fa-3x mb-3"></i>
                        <p class="mb-0">El carrito está vacío</p>
                    </div>
                `;
                return;
            }

            // Renderizar tabla para desktop
            cartBody.innerHTML = cart.map((item, index) => {
                const subtotalWithDiscount = item.subtotal;
                return `
                    <tr data-index="${index}" data-product-id="${item.productId}">
                        <td>${item.code}</td>
                        <td>
                            <div>
                                <strong>${item.name}</strong><br>
                                <small class="text-white">${item.category}</small>
                            </div>
                        </td>
                        <td>
                            <div class="input-group cart-quantity-group">
                                <button class="btn btn-outline-secondary btn-sm" type="button" onclick="window.updateQuantity(${index}, -1)">-</button>
                                <input type="number" class="form-control form-control-sm text-center cart-quantity" value="${item.quantity}" min="1" onchange="window.updateQuantity(${index}, parseInt(this.value))">
                                <button class="btn btn-outline-secondary btn-sm" type="button" onclick="window.updateQuantity(${index}, 1)">+</button>
                            </div>
                        </td>
                        <td>
                            <div class="input-group cart-price-group">
                                <span class="input-group-text input-group-text-sm">$</span>
                                <input type="number" class="form-control form-control-sm text-center cart-price" value="${item.price}" min="0" step="0.01" onchange="window.updatePrice(${index}, parseFloat(this.value))">
                            </div>
                        </td>
                        <td>
                            <div class="input-group cart-discount-group">
                                <input type="number" class="form-control form-control-sm text-center cart-discount" value="${item.discount}" min="0" max="100" step="0.01" onchange="window.updateDiscount(${index}, parseFloat(this.value))">
                                <span class="input-group-text input-group-text-sm">%</span>
                            </div>
                        </td>
                        <td class="fw-bold cart-subtotal">${formatCOP(subtotalWithDiscount)}</td>
                        <td>
                            <button type="button" class="btn btn-sm btn-outline-danger" onclick="window.removeProduct(${index})">
                                <i class="fas fa-trash"></i>
                            </button>
                        </td>
                    </tr>
                `;
            }).join('');

            // Renderizar cards para móvil
            cartBodyMobile.innerHTML = cart.map((item, index) => {
                const subtotalWithDiscount = item.subtotal;
                return `
                    <div class="cart-item-card mb-3 p-3 border rounded" data-index="${index}" data-product-id="${item.productId}">
                        <div class="d-flex justify-content-between align-items-start mb-2">
                            <div class="flex-grow-1">
                                <div class="d-flex justify-content-between align-items-center mb-1">
                                    <strong class="text-white">${item.name}</strong>
                                    <button type="button" class="btn btn-sm btn-outline-danger" onclick="window.removeProduct(${index})">
                                        <i class="fas fa-trash"></i>
                                    </button>
                                </div>
                                <small class="text-white-50 d-block mb-1">Código: ${item.code}</small>
                                <small class="text-white-50 d-block">${item.category}</small>
                            </div>
                        </div>
                        
                        <div class="row g-2 mt-2">
                            <div class="col-6">
                                <label class="form-label small text-white-50 mb-1">Cantidad</label>
                                <div class="input-group">
                                    <button class="btn btn-outline-secondary btn-sm" type="button" onclick="window.updateQuantity(${index}, -1)">-</button>
                                    <input type="number" class="form-control text-center cart-quantity" value="${item.quantity}" min="1" onchange="window.updateQuantity(${index}, parseInt(this.value))">
                                    <button class="btn btn-outline-secondary btn-sm" type="button" onclick="window.updateQuantity(${index}, 1)">+</button>
                                </div>
                            </div>
                            <div class="col-6">
                                <label class="form-label small text-white-50 mb-1">Precio Unit.</label>
                                <div class="input-group">
                                    <span class="input-group-text">$</span>
                                    <input type="number" class="form-control text-center cart-price" value="${item.price}" min="0" step="0.01" onchange="window.updatePrice(${index}, parseFloat(this.value))">
                                </div>
                            </div>
                            <div class="col-6">
                                <label class="form-label small text-white-50 mb-1">Descuento (%)</label>
                                <div class="input-group">
                                    <input type="number" class="form-control text-center cart-discount" value="${item.discount}" min="0" max="100" step="0.01" onchange="window.updateDiscount(${index}, parseFloat(this.value))">
                                    <span class="input-group-text">%</span>
                                </div>
                            </div>
                            <div class="col-6">
                                <label class="form-label small text-white-50 mb-1">Subtotal</label>
                                <input type="text" class="form-control fw-bold text-success text-center" value="${formatCOP(subtotalWithDiscount)}" readonly>
                            </div>
                        </div>
                    </div>
                `;
            }).join('');
        }

        // Actualizar totales del carrito
        function updateCartTotals() {
            // Calcular subtotal
            const subtotal = cart.reduce((sum, item) => sum + item.subtotal, 0);
            
            // Obtener descuento global
            const globalDiscountInput = document.querySelector('#totales input[type="number"]');
            const globalDiscount = parseFloat(globalDiscountInput?.value || 0);
            const discountAmount = subtotal * (globalDiscount / 100);
            
            // Subtotal con descuento global
            const subtotalAfterDiscount = subtotal - discountAmount;
            
            // Calcular IVA por producto según su tasa_impuesto
            // Si un producto tiene tasa_impuesto > 0, se aplica sobre su subtotal (después del descuento del item)
            // El descuento global se aplica proporcionalmente a cada item
            let iva = 0;
            cart.forEach(item => {
                // Calcular el subtotal del item después del descuento del item
                const itemSubtotalAfterDiscount = item.subtotal;
                // Calcular la proporción del descuento global que corresponde a este item
                const itemProportion = subtotal > 0 ? item.subtotal / subtotal : 0;
                const itemGlobalDiscountAmount = discountAmount * itemProportion;
                // Subtotal del item después de todos los descuentos
                const itemSubtotalFinal = itemSubtotalAfterDiscount - itemGlobalDiscountAmount;
                
                // Si el producto tiene tasa_impuesto > 0, aplicar IVA sobre el subtotal del item
                if (item.taxRate && item.taxRate > 0) {
                    const itemIva = itemSubtotalFinal * (item.taxRate / 100);
                    iva += itemIva;
                }
            });
            
            // Total final
            const total = subtotalAfterDiscount + iva;

            // Actualizar campos de totales
            const totalesSection = document.getElementById('totales');
            if (totalesSection) {
                const readonlyInputs = totalesSection.querySelectorAll('input[readonly]');
                // Orden: [0] Subtotal, [1] IVA, [2] Total
                if (readonlyInputs.length >= 3) {
                    readonlyInputs[0].value = formatCOP(subtotal);
                    readonlyInputs[1].value = formatCOP(iva);
                    readonlyInputs[2].value = formatCOP(total);
                }
            }

            // Actualizar "Monto Recibido" con el total calculado
            const amountReceivedInput = document.getElementById('amountReceived');
            if (amountReceivedInput) {
                // Solo actualizar si el campo está vacío o tiene valor 0
                const currentValue = parseFloat(amountReceivedInput.value || 0);
                if (currentValue === 0 || !amountReceivedInput.value || amountReceivedInput.value.trim() === '') {
                    amountReceivedInput.value = total.toFixed(2);
                }
            }

            // Actualizar cálculo de cambio
            calculateChange();
        }

        // Seleccionar producto (solo llena los campos, NO agrega al carrito)
        function selectProduct(itemElement) {
            const productId = itemElement.getAttribute('data-id');
            const productName = itemElement.getAttribute('data-nombre');
            const productCode = itemElement.getAttribute('data-codigo');
            const categoriaId = itemElement.getAttribute('data-categoria-id');
            const categoriaNombre = itemElement.getAttribute('data-categoria-nombre');
            const categoriaCodigo = itemElement.getAttribute('data-categoria-codigo');
            const precio = parseFloat(itemElement.getAttribute('data-precio') || 0);
            const stock = parseInt(itemElement.getAttribute('data-stock') || 0);
            const activo = itemElement.getAttribute('data-activo') === 'true';
            const tasaImpuesto = parseFloat(itemElement.getAttribute('data-tasa-impuesto') || 0);

            // Guardar tasa_impuesto en un campo oculto para usarlo al agregar al carrito
            const selectedProductId = document.getElementById('selectedProductId');
            if (selectedProductId) {
                selectedProductId.setAttribute('data-tasa-impuesto', tasaImpuesto);
            }

            // Actualizar campo de producto
            const productSearchInput = document.getElementById('productSearch');
            if (productSearchInput) {
                productSearchInput.value = `${productName} - ${productCode}`;
            }
            if (selectedProductId) {
                selectedProductId.value = productId;
            }

            // Si el producto tiene categoría, actualizar el campo de categoría
            if (categoriaId && categoriaNombre) {
                const categoryInput = document.getElementById('productCategory');
                const selectedCategoryId = document.getElementById('selectedCategoryId');
                if (categoryInput && selectedCategoryId) {
                    // Marcar como selección programática para evitar búsqueda innecesaria
                    categoryInput.dataset.isSelection = 'true';
                    
                    const categoryDisplay = categoriaCodigo 
                        ? `${categoriaNombre} - ${categoriaCodigo}` 
                        : categoriaNombre;
                    categoryInput.value = categoryDisplay;
                    selectedCategoryId.value = categoriaId;
                    
                    // Limpiar el flag después de un breve momento
                    requestAnimationFrame(() => {
                        delete categoryInput.dataset.isSelection;
                    });
                }
            }

            // Llenar campos de Precio, Stock y Estado
            const productPriceInput = document.getElementById('productPrice');
            const productStockInput = document.getElementById('productStock');
            const productStatusInput = document.getElementById('productStatus');
            
            if (productPriceInput) {
                productPriceInput.value = precio;
            }
            if (productStockInput) {
                productStockInput.value = stock > 0 ? stock : '0';
            }
            if (productStatusInput) {
                // Determinar estado basado en stock y activo
                if (!activo) {
                    productStatusInput.value = 'Inactivo';
                    productStatusInput.className = 'form-control text-secondary';
                } else if (stock <= 0) {
                    productStatusInput.value = 'Sin Stock';
                    productStatusInput.className = 'form-control text-danger';
                } else {
                    productStatusInput.value = 'Disponible';
                    productStatusInput.className = 'form-control text-success';
                }
            }

            hideProductSuggestions();
        }

        // Función para agregar producto al carrito desde el formulario
        function addProductToCartFromForm() {
            const selectedProductIdElement = document.getElementById('selectedProductId');
            const productId = selectedProductIdElement?.value;
            const productName = document.getElementById('productSearch')?.value.split(' - ')[0] || '';
            const productCode = document.getElementById('productSearch')?.value.split(' - ')[1] || '';
            const categoriaNombre = document.getElementById('productCategory')?.value.split(' - ')[0] || 'Sin categoría';
            const quantity = parseInt(document.getElementById('productQuantity')?.value || 1);
            const precioInput = document.getElementById('productPrice');
            const precio = parseFloat(precioInput?.value || 0);
            const stockInput = document.getElementById('productStock');
            const stock = parseInt(stockInput?.value || 0);
            // Obtener tasa_impuesto del atributo data-tasa-impuesto del campo selectedProductId
            const taxRate = parseFloat(selectedProductIdElement?.getAttribute('data-tasa-impuesto') || 0);

            // Validaciones
            if (!productId || !productId.trim()) {
                alert('⚠️ Por favor seleccione un producto');
                return;
            }

            if (!productName || !productName.trim()) {
                alert('⚠️ Por favor seleccione un producto válido');
                return;
            }

            if (precio <= 0) {
                alert('⚠️ El precio debe ser mayor a 0');
                precioInput?.focus();
                return;
            }

            if (quantity <= 0) {
                alert('⚠️ La cantidad debe ser mayor a 0');
                return;
            }

            if (stock <= 0) {
                const confirmAdd = confirm(`⚠️ El producto "${productName}" no tiene stock disponible.\n¿Desea agregarlo al carrito de todas formas?`);
                if (!confirmAdd) {
                    return;
                }
            }

            if (quantity > stock && stock > 0) {
                const confirmAdd = confirm(`⚠️ La cantidad solicitada (${quantity}) es mayor al stock disponible (${stock}).\n¿Desea agregarlo al carrito de todas formas?`);
                if (!confirmAdd) {
                    return;
                }
            }

            // Agregar al carrito (incluyendo tasa_impuesto)
            addToCart(productId, productCode, productName, categoriaNombre, precio, stock, quantity, taxRate);

            // Limpiar campos después de agregar
            document.getElementById('productSearch').value = '';
            document.getElementById('selectedProductId').value = '';
            document.getElementById('productCategory').value = '';
            document.getElementById('selectedCategoryId').value = '';
            document.getElementById('productQuantity').value = 1;
            document.getElementById('productPrice').value = '';
            document.getElementById('productStock').value = '';
            const productStatusInput = document.getElementById('productStatus');
            if (productStatusInput) {
                productStatusInput.value = '';
                productStatusInput.className = 'form-control';
            }
        }

        // Hacer selectProduct global para que showProductSuggestions pueda usarla
        window.selectProduct = selectProduct;

        // Offcanvas y sincronización de chevrons
        const offcanvasElement = document.getElementById('posSidebar');
        if (offcanvasElement) {
            const offcanvas = new bootstrap.Offcanvas(offcanvasElement);
            offcanvasElement.addEventListener('show.bs.offcanvas', function() { this.classList.add('show'); });
            offcanvasElement.addEventListener('hide.bs.offcanvas', function() { this.classList.remove('show'); });
        }

        // Sincronizar chevrons de los colapsos
        const collapseElements = ['nuevaVenta', 'busquedaProductos', 'carritoCompras', 'totales', 'metodoPago', 'acciones', 'ventasRecientes'];
        collapseElements.forEach(id => {
            const collapseElement = document.getElementById(id);
            if (collapseElement) {
                const header = collapseElement.previousElementSibling;
                const button = header?.querySelector('button[data-bs-toggle="collapse"]');
                const chevron = button?.querySelector('.fa-chevron-up, .fa-chevron-down');
                
                if (chevron) {
                    collapseElement.addEventListener('show.bs.collapse', function() {
                        chevron.classList.remove('fa-chevron-down');
                        chevron.classList.add('fa-chevron-up');
                    });
                    
                    collapseElement.addEventListener('hide.bs.collapse', function() {
                        chevron.classList.remove('fa-chevron-up');
                        chevron.classList.add('fa-chevron-down');
                    });
                }
            }
        });

        // Verificar autenticación
        if (window.ensureAuthenticated && !window.ensureAuthenticated()) {
            return;
        }

        // Cargar cliente por defecto
        await loadDefaultCustomer();

        // Cargar vendedor por defecto
        await loadDefaultSalesperson();

        // Eventos para búsqueda de clientes
        const customerSearch = document.getElementById('customerSearch');
        const customerSuggestions = document.getElementById('customerSuggestions');

        if (customerSearch) {
            // Búsqueda mientras escribe (debounce optimizado a 200ms)
            customerSearch.addEventListener('input', debounce((e) => {
                const query = e.target.value.trim();
                if (query.length >= 1) {
                    searchCustomers(query);
                } else {
                    hideCustomerSuggestions();
                }
            }, 200, 'customer'));

            // Mostrar sugerencias al hacer focus si hay texto
            customerSearch.addEventListener('focus', function() {
                const query = this.value.trim();
                if (query.length >= 1) {
                    searchCustomers(query);
                }
            });

            // Ocultar sugerencias al hacer blur
            customerSearch.addEventListener('blur', function() {
                setTimeout(() => {
                    // Verificar si el nuevo foco no está en el dropdown
                    const activeElement = document.activeElement;
                    const isFocusOnDropdown = activeElement && (
                        activeElement.closest('#customerSuggestions') !== null
                    );
                    if (!isInteractingWithSuggestions && !isFocusOnDropdown) {
                        hideCustomerSuggestions();
                    }
                }, 200);
            });

            // Manejar teclado
            customerSearch.addEventListener('keydown', function(e) {
                const handled = handleKeyboardNavigation(
                    e,
                    'customerSuggestions',
                    '.customer-suggestion-item',
                    customerSelectedIndex,
                    (idx) => { customerSelectedIndex = idx; },
                    selectCustomer
                );
                if (!handled && e.key === 'Escape') {
                    hideCustomerSuggestions();
                    customerSelectedIndex = -1;
                }
            });
        }

        // Manejar interacciones con el contenedor de sugerencias
        if (customerSuggestions) {
            customerSuggestions.addEventListener('mousedown', function() {
                isInteractingWithSuggestions = true;
            });

            customerSuggestions.addEventListener('mouseup', function() {
                setTimeout(() => {
                    isInteractingWithSuggestions = false;
                }, 100);
            });

            customerSuggestions.addEventListener('wheel', function(e) {
                isInteractingWithSuggestions = true;
            });
        }

        // Reposicionar sugerencias al hacer scroll o resize (optimizado con throttle)
        window.addEventListener('scroll', throttle(function() {
            const inputElement = document.getElementById('customerSearch');
            const container = document.getElementById('customerSuggestions');
            if (inputElement && container && container.style.display === 'block') {
                positionSuggestions(container, inputElement);
            }
        }, 100), { passive: true });

        window.addEventListener('resize', throttle(function() {
            const inputElement = document.getElementById('customerSearch');
            const container = document.getElementById('customerSuggestions');
            if (inputElement && container && container.style.display === 'block') {
                positionSuggestions(container, inputElement);
            }
        }, 100));

        // Eventos para búsqueda de vendedores
        const salespersonSearch = document.getElementById('salespersonSearch');
        const salespersonSuggestions = document.getElementById('salespersonSuggestionsFixed');

        if (salespersonSearch) {
            // Búsqueda mientras escribe (debounce optimizado a 200ms)
            salespersonSearch.addEventListener('input', debounce((e) => {
                const query = e.target.value.trim();
                if (query.length >= 1) {
                    searchSalespersons(query);
                } else {
                    hideSalespersonSuggestions();
                }
            }, 200, 'salesperson'));

            // Mostrar sugerencias al hacer focus si hay texto
            salespersonSearch.addEventListener('focus', function() {
                const query = this.value.trim();
                if (query.length >= 1) {
                    searchSalespersons(query);
                }
            });

            // Ocultar sugerencias al hacer blur
            salespersonSearch.addEventListener('blur', function() {
                setTimeout(() => {
                    // Verificar si el nuevo foco no está en el dropdown
                    const activeElement = document.activeElement;
                    const isFocusOnDropdown = activeElement && (
                        activeElement.closest('#salespersonSuggestionsFixed') !== null
                    );
                    if (!isInteractingWithSalespersonSuggestions && !isFocusOnDropdown) {
                        hideSalespersonSuggestions();
                    }
                }, 200);
            });

            // Manejar teclado
            salespersonSearch.addEventListener('keydown', function(e) {
                const handled = handleKeyboardNavigation(
                    e,
                    'salespersonSuggestionsFixed',
                    '.salesperson-suggestion-item',
                    salespersonSelectedIndex,
                    (idx) => { salespersonSelectedIndex = idx; },
                    selectSalesperson
                );
                if (!handled && e.key === 'Escape') {
                    hideSalespersonSuggestions();
                    salespersonSelectedIndex = -1;
                }
            });
        }

        // Manejar interacciones con el contenedor de sugerencias de vendedores
        if (salespersonSuggestions) {
            salespersonSuggestions.addEventListener('mousedown', function() {
                isInteractingWithSalespersonSuggestions = true;
            });

            salespersonSuggestions.addEventListener('mouseup', function() {
                setTimeout(() => {
                    isInteractingWithSalespersonSuggestions = false;
                }, 100);
            });

            salespersonSuggestions.addEventListener('wheel', function(e) {
                isInteractingWithSalespersonSuggestions = true;
            });
        }

        // Reposicionar sugerencias de vendedores al hacer scroll o resize (optimizado con throttle)
        window.addEventListener('scroll', throttle(function() {
            const inputElement = document.getElementById('salespersonSearch');
            const container = document.getElementById('salespersonSuggestionsFixed');
            if (inputElement && container && container.style.display === 'block') {
                positionSalespersonSuggestions(container, inputElement);
            }
        }, 100), { passive: true });

        window.addEventListener('resize', throttle(function() {
            const inputElement = document.getElementById('salespersonSearch');
            const container = document.getElementById('salespersonSuggestionsFixed');
            if (inputElement && container && container.style.display === 'block') {
                positionSalespersonSuggestions(container, inputElement);
            }
        }, 100));

        // Eventos para búsqueda de productos
        const productSearch = document.getElementById('productSearch');
        const productSuggestions = document.getElementById('productSuggestionsFixed');

        if (productSearch) {
            // Búsqueda mientras escribe (debounce optimizado a 200ms)
            productSearch.addEventListener('input', debounce((e) => {
                const query = e.target.value.trim();
                if (query.length >= 1) {
                    searchProducts(query);
                } else {
                    hideProductSuggestions();
                }
            }, 200, 'product'));

            productSearch.addEventListener('focus', function() {
                const query = this.value.trim();
                if (query.length >= 1) {
                    searchProducts(query);
                }
            });

            productSearch.addEventListener('blur', function() {
                setTimeout(() => {
                    // Verificar si el nuevo foco no está en el dropdown o en el botón de listar
                    const activeElement = document.activeElement;
                    const isFocusOnDropdown = activeElement && (
                        activeElement.closest('#productSuggestionsFixed') !== null ||
                        activeElement.id === 'listProductsBtn'
                    );
                    if (!isInteractingWithProductSuggestions && !isFocusOnDropdown) {
                        hideProductSuggestions();
                    }
                }, 200);
            });

            productSearch.addEventListener('keydown', function(e) {
                const handled = handleKeyboardNavigation(
                    e,
                    'productSuggestionsFixed',
                    '.product-suggestion-item',
                    productSelectedIndex,
                    (idx) => { productSelectedIndex = idx; },
                    window.selectProduct || selectProduct
                );
                if (!handled && e.key === 'Escape') {
                    hideProductSuggestions();
                    productSelectedIndex = -1;
                }
            });
        }

        // Botón para listar todos los productos
        const listProductsBtn = document.getElementById('listProductsBtn');
        if (listProductsBtn) {
            listProductsBtn.addEventListener('click', async function() {
                await listAllProducts();
            });
        }

        // Botón para agregar producto al carrito
        const addToCartBtn = document.getElementById('addToCartBtn');
        if (addToCartBtn) {
            addToCartBtn.addEventListener('click', function() {
                addProductToCartFromForm();
            });
        }

        if (productSuggestions) {
            productSuggestions.addEventListener('mousedown', function() {
                isInteractingWithProductSuggestions = true;
            });

            productSuggestions.addEventListener('mouseup', function() {
                setTimeout(() => {
                    isInteractingWithProductSuggestions = false;
                }, 100);
            });

            productSuggestions.addEventListener('wheel', function(e) {
                isInteractingWithProductSuggestions = true;
            });
        }

        // Reposicionar sugerencias de productos (optimizado con throttle)
        window.addEventListener('scroll', throttle(function() {
            const inputElement = document.getElementById('productSearch');
            const container = document.getElementById('productSuggestionsFixed');
            if (inputElement && container && container.style.display === 'block') {
                positionProductSuggestions(container, inputElement);
            }
        }, 100), { passive: true });

        window.addEventListener('resize', throttle(function() {
            const inputElement = document.getElementById('productSearch');
            const container = document.getElementById('productSuggestionsFixed');
            if (inputElement && container && container.style.display === 'block') {
                positionProductSuggestions(container, inputElement);
            }
        }, 100));

        // Eventos para búsqueda de categorías
        const productCategory = document.getElementById('productCategory');
        const categorySuggestions = document.getElementById('categorySuggestionsFixed');

        if (productCategory) {
            // Variable para rastrear si el valor cambió por selección o por escritura manual
            let categoryValueBeforeInput = '';
            
            productCategory.addEventListener('input', debounce((e) => {
                const query = e.target.value.trim();
                const selectedCategoryId = document.getElementById('selectedCategoryId');
                const categoryInput = e.target;
                
                // Si es un cambio programático (desde selectProduct o selectCategory), no hacer búsqueda
                if (categoryInput.dataset.isSelection === 'true') {
                    delete categoryInput.dataset.isSelection;
                    categoryValueBeforeInput = query;
                    return;
                }
                
                // Si el campo se vació o cambió manualmente (no por selección)
                if (query.length === 0) {
                    // Limpiar categoría seleccionada
                    if (selectedCategoryId) {
                        selectedCategoryId.value = '';
                    }
                    hideCategorySuggestions();
                    
                    // Si hay texto en productos, buscar sin filtro de categoría
                    const productSearchValue = document.getElementById('productSearch')?.value.trim() || '';
                    if (productSearchValue.length >= 1) {
                        searchProducts(productSearchValue);
                    }
                } else if (query !== categoryValueBeforeInput && !query.includes(' - ')) {
                    // El usuario está escribiendo manualmente (no es una selección del dropdown)
                    // Si cambió el texto y no parece ser una selección, limpiar el ID seleccionado
                    if (selectedCategoryId && selectedCategoryId.value) {
                        selectedCategoryId.value = '';
                    }
                    searchCategories(query);
                } else if (query.length >= 1 && query.includes(' - ')) {
                    // Parece ser una selección (tiene formato "Nombre - Código")
                    // Si ya hay un ID seleccionado, no buscar (ya está seleccionado)
                    if (!selectedCategoryId || !selectedCategoryId.value) {
                        // Podría ser que el usuario escribió el formato manualmente, buscar
                        searchCategories(query.split(' - ')[0]);
                    }
                } else if (query.length >= 1) {
                    // Mantener la búsqueda de categorías
                    searchCategories(query);
                }
                
                categoryValueBeforeInput = query;
            }, 200, 'category'));

            productCategory.addEventListener('focus', function() {
                const query = this.value.trim();
                if (query.length >= 1) {
                    searchCategories(query);
                }
            });

            productCategory.addEventListener('blur', function() {
                setTimeout(() => {
                    // Verificar si el nuevo foco no está en el dropdown
                    const activeElement = document.activeElement;
                    const isFocusOnDropdown = activeElement && (
                        activeElement.closest('#categorySuggestionsFixed') !== null
                    );
                    if (!isInteractingWithCategorySuggestions && !isFocusOnDropdown) {
                        hideCategorySuggestions();
                    }
                }, 200);
            });

            productCategory.addEventListener('keydown', function(e) {
                const handled = handleKeyboardNavigation(
                    e,
                    'categorySuggestionsFixed',
                    '.category-suggestion-item',
                    categorySelectedIndex,
                    (idx) => { categorySelectedIndex = idx; },
                    selectCategory
                );
                if (!handled && e.key === 'Escape') {
                    hideCategorySuggestions();
                    categorySelectedIndex = -1;
                }
            });
        }

        if (categorySuggestions) {
            categorySuggestions.addEventListener('mousedown', function() {
                isInteractingWithCategorySuggestions = true;
            });

            categorySuggestions.addEventListener('mouseup', function() {
                setTimeout(() => {
                    isInteractingWithCategorySuggestions = false;
                }, 100);
            });

            categorySuggestions.addEventListener('wheel', function(e) {
                isInteractingWithCategorySuggestions = true;
            });
        }

        // Reposicionar sugerencias de categorías (optimizado con throttle)
        window.addEventListener('scroll', throttle(function() {
            const inputElement = document.getElementById('productCategory');
            const container = document.getElementById('categorySuggestionsFixed');
            if (inputElement && container && container.style.display === 'block') {
                positionCategorySuggestions(container, inputElement);
            }
        }, 100), { passive: true });

        window.addEventListener('resize', throttle(function() {
            const inputElement = document.getElementById('productCategory');
            const container = document.getElementById('categorySuggestionsFixed');
            if (inputElement && container && container.style.display === 'block') {
                positionCategorySuggestions(container, inputElement);
            }
        }, 100));

        // ===== LÓGICA DEL FORMULARIO DE VENTAS =====
        const salesForm = document.getElementById('salesForm');
        const processSaleBtn = document.getElementById('processSaleBtn');
        const saveDraftBtn = document.getElementById('saveDraftBtn');
        const holdSaleBtn = document.getElementById('holdSaleBtn');
        const printReceiptBtn = document.getElementById('printReceiptBtn');
        const clearCartBtn = document.getElementById('clearCartBtn');
        const amountReceived = document.getElementById('amountReceived');
        const paymentMethod = document.getElementById('paymentMethod');

        // Cálculo de cambio
        function calculateChange() {
            // Obtener el total real del carrito desde el campo de total
            const totalInput = document.getElementById('totalVenta');
            let total = 0;
            if (totalInput) {
                const totalText = totalInput.value.replace(/[^\d]/g, '');
                total = parseFloat(totalText) || 0;
            }
            
            const received = parseFloat(amountReceived?.value || 0) || 0;
            const change = received - total;
            
            // Actualizar el campo de cambio
            const cambioInput = document.getElementById('cambioVenta');
            if (cambioInput) {
                cambioInput.value = change >= 0 ? formatCOP(change) : 'Insuficiente';
                cambioInput.className = change >= 0 ? 'form-control' : 'form-control text-danger';
            }
        }

        if (amountReceived) {
            amountReceived.addEventListener('input', calculateChange);
        }

        // Procesar venta
        if (processSaleBtn) {
            processSaleBtn.addEventListener('click', async () => {
                await processSale();
            });
        }

        // Función para procesar la venta completa
        async function processSale() {
            try {
                // ===== VALIDACIONES =====
                
                // 1. Validar que hay productos en el carrito
                if (!cart || cart.length === 0) {
                    alert('⚠️ Debe agregar al menos un producto al carrito');
                    return;
                }

                // 2. Validar que hay cliente seleccionado
                const selectedCustomerId = document.getElementById('selectedCustomerId')?.value;
                if (!selectedCustomerId || selectedCustomerId.trim() === '') {
                    alert('⚠️ Debe seleccionar un cliente');
                    document.getElementById('customerSearch')?.focus();
                    return;
                }

                // 3. Validar que hay vendedor seleccionado
                const selectedSalespersonId = document.getElementById('selectedSalespersonId')?.value;
                if (!selectedSalespersonId || selectedSalespersonId.trim() === '') {
                    alert('⚠️ Debe seleccionar un vendedor');
                    document.getElementById('salespersonSearch')?.focus();
                    return;
                }

                // 4. Validar método de pago y monto recibido
                const metodoPago = paymentMethod?.value || 'efectivo';
                const montoRecibido = parseFloat(amountReceived?.value || 0);
                const totalInput = document.getElementById('totalVenta');
                let total = 0;
                if (totalInput) {
                    const totalText = totalInput.value.replace(/[^\d]/g, '');
                    total = parseFloat(totalText) || 0;
                }

                if ((metodoPago === 'efectivo' || metodoPago === 'mixto') && montoRecibido < total) {
                    alert(`⚠️ El monto recibido (${formatCOP(montoRecibido)}) es insuficiente para cubrir el total (${formatCOP(total)})`);
                    amountReceived?.focus();
                    return;
                }

                // 5. Obtener usuario actual (para created_by y updated_by)
                let currentUserId = null;
                try {
                    if (window.supabaseClient) {
                        const { data: { session } } = await window.supabaseClient.auth.getSession();
                        currentUserId = session?.user?.id || null;
                    }
                } catch (error) {
                    console.error('Error obteniendo usuario actual:', error);
                }

                if (!currentUserId) {
                    alert('⚠️ No hay usuario autenticado. Por favor, inicie sesión.');
                    return;
                }

                // Confirmar procesamiento
                if (!confirm(`¿Procesar esta venta por un total de ${formatCOP(total)}?`)) {
                    return;
                }

                // Deshabilitar botón durante el procesamiento
                const originalBtnText = processSaleBtn.innerHTML;
                processSaleBtn.disabled = true;
                processSaleBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-1"></i>Procesando...';

                // ===== PREPARAR DATOS PARA LA VENTA =====
                
                // Obtener fecha/hora
                const saleDateTime = document.getElementById('saleDateTime')?.value;
                if (!saleDateTime) {
                    throw new Error('La fecha y hora de venta es obligatoria');
                }
                // Convertir a formato ISO para Supabase
                const fechaVenta = new Date(saleDateTime).toISOString();

                // Obtener totales
                const subtotalInput = document.querySelector('#totales input[readonly]');
                const ivaInput = subtotalInput?.parentElement?.parentElement?.querySelectorAll('input[readonly]')[1];
                const descuentoGlobalInput = document.querySelector('#totales input[type="number"]');
                const descuentoGlobal = parseFloat(descuentoGlobalInput?.value || 0);
                
                let subtotal = 0;
                let iva = 0;
                
                if (subtotalInput) {
                    const subtotalText = subtotalInput.value.replace(/[^\d]/g, '');
                    subtotal = parseFloat(subtotalText) || 0;
                }
                
                if (ivaInput) {
                    const ivaText = ivaInput.value.replace(/[^\d]/g, '');
                    iva = parseFloat(ivaText) || 0;
                }

                // Obtener observaciones
                const observacionesTextarea = document.querySelector('#metodoPago textarea');
                const notas = observacionesTextarea?.value?.trim() || null;

                // Preparar detalles de venta
                const detalles = cart.map(item => {
                    // Calcular subtotal del item (después de descuento del item)
                    const itemSubtotal = item.subtotal;
                    // Calcular proporción del descuento global que corresponde a este item
                    const totalSubtotal = cart.reduce((sum, i) => sum + i.subtotal, 0);
                    const itemProportion = totalSubtotal > 0 ? itemSubtotal / totalSubtotal : 0;
                    const itemGlobalDiscount = (subtotal * (descuentoGlobal / 100)) * itemProportion;
                    const itemSubtotalFinal = itemSubtotal - itemGlobalDiscount;
                    
                    // Calcular IVA del item
                    const itemIva = item.taxRate && item.taxRate > 0 
                        ? itemSubtotalFinal * (item.taxRate / 100) 
                        : 0;
                    
                    // Total del item (subtotal final + IVA)
                    const itemTotal = itemSubtotalFinal + itemIva;

                    return {
                        producto_id: item.productId,
                        cantidad: item.quantity,
                        precio_unitario: item.price,
                        descuento: item.discount,
                        tasa_impuesto: item.taxRate || 0,
                        subtotal: itemSubtotalFinal,
                        impuesto: itemIva,
                        total: itemTotal
                    };
                });

                // Preparar datos de la venta
                const ventaData = {
                    cliente_id: selectedCustomerId !== '99999' ? selectedCustomerId : null, // Si es "99999", dejar null
                    usuario_id: selectedSalespersonId,
                    fecha_venta: fechaVenta,
                    metodo_pago: metodoPago,
                    estado: 'completada',
                    subtotal: subtotal,
                    impuesto: iva,
                    descuento: subtotal * (descuentoGlobal / 100),
                    total: total,
                    notas: notas
                };

                // ===== PERSISTIR EN BASE DE DATOS =====
                
                if (!window.db) {
                    throw new Error('No hay conexión con el servicio de base de datos');
                }

                const result = await window.db.createVenta(ventaData, detalles);

                if (result.error) {
                    throw new Error(result.error.message || 'Error al procesar la venta');
                }

                // ===== ÉXITO: LIMPIAR Y ACTUALIZAR =====
                
                const numeroVenta = result.data?.venta?.numero_venta || 'N/A';
                
                // Mostrar mensaje de éxito
                alert(`✅ Venta procesada exitosamente!\n\nNúmero de venta: ${numeroVenta}\nTotal: ${formatCOP(total)}`);

                // Limpiar formulario
                clearSaleForm();

                // Actualizar KPIs
                await updateSalesKPIs();

                // Recargar ventas recientes
                currentPageVentas = 1; // Resetear a la primera página
                await loadVentasRecientes();

                // Restaurar botón
                processSaleBtn.disabled = false;
                processSaleBtn.innerHTML = originalBtnText;

            } catch (error) {
                console.error('Error procesando venta:', error);
                alert(`❌ Error al procesar la venta: ${error.message || 'Error desconocido'}`);
                
                // Restaurar botón en caso de error
                if (processSaleBtn) {
                    processSaleBtn.disabled = false;
                    processSaleBtn.innerHTML = '<i class="fas fa-check me-1"></i>Procesar Venta';
                }
            }
        }

        // Función para limpiar el formulario después de procesar
        function clearSaleForm() {
            // Limpiar carrito
            cart = [];
            renderCart();
            updateCartTotals();

            // Limpiar campos de búsqueda
            const customerSearch = document.getElementById('customerSearch');
            const selectedCustomerId = document.getElementById('selectedCustomerId');
            if (customerSearch) customerSearch.value = '';
            if (selectedCustomerId) {
                selectedCustomerId.value = '';
                // Cargar cliente por defecto "99999"
                loadDefaultCustomer();
            }

            const salespersonSearch = document.getElementById('salespersonSearch');
            const selectedSalespersonId = document.getElementById('selectedSalespersonId');
            if (salespersonSearch) salespersonSearch.value = '';
            if (selectedSalespersonId) {
                selectedSalespersonId.value = '';
                // Cargar vendedor por defecto
                loadDefaultSalesperson();
            }

            // Resetear fecha/hora a actual
            const saleDateTime = document.getElementById('saleDateTime');
            if (saleDateTime) {
                const now = new Date();
                const year = now.getFullYear();
                const month = String(now.getMonth() + 1).padStart(2, '0');
                const day = String(now.getDate()).padStart(2, '0');
                const hours = String(now.getHours()).padStart(2, '0');
                const minutes = String(now.getMinutes()).padStart(2, '0');
                saleDateTime.value = `${year}-${month}-${day}T${hours}:${minutes}`;
            }

            // Limpiar búsqueda de productos
            const productSearch = document.getElementById('productSearch');
            const selectedProductId = document.getElementById('selectedProductId');
            const productCategory = document.getElementById('productCategory');
            const selectedCategoryId = document.getElementById('selectedCategoryId');
            const productPrice = document.getElementById('productPrice');
            const productStock = document.getElementById('productStock');
            const productStatus = document.getElementById('productStatus');
            const productQuantity = document.getElementById('productQuantity');

            if (productSearch) productSearch.value = '';
            if (selectedProductId) {
                selectedProductId.value = '';
                selectedProductId.removeAttribute('data-tasa-impuesto');
            }
            if (productCategory) productCategory.value = '';
            if (selectedCategoryId) selectedCategoryId.value = '';
            if (productPrice) productPrice.value = '';
            if (productStock) productStock.value = '';
            if (productStatus) {
                productStatus.value = '';
                productStatus.className = 'form-control';
            }
            if (productQuantity) productQuantity.value = '1';

            // Limpiar método de pago
            if (paymentMethod) paymentMethod.value = 'efectivo';
            if (amountReceived) amountReceived.value = '0';
            const cambioInput = document.getElementById('cambioVenta');
            if (cambioInput) {
                cambioInput.value = '$ 0';
                cambioInput.className = 'form-control';
            }
            const observacionesTextarea = document.querySelector('#metodoPago textarea');
            if (observacionesTextarea) observacionesTextarea.value = '';

            // Limpiar descuento global
            const descuentoGlobalInput = document.querySelector('#totales input[type="number"]');
            if (descuentoGlobalInput) descuentoGlobalInput.value = '0';
        }

        // Función para actualizar KPIs del resumen
        async function updateSalesKPIs() {
            try {
                if (!window.db) return;

                // Obtener fecha de hoy (inicio y fin del día)
                const hoy = new Date();
                hoy.setHours(0, 0, 0, 0);
                const hoyFin = new Date(hoy);
                hoyFin.setHours(23, 59, 59, 999);

                const fechaInicio = hoy.toISOString();
                const fechaFin = hoyFin.toISOString();

                const stats = await window.db.getVentasStats({
                    fechaInicio: fechaInicio,
                    fechaFin: fechaFin
                });

                if (stats.error) {
                    console.error('Error obteniendo estadísticas:', stats.error);
                    return;
                }

                const data = stats.data || {};

                // Actualizar tarjetas
                const ventasHoyCard = document.querySelector('.row.g-2.g-md-3.mb-4 .col-6.col-lg-3:nth-child(1) h4');
                const totalHoyCard = document.querySelector('.row.g-2.g-md-3.mb-4 .col-6.col-lg-3:nth-child(2) h4');
                const promedioCard = document.querySelector('.row.g-2.g-md-3.mb-4 .col-6.col-lg-3:nth-child(3) h4');
                const ultimaVentaCard = document.querySelector('.row.g-2.g-md-3.mb-4 .col-6.col-lg-3:nth-child(4) h4');

                if (ventasHoyCard) {
                    ventasHoyCard.textContent = data.totalVentas || 0;
                }
                if (totalHoyCard) {
                    totalHoyCard.textContent = formatCOP(data.totalMonto || 0);
                }
                if (promedioCard) {
                    promedioCard.textContent = formatCOP(data.promedio || 0);
                }
                if (ultimaVentaCard && data.ultimaVenta) {
                    const fechaUltima = new Date(data.ultimaVenta.fecha_venta);
                    const ahora = new Date();
                    const diffMs = ahora - fechaUltima;
                    const diffMins = Math.floor(diffMs / 60000);
                    
                    if (diffMins < 1) {
                        ultimaVentaCard.textContent = 'Ahora';
                    } else if (diffMins < 60) {
                        ultimaVentaCard.textContent = `${diffMins} min`;
                    } else {
                        const diffHours = Math.floor(diffMins / 60);
                        ultimaVentaCard.textContent = `${diffHours} h`;
                    }
                }
            } catch (error) {
                console.error('Error actualizando KPIs:', error);
            }
        }

        // Inicializar fecha/hora actual al cargar la página
        function initializeSaleDateTime() {
            const saleDateTime = document.getElementById('saleDateTime');
            if (saleDateTime && !saleDateTime.value) {
                const now = new Date();
                const year = now.getFullYear();
                const month = String(now.getMonth() + 1).padStart(2, '0');
                const day = String(now.getDate()).padStart(2, '0');
                const hours = String(now.getHours()).padStart(2, '0');
                const minutes = String(now.getMinutes()).padStart(2, '0');
                saleDateTime.value = `${year}-${month}-${day}T${hours}:${minutes}`;
            }
        }

        // Inicializar al cargar
        initializeSaleDateTime();
        // Actualizar KPIs al cargar
        updateSalesKPIs();

        // Guardar borrador
        if (saveDraftBtn) {
            saveDraftBtn.addEventListener('click', () => {
                alert('Borrador guardado exitosamente');
            });
        }

        // Pausar venta
        if (holdSaleBtn) {
            holdSaleBtn.addEventListener('click', () => {
                alert('Venta pausada. Puedes continuarla más tarde.');
            });
        }

        // Imprimir recibo
        if (printReceiptBtn) {
            printReceiptBtn.addEventListener('click', () => {
                alert('Enviando a impresora...');
            });
        }

        // Limpiar carrito
        if (clearCartBtn) {
            clearCartBtn.addEventListener('click', () => {
                if (confirm('¿Limpiar el carrito de compras?')) {
                    cart = [];
                    renderCart();
                    updateCartTotals();
                }
            });
        }

        // Funciones globales para el carrito
        window.updateQuantity = function(index, changeOrValue) {
            if (index < 0 || index >= cart.length) return;
            
            const item = cart[index];
            
            // Si changeOrValue es negativo o positivo, es un cambio relativo
            // Si es mayor a 0, es un valor absoluto
            if (typeof changeOrValue === 'number') {
                if (changeOrValue < 0) {
                    // Decrementar
                    item.quantity = Math.max(1, item.quantity + changeOrValue);
                } else if (changeOrValue > 0 && changeOrValue !== 1 && changeOrValue !== -1) {
                    // Es un valor absoluto (del input onchange)
                    item.quantity = Math.max(1, changeOrValue);
                } else {
                    // Incrementar
                    item.quantity = Math.max(1, item.quantity + changeOrValue);
                }
            }
            
            // Recalcular subtotal
            item.subtotal = calculateItemSubtotal(item.price, item.quantity, item.discount);
            
            // Renderizar y actualizar totales
            renderCart();
            updateCartTotals();
        };

        window.updatePrice = function(index, newPrice) {
            if (index < 0 || index >= cart.length) return;
            
            const item = cart[index];
            if (newPrice < 0) {
                newPrice = 0;
            }
            item.price = parseFloat(newPrice) || 0;
            
            // Recalcular subtotal
            item.subtotal = calculateItemSubtotal(item.price, item.quantity, item.discount);
            
            // Renderizar y actualizar totales
            renderCart();
            updateCartTotals();
        };

        window.updateDiscount = function(index, discountPercent) {
            if (index < 0 || index >= cart.length) return;
            
            const item = cart[index];
            item.discount = Math.max(0, Math.min(100, discountPercent || 0));
            
            // Recalcular subtotal
            item.subtotal = calculateItemSubtotal(item.price, item.quantity, item.discount);
            
            // Renderizar y actualizar totales
            renderCart();
            updateCartTotals();
        };

        window.removeProduct = function(index) {
            if (index < 0 || index >= cart.length) return;
            
            if (confirm(`¿Eliminar "${cart[index].name}" del carrito?`)) {
                cart.splice(index, 1);
                renderCart();
                updateCartTotals();
            }
        };

        // Actualizar estadísticas (simulación)
        function updateStats() {
            console.log('Actualizando estadísticas de ventas...');
        }

        // Listener para descuento global
        const globalDiscountInput = document.querySelector('#totales input[type="number"]');
        if (globalDiscountInput) {
            globalDiscountInput.addEventListener('input', function() {
                updateCartTotals();
            });
        }

        // Inicializar carrito vacío al cargar
        renderCart();
        
        // Inicializar
        updateStats();
        calculateChange();

        // ===== PAGINACIÓN DE VENTAS RECIENTES =====
        let ventasRecientesData = [];
        let currentPageVentas = 1;
        const pageSizeVentas = 10;
        let totalVentasCount = 0;

        // Cargar ventas recientes desde la base de datos
        async function loadVentasRecientes() {
            try {
                if (!window.supabaseClient) return;
                
                const offset = (currentPageVentas - 1) * pageSizeVentas;
                
                // Query para obtener ventas con JOIN a clientes usando la sintaxis de Supabase
                // Supabase permite hacer joins usando el nombre de la foreign key relation
                let query = window.supabaseClient
                    .from('ventas')
                    .select(`
                        id,
                        numero_venta,
                        fecha_venta,
                        total,
                        metodo_pago,
                        estado,
                        notas,
                        cliente_id,
                        usuario_id,
                        clientes:cliente_id(
                            id,
                            nombre_completo,
                            tipo_id,
                            numero_id
                        )
                    `, { count: 'exact' })
                    .eq('estado', 'completada')
                    .is('deleted_at', null)
                    .order('fecha_venta', { ascending: false })
                    .range(offset, offset + pageSizeVentas - 1);

                const { data: ventas, error, count } = await query;

                if (error) {
                    console.error('Error cargando ventas recientes:', error);
                    console.error('Detalles del error:', JSON.stringify(error, null, 2));
                    return;
                }

                if (!ventas || ventas.length === 0) {
                    totalVentasCount = count || 0;
                    ventasRecientesData = [];
                    renderVentasRecientes();
                    renderPaginationVentas();
                    return;
                }

                // Los clientes ya vienen en el JOIN desde la consulta anterior
                // Verificar si el JOIN funcionó correctamente
                console.log('Ventas recibidas con JOIN:', ventas.length);
                ventas.forEach((v, index) => {
                    console.log(`Venta ${index + 1}:`, {
                        numero: v.numero_venta,
                        cliente_id: v.cliente_id,
                        cliente_join: v.clientes ? `✅ ${v.clientes.nombre_completo}` : '❌ null'
                    });
                });

                // Obtener IDs únicos de usuarios para consultar por separado
                const usuarioIds = ventas.filter(v => v.usuario_id).map(v => v.usuario_id);
                const ventaIds = ventas.map(v => v.id);

                // Obtener información de usuarios
                const usuariosMap = new Map();
                if (usuarioIds.length > 0) {
                    const { data: usuarios, error: usuariosError } = await window.supabaseClient
                        .from('usuarios')
                        .select('id, nombre, apellido')
                        .in('id', usuarioIds);
                    
                    if (!usuariosError && usuarios) {
                        usuarios.forEach(u => usuariosMap.set(u.id, u));
                    }
                }

                // Obtener productos por venta con JOIN a la tabla productos
                const { data: detalles, error: detallesError } = await window.supabaseClient
                    .from('ventas_detalle')
                    .select(`
                        venta_id,
                        cantidad,
                        productos:producto_id(
                            id,
                            nombre
                        )
                    `)
                    .in('venta_id', ventaIds);

                // Agrupar productos por venta
                const productosPorVenta = {};
                if (!detallesError && detalles) {
                    detalles.forEach(d => {
                        if (!productosPorVenta[d.venta_id]) {
                            productosPorVenta[d.venta_id] = [];
                        }
                        if (d.productos && d.productos.nombre) {
                            const cantidad = d.cantidad || 1;
                            const nombreProducto = d.productos.nombre;
                            // Si hay cantidad > 1, mostrar cantidad x nombre
                            const productoTexto = cantidad > 1 
                                ? `${cantidad}x ${nombreProducto}` 
                                : nombreProducto;
                            productosPorVenta[d.venta_id].push(productoTexto);
                        }
                    });
                }

                // Si el JOIN no funcionó, hacer consultas individuales de clientes faltantes
                const clientesFaltantes = ventas.filter(v => v.cliente_id && !v.clientes);
                if (clientesFaltantes.length > 0) {
                    console.log(`⚠️ ${clientesFaltantes.length} ventas sin cliente del JOIN. Consultando individualmente...`);
                    const clienteIdsFaltantes = [...new Set(clientesFaltantes.map(v => v.cliente_id))];
                    
                    for (const clienteId of clienteIdsFaltantes) {
                        try {
                            const { data: cliente, error } = await window.supabaseClient
                                .from('clientes')
                                .select('id, nombre_completo, tipo_id, numero_id')
                                .eq('id', clienteId)
                                .maybeSingle();
                            
                            if (!error && cliente) {
                                // Actualizar todas las ventas que usan este cliente
                                ventas.forEach(v => {
                                    if (v.cliente_id === clienteId && !v.clientes) {
                                        v.clientes = cliente;
                                        console.log(`✅ Cliente encontrado: "${cliente.nombre_completo}"`);
                                    }
                                });
                            }
                        } catch (err) {
                            console.error(`Error consultando cliente ${clienteId}:`, err);
                        }
                    }
                }
                
                // Combinar datos - los clientes ya vienen del JOIN o de las consultas individuales
                ventas.forEach(v => {
                    v.usuarios = v.usuario_id ? usuariosMap.get(v.usuario_id) : null;
                    // Obtener nombres de productos para esta venta
                    v.productos_nombres = productosPorVenta[v.id] || [];
                    v.productos_count = v.productos_nombres.length;
                });
                
                console.log('Ventas procesadas:', ventas.map(v => ({
                    numero: v.numero_venta,
                    cliente_id: v.cliente_id,
                    cliente_nombre: v.clientes?.nombre_completo || 'No encontrado'
                })));

                totalVentasCount = count || 0;
                ventasRecientesData = ventas || [];
                
                renderVentasRecientes();
                renderPaginationVentas();
            } catch (error) {
                console.error('Error en loadVentasRecientes:', error);
            }
        }

        // Renderizar ventas recientes en la tabla y cards móviles
        function renderVentasRecientes() {
            const recentSalesBody = document.getElementById('recentSalesBody');
            const recentSalesBodyMobile = document.getElementById('recentSalesBodyMobile');
            
            if (!recentSalesBody || !recentSalesBodyMobile) return;
            
            // Limpiar ambas vistas
            recentSalesBody.innerHTML = '';
            recentSalesBodyMobile.innerHTML = '';
            
            if (!ventasRecientesData || ventasRecientesData.length === 0) {
                // Vista vacía para tabla desktop
                const tr = document.createElement('tr');
                tr.innerHTML = '<td colspan="6" class="text-center text-muted py-4"><i class="fas fa-inbox fa-2x mb-2"></i><br>No hay ventas recientes para mostrar</td>';
                recentSalesBody.appendChild(tr);
                
                // Vista vacía para móvil
                recentSalesBodyMobile.innerHTML = `
                    <div class="text-center text-muted py-5">
                        <i class="fas fa-inbox fa-3x mb-3"></i>
                        <p class="mb-0">No hay ventas recientes para mostrar</p>
                    </div>
                `;
                return;
            }

            ventasRecientesData.forEach(venta => {
                const fecha = new Date(venta.fecha_venta);
                const fechaStr = fecha.toLocaleDateString('es-CO');
                
                // Obtener nombre del cliente - SIEMPRE mostrar nombre_completo si existe
                let clienteNombre = 'Cliente General';
                
                // Verificar si tenemos el objeto cliente con nombre_completo
                if (venta.clientes) {
                    if (venta.clientes.nombre_completo) {
                        clienteNombre = venta.clientes.nombre_completo.trim();
                    } else {
                        console.warn(`Venta ${venta.numero_venta}: Cliente encontrado pero sin nombre_completo. Cliente ID: ${venta.clientes.id}`);
                    }
                } else if (venta.cliente_id) {
                    // Si hay cliente_id pero no se encontró el cliente después de todas las consultas
                    console.error(`Venta ${venta.numero_venta}: cliente_id=${venta.cliente_id} existe pero no se pudo encontrar el cliente en la base de datos`);
                    clienteNombre = 'Cliente no encontrado';
                }
                
                // Obtener nombres de productos
                let productosText = 'Sin productos';
                if (venta.productos_nombres && venta.productos_nombres.length > 0) {
                    // Mostrar los nombres de los productos separados por coma
                    // Si hay más de 3 productos, mostrar los primeros 2 y "... y X más"
                    if (venta.productos_nombres.length > 3) {
                        const primeros = venta.productos_nombres.slice(0, 2).join(', ');
                        const restantes = venta.productos_nombres.length - 2;
                        productosText = `${primeros}... y ${restantes} más`;
                    } else {
                        productosText = venta.productos_nombres.join(', ');
                    }
                }
                
                // Formatear total
                const totalFormateado = formatCOP(Number(venta.total) || 0);
                
                // Renderizar fila para tabla desktop
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${venta.numero_venta || '-'}</td>
                    <td>${clienteNombre}</td>
                    <td>${productosText}</td>
                    <td class="fw-bold">${totalFormateado}</td>
                    <td>${fechaStr}</td>
                    <td>
                        <button type="button" class="btn btn-sm btn-outline-info me-1" title="Ver detalles" onclick="verDetallesVenta('${venta.id}')">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button type="button" class="btn btn-sm btn-outline-secondary" title="Reimprimir" onclick="reimprimirVenta('${venta.id}')">
                            <i class="fas fa-print"></i>
                        </button>
                    </td>
                `;
                recentSalesBody.appendChild(tr);
                
                // Renderizar card para móvil
                const card = document.createElement('div');
                card.className = 'sale-item-card mb-3 p-3 border rounded';
                card.innerHTML = `
                    <div class="d-flex justify-content-between align-items-start mb-2">
                        <div class="flex-grow-1">
                            <div class="d-flex justify-content-between align-items-center mb-1">
                                <strong class="text-white">Venta #${venta.numero_venta || '-'}</strong>
                                <span class="badge bg-success">${totalFormateado}</span>
                            </div>
                            <small class="text-white-50 d-block mb-1">
                                <i class="fas fa-user me-1"></i>${clienteNombre}
                            </small>
                            <small class="text-white-50 d-block mb-2">
                                <i class="fas fa-calendar me-1"></i>${fechaStr}
                            </small>
                            <div class="mb-2">
                                <small class="text-white-50 d-block">
                                    <i class="fas fa-box me-1"></i>Productos:
                                </small>
                                <small class="text-white">${productosText}</small>
                            </div>
                        </div>
                    </div>
                    <div class="d-flex gap-2 justify-content-end mt-2">
                        <button type="button" class="btn btn-sm btn-outline-info" title="Ver detalles" onclick="verDetallesVenta('${venta.id}')">
                            <i class="fas fa-eye me-1"></i>Ver
                        </button>
                        <button type="button" class="btn btn-sm btn-outline-secondary" title="Reimprimir" onclick="reimprimirVenta('${venta.id}')">
                            <i class="fas fa-print me-1"></i>Imprimir
                        </button>
                    </div>
                `;
                recentSalesBodyMobile.appendChild(card);
            });
        }

        // Renderizar paginación de ventas recientes
        function renderPaginationVentas() {
            const container = document.getElementById('recentSalesPagination');
            if (!container) {
                console.log('No se encontró el contenedor de paginación de ventas');
                return;
            }

            container.innerHTML = '';
            
            const totalPages = Math.max(1, Math.ceil(totalVentasCount / pageSizeVentas));
            
            if (totalPages <= 1) {
                return;
            }

            // Botón Previous
            const prevBtn = document.createElement('button');
            prevBtn.className = 'btn btn-sm btn-outline-light me-2';
            prevBtn.type = 'button';
            prevBtn.disabled = currentPageVentas <= 1;
            prevBtn.textContent = 'Anterior';
            prevBtn.onclick = async (e) => {
                e.preventDefault();
                if (currentPageVentas > 1) {
                    currentPageVentas--;
                    await loadVentasRecientes();
                }
            };
            container.appendChild(prevBtn);

            // Indicador de página
            const pageInfo = document.createElement('span');
            pageInfo.className = 'text-white-50';
            pageInfo.textContent = `Página ${currentPageVentas} de ${totalPages}`;
            container.appendChild(pageInfo);

            // Botón Next
            const nextBtn = document.createElement('button');
            nextBtn.className = 'btn btn-sm btn-outline-light ms-2';
            nextBtn.type = 'button';
            nextBtn.disabled = currentPageVentas >= totalPages;
            nextBtn.textContent = 'Siguiente';
            nextBtn.onclick = async (e) => {
                e.preventDefault();
                if (currentPageVentas < totalPages) {
                    currentPageVentas++;
                    await loadVentasRecientes();
                }
            };
            container.appendChild(nextBtn);
        }

        // Función para mostrar detalles de venta en modal
        window.verDetallesVenta = async function(ventaId) {
            try {
                if (!window.supabaseClient) {
                    alert('Error: No hay conexión con la base de datos');
                    return;
                }

                // Obtener datos de la venta con información del cliente y usuario
                const { data: venta, error: ventaError } = await window.supabaseClient
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
                            id,
                            nombre_completo,
                            tipo_id,
                            numero_id,
                            email,
                            telefono
                        ),
                        usuarios:usuario_id(
                            id,
                            nombre_completo,
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
                const { data: detalles, error: detallesError } = await window.supabaseClient
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
                        salespersonEl.textContent = venta.usuarios.nombre_completo || venta.usuarios.email || '—';
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
                console.error('Error en verDetallesVenta:', error);
                alert('Ocurrió un error al cargar los detalles de la venta');
            }
        };

        window.reimprimirVenta = function(ventaId) {
            // TODO: Implementar reimpresión de venta
            alert('Reimprimir venta: ' + ventaId);
        };

        // Cargar ventas recientes al inicializar
        loadVentasRecientes();

        // ===== LISTENER GLOBAL PARA OCULTAR TODOS LOS DROPDOWNS =====
        // Ocultar todos los dropdowns cuando se hace clic fuera de ellos o cuando cambia el foco
        document.addEventListener('click', function(e) {
            const target = e.target;
            
            // Verificar si el click fue en algún elemento relacionado con nuestros dropdowns
            const isClickOnInput = target.id === 'customerSearch' || 
                                   target.id === 'salespersonSearch' ||
                                   target.id === 'productSearch' ||
                                   target.id === 'productCategory';
            
            // Verificar si el click fue en botones relacionados
            const isClickOnRelatedButton = target.id === 'listProductsBtn' ||
                                          target.id === 'newCustomerBtn' ||
                                          target.id === 'searchSalespersonBtn' ||
                                          target.closest('#newCustomerBtn') !== null ||
                                          target.closest('#listProductsBtn') !== null ||
                                          target.closest('#searchSalespersonBtn') !== null;
            
            // Verificar si el click fue en algún dropdown
            const isClickOnDropdown = target.closest('#customerSuggestions') !== null ||
                                      target.closest('#salespersonSuggestionsFixed') !== null ||
                                      target.closest('#productSuggestionsFixed') !== null ||
                                      target.closest('#categorySuggestionsFixed') !== null;
            
            // Si el click no fue en ningún elemento relacionado, ocultar todos los dropdowns (forzar)
            if (!isClickOnInput && !isClickOnRelatedButton && !isClickOnDropdown) {
                hideCustomerSuggestions(true);
                hideSalespersonSuggestions(true);
                hideProductSuggestions(true);
                hideCategorySuggestions(true);
            }
        });

        // Ocultar todos los dropdowns cuando se cambia el foco a otro elemento
        document.addEventListener('focusin', function(e) {
            const target = e.target;
            
            // Solo ocultar si el nuevo foco no es uno de nuestros inputs o el botón de listar
            const isOurInput = target.id === 'customerSearch' ||
                             target.id === 'salespersonSearch' ||
                             target.id === 'productSearch' ||
                             target.id === 'productCategory' ||
                             target.id === 'listProductsBtn';
            
            const isInDropdown = target.closest('#customerSuggestions') ||
                               target.closest('#salespersonSuggestionsFixed') ||
                               target.closest('#productSuggestionsFixed') ||
                               target.closest('#categorySuggestionsFixed');
            
            if (!isOurInput && !isInDropdown) {
                // Pequeño delay para permitir que los eventos de blur se ejecuten primero
                setTimeout(() => {
                    hideCustomerSuggestions(true);
                    hideSalespersonSuggestions(true);
                    hideProductSuggestions(true);
                    hideCategorySuggestions(true);
                }, 150);
            }
        });

    });
})();

