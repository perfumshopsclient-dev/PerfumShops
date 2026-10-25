import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "./AuthContext";
import { WHATSAPP } from "../assets/VARIABLES";
import { CarritoCtx } from "./carritoStore";
import { fmt, pluralPerfumes } from "../data/esencias";

function leer(clave) {
  try {
    const data = JSON.parse(localStorage.getItem(clave));
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

// Agrupa las líneas del carrito por esencia (para el resumen y la página de detalles)
function agruparPorEsencia(items) {
  const mapa = new Map();
  for (const it of items) {
    if (!mapa.has(it.esenciaId)) {
      mapa.set(it.esenciaId, { esenciaId: it.esenciaId, nombre: it.nombre, lineas: [], perfumes: 0, ml: 0, subtotal: 0 });
    }
    const g = mapa.get(it.esenciaId);
    g.lineas.push(it);
    g.perfumes += it.cantidad;
    g.ml += it.ml * it.cantidad;
    g.subtotal += it.precioUnit * it.cantidad;
  }
  return [...mapa.values()];
}

// Función para esencias detalladas, no para perfumes fabricados
/* function construirMensaje(grupos, totales, usuario) {
  const cliente = [usuario?.nombre, usuario?.apellido].filter(Boolean).join(" ");
  const lineas = ["Hola PerfumShops, quiero hacer este pedido:", ""];
  for (const g of grupos) {
    lineas.push(`*${g.nombre}*`);
    for (const l of g.lineas) {
      lineas.push(`• ${l.cantidad} × ${l.ml} ml, frasco ${l.frascoNombre} — ${fmt(l.precioUnit * l.cantidad)}`);
    }
    lineas.push("");
  }
  lineas.push(`Total: ${pluralPerfumes(totales.perfumes)} · ${totales.ml} ml · ${fmt(totales.precio)}`);
  if (cliente || usuario?.email) {
    lineas.push("", `Cliente: ${[cliente, usuario?.email].filter(Boolean).join(" · ")}`);
  }
  return lineas.join("\n");
} */

function construirMensaje(grupos, totales, usuario) {
  const cliente = [usuario?.nombre, usuario?.apellido].filter(Boolean).join(" ");
  const lineas = ["Hola, quiero hacer este pedido:", ""];
  for (const g of grupos) {
    lineas.push(`*${g.nombre}*`);
    for (const l of g.lineas) {
      lineas.push(`• ${l.cantidad} × ${l.ml} ml`);
    }
    lineas.push("");
  }
  lineas.push(`Total: ${pluralPerfumes(totales.perfumes)} · ${totales.ml} ml.`);
  if (cliente || usuario?.email) {
    lineas.push("", `Cliente: ${[cliente].filter(Boolean).join(" · ")}`);
  }
  return lineas.join("\n");
}

function Interno({ clave, children }) {
  const { usuario } = useAuth();
  const [items, setItems] = useState(() => leer(clave));

  useEffect(() => {
    try {
      localStorage.setItem(clave, JSON.stringify(items));
    } catch {
      /* almacenamiento lleno o bloqueado: el carrito sigue funcionando en memoria */
    }
  }, [clave, items]);

  const agregar = useCallback(({ esencia, ml, frasco, cantidad, precioUnit }) => {
    const id = `${esencia.id}-${ml}-${frasco.id}`;
    setItems((prev) => {
      const existente = prev.find((i) => i.id === id);
      if (existente) {
        return prev.map((i) => (i.id === id ? { ...i, cantidad: Math.min(99, i.cantidad + cantidad) } : i));
      }
      return [
        ...prev,
        { id, esenciaId: esencia.id, nombre: esencia.nombre, ml, frascoId: frasco.id, frascoNombre: frasco.nombre, cantidad, precioUnit },
      ];
    });
  }, []);

  const cambiarCantidad = useCallback((id, cantidad) => {
    const n = Math.max(1, Math.min(99, cantidad));
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, cantidad: n } : i)));
  }, []);

  const quitar = useCallback((id) => setItems((prev) => prev.filter((i) => i.id !== id)), []);
  const vaciar = useCallback(() => setItems([]), []);

  const grupos = useMemo(() => agruparPorEsencia(items), [items]);
  const totales = useMemo(
    () => ({
      perfumes: items.reduce((s, i) => s + i.cantidad, 0),
      ml: items.reduce((s, i) => s + i.ml * i.cantidad, 0),
      precio: items.reduce((s, i) => s + i.precioUnit * i.cantidad, 0),
    }),
    [items]
  );

  const enviarOrden = useCallback(() => {
    if (!items.length) return;
    const texto = construirMensaje(grupos, totales, usuario);
    window.open(`https://wa.me/${WHATSAPP}?text=${encodeURIComponent(texto)}`, "_blank", "noopener");
  }, [items.length, grupos, totales, usuario]);

  const valor = {
    items,
    grupos,
    totalPerfumes: totales.perfumes,
    totalMl: totales.ml,
    total: totales.precio,
    agregar,
    cambiarCantidad,
    quitar,
    vaciar,
    enviarOrden,
  };

  return <CarritoCtx.Provider value={valor}>{children}</CarritoCtx.Provider>;
}

// Un carrito por usuario: al cambiar de sesión se remonta y carga el suyo.
export function CarritoProvider({ children }) {
  const { usuario } = useAuth();
  const clave = `perfumshops_carrito_${usuario?.id ?? usuario?.email ?? "invitado"}`;
  return (
    <Interno key={clave} clave={clave}>
      {children}
    </Interno>
  );
}
