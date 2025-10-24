/**
 * Servicio de base de datos para el sistema POS
 * Contiene funciones genéricas y específicas para cada entidad
 */
class DatabaseService {
    constructor() {
        this.supabase = window.supabaseClient;
        this.cache = new Map();
        this.cacheTimeout = 300000; // 5 minutos
    }

    // ===== FUNCIONES GENÉRICAS =====

    /**
     * Función genérica para hacer consultas SELECT
     * @param {string} table - Nombre de la tabla
     * @param {Object} options - Opciones de consulta
     * @returns {Promise<Object>} - Resultado con data y error
     */
    async select(table, options = {}) {
        const { columns = '*', filters = {}, orderBy = null, limit = null } = options;

        let query = this.supabase.from(table).select(columns);

        // Aplicar filtros
        Object.keys(filters).forEach(key => {
            if (filters[key] !== null && filters[key] !== undefined) {
                query = query.eq(key, filters[key]);
            }
        });

        // Aplicar ordenamiento
        if (orderBy) {
            query = query.order(orderBy.column, { ascending: orderBy.ascending !== false });
        }

        // Aplicar límite
        if (limit) {
            query = query.limit(limit);
        }

        return await query;
    }

    /**
     * Función genérica para hacer INSERT
     * @param {string} table - Nombre de la tabla
     * @param {Object|Array} data - Datos a insertar
     * @returns {Promise<Object>} - Resultado con data y error
     */
    async insert(table, data) {
        const { data: result, error } = await this.supabase
            .from(table)
            .insert(Array.isArray(data) ? data : [data])
            .select();
        return { data: result, error };
    }

    /**
     * Función genérica para hacer UPDATE
     * @param {string} table - Nombre de la tabla
     * @param {string} id - ID del registro
     * @param {Object} updates - Datos a actualizar
     * @returns {Promise<Object>} - Resultado con data y error
     */
    async update(table, id, updates) {
        const { data, error } = await this.supabase
            .from(table)
            .update(updates)
            .eq('id', id)
            .select();
        return { data, error };
    }

    /**
     * Función genérica para hacer DELETE
     * @param {string} table - Nombre de la tabla
     * @param {string} id - ID del registro
     * @returns {Promise<Object>} - Resultado con error
     */
    async delete(table, id) {
        const { error } = await this.supabase
            .from(table)
            .delete()
            .eq('id', id);
        return { error };
    }

    // ===== FUNCIONES ESPECÍFICAS PARA CATEGORÍAS =====

    /**
     * Obtiene todas las categorías con filtros opcionales
     * @param {Object} options - Opciones de filtrado y paginación
     * @returns {Promise<Object>} - Resultado con data, error y count
     */
    async getCategorias(options = {}) {
        try {
            const {
                filters = {},
                search = '',
                onlyActive = false,
                limit = null,
                offset = 0,
                orderBy = 'nombre',
                ascending = true
            } = options;

            let query = this.supabase
                .from('categorias')
                .select('*', { count: 'exact' })
                .is('deleted_at', null); // Filtrar categorías no eliminadas (soft delete)

            // Aplicar filtros
            Object.keys(filters).forEach(key => {
                if (filters[key] !== null && filters[key] !== undefined) {
                    query = query.eq(key, filters[key]);
                }
            });

            // Aplicar búsqueda por nombre o código
            if (search) {
                query = query.or(`nombre.ilike.%${search}%,codigo.ilike.%${search}%`);
            }

            // Filtrar solo activas si se especifica
            if (onlyActive) {
                query = query.eq('activa', true);
            }

            // Aplicar ordenamiento
            query = query.order(orderBy, { ascending });

            // Aplicar paginación
            if (limit) {
                query = query.range(offset, offset + limit - 1);
            }

            const { data, error, count } = await query;

            if (error) {
                console.error('Error al obtener categorías:', error);
                return { data: null, error, count: 0 };
            }

            return { data, error: null, count: count || 0 };
        } catch (error) {
            console.error('Error en getCategorias:', error);
            return { data: null, error, count: 0 };
        }
    }

    /**
     * Obtiene una categoría por su ID
     * @param {string} id - UUID de la categoría
     * @returns {Promise<Object>} - Resultado con data y error
     */
    async getCategoriaById(id) {
        try {
            const { data, error } = await this.supabase
                .from('categorias')
                .select('*')
                .eq('id', id)
                .single();

            if (error) {
                console.error('Error al obtener categoría por ID:', error);
                return { data: null, error };
            }

            return { data, error: null };
        } catch (error) {
            console.error('Error en getCategoriaById:', error);
            return { data: null, error };
        }
    }

    /**
     * Crea una nueva categoría
     * @param {Object} categoriaData - Datos de la categoría
     * @returns {Promise<Object>} - Resultado con data y error
     */
    async createCategoria(categoriaData) {
        try {
            console.log('📝 Creando nueva categoría:', categoriaData);
            
            // Validar datos requeridos
            if (!categoriaData.nombre || categoriaData.nombre.trim() === '') {
                return {
                    data: null,
                    error: { message: 'El nombre de la categoría es obligatorio' }
                };
            }

            // Preparar datos para inserción
            const insertData = {
                nombre: categoriaData.nombre.trim(),
                codigo: categoriaData.codigo?.trim() || null,
                categoria_padre_id: categoriaData.categoria_padre_id || null,
                descripcion: categoriaData.descripcion?.trim() || null,
                color: categoriaData.color || '#007bff',
                activa: categoriaData.activa !== undefined ? categoriaData.activa : true
            };

            console.log('📤 Datos a insertar:', insertData);
            console.log('🔍 Código en insertData:', insertData.codigo);
            console.log('🔍 Categoría padre en insertData:', insertData.categoria_padre_id);

            const { data, error } = await this.supabase
                .from('categorias')
                .insert([insertData])
                .select();

            if (error) {
                console.error('Error al crear categoría:', error);
                
                // Manejar errores específicos
                if (error.code === '23505') {
                    return {
                        data: null,
                        error: { message: 'Ya existe una categoría con este nombre' }
                    };
                }
                
                return { data: null, error };
            }

            console.log('✅ Categoría creada exitosamente:', data[0]);
            console.log('🔍 Código devuelto:', data[0].codigo);
            console.log('🔍 Categoría padre devuelta:', data[0].categoria_padre_id);
            return { data: data[0], error: null };
        } catch (error) {
            console.error('Error en createCategoria:', error);
            return { data: null, error };
        }
    }

