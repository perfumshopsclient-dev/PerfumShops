import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { verificarEmail } from "../utils/userInformation";

const MENSAJES = {
  cargando: {
    titulo: "Verificando…",
    texto: "Estamos confirmando tu correo, un momento.",
  },
  ok: {
    titulo: "¡Correo verificado!",
    texto: "Tu cuenta ya está activa. Ahora puedes iniciar sesión.",
  },
  invalido: {
    titulo: "Enlace no válido",
    texto:
      "El enlace expiró o ya fue utilizado. Si ya verificaste tu cuenta, inicia sesión; si no, intenta iniciar sesión y te ofreceremos enviar un enlace nuevo.",
  },
  error: {
    titulo: "No pudimos verificar tu correo",
    texto: "Hubo un problema con el servicio. Intenta de nuevo en unos minutos.",
  },
};

export default function VerifyEmail() {
  const [params] = useSearchParams();
  const token = params.get("token");
  const [estado, setEstado] = useState(token ? "cargando" : "invalido");
  // El token es de un solo uso: evita la doble llamada de React.StrictMode en desarrollo
  const yaEnviado = useRef(false);

  useEffect(() => {
    if (!token || yaEnviado.current) return;
    yaEnviado.current = true;

    verificarEmail(token)
      .then(() => setEstado("ok"))
      .catch((err) => setEstado(err?.status === 400 ? "invalido" : "error"));
  }, [token]);

  const { titulo, texto } = MENSAJES[estado];

  return (
    <div className="form-div">
      <div className="login-glow" />

      <div className="login-card is-ready">
        <Link to="/" className="login-logo" aria-label="Ir al inicio">
          <img src="/img/logo-perfumshops.png" alt="PerfumShops" />
        </Link>

        <div className="login-fields">
          <div className="login-form">
            <h1 className="login-title">{titulo}</h1>
            <p className="login-sub" role="status">{texto}</p>

            {estado !== "cargando" && (
              <Link to="/login" className="form-btn">
                Ir a iniciar sesión
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
