import { useCallback, useEffect, useId, useMemo, useState } from "react";
import { getAcordes, getPerfumes } from "../utils/perfumesInformation";
import { Link, useSearchParams } from "react-router-dom";
import { Header } from "../components/Header";
import { FILTROS_INDEX } from "../data/esencias";
import { MOMENTOS, CLIMAS } from "../utils/perfumes";
import "../styles/tienda.css";
import "../styles/filtros.css";

// Enum de la BD (genre) -> etiqueta visible
const GENEROS = { M: "Masculino", F: "Femenino", U: "Unisex" };

// Carpeta (dentro de /public) donde viven las imágenes cuando la BD guarda solo el
// nombre del archivo, por ejemplo "sauvage_edp.jpg". Cámbiala a "/perfumes/" o a lo que uses.
const BASE_IMAGENES = "/";

const normalizar = (s) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

// El backend guarda los acordes en minúsculas; aquí se muestran con inicial mayúscula.
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

// URL completa, ruta absoluta o data: se usan tal cual; un nombre suelto se busca en BASE_IMAGENES.
const imagenSrc = (img) => (/^(https?:|data:|\/)/.test(img) ? img : `${BASE_IMAGENES}${img}`);

// Un perfume "día y noche" sirve para ambos momentos y uno "versátil" para cualquier clima,
// así que aparecen siempre al filtrar; por eso no se ofrecen como opciones del filtro.
const MOMENTO_AMBOS = "día y noche";
const CLIMA_VERSATIL = "versátil";
const OPCIONES_MOMENTO = MOMENTOS.filter((m) => m !== MOMENTO_AMBOS);
const OPCIONES_CLIMA = CLIMAS.filter((c) => c !== CLIMA_VERSATIL);

// Grupo de filtros plegable. Arranca abierto solo si ya hay algo marcado.
function GrupoFiltro({ titulo, activos, children }) {
  const [abierto, setAbierto] = useState(activos > 0);
  const idCuerpo = useId();
  return (
    <div className="ess__grupo">
      <button
        type="button"
        className="ess__grupo-btn"
        aria-expanded={abierto}
        aria-controls={idCuerpo}
        onClick={() => setAbierto((v) => !v)}
      >
        <span>
          {titulo}
          {activos > 0 && <span className="ess__badge">{activos}</span>}
        </span>
        <span className="ess__chev" aria-hidden="true">▾</span>
      </button>
      <div id={idCuerpo} className="ess__grupo-cuerpo" role="group" aria-label={titulo} hidden={!abierto}>
        {children}
      </div>
    </div>
  );
}

function OpcionesCheck({ opciones, marcadas, onToggle, etiqueta = (v) => v }) {
  return opciones.map((valor) => (
    <label key={valor} className="ess__check">
      <input type="checkbox" checked={marcadas.includes(valor)} onChange={() => onToggle(valor)} />
      {etiqueta(valor)}
    </label>
  ));
}

