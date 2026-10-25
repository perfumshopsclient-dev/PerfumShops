import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Header } from "../components/Header";
import { useCarrito, MAX_UNIDADES } from "../utils/useCarrito";
import { getPerfumeById } from "../utils/perfumesInformation";
import "../styles/tienda.css";

const GENEROS = { M: "Masculino", F: "Femenino", U: "Unisex" };
const BASE_IMAGENES = "/";
const imagenSrc = (img) => (/^(https?:|data:|\/)/.test(img) ? img : `${BASE_IMAGENES}${img}`);
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
const fmt = (n) => `$${Number(n).toFixed(2)}`;
const plural = (n) => `${n} ${n === 1 ? "perfume" : "perfumes"}`;

const Pagina = ({ children }) => (
  <>
    <Header scrolled />
    <main className="tienda ord">{children}</main>
  </>
);

export default function Ordenar() {
  const { id } = useParams();
  const { items, agregar } = useCarrito();

  const [perfume, setPerfume] = useState(null);
  const [estado, setEstado] = useState("cargando"); // "cargando" | "ok" | "error"
  const [cantidad, setCantidad] = useState(1);
  const [agregado, setAgregado] = useState(0);

  useEffect(() => {
    let vigente = true; // evita actualizar el estado si cambias de perfume o sales de la página
    setEstado("cargando");
    setCantidad(1);
    setAgregado(0);

    getPerfumeById(id)
      .then((data) => {
        if (!vigente) return;
        setPerfume(data || null);
        setEstado(data ? "ok" : "error");
      })
      .catch((err) => {
        console.error("Error al cargar el perfume:", err);
        if (vigente) setEstado("error");
      });

    return () => {
      vigente = false;
    };
  }, [id]);

  if (estado === "cargando") {
    return (
      <Pagina>
        <p style={{ textAlign: "center", padding: "5rem" }}>Cargando esencia…</p>
      </Pagina>
    );
  }

  if (estado === "error") {
    return (
      <Pagina>
        <div style={{ textAlign: "center", padding: "5rem" }}>
          <h2>No pudimos cargar la esencia</h2>
          <p>Ocurrió un error de conexión o la esencia ya no está disponible.</p>
          <Link to="/esencias" className="btn btn--sm" style={{ marginTop: "1rem" }}>
            ← Volver a esencias
          </Link>
        </div>
      </Pagina>
    );
  }

  // --- Disponibilidad: stock del perfume, tope por pedido y lo que ya hay en el carrito ---
  const stock = perfume.cantidad; // si el endpoint no lo envía, no se limita por stock
  const agotado = stock === 0;
  const tope = Math.min(MAX_UNIDADES, stock ?? MAX_UNIDADES);
  const enCarrito = items.find((i) => i.id === perfume.id)?.cantidad ?? 0;
  const disponibles = Math.max(0, tope - enCarrito);
  const puedeAgregar = !agotado && disponibles > 0;
  const cantidadOk = Math.min(cantidad, Math.max(1, disponibles));
  const precio = Number(perfume.precio_unitario);

  const enviar = (ev) => {
    ev.preventDefault();
    if (!puedeAgregar) return;
    agregar(perfume, cantidadOk);
    setAgregado(cantidadOk);
    setCantidad(1);
  };

  const detalles = [GENEROS[perfume.genre] ?? perfume.genre, ...(perfume.acordes ?? []).map(cap)].filter(Boolean);

  return (
    <Pagina>
      <Link to="/esencias" className="ord__volver">← Volver a esencias</Link>

      <div className="ord__grid">
        <div className="ord__vista">
          {perfume.imagen && <img src={imagenSrc(perfume.imagen)} alt={`Frasco de ${perfume.nombre}`} />}
        </div>

        <form className="ord__form" onSubmit={enviar}>
          <h1>{perfume.nombre}</h1>
          <p className="tienda__sub">{detalles.join(" · ")}</p>

          {agotado && <p className="tienda__sub" role="status">Agotado por el momento.</p>}
          {!agotado && stock != null && stock <= 5 && (
            <p className="tienda__sub" role="status">
              {stock === 1 ? "Queda 1 unidad." : `Quedan ${stock} unidades.`}
            </p>
          )}

          <fieldset disabled={!puedeAgregar}>
            <legend>Cuántos perfumes llevas</legend>
            <div className="stepper">
              <button type="button" onClick={() => setCantidad((c) => Math.max(1, c - 1))} aria-label="Quitar uno" disabled={cantidadOk <= 1}>−</button>
              <output aria-live="polite">{cantidadOk}</output>
              <button
                type="button"
                onClick={() => setCantidad((c) => Math.min(Math.max(1, disponibles), c + 1))}
                aria-label="Agregar uno"
                disabled={cantidadOk >= disponibles}
              >
                +
              </button>
            </div>
            <small>Máximo {MAX_UNIDADES} por pedido.</small>
          </fieldset>

          <div className="ord__total">
            <span>{fmt(precio)} c/u</span>
            <strong>{fmt(precio * cantidadOk)}</strong>
          </div>

          <button type="submit" className="btn btn--sm" disabled={!puedeAgregar}>
            {agotado ? "Agotado" : disponibles === 0 ? "Máximo en tu carrito" : "Agregar al carrito"}
          </button>

          {agregado > 0 && (
            <div className="ord__ok" role="status">
              <p>Agregaste {plural(agregado)} de {perfume.nombre}.</p>
              <div>
                <Link to="/carrito" className="btn btn--sm">Ver carrito</Link>
                <Link to="/esencias" className="btn btn--sm btn--ghost">Seguir viendo esencias</Link>
              </div>
            </div>
          )}
        </form>
      </div>
    </Pagina>
  );
}
