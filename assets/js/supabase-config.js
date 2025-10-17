// Configuración de Supabase
const SUPABASE_URL = 'https://ndrjhdwjcyomzpxiwnhr.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5kcmpoZHdqY3lvbXpweGl3bmhyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA3MTE5OTQsImV4cCI6MjA3NjI4Nzk5NH0.apdlLX5jTdpkk3YO9DWwREsED42PW8XkQ_zC7V-kiZY';

// Inicializar cliente de Supabase
const { createClient } = supabase;
const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Exportar para uso en otros archivos
window.supabaseClient = supabaseClient;
