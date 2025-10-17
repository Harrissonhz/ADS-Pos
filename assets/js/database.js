// Servicio de base de datos para el sistema POS
// Este archivo será actualizado cuando se defina el nuevo modelo de entidad-relación
class DatabaseService {
    constructor() {
        this.supabase = window.supabaseClient;
    }

    // ===== FUNCIONES GENÉRICAS =====
    
    // Función genérica para hacer consultas SELECT
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

    // Función genérica para hacer INSERT
    async insert(table, data) {
        const { data: result, error } = await this.supabase
            .from(table)
            .insert(Array.isArray(data) ? data : [data])
            .select();
        return { data: result, error };
    }

    // Función genérica para hacer UPDATE
    async update(table, id, updates) {
        const { data, error } = await this.supabase
            .from(table)
            .update(updates)
            .eq('id', id)
            .select();
        return { data, error };
    }

    // Función genérica para hacer DELETE
    async delete(table, id) {
        const { error } = await this.supabase
            .from(table)
            .delete()
            .eq('id', id);
        return { error };
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

    // ===== FUNCIONES ESPECÍFICAS (A IMPLEMENTAR) =====
    // Estas funciones se implementarán cuando se defina el nuevo modelo de BD
    
    // TODO: Implementar funciones específicas del sistema POS
    // - Gestión de productos
    // - Gestión de categorías  
    // - Gestión de clientes
    // - Gestión de ventas
    // - Gestión de inventario
    // - Gestión de caja
    // - etc.
}

// Crear instancia global
window.db = new DatabaseService();
