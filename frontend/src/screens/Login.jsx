import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import Icon from '../components/Icon';

/**
 * Arranque del sistema (DESIGN.md): no un formulario corporativo, sino una
 * pantalla de entrada cinematografica con un orb luminoso de punto focal.
 *
 * El registro comparte esta misma pantalla: solo cambia el modo.
 */
export default function Login({ modo = 'login' }) {
  const esRegistro = modo === 'registro';
  const { entrar, registrar } = useAuth();
  const navegar = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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
      setError(err.message);
      setEnviando(false);
    }
  };

  return (
    <main className="entrada">
      <div className="orb" aria-hidden="true" />

      <div className="entrada__caja">
        <h1 className="entrada__titulo">{esRegistro ? 'Crea tu acceso' : 'Jobia'}</h1>
        <p className="entrada__sub">
          {esRegistro
            ? 'Un correo y una contrasena. Nada mas.'
            : 'Tu agente de empleo. Encuentra trabajo que encaje contigo.'}
        </p>

        <form className="entrada__form" onSubmit={enviar} noValidate>
          <div className="campo">
            <label htmlFor="email">Correo</label>
            <input
              id="email"
              type="email"
              inputMode="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@correo.com"
            />
          </div>

          <div className="campo">
            <label htmlFor="password">Contrasena</label>
            <input
              id="password"
              type="password"
              autoComplete={esRegistro ? 'new-password' : 'current-password'}
              required
              minLength={esRegistro ? 8 : undefined}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={esRegistro ? 'Minimo 8 caracteres' : '••••••••'}
            />
            {esRegistro && (
              <span className="campo__ayuda">Minimo 8 caracteres.</span>
            )}
          </div>

          {/* role="alert" para que el lector de pantalla lo anuncie al aparecer. */}
          {error && (
            <p className="alerta" role="alert">
              <Icon name="aviso" size={16} />
              {error}
            </p>
          )}

          <button type="submit" className="btn btn--primario" disabled={enviando}>
            {enviando ? 'Entrando…' : esRegistro ? 'Crear cuenta' : 'Entrar'}
          </button>
        </form>

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
      </div>
    </main>
  );
}
