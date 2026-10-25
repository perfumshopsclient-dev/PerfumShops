import { useEffect, useState } from "react";
import { Link, Navigate, useLocation } from "react-router-dom";
import { reenviarVerificacion } from "../utils/userInformation";

const COOLDOWN_SEGUNDOS = 60;

export default function CheckEmail() {
  const { state } = useLocation();
  const email = state?.email;

  // Si venimos del registro el correo acaba de enviarse: toca esperar antes de reenviar.
  // Si venimos del login (cuenta sin verificar) todavía no se envió nada: se puede pedir ya.
  const [segundos, setSegundos] = useState(state?.enviado ? COOLDOWN_SEGUNDOS : 0);
  const [enviando, setEnviando] = useState(false);
  const [resultado, setResultado] = useState(null); // "ok" | "error" | null

  useEffect(() => {
    if (segundos <= 0) return;
    const t = setTimeout(() => setSegundos((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [segundos]);

  // Sin correo en el estado de navegación (p. ej. recarga directa) no hay nada que mostrar
  if (!email) return <Navigate to="/login" replace />;

  const reenviar = async () => {
    setEnviando(true);
    setResultado(null);
    try {
      await reenviarVerificacion(email);
      setResultado("ok");
      setSegundos(COOLDOWN_SEGUNDOS);
    } catch {
      setResultado("error");
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="form-div">
      <div className="login-glow" />

      <div className="login-card is-ready">
        <Link to="/" className="login-logo" aria-label="Ir al inicio">
          <img src="/img/logo-perfumshops.png" alt="PerfumShops" />
        </Link>

        <div className="login-fields">
          <div className="login-form">
            <h1 className="login-title">Revisa tu correo</h1>
            <p className="login-sub">
              {state?.enviado ? "Te enviamos" : "Tu cuenta aún no está verificada. Podemos enviarte"} un enlace de
              verificación a <strong>{email}</strong>. Ábrelo para activar tu cuenta.
              Si no lo ves, revisa la carpeta de spam.
            </p>

            {resultado === "ok" && (
              <p className="login-sub" role="status">
                Listo: si el correo está pendiente de verificación, te llegará un enlace nuevo.
              </p>
            )}
            {resultado === "error" && (
              <p className="form-error" role="alert">
                No pudimos reenviar el correo. Intenta de nuevo más tarde.
              </p>
            )}

            <button
              type="button"
              className="form-btn"
              onClick={reenviar}
              disabled={enviando || segundos > 0}
            >
              {enviando
                ? "Enviando…"
                : segundos > 0
                  ? `Reenviar correo (${segundos}s)`
                  : "Reenviar correo"}
            </button>

            <p className="login-alt">
              ¿Ya verificaste tu cuenta? <Link to="/login">Inicia sesión</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
