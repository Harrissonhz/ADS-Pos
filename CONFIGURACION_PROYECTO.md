# ⚙️ Configuración del Proyecto - ADS-POS

## 📋 **INFORMACIÓN DEL PROYECTO**

- **Nombre:** ADS-POS
- **Versión:** 1.0.0
- **Autor:** Harrisson Zúñiga
- **Fecha de Creación:** Enero 2024
- **Última Actualización:** $(date)
- **Estado:** Producción

---

## 🔧 **CONFIGURACIÓN DE DESARROLLO**

### **Requisitos del Sistema**
- **Node.js:** 16.0.0 o superior (opcional)
- **Navegador:** Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
- **Git:** 2.30.0 o superior
- **Editor:** VS Code recomendado

### **Extensiones de VS Code Recomendadas**
```json
{
  "recommendations": [
    "ms-vscode.vscode-json",
    "bradlc.vscode-tailwindcss",
    "esbenp.prettier-vscode",
    "ms-vscode.vscode-typescript-next",
    "formulahendry.auto-rename-tag",
    "christian-kohler.path-intellisense",
    "ms-vscode.vscode-eslint"
  ]
}
```

### **Configuración de VS Code**
```json
{
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "emmet.includeLanguages": {
    "javascript": "javascriptreact"
  },
  "files.associations": {
    "*.html": "html"
  }
}
```

---

## 🌐 **CONFIGURACIÓN DE ENTORNOS**

### **Desarrollo Local**
```bash
# Puerto de desarrollo
PORT=3000

# URL de Supabase (desarrollo)
SUPABASE_URL=https://ndrjhdwjcyomzpxiwnhr.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Configuración de base de datos
DB_HOST=db.ndrjhdwjcyomzpxiwnhr.supabase.co
DB_PORT=5432
DB_NAME=postgres
DB_USER=postgres
DB_PASSWORD=[password]
```

### **Producción (Vercel)**
```bash
# Variables de entorno en Vercel
SUPABASE_URL=https://ndrjhdwjcyomzpxiwnhr.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Configuración de dominio
VERCEL_URL=https://ads-pos.vercel.app
```

### **Staging (Opcional)**
```bash
# URL de staging
STAGING_URL=https://ads-pos-staging.vercel.app

# Base de datos de staging
STAGING_SUPABASE_URL=https://[staging-project].supabase.co
STAGING_SUPABASE_ANON_KEY=[staging-key]
```

---

## 🗄️ **CONFIGURACIÓN DE BASE DE DATOS**

### **Supabase Configuration**
```sql
-- Configuración inicial de Supabase
-- 1. Crear proyecto en Supabase
-- 2. Ejecutar script crear_base_datos_supabase.sql
-- 3. Configurar RLS policies
-- 4. Crear usuario administrador

-- Usuario administrador por defecto
INSERT INTO usuarios (nombre_completo, usuario, email, rol, password_hash) 
VALUES ('Administrador', 'admin', 'admin@adsstore.com', 'admin', '$2a$10$...');

-- Configuración de empresa
INSERT INTO configuracion_empresa (nombre_empresa, nit, direccion, telefono, email) 
VALUES ('ADS Store', '900123456-7', 'Calle 123 #45-67, Bogotá, Colombia', '+57 1 234 5678', 'info@adsstore.com');
```

### **Políticas RLS**
```sql
-- Habilitar RLS en todas las tablas
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE categorias ENABLE ROW LEVEL SECURITY;
ALTER TABLE productos ENABLE ROW LEVEL SECURITY;
-- ... (para todas las tablas)

-- Políticas básicas para usuarios autenticados
CREATE POLICY "Usuarios autenticados pueden ver datos" 
ON usuarios FOR SELECT 
USING (auth.role() = 'authenticated');
```

---

## 🎨 **CONFIGURACIÓN DE FRONTEND**

### **Variables CSS**
```css
:root {
  /* Colores principales */
  --primary-color: #007bff;
  --secondary-color: #6c757d;
  --success-color: #28a745;
  --danger-color: #dc3545;
  --warning-color: #ffc107;
  --info-color: #17a2b8;
  
  /* Tipografía */
  --font-family: 'Poppins', sans-serif;
  --font-size-base: 14px;
  
  /* Espaciado */
  --spacing-xs: 0.25rem;
  --spacing-sm: 0.5rem;
  --spacing-md: 1rem;
  --spacing-lg: 1.5rem;
  --spacing-xl: 2rem;
  
  /* Bordes */
  --border-radius-sm: 0.25rem;
  --border-radius-md: 0.375rem;
  --border-radius-lg: 0.5rem;
}
```

