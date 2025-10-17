# Análisis Completo de Campos para Modelo de Base de Datos

## 📋 **RESUMEN DE PÁGINAS ANALIZADAS**

### **Páginas del Sistema POS:**
1. **categorias.html** - Gestión de categorías
2. **productos.html** - Gestión de productos
3. **clientes.html** - Gestión de clientes
4. **proveedores.html** - Gestión de proveedores
5. **ventas.html** - Módulo de ventas
6. **facturacion.html** - Facturación electrónica
7. **usuarios.html** - Gestión de usuarios
8. **caja-apertura.html** - Apertura de caja
9. **caja-cierre.html** - Cierre de caja
10. **caja-historial.html** - Historial de caja
11. **compras.html** - Gestión de compras
12. **inventario.html** - Control de inventario
13. **movimientos.html** - Movimientos de inventario
14. **reportes.html** - Reportes y estadísticas
15. **configuracion.html** - Configuración del sistema
16. **perfil.html** - Perfil de usuario
17. **ventas-historial.html** - Historial de ventas
18. **login.html** - Autenticación
19. **ayuda.html** - Sistema de ayuda
20. **panel.html** - Panel principal

---

## 🗂️ **ANÁLISIS DETALLADO POR PÁGINA**

### **1. CATEGORÍAS (categorias.html)**
| Campo | Tipo HTML | Tipo BD Sugerido | Descripción |
|-------|-----------|------------------|-------------|
| `categoryName` | text | VARCHAR(100) | Nombre de la categoría |
| `categoryDescription` | textarea | TEXT | Descripción de la categoría |
| `categoryStatus` | select | BOOLEAN | Estado activo/inactivo |
| `categoryColor` | color | VARCHAR(7) | Color hexadecimal |

### **2. PRODUCTOS (productos.html)**
| Campo | Tipo HTML | Tipo BD Sugerido | Descripción |
|-------|-----------|------------------|-------------|
| `productName` | text | VARCHAR(200) | Nombre del producto |
| `barcode` | text | VARCHAR(50) | Código de barras |
| `internalCode` | text | VARCHAR(50) | Código interno |
| `category` | select | UUID | ID de categoría (FK) |
| `brand` | text | VARCHAR(100) | Marca |
| `model` | text | VARCHAR(100) | Modelo |
| `description` | textarea | TEXT | Descripción detallada |
| `salePrice` | number | DECIMAL(10,2) | Precio de venta |
| `purchasePrice` | number | DECIMAL(10,2) | Precio de compra |
| `profitMargin` | number | DECIMAL(5,2) | Margen de ganancia (%) |
| `wholesalePrice` | number | DECIMAL(10,2) | Precio al por mayor |
| `maxDiscount` | number | DECIMAL(5,2) | Descuento máximo (%) |
| `taxRate` | select | DECIMAL(5,2) | Tasa de impuesto (%) |
| `stock` | number | INTEGER | Cantidad en stock |
| `minStock` | number | INTEGER | Stock mínimo |
| `maxStock` | number | INTEGER | Stock máximo |
| `weight` | number | DECIMAL(8,3) | Peso (kg) |
| `dimensions` | text | VARCHAR(50) | Dimensiones |
| `status` | select | BOOLEAN | Estado activo/inactivo |

### **3. CLIENTES (clientes.html)**
| Campo | Tipo HTML | Tipo BD Sugerido | Descripción |
|-------|-----------|------------------|-------------|
| `idType` | select | VARCHAR(10) | Tipo de identificación |
| `idNumber` | text | VARCHAR(20) | Número de identificación |
| `fullName` | text | VARCHAR(200) | Nombre completo/Razón social |
| `firstName` | text | VARCHAR(100) | Primer nombre |
| `secondName` | text | VARCHAR(100) | Segundo nombre |
| `firstLastName` | text | VARCHAR(100) | Primer apellido |
| `secondLastName` | text | VARCHAR(100) | Segundo apellido |
| `address` | text | VARCHAR(300) | Dirección |
| `city` | text | VARCHAR(100) | Ciudad |
| `department` | select | VARCHAR(100) | Departamento |
| `phone` | tel | VARCHAR(20) | Teléfono fijo |
| `mobile` | tel | VARCHAR(20) | Teléfono móvil |
| `email` | email | VARCHAR(100) | Correo electrónico |
| `birthDate` | date | DATE | Fecha de nacimiento |
| `gender` | select | VARCHAR(10) | Género |
| `status` | select | BOOLEAN | Estado activo/inactivo |
| `notes` | textarea | TEXT | Observaciones |

