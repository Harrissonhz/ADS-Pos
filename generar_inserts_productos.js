const fs = require('fs');

// Mapeo de categorías a UUIDs
const categoriasMap = {
    'Cursos Virtuales': 'a605faff-c4ea-4a0c-bb5f-84da12d34071',
    'Hombres': '951340fd-eada-41df-a75a-1caa45537bf1',
    'Mujeres': '9c86b724-b670-45d9-a4fd-fd39564cd1a6',
    'Niños': '88284f1b-2f62-4029-9491-6a5d0b829150',
    'Bebes': 'e2b650b8-6e12-40af-9516-31e3cd19d721',
    'Bebés': 'e2b650b8-6e12-40af-9516-31e3cd19d721', // Variante con tilde
    'Mascotas': 'ea13dd8b-0cdb-4cdf-bc9f-d613758c447e',
    'Deportes': '25134aed-80df-4961-a689-a37486f3e8d0',
    'THC y Más': '639be11e-3cb5-4f88-9e66-01e7e9c14d79',
    'Vehículos': '7f104ed3-dfb1-40ae-a258-482315dd336b',
    'Gadgets y Tecnología': 'bbc0474f-e300-4fae-8e58-7ed38f32c1dc',
    'Hogar': '80cf7a37-14d8-4348-8cae-95b1b110a742'
};

// Categorías válidas en la BD (sin "Todos Los Productos" ni otras que no existan)
const categoriasValidas = Object.keys(categoriasMap);

// Función para escapar comillas simples en SQL
function escapeSQL(str) {
    if (!str) return '';
    return String(str).replace(/'/g, "''");
}

// Función para encontrar la primera categoría válida
function encontrarCategoriaId(categoriasArray) {
    if (!categoriasArray || !Array.isArray(categoriasArray)) return null;
    
    for (const cat of categoriasArray) {
        if (categoriasValidas.includes(cat) && categoriasMap[cat]) {
            return categoriasMap[cat];
        }
    }
    return null;
}

// Función para extraer codigo_interno (antes del guion)
function extraerCodigoInterno(id) {
    if (!id) return null;
    const partes = String(id).split('-');
    return partes[0] || null;
}

// Función para calcular descuento_max desde precio y descuento
function calcularDescuentoMax(precio, descuento) {
    if (!precio || !descuento || precio <= 0) return 0.00;
    return ((descuento / precio) * 100).toFixed(2);
}

// Leer el archivo JSON
console.log('Leyendo productos.json...');
const jsonData = JSON.parse(fs.readFileSync('productos.json', 'utf8'));

// Limitar a productos hasta la línea 3994 (111 productos)
// Contar productos hasta encontrar el cierre del producto en línea 3994
const productosLimitados = jsonData.slice(0, 111);

console.log(`Procesando ${productosLimitados.length} productos (hasta línea 3994 del JSON)...`);

// Generar los INSERT statements
let sqlContent = `-- ================================================
-- INSERT DE PRODUCTOS DESDE productos.json
-- Generado automáticamente
-- Total de productos: ${productosLimitados.length} (hasta línea 3994 del JSON)
-- ================================================

`;

productosLimitados.forEach((producto, index) => {
    const codigoInterno = extraerCodigoInterno(producto.id);
    const nombre = escapeSQL(producto.nombre || '');
    const descripcion = escapeSQL(producto.descripcion || '');
    const imagenUrl = producto.imagenes && producto.imagenes.length > 0 
        ? escapeSQL(producto.imagenes[0]) 
        : null;
    const precioVenta = producto.precio ? Number(producto.precio) : 0;
    const categoriaId = encontrarCategoriaId(producto.categorias);
    const agotado = producto.agotado === true;
    const stockActual = agotado ? 0 : 5;
    const activo = !agotado;
    const descuentoMax = producto.descuento 
        ? calcularDescuentoMax(producto.precio, producto.descuento)
        : 0.00;

    sqlContent += `INSERT INTO productos (
    nombre,
    codigo_interno,
    descripcion,
    imagen_url,
    precio_venta,
    categoria_id,
    stock_actual,
    activo,
    descuento_max,
    tasa_impuesto,
    stock_min,
    stock_max,
    precio_compra,
    precio_mayorista,
    codigo_barras,
    marca,
    modelo,
    margen_ganancia,
    peso,
    dimensiones,
    created_at,
    updated_at,
    created_by,
    updated_by,
    deleted_at
) VALUES (
    '${nombre}',
    '${codigoInterno || ''}',
    '${descripcion}',
    ${imagenUrl ? `'${imagenUrl}'` : 'NULL'},
    ${precioVenta.toFixed(2)},
    ${categoriaId ? `'${categoriaId}'` : 'NULL'},
    ${stockActual},
    ${activo},
    ${descuentoMax},
    0.00,
    2,
    0,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NOW(),
    NOW(),
    NULL,
    NULL,
    NULL
);

`;
});

// Escribir el archivo SQL
const outputFile = 'insert_productos.sql';
fs.writeFileSync(outputFile, sqlContent, 'utf8');

console.log(`✅ Archivo SQL generado: ${outputFile}`);
console.log(`📊 Total de INSERT statements: ${productosLimitados.length}`);

// Contar productos sin categoría
const sinCategoria = productosLimitados.filter(p => !encontrarCategoriaId(p.categorias)).length;
if (sinCategoria > 0) {
    console.log(`⚠️  Advertencia: ${sinCategoria} productos no tienen categoría válida asignada`);
}

