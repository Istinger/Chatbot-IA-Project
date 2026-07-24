import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import Icon from '../components/Icon';

/**
 * Arranque del sistema (mock login.html): pantalla cinematografica con un orb
 * luminoso de punto focal y una tarjeta glass. El registro comparte la pantalla:
 * solo cambia el modo.
 */
/**
 * Traduce el fallo a un mensaje util segun su tipo. El backend ya devuelve 401
 * con "Correo o contrasena incorrectos", pero un 502 pasajero (el contenedor
 * reiniciando durante un deploy) llegaba como "Error 502" crudo: eso confunde,
 * parece un fallo grave cuando basta con reintentar. Aqui se distingue el caso.
 */
function mensajeDeError(err) {
  switch (err.status) {
    case 401:
      return 'Credenciales incorrectas. Vuelve a intentarlo.';
    case 0:
      return 'No hay conexion con el servidor. Revisa tu internet.';
    case 502:
    case 503:
    case 504:
      return 'El servidor esta iniciandose. Prueba de nuevo en unos segundos.';
    default:
      // 400 (validacion) y 409 (correo ya registrado) traen un mensaje claro
      // del backend: se muestra tal cual.
      return err.message || 'Algo salio mal. Intenta otra vez.';
  }
}

export default function Login({ modo = 'login' }) {
  const esRegistro = modo === 'registro';
  const { entrar, registrar } = useAuth();
  const navegar = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [verClave, setVerClave] = useState(false);
  const [error, setError] = useState(null);
  const [enviando, setEnviando] = useState(false);

  const enviar = async (e) => {
    e.preventDefault();
    setError(null);
    setEnviando(true);
    try {
      const perfil = esRegistro
        ? await registrar(email, password)
        : await entrar(email, password);

      // Un usuario sin skills no tiene embedding, y sin embedding no hay
      // recomendaciones: va derecho al onboarding.
      navegar(perfil?.skills?.length ? '/' : '/onboarding', { replace: true });
    } catch (err) {
      setError(mensajeDeError(err));
      setEnviando(false);
    }
  };

  return (
    <main className="entrada">
      <span className="entrada__orb" aria-hidden="true">
        <Icon name="usuario" size={54} />
      </span>

      <h1 className="entrada__titulo">{esRegistro ? 'Crea tu acceso' : 'Hola de nuevo'}</h1>
      <p className="entrada__sub">
        {esRegistro ? 'Un correo y una contrasena. Nada mas.' : 'Inicia sesion para continuar'}
      </p>

      <div className="entrada__caja">
        <form className="entrada__form" onSubmit={enviar} noValidate>
          <div className="campo">
            <label htmlFor="email">Correo electronico</label>
            <div className="campo__input">
              <Icon name="sobre" size={18} className="campo__icono" />
              <input
                id="email"
                type="email"
                inputMode="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ejemplo@correo.com"
              />
            </div>
          </div>

          <div className="campo">
            <label htmlFor="password">Contrasena</label>
            <div className="campo__input">
              <Icon name="candado" size={18} className="campo__icono" />
              <input
                id="password"
                type={verClave ? 'text' : 'password'}
                autoComplete={esRegistro ? 'new-password' : 'current-password'}
                required
                minLength={esRegistro ? 8 : undefined}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={esRegistro ? 'Minimo 8 caracteres' : '••••••••'}
              />
              <button
                type="button"
                className="campo__toggle"
                onClick={() => setVerClave((v) => !v)}
                aria-label={verClave ? 'Ocultar contrasena' : 'Mostrar contrasena'}
                aria-pressed={verClave}
              >
                <Icon name={verClave ? 'ojoOff' : 'ojo'} size={18} />
              </button>
            </div>
            {esRegistro && <span className="campo__ayuda">Minimo 8 caracteres.</span>}
          </div>

          {!esRegistro && (
            <div className="entrada__fila">
              <label className="check">
                <input type="checkbox" />
                <span>Recordarme</span>
              </label>
              <span className="entrada__olvido">Olvidaste tu contrasena?</span>
            </div>
          )}

          {/* role="alert" para que el lector de pantalla lo anuncie al aparecer. */}
          {error && (
            <p className="alerta" role="alert">
              <Icon name="aviso" size={16} />
              {error}
            </p>
          )}

          <button type="submit" className="btn btn--primario btn--bloque" disabled={enviando}>
            {enviando ? 'Entrando…' : esRegistro ? 'Crear cuenta' : 'Continuar'}
          </button>
        </form>
      </div>

      <p className="entrada__pie">
        {esRegistro ? (
          <>
            Ya tienes cuenta? <Link to="/login">Entra</Link>
          </>
        ) : (
          <>
            Primera vez? <Link to="/registro">Crea tu acceso</Link>
          </>
        )}
      </p>
    </main>
  );
}
