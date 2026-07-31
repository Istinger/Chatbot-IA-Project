import { useEffect, useState } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { api } from './lib/api';
import { cargarFotos } from './lib/imagen';
import { AuthProvider, useAuth } from './lib/auth';
import AmbientBackground from './components/AmbientBackground';
import Shell from './components/Shell';
import Login from './screens/Login';
import GeneradorCv from './screens/GeneradorCv';
import Animacion from './screens/Animacion';
import Onboarding from './screens/Onboarding';
import Home from './screens/Home';
import Search from './screens/Search';
import Certs from './screens/Certs';
import Profile from './screens/Profile';
import Portafolio from './screens/Portafolio';
import PortafolioIdea from './screens/PortafolioIdea';
import PortafolioProyecto from './screens/PortafolioProyecto';
import Entrevista from './screens/Entrevista';
import Guardadas from './screens/Guardadas';
import OfertasGuardadas from './screens/OfertasGuardadas';

// Interruptor temporal para la casa abierta. En false, /login y /registro
// vuelven a mostrar exactamente las pantallas originales.
const MODO_CASA_ABIERTA = true;

/** Ruta protegida: sin sesion, al login. */
function Privada({ children }) {
  const { autenticado, cargando } = useAuth();

  // Mientras se valida el token guardado no se decide nada: redirigir aqui
  // expulsaria al usuario en cada recarga de pagina.
  if (cargando) return <div className="cargando">Iniciando…</div>;
  if (!autenticado) return <Navigate to="/login" replace />;
  return children;
}

/** Si ya hay sesion, el login no tiene sentido. */
function Publica({ children }) {
  const { autenticado, cargando } = useAuth();
  if (cargando) return <div className="cargando">Iniciando…</div>;
  if (autenticado) return <Navigate to="/" replace />;
  return children;
}

function EntradaPublica({ modo }) {
  return MODO_CASA_ABIERTA ? <GeneradorCv /> : <Login modo={modo} />;
}

function Rutas() {
  return (
    <Routes>
      <Route path="/login" element={<Publica><EntradaPublica modo="login" /></Publica>} />
      <Route path="/registro" element={<Publica><EntradaPublica modo="registro" /></Publica>} />
      {/* El acceso original se conserva para restaurarlo despues de la feria. */}
      <Route path="/acceso" element={<Publica><Login modo="login" /></Publica>} />
      <Route path="/acceso/registro" element={<Publica><Login modo="registro" /></Publica>} />

      <Route path="/onboarding" element={<Privada><Onboarding /></Privada>} />
      <Route path="/animacion" element={<Privada><Animacion /></Privada>} />

      {/* El Asistente ya no es una ruta: vive SIEMPRE en el Shell (derecha en
          escritorio). /asistente se redirige a la home por compatibilidad. */}
      <Route element={<Privada><Shell /></Privada>}>
        <Route path="/" element={<Home />} />
        <Route path="/buscar" element={<Search />} />
        <Route path="/crecer" element={<Certs />} />
        <Route path="/portafolio" element={<Portafolio />} />
        <Route path="/portafolio/:id" element={<PortafolioIdea />} />
        <Route path="/portafolio/:id/proyecto" element={<PortafolioProyecto />} />
        <Route path="/entrevista" element={<Entrevista />} />
        <Route path="/ofertas-guardadas" element={<OfertasGuardadas />} />
        <Route path="/guardadas" element={<Guardadas />} />
        <Route path="/perfil" element={<Profile />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

/**
 * Fotos de portada: se piden UNA vez al arrancar y se reparten entre las ofertas
 * (ver lib/imagen.js). Si falla o no hay clave de Pexels, cada portada cae en su
 * respaldo y la app sigue igual.
 */
function useFotos() {
  const [, setListo] = useState(false);
  useEffect(() => {
    api
      .imagenes()
      .then((r) => {
        cargarFotos(r.temas);
        setListo(true); // repinta para que las tarjetas cojan ya la foto buena
      })
      .catch(() => {});
  }, []);
}

export default function App() {
  useFotos();

  return (
    <BrowserRouter>
      <AuthProvider>
        {/* Marco de la app: en escritorio es un rectangulo 16:9 redondeado y
            centrado, con negro alrededor. El fondo animado va DENTRO, asi queda
            recortado por las esquinas. En movil ocupa la pantalla entera. */}
        <div className="marco">
          <AmbientBackground />
          <Rutas />
        </div>
      </AuthProvider>
    </BrowserRouter>
  );
}
