// Sistema de autenticación
class AuthService {
    constructor() {
        this.supabase = window.supabaseClient;
        this.currentUser = null;
        this.init();
    }

    async init() {
        // Verificar si hay una sesión activa
        const { data: { session } } = await this.supabase.auth.getSession();
        if (session) {
            this.currentUser = session.user;
            // Sincronizar usuario en tabla usuarios
            try { await window.db?.ensureAppUser?.(this.currentUser); } catch (_) {}
            this.updateUI();
        }

        // Escuchar cambios de autenticación
        this.supabase.auth.onAuthStateChange((event, session) => {
            if (event === 'SIGNED_IN') {
                this.currentUser = session.user;
                // Sincronizar usuario en tabla usuarios
                (async () => { try { await window.db?.ensureAppUser?.(this.currentUser); } catch (_) {} })();
                this.updateUI();
                this.redirectToDashboard();
            } else if (event === 'SIGNED_OUT') {
                this.currentUser = null;
                this.updateUI();
                this.redirectToLogin();
            }
        });
    }

    async login(email, password) {
        try {
            const { data, error } = await this.supabase.auth.signInWithPassword({
                email: email,
                password: password
            });

            if (error) {
                this.showError(error.message);
                return false;
            }

            this.currentUser = data.user;
            this.showSuccess('Inicio de sesión exitoso');
            return true;
        } catch (error) {
            this.showError('Error al iniciar sesión');
            return false;
        }
    }

    async logout() {
        try {
            const { error } = await this.supabase.auth.signOut();
            if (error) {
                this.showError(error.message);
                return false;
            }
            this.currentUser = null;
            this.showSuccess('Sesión cerrada correctamente');
            return true;
        } catch (error) {
            this.showError('Error al cerrar sesión');
            return false;
        }
    }

    async register(email, password, userData) {
        try {
            const { data, error } = await this.supabase.auth.signUp({
                email: email,
                password: password,
                options: {
                    data: userData
                }
            });

            if (error) {
                this.showError(error.message);
                return false;
            }

            this.showSuccess('Usuario registrado correctamente');
            return true;
        } catch (error) {
            this.showError('Error al registrar usuario');
            return false;
        }
    }

    isAuthenticated() {
        return this.currentUser !== null;
    }

    getCurrentUser() {
        return this.currentUser;
    }

    updateUI() {
        // Mostrar/ocultar elementos según el estado de autenticación
        const loginElements = document.querySelectorAll('.login-required');
        const logoutElements = document.querySelectorAll('.logout-required');
        const userInfo = document.querySelector('.user-info');

        if (this.isAuthenticated()) {
            loginElements.forEach(el => el.style.display = 'none');
            logoutElements.forEach(el => el.style.display = 'block');
            if (userInfo) {
                userInfo.textContent = `Bienvenido, ${this.currentUser.email}`;
            }
        } else {
            loginElements.forEach(el => el.style.display = 'block');
            logoutElements.forEach(el => el.style.display = 'none');
            if (userInfo) {
                userInfo.textContent = '';
            }
        }
    }

    redirectToDashboard() {
        const toIndex = () => {
            // Si estamos en /pages/login.html ir a ../index.html
            if (window.location.pathname.endsWith('/pages/login.html')) {
                window.location.href = '../index.html';
            } else {
                // Si estamos en raíz/login.html ir a index.html
                window.location.href = 'index.html';
            }
        };
        if (window.location.pathname.includes('login.html')) toIndex();
    }

    redirectToLogin() {
        if (!window.location.pathname.includes('login.html')) {
            // Si estamos en /pages/*, mantener en /pages/login.html
            if (window.location.pathname.includes('/pages/')) {
                window.location.href = 'login.html';
            } else {
                // Si estamos en raíz, ir a pages/login.html
                window.location.href = 'pages/login.html';
            }
        }
    }

    showError(message) {
        // Crear o actualizar mensaje de error
        let errorDiv = document.getElementById('error-message');
        if (!errorDiv) {
            errorDiv = document.createElement('div');
            errorDiv.id = 'error-message';
            errorDiv.className = 'alert alert-danger alert-dismissible fade show position-fixed';
            errorDiv.style.top = '20px';
            errorDiv.style.right = '20px';
            errorDiv.style.zIndex = '9999';
            document.body.appendChild(errorDiv);
        }
        
        errorDiv.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        
        // Auto-ocultar después de 5 segundos
        setTimeout(() => {
            if (errorDiv) {
                errorDiv.remove();
            }
        }, 5000);
    }

    showSuccess(message) {
        // Crear o actualizar mensaje de éxito
        let successDiv = document.getElementById('success-message');
        if (!successDiv) {
            successDiv = document.createElement('div');
            successDiv.id = 'success-message';
            successDiv.className = 'alert alert-success alert-dismissible fade show position-fixed';
            successDiv.style.top = '20px';
            successDiv.style.right = '20px';
            successDiv.style.zIndex = '9999';
            document.body.appendChild(successDiv);
        }
        
        successDiv.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        
        // Auto-ocultar después de 3 segundos
        setTimeout(() => {
            if (successDiv) {
                successDiv.remove();
            }
        }, 3000);
    }
}

// Crear instancia global
window.auth = new AuthService();
