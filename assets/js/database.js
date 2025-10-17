// Funciones de base de datos para el sistema POS
class DatabaseService {
    constructor() {
        this.supabase = window.supabaseClient;
    }

    // ===== AUTENTICACIÓN =====
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

    // ===== PRODUCTOS =====
    async getProducts() {
        const { data, error } = await this.supabase
            .from('productos')
            .select('*')
            .order('nombre');
        return { data, error };
    }

    async createProduct(product) {
        const { data, error } = await this.supabase
            .from('productos')
            .insert([product])
            .select();
        return { data, error };
    }

    async updateProduct(id, updates) {
        const { data, error } = await this.supabase
            .from('productos')
            .update(updates)
            .eq('id', id)
            .select();
        return { data, error };
    }

    async deleteProduct(id) {
        const { error } = await this.supabase
            .from('productos')
            .delete()
            .eq('id', id);
        return { error };
    }

    // ===== CATEGORÍAS =====
    async getCategories() {
        const { data, error } = await this.supabase
            .from('categorias')
            .select('*')
            .order('nombre');
        return { data, error };
    }

    async createCategory(category) {
        const { data, error } = await this.supabase
            .from('categorias')
            .insert([category])
            .select();
        return { data, error };
    }

    // ===== CLIENTES =====
    async getClients() {
        const { data, error } = await this.supabase
            .from('clientes')
            .select('*')
            .order('nombre');
        return { data, error };
    }

    async createClient(client) {
        const { data, error } = await this.supabase
            .from('clientes')
            .insert([client])
            .select();
        return { data, error };
    }

    async updateClient(id, updates) {
        const { data, error } = await this.supabase
            .from('clientes')
            .update(updates)
            .eq('id', id)
            .select();
        return { data, error };
    }

    // ===== VENTAS =====
    async createSale(sale) {
        const { data, error } = await this.supabase
            .from('ventas')
            .insert([sale])
            .select();
        return { data, error };
    }

    async getSales(filters = {}) {
        let query = this.supabase
            .from('ventas')
            .select('*, clientes(nombre), usuarios(nombre)')
            .order('fecha', { ascending: false });

        if (filters.fecha_inicio) {
            query = query.gte('fecha', filters.fecha_inicio);
        }
        if (filters.fecha_fin) {
            query = query.lte('fecha', filters.fecha_fin);
        }

        const { data, error } = await query;
        return { data, error };
    }

    // ===== DETALLES DE VENTA =====
    async createSaleDetails(details) {
        const { data, error } = await this.supabase
            .from('detalles_venta')
            .insert(details)
            .select();
        return { data, error };
    }

    async getSaleDetails(saleId) {
        const { data, error } = await this.supabase
            .from('detalles_venta')
            .select('*, productos(nombre, precio)')
            .eq('venta_id', saleId);
        return { data, error };
    }

    // ===== PROVEEDORES =====
    async getSuppliers() {
        const { data, error } = await this.supabase
            .from('proveedores')
            .select('*')
            .order('nombre');
        return { data, error };
    }

    async createSupplier(supplier) {
        const { data, error } = await this.supabase
            .from('proveedores')
            .insert([supplier])
            .select();
        return { data, error };
    }

    // ===== COMPRAS =====
    async createPurchase(purchase) {
        const { data, error } = await this.supabase
            .from('compras')
            .insert([purchase])
            .select();
        return { data, error };
    }

    // ===== USUARIOS =====
    async getUsers() {
        const { data, error } = await this.supabase
            .from('usuarios')
            .select('*')
            .order('nombre');
        return { data, error };
    }

    async createUser(user) {
        const { data, error } = await this.supabase
            .from('usuarios')
            .insert([user])
            .select();
        return { data, error };
    }

    // ===== CAJA =====
    async openCashRegister(cashData) {
        const { data, error } = await this.supabase
            .from('caja_apertura')
            .insert([cashData])
            .select();
        return { data, error };
    }

    async closeCashRegister(cashId, closingData) {
        const { data, error } = await this.supabase
            .from('caja_apertura')
            .update(closingData)
            .eq('id', cashId)
            .select();
        return { data, error };
    }

    async getCashRegisterStatus() {
        const { data, error } = await this.supabase
            .from('caja_apertura')
            .select('*')
            .is('fecha_cierre', null)
            .order('fecha_apertura', { ascending: false })
            .limit(1);
        return { data, error };
    }
}

// Crear instancia global
window.db = new DatabaseService();
