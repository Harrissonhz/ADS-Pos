# 🎨 Documentación de Frontend - ADS-POS

## 📋 **INFORMACIÓN GENERAL**

- **Tecnologías:** HTML5, CSS3, JavaScript ES6+, Bootstrap 5
- **Hosting:** Vercel
- **URL Producción:** https://ads-pos.vercel.app
- **Responsive:** Sí (Mobile-first)
- **Navegadores Soportados:** Chrome, Firefox, Safari, Edge

---

## 🏗️ **ARQUITECTURA FRONTEND**

### **Estructura de Archivos**
```
ADS-POS/
├── 📄 index.html                    # Página principal
├── 📁 pages/                        # Páginas del sistema
│   ├── 📄 login.html               # Autenticación
│   ├── 📄 panel.html               # Dashboard
│   ├── 📄 categorias.html          # Gestión de categorías
│   ├── 📄 productos.html           # Gestión de productos
│   ├── 📄 clientes.html            # Gestión de clientes
│   ├── 📄 proveedores.html         # Gestión de proveedores
│   ├── 📄 ventas.html              # Módulo de ventas
│   ├── 📄 facturacion.html         # Facturación
│   ├── 📄 compras.html             # Gestión de compras
│   ├── 📄 inventario.html          # Control de inventario
│   ├── 📄 movimientos.html         # Movimientos de inventario
│   ├── 📄 caja-apertura.html       # Apertura de caja
│   ├── 📄 caja-cierre.html         # Cierre de caja
│   ├── 📄 caja-historial.html      # Historial de caja
│   ├── 📄 usuarios.html            # Gestión de usuarios
│   ├── 📄 perfil.html              # Perfil de usuario
│   ├── 📄 configuracion.html       # Configuración
│   ├── 📄 reportes.html            # Reportes
│   ├── 📄 ventas-historial.html    # Historial de ventas
│   └── 📄 ayuda.html               # Ayuda
├── 📁 assets/                       # Recursos estáticos
│   ├── 📁 css/                     # Hojas de estilo
│   │   ├── main.css               # Estilos principales
│   │   ├── pos.css                # Estilos del módulo POS
│   │   └── tienda.css             # Estilos de la tienda
│   ├── 📁 js/                      # Archivos JavaScript
│   │   ├── supabase-config.js     # Configuración de Supabase
│   │   ├── database.js            # Servicios de base de datos
│   │   └── auth.js                # Sistema de autenticación
│   └── 📁 img/                     # Imágenes
│       └── logo.png               # Logo del sistema
└── 📄 vercel.json                  # Configuración de Vercel
```

---

## 🎨 **SISTEMA DE DISEÑO**

### **Paleta de Colores**
```css
:root {
  /* Colores principales */
  --primary-color: #007bff;        /* Azul principal */
  --secondary-color: #6c757d;      /* Gris secundario */
  --success-color: #28a745;        /* Verde éxito */
  --danger-color: #dc3545;         /* Rojo peligro */
  --warning-color: #ffc107;        /* Amarillo advertencia */
  --info-color: #17a2b8;           /* Azul información */
  
  /* Colores de fondo */
  --bg-primary: #ffffff;           /* Fondo principal */
  --bg-secondary: #f8f9fa;         /* Fondo secundario */
  --bg-dark: #343a40;              /* Fondo oscuro */
  
  /* Colores de texto */
  --text-primary: #212529;         /* Texto principal */
  --text-secondary: #6c757d;       /* Texto secundario */
  --text-muted: #868e96;           /* Texto atenuado */
  --text-light: #ffffff;           /* Texto claro */
  
  /* Colores de estado */
  --border-color: #dee2e6;         /* Color de bordes */
  --shadow-color: rgba(0,0,0,0.1); /* Color de sombras */
}
```

### **Tipografía**
```css
/* Fuente principal */
@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap');

:root {
  --font-family: 'Poppins', sans-serif;
  --font-size-base: 14px;
  --font-size-sm: 12px;
  --font-size-lg: 16px;
  --font-size-xl: 18px;
  --font-size-xxl: 24px;
  
  /* Pesos de fuente */
  --font-weight-light: 300;
  --font-weight-normal: 400;
  --font-weight-medium: 500;
  --font-weight-semibold: 600;
  --font-weight-bold: 700;
}
```

### **Espaciado**
```css
:root {
  /* Espaciado base */
  --spacing-xs: 0.25rem;    /* 4px */
  --spacing-sm: 0.5rem;     /* 8px */
  --spacing-md: 1rem;       /* 16px */
  --spacing-lg: 1.5rem;     /* 24px */
  --spacing-xl: 2rem;       /* 32px */
  --spacing-xxl: 3rem;      /* 48px */
  
  /* Bordes redondeados */
  --border-radius-sm: 0.25rem;  /* 4px */
  --border-radius-md: 0.375rem; /* 6px */
  --border-radius-lg: 0.5rem;   /* 8px */
  --border-radius-xl: 1rem;     /* 16px */
}
```

