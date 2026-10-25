import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { z } from "zod";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
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

const NAME_REGEX = /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]+(?: [A-Za-zÁÉÍÓÚÜÑáéíóúüñ]+)*$/;
const PASSWORD_REGEX = /^(?=.*[A-Z])(?=.*\d).{8,}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const registerSchema = z
  .object({
    nombre: z
      .string()
      .trim()
      .min(2, "El nombre debe tener al menos 2 caracteres")
      .max(50, "El nombre no puede superar los 50 caracteres")
      .regex(NAME_REGEX, "El nombre solo debe contener letras y espacios"),
    apellido: z
      .string()
      .trim()
      .min(2, "El apellido debe tener al menos 2 caracteres")
      .max(50, "El apellido no puede superar los 50 caracteres")
      .regex(NAME_REGEX, "El apellido solo debe contener letras y espacios"),
    email: z
      .string()
      .trim()
      .regex(EMAIL_REGEX, "Ingresa un correo electrónico válido"),
    fechaNacimiento: z
      .string()
      .trim()
      .min(1, "Ingresa tu fecha de nacimiento"),
    password: z
      .string()
      .regex(PASSWORD_REGEX, "Mínimo 8 caracteres, al menos una mayúscula y un número"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"],
  })
  .refine(
    (data) => {
      if (!data.fechaNacimiento) return false;
      const birthDate = new Date(data.fechaNacimiento);
      if (Number.isNaN(birthDate.getTime())) return false;
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const m = today.getMonth() - birthDate.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      return age >= 18 && age <= 90;
    },
    {
      message: "Debes tener entre 18 y 90 años",
      path: ["fechaNacimiento"],
    }
  );

export default function Register() {
  const [ready, setReady] = useState(false);             // dispara el deslizamiento del logo
  const [showPass, setShowPass] = useState(false);       // text <-> password
  const [showPassConfirm, setShowPassConfirm] = useState(false);
  const [errors, setErrors] = useState({});
  const [enviando, setEnviando] = useState(false);
  const [fechaNacimiento, setFechaNacimiento] = useState(null);
  const { register } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const t = setTimeout(() => setReady(true), reduce ? 0 : 1500);
    return () => clearTimeout(t);
  }, []);

  const clearError = (e) => {
    const { name } = e.target;
    setErrors((prev) => {
      if (!(name in prev)) return prev;
      const next = { ...prev };
      delete next[name];
      if (name === "password") delete next.confirmPassword;
      return next;
    });
  };

  const aISO = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = Object.fromEntries(new FormData(e.currentTarget));
    const data = {
      ...formData,
      fechaNacimiento: fechaNacimiento
      ? aISO(fechaNacimiento)
      : formData.fechaNacimiento || "",
    };
    const result = registerSchema.safeParse(data);

    if (!result.success) {
      const fieldErrors = {};
      for (const issue of result.error.issues) {
        const key = issue.path[0];
        if (!fieldErrors[key]) fieldErrors[key] = issue.message;
      }
      setErrors(fieldErrors);
      return;
    }

    const { confirmPassword, ...payload } = result.data; // ya recortado por zod, sin confirmPassword
    setErrors({});
    setEnviando(true);
    try {
      await register(payload);
      navigate("/revisa-tu-correo", {
        replace: true,
        state: { email: payload.email, enviado: true },
      });
    } catch (err) {
      if(err.status === 409) setErrors({ form: "El correo electrónico ya está registrado" });
      else if(err.status === 400) setErrors({ form: "Algunos de los datos enviados no son válidos" });
      else if(err.status === 500) setErrors({ form: "Error del servidor. Intenta de nuevo más tarde." });
      else setErrors({ form: "Error en el servicio. Intenta de nuevo más tarde." });
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
            <p className="login-sub">Únete a PerfumShops y descubre tu esencia ideal</p>
            <div className="form-group">
              <input type="text" id="nombre" name="nombre" placeholder=" "
                     autoComplete="given-name" className="form-input"
                     aria-invalid={Boolean(errors.nombre)} onChange={clearError} />
              <label htmlFor="nombre">Nombre</label>
            </div>
            {errors.nombre && <p className="form-error" role="alert">{errors.nombre}</p>}

            <div className="form-group">
              <input type="text" id="apellido" name="apellido" placeholder=" "
                     autoComplete="family-name" className="form-input"
                     aria-invalid={Boolean(errors.apellido)} onChange={clearError} />
              <label htmlFor="apellido">Apellido</label>
            </div>
            {errors.apellido && <p className="form-error" role="alert">{errors.apellido}</p>}

            <div className="form-group">
              <input type="email" id="email" name="email" placeholder=" "
                     autoComplete="email" className="form-input"
                     aria-invalid={Boolean(errors.email)} onChange={clearError} />
              <label htmlFor="email">Correo electrónico</label>
            </div>
            {errors.email && <p className="form-error" role="alert">{errors.email}</p>}
            <div className={`form-group ${fechaNacimiento ? "has-value" : ""}`}>
              <DatePicker
                id="fechaNacimiento"
                name="fechaNacimiento"
                selected={fechaNacimiento}
                onChange={(date) => {
                  setFechaNacimiento(date);
                  setErrors((prev) => {
                    if (!("fechaNacimiento" in prev)) return prev;
                    const next = { ...prev };
                    delete next.fechaNacimiento;
                    return next;
                  });
                }}
                dateFormat="yyyy-MM-dd"
                placeholderText=" "
                autoComplete="bday"
                showYearDropdown
                showMonthDropdown
                dropdownMode="select"
                scrollableYearDropdown
                yearDropdownItemNumber={100}
                maxDate={new Date()}
                customInput={
                  <input
                    id="fechaNacimiento"
                    name="fechaNacimiento"
                    placeholder=" "
                    autoComplete="bday"
                    className="form-input"
                    aria-invalid={Boolean(errors.fechaNacimiento)}
                    onChange={clearError}
                  />
                }
              />
              <label htmlFor="fechaNacimiento">Fecha de nacimiento</label>
            </div>
            {errors.fechaNacimiento && (
              <p className="form-error" role="alert">
                {errors.fechaNacimiento}
              </p>
            )}

            <div className="form-group">
              <input type={showPass ? "text" : "password"} id="password" name="password"
                     placeholder=" " autoComplete="new-password"
                     className="form-input form-input--pass"
                     aria-invalid={Boolean(errors.password)} onChange={clearError} />
              <label htmlFor="password">Contraseña</label>
              <button type="button" className="pass-toggle"
                      onClick={() => setShowPass((s) => !s)}
                      aria-label={showPass ? "Ocultar contraseña" : "Mostrar contraseña"}>
                {showPass ? <EyeOff /> : <EyeOpen />}
              </button>
            </div>
            {errors.password && <p className="form-error" role="alert">{errors.password}</p>}

            <div className="form-group">
              <input type={showPassConfirm ? "text" : "password"} id="confirmPassword" name="confirmPassword"
                     placeholder=" " autoComplete="new-password"
                     className="form-input form-input--pass"
                     aria-invalid={Boolean(errors.confirmPassword)} onChange={clearError} />
              <label htmlFor="confirmPassword">Verificar contraseña</label>
              <button type="button" className="pass-toggle"
                      onClick={() => setShowPassConfirm((s) => !s)}
                      aria-label={showPassConfirm ? "Ocultar contraseña" : "Mostrar contraseña"}>
                {showPassConfirm ? <EyeOff /> : <EyeOpen />}
              </button>
            </div>
            {errors.confirmPassword && <p className="form-error" role="alert">{errors.confirmPassword}</p>}

            {errors.form && <p className="form-error" role="alert">{errors.form}</p>}

            <button type="submit" className="form-btn" disabled={enviando}>
              {enviando ? "Creando cuenta…" : "Crear cuenta"}
            </button>

            <p className="login-alt">
              ¿Ya tienes cuenta? <Link to="/login">Inicia sesión</Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
