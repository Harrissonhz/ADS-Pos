// Configuración de Supabase
const SUPABASE_URL = 'https://ndrjhdwjcyomzpxiwnhr.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5kcmpoZHdqY3lvbXpweGl3bmhyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA3MTE5OTQsImV4cCI6MjA3NjI4Nzk5NH0.apdlLX5jTdpkk3YO9DWwREsED42PW8XkQ_zC7V-kiZY';

// Inicializar cliente de Supabase
const { createClient } = supabase;
const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Función para autenticación automática (para testing)
async function ensureAuthenticated() {
    try {
        const { data: { session } } = await supabaseClient.auth.getSession();
        
        if (!session) {
            console.log('🔐 No hay sesión activa, creando usuario de prueba...');
            
            // Crear un usuario de prueba temporal
            const { data, error } = await supabaseClient.auth.signUp({
                email: `test-${Date.now()}@example.com`,
                password: 'test123456'
            });
            
            if (error) {
                console.log('⚠️ Error al crear usuario de prueba:', error.message);
                // Si falla, intentar con un usuario existente
                const { data: signInData, error: signInError } = await supabaseClient.auth.signInWithPassword({
                    email: 'admin@ads-pos.com',
                    password: 'admin123456'
                });
                
                if (signInError) {
                    console.log('⚠️ No se pudo autenticar:', signInError.message);
                    return false;
                }
                
                console.log('✅ Autenticado con usuario existente');
                return true;
            }
            
            console.log('✅ Usuario de prueba creado y autenticado');
            return true;
        } else {
            console.log('✅ Ya hay una sesión activa');
            return true;
        }
    } catch (error) {
        console.error('❌ Error en autenticación:', error);
        return false;
    }
}

// Exportar para uso en otros archivos
window.supabaseClient = supabaseClient;
window.ensureAuthenticated = ensureAuthenticated;