---

## 📱 **PÁGINAS DEL SISTEMA**

### **1. index.html - Página Principal**
**Propósito:** Página de entrada al sistema

**Características:**
- ✅ **Landing page** con información del sistema
- ✅ **Navegación** a módulos principales
- ✅ **Diseño responsive** para todos los dispositivos
- ✅ **Call-to-action** para iniciar sesión

**Elementos principales:**
- Header con logo y navegación
- Hero section con descripción
- Cards de módulos principales
- Footer con información de contacto

---

### **2. login.html - Autenticación**
**Propósito:** Inicio de sesión de usuarios

**Características:**
- ✅ **Formulario de login** con validación
- ✅ **Diseño centrado** y minimalista
- ✅ **Validación en tiempo real**
- ✅ **Manejo de errores** con mensajes claros

**Campos del formulario:**
- Email (requerido, formato email)
- Contraseña (requerido, mínimo 6 caracteres)
- Checkbox "Recordar sesión"

**Validaciones:**
```javascript
// Validación de email
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Validación de contraseña
const passwordMinLength = 6;

// Validación del formulario
function validateForm() {
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  
  if (!emailRegex.test(email)) {
    showError('Email inválido');
    return false;
  }
  
  if (password.length < passwordMinLength) {
    showError('La contraseña debe tener al menos 6 caracteres');
    return false;
  }
  
  return true;
}
```

---

### **3. panel.html - Dashboard Principal**
**Propósito:** Panel de control principal del sistema

**Características:**
- ✅ **Métricas en tiempo real** (ventas, productos, clientes)
- ✅ **Gráficos interactivos** (Chart.js)
- ✅ **Accesos rápidos** a módulos principales
- ✅ **Notificaciones** y alertas
- ✅ **Diseño responsive** con grid system

**Métricas mostradas:**
- Total de ventas del día
- Productos con stock bajo
- Clientes nuevos
- Ingresos del mes
- Gráfico de ventas por hora
- Top productos vendidos

**Estructura del dashboard:**
```html
<div class="dashboard-container">
  <!-- Header con métricas principales -->
  <div class="metrics-header">
    <div class="metric-card">
      <h3>Ventas Hoy</h3>
      <span class="metric-value">$2,450,000</span>
    </div>
    <!-- Más métricas... -->
  </div>
  
  <!-- Gráficos y tablas -->
  <div class="dashboard-content">
    <div class="chart-container">
      <!-- Gráfico de ventas -->
    </div>
    <div class="table-container">
      <!-- Tabla de productos más vendidos -->
    </div>
  </div>
</div>
```

---

### **4. categorias.html - Gestión de Categorías**
**Propósito:** Administración de categorías de productos

**Características:**
- ✅ **CRUD completo** (Crear, Leer, Actualizar, Eliminar)
- ✅ **Búsqueda en tiempo real**
- ✅ **Filtros avanzados**
- ✅ **Validación de formularios**
- ✅ **Confirmación de eliminación**

**Funcionalidades:**
- Lista de categorías con paginación
- Formulario de creación/edición
- Búsqueda por nombre
- Filtro por estado (activo/inactivo)
- Selección de color para categoría
- Soft delete con confirmación

**Estructura del formulario:**
```html
<form id="categoryForm" class="needs-validation" novalidate>
  <div class="row">
    <div class="col-md-6">
      <label for="categoryName" class="form-label">Nombre *</label>
      <input type="text" class="form-control" id="categoryName" required>
      <div class="invalid-feedback">El nombre es obligatorio</div>
    </div>
    <div class="col-md-6">
      <label for="categoryColor" class="form-label">Color</label>
      <input type="color" class="form-control" id="categoryColor" value="#007bff">
    </div>
  </div>
  <div class="row">
    <div class="col-12">
      <label for="categoryDescription" class="form-label">Descripción</label>
      <textarea class="form-control" id="categoryDescription" rows="3"></textarea>
    </div>
  </div>
  <div class="row">
    <div class="col-12">
      <div class="form-check">
        <input class="form-check-input" type="checkbox" id="categoryStatus" checked>
        <label class="form-check-label" for="categoryStatus">
          Categoría activa
        </label>
      </div>
    </div>
  </div>
</form>
```

---

### **5. productos.html - Gestión de Productos**
**Propósito:** Administración completa de productos

