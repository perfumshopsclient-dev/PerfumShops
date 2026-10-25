import { useEffect, useRef, useState } from "react";
import PerfumeImg from "./PerfumeImg";
import { GENEROS, MOMENTOS, CLIMAS } from "../utils/perfumes";
import { listarAcordes, mensajeError } from "../utils/perfumesInformation";

const MAX_IMG_BYTES = 2 * 1024 * 1024;

const VACIO = {
  nombre: "",
  imagen: "",
  precio_unitario: "",
  ml: "",
  acordes: [],
  genre: "U",
  stock_minimo: "",
  cantidad: "",
  descripcion: "",
  momento: "día y noche",
  clima: 'versátil'
};

const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1)

const aForm = (p) =>
  p
    ? {
        nombre: p.nombre,
        imagen: p.imagen ?? "",
        precio_unitario: String(p.precio_unitario),
        ml: String(p.ml),
        acordes: p.acordes ?? [],
        genre: p.genre,
        stock_minimo: String(p.stock_minimo),
        cantidad: String(p.cantidad),
        descripcion: p.descripcion ?? "",
        momento: p.momento ?? "día y noche",
        clima: p.clima ?? 'versátil'
      }
    : VACIO;

const esEntero = (v, min) =>
  v !== "" && Number.isInteger(Number(v)) && Number(v) >= min;

function validar(f) {
  if (!f.nombre.trim()) return "Escribe el nombre del perfume.";
  if (!esEntero(f.precio_unitario, 0)) return "El precio debe ser un número entero en USD (0 o más).";
  if (!esEntero(f.ml, 1)) return "Los ml deben ser un número entero mayor a 0.";
  if (!esEntero(f.stock_minimo, 0)) return "El stock mínimo debe ser un número entero (0 o más).";
  if (!esEntero(f.cantidad, 0)) return "La cantidad debe ser un número entero (0 o más).";
  return "";
}

/* ---------- Campo numérico ---------- */
function Numero({ id, etiqueta, valor, onChange }) {
  return (
    <div className="pf-field">
      <label htmlFor={id}>{etiqueta}</label>
      <input
        id={id}
        className="pf-input"
        type="number"
        min="0"
        step="0"
        inputMode="numeric"
        value={valor}
        onChange={onChange}
      />
    </div>
  );
}

/* ---------- Acordes (text[]) como chips ---------- */
function AcordesInput({ value, onChange, sugerencias = [] }) {
  const [texto, setTexto] = useState("");
  const inputRef = useRef(null);

  const agregar = () => {
    const nuevos = texto.split(",").map((t) => t.trim().toLowerCase()).filter(Boolean);
    setTexto("");
    if (!nuevos.length) return;
    const vistos = new Set(value.map((a) => a.toLowerCase()));
    const unicos = nuevos.filter((a) => {
      const k = a.toLowerCase();
      if (vistos.has(k)) return false;
      vistos.add(k);
      return true;
    });
    if (unicos.length) onChange([...value, ...unicos]);
  };

  const onKeyDown = (e) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      agregar();
    } else if (e.key === "Backspace" && !texto && value.length) {
      onChange(value.slice(0, -1));
    }
  };

  return (
    <div className="pf-chips" onClick={() => inputRef.current?.focus()}>
      {value.map((a) => (
        <span className="pf-chip" key={a}>
          {a}
          <button
            type="button"
            aria-label={`Quitar ${a}`}
            onClick={(e) => {
              e.stopPropagation();
              onChange(value.filter((x) => x !== a));
            }}
          >
            ×
          </button>
        </span>
      ))}
      <input
        ref={inputRef}
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
        onKeyDown={onKeyDown}
        onBlur={agregar}
        aria-label="Agregar acorde"
        list="pf-acordes-sug"
        placeholder={value.length ? "" : "Elige uno existente o escribe uno nuevo y presiona Enter"}
      />
      <datalist id="pf-acordes-sug">
        {sugerencias
          .filter((s) => !value.includes(s))
          .map((s) => (
            <option key={s} value={s} />
          ))}
      </datalist>
    </div>
  );
}

