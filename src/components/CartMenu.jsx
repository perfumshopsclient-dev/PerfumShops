import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useCarrito } from "../utils/useCarrito";
import { enviarPedido } from "../utils/enviarPedido";
import { fmt, pluralPerfumes } from "../data/esencias";

const IconCart = () => (
  <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M3 4h2l2.4 11h10.2L20 7H6.2" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="9" cy="19.5" r="1.3" /><circle cx="17" cy="19.5" r="1.3" />
  </svg>
);

export default function CartMenu() {
  const { items, cantidadTotal, total, vaciar } = useCarrito();
  const [open, setOpen] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState("");
  const ref = useRef(null);
  const totalMl = items.reduce((suma, item) => suma + (Number(item.ml) || 0) * item.cantidad, 0);

  const enviar = async () => {
    setEnviando(true);
    setError("");
    try {
      const pedido = await enviarPedido(items);
      window.location.assign(pedido.whatsapp_url);
      vaciar();
    } catch {
      setError("No pudimos enviar tu pedido. Inténtalo de nuevo.");
      setEnviando(false);
    }
  };

  useEffect(() => {
    if (!open) return;
    const fuera = (e) => !ref.current?.contains(e.target) && setOpen(false);
    const esc = (e) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", fuera);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("mousedown", fuera);
      document.removeEventListener("keydown", esc);
    };
  }, [open]);

  return (
    <div className="cart" ref={ref}>
      <button className="cart__btn" aria-label="Carrito" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
        <IconCart />
        {items.length > 0 && <b className="cart__badge">{cantidadTotal}</b>}
      </button>
      {open && (
        <div className="cart__panel">
          <h4>Tu pedido</h4>
          {items.length === 0 ? (
            <>
              <p className="cart__empty">Aún no has agregado esencias.</p>
              <Link className="btn btn--sm" to="/esencias" onClick={() => setOpen(false)}>Ver esencias</Link>
            </>
          ) : (
            <>
              <ul>
                {items.map((i) => (
                  <li key={i.id}><span>{i.nombre}</span><small>{i.cantidad} × {i.ml ? `${i.ml} ml` : "unidad"}</small></li>
                ))}
              </ul>
              <div className="cart__total">
                <span>{pluralPerfumes(cantidadTotal)} · {totalMl} ml</span><strong>{fmt(total)}</strong>
              </div>
              {error && <p role="alert">{error}</p>}
              <div className="cart__actions">
                <Link className="btn btn--sm btn--ghost" to="/carrito" onClick={() => setOpen(false)}>Ver detalles</Link>
                <button type="button" className="btn btn--sm" onClick={enviar} disabled={enviando}>{enviando ? "Enviando…" : "Enviar orden"}</button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