**Características:**
- ✅ **CRUD completo** con validaciones
- ✅ **Búsqueda avanzada** (nombre, código, categoría)
- ✅ **Filtros múltiples** (categoría, estado, stock)
- ✅ **Carga de imágenes** (futuro)
- ✅ **Cálculo automático** de precios
- ✅ **Gestión de stock** integrada

**Campos del formulario:**
- Información básica (nombre, descripción, marca, modelo)
- Códigos (barras, interno)
- Categoría (dropdown con búsqueda)
- Precios (compra, venta, mayorista)
- Stock (actual, mínimo, máximo)
- Características físicas (peso, dimensiones)
- Configuración (impuestos, descuentos)

**Validaciones:**
```javascript
// Validación de precios
function validatePrices() {
  const purchasePrice = parseFloat(document.getElementById('purchasePrice').value);
  const salePrice = parseFloat(document.getElementById('salePrice').value);
  
  if (salePrice <= purchasePrice) {
    showError('El precio de venta debe ser mayor al precio de compra');
    return false;
  }
  
  return true;
}

// Validación de stock
function validateStock() {
  const currentStock = parseInt(document.getElementById('currentStock').value);
  const minStock = parseInt(document.getElementById('minStock').value);
  const maxStock = parseInt(document.getElementById('maxStock').value);
  
  if (minStock >= maxStock) {
    showError('El stock mínimo debe ser menor al stock máximo');
    return false;
  }
  
  if (currentStock < 0) {
    showError('El stock actual no puede ser negativo');
    return false;
  }
  
  return true;
}
```

---

### **6. clientes.html - Gestión de Clientes**
**Propósito:** Administración de base de datos de clientes

**Características:**
- ✅ **CRUD completo** con validaciones
- ✅ **Búsqueda inteligente** (nombre, documento, teléfono)
- ✅ **Validación de documentos** (CC, NIT, etc.)
- ✅ **Historial de compras** del cliente
- ✅ **Datos de contacto** completos

**Tipos de cliente:**
- **Persona Natural:** CC, CE, TI, PP
- **Persona Jurídica:** NIT

**Campos del formulario:**
- Identificación (tipo, número)
- Nombres (completo, desglosado)
- Contacto (teléfono, celular, email)
- Ubicación (dirección, ciudad, departamento)
- Información personal (fecha nacimiento, género)
- Observaciones

---

### **7. ventas.html - Módulo de Ventas**
**Propósito:** Sistema de punto de venta (POS)

**Características:**
- ✅ **Interfaz tipo POS** optimizada para ventas
- ✅ **Búsqueda rápida** de productos
- ✅ **Cálculo automático** de totales
- ✅ **Múltiples métodos de pago**
- ✅ **Impresión de tickets** (futuro)
- ✅ **Gestión de descuentos**

**Flujo de venta:**
1. Seleccionar cliente (opcional)
2. Buscar y agregar productos
3. Aplicar descuentos si es necesario
4. Seleccionar método de pago
5. Confirmar y procesar venta
6. Imprimir comprobante

**Estructura del POS:**
```html
<div class="pos-container">
  <!-- Panel izquierdo: Productos -->
  <div class="pos-products">
    <div class="search-bar">
      <input type="text" placeholder="Buscar producto..." id="productSearch">
    </div>
    <div class="products-grid" id="productsGrid">
      <!-- Productos dinámicos -->
    </div>
  </div>
  
  <!-- Panel derecho: Carrito -->
  <div class="pos-cart">
    <div class="cart-header">
      <h5>Carrito de Ventas</h5>
    </div>
    <div class="cart-items" id="cartItems">
      <!-- Items del carrito -->
    </div>
    <div class="cart-totals">
      <div class="total-line">
        <span>Subtotal:</span>
        <span id="subtotal">$0</span>
      </div>
      <div class="total-line">
        <span>Impuesto:</span>
        <span id="tax">$0</span>
      </div>
      <div class="total-line total-final">
        <span>Total:</span>
        <span id="total">$0</span>
      </div>
    </div>
    <div class="cart-actions">
      <button class="btn btn-success" id="processSale">Procesar Venta</button>
    </div>
  </div>
</div>
```

---

### **8. facturacion.html - Facturación Electrónica**
**Propósito:** Generación de facturas y comprobantes

**Características:**
- ✅ **Generación de facturas** con numeración automática
- ✅ **Datos del cliente** prellenados
- ✅ **Cálculo de impuestos** automático
- ✅ **Múltiples tipos** de comprobante
- ✅ **Envío por email** (futuro)
- ✅ **Integración con DIAN** (futuro)

**Tipos de comprobante:**
- Factura de venta
- Boleta de venta
- Nota crédito
- Nota débito

---

### **9. inventario.html - Control de Inventario**
**Propósito:** Gestión y control de stock

