// Catálogo temporal (sin backend). Los ids 1-8 coinciden con los de Index.jsx,
// así los enlaces /esencias?esencia=ID de la portada resaltan la tarjeta correcta.

// Código de país + número, sin "+" ni espacios. Ej: Venezuela -> 58412XXXXXXX
export const WHATSAPP_NUMERO = "584247587652";

const IMG_POR_GENERO = {
  Dama: "/img/frasco-mujer.png",
  Caballero: "/img/frasco-hombre.png",
  Unisex: "/img/frasco-unisex.png",
};

export const GENEROS = ["Dama", "Caballero", "Unisex"];

// masVendida -> sección "Las más vendidas" (?filtro=mas-vendidas)
// clima      -> sección "Ideales para hoy"  (?filtro=clima)
const BASE = [
  { id: 1, nombre: "Esencia Aurora", genero: "Dama", acordes: ["Floral", "Vainilla"], lanzamiento: "2025-03-14", precioMl: 500, ventas: 320, masVendida: true, clima: false },
  { id: 2, nombre: "Esencia Nocturno", genero: "Caballero", acordes: ["Amaderado", "Cuero"], lanzamiento: "2024-11-02", precioMl: 500, ventas: 290, masVendida: true, clima: false },
  { id: 3, nombre: "Esencia Ámbar", genero: "Unisex", acordes: ["Ámbar", "Cítrico"], lanzamiento: "2025-06-20", precioMl: 500, ventas: 260, masVendida: true, clima: false },
  { id: 4, nombre: "Esencia Lavanda Real", genero: "Dama", acordes: ["Lavanda", "Almizcle"], lanzamiento: "2024-08-09", precioMl: 500, ventas: 240, masVendida: true, clima: false },
  { id: 5, nombre: "Esencia Brisa", genero: "Unisex", acordes: ["Cítrico", "Marino"], lanzamiento: "2026-07-01", precioMl: 500, ventas: 120, masVendida: false, clima: true },
  { id: 6, nombre: "Esencia Medianoche", genero: "Caballero", acordes: ["Especiado", "Oud"], lanzamiento: "2026-02-18", precioMl: 500, ventas: 150, masVendida: false, clima: true },
  { id: 7, nombre: "Esencia Pétalo", genero: "Dama", acordes: ["Floral", "Frutal"], lanzamiento: "2026-09-05", precioMl: 500, ventas: 90, masVendida: false, clima: true },
  { id: 8, nombre: "Esencia Sol", genero: "Unisex", acordes: ["Tropical", "Coco"], lanzamiento: "2026-05-12", precioMl: 500, ventas: 140, masVendida: false, clima: true },
  { id: 9, nombre: "Esencia Rocío", genero: "Dama", acordes: ["Floral", "Cítrico"], lanzamiento: "2025-09-30", precioMl: 500, ventas: 110, masVendida: false, clima: false },
  { id: 10, nombre: "Esencia Bosque", genero: "Caballero", acordes: ["Amaderado", "Almizcle"], lanzamiento: "2025-01-22", precioMl: 450, ventas: 130, masVendida: false, clima: false },
  { id: 11, nombre: "Esencia Cuarzo", genero: "Unisex", acordes: ["Almizcle", "Ámbar"], lanzamiento: "2026-04-03", precioMl: 500, ventas: 80, masVendida: false, clima: false },
  { id: 12, nombre: "Esencia Magnolia", genero: "Dama", acordes: ["Floral", "Almizcle"], lanzamiento: "2024-05-17", precioMl: 500, ventas: 100, masVendida: false, clima: false },
  { id: 13, nombre: "Esencia Tormenta", genero: "Caballero", acordes: ["Marino", "Especiado"], lanzamiento: "2026-08-14", precioMl: 500, ventas: 70, masVendida: false, clima: false },
  { id: 14, nombre: "Esencia Canela", genero: "Unisex", acordes: ["Especiado", "Vainilla"], lanzamiento: "2025-11-11", precioMl: 500, ventas: 95, masVendida: false, clima: false },
  { id: 15, nombre: "Esencia Cereza Negra", genero: "Dama", acordes: ["Frutal", "Vainilla"], lanzamiento: "2026-03-27", precioMl: 500, ventas: 85, masVendida: false, clima: false },
  { id: 16, nombre: "Esencia Vetiver", genero: "Caballero", acordes: ["Amaderado", "Cítrico"], lanzamiento: "2024-10-08", precioMl: 500, ventas: 105, masVendida: false, clima: false },
];

export const ESENCIAS = BASE.map((e) => ({ ...e, img: IMG_POR_GENERO[e.genero] }));

export const ACORDES = [...new Set(ESENCIAS.flatMap((e) => e.acordes))].sort((a, b) => a.localeCompare(b, "es"));
export const ANIOS = [...new Set(ESENCIAS.map((e) => e.lanzamiento.slice(0, 4)))].sort().reverse();

// Filtros que llegan desde la portada: /esencias?filtro=<clave>
export const FILTROS_INDEX = {
  "mas-vendidas": {
    titulo: "Las más vendidas",
    test: (e) => e.masVendida,
    orden: (a, b) => b.ventas - a.ventas,
  },
  clima: {
    titulo: "Ideales para hoy",
    test: (e) => e.clima,
    orden: (a, b) => b.lanzamiento.localeCompare(a.lanzamiento),
  },
};

// El frasco depende de los ml: cada frasco solo está disponible en ciertas medidas.
export const MLS = [30, 50, 100];
export const FRASCOS = [
  { id: "pastilla", nombre: "Pastilla", detalle: "Plano, cabe en el bolsillo", ml: [30, 50], precio: 4 },
  { id: "cilindro", nombre: "Cilindro", detalle: "Clásico, con tapa metálica", ml: [50, 100], precio: 5 },
  { id: "cristal", nombre: "Cristal", detalle: "Vidrio grueso, ideal para regalo", ml: [30, 100], precio: 7 },
];

export const frascosPara = (ml) => FRASCOS.filter((f) => f.ml.includes(ml));

export const precioItem = (esencia, ml) => esencia.precioMl * ml;

export const precioDesde = (esencia) =>
  Math.min(...MLS.flatMap((ml) => frascosPara(ml).map((f) => precioItem(esencia, ml))));

export const fmt = (n) => `${n.toFixed(2)}$`;
export const pluralPerfumes = (n) => `${n} ${n === 1 ? "perfume" : "perfumes"}`;
