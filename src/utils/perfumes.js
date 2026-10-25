// Enum de la BD → etiqueta visible
export const GENEROS = { M: "Caballero", F: "Dama", U: "Unisex" };

// precio_unitario se guarda como entero en USD
export const fmtUSD = (n) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);

// Misma regla que usa el Resumen para marcar "Bajo"
export const stockBajo = (p) => p.cantidad <= p.stock_minimo;

export const MOMENTOS = ['día', 'noche', 'día y noche'];
export const CLIMAS = ['cálido', 'fresco', 'frío intenso', 'húmedo', 'seco', 'calor extremo', 'versátil'];