**Características:**
- ✅ **Vista de stock** en tiempo real
- ✅ **Alertas de stock bajo**
- ✅ **Movimientos de inventario**
- ✅ **Ajustes de stock**
- ✅ **Reportes de inventario**

---

### **10. caja-apertura.html - Apertura de Caja**
**Propósito:** Apertura de turno de caja

**Características:**
- ✅ **Conteo de efectivo** inicial
- ✅ **Validación de montos**
- ✅ **Observaciones** del turno
- ✅ **Cálculo automático** del total

---

### **11. caja-cierre.html - Cierre de Caja**
**Propósito:** Cierre de turno de caja

**Características:**
- ✅ **Conteo de efectivo** final
- ✅ **Cálculo de diferencias**
- ✅ **Resumen de ventas** del turno
- ✅ **Generación de reporte**

---

## 🎨 **SISTEMA DE COMPONENTES**

### **Componentes Reutilizables**

#### **1. Modal de Confirmación**
```html
<div class="modal fade" id="confirmModal" tabindex="-1">
  <div class="modal-dialog">
    <div class="modal-content">
      <div class="modal-header">
        <h5 class="modal-title">Confirmar Acción</h5>
        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
      </div>
      <div class="modal-body">
        <p id="confirmMessage">¿Está seguro de realizar esta acción?</p>
      </div>
      <div class="modal-footer">
        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
        <button type="button" class="btn btn-danger" id="confirmAction">Confirmar</button>
      </div>
    </div>
  </div>
</div>
```

#### **2. Alertas de Notificación**
```html
<div class="alert-container" id="alertContainer">
  <!-- Alertas dinámicas -->
</div>
```

**JavaScript para alertas:**
```javascript
function showAlert(message, type = 'info', duration = 5000) {
  const alertContainer = document.getElementById('alertContainer');
  const alertId = 'alert-' + Date.now();
  
  const alertHTML = `
    <div class="alert alert-${type} alert-dismissible fade show" id="${alertId}" role="alert">
      ${message}
      <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    </div>
  `;
  
  alertContainer.insertAdjacentHTML('beforeend', alertHTML);
  
  // Auto-remove after duration
  setTimeout(() => {
    const alert = document.getElementById(alertId);
    if (alert) {
      alert.remove();
    }
  }, duration);
}
```

#### **3. Tabla de Datos**
```html
<div class="table-container">
  <div class="table-header">
    <div class="search-box">
      <input type="text" class="form-control" placeholder="Buscar..." id="searchInput">
    </div>
    <div class="table-actions">
      <button class="btn btn-primary" id="addButton">
        <i class="fas fa-plus"></i> Agregar
      </button>
    </div>
  </div>
  <div class="table-responsive">
    <table class="table table-striped" id="dataTable">
      <thead>
        <tr>
          <!-- Columnas dinámicas -->
        </tr>
      </thead>
      <tbody>
        <!-- Datos dinámicos -->
      </tbody>
    </table>
  </div>
  <div class="table-footer">
    <div class="pagination-container">
      <!-- Paginación -->
    </div>
  </div>
</div>
```

---

## 📱 **RESPONSIVE DESIGN**

### **Breakpoints**
```css
/* Extra small devices (phones, 576px and down) */
@media (max-width: 575.98px) { }

/* Small devices (landscape phones, 576px and up) */
@media (min-width: 576px) { }

/* Medium devices (tablets, 768px and up) */
@media (min-width: 768px) { }

/* Large devices (desktops, 992px and up) */
@media (min-width: 992px) { }

/* Extra large devices (large desktops, 1200px and up) */
@media (min-width: 1200px) { }
```

### **Grid System**
```html
<!-- Sistema de grid responsive -->
<div class="container-fluid">
  <div class="row">
    <div class="col-12 col-md-6 col-lg-4">
      <!-- Contenido -->
    </div>
    <div class="col-12 col-md-6 col-lg-8">
      <!-- Contenido -->
    </div>
  </div>
</div>
```

### **Componentes Responsive**

#### **Navegación Mobile**
```html
<nav class="navbar navbar-expand-lg navbar-dark bg-primary">
  <div class="container-fluid">
    <a class="navbar-brand" href="#">
      <img src="assets/img/logo.png" alt="ADS-POS" height="30">
    </a>
    <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
      <span class="navbar-toggler-icon"></span>
    </button>
    <div class="collapse navbar-collapse" id="navbarNav">
      <ul class="navbar-nav ms-auto">
        <!-- Items de navegación -->
      </ul>
    </div>
  </div>
</nav>
```

---

## ⚡ **JAVASCRIPT Y FUNCIONALIDADES**

### **Estructura de JavaScript**