### **Configuración de Bootstrap**
```html
<!-- Bootstrap 5 CSS -->
<link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">

<!-- Bootstrap 5 JS -->
<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>

<!-- Font Awesome -->
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">

<!-- Google Fonts -->
<link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap" rel="stylesheet">
```

---

## ⚙️ **CONFIGURACIÓN DE JAVASCRIPT**

### **Supabase Client**
```javascript
// assets/js/supabase-config.js
const SUPABASE_URL = 'https://ndrjhdwjcyomzpxiwnhr.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';

const { createClient } = supabase;
const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

window.supabaseClient = supabaseClient;
```

### **Configuración de Servicios**
```javascript
// assets/js/database.js
class DatabaseService {
  constructor() {
    this.supabase = window.supabaseClient;
    this.cache = new Map();
    this.cacheTimeout = 300000; // 5 minutos
  }
  
  // Configuración de cache
  setCache(key, data) {
    this.cache.set(key, {
      data: data,
      timestamp: Date.now()
    });
  }
  
  getCache(key) {
    const item = this.cache.get(key);
    if (item && Date.now() - item.timestamp < this.cacheTimeout) {
      return item.data;
    }
    return null;
  }
}
```

---

## 🚀 **CONFIGURACIÓN DE DESPLIEGUE**

### **Vercel Configuration**
```json
{
  "version": 2,
  "builds": [
    {
      "src": "**/*.html",
      "use": "@vercel/static"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "/$1"
    }
  ],
  "env": {
    "SUPABASE_URL": "https://ndrjhdwjcyomzpxiwnhr.supabase.co",
    "SUPABASE_ANON_KEY": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  },
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-XSS-Protection",
          "value": "1; mode=block"
        }
      ]
    }
  ]
}
```

### **GitHub Actions (Opcional)**
```yaml
# .github/workflows/deploy.yml
name: Deploy to Vercel

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v2
    - name: Deploy to Vercel
      uses: amondnet/vercel-action@v20
      with:
        vercel-token: ${{ secrets.VERCEL_TOKEN }}
        vercel-org-id: ${{ secrets.ORG_ID }}
        vercel-project-id: ${{ secrets.PROJECT_ID }}
        working-directory: ./
```

---

## 🔒 **CONFIGURACIÓN DE SEGURIDAD**

### **Headers de Seguridad**
```javascript
// Configuración de headers en Vercel
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "Strict-Transport-Security",
          "value": "max-age=31536000; includeSubDomains"
        },
        {
          "key": "Content-Security-Policy",
          "value": "default-src 'self'; script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://cdnjs.cloudflare.com; style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https:; connect-src 'self' https://ndrjhdwjcyomzpxiwnhr.supabase.co"
        }
      ]
    }
  ]
}
```

### **Configuración de CORS**
```sql
-- En Supabase Dashboard > Settings > API
-- Configurar CORS origins
-- https://ads-pos.vercel.app
-- http://localhost:3000 (desarrollo)
```

---

## 📊 **CONFIGURACIÓN DE MONITOREO**

### **Analytics (Opcional)**
```javascript
// Google Analytics 4
gtag('config', 'GA_MEASUREMENT_ID', {
  page_title: 'ADS-POS',
  page_location: window.location.href
});

// Eventos personalizados
function trackEvent(eventName, parameters) {
  gtag('event', eventName, parameters);
}
```

### **Error Tracking (Opcional)**
```javascript
// Sentry para tracking de errores
Sentry.init({
  dsn: "YOUR_SENTRY_DSN",
  environment: process.env.NODE_ENV
});
```

---

## 🧪 **CONFIGURACIÓN DE TESTING**

### **Jest Configuration (Opcional)**
```json
{
  "name": "ads-pos",
  "version": "1.0.0",
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage"
  },
  "devDependencies": {
    "jest": "^29.0.0",
    "@testing-library/jest-dom": "^5.16.0",
    "@testing-library/user-event": "^14.0.0"
  },
  "jest": {
    "testEnvironment": "jsdom",
    "setupFilesAfterEnv": ["<rootDir>/src/setupTests.js"]
  }
}
```

