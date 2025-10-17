// Configuración de Supabase
// Reemplaza estas URLs con las de tu proyecto de Supabase
const SUPABASE_URL = 'https://tu-proyecto.supabase.co';
const SUPABASE_ANON_KEY = 'tu-clave-anonima-aqui';

// Inicializar cliente de Supabase
const { createClient } = supabase;
const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Exportar para uso en otros archivos
window.supabaseClient = supabaseClient;
