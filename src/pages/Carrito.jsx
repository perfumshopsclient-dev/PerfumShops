import { useState } from "react";
import { Link } from "react-router-dom";
import { Header } from "../components/Header";
import { MAX_UNIDADES, useCarrito } from "../utils/useCarrito";
import { fmt, pluralPerfumes } from "../data/esencias";
import { crearPedido } from "../utils/pedidosInformation";
import "../styles/tienda.css";

export default function Carrito() {
  const { items, vaciar, total, cantidadTotal, cambiarCantidad, quitar } = useCarrito();
  
  
  const totalMl = items.reduce((suma, item) => suma + (Number(item.ml) || 0) * item.cantidad, 0);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState("");
  const [pedido, setPedido] = useState(null);

  const confirmar = async () => {
    setEnviando(true);
    setError("");
    try {
      const data = await crearPedido(items.map(({ id, cantidad }) => ({ id_perfume: id, cantidad })));
      setPedido(data);
      vaciar();
    } catch (e) {
      // 401: no hay sesión → llévalo al login; 409/429/400: el mensaje ya viene redactado
      setError(e.response?.data?.message ?? "No pudimos crear tu pedido");
    } finally {
      setEnviando(false);
    }
  };

  if (pedido) {
    const limite = new Date(pedido.expira_en).toLocaleTimeString("es-VE", { hour: "numeric", minute: "2-digit" });
    return (
      <>
        <Header scrolled />
        <main className="tienda">
          <h1>Pedido {pedido.codigo} reservado</h1>
          <p className="tienda__sub">
            Envía el mensaje por WhatsApp para pagar tu pedido antes de las {limite}; pasada esa hora la reserva se libera.
          </p>
          <p>Total: {fmt(pedido.total)}</p>
          <a href={pedido.whatsapp_url} target="_blank" rel="noreferrer" className="btn btn--sm">
            Abrir WhatsApp
          </a>
          <Link to="/esencias" className="btn btn--sm btn--ghost">Seguir viendo esencias</Link>
        </main>
      </>
    );
  }

  return (
    <>
      <Header scrolled />
      <main className="tienda">
        <h1>Carrito</h1>

        {items.length === 0 ? (
          <div className="ess__vacio">
            <p>Tu carrito está vacío. Elige una esencia para empezar tu pedido.</p>
            <Link to="/esencias" className="btn btn--sm">Ver esencias</Link>
          </div>
        ) : (
          <>
            <p className="tienda__sub">Perfumes y cantidades de tu pedido.</p>
            <div className="car__body">
              <div className="car__grupos">
                <section className="car-grupo">
                    <header>
                      <h2>Perfumes</h2>
                      <span>
                        {pluralPerfumes(cantidadTotal)} · {totalMl} ml · {fmt(total)}
                      </span>
                    </header>
                    <ul>
                      {items.map((item) => (
                        <li key={item.id}>
                          <div>
                            {item.ml && <strong>{item.ml} ml</strong>} {item.nombre}
                            <small>{fmt(item.precio_unitario)} c/u</small>
                          </div>
                          <div className="stepper">
                            <button type="button" onClick={() => cambiarCantidad(item.id, item.cantidad - 1)} disabled={item.cantidad <= 1} aria-label={`Quitar uno de ${item.nombre}`}>−</button>
                            <output>{item.cantidad}</output>
                            <button type="button" onClick={() => cambiarCantidad(item.id, item.cantidad + 1)} disabled={item.cantidad >= MAX_UNIDADES} aria-label={`Agregar uno de ${item.nombre}`}>+</button>
                          </div>
                          <strong className="car-grupo__precio">{fmt(item.precio_unitario * item.cantidad)}</strong>
                          <button type="button" className="car-grupo__quitar" onClick={() => quitar(item.id)}>
                            Quitar
                          </button>
                        </li>
                      ))}
                    </ul>
                  </section>
              </div>

              <aside className="car__resumen">
                <h2>Resumen</h2>
                <dl>
                  <div><dt>Perfumes</dt><dd>{cantidadTotal}</dd></div>
                  <div><dt>Mililitros</dt><dd>{totalMl} ml</dd></div>
                  <div className="car__total"><dt>Total</dt><dd>{fmt(total)}</dd></div>
                </dl>
                {error && <p role="alert">{error}</p>}
                <button type="button" className="btn btn--sm" onClick={confirmar} disabled={enviando}>{enviando ? "Enviando…" : "Enviar orden por WhatsApp"}</button>
                <Link to="/esencias" className="btn btn--sm btn--ghost">Seguir viendo esencias</Link>
                <button type="button" className="ess__limpiar" onClick={vaciar}>Vaciar carrito</button>
              </aside>
            </div>
          </>
        )}
      </main>
    </>
  );
}