    /**
     * Actualiza una categoría existente
     * @param {string} id - UUID de la categoría
     * @param {Object} categoriaData - Datos actualizados
     * @returns {Promise<Object>} - Resultado con data y error
     */
    async updateCategoria(id, categoriaData) {
        try {
            // Validar datos requeridos
            if (!categoriaData.nombre || categoriaData.nombre.trim() === '') {
                return {
                    data: null,
                    error: { message: 'El nombre de la categoría es obligatorio' }
                };
            }

            // Preparar datos para actualización
            const updateData = {
                nombre: categoriaData.nombre.trim(),
                codigo: categoriaData.codigo?.trim() || null,
                categoria_padre_id: categoriaData.categoria_padre_id || null,
                descripcion: categoriaData.descripcion?.trim() || null,
                color: categoriaData.color || '#007bff',
                activa: categoriaData.activa !== undefined ? categoriaData.activa : true
            };

            const { data, error } = await this.supabase
                .from('categorias')
                .update(updateData)
                .eq('id', id)
                .select();

            if (error) {
                console.error('Error al actualizar categoría:', error);
                
                // Manejar errores específicos
                if (error.code === '23505') {
                    return {
                        data: null,
                        error: { message: 'Ya existe una categoría con este nombre' }
                    };
                }
                
                return { data: null, error };
            }

            console.log('✅ Categoría actualizada exitosamente:', data[0]);
            return { data: data[0], error: null };
        } catch (error) {
            console.error('Error en updateCategoria:', error);
            return { data: null, error };
        }
    }

    /**
     * Elimina una categoría (soft delete)
     * @param {string} id - UUID de la categoría
     * @returns {Promise<Object>} - Resultado con error
     */
    async deleteCategoria(id) {
        try {
            const updateData = {
                deleted_at: new Date().toISOString()
            };

            const { error } = await this.supabase
                .from('categorias')
                .update(updateData)
                .eq('id', id);

            if (error) {
                console.error('Error al eliminar categoría:', error);
                return { error };
            }

            console.log('✅ Categoría eliminada exitosamente');
            return { error: null };
        } catch (error) {
            console.error('Error en deleteCategoria:', error);
            return { error };
        }
    }

    // ===== FUNCIONES ESPECÍFICAS PARA PRODUCTOS =====
    /**
     * Obtiene productos con filtros y paginación opcional
     * @param {Object} options
     * @returns {Promise<Object>} - { data, error, count }
     */
    async getProductos(options = {}) {
        try {
            const {
                filters = {},
                search = '',
                internalCode = '',
                onlyActive = false,
                limit = null,
                offset = 0,
                orderBy = 'nombre',
                ascending = true
            } = options;

            const selectColumns = '*, categoria:categorias ( id, nombre )';
            let query = this.supabase
                .from('productos')
                .select(selectColumns, { count: 'exact' })
                .is('deleted_at', null);

            // Filtros exactos
            Object.keys(filters).forEach(key => {
                if (filters[key] !== null && filters[key] !== undefined && filters[key] !== '') {
                    query = query.eq(key, filters[key]);
                }
            });

            // Solo activos
            if (onlyActive) {
                query = query.eq('activo', true);
            }

            // Búsqueda por nombre, códigos y descripción (general)
            if (search) {
                query = query.or(`nombre.ilike.%${search}%,codigo_interno.ilike.%${search}%,codigo_barras.ilike.%${search}%,descripcion.ilike.%${search}%`);
            }

            // Filtro específico: código interno (parcial)
            if (internalCode) {
                query = query.ilike('codigo_interno', `%${internalCode}%`);
            }

            // Orden
            query = query.order(orderBy, { ascending });

            // Paginación
            if (limit) {
                query = query.range(offset, offset + limit - 1);
            }

            const { data, error, count } = await query;
            if (error) {
                console.error('Error al obtener productos:', error);
                return { data: null, error, count: 0 };
            }

            return { data, error: null, count: count || 0 };
        } catch (error) {
            console.error('Error en getProductos:', error);
            return { data: null, error, count: 0 };
        }
    }

    /**
     * Busca productos por código (interno o de barras) con LIKE
     */
    async searchProductosPorCodigo(term, options = {}) {
        try {
            const { onlyActive = true, limit = 20, orderBy = 'nombre', ascending = true } = options;
            let query = this.supabase
                .from('productos')
                .select('*')
                .is('deleted_at', null)
                .or(`codigo_interno.ilike.%${term}%,codigo_barras.ilike.%${term}%`)
                .order(orderBy, { ascending });
            if (onlyActive) query = query.eq('activo', true);
            if (limit) query = query.limit(limit);
            const { data, error } = await query;
            if (error) return { data: null, error };
            return { data: data || [], error: null };
        } catch (error) {
            return { data: null, error };
        }
    }

