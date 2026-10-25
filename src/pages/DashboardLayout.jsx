import { NavLink, Outlet, useLocation } from "react-router-dom";
import { Header } from "../components/Header";

// Para renombrar o agregar secciones basta con editar este arreglo
// (y su <Route> correspondiente en App.jsx).
const SECCIONES = [
  {
    to: "/dashboard",
    end: true,
    label: "Resumen",
    titulo: "Resumen",
    desc: "Ventas, ingresos e inventario de un vistazo.",
  },
  {
    to: "/dashboard/perfumes",
    label: "Perfumes",
    titulo: "Perfumes",
    desc: "Agrega, edita o elimina perfumes del catálogo.",
  },
  {
    to: "/dashboard/pedidos",
    label: "Pedidos",
    titulo: "Pedidos",
    desc: "Gestiona los pedidos de los clientes.",
  },
];

export default function DashboardLayout() {
  const { pathname } = useLocation();

  const idx = Math.max(
    0,
    SECCIONES.findIndex((s) =>
      s.end ? pathname.replace(/\/$/, "") === s.to : pathname.startsWith(s.to)
    )
  );
  const actual = SECCIONES[idx];

  return (
    <>
      <Header scrolled />
      <main className="dashboard-main">
        <div className="dash-top">
          <header className="dashboard-header">
            <h1>{actual.titulo}</h1>
            <p>{actual.desc}</p>
          </header>

          {/* --i / --n mueven la "píldora" activa con CSS */}
          <nav
            className="dash-switch"
            aria-label="Secciones del dashboard"
            style={{ "--i": idx, "--n": SECCIONES.length }}
          >
            {SECCIONES.map((s) => (
              <NavLink key={s.to} to={s.to} end={s.end}>
                {s.label}
              </NavLink>
            ))}
          </nav>
        </div>

        <Outlet />
      </main>
    </>
  );
}