#### **1. supabase-config.js**
```javascript
// Configuración de Supabase
const SUPABASE_URL = 'https://ndrjhdwjcyomzpxiwnhr.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';

// Inicializar cliente de Supabase
const { createClient } = supabase;
const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Exportar para uso en otros archivos
window.supabaseClient = supabaseClient;
```

#### **2. database.js**
```javascript
// Servicio de base de datos
class DatabaseService {
  constructor() {
    this.supabase = window.supabaseClient;
  }

  // Funciones genéricas CRUD
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

  async insert(table, data) {
    const { data: result, error } = await this.supabase
      .from(table)
      .insert(Array.isArray(data) ? data : [data])
      .select();
    return { data: result, error };
  }

  async update(table, id, updates) {
    const { data, error } = await this.supabase
      .from(table)
      .update(updates)
      .eq('id', id)
      .select();
    return { data, error };
  }

  async delete(table, id) {
    const { error } = await this.supabase
      .from(table)
      .delete()
      .eq('id', id);
    return { error };
  }
}

// Crear instancia global
window.db = new DatabaseService();
```

#### **3. auth.js**
```javascript
// Servicio de autenticación
class AuthService {
  constructor() {
    this.supabase = window.supabaseClient;
  }

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

  async getCurrentUser() {
    const { data: { user } } = await this.supabase.auth.getUser();
    return user;
  }

  async isAuthenticated() {
    const user = await this.getCurrentUser();
    return user !== null;
  }
}

// Crear instancia global
window.auth = new AuthService();
```

### **Patrones de JavaScript**

#### **1. Manejo de Eventos**
```javascript
// Event listeners con delegación
document.addEventListener('DOMContentLoaded', function() {
  // Inicialización de la página
  initializePage();
  
  // Event listeners
  setupEventListeners();
});

function setupEventListeners() {
  // Delegación de eventos para elementos dinámicos
  document.addEventListener('click', function(e) {
    if (e.target.matches('.btn-edit')) {
      handleEdit(e.target);
    } else if (e.target.matches('.btn-delete')) {
      handleDelete(e.target);
    }
  });
  
  // Event listeners específicos
  document.getElementById('searchInput').addEventListener('input', handleSearch);
  document.getElementById('formSubmit').addEventListener('submit', handleFormSubmit);
}
```

#### **2. Validación de Formularios**
```javascript
// Validación con Bootstrap
function validateForm(formId) {
  const form = document.getElementById(formId);
  
  if (!form.checkValidity()) {
    form.classList.add('was-validated');
    return false;
  }
  
  return true;
}

// Validación personalizada
function validateCustomRules(formData) {
  const errors = [];
  
  // Validar email
  if (formData.email && !isValidEmail(formData.email)) {
    errors.push('Email inválido');
  }
  
  // Validar teléfono
  if (formData.phone && !isValidPhone(formData.phone)) {
    errors.push('Teléfono inválido');
  }
  
  return errors;
}

function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function isValidPhone(phone) {
  const phoneRegex = /^[\+]?[0-9\s\-\(\)]{7,15}$/;
  return phoneRegex.test(phone);
}
```

#### **3. Manejo de Errores**
```javascript
// Función centralizada para manejo de errores
function handleError(error, context = '') {
  console.error(`Error en ${context}:`, error);
  
  let message = 'Ha ocurrido un error inesperado';
  
  if (error.message) {
    message = error.message;
  } else if (typeof error === 'string') {
    message = error;
  }
  
  showAlert(message, 'danger');
}

// Wrapper para funciones async
async function safeAsync(fn, context = '') {
  try {
    return await fn();
  } catch (error) {
    handleError(error, context);
    return null;
  }
}
```

#### **4. Utilidades Comunes**
```javascript
// Utilidades del sistema
const Utils = {
  // Formatear moneda
  formatCurrency(amount) {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP'
    }).format(amount);
  },
  
  // Formatear fecha
  formatDate(date, options = {}) {
    const defaultOptions = {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    };
    
    return new Intl.DateTimeFormat('es-CO', { ...defaultOptions, ...options })
      .format(new Date(date));
  },
  
  // Generar ID único
  generateId() {
    return 'id_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  },
  
  // Debounce para búsquedas
  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  },
  
  // Sanitizar HTML
  sanitizeHTML(str) {
    const temp = document.createElement('div');
    temp.textContent = str;
    return temp.innerHTML;
  }
};

// Hacer utilidades globales
window.Utils = Utils;
```

---

## 🎨 **CSS Y ESTILOS**

### **Estructura de CSS**

#### **1. main.css - Estilos Principales**
```css
/* Variables CSS */
:root {
  /* Colores, tipografía, espaciado */
}

/* Reset y base */
* {
  box-sizing: border-box;
}

body {
  font-family: var(--font-family);
  font-size: var(--font-size-base);
  line-height: 1.6;
  color: var(--text-primary);
  background-color: var(--bg-secondary);
}

/* Componentes reutilizables */
.btn-custom {
  border-radius: var(--border-radius-md);
  font-weight: var(--font-weight-medium);
  transition: all 0.3s ease;
}

.card-custom {
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius-lg);
  box-shadow: 0 2px 4px var(--shadow-color);
  transition: box-shadow 0.3s ease;
}

.card-custom:hover {
  box-shadow: 0 4px 8px var(--shadow-color);
}
```

#### **2. pos.css - Estilos del Módulo POS**
```css
/* Estilos específicos para el módulo POS */
.pos-container {
  display: grid;
  grid-template-columns: 1fr 400px;
  gap: var(--spacing-lg);
  height: 100vh;
  padding: var(--spacing-md);
}

.pos-products {
  background: var(--bg-primary);
  border-radius: var(--border-radius-lg);
  padding: var(--spacing-md);
  overflow-y: auto;
}

.pos-cart {
  background: var(--bg-primary);
  border-radius: var(--border-radius-lg);
  padding: var(--spacing-md);
  display: flex;
  flex-direction: column;
}

.cart-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-sm);
  border-bottom: 1px solid var(--border-color);
}

.cart-totals {
  margin-top: auto;
  padding-top: var(--spacing-md);
  border-top: 2px solid var(--border-color);
}

/* Responsive para POS */
@media (max-width: 768px) {
  .pos-container {
    grid-template-columns: 1fr;
    grid-template-rows: 1fr auto;
    height: auto;
  }
  
  .pos-cart {
    max-height: 300px;
  }
}
```

### **Clases de Utilidad**
```css
/* Espaciado */
.mt-0 { margin-top: 0 !important; }
.mt-1 { margin-top: var(--spacing-xs) !important; }
.mt-2 { margin-top: var(--spacing-sm) !important; }
.mt-3 { margin-top: var(--spacing-md) !important; }
.mt-4 { margin-top: var(--spacing-lg) !important; }
.mt-5 { margin-top: var(--spacing-xl) !important; }

/* Texto */
.text-primary { color: var(--primary-color) !important; }
.text-success { color: var(--success-color) !important; }
.text-danger { color: var(--danger-color) !important; }
.text-muted { color: var(--text-muted) !important; }

/* Fondo */
.bg-primary { background-color: var(--primary-color) !important; }
.bg-light { background-color: var(--bg-secondary) !important; }

/* Bordes */
.border { border: 1px solid var(--border-color) !important; }
.border-top { border-top: 1px solid var(--border-color) !important; }
.border-bottom { border-bottom: 1px solid var(--border-color) !important; }

/* Sombras */
.shadow-sm { box-shadow: 0 1px 2px var(--shadow-color) !important; }
.shadow { box-shadow: 0 2px 4px var(--shadow-color) !important; }
.shadow-lg { box-shadow: 0 4px 8px var(--shadow-color) !important; }
```

---

## 🚀 **OPTIMIZACIÓN Y RENDIMIENTO**

### **Optimizaciones Implementadas**

#### **1. Lazy Loading**
```javascript
// Cargar imágenes de forma diferida
function setupLazyLoading() {
  const images = document.querySelectorAll('img[data-src]');
  
  const imageObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target;
        img.src = img.dataset.src;
        img.classList.remove('lazy');
        observer.unobserve(img);
      }
    });
  });
  
  images.forEach(img => imageObserver.observe(img));
}
```

#### **2. Debouncing en Búsquedas**
```javascript
// Búsqueda con debounce
const debouncedSearch = Utils.debounce(function(searchTerm) {
  performSearch(searchTerm);
}, 300);

document.getElementById('searchInput').addEventListener('input', function(e) {
  debouncedSearch(e.target.value);
});
```

#### **3. Paginación Eficiente**
```javascript
// Paginación del lado del cliente
class PaginationManager {
  constructor(items, itemsPerPage = 10) {
    this.items = items;
    this.itemsPerPage = itemsPerPage;
    this.currentPage = 1;
    this.totalPages = Math.ceil(items.length / itemsPerPage);
  }
  
  getCurrentPageItems() {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    return this.items.slice(startIndex, endIndex);
  }
  
  goToPage(page) {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.render();
    }
  }
  
  render() {
    const items = this.getCurrentPageItems();
    // Renderizar items en la tabla
    this.renderItems(items);
    this.renderPagination();
  }
}
```

#### **4. Caching de Datos**
```javascript
// Cache simple para datos frecuentemente accedidos
class DataCache {
  constructor(ttl = 300000) { // 5 minutos por defecto
    this.cache = new Map();
    this.ttl = ttl;
  }
  
  set(key, data) {
    this.cache.set(key, {
      data: data,
      timestamp: Date.now()
    });
  }
  
  get(key) {
    const item = this.cache.get(key);
    
    if (!item) {
      return null;
    }
    
    if (Date.now() - item.timestamp > this.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    return item.data;
  }
  
  clear() {
    this.cache.clear();
  }
}

// Instancia global del cache
window.dataCache = new DataCache();
```

---

## 🔧 **HERRAMIENTAS DE DESARROLLO**

### **Debugging y Logging**
```javascript
// Sistema de logging
class Logger {
  static log(level, message, data = null) {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${level.toUpperCase()}: ${message}`;
    
    switch (level) {
      case 'error':
        console.error(logMessage, data);
        break;
      case 'warn':
        console.warn(logMessage, data);
        break;
      case 'info':
        console.info(logMessage, data);
        break;
      default:
        console.log(logMessage, data);
    }
  }
  
  static error(message, data) {
    this.log('error', message, data);
  }
  
  static warn(message, data) {
    this.log('warn', message, data);
  }
  
  static info(message, data) {
    this.log('info', message, data);
  }
}

// Hacer Logger global
window.Logger = Logger;
```

### **Testing de Funcionalidades**
```javascript
// Funciones de testing básico
class TestRunner {
  static runTests() {
    const tests = [
      this.testEmailValidation,
      this.testPhoneValidation,
      this.testCurrencyFormatting,
      this.testDateFormatting
    ];
    
    let passed = 0;
    let failed = 0;
    
    tests.forEach(test => {
      try {
        test();
        passed++;
        console.log(`✅ ${test.name} passed`);
      } catch (error) {
        failed++;
        console.error(`❌ ${test.name} failed:`, error.message);
      }
    });
    
    console.log(`\nTest Results: ${passed} passed, ${failed} failed`);
  }
  
  static testEmailValidation() {
    const validEmails = [
      'test@example.com',
      'user.name@domain.co',
      'admin@company.org'
    ];
    
    const invalidEmails = [
      'invalid-email',
      '@domain.com',
      'user@',
      'user@domain'
    ];
    
    validEmails.forEach(email => {
      if (!Utils.isValidEmail(email)) {
        throw new Error(`Valid email ${email} failed validation`);
      }
    });
    
    invalidEmails.forEach(email => {
      if (Utils.isValidEmail(email)) {
        throw new Error(`Invalid email ${email} passed validation`);
      }
    });
  }
  
  static testCurrencyFormatting() {
    const testCases = [
      { input: 1000, expected: '$1.000' },
      { input: 1000000, expected: '$1.000.000' },
      { input: 0, expected: '$0' }
    ];
    
    testCases.forEach(testCase => {
      const result = Utils.formatCurrency(testCase.input);
      if (!result.includes(testCase.expected.replace('$', ''))) {
        throw new Error(`Currency formatting failed for ${testCase.input}`);
      }
    });
  }
}

// Ejecutar tests en desarrollo
if (window.location.hostname === 'localhost') {
  TestRunner.runTests();
}
```

---

## 📱 **ACCESIBILIDAD**

### **Implementaciones de Accesibilidad**

#### **1. Navegación por Teclado**
```html
<!-- Navegación accesible -->
<nav role="navigation" aria-label="Navegación principal">
  <ul class="nav-list">
    <li><a href="#dashboard" tabindex="0">Dashboard</a></li>
    <li><a href="#products" tabindex="0">Productos</a></li>
    <li><a href="#sales" tabindex="0">Ventas</a></li>
  </ul>
</nav>
```

#### **2. Formularios Accesibles**
```html
<!-- Formulario con labels apropiados -->
<form>
  <div class="form-group">
    <label for="productName" class="form-label">
      Nombre del Producto <span class="required" aria-label="requerido">*</span>
    </label>
    <input 
      type="text" 
      id="productName" 
      class="form-control" 
      required 
      aria-describedby="productNameHelp"
      aria-invalid="false"
    >
    <div id="productNameHelp" class="form-text">
      Ingrese el nombre completo del producto
    </div>
    <div class="invalid-feedback" id="productNameError">
      El nombre del producto es obligatorio
    </div>
  </div>
</form>
```

#### **3. Alertas Accesibles**
```html
<!-- Alertas con roles ARIA -->
<div 
  class="alert alert-danger" 
  role="alert" 
  aria-live="polite"
  id="errorAlert"
>
  <span class="sr-only">Error: </span>
  Ha ocurrido un error al procesar la solicitud