    /**
     * Busca productos por nombre o descripción con LIKE
     */
    async searchProductosPorDescripcion(term, options = {}) {
        try {
            const { onlyActive = true, limit = 20, orderBy = 'nombre', ascending = true } = options;
            let query = this.supabase
                .from('productos')
                .select('*')
                .is('deleted_at', null)
                .or(`nombre.ilike.%${term}%,descripcion.ilike.%${term}%`)
                .order(orderBy, { ascending });
            if (onlyActive) query = query.eq('activo', true);
            if (limit) query = query.limit(limit);
            const { data, error } = await query;
            if (error) return { data: null, error };
            return { data: data || [], error: null };
        } catch (error) {
            return { data: null, error };
        }
    }
    /**
     * Crea un nuevo producto
     * @param {Object} productoData - Datos del producto (mapeo directo a columnas)
     * @returns {Promise<Object>} - Resultado con data y error
     */
    async createProducto(productoData) {
        try {
            console.log('📝 Creando nuevo producto:', productoData);

            // Validaciones mínimas
            if (!productoData || !productoData.nombre || productoData.nombre.trim() === '') {
                return { data: null, error: { message: 'El nombre del producto es obligatorio' } };
            }
            if (productoData.precio_venta === undefined || productoData.precio_venta === null || isNaN(Number(productoData.precio_venta))) {
                return { data: null, error: { message: 'El precio de venta es obligatorio y debe ser numérico' } };
            }

            // Normalizar y mapear datos a las columnas reales
            const insertData = {
                nombre: String(productoData.nombre).trim(),
                codigo_barras: productoData.codigo_barras?.trim() || null,
                codigo_interno: productoData.codigo_interno?.trim() || null,
                categoria_id: productoData.categoria_id || null,
                marca: productoData.marca?.trim() || null,
                modelo: productoData.modelo?.trim() || null,
                descripcion: productoData.descripcion?.trim() || null,
                precio_compra: productoData.precio_compra !== '' && productoData.precio_compra !== undefined ? Number(productoData.precio_compra) : null,
                precio_venta: Number(productoData.precio_venta),
                precio_mayorista: productoData.precio_mayorista !== '' && productoData.precio_mayorista !== undefined ? Number(productoData.precio_mayorista) : null,
                margen_ganancia: productoData.margen_ganancia !== '' && productoData.margen_ganancia !== undefined ? Number(productoData.margen_ganancia) : null,
                descuento_max: productoData.descuento_max !== '' && productoData.descuento_max !== undefined ? Number(productoData.descuento_max) : 0,
                tasa_impuesto: productoData.tasa_impuesto !== '' && productoData.tasa_impuesto !== undefined ? Number(productoData.tasa_impuesto) : 19.0,
                stock_actual: productoData.stock_actual !== '' && productoData.stock_actual !== undefined ? parseInt(productoData.stock_actual, 10) : 0,
                stock_min: productoData.stock_min !== '' && productoData.stock_min !== undefined ? parseInt(productoData.stock_min, 10) : 0,
                stock_max: productoData.stock_max !== '' && productoData.stock_max !== undefined ? parseInt(productoData.stock_max, 10) : 0,
                peso: productoData.peso !== '' && productoData.peso !== undefined ? Number(productoData.peso) : null,
                dimensiones: productoData.dimensiones?.trim() || null,
                activo: productoData.activo !== undefined ? Boolean(productoData.activo) : true
            };

            console.log('📤 Datos a insertar (productos):', insertData);

            const { data, error } = await this.supabase
                .from('productos')
                .insert([insertData])
                .select();

            if (error) {
                console.error('Error al crear producto:', error);
                if (error.code === '23505') {
                    // Violación de unicidad (código de barras o interno)
                    return { data: null, error: { message: 'Código ya registrado (barras o interno)' } };
                }
                return { data: null, error };
            }

            console.log('✅ Producto creado exitosamente:', data[0]);
            return { data: data[0], error: null };
        } catch (error) {
            console.error('Error en createProducto:', error);
            return { data: null, error };
        }
    }

    /**
     * Actualiza un producto existente
     * @param {string} id - UUID del producto
     * @param {Object} productoData - Datos a actualizar (mapeo directo)
     */
    async updateProducto(id, productoData) {
        try {
            if (!id) return { data: null, error: { message: 'ID de producto requerido' } };

            const updateData = {
                nombre: productoData.nombre !== undefined ? String(productoData.nombre).trim() : undefined,
                codigo_barras: productoData.codigo_barras !== undefined ? (productoData.codigo_barras?.trim() || null) : undefined,
                codigo_interno: productoData.codigo_interno !== undefined ? (productoData.codigo_interno?.trim() || null) : undefined,
                categoria_id: productoData.categoria_id !== undefined ? (productoData.categoria_id || null) : undefined,
                marca: productoData.marca !== undefined ? (productoData.marca?.trim() || null) : undefined,
                modelo: productoData.modelo !== undefined ? (productoData.modelo?.trim() || null) : undefined,
                descripcion: productoData.descripcion !== undefined ? (productoData.descripcion?.trim() || null) : undefined,
                precio_compra: productoData.precio_compra !== undefined ? (productoData.precio_compra === '' ? null : Number(productoData.precio_compra)) : undefined,
                precio_venta: productoData.precio_venta !== undefined ? Number(productoData.precio_venta) : undefined,
                precio_mayorista: productoData.precio_mayorista !== undefined ? (productoData.precio_mayorista === '' ? null : Number(productoData.precio_mayorista)) : undefined,
                margen_ganancia: productoData.margen_ganancia !== undefined ? (productoData.margen_ganancia === '' ? null : Number(productoData.margen_ganancia)) : undefined,
                descuento_max: productoData.descuento_max !== undefined ? (productoData.descuento_max === '' ? 0 : Number(productoData.descuento_max)) : undefined,
                tasa_impuesto: productoData.tasa_impuesto !== undefined ? (productoData.tasa_impuesto === '' ? 19.0 : Number(productoData.tasa_impuesto)) : undefined,
                stock_actual: productoData.stock_actual !== undefined ? (productoData.stock_actual === '' ? 0 : parseInt(productoData.stock_actual, 10)) : undefined,
                stock_min: productoData.stock_min !== undefined ? (productoData.stock_min === '' ? 0 : parseInt(productoData.stock_min, 10)) : undefined,
                stock_max: productoData.stock_max !== undefined ? (productoData.stock_max === '' ? 0 : parseInt(productoData.stock_max, 10)) : undefined,
                peso: productoData.peso !== undefined ? (productoData.peso === '' ? null : Number(productoData.peso)) : undefined,
                dimensiones: productoData.dimensiones !== undefined ? (productoData.dimensiones?.trim() || null) : undefined,
                activo: productoData.activo !== undefined ? Boolean(productoData.activo) : undefined
            };

            // Eliminar claves undefined para no sobreescribir con nulls
            Object.keys(updateData).forEach(k => updateData[k] === undefined && delete updateData[k]);

            const { data, error } = await this.supabase
                .from('productos')
                .update(updateData)
                .eq('id', id)
                .select();

            if (error) return { data: null, error };
            return { data: data?.[0] || null, error: null };
        } catch (error) {
            return { data: null, error };
        }
    }

    /**
     * Elimina un producto (soft delete) estableciendo deleted_at
     * @param {string} id - UUID del producto
     */
    async deleteProducto(id) {
        try {
            if (!id) return { error: { message: 'ID de producto requerido' } };
            const { error } = await this.supabase
                .from('productos')
                .update({ deleted_at: new Date().toISOString() })
                .eq('id', id);
            return { error };
        } catch (error) {
            return { error };
        }
    }

    // ===== FUNCIONES ESPECÍFICAS PARA CLIENTES =====
    /**
     * Crea un nuevo cliente
     * @param {Object} clienteData
     * @returns {Promise<{data:any,error:any}>}
     */
    async createCliente(clienteData) {
        try {
            // Validaciones mínimas
            if (!clienteData || !clienteData.tipo_id || !clienteData.numero_id) {
                return { data: null, error: { message: 'Tipo y número de identificación son obligatorios' } };
            }
            if (!clienteData.nombre_completo || clienteData.nombre_completo.trim() === '') {
                return { data: null, error: { message: 'El nombre completo es obligatorio' } };
            }

            const insertData = {
                tipo_id: clienteData.tipo_id,
                numero_id: String(clienteData.numero_id).trim(),
                nombre_completo: clienteData.nombre_completo.trim(),
                primer_nombre: clienteData.primer_nombre?.trim() || null,
                segundo_nombre: clienteData.segundo_nombre?.trim() || null,
                primer_apellido: clienteData.primer_apellido?.trim() || null,
                segundo_apellido: clienteData.segundo_apellido?.trim() || null,
                direccion: clienteData.direccion?.trim() || null,
                ciudad: clienteData.ciudad?.trim() || null,
                departamento: clienteData.departamento?.trim() || null,
                telefono: clienteData.telefono?.trim() || null,
                celular: clienteData.celular?.trim() || null,
                email: clienteData.email?.trim() || null,
                fecha_nacimiento: clienteData.fecha_nacimiento || null,
                genero: clienteData.genero || null,
                activo: clienteData.activo !== undefined ? Boolean(clienteData.activo) : true,
                notas: clienteData.notas?.trim() || null
            };

            const { data, error } = await this.supabase
                .from('clientes')
                .insert([insertData])
                .select();

            if (error) {
                if (error.code === '23505') {
                    return { data: null, error: { message: 'Ya existe un cliente con ese tipo y número de identificación' } };
                }
                return { data: null, error };
            }

            return { data: data?.[0] || null, error: null };
        } catch (error) {
            return { data: null, error };
        }
    }

    /**
     * Obtiene clientes con filtros y paginación
     * @param {Object} options
     * @returns {Promise<{data:any[], error:any, count:number}>}
     */
    async getClientes(options = {}) {
        try {
            const {
                search = '',
                numeroId = '',
                onlyActive = false,
                limit = null,
                offset = 0,
                orderBy = 'nombre_completo',
                ascending = true
            } = options;

            let query = this.supabase
                .from('clientes')
                .select('*', { count: 'exact' })
                .is('deleted_at', null);

            if (onlyActive) {
                query = query.eq('activo', true);
            }

            if (search) {
                // Buscar por nombre, identificación o email
                query = query.or(
                    `nombre_completo.ilike.%${search}%,numero_id.ilike.%${search}%,email.ilike.%${search}%`
                );
            }

            if (numeroId) {
                query = query.ilike('numero_id', `%${numeroId}%`);
            }

            query = query.order(orderBy, { ascending });

            if (limit) {
                query = query.range(offset, offset + limit - 1);
            }

            const { data, error, count } = await query;
            if (error) return { data: null, error, count: 0 };
            return { data: data || [], error: null, count: count || 0 };
        } catch (error) {
            return { data: null, error, count: 0 };
        }
    }

    /**
     * Actualiza un cliente por id
     * @param {string} id
     * @param {Object} clienteData
     */
    async updateCliente(id, clienteData) {
        try {
            if (!id) return { data: null, error: { message: 'ID de cliente requerido' } };
            const updates = {
                tipo_id: clienteData.tipo_id,
                numero_id: clienteData.numero_id?.toString().trim(),
                nombre_completo: clienteData.nombre_completo?.toString().trim(),
                primer_nombre: clienteData.primer_nombre?.trim() ?? null,
                segundo_nombre: clienteData.segundo_nombre?.trim() ?? null,
                primer_apellido: clienteData.primer_apellido?.trim() ?? null,
                segundo_apellido: clienteData.segundo_apellido?.trim() ?? null,
                direccion: clienteData.direccion?.trim() ?? null,
                ciudad: clienteData.ciudad?.trim() ?? null,
                departamento: clienteData.departamento?.trim() ?? null,
                telefono: clienteData.telefono?.trim() ?? null,
                celular: clienteData.celular?.trim() ?? null,
                email: clienteData.email?.trim() ?? null,
                fecha_nacimiento: clienteData.fecha_nacimiento ?? null,
                genero: clienteData.genero ?? null,
                notas: clienteData.notas?.trim() ?? null,
                activo: clienteData.activo !== undefined ? !!clienteData.activo : undefined
            };
            Object.keys(updates).forEach(k => updates[k] === undefined && delete updates[k]);
            const { data, error } = await this.supabase
                .from('clientes')
                .update(updates)
                .eq('id', id)
                .select();
            if (error) return { data: null, error };
            return { data: data?.[0] || null, error: null };
        } catch (error) {
            return { data: null, error };
        }
    }

    /**
     * Elimina (soft delete) un cliente
     * @param {string} id
     */
    async deleteCliente(id) {
        try {
            if (!id) return { error: { message: 'ID de cliente requerido' } };
            const { error } = await this.supabase
                .from('clientes')
                .update({ deleted_at: new Date().toISOString() })
                .eq('id', id);
            return { error };
        } catch (error) {
            return { error };
        }
    }

    // ===== FUNCIONES ESPECÍFICAS PARA PROVEEDORES =====
    /**
     * Crea un nuevo proveedor
     * @param {Object} proveedorData
     */
    async createProveedor(proveedorData) {
        try {
            if (!proveedorData || !proveedorData.tipo_id || !proveedorData.numero_id) {
                return { data: null, error: { message: 'Tipo y número de identificación son obligatorios' } };
            }
            if (!proveedorData.razon_social || proveedorData.razon_social.trim() === '') {
                return { data: null, error: { message: 'La razón social es obligatoria' } };
            }

            const notasExtra = [];
            if (proveedorData.contacto_cargo) notasExtra.push(`Cargo contacto: ${proveedorData.contacto_cargo}`);
            if (proveedorData.contacto_email) notasExtra.push(`Email contacto: ${proveedorData.contacto_email}`);
            if (proveedorData.contacto_telefono) notasExtra.push(`Tel. contacto: ${proveedorData.contacto_telefono}`);
            if (proveedorData.productos_servicios) notasExtra.push(`Productos/Servicios: ${proveedorData.productos_servicios}`);

            const insertData = {
                tipo_id: proveedorData.tipo_id,
                numero_id: String(proveedorData.numero_id).trim(),
                razon_social: proveedorData.razon_social.trim(),
                nombre_comercial: proveedorData.nombre_comercial?.trim() || null,
                codigo: proveedorData.codigo?.trim() || null,
                categoria: proveedorData.categoria || null,
                direccion: proveedorData.direccion?.trim() || null,
                ciudad: proveedorData.ciudad?.trim() || null,
                departamento: proveedorData.departamento || null,
                telefono: proveedorData.telefono?.trim() || null,
                celular: proveedorData.celular?.trim() || null,
                email: proveedorData.email?.trim() || null,
                persona_contacto: proveedorData.persona_contacto?.trim() || null,
                terminos_pago: proveedorData.terminos_pago || null,
                limite_credito: proveedorData.limite_credito !== '' && proveedorData.limite_credito !== undefined ? Number(proveedorData.limite_credito) : 0,
                activo: proveedorData.activo !== undefined ? Boolean(proveedorData.activo) : true,
                notas: (proveedorData.notas?.trim() || '') + (notasExtra.length ? `\n${notasExtra.join('\n')}` : '')
            };

            const { data, error } = await this.supabase
                .from('proveedores')
                .insert([insertData])
                .select();
            if (error) {
                if (error.code === '23505') {
                    return { data: null, error: { message: 'Ya existe un proveedor con ese tipo y número o código' } };
                }
                return { data: null, error };
            }
            return { data: data?.[0] || null, error: null };
        } catch (error) {
            return { data: null, error };
        }
    }

    /**
     * Lista proveedores con filtros y paginación
     */
    async getProveedores(options = {}) {
        try {
            const {
                search = '',
                numeroId = '',
                onlyActive = false,
                limit = null,
                offset = 0,
                orderBy = 'razon_social',
                ascending = true
            } = options;

            let query = this.supabase
                .from('proveedores')
                .select('*', { count: 'exact' })
                .is('deleted_at', null);

            if (onlyActive) query = query.eq('activo', true);
            if (search) {
                query = query.or(`razon_social.ilike.%${search}%,numero_id.ilike.%${search}%,email.ilike.%${search}%`);
            }
            if (numeroId) {
                query = query.ilike('numero_id', `%${numeroId}%`);
            }
            query = query.order(orderBy, { ascending });
            if (limit) query = query.range(offset, offset + limit - 1);

            const { data, error, count } = await query;
            if (error) return { data: null, error, count: 0 };
            return { data: data || [], error: null, count: count || 0 };
        } catch (error) {
            return { data: null, error, count: 0 };
        }
    }