### **4. PROVEEDORES (proveedores.html)**
| Campo | Tipo HTML | Tipo BD Sugerido | Descripción |
|-------|-----------|------------------|-------------|
| `idType` | select | VARCHAR(10) | Tipo de identificación |
| `idNumber` | text | VARCHAR(20) | Número de identificación |
| `companyName` | text | VARCHAR(200) | Razón social |
| `tradeName` | text | VARCHAR(200) | Nombre comercial |
| `supplierCode` | text | VARCHAR(50) | Código del proveedor |
| `category` | select | VARCHAR(50) | Categoría del proveedor |
| `address` | text | VARCHAR(300) | Dirección |
| `city` | text | VARCHAR(100) | Ciudad |
| `department` | select | VARCHAR(100) | Departamento |
| `phone` | tel | VARCHAR(20) | Teléfono |
| `mobile` | tel | VARCHAR(20) | Teléfono móvil |
| `email` | email | VARCHAR(100) | Correo electrónico |
| `website` | url | VARCHAR(200) | Sitio web |
| `contactPerson` | text | VARCHAR(200) | Persona de contacto |
| `paymentTerms` | select | VARCHAR(50) | Términos de pago |
| `creditLimit` | number | DECIMAL(12,2) | Límite de crédito |
| `status` | select | BOOLEAN | Estado activo/inactivo |
| `notes` | textarea | TEXT | Observaciones |

### **5. VENTAS (ventas.html)**
| Campo | Tipo HTML | Tipo BD Sugerido | Descripción |
|-------|-----------|------------------|-------------|
| `customerSearch` | text | VARCHAR(200) | Búsqueda de cliente |
| `salesperson` | select | UUID | ID del vendedor (FK) |
| `saleDateTime` | datetime-local | TIMESTAMP | Fecha y hora de venta |
| `productSearch` | text | VARCHAR(200) | Búsqueda de producto |
| `quantity` | number | INTEGER | Cantidad |
| `unitPrice` | number | DECIMAL(10,2) | Precio unitario |
| `discount` | number | DECIMAL(5,2) | Descuento (%) |
| `subtotal` | number | DECIMAL(10,2) | Subtotal |
| `tax` | number | DECIMAL(10,2) | Impuesto |
| `total` | number | DECIMAL(10,2) | Total |
| `paymentMethod` | select | VARCHAR(20) | Método de pago |
| `status` | select | VARCHAR(20) | Estado de la venta |

### **6. FACTURACIÓN (facturacion.html)**
| Campo | Tipo HTML | Tipo BD Sugerido | Descripción |
|-------|-----------|------------------|-------------|
| `docType` | select | VARCHAR(20) | Tipo de comprobante |
| `series` | text | VARCHAR(10) | Serie |
| `number` | text | VARCHAR(20) | Número |
| `issueDate` | date | DATE | Fecha de emisión |
| `currency` | select | VARCHAR(3) | Moneda |
| `saleCondition` | select | VARCHAR(20) | Condición de venta |
| `creditDays` | number | INTEGER | Días de crédito |
| `idType` | select | VARCHAR(10) | Tipo de identificación cliente |
| `idNumber` | text | VARCHAR(20) | Número de identificación |
| `customerName` | text | VARCHAR(200) | Nombre del cliente |
| `customerAddress` | text | VARCHAR(300) | Dirección del cliente |
| `customerEmail` | email | VARCHAR(100) | Email del cliente |
| `customerPhone` | tel | VARCHAR(20) | Teléfono del cliente |
| `productCode` | text | VARCHAR(50) | Código del producto |
| `productName` | text | VARCHAR(200) | Nombre del producto |
| `quantity` | number | INTEGER | Cantidad |
| `unitPrice` | number | DECIMAL(10,2) | Precio unitario |
| `discount` | number | DECIMAL(5,2) | Descuento (%) |
| `taxRate` | number | DECIMAL(5,2) | Tasa de impuesto (%) |
| `subtotal` | number | DECIMAL(10,2) | Subtotal |
| `tax` | number | DECIMAL(10,2) | Impuesto |
| `total` | number | DECIMAL(10,2) | Total |

