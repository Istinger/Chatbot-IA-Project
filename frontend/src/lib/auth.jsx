import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api, clearToken, getToken, setToken } from './api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [perfil, setPerfil] = useState(null);
  const [cargando, setCargando] = useState(Boolean(getToken()));

  // Al arrancar, si hay token guardado se valida contra el servidor. Un token
  // caducado devuelve 401: se limpia en vez de dejar la app en un limbo.
  const refrescar = useCallback(async () => {
    if (!getToken()) {
      setPerfil(null);
      setCargando(false);
      return null;
    }
    try {
      const p = await api.perfil();
      setPerfil(p);
      return p;
    } catch {
      clearToken();
      setPerfil(null);
      return null;
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    refrescar();
  }, [refrescar]);

  const entrar = useCallback(
    async (email, password) => {
      const { token } = await api.login(email, password);
      setToken(token);
      return refrescar();
    },
    [refrescar],
  );

  const registrar = useCallback(
    async (email, password) => {
      const { token } = await api.registro(email, password);
      setToken(token);
      return refrescar();
    },
    [refrescar],
  );

  const salir = useCallback(() => {
    clearToken();
    setPerfil(null);
  }, []);

  const valor = useMemo(
    () => ({
      perfil,
      cargando,
      autenticado: Boolean(perfil),
      // Sin skills no hay embedding, y sin embedding no hay recomendaciones:
      // ese es el usuario que debe pasar por el onboarding.
      listo: Boolean(perfil?.skills?.length),
      entrar,
      registrar,
      salir,
      refrescar,
    }),
    [perfil, cargando, entrar, registrar, salir, refrescar],
  );

  return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
