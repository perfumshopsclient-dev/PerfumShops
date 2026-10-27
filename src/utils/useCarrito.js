import { useCallback, useMemo, useSyncExternalStore } from "react";

export const MAX_UNIDADES = 5;

const CLAVE = "perfumshops_carrito";

const leer = () => {
  try {
    const datos = JSON.parse(localStorage.getItem(CLAVE));
    return Array.isArray(datos) ? datos : [];
  } catch {
    return [];
  }
};

// Store simple fuera de React: Header, Ordenar y Carrito ven siempre el mismo carrito
let items = leer();
const oyentes = new Set();

const guardar = (nuevos) => {
  items = nuevos;
  try {
    localStorage.setItem(CLAVE, JSON.stringify(items));
  } catch {
    /* almacenamiento lleno o bloqueado: el carrito sigue funcionando en memoria */
  }
  oyentes.forEach((avisar) => avisar());
};

const suscribir = (avisar) => {
  oyentes.add(avisar);
  const alCambiarOtraPestana = (e) => {
    if (e.key !== CLAVE) return;
    items = leer();
    avisar();
  };
  window.addEventListener("storage", alCambiarOtraPestana);
  return () => {
    oyentes.delete(avisar);
    window.removeEventListener("storage", alCambiarOtraPestana);
  };
};

const instantanea = () => items;

export function useCarrito() {
  const lista = useSyncExternalStore(suscribir, instantanea);

  const agregar = useCallback((perfume, cantidad = 1) => {
    const actual = items.find((i) => i.id === perfume.id);
    const linea = {
      id: perfume.id,
      nombre: perfume.nombre,
      imagen: perfume.imagen ?? null,
      ml: perfume.ml ?? null,
      precio_unitario: Number(perfume.precio_unitario),
      cantidad: Math.min(MAX_UNIDADES, (actual?.cantidad ?? 0) + cantidad),
    };
    guardar(actual ? items.map((i) => (i.id === perfume.id ? linea : i)) : [...items, linea]);
  }, []);

  const cambiarCantidad = useCallback((id, cantidad) => {
    if (cantidad < 1) return guardar(items.filter((i) => i.id !== id));
    guardar(items.map((i) => (i.id === id ? { ...i, cantidad: Math.min(MAX_UNIDADES, cantidad) } : i)));
  }, []);

  const quitar = useCallback((id) => guardar(items.filter((i) => i.id !== id)), []);
  const vaciar = useCallback(() => guardar([]), []);

  const total = useMemo(
    () => Math.round(lista.reduce((suma, i) => suma + i.precio_unitario * i.cantidad, 0) * 100) / 100,
    [lista]
  );
  const cantidadTotal = useMemo(() => lista.reduce((suma, i) => suma + i.cantidad, 0), [lista]);

  return { items: lista, agregar, cambiarCantidad, quitar, vaciar, total, cantidadTotal };
}