### **7. USUARIOS (usuarios.html)**
| Campo | Tipo HTML | Tipo BD Sugerido | Descripción |
|-------|-----------|------------------|-------------|
| `fullName` | text | VARCHAR(200) | Nombre completo |
| `username` | text | VARCHAR(50) | Nombre de usuario |
| `email` | email | VARCHAR(100) | Correo electrónico |
| `phone` | tel | VARCHAR(20) | Teléfono |
| `documentId` | text | VARCHAR(20) | Cédula/ID |
| `birthDate` | date | DATE | Fecha de nacimiento |
| `address` | textarea | TEXT | Dirección |
| `observations` | textarea | TEXT | Observaciones |
| `role` | select | VARCHAR(20) | Rol del usuario |
| `permissions` | checkbox | JSON | Permisos específicos |
| `status` | select | BOOLEAN | Estado activo/inactivo |
| `lastLogin` | datetime-local | TIMESTAMP | Último acceso |
| `password` | password | VARCHAR(255) | Contraseña (hash) |

### **8. CAJA APERTURA (caja-apertura.html)**
| Campo | Tipo HTML | Tipo BD Sugerido | Descripción |
|-------|-----------|------------------|-------------|
| `cashier` | select | UUID | ID del cajero (FK) |
| `openingDateTime` | datetime-local | TIMESTAMP | Fecha y hora de apertura |
| `observations` | textarea | TEXT | Observaciones |
| `bills100k` | number | INTEGER | Billetes de $100,000 |
| `bills50k` | number | INTEGER | Billetes de $50,000 |
| `bills20k` | number | INTEGER | Billetes de $20,000 |
| `bills10k` | number | INTEGER | Billetes de $10,000 |
| `bills5k` | number | INTEGER | Billetes de $5,000 |
| `bills2k` | number | INTEGER | Billetes de $2,000 |
| `bills1k` | number | INTEGER | Billetes de $1,000 |
| `coins500` | number | INTEGER | Monedas de $500 |
| `coins200` | number | INTEGER | Monedas de $200 |
| `coins100` | number | INTEGER | Monedas de $100 |
| `coins50` | number | INTEGER | Monedas de $50 |
| `initialAmount` | number | DECIMAL(12,2) | Monto inicial total |

### **9. CAJA CIERRE (caja-cierre.html)**
| Campo | Tipo HTML | Tipo BD Sugerido | Descripción |
|-------|-----------|------------------|-------------|
| `cashier` | text | VARCHAR(100) | Cajero responsable |
| `closingDateTime` | datetime-local | TIMESTAMP | Fecha y hora de cierre |
| `observations` | textarea | TEXT | Observaciones del cierre |
| `bills100k` | number | INTEGER | Billetes de $100,000 |
| `bills50k` | number | INTEGER | Billetes de $50,000 |
| `bills20k` | number | INTEGER | Billetes de $20,000 |
| `bills10k` | number | INTEGER | Billetes de $10,000 |
| `bills5k` | number | INTEGER | Billetes de $5,000 |
| `bills2k` | number | INTEGER | Billetes de $2,000 |
| `bills1k` | number | INTEGER | Billetes de $1,000 |
| `coins500` | number | INTEGER | Monedas de $500 |
| `coins200` | number | INTEGER | Monedas de $200 |
| `coins100` | number | INTEGER | Monedas de $100 |
| `coins50` | number | INTEGER | Monedas de $50 |
| `finalAmount` | number | DECIMAL(12,2) | Monto final total |
| `expectedAmount` | number | DECIMAL(12,2) | Monto esperado |
| `difference` | number | DECIMAL(12,2) | Diferencia |

