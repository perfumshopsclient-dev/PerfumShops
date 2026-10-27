import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import AuthProvider from "./components/AuthProvider";
import { useAuth } from "./utils/AuthContext";
import Index from "./pages/Index";
import Esencias from "./pages/Esencias";
import Ordenar from "./pages/Ordenar";
import Carrito from "./pages/Carrito";
import Perfil from "./pages/Perfil";
import DashboardLayout from "./pages/DashboardLayout";
import CheckEmail from "./pages/CheckEmail";
import VerifyEmail from "./pages/VerifyEmail";
import Resumen from "./pages/dashboard/Resumen";
import Perfumes from "./pages//dashboard/Perfumes";
import Pedidos from "./pages/dashboard/Pedidos";
import Login from "./pages/Login";
import Register from "./pages/Register";

function Protegida({ children, soloAdmin = false }) {
  const { usuario, cargando } = useAuth();
  if (cargando) return null;
  if (!usuario) return <Navigate to="/login" replace />;
  if (soloAdmin && usuario.rol !== "admin") return <Navigate to="/" replace />;
  return children;
}

function SoloVisitantes({ children }) {
  const { usuario, cargando } = useAuth();
  const location = useLocation();
  if (cargando) return null;
  if (usuario) return <Navigate to={location.state?.from ?? "/"} replace />;
  return children;
}

export default function App() {
  return (
    <AuthProvider>
      <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/login" element={<SoloVisitantes><Login /></SoloVisitantes>} />
          <Route path="/register" element={<SoloVisitantes><Register /></SoloVisitantes>} />
          <Route path="/esencias" element={<Esencias />} />
          <Route path="/ordenar/:id" element={<Ordenar />} />
          <Route path="/carrito" element={<Carrito />} />
          <Route path="/perfil" element={<Protegida><Perfil /></Protegida>} />
          <Route path="/dashboard" element={<Protegida soloAdmin><DashboardLayout /></Protegida>}>
            <Route index element={<Resumen />} />
            <Route path="perfumes" element={<Perfumes />} />
            <Route path="pedidos" element={<Pedidos />} />
          </Route>
          <Route path="/revisa-tu-correo" element={<SoloVisitantes><CheckEmail /></SoloVisitantes>} />
          <Route path="/verificar-email" element={<VerifyEmail />} />
          <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  );
}
