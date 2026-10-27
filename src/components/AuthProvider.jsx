import { useCallback, useEffect, useMemo, useState } from "react";
import { ContextoAuth } from "../utils/AuthContext";
import {
  cerrarSesion,
  obtenerSesion,
  registrarUsuario,
  logeoUsuario,
} from "../utils/userInformation";
import { useCarrito } from "../utils/useCarrito";

export default function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null);
  const [cargando, setCargando] = useState(true);

  const { vaciar } = useCarrito()

  const expirarSesion = useCallback(() => setUsuario(null), []);

  useEffect(() => {
    let vigente = true;
    obtenerSesion().then((sesion) => {
      if (!vigente) return;
      setUsuario(sesion);
      setCargando(false);
    });
    return () => {
      vigente = false;
    };
  }, []);

  const login = useCallback(async ({ email, password }) => {
    const sesion = await logeoUsuario(email, password);
    setUsuario(sesion);
    return sesion;
  }, []);

  // el backend ya deja la cookie puesta al registrar, así que el usuario queda logueado
  const register = useCallback((datos) => registrarUsuario(datos), []);

  const logout = useCallback(async () => {
    try {
      await cerrarSesion();
    } finally {
      vaciar()
      setUsuario(null);
    }
  }, [vaciar]);

  const valor = useMemo(
    () => ({ usuario, cargando, login, register, logout, expirarSesion }),
    [usuario, cargando, login, register, logout, expirarSesion],
  );

  return <ContextoAuth.Provider value={valor}>{children}</ContextoAuth.Provider>;
}