### **10. COMPRAS (compras.html)**
| Campo | Tipo HTML | Tipo BD Sugerido | Descripción |
|-------|-----------|------------------|-------------|
| `orderNumber` | text | VARCHAR(50) | Número de orden |
| `purchaseDate` | date | DATE | Fecha de compra |
| `expectedDelivery` | date | DATE | Fecha esperada de entrega |
| `purchaseStatus` | select | VARCHAR(20) | Estado de la compra |
| `supplier` | select | UUID | ID del proveedor (FK) |
| `contactPerson` | text | VARCHAR(200) | Persona de contacto |
| `supplierPhone` | tel | VARCHAR(20) | Teléfono del proveedor |
| `supplierEmail` | email | VARCHAR(100) | Email del proveedor |
| `searchProduct` | text | VARCHAR(200) | Búsqueda de producto |
| `quantity` | number | INTEGER | Cantidad |
| `unitPrice` | number | DECIMAL(10,2) | Precio unitario |
| `discount` | number | DECIMAL(5,2) | Descuento (%) |
| `subtotal` | number | DECIMAL(10,2) | Subtotal |
| `tax` | number | DECIMAL(10,2) | Impuesto |
| `total` | number | DECIMAL(10,2) | Total |

### **11. INVENTARIO (inventario.html)**
| Campo | Tipo HTML | Tipo BD Sugerido | Descripción |
|-------|-----------|------------------|-------------|
| `searchProduct` | text | VARCHAR(200) | Búsqueda de producto |
| `filterCategory` | select | VARCHAR(50) | Filtro por categoría |
| `filterStock` | select | VARCHAR(20) | Filtro por estado de stock |
| `movementType` | select | VARCHAR(20) | Tipo de movimiento |
| `product` | select | UUID | ID del producto (FK) |
| `quantity` | number | INTEGER | Cantidad |
| `reason` | text | VARCHAR(200) | Motivo del movimiento |
| `reference` | text | VARCHAR(100) | Referencia |
| `notes` | textarea | TEXT | Notas |

### **12. MOVIMIENTOS (movimientos.html)**
| Campo | Tipo HTML | Tipo BD Sugerido | Descripción |
|-------|-----------|------------------|-------------|
| `searchTerm` | text | VARCHAR(200) | Término de búsqueda |
| `filterType` | select | VARCHAR(20) | Filtro por tipo |
| `filterProduct` | select | UUID | Filtro por producto (FK) |
| `dateFrom` | date | DATE | Fecha desde |
| `dateTo` | date | DATE | Fecha hasta |
| `movementType` | select | VARCHAR(20) | Tipo de movimiento |
| `product` | select | UUID | ID del producto (FK) |
| `quantity` | number | INTEGER | Cantidad |
| `reason` | text | VARCHAR(200) | Motivo |
| `reference` | text | VARCHAR(100) | Referencia |
| `notes` | textarea | TEXT | Notas |

### **13. REPORTES (reportes.html)**
| Campo | Tipo HTML | Tipo BD Sugerido | Descripción |
|-------|-----------|------------------|-------------|
| `fechaInicio` | date | DATE | Fecha de inicio |
| `fechaFin` | date | DATE | Fecha de fin |
| `tipoReporte` | select | VARCHAR(20) | Tipo de reporte |

### **14. CONFIGURACIÓN (configuracion.html)**
| Campo | Tipo HTML | Tipo BD Sugerido | Descripción |
|-------|-----------|------------------|-------------|
| `companyName` | text | VARCHAR(200) | Nombre de la empresa |
| `companyNit` | text | VARCHAR(20) | NIT/RUC |
| `companyAddress` | textarea | TEXT | Dirección de la empresa |
| `companyPhone` | tel | VARCHAR(20) | Teléfono de la empresa |
| `companyEmail` | email | VARCHAR(100) | Email de la empresa |
| `companyWebsite` | url | VARCHAR(200) | Sitio web |
| `dianResolution` | text | VARCHAR(50) | Resolución DIAN |
| `rangeFrom` | number | INTEGER | Rango desde |
| `rangeTo` | number | INTEGER | Rango hasta |
| `defaultTax` | number | DECIMAL(5,2) | Impuesto por defecto |
| `currency` | select | VARCHAR(3) | Moneda por defecto |
| `timezone` | select | VARCHAR(50) | Zona horaria |

