# 📚 README Principal - ADS-POS

<div align="center">

# 🏪 ADS-POS
## Sistema de Punto de Venta Profesional

[![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)](https://github.com/Harrissonhz/ADS-Pos)
[![License](https://img.shields.io/badge/license-Proprietary-red.svg)](https://github.com/Harrissonhz/ADS-Pos)
[![Status](https://img.shields.io/badge/status-Production%20Ready-green.svg)](https://github.com/Harrissonhz/ADS-Pos)

**Un sistema POS completo y moderno para gestionar tu negocio**

[🚀 Demo en Vivo](https://ads-pos.vercel.app) • [📖 Documentación](https://github.com/Harrissonhz/ADS-Pos) • [🐛 Reportar Bug](https://github.com/Harrissonhz/ADS-Pos/issues) • [💡 Solicitar Feature](https://github.com/Harrissonhz/ADS-Pos/issues)

</div>

---

## 📋 **TABLA DE CONTENIDOS**

- [🎯 Descripción General](#-descripción-general)
- [✨ Características Principales](#-características-principales)
- [🛠️ Tecnologías Utilizadas](#️-tecnologías-utilizadas)
- [🚀 Inicio Rápido](#-inicio-rápido)
- [📁 Estructura del Proyecto](#-estructura-del-proyecto)
- [🗄️ Base de Datos](#️-base-de-datos)
- [🎨 Frontend](#-frontend)
- [⚙️ Backend](#️-backend)
- [📱 Capturas de Pantalla](#-capturas-de-pantalla)
- [🔧 Configuración](#-configuración)
- [📚 Documentación](#-documentación)
- [🤝 Contribución](#-contribución)
- [📄 Licencia](#-licencia)

---

## 🎯 **DESCRIPCIÓN GENERAL**

**ADS-POS** es un sistema de punto de venta (POS) completo y moderno diseñado para pequeñas y medianas empresas. El sistema ofrece una solución integral para la gestión de ventas, inventario, clientes, proveedores y facturación electrónica.

### **¿Por qué elegir ADS-POS?**

- ✅ **Fácil de usar** - Interfaz intuitiva y moderna
- ✅ **Completamente funcional** - Todas las características necesarias para un POS
- ✅ **Responsive** - Funciona en desktop, tablet y móvil
- ✅ **Escalable** - Arquitectura preparada para crecer
- ✅ **Seguro** - Autenticación y autorización robustas
- ✅ **Moderno** - Tecnologías actuales y mejores prácticas

---

## ✨ **CARACTERÍSTICAS PRINCIPALES**

### **🛒 Gestión de Ventas**
- Sistema POS completo con interfaz optimizada
- Múltiples métodos de pago (efectivo, tarjeta, transferencia, mixto)
- Cálculo automático de impuestos y descuentos
- Generación de tickets y comprobantes
- Historial completo de ventas

### **📦 Control de Inventario**
- Gestión completa de productos con categorías
- Control de stock en tiempo real
- Alertas de stock bajo
- Movimientos de inventario automáticos
- Códigos de barras e internos

### **👥 Gestión de Clientes**
- Base de datos completa de clientes
- Historial de compras por cliente
- Información de contacto y ubicación
- Soporte para personas naturales y jurídicas

### **🏢 Gestión de Proveedores**
- Control de proveedores y compras
- Gestión de órdenes de compra
- Términos de pago y límites de crédito
- Historial de compras

### **🧾 Facturación Electrónica**
- Generación de facturas y comprobantes
- Numeración automática
- Datos de cliente prellenados
- Integración con DIAN (futuro)

### **💰 Gestión de Caja**
- Apertura y cierre de turnos
- Conteo de efectivo detallado
- Cálculo de diferencias
- Historial de operaciones de caja

### **👤 Gestión de Usuarios**
- Sistema de roles y permisos
- Autenticación segura
- Perfiles de usuario personalizables
- Control de acceso granular

### **📊 Reportes y Analytics**
- Dashboard con métricas en tiempo real
- Reportes de ventas por período
- Análisis de productos más vendidos
- Estadísticas de clientes y proveedores

### **⚙️ Configuración Empresarial**
- Datos de la empresa personalizables
- Configuración de impuestos
- Monedas y zonas horarias
- Resoluciones DIAN

---

## 🛠️ **TECNOLOGÍAS UTILIZADAS**

### **Frontend**
- **HTML5** - Estructura semántica
- **CSS3** - Estilos modernos con variables CSS
- **JavaScript ES6+** - Lógica del lado del cliente
- **Bootstrap 5** - Framework CSS responsivo
- **Font Awesome** - Iconografía
- **Google Fonts** - Tipografía (Poppins)

### **Backend**
- **Supabase** - Backend as a Service
- **PostgreSQL** - Base de datos relacional
- **Row Level Security** - Seguridad a nivel de fila
- **REST API** - API automática de Supabase
- **Real-time** - Actualizaciones en tiempo real

### **Despliegue**
- **Vercel** - Hosting del frontend
- **Supabase** - Hosting del backend
- **GitHub** - Control de versiones
- **Git** - Gestión de código

### **Herramientas de Desarrollo**
- **VS Code** - Editor de código
- **Git** - Control de versiones
- **Chrome DevTools** - Debugging
- **Postman** - Testing de API

---

## 🚀 **INICIO RÁPIDO**

### **Prerrequisitos**
- Navegador web moderno (Chrome, Firefox, Safari, Edge)
- Conexión a internet
- Cuenta de Supabase (para desarrollo)

### **Instalación Local**

1. **Clonar el repositorio**
```bash
git clone https://github.com/Harrissonhz/ADS-Pos.git
cd ADS-POS
```

2. **Configurar variables de entorno**
```javascript
// En assets/js/supabase-config.js
const SUPABASE_URL = 'tu-url-de-supabase';
const SUPABASE_ANON_KEY = 'tu-clave-anonima';
```

3. **Abrir en el navegador**
```bash
# Usando Python (opcional)
python -m http.server 8000

# O simplemente abrir index.html en el navegador
```

### **Despliegue en Producción**

1. **Fork del repositorio** en GitHub
2. **Conectar con Vercel** para despliegue automático
3. **Configurar Supabase** con tu base de datos
4. **Actualizar variables de entorno** en Vercel

---

## 📁 **ESTRUCTURA DEL PROYECTO**

```
ADS-POS/
├── 📄 index.html                    # Página principal
├── 📁 pages/                        # Páginas del sistema (20 páginas)
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
├── 📄 vercel.json                  # Configuración de Vercel
├── 📄 crear_base_datos_supabase.sql # Script de base de datos
├── 📄 ANALISIS_CAMPOS_BD.md       # Análisis de campos
├── 📄 MODELO_OPTIMIZADO_FINAL.md  # Modelo de BD optimizado
├── 📄 DOCUMENTACION_COMPLETA.md   # Documentación completa
├── 📄 DOCUMENTACION_BASE_DATOS.md # Documentación de BD
├── 📄 DOCUMENTACION_FRONTEND.md   # Documentación de Frontend
└── 📄 README.md                   # Este archivo
```

---

## 🗄️ **BASE DE DATOS**

### **Información General**
- **Motor:** PostgreSQL 15+
- **Hosting:** Supabase
- **Tablas:** 13 tablas principales
- **Seguridad:** Row Level Security (RLS) habilitado
- **Auditoría:** Campos de auditoría en todas las tablas

### **Tablas Principales**
1. **usuarios** - Gestión de usuarios del sistema
2. **categorias** - Categorías de productos
3. **productos** - Productos con precios y stock
4. **clientes** - Clientes (personas y empresas)
5. **proveedores** - Proveedores
6. **ventas** - Ventas principales
7. **ventas_detalle** - Detalles de cada venta
8. **facturacion** - Facturación electrónica
9. **compras** - Compras a proveedores
10. **compras_detalle** - Detalles de cada compra
11. **movimientos_inventario** - Movimientos de inventario
12. **caja_apertura** - Aperturas y cierres de caja
13. **configuracion_empresa** - Configuración del sistema

### **Características de la BD**
- ✅ **UUIDs** como claves primarias
- ✅ **Timestamps** automáticos
- ✅ **Auditoría** completa
- ✅ **Soft deletes** preparado
- ✅ **Índices** optimizados
- ✅ **Triggers** automáticos
- ✅ **Funciones** auxiliares

---

## 🎨 **FRONTEND**

### **Tecnologías Frontend**
- **HTML5** - Estructura semántica y accesible
- **CSS3** - Estilos modernos con variables CSS
- **JavaScript ES6+** - Lógica del lado del cliente
- **Bootstrap 5** - Framework CSS responsivo
- **Font Awesome** - Iconografía completa

### **Características del Frontend**
- ✅ **Responsive Design** - Adaptable a todos los dispositivos
- ✅ **Material Design** - Principios de diseño moderno
- ✅ **Accesibilidad** - Cumple estándares WCAG
- ✅ **Performance** - Optimizado para velocidad
- ✅ **UX/UI** - Experiencia de usuario excepcional

### **Páginas Principales**
- **Dashboard** - Métricas y resumen ejecutivo
- **POS** - Sistema de punto de venta
- **Productos** - Gestión de inventario
- **Clientes** - Base de datos de clientes
- **Ventas** - Historial y reportes de ventas
- **Configuración** - Ajustes del sistema

---

## ⚙️ **BACKEND**

### **Arquitectura Backend**
El backend está completamente manejado por **Supabase**, que proporciona:
- **API REST** automática para todas las tablas
- **Autenticación** integrada con JWT
- **Base de datos PostgreSQL** gestionada
- **Row Level Security** para seguridad
- **Real-time subscriptions** para actualizaciones en vivo

### **Servicios Principales**
- **Autenticación** - Login, registro, recuperación de contraseña
- **Base de Datos** - CRUD completo para todas las entidades
- **Seguridad** - RLS y políticas de acceso
- **Real-time** - Actualizaciones en tiempo real
- **Storage** - Almacenamiento de archivos (futuro)

---

## 📱 **CAPTURAS DE PANTALLA**

### **Dashboard Principal**
![Dashboard](https://via.placeholder.com/800x400/007bff/ffffff?text=Dashboard+Principal)

### **Módulo de Ventas (POS)**
![POS](https://via.placeholder.com/800x400/28a745/ffffff?text=Sistema+POS)

### **Gestión de Productos**
![Productos](https://via.placeholder.com/800x400/ffc107/000000?text=Gestión+de+Productos)

### **Gestión de Clientes**
![Clientes](https://via.placeholder.com/800x400/dc3545/ffffff?text=Gestión+de+Clientes)

---

## 🔧 **CONFIGURACIÓN**

### **Variables de Entorno**

#### **Supabase**
```javascript
const SUPABASE_URL = 'https://ndrjhdwjcyomzpxiwnhr.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';
```

#### **Vercel**
```json
{
  "env": {
    "SUPABASE_URL": "https://ndrjhdwjcyomzpxiwnhr.supabase.co",
    "SUPABASE_ANON_KEY": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### **Configuración de Base de Datos**
1. **Crear proyecto** en Supabase
2. **Ejecutar script** `crear_base_datos_supabase.sql`
3. **Verificar tablas** creadas correctamente
4. **Configurar RLS** y políticas de seguridad

---

## 📚 **DOCUMENTACIÓN**

### **Documentación Completa**
- 📖 **[Documentación General](DOCUMENTACION_COMPLETA.md)** - Guía completa del sistema
- 🗄️ **[Base de Datos](DOCUMENTACION_BASE_DATOS.md)** - Estructura y relaciones de BD
- 🎨 **[Frontend](DOCUMENTACION_FRONTEND.md)** - Componentes y funcionalidades
- 📊 **[Análisis de Campos](ANALISIS_CAMPOS_BD.md)** - Mapeo de campos del frontend
- 🏗️ **[Modelo Optimizado](MODELO_OPTIMIZADO_FINAL.md)** - Modelo de BD final

### **Guías Rápidas**
- 🚀 **[Inicio Rápido](#-inicio-rápido)** - Configuración inicial
- 🔧 **[Configuración](#-configuración)** - Variables y ajustes
- 🐛 **[Troubleshooting](DOCUMENTACION_COMPLETA.md#-troubleshooting)** - Solución de problemas
- 🤝 **[Contribución](#-contribución)** - Cómo contribuir al proyecto

---

## 🚀 **DESPLIEGUE**

### **Despliegue Automático con Vercel**

1. **Fork del repositorio** en GitHub
2. **Conectar con Vercel**:
   - Ir a [vercel.com](https://vercel.com)
   - Importar proyecto desde GitHub
   - Configurar variables de entorno
   - Desplegar automáticamente

3. **Configurar Supabase**:
   - Crear proyecto en [supabase.com](https://supabase.com)
   - Ejecutar script de base de datos
   - Configurar políticas RLS
   - Obtener URL y clave anónima

4. **Actualizar configuración**:
   - Agregar variables de entorno en Vercel
   - Actualizar URLs en el código
   - Verificar funcionamiento

### **URLs de Producción**
- **Frontend:** https://ads-pos.vercel.app
- **Backend:** https://ndrjhdwjcyomzpxiwnhr.supabase.co
- **Repositorio:** https://github.com/Harrissonhz/ADS-Pos

---

## 🧪 **TESTING**

### **Testing Manual**
- ✅ **Navegadores:** Chrome, Firefox, Safari, Edge
- ✅ **Dispositivos:** Desktop, Tablet, Mobile
- ✅ **Funcionalidades:** Todas las características principales
- ✅ **Flujos:** Procesos completos de usuario

### **Testing de Base de Datos**
- ✅ **Integridad:** Constraints y validaciones
- ✅ **RLS:** Políticas de seguridad
- ✅ **Triggers:** Funciones automáticas
- ✅ **Performance:** Consultas optimizadas

---

## 🔒 **SEGURIDAD**

### **Medidas de Seguridad Implementadas**
- ✅ **Autenticación** con JWT tokens
- ✅ **Autorización** con roles y permisos
- ✅ **Row Level Security** en base de datos
- ✅ **Validación** de datos en frontend y backend
- ✅ **Sanitización** de inputs
- ✅ **HTTPS** en producción

### **Buenas Prácticas**
- 🔐 **Contraseñas** seguras y encriptadas
- 🔐 **Tokens** con expiración
- 🔐 **CORS** configurado correctamente
- 🔐 **Headers** de seguridad
- 🔐 **Logs** de auditoría

---

## 📈 **ROADMAP**

### **Versión 1.1.0** (Próxima)
- 🎨 **Mejoras en UI/UX**
- 📱 **App móvil** (PWA)
- 🖨️ **Integración con impresoras**
- 📊 **Reportes avanzados**

### **Versión 1.2.0** (Futuro)
- 🌐 **Multi-idioma**
- 🔄 **Sincronización offline**
- 📧 **Notificaciones por email**
- 💳 **Integración con pasarelas de pago**

### **Versión 2.0.0** (Largo plazo)
- 🤖 **Inteligencia artificial**
- 📊 **Analytics avanzados**
- 🔗 **Integraciones externas**
- ☁️ **Multi-tenant**

---

## 🤝 **CONTRIBUCIÓN**

### **Cómo Contribuir**

1. **Fork** del repositorio
2. **Crear rama** para tu feature (`git checkout -b feature/AmazingFeature`)
3. **Commit** tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. **Push** a la rama (`git push origin feature/AmazingFeature`)
5. **Abrir Pull Request**

### **Estándares de Código**
- **JavaScript:** ES6+, comentarios JSDoc
- **HTML:** Semántico, accesible
- **CSS:** BEM methodology, variables CSS
- **Commits:** Conventional Commits

### **Reportar Bugs**
- Usar el template de issues
- Incluir pasos para reproducir
- Adjuntar capturas de pantalla
- Especificar navegador y versión

---

## 📞 **SOPORTE**

### **Contacto**
- **Desarrollador:** Harrisson Zúñiga
- **Email:** [email de contacto]
- **GitHub:** [@Harrissonhz](https://github.com/Harrissonhz)
- **Proyecto:** [ADS-POS](https://github.com/Harrissonhz/ADS-Pos)

### **Recursos**
- 📖 **Documentación:** [GitHub Wiki](https://github.com/Harrissonhz/ADS-Pos/wiki)
- 🐛 **Issues:** [GitHub Issues](https://github.com/Harrissonhz/ADS-Pos/issues)
- 💬 **Discusiones:** [GitHub Discussions](https://github.com/Harrissonhz/ADS-Pos/discussions)

---

## 📄 **LICENCIA**

Este proyecto es de **uso propietario**. Todos los derechos reservados.

**© 2024 Harrisson Zúñiga. Todos los derechos reservados.**

---

## 🙏 **AGRADECIMIENTOS**

- **Bootstrap** - Framework CSS
- **Supabase** - Backend as a Service
- **Vercel** - Hosting y despliegue
- **Font Awesome** - Iconografía
- **Google Fonts** - Tipografía

---

<div align="center">

**⭐ Si te gusta este proyecto, ¡dale una estrella en GitHub! ⭐**

[![GitHub stars](https://img.shields.io/github/stars/Harrissonhz/ADS-Pos?style=social)](https://github.com/Harrissonhz/ADS-Pos)
[![GitHub forks](https://img.shields.io/github/forks/Harrissonhz/ADS-Pos?style=social)](https://github.com/Harrissonhz/ADS-Pos)

---

**Desarrollado con ❤️ por [Harrisson Zúñiga](https://github.com/Harrissonhz)**

</div>
