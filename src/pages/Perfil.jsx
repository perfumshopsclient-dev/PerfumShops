import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../utils/AuthContext";

export default function Perfil() {
  const { usuario, logout } = useAuth();
  const navigate = useNavigate();

  const salir = () => {
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <div className="form-div">
      <div className="login-glow" />

      <div className="login-card is-ready">
        <div className="login-fields">
          <div className="login-form">
            <h1 className="login-title">Mi perfil</h1>
            <p className="login-sub">Los datos de tu cuenta en PerfumShops</p>

            <dl className="perfil-datos">
              <div>
                <dt>Nombre</dt>
                <dd>{usuario.nombre} {usuario.apellido}</dd>
              </div>
              <div>
                <dt>Correo</dt>
                <dd>{usuario.email}</dd>
              </div>
              <div>
                <dt>Edad</dt>
                <dd>{usuario.edad ?? '-'}</dd>
              </div>
            </dl>

            <button type="button" className="form-btn" onClick={salir}>Cerrar sesión</button>

            <p className="login-alt"><Link to="/">Volver al inicio</Link></p>
          </div>
        </div>
      </div>
    </div>
  );
}