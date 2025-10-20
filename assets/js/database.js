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

            // Aplicar búsqueda por nombre
            if (search) {
                query = query.ilike('nombre', `%${search}%`);
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
}

// Crear instancia global
window.db = new DatabaseService();