### **Cypress Configuration (Opcional)**
```javascript
// cypress.config.js
const { defineConfig } = require('cypress');

module.exports = defineConfig({
  e2e: {
    baseUrl: 'http://localhost:3000',
    supportFile: 'cypress/support/e2e.js',
    specPattern: 'cypress/e2e/**/*.cy.js'
  }
});
```

---

## 🔧 **HERRAMIENTAS DE DESARROLLO**

### **Scripts de Desarrollo**
```json
{
  "scripts": {
    "dev": "python -m http.server 3000",
    "build": "echo 'No build step required for static site'",
    "deploy": "vercel --prod",
    "db:setup": "psql -h db.ndrjhdwjcyomzpxiwnhr.supabase.co -U postgres -d postgres -f crear_base_datos_supabase.sql",
    "db:reset": "psql -h db.ndrjhdwjcyomzpxiwnhr.supabase.co -U postgres -d postgres -c 'DROP SCHEMA public CASCADE; CREATE SCHEMA public;' && npm run db:setup"
  }
}
```

### **Pre-commit Hooks (Opcional)**
```json
{
  "devDependencies": {
    "husky": "^8.0.0",
    "lint-staged": "^13.0.0"
  },
  "husky": {
    "hooks": {
      "pre-commit": "lint-staged"
    }
  },
  "lint-staged": {
    "*.{js,html,css}": [
      "prettier --write",
      "git add"
    ]
  }
}
```

---

## 📝 **CONFIGURACIÓN DE DOCUMENTACIÓN**

### **JSDoc Configuration**
```json
{
  "name": "ads-pos",
  "version": "1.0.0",
  "description": "Sistema de Punto de Venta Profesional",
  "main": "index.html",
  "scripts": {
    "docs": "jsdoc -c jsdoc.conf.json",
    "docs:serve": "http-server docs -p 8080"
  },
  "devDependencies": {
    "jsdoc": "^4.0.0"
  }
}
```

### **JSDoc Config File**
```javascript
// jsdoc.conf.json
{
  "source": {
    "include": ["./assets/js/", "./README.md"],
    "includePattern": "\\.(js|html)$",
    "excludePattern": "(node_modules/|docs/)"
  },
  "opts": {
    "destination": "./docs/",
    "recurse": true
  },
  "plugins": ["plugins/markdown"],
  "templates": {
    "cleverLinks": false,
    "monospaceLinks": false
  }
}
```

---

## 🌍 **CONFIGURACIÓN DE IDIOMAS**

### **i18n Configuration (Futuro)**
```javascript
// assets/js/i18n.js
const translations = {
  es: {
    'welcome': 'Bienvenido',
    'login': 'Iniciar Sesión',
    'logout': 'Cerrar Sesión',
    'products': 'Productos',
    'sales': 'Ventas',
    'customers': 'Clientes'
  },
  en: {
    'welcome': 'Welcome',
    'login': 'Login',
    'logout': 'Logout',
    'products': 'Products',
    'sales': 'Sales',
    'customers': 'Customers'
  }
};

function t(key, lang = 'es') {
  return translations[lang][key] || key;
}
```

---

## 📱 **CONFIGURACIÓN DE PWA (Futuro)**

### **Service Worker**
```javascript
// sw.js
const CACHE_NAME = 'ads-pos-v1';
const urlsToCache = [
  '/',
  '/assets/css/main.css',
  '/assets/js/supabase-config.js',
  '/assets/js/database.js',
  '/assets/js/auth.js'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});
```

### **Manifest**
```json
{
  "name": "ADS-POS",
  "short_name": "ADS-POS",
  "description": "Sistema de Punto de Venta Profesional",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#007bff",
  "icons": [
    {
      "src": "/assets/img/logo-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/assets/img/logo-512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

---

## 🔄 **CONFIGURACIÓN DE CI/CD**

### **GitHub Actions Workflow**
```yaml
name: CI/CD Pipeline

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v2
    - name: Setup Node.js
      uses: actions/setup-node@v2
      with:
        node-version: '16'
    - name: Install dependencies
      run: npm install
    - name: Run tests
      run: npm test
    - name: Run linting
      run: npm run lint

  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
    - uses: actions/checkout@v2
    - name: Deploy to Vercel
      uses: amondnet/vercel-action@v20
      with:
        vercel-token: ${{ secrets.VERCEL_TOKEN }}
        vercel-org-id: ${{ secrets.ORG_ID }}
        vercel-project-id: ${{ secrets.PROJECT_ID }}
```

---

*Configuración del Proyecto - ADS-POS v1.0.0*
*Última actualización: $(date)*