    /**
     * Actualiza un proveedor por id
     */
    async updateProveedor(id, proveedorData) {
        try {
            if (!id) return { data: null, error: { message: 'ID de proveedor requerido' } };
            const updates = {
                tipo_id: proveedorData.tipo_id,
                numero_id: proveedorData.numero_id?.toString().trim(),
                razon_social: proveedorData.razon_social?.toString().trim(),
                nombre_comercial: proveedorData.nombre_comercial?.trim() ?? null,
                codigo: proveedorData.codigo?.trim() ?? null,
                categoria: proveedorData.categoria ?? null,
                direccion: proveedorData.direccion?.trim() ?? null,
                ciudad: proveedorData.ciudad?.trim() ?? null,
                departamento: proveedorData.departamento ?? null,
                telefono: proveedorData.telefono?.trim() ?? null,
                celular: proveedorData.celular?.trim() ?? null,
                email: proveedorData.email?.trim() ?? null,
                persona_contacto: proveedorData.persona_contacto?.trim() ?? null,
                terminos_pago: proveedorData.terminos_pago ?? null,
                limite_credito: proveedorData.limite_credito !== undefined && proveedorData.limite_credito !== '' ? Number(proveedorData.limite_credito) : undefined,
                notas: proveedorData.notas?.trim() ?? null,
                activo: proveedorData.activo !== undefined ? !!proveedorData.activo : undefined
            };
            Object.keys(updates).forEach(k => updates[k] === undefined && delete updates[k]);
            const { data, error } = await this.supabase
                .from('proveedores')
                .update(updates)
                .eq('id', id)
                .select();
            if (error) return { data: null, error };
            return { data: data?.[0] || null, error: null };
        } catch (error) {
            return { data: null, error };
        }
    }

    /**
     * Elimina (soft delete) un proveedor
     */
    async deleteProveedor(id) {
        try {
            if (!id) return { error: { message: 'ID de proveedor requerido' } };
            const { error } = await this.supabase
                .from('proveedores')
                .update({ deleted_at: new Date().toISOString() })
                .eq('id', id);
            return { error };
        } catch (error) {
            return { error };
        }
    }

    // ===== FUNCIONES PARA COMPRAS =====
    async createCompra(compraData, detalles = []) {
        try {
            // Validaciones mínimas
            if (!compraData || !compraData.fecha_compra) {
                return { data: null, error: { message: 'La fecha de compra es obligatoria' } };
            }
            // proveedor_id debe ser UUID
            if (compraData.proveedor_id && !this._isValidUUID(compraData.proveedor_id)) {
                return { data: null, error: { message: 'Proveedor inválido: se requiere un UUID de la tabla proveedores' } };
            }
            // usuario_id requerido y debe ser UUID
            if (!compraData.usuario_id || !this._isValidUUID(compraData.usuario_id)) {
                return { data: null, error: { message: 'Usuario inválido o no autenticado' } };
            }

            const insertCompra = {
                proveedor_id: compraData.proveedor_id || null,
                usuario_id: compraData.usuario_id || null, // opcional según tu modelo/trigger
                fecha_compra: compraData.fecha_compra,
                fecha_entrega: compraData.fecha_entrega || null,
                estado: compraData.estado || 'pendiente',
                subtotal: Number(compraData.subtotal) || 0,
                impuesto: Number(compraData.impuesto) || 0,
                descuento: Number(compraData.descuento) || 0,
                total: Number(compraData.total) || 0,
                notas: compraData.notas?.trim() || null
            };
            if (compraData.numero_orden !== undefined && compraData.numero_orden !== null && compraData.numero_orden !== '' && !isNaN(Number(compraData.numero_orden))) {
                insertCompra.numero_orden = Number(compraData.numero_orden);
            }

            const { data: compraRows, error: compraErr } = await this.supabase
                .from('compras')
                .insert([insertCompra])
                .select();
            if (compraErr) return { data: null, error: compraErr };
            const compra = compraRows?.[0];

            // Insertar detalles si existen
            if (Array.isArray(detalles) && detalles.length > 0) {
                const detallesRows = detalles.map(d => ({
                    compra_id: compra.id,
                    producto_id: this._isValidUUID(d.producto_id) ? d.producto_id : null,
                    cantidad: Number(d.cantidad) || 0,
                    precio_unitario: Number(d.precio_unitario) || 0,
                    descuento: Number(d.descuento) || 0,
                    tasa_impuesto: Number(d.tasa_impuesto ?? 19.0) || 19.0,
                    subtotal: Number(d.subtotal) || 0,
                    impuesto: Number(d.impuesto) || 0,
                    total: Number(d.total) || 0
                }));

                const { error: detErr } = await this.supabase
                    .from('compras_detalle')
                    .insert(detallesRows);
                if (detErr) return { data: compra, error: detErr };
            }

            return { data: compra, error: null };
        } catch (error) {
            return { data: null, error };
        }
    }

    _isValidUUID(value) {
        return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
    }

    /** Obtiene una compra por id con info de proveedor */
    async getCompraById(id) {
        try {
            const { data, error } = await this.supabase
                .from('compras')
                .select('*, proveedores:proveedor_id(razon_social)')
                .eq('id', id)
                .maybeSingle();
            if (error) return { data: null, error };
            return { data, error: null };
        } catch (error) {
            return { data: null, error };
        }
    }

    /** Obtiene detalle de compra por compra_id, con info de productos */
    async getCompraDetalles(compraId) {
        try {
            const { data, error } = await this.supabase
                .from('compras_detalle')
                .select('*, productos:producto_id(nombre, codigo_interno, codigo_barras, precio_compra, precio_venta)')
                .eq('compra_id', compraId);
            if (error) return { data: null, error };
            return { data: data || [], error: null };
        } catch (error) {
            return { data: null, error };
        }
    }

