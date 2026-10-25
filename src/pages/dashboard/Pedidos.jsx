import { useCallback, useEffect, useState } from 'react';
import { Check, X, Eye } from 'lucide-react';
import { getPedidos, aceptarPedido, rechazarPedido } from '../../utils/pedidosInformation'; // <- ajusta los ../ a tu carpeta
import './Pedidos.css';

// Para añadir más filtros más adelante, descomenta (el backend ya los soporta)
const FILTROS = [
  { id: 'pendiente', label: 'Pendientes' },
  { id: 'todos', label: 'Todos' },
  // { id: 'finalizado', label: 'Finalizados' },
  // { id: 'rechazado', label: 'Rechazados' },
  // { id: 'expirado', label: 'Expirados' },
];

const ETIQUETA = { pendiente: 'Pendiente', finalizado: 'Finalizado', rechazado: 'Rechazado', expirado: 'Expirado' };

const fmtFecha = (iso) =>
  new Date(iso).toLocaleString('es-VE', { day: '2-digit', month: 'short', hour: 'numeric', minute: '2-digit' });
const usd = (n) => `$${Number(n).toFixed(2)}`;
const nombrePedido = (p) => `${p.cliente.nombre} ${p.cliente.apellido} · ${fmtFecha(p.fecha)}`;

function restante(expiraEn, ahora) {
  const min = Math.ceil((new Date(expiraEn) - ahora) / 60000);
  return min > 0 ? `Expira en ${min} min` : 'Vencido';
}

function useAhora(ms = 30000) {
  const [ahora, setAhora] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setAhora(new Date()), ms);
    return () => clearInterval(id);
  }, [ms]);
  return ahora;
}

export default function Pedidos() {
  const [filtro, setFiltro] = useState('pendiente');
  const [pedidos, setPedidos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [detalle, setDetalle] = useState(null);
  const [procesando, setProcesando] = useState(null);
  const ahora = useAhora();

  const cargar = useCallback(async () => {
    setCargando(true);
    setError('');
    try {
      setPedidos(await getPedidos(filtro));
    } catch (e) {
      setError(e.response?.data?.message ?? 'No se pudieron cargar los pedidos');
    } finally {
      setCargando(false);
    }
  }, [filtro]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  useEffect(() => {
    if (!detalle) return;
    const onKey = (e) => e.key === 'Escape' && setDetalle(null);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [detalle]);

  const resolver = async (pedido, accion) => {
    const pregunta =
      accion === 'aceptar'
        ? `¿Confirmar el pago del pedido de ${pedido.cliente.nombre}?`
        : `¿Rechazar el pedido de ${pedido.cliente.nombre}? El stock volverá al catálogo.`;
    if (!window.confirm(pregunta)) return;

    setProcesando(pedido.id);
    setError('');
    try {
      await (accion === 'aceptar' ? aceptarPedido : rechazarPedido)(pedido.id);
      setDetalle(null);
    } catch (e) {
      setError(e.response?.data?.message ?? 'No se pudo actualizar el pedido');
    } finally {
      setProcesando(null);
      cargar();
    }
  };

  const Acciones = ({ p }) => {
    const bloqueado = p.estado !== 'pendiente' || procesando === p.id;
    return (
      <>
        <button className="ped-icon ped-icon--ok" disabled={bloqueado} onClick={() => resolver(p, 'aceptar')} aria-label="Aceptar pedido" title="Aceptar">
          <Check size={18} />
        </button>
        <button className="ped-icon ped-icon--no" disabled={bloqueado} onClick={() => resolver(p, 'rechazar')} aria-label="Rechazar pedido" title="Rechazar">
          <X size={18} />
        </button>
      </>
    );
  };

  return (
    <section className="ped">
      <header className="ped-header">
        <h1>Pedidos</h1>
        <p>Revisa los pedidos, confirma los pagos o rechaza los sospechosos.</p>
      </header>

      <div className="ped-panel">
        <div className="ped-panel-head">
          <div>
            <h2>Pedidos</h2>
            <span className="ped-count">{cargando ? 'Cargando…' : `${pedidos.length} ${pedidos.length === 1 ? 'pedido' : 'pedidos'}`}</span>
          </div>
          <div className="ped-filtro" role="tablist" aria-label="Filtrar pedidos">
            {FILTROS.map((f) => (
              <button key={f.id} role="tab" aria-selected={filtro === f.id} className={filtro === f.id ? 'is-active' : ''} onClick={() => setFiltro(f.id)}>
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {error && <p className="ped-error" role="alert">{error}</p>}

        {!cargando && !error && pedidos.length === 0 && (
          <p className="ped-vacio">{filtro === 'pendiente' ? 'No hay pedidos pendientes por revisar.' : 'Todavía no hay pedidos.'}</p>
        )}

        <div className="ped-grid">
          {pedidos.map((p) => (
            <article key={p.id} className="ped-tarjeta">
              <div className="ped-tarjeta-top">
                <span className={`ped-estado ped-estado--${p.estado}`}>{ETIQUETA[p.estado]}</span>
                {p.estado === 'pendiente' && <span className="ped-tiempo">{restante(p.expira_en, ahora)}</span>}
              </div>
              <h3>{nombrePedido(p)}</h3>
              <p className="ped-total">{usd(p.total)}</p>
              <div className="ped-acciones">
                <Acciones p={p} />
                <button className="ped-icon" onClick={() => setDetalle(p)} aria-label="Ver detalles" title="Detalles">
                  <Eye size={18} />
                </button>
              </div>
            </article>
          ))}
        </div>
      </div>

      {detalle && (
        <div className="ped-overlay" onClick={() => setDetalle(null)}>
          <div className="ped-modal" role="dialog" aria-modal="true" aria-label="Detalles del pedido" onClick={(e) => e.stopPropagation()}>
            <button className="ped-cerrar" onClick={() => setDetalle(null)} aria-label="Cerrar"><X size={18} /></button>
            <span className={`ped-estado ped-estado--${detalle.estado}`}>{ETIQUETA[detalle.estado]}</span>
            <h2>{nombrePedido(detalle)}</h2>
            <p className="ped-codigo">Código {detalle.codigo}</p>

            <h4>Cliente</h4>
            <p>{detalle.cliente.nombre} {detalle.cliente.apellido}<br />{detalle.cliente.email}</p>
            <p className={detalle.cliente.rechazados + detalle.cliente.expirados >= 3 ? 'ped-alerta' : 'ped-historial'}>
              Historial: {detalle.cliente.rechazados} rechazados, {detalle.cliente.expirados} expirados
            </p>

            <h4>Perfumes</h4>
            <ul className="ped-items">
              {detalle.items.map((i, idx) => (
                <li key={idx}>
                  <span>{i.perfume}{i.ml ? ` (${i.ml} ml)` : ''} × {i.cantidad}</span>
                  <span>{usd(i.subtotal)}</span>
                </li>
              ))}
            </ul>
            <p className="ped-modal-total"><span>Total a facturar</span><strong>{usd(detalle.total)}</strong></p>

            <div className="ped-modal-acciones">
              <Acciones p={detalle} />
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