/* ---------- Modal ---------- */
export default function PerfumeModal({ perfume, onClose, onGuardar, onEliminar }) {
  const editando = Boolean(perfume);

  const [form, setForm] = useState(() => aForm(perfume));
  const [archivo, setArchivo] = useState(null);
  const [preview, setPreview] = useState("");
  const [confirmando, setConfirmando] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState("");
  const [sugerencias, setSugerencias] = useState([]);

  const set = (campo) => (e) => setForm((f) => ({ ...f, [campo]: e.target.value }));

  // Escape cierra + se bloquea el scroll de fondo mientras el modal está abierto
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape" && !enviando) onClose();
    };
    document.addEventListener("keydown", onKey);
    const previo = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previo;
    };
  }, [onClose, enviando]);

  // Acordes que ya existen en la tabla (sugerencias; si falla, se escribe a mano)
  useEffect(() => {
    listarAcordes().then(setSugerencias).catch(() => {});
  }, []);

  // Vista previa del archivo elegido
  useEffect(() => {
    if (!archivo) {
      setPreview("");
      return;
    }
    const url = URL.createObjectURL(archivo);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [archivo]);

  const elegirArchivo = (e) => {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    if (!f.type.startsWith("image/")) return setError("El archivo debe ser una imagen.");
    if (f.size > MAX_IMG_BYTES) return setError("La imagen no puede pesar más de 2 MB.");
    setError("");
    setArchivo(f);
  };

  const enviar = async (e) => {
    e.preventDefault();
    const msg = validar(form);
    if (msg) return setError(msg);

    setEnviando(true);
    setError("");
    try {
      await onGuardar(
        {
          id: perfume?.id,
          nombre: form.nombre.trim(),
          imagen: archivo ? "" : form.imagen.trim(),
          precio_unitario: Number(form.precio_unitario),
          ml: Number(form.ml),
          acordes: form.acordes,
          genre: form.genre,
          stock_minimo: Number(form.stock_minimo),
          cantidad: Number(form.cantidad),
          descripcion: form.descripcion.trim(),
          momento: form.momento,
          clima: form.clima
        },
        archivo
      );
      // Si todo sale bien, el padre cierra el modal.
    } catch (err) {
      setError(mensajeError(err));
      setEnviando(false);
    }
  };

  const borrar = async () => {
    setEnviando(true);
    setError("");
    try {
      await onEliminar(perfume.id);
    } catch (err) {
      setError(mensajeError(err));
      setEnviando(false);
      setConfirmando(false);
    }
  };

  return (
    <div
      className="pf-overlay"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !enviando) onClose();
      }}
    >
      <div className="pf-modal" role="dialog" aria-modal="true" aria-labelledby="pf-titulo">
        <header className="pf-modal__head">
          <div>
            <h2 id="pf-titulo">{editando ? "Editar perfume" : "Nuevo perfume"}</h2>
            {editando && (
              <p className="pf-id" title="El id no se puede modificar">
                {perfume.id}
              </p>
            )}
          </div>
          <button
            type="button"
            className="pf-close"
            onClick={onClose}
            disabled={enviando}
            aria-label="Cerrar"
          >
            ×
          </button>
        </header>

        <form className="pf-modal__form" onSubmit={enviar} noValidate>
          <div className="pf-modal__body">
            {/* Imagen */}
            <div className="pf-media">
              <div className="pf-photo">
                <PerfumeImg src={preview || form.imagen} nombre={form.nombre} />
              </div>

              <label className="pf-btn pf-btn--ghost pf-file">
                {archivo ? "Cambiar imagen" : "Subir imagen"}
                <input type="file" accept="image/*" className="pf-sr" onChange={elegirArchivo} />
              </label>

              {archivo ? (
                <p className="pf-filename">
                  <span>{archivo.name}</span>
                  <button type="button" className="pf-link" onClick={() => setArchivo(null)}>
                    Quitar
                  </button>
                </p>
              ) : (
                <div className="pf-field">
                  <label htmlFor="pf-imagen">O pega la URL de la imagen</label>
                  <input
                    id="pf-imagen"
                    className="pf-input"
                    type="url"
                    placeholder="https://…"
                    value={form.imagen}
                    onChange={set("imagen")}
                  />
                </div>
              )}
            </div>

            {/* Datos */}
            <div className="pf-fields">
              <div className="pf-field">
                <label htmlFor="pf-nombre">Nombre</label>
                <input
                  id="pf-nombre"
                  className="pf-input"
                  value={form.nombre}
                  onChange={set("nombre")}
                  maxLength={120}
                  autoFocus={!editando}
                />
              </div>

              <div className="pf-row pf-row--3">
                <div className="pf-field">
                  <label htmlFor="pf-genre">Género</label>
                  <select id="pf-genre" className="pf-input" value={form.genre} onChange={set("genre")}>
                    {Object.entries(GENEROS).map(([k, v]) => (
                      <option key={k} value={k}>
                        {v}
                      </option>
                    ))}
                  </select>
                </div>
                <Numero id="pf-precio" etiqueta="Precio (USD)" valor={form.precio_unitario} onChange={set("precio_unitario")} />
                <Numero id="pf-ml" etiqueta="Mililitros" valor={form.ml} onChange={set("ml")} />
              </div>

              <div className="pf-row">
                <Numero id="pf-min" etiqueta="Stock mínimo" valor={form.stock_minimo} onChange={set("stock_minimo")} />
                <Numero id="pf-cant" etiqueta="Cantidad en stock" valor={form.cantidad} onChange={set("cantidad")} />
              </div>
              <div className="pf-row">
                <div className="pf-field">
                  <label htmlFor="pf-momento">Momento del día</label>
                  <select id="pf-momento" className="pf-input" value={form.momento} onChange={set("momento")}>
                    {MOMENTOS.map((m) => <option key={m} value={m}>{cap(m)}</option>)}
                  </select>
                </div>
                <div className="pf-field">
                  <label htmlFor="pf-clima">Clima</label>
                  <select id="pf-clima" className="pf-input" value={form.clima} onChange={set("clima")}>
                    {CLIMAS.map((c) => <option key={c} value={c}>{cap(c)}</option>)}
                  </select>
                </div>
              </div>

              <div className="pf-field">
                <span className="pf-label">Acordes</span>
                <AcordesInput
                  value={form.acordes}
                  onChange={(acordes) => setForm((f) => ({ ...f, acordes }))}
                  sugerencias={sugerencias}
                />
              </div>

              {error && (
                <p className="pf-error" role="alert">
                  {error}
                </p>
              )}
            </div>
          </div>

          <footer className="pf-modal__foot">
            <div>
              {editando &&
                (confirmando ? (
                  <div className="pf-confirm">
                    <span>¿Eliminar «{perfume.nombre}»? No se puede deshacer.</span>
                    <button
                      type="button"
                      className="pf-btn pf-btn--ghost"
                      onClick={() => setConfirmando(false)}
                      disabled={enviando}
                    >
                      No
                    </button>
                    <button
                      type="button"
                      className="pf-btn pf-btn--danger-solid"
                      onClick={borrar}
                      disabled={enviando}
                    >
                      {enviando ? "Eliminando…" : "Sí, eliminar"}
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    className="pf-btn pf-btn--danger"
                    onClick={() => setConfirmando(true)}
                    disabled={enviando}
                  >
                    Eliminar
                  </button>
                ))}
            </div>

            <div className="pf-actions">
              <button type="button" className="pf-btn pf-btn--ghost" onClick={onClose} disabled={enviando}>
                Cancelar
              </button>
              <button type="submit" className="pf-btn" disabled={enviando || confirmando}>
                {enviando && !confirmando ? "Guardando…" : editando ? "Guardar cambios" : "Agregar perfume"}
              </button>
            </div>
          </footer>
        </form>
      </div>
    </div>
  );
}