    /** Actualiza una compra y reemplaza sus detalles */
    async updateCompra(id, compraData, detalles = []) {
        try {
            if (!id || !this._isValidUUID(id)) return { data: null, error: { message: 'ID de compra inválido' } };

            const updates = {
                proveedor_id: compraData.proveedor_id || null,
                fecha_compra: compraData.fecha_compra,
                fecha_entrega: compraData.fecha_entrega || null,
                estado: compraData.estado || 'pendiente',
                subtotal: Number(compraData.subtotal) || 0,
                impuesto: Number(compraData.impuesto) || 0,
                descuento: Number(compraData.descuento) || 0,
                total: Number(compraData.total) || 0,
                notas: compraData.notas?.trim() || null
            };
            if (compraData.numero_orden !== undefined && compraData.numero_orden !== null && compraData.numero_orden !== '' && !isNaN(Number(compraData.numero_orden))) {
                updates.numero_orden = Number(compraData.numero_orden);
            }

            const { data: compraRows, error: upErr } = await this.supabase
                .from('compras')
                .update(updates)
                .eq('id', id)
                .select();
            if (upErr) return { data: null, error: upErr };
            const compra = compraRows?.[0];

            // Reemplazar detalles
            const { error: delErr } = await this.supabase
                .from('compras_detalle')
                .delete()
                .eq('compra_id', id);
            if (delErr) return { data: compra, error: delErr };

            if (Array.isArray(detalles) && detalles.length) {
                const detallesRows = detalles.map(d => ({
                    compra_id: id,
                    producto_id: this._isValidUUID(d.producto_id) ? d.producto_id : null,
                    cantidad: Number(d.cantidad) || 0,
                    precio_unitario: Number(d.precio_unitario) || 0,
                    descuento: Number(d.descuento) || 0,
                    tasa_impuesto: Number(d.tasa_impuesto ?? 19.0) || 19.0,
                    subtotal: Number(d.subtotal) || 0,
                    impuesto: Number(d.impuesto) || 0,
                    total: Number(d.total) || 0
                }));
                const { error: detErr } = await this.supabase
                    .from('compras_detalle')
                    .insert(detallesRows);
                if (detErr) return { data: compra, error: detErr };
            }

            return { data: compra, error: null };
        } catch (error) {
            return { data: null, error };
        }
    }

    /**
     * Obtiene compras con filtros y paginación para historial
     * options: { search, status, date, limit, offset, orderBy, ascending }
     */
    async getCompras(options = {}) {
        try {
            const {
                search = '',
                status = '',
                providerId = '',
                limit = 10,
                offset = 0,
                orderBy = 'numero_orden',
                ascending = false
            } = options;

            let query = this.supabase
                .from('compras')
                .select('id, numero_orden, proveedor_id, fecha_compra, estado, total, created_at, proveedores:proveedor_id(razon_social)', { count: 'exact' })
                .is('deleted_at', null);

            if (status) {
                query = query.eq('estado', status);
            }

            if (search) {
                const numeric = Number(search);
                if (Number.isFinite(numeric)) {
                    query = query.eq('numero_orden', numeric);
                }
            }

            if (providerId) {
                query = query.eq('proveedor_id', providerId);
            }

            query = query.order(orderBy, { ascending });
            if (limit) query = query.range(offset, offset + limit - 1);

            const { data, error, count } = await query;
            if (error) return { data: null, error, count: 0 };
            return { data: data || [], error: null, count: count || 0 };
        } catch (error) {
            return { data: null, error, count: 0 };
        }
    }

    // ===== FUNCIONES DE AUTENTICACIÓN =====
    async login(email, password) {
        const { data, error } = await this.supabase.auth.signInWithPassword({
            email: email,
            password: password
        });
        return { data, error };
    }

    async logout() {
        const { error } = await this.supabase.auth.signOut();
        return { error };
    }

    async register(email, password, userData) {
        const { data, error } = await this.supabase.auth.signUp({
            email: email,
            password: password,
            options: {
                data: userData
            }
        });
        return { data, error };
    }

    // ===== USUARIOS (APP) =====
    /**
     * Garantiza que exista un registro en la tabla usuarios para el usuario autenticado (auth.users)
     * - Si no existe, lo crea con mapeo básico
     * - Si existe, actualiza campos de referencia (email, nombre) si cambiaron
     */
    async ensureAppUser(authUser) {
        try {
            if (!authUser || !authUser.id) return { ensured: false };
            const userId = authUser.id;
            const email = authUser.email || null;
            const fullName = authUser.user_metadata?.name || authUser.user_metadata?.full_name || (email ? email.split('@')[0] : 'Usuario');
            const baseUsername = (email ? email.split('@')[0] : 'usuario').toLowerCase();
            const usernameUnique = `${baseUsername}_${String(userId).substring(0, 8)}`;

            // ¿Existe por id?
            const { data: existing, error: fetchErr } = await this.supabase
                .from('usuarios')
                .select('id, usuario, email, nombre_completo')
                .eq('id', userId)
                .maybeSingle();
            if (fetchErr) return { ensured: false, error: fetchErr };

            if (existing) {
                // Actualizar campos clave si difieren
                const updates = {};
                if (email && existing.email !== email) updates.email = email;
                if (fullName && existing.nombre_completo !== fullName) updates.nombre_completo = fullName;
                if (Object.keys(updates).length) {
                    const { error: upErr } = await this.supabase
                        .from('usuarios')
                        .update(updates)
                        .eq('id', userId);
                    if (upErr) return { ensured: true, warning: upErr };
                }
                return { ensured: true };
            }

            const insertRow = {
                id: userId,
                nombre_completo: fullName,
                usuario: usernameUnique,
                email: email,
                password_hash: 'supabase-auth',
                rol: authUser.user_metadata?.role || 'admin',
                activo: true
            };
            const { error: insErr } = await this.supabase
                .from('usuarios')
                .upsert([insertRow], { onConflict: 'id' });
            if (insErr) return { ensured: false, error: insErr };
            return { ensured: true };
        } catch (error) {
            return { ensured: false, error };
        }
    }

