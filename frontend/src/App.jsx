import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from './lib/auth';
import AmbientBackground from './components/AmbientBackground';
import Shell from './components/Shell';
import Login from './screens/Login';
import Onboarding from './screens/Onboarding';
import Home from './screens/Home';
import Search from './screens/Search';
import Chat from './screens/Chat';
import Certs from './screens/Certs';
import Profile from './screens/Profile';

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

function Rutas() {
  return (
    <Routes>
      <Route path="/login" element={<Publica><Login modo="login" /></Publica>} />
      <Route path="/registro" element={<Publica><Login modo="registro" /></Publica>} />

      <Route path="/onboarding" element={<Privada><Onboarding /></Privada>} />

      <Route element={<Privada><Shell /></Privada>}>
        <Route path="/" element={<Home />} />
        <Route path="/buscar" element={<Search />} />
        <Route path="/asistente" element={<Chat />} />
        <Route path="/crecer" element={<Certs />} />
        <Route path="/perfil" element={<Profile />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AmbientBackground />
        <Rutas />
      </AuthProvider>
    </BrowserRouter>
  );
}
