import { api } from "../utils/api";
/*
  Mientras no exista el backend se trabaja contra un mock en memoria.
  Para usar el backend real, en .env:  VITE_USE_MOCK=false
  (y opcionalmente VITE_API_URL=https://tu-api.com)
*/
const USE_MOCK = import.meta.env.VITE_USE_MOCK !== "false";

export const mensajeError = (e) =>
  e?.response?.data?.message ?? e?.message ?? "Ocurrió un error inesperado.";

/* ------------------------------------------------------------------ */
/* Mock                                                                 */
/* ------------------------------------------------------------------ */
const esperar = (ms = 350) => new Promise((r) => setTimeout(r, ms));

let MOCK = [
  ["Esencia Aurora", "F", 45, 100, ["floral", "vainilla", "almizcle"], 10, 45],
  ["Esencia Nocturno", "M", 52, 100, ["amaderado", "cuero", "pimienta"], 8, 32],
  ["Esencia Ámbar", "U", 48, 100, ["ámbar", "resinas", "canela"], 12, 18],
  ["Esencia Lavanda Real", "F", 40, 50, ["lavanda", "iris", "pachulí"], 15, 8],
  ["Esencia Brisa", "U", 38, 50, ["cítrico", "sal marina", "menta"], 10, 28],
  ["Esencia Medianoche", "M", 55, 100, ["oud", "tabaco", "incienso"], 5, 42],
  ["Esencia Pétalo", "F", 42, 100, ["rosa", "peonía", "lichi"], 8, 15],
  ["Esencia Sol", "U", 36, 50, ["bergamota", "neroli", "coco"], 12, 22],
].map(([nombre, genre, precio_unitario, ml, acordes, stock_minimo, cantidad]) => ({
  id: crypto.randomUUID(),
  nombre,
  imagen: "",
  precio_unitario,
  ml,
  acordes,
  genre,
  stock_minimo,
  cantidad,
  descripcion: "",
}));

/* ------------------------------------------------------------------ */
/* Helpers                                                              */
/* ------------------------------------------------------------------ */
// Siempre multipart: sirve igual con o sin archivo de imagen.
// acordes (text[]) viaja como JSON string; el backend lo parsea.
const aFormData = (datos, archivo) => {
  const fd = new FormData();
  Object.entries(datos).forEach(([k, v]) => {
    if (v === undefined || v === null) return;
    fd.append(k, k === "acordes" ? JSON.stringify(v) : v);
  });
  if (archivo) fd.append("imagen_archivo", archivo);
  return fd;
};

export async function listarPerfumes() {
  if (USE_MOCK) {
    await esperar();
    return [...MOCK];
  }
  const { data } = await api.get("/perfumes");
  return data;
}

export async function crearPerfume(datos, archivo) {
  if (USE_MOCK) {
    await esperar();
    const nuevo = {
      ...datos,
      id: crypto.randomUUID(),
      imagen: archivo ? URL.createObjectURL(archivo) : datos.imagen,
    };
    MOCK = [nuevo, ...MOCK];
    return nuevo;
  }
  const { data } = await api.post("/perfumes", aFormData(datos, archivo));
  return data;
}

export async function actualizarPerfume(id, datos, archivo) {
  if (USE_MOCK) {
    await esperar();
    const actual = MOCK.find((p) => p.id === id);
    if (!actual) throw new Error("El perfume ya no existe.");
    const act = {
      ...actual,
      ...datos,
      id, // el id nunca cambia
      imagen: archivo ? URL.createObjectURL(archivo) : datos.imagen,
    };
    MOCK = MOCK.map((p) => (p.id === id ? act : p));
    return act;
  }
  const { data } = await api.put(`/perfumes/${id}`, aFormData(datos, archivo));
  return data;
}

export async function eliminarPerfume(id) {
  if (USE_MOCK) {
    await esperar();
    MOCK = MOCK.filter((p) => p.id !== id);
    return;
  }
  await api.delete(`/perfumes/${id}`);
}

export async function listarAcordes() {
  if (USE_MOCK) {
    await esperar(150);
    return [...new Set(MOCK.flatMap((p) => p.acordes))].sort();
  }
  const { data } = await api.get("/acordes");
  return data;
}