    /**
     * Listado de usuarios con filtros y paginación
     */
    async getUsuarios(options = {}) {
        try {
            const {
                search = '',
                role = '',
                status = '', // active|inactive|blocked|pending (mapeo a activo boolean)
                limit = 10,
                offset = 0,
                orderBy = 'nombre_completo',
                ascending = true
            } = options;

            let query = this.supabase
                .from('usuarios')
                .select('*', { count: 'exact' })
                .is('deleted_at', null);

            if (search) {
                query = query.or(`usuario.ilike.%${search}%,nombre_completo.ilike.%${search}%,email.ilike.%${search}%`);
            }
            if (role) {
                query = query.ilike('rol', `%${role}%`);
            }
            if (status) {
                if (status === 'active') query = query.eq('activo', true);
                if (status === 'inactive' || status === 'blocked' || status === 'pending') query = query.eq('activo', false);
            }

            query = query.order(orderBy, { ascending });
            if (limit) query = query.range(offset, offset + limit - 1);

            const { data, error, count } = await query;
            if (error) return { data: null, error, count: 0 };
            return { data: data || [], error: null, count: count || 0 };
        } catch (error) {
            return { data: null, error, count: 0 };
        }
    }

    /**
     * Verifica si un nombre de usuario está disponible (no existe en tabla usuarios)
     * @param {string} username
     * @returns {Promise<{available:boolean,error:any}>}
     */
    async isUsernameAvailable(username) {
        try {
            const u = (username || '').trim();
            if (!u) return { available: false, error: null };
            const { data, error } = await this.supabase
                .from('usuarios')
                .select('id')
                .eq('usuario', u)
                .limit(1);
            if (error) return { available: false, error };
            return { available: !(Array.isArray(data) && data.length > 0), error: null };
        } catch (error) {
            return { available: false, error };
        }
    }

    /** Verifica disponibilidad de username excluyendo un id dado */
    async isUsernameAvailableFor(username, excludeId) {
        try {
            const u = (username || '').trim();
            if (!u) return { available: false, error: null };
            let query = this.supabase
                .from('usuarios')
                .select('id')
                .eq('usuario', u)
                .limit(1);
            if (excludeId) query = query.neq('id', excludeId);
            const { data, error } = await query;
            if (error) return { available: false, error };
            return { available: !(Array.isArray(data) && data.length > 0), error: null };
        } catch (error) {
            return { available: false, error };
        }
    }

    /** Obtiene un usuario por id */
    async getUsuarioById(id) {
        try {
            const { data, error } = await this.supabase
                .from('usuarios')
                .select('*')
                .eq('id', id)
                .maybeSingle();
            if (error) return { data: null, error };
            return { data, error: null };
        } catch (error) {
            return { data: null, error };
        }
    }

    /**
     * Crea un usuario en la tabla usuarios (no crea cuenta de Auth)
     * Retorna el registro insertado
     */
    async createUsuarioLocal(usuarioData) {
        try {
            const insertData = {
                nombre_completo: usuarioData.nombre_completo?.trim() || null,
                usuario: usuarioData.usuario?.trim() || null,
                email: usuarioData.email?.trim() || null,
                telefono: usuarioData.telefono?.trim() || null,
                documento: usuarioData.documento?.trim() || null,
                fecha_nacimiento: usuarioData.fecha_nacimiento || null,
                direccion: usuarioData.direccion?.trim() || null,
                rol: usuarioData.rol || 'viewer',
                activo: usuarioData.activo !== undefined ? !!usuarioData.activo : true
            };
            const { data, error } = await this.supabase
                .from('usuarios')
                .insert([insertData])
                .select('*')
                .single();
            if (error) return { data: null, error };
            return { data, error: null };
        } catch (error) {
            return { data: null, error };
        }
    }

    /** Actualiza un usuario por id */
    async updateUsuarioApp(id, updates) {
        try {
            const updateData = {
                nombre_completo: updates.nombre_completo !== undefined ? (updates.nombre_completo?.trim() || null) : undefined,
                usuario: updates.usuario !== undefined ? (updates.usuario?.trim() || null) : undefined,
                email: updates.email !== undefined ? (updates.email?.trim() || null) : undefined,
                telefono: updates.telefono !== undefined ? (updates.telefono?.trim() || null) : undefined,
                documento: updates.documento !== undefined ? (updates.documento?.trim() || null) : undefined,
                fecha_nacimiento: updates.fecha_nacimiento !== undefined ? (updates.fecha_nacimiento || null) : undefined,
                direccion: updates.direccion !== undefined ? (updates.direccion?.trim() || null) : undefined,
                rol: updates.rol !== undefined ? updates.rol : undefined,
                activo: updates.activo !== undefined ? !!updates.activo : undefined
            };
            Object.keys(updateData).forEach(k => updateData[k] === undefined && delete updateData[k]);
            const { data, error } = await this.supabase
                .from('usuarios')
                .update(updateData)
                .eq('id', id)
                .select('*')
                .single();
            if (error) return { data: null, error };
            return { data, error: null };
        } catch (error) {
            return { data: null, error };
        }
    }

    /** Cambia estado activo */
    async setUsuarioActivo(id, activo) {
        try {
            const { data, error } = await this.supabase
                .from('usuarios')
                .update({ activo: !!activo })
                .eq('id', id)
                .select('id, activo')
                .single();
            return { data, error };
        } catch (error) {
            return { data: null, error };
        }
    }
}

// Crear instancia global
window.db = new DatabaseService();