### **15. PERFIL (perfil.html)**
| Campo | Tipo HTML | Tipo BD Sugerido | Descripción |
|-------|-----------|------------------|-------------|
| `fullName` | text | VARCHAR(200) | Nombre completo |
| `username` | text | VARCHAR(50) | Nombre de usuario |
| `email` | email | VARCHAR(100) | Correo electrónico |
| `phone` | tel | VARCHAR(20) | Teléfono |
| `documentId` | text | VARCHAR(20) | Cédula/ID |
| `birthDate` | date | DATE | Fecha de nacimiento |
| `address` | textarea | TEXT | Dirección |
| `currentPassword` | password | VARCHAR(255) | Contraseña actual |
| `newPassword` | password | VARCHAR(255) | Nueva contraseña |
| `confirmPassword` | password | VARCHAR(255) | Confirmar contraseña |

### **16. VENTAS HISTORIAL (ventas-historial.html)**
| Campo | Tipo HTML | Tipo BD Sugerido | Descripción |
|-------|-----------|------------------|-------------|
| `searchTerm` | text | VARCHAR(200) | Término de búsqueda |
| `filterStatus` | select | VARCHAR(20) | Filtro por estado |
| `filterPayment` | select | VARCHAR(20) | Filtro por método de pago |
| `filterSeller` | select | UUID | Filtro por vendedor (FK) |
| `dateFrom` | date | DATE | Fecha desde |
| `dateTo` | date | DATE | Fecha hasta |

### **17. CAJA HISTORIAL (caja-historial.html)**
| Campo | Tipo HTML | Tipo BD Sugerido | Descripción |
|-------|-----------|------------------|-------------|
| `searchTerm` | text | VARCHAR(200) | Término de búsqueda |
| `filterType` | select | VARCHAR(20) | Filtro por tipo de operación |
| `filterCashier` | select | UUID | Filtro por cajero (FK) |
| `dateFrom` | date | DATE | Fecha desde |
| `dateTo` | date | DATE | Fecha hasta |

### **18. LOGIN (login.html)**
| Campo | Tipo HTML | Tipo BD Sugerido | Descripción |
|-------|-----------|------------------|-------------|
| `email` | email | VARCHAR(100) | Correo electrónico |
| `password` | password | VARCHAR(255) | Contraseña |
| `remember` | checkbox | BOOLEAN | Recordar sesión |

### **19. AYUDA (ayuda.html)**
| Campo | Tipo HTML | Tipo BD Sugerido | Descripción |
|-------|-----------|------------------|-------------|
| `helpSearch` | text | VARCHAR(200) | Búsqueda de ayuda |
| `helpCategory` | select | VARCHAR(50) | Categoría de ayuda |

---

## 📊 **RESUMEN DE TIPOS DE DATOS ENCONTRADOS**

### **Tipos de Datos HTML → PostgreSQL:**
- `text` → `VARCHAR(n)` o `TEXT`
- `textarea` → `TEXT`
- `email` → `VARCHAR(100)`
- `tel` → `VARCHAR(20)`
- `url` → `VARCHAR(200)`
- `number` → `INTEGER` o `DECIMAL(n,m)`
- `date` → `DATE`
- `datetime-local` → `TIMESTAMP`
- `password` → `VARCHAR(255)` (hash)
- `select` → `VARCHAR(n)` o `UUID` (FK)
- `checkbox` → `BOOLEAN`
- `color` → `VARCHAR(7)`

### **Campos Comunes en Múltiples Páginas:**
- **Identificación:** `idType`, `idNumber`
- **Nombres:** `fullName`, `firstName`, `lastName`
- **Contacto:** `email`, `phone`, `address`
- **Fechas:** `created_at`, `updated_at`, `birthDate`
- **Estados:** `status`, `active`
- **Observaciones:** `notes`, `observations`

---

## 🎯 **RECOMENDACIONES PARA EL MODELO DE BD**

1. **Usar UUIDs** para claves primarias
2. **Implementar timestamps** automáticos (`created_at`, `updated_at`)
3. **Usar ENUMs** para campos con opciones limitadas
4. **Implementar soft deletes** con campo `deleted_at`
5. **Usar índices** en campos de búsqueda frecuente
6. **Implementar auditoría** con campos `created_by`, `updated_by`
7. **Usar JSON** para campos flexibles como permisos
8. **Implementar RLS** (Row Level Security) para seguridad

---

*Análisis completado el: $(date)*
*Total de páginas analizadas: 20*
*Total de campos identificados: 200+*
