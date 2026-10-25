import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import PerfumeImg from "../../components/PerfumeImg";
import PerfumeModal from "../../components/PerfumeModal";
import {
  createPerfume,
  deletePerfume,
  updatePerfume,
  getPerfumes,
} from "../../utils/perfumesInformation";
import { GENEROS, fmtUSD, stockBajo } from "../../utils/perfumes";
import { aFormData } from "../../utils/perfumesFormData";

const DURACION_AVISO = 4500;

// Saca el mensaje del backend ({ message }) o uno genérico si no hay respuesta.
function mensajeDeError(e, porDefecto) {
  if (e?.response?.data?.message) return e.response.data.message;
  if (e?.request && !e?.response) return "No se pudo conectar con el servidor.";
  return porDefecto;
}

function PerfumeCard({ perfume, onClick }) {
  const bajo = stockBajo(perfume);
  return (
    <button type="button" className="pf-card" onClick={onClick}>
      <span className="pf-card__img">
        <PerfumeImg src={perfume.imagen} nombre={perfume.nombre} />
      </span>
      <span className="pf-card__name">{perfume.nombre}</span>
      <span className="pf-card__meta">
        {GENEROS[perfume.genre]} · {perfume.ml} ml
      </span>
      <span className="pf-card__foot">
        <span className="pf-card__price">{fmtUSD(perfume.precio_unitario)}</span>
        <span className={`pf-badge ${bajo ? "pf-badge--low" : ""}`}>
          {bajo ? `Bajo · ${perfume.cantidad}` : `Stock ${perfume.cantidad}`}
        </span>
      </span>
    </button>
  );
}

export default function Perfumes() {
  const [perfumes, setPerfumes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  // null = cerrado · { perfume: null } = crear · { perfume } = editar
  const [modal, setModal] = useState(null);
  // null = sin aviso · { tipo: "ok" | "error", texto }
  const [aviso, setAviso] = useState(null);
  const temporizador = useRef(null);

  const cerrarAviso = useCallback(() => {
    clearTimeout(temporizador.current);
    setAviso(null);
  }, []);

  const avisar = useCallback((tipo, texto) => {
    clearTimeout(temporizador.current);
    setAviso({ tipo, texto, id: Date.now() });
    temporizador.current = setTimeout(() => setAviso(null), DURACION_AVISO);
  }, []);

  // Limpia el temporizador si el componente se desmonta
  useEffect(() => () => clearTimeout(temporizador.current), []);

  const cargar = useCallback(async () => {
    setCargando(true);
    setError("");
    try {
      setPerfumes(await getPerfumes());
    } catch {
      setError("No pudimos cargar las esencias. Inténtalo de nuevo en un momento.");
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const cerrar = useCallback(() => setModal(null), []);

  const guardar = async (datos, archivo) => {
    const esEdicion = Boolean(modal?.perfume);
    try {
      if (esEdicion) {
        const act = await updatePerfume(datos.id, aFormData(datos, archivo));
        setPerfumes((lista) => lista.map((p) => (p.id === act.id ? act : p)));
        avisar("ok", "Perfume actualizado correctamente.");
      } else {
        const nuevo = await createPerfume(aFormData(datos, archivo));
        setPerfumes((lista) => [nuevo, ...lista]);
        avisar("ok", "Perfume creado correctamente.");
      }
      cerrar();
    } catch (e) {
      avisar(
        "error",
        mensajeDeError(
          e,
          esEdicion ? "No se pudo actualizar el perfume." : "No se pudo crear el perfume."
        )
      );
      throw e;
    }
  };

  const borrar = async (id) => {
    try {
      await deletePerfume(id);
      setPerfumes((lista) => lista.filter((p) => p.id !== id));
      avisar("ok", "Perfume eliminado correctamente.");
      cerrar();
    } catch (e) {
      avisar("error", mensajeDeError(e, "No se pudo eliminar el perfume."));
      throw e;
    }
  };

  const bajos = useMemo(() => perfumes.filter(stockBajo).length, [perfumes]);

  const [busqueda, setBusqueda] = useState("");

  // Normaliza: minúsculas y sin tildes ("Élan" coincide con "elan")
  const normalizar = (s) =>
    s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

  const filtrados = useMemo(() => {
    const q = normalizar(busqueda.trim());
    if (!q) return perfumes;
    return perfumes.filter((p) => normalizar(p.nombre).includes(q));
  }, [perfumes, busqueda]);

  return (
    <>
      <section className="dashboard-card pf-panel">
        <div className="pf-toolbar">
          <div>
            <h2 className="pf-title">Catálogo</h2>
            {!cargando && !error && (
              <p className="pf-count">
                {busqueda.trim()
                  ? `${filtrados.length} de ${perfumes.length} perfumes`
                  : `${perfumes.length} ${perfumes.length === 1 ? "perfume" : "perfumes"}`}
                {bajos > 0 && ` · ${bajos} con stock bajo`}
              </p>
            )}
          </div>

          <div className="pf-search">
            <input
              type="search"
              className="pf-search__input"
              placeholder="Buscar por nombre…"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              aria-label="Buscar perfumes por nombre"
            />
            {busqueda && (
              <button
                type="button"
                className="pf-search__clear"
                onClick={() => setBusqueda("")}
                aria-label="Limpiar búsqueda"
              >
                ×
              </button>
            )}
          </div> 

          <button type="button" className="pf-btn" onClick={() => setModal({ perfume: null })}>
            + Agregar perfume
          </button>
        </div>

        {cargando && <p className="pf-state">Cargando perfumes…</p>}

        {!cargando && error && (
          <div className="pf-state">
            <p className="pf-error" role="alert">
              {error}
            </p>
            <button type="button" className="pf-btn pf-btn--ghost" onClick={cargar}>
              Reintentar
            </button>
          </div>
        )}

        {!cargando && !error && perfumes.length > 0 && filtrados.length === 0 && (
          <div className="pf-state">
            <p>No hay perfumes que coincidan con “{busqueda.trim()}”.</p>
            <button type="button" className="pf-btn pf-btn--ghost" onClick={() => setBusqueda("")}>
              Limpiar búsqueda
            </button>
          </div>
        )}

        {!cargando && !error && filtrados.length > 0 && (
          <div className="pf-grid">
            {filtrados.map((p) => (
              <PerfumeCard key={p.id} perfume={p} onClick={() => setModal({ perfume: p })} />
            ))}
          </div>
        )}
      </section>

      {modal && (
        <PerfumeModal
          perfume={modal.perfume}
          onClose={cerrar}
          onGuardar={guardar}
          onEliminar={borrar}
        />
      )}

      {/* Tarjeta de aviso (cuadro verde/rojo del esquema) */}
      {aviso && (
        <div
          key={aviso.id}
          className={`pf-toast pf-toast--${aviso.tipo}`}
          role={aviso.tipo === "error" ? "alert" : "status"}
          aria-live={aviso.tipo === "error" ? "assertive" : "polite"}
        >
          <span className="pf-toast__text">{aviso.texto}</span>
          <button
            type="button"
            className="pf-toast__close"
            onClick={cerrarAviso}
            aria-label="Cerrar aviso"
          >
            ×
          </button>
        </div>
      )}
    </>
  );
}