</div>
```

#### **4. Tablas Accesibles**
```html
<!-- Tabla con headers apropiados -->
<table class="table" role="table">
  <caption class="sr-only">Lista de productos con precios y stock</caption>
  <thead>
    <tr role="row">
      <th scope="col" role="columnheader">Nombre</th>
      <th scope="col" role="columnheader">Precio</th>
      <th scope="col" role="columnheader">Stock</th>
      <th scope="col" role="columnheader">Acciones</th>
    </tr>
  </thead>
  <tbody>
    <tr role="row">
      <th scope="row" role="rowheader">Producto 1</th>
      <td role="cell">$10,000</td>
      <td role="cell">50</td>
      <td role="cell">
        <button class="btn btn-sm btn-primary" aria-label="Editar Producto 1">
          <i class="fas fa-edit" aria-hidden="true"></i>
        </button>
      </td>
    </tr>
  </tbody>
</table>
```

---

## 🚀 **DESPLIEGUE Y CONFIGURACIÓN**

### **Configuración de Vercel**

#### **vercel.json**
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

### **Optimizaciones de Producción**

#### **1. Minificación de CSS**
```css
/* Estilos minificados para producción */
:root{--primary-color:#007bff;--secondary-color:#6c757d;--success-color:#28a745;--danger-color:#dc3545;--warning-color:#ffc107;--info-color:#17a2b8;--bg-primary:#ffffff;--bg-secondary:#f8f9fa;--bg-dark:#343a40;--text-primary:#212529;--text-secondary:#6c757d;--text-muted:#868e96;--text-light:#ffffff;--border-color:#dee2e6;--shadow-color:rgba(0,0,0,0.1);--font-family:'Poppins',sans-serif;--font-size-base:14px;--font-size-sm:12px;--font-size-lg:16px;--font-size-xl:18px;--font-size-xxl:24px;--font-weight-light:300;--font-weight-normal:400;--font-weight-medium:500;--font-weight-semibold:600;--font-weight-bold:700;--spacing-xs:0.25rem;--spacing-sm:0.5rem;--spacing-md:1rem;--spacing-lg:1.5rem;--spacing-xl:2rem;--spacing-xxl:3rem;--border-radius-sm:0.25rem;--border-radius-md:0.375rem;--border-radius-lg:0.5rem;--border-radius-xl:1rem}*{box-sizing:border-box}body{font-family:var(--font-family);font-size:var(--font-size-base);line-height:1.6;color:var(--text-primary);background-color:var(--bg-secondary)}
```

#### **2. Compresión de Imágenes**
```javascript
// Optimización de imágenes
function optimizeImage(img) {
  // Reducir calidad para imágenes grandes
  if (img.naturalWidth > 800) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    canvas.width = 800;
    canvas.height = (img.naturalHeight * 800) / img.naturalWidth;
    
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    
    return canvas.toDataURL('image/jpeg', 0.8);
  }
  
  return img.src;
}
```

---

## 📊 **MÉTRICAS Y ANALYTICS**

### **Tracking de Eventos**
```javascript
// Sistema de analytics básico
class Analytics {
  static track(event, data = {}) {
    // Enviar evento a servicio de analytics
    console.log('Analytics Event:', event, data);
    
    // Ejemplo de integración con Google Analytics
    if (typeof gtag !== 'undefined') {
      gtag('event', event, data);
    }
  }
  
  static trackPageView(page) {
    this.track('page_view', { page: page });
  }
  
  static trackUserAction(action, element) {
    this.track('user_action', { 
      action: action, 
      element: element,
      timestamp: Date.now()
    });
  }
  
  static trackError(error, context) {
    this.track('error', { 
      error: error.message, 
      context: context,
      stack: error.stack,
      timestamp: Date.now()
    });
  }
}

// Hacer Analytics global
window.Analytics = Analytics;
```

### **Métricas de Rendimiento**
```javascript
// Medición de rendimiento
class PerformanceMonitor {
  static measurePageLoad() {
    window.addEventListener('load', () => {
      const loadTime = performance.timing.loadEventEnd - performance.timing.navigationStart;
      Analytics.track('page_load_time', { loadTime: loadTime });
    });
  }
  
  static measureAPIResponse(apiName, startTime, endTime) {
    const responseTime = endTime - startTime;
    Analytics.track('api_response_time', { 
      api: apiName, 
      responseTime: responseTime 
    });
  }
  
  static measureUserInteraction(element, action) {
    const startTime = performance.now();
    
    element.addEventListener(action, () => {
      const endTime = performance.now();
      const interactionTime = endTime - startTime;
      
      Analytics.track('user_interaction', { 
        element: element.tagName,
        action: action,
        interactionTime: interactionTime
      });
    });
  }
}

// Inicializar monitoreo
PerformanceMonitor.measurePageLoad();
```

---

*Documentación de Frontend - ADS-POS v1.0.0*
*Última actualización: $(date)*
