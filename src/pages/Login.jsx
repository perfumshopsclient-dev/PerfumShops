import { useEffect, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { z } from "zod";
import { useAuth } from "../utils/AuthContext";

const EyeOpen = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);
const EyeOff = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 3l18 18" />
    <path d="M10.6 5.1A10.4 10.4 0 0 1 12 5c6.4 0 10 7 10 7a17 17 0 0 1-3.2 4M6.6 6.6A17 17 0 0 0 2 12s3.6 7 10 7a10 10 0 0 0 4.4-1" />
    <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" />
  </svg>
);

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .regex(EMAIL_REGEX, "Ingresa un correo electrónico válido"),
  password: z.string().min(1, "Ingresa tu contraseña"),
});

export default function Login() {
  const [ready, setReady] = useState(false);       // dispara el deslizamiento del logo
  const [showPass, setShowPass] = useState(false); // text <-> password
  const [error, setError] = useState("");
  const [enviando, setEnviando] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const destino = location.state?.from ?? "/";

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const t = setTimeout(() => setReady(true), reduce ? 0 : 1500);
    return () => clearTimeout(t);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const result = loginSchema.safeParse(Object.fromEntries(new FormData(e.currentTarget)));
    if (!result.success) {
      setError(result.error.issues[0].message);
      return;
    }

    setEnviando(true);
    try {
      await login(result.data);
      navigate(destino, { replace: true });
    } catch (err) {
      if (err.status === 403 && err.response?.data?.code === "EMAIL_NOT_VERIFIED") {
        navigate("/revisa-tu-correo", { state: { email: result.data.email } });
        return;
      }
      if(err.status === 401) setError("Correo o contraseña incorrectos");
      else if(err.status === 500) setError("Error del servidor. Intenta de nuevo más tarde.");
      else setError("Error en el servicio. Intenta de nuevo más tarde.");
      setEnviando(false);
    }
  };

  return (
    <div className="form-div">
      <div className="login-glow" />

      <div className={`login-card ${ready ? "is-ready" : ""}`}>
        <Link to="/" className="login-logo" aria-label="Ir al inicio">
          <img src="/img/logo-perfumshops.png" alt="PerfumShops" />
        </Link>

        <div className="login-fields">
          <form onSubmit={handleSubmit} noValidate className="login-form">
            <h1 className="login-title">Bienvenido</h1>
            <p className="login-sub">Inicia sesión para descubrir tu esencia</p>

            <div className="form-group">
              <input type="email" id="email" name="email" placeholder=" "
                     autoComplete="email" className="form-input"
                     aria-invalid={Boolean(error)} />
              <label htmlFor="email">Correo electrónico</label>
            </div>

            <div className="form-group">
              <input type={showPass ? "text" : "password"} id="password" name="password"
                     placeholder=" " autoComplete="current-password"
                     className="form-input form-input--pass"
                     aria-invalid={Boolean(error)} />
              <label htmlFor="password">Contraseña</label>
              <button type="button" className="pass-toggle"
                      onClick={() => setShowPass((s) => !s)}
                      aria-label={showPass ? "Ocultar contraseña" : "Mostrar contraseña"}>
                {showPass ? <EyeOff /> : <EyeOpen />}
              </button>
            </div>

            {error && <p className="form-error" role="alert">{error}</p>}

            <button type="submit" className="form-btn" disabled={enviando}>
              {enviando ? "Iniciando…" : "Iniciar sesión"}
            </button>

            <p className="login-alt">
              ¿No tienes cuenta? <Link to="/register" state={location.state}>Regístrate</Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}