export default function Esencias() {
  const [params, setParams] = useSearchParams();

  const claveFiltro = params.get("filtro");
  const preset = FILTROS_INDEX[claveFiltro] ?? null;
  const esenciaParam = params.get("esencia") || null;

  const [seleccion, setSeleccion] = useState(esenciaParam);
  const [q, setQ] = useState("");
  const [generos, setGeneros] = useState([]);
  const [acordes, setAcordes] = useState([]); // acordes MARCADOS en el filtro
  const [momentos, setMomentos] = useState(() => {
    const m = params.get("momento");
    return OPCIONES_MOMENTO.includes(m) ? [m] : [];
  });
  const [climas, setClimas] = useState([]);
  const [acordesDisponibles, setAcordesDisponibles] = useState([]); // todos los que existen (API)
  const [perfumes, setPerfumes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [panelAbierto, setPanelAbierto] = useState(false);

  const cargar = useCallback(async () => {
    setCargando(true);
    setError("");
    try {
      const [lista, nombres] = await Promise.all([
        getPerfumes(),
        getAcordes().catch(() => []), // sin la lista de acordes la página sigue funcionando
      ]);
      setPerfumes(lista);
      setAcordesDisponibles(nombres);
    } catch {
      setError("No pudimos cargar las esencias. Inténtalo de nuevo en un momento.");
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  // Si llega ?esencia=ID, se marca la tarjeta y se lleva a la vista.
  // Se espera a que terminen de cargar los perfumes: antes la tarjeta no existe en el DOM.
  useEffect(() => {
    if (!esenciaParam || cargando) return;
    setSeleccion(esenciaParam);
    document.getElementById(`esencia-${esenciaParam}`)?.scrollIntoView({ block: "center", behavior: "smooth" });
  }, [esenciaParam, cargando]);

  const alternar = (lista, setLista, valor) =>
    setLista(lista.includes(valor) ? lista.filter((v) => v !== valor) : [...lista, valor]);

  const quitarParams = (...nombres) => {
    const next = new URLSearchParams(params);
    nombres.forEach((n) => next.delete(n));
    setParams(next, { replace: true });
  };

  const limpiar = () => {
    setQ("");
    setGeneros([]);
    setAcordes([]);
    setMomentos([]);
    setClimas([]);
    if (preset || params.has("momento")) quitarParams("filtro", "momento");
  };

  const resultados = useMemo(() => {
    const nq = normalizar(q.trim());
    return perfumes.filter((e) => {
      if (preset && !preset.test(e)) return false;
      if (nq && !normalizar(`${e.nombre} ${GENEROS[e.genre] ?? ""} ${e.acordes.join(" ")}`).includes(nq)) return false;
      if (generos.length && !generos.includes(e.genre)) return false;
      if (acordes.length && !e.acordes.some((a) => acordes.includes(a))) return false;
      if (momentos.length && !(momentos.includes(e.momento) || e.momento === MOMENTO_AMBOS)) return false;
      if (climas.length && !(climas.includes(e.clima) || e.clima === CLIMA_VERSATIL)) return false;
      return true;
    });
  }, [preset, q, generos, acordes, momentos, climas, perfumes]);

  const activos = generos.length + acordes.length + momentos.length + climas.length;
  const hayFiltros = activos > 0 || q.trim() !== "" || Boolean(preset);

  return (
    <>
      <Header scrolled />
      <main className="tienda">
        <h1>Esencias</h1>
        <p className="tienda__sub">Elige una esencia y arma tu pedido con la medida y el frasco que prefieras.</p>

        <div className="ess__bar">
          <div className="ess__search">
            <label htmlFor="buscar" className="sr-only">Buscar esencia</label>
            <input
              id="buscar"
              type="search"
              placeholder="Buscar por nombre, género o acorde"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
          <button
            type="button"
            className="btn btn--sm btn--ghost ess__filtros-btn"
            aria-expanded={panelAbierto}
            onClick={() => setPanelAbierto((v) => !v)}
          >
            Filtros{activos ? ` (${activos})` : ""}
          </button>
        </div>

        <div className="ess__body">
          <aside className={`ess__aside ${panelAbierto ? "is-open" : ""}`} aria-label="Filtros">
            <GrupoFiltro titulo="Género" activos={generos.length}>
              <OpcionesCheck
                opciones={Object.keys(GENEROS)}
                marcadas={generos}
                onToggle={(v) => alternar(generos, setGeneros, v)}
                etiqueta={(k) => GENEROS[k]}
              />
            </GrupoFiltro>

            <GrupoFiltro titulo="Momento del día" activos={momentos.length}>
              <OpcionesCheck
                opciones={OPCIONES_MOMENTO}
                marcadas={momentos}
                onToggle={(v) => alternar(momentos, setMomentos, v)}
                etiqueta={cap}
              />
              <p className="ess__nota">Las esencias para día y noche aparecen siempre.</p>
            </GrupoFiltro>

            <GrupoFiltro titulo="Clima" activos={climas.length}>
              <OpcionesCheck
                opciones={OPCIONES_CLIMA}
                marcadas={climas}
                onToggle={(v) => alternar(climas, setClimas, v)}
                etiqueta={cap}
              />
              <p className="ess__nota">Las esencias versátiles aparecen siempre.</p>
            </GrupoFiltro>

            {acordesDisponibles.length > 0 && (
              <GrupoFiltro titulo="Acordes" activos={acordes.length}>
                <OpcionesCheck
                  opciones={acordesDisponibles}
                  marcadas={acordes}
                  onToggle={(v) => alternar(acordes, setAcordes, v)}
                  etiqueta={cap}
                />
              </GrupoFiltro>
            )}

            {hayFiltros && (
              <button type="button" className="ess__limpiar" onClick={limpiar}>
                Limpiar filtros
              </button>
            )}
          </aside>

          <section aria-live="polite">
            {preset && (
              <div className="ess__chips">
                <span className="ess__chip">
                  {preset.titulo}
                  <button type="button" onClick={() => quitarParams("filtro")} aria-label={`Quitar filtro ${preset.titulo}`}>
                    ×
                  </button>
                </span>
              </div>
            )}

            {cargando ? (
              <p className="ess__count">Cargando esencias…</p>
            ) : error ? (
              <div className="ess__vacio">
                <p>{error}</p>
                <button type="button" className="btn btn--sm" onClick={cargar}>
                  Reintentar
                </button>
              </div>
            ) : (
              <>
                <p className="ess__count">
                  {resultados.length} {resultados.length === 1 ? "esencia" : "esencias"}
                </p>

                {resultados.length === 0 ? (
                  <div className="ess__vacio">
                    {perfumes.length === 0 ? (
                      <p>Aún no hay esencias disponibles.</p>
                    ) : (
                      <>
                        <p>Ninguna esencia coincide con esos filtros.</p>
                        <button type="button" className="btn btn--sm" onClick={limpiar}>
                          Limpiar filtros
                        </button>
                      </>
                    )}
                  </div>
                ) : (
                  <div className="ess__grid">
                    {resultados.map((e) => {
                      const sel = seleccion === e.id;
                      return (
                        <article key={e.id} id={`esencia-${e.id}`} className={`ess-card ${sel ? "ess-card--sel" : ""}`}>
                          <button
                            type="button"
                            className="ess-card__main"
                            aria-pressed={sel}
                            onClick={() => setSeleccion(sel ? null : e.id)}
                          >
                            <span className="ess-card__img">
                              {e.imagen && <img src={imagenSrc(e.imagen)} alt="" loading="lazy" />}
                            </span>
                            <h3>{e.nombre}</h3>
                            <span className="ess-card__meta">
                              {[GENEROS[e.genre], ...e.acordes.map(cap)].filter(Boolean).join(" · ")}
                            </span>
                            <span className="ess-card__precio">Desde {e.precio_unitario}$</span>
                          </button>
                          {sel && (
                            <div className="ess-card__act">
                              <Link to={`/ordenar/${e.id}`} className="btn btn--sm">
                                Ordenar
                              </Link>
                            </div>
                          )}
                        </article>
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </section>
        </div>
      </main>
    </>
  );
}
