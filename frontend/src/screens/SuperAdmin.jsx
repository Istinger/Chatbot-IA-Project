import { useCallback, useEffect, useMemo, useState } from 'react';
import { api } from '../lib/api';
import Icon from '../components/Icon';

function fecha(valor) {
  if (!valor) return 'Sin fecha';
  return new Intl.DateTimeFormat('es-EC', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(valor));
}

function nombreEquipo(userAgent) {
  const ua = String(userAgent || '');
  const navegador = ua.includes('Edg/')
    ? 'Edge'
    : ua.includes('Firefox/')
      ? 'Firefox'
      : ua.includes('Chrome/')
        ? 'Chrome'
        : ua.includes('Safari/')
          ? 'Safari'
          : 'Navegador';
  const sistema = ua.includes('Windows')
    ? 'Windows'
    : ua.includes('Mac OS')
      ? 'macOS'
      : ua.includes('Linux')
        ? 'Linux'
        : 'PC';
  return `${navegador} · ${sistema}`;
}

function Equipo({ equipo, onRevisar, ocupado }) {
  const pendiente = equipo.status === 'pending';
  const aprobado = equipo.status === 'approved';

  return (
    <article className={`admin-device admin-device--${equipo.status}`}>
      <div className="admin-device__main">
        <span className="admin-device__icon"><Icon name="maletin" size={22} /></span>
        <div>
          <strong>{equipo.ip}</strong>
          <span>{nombreEquipo(equipo.userAgent)} · #{equipo.id.slice(0, 6)}</span>
        </div>
        <span className="admin-device__status">
          {pendiente ? 'Pendiente' : aprobado ? 'Autorizada' : equipo.status === 'rejected' ? 'Rechazada' : 'Revocada'}
        </span>
      </div>
      <dl className="admin-device__meta">
        <div><dt>Solicitud</dt><dd>{fecha(equipo.requestedAt)}</dd></div>
        <div><dt>Revision</dt><dd>{fecha(equipo.reviewedAt)}</dd></div>
      </dl>
      <div className="admin-device__actions">
        {!aprobado && (
          <button
            type="button"
            className="admin-action admin-action--approve"
            onClick={() => onRevisar(equipo.id, 'approved')}
            disabled={ocupado}
            aria-label={`Autorizar ${equipo.ip}`}
          >
            <Icon name="ok" size={18} /> Autorizar
          </button>
        )}
        {pendiente && (
          <button
            type="button"
            className="admin-action"
            onClick={() => onRevisar(equipo.id, 'rejected')}
            disabled={ocupado}
            aria-label={`Rechazar ${equipo.ip}`}
          >
            <Icon name="cerrar" size={18} /> Rechazar
          </button>
        )}
        {aprobado && (
          <button
            type="button"
            className="admin-action admin-action--danger"
            onClick={() => onRevisar(equipo.id, 'revoked')}
            disabled={ocupado}
            aria-label={`Revocar ${equipo.ip}`}
          >
            <Icon name="candado" size={18} /> Revocar
          </button>
        )}
      </div>
    </article>
  );
}

function LoginAdmin({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState(null);

  const enviar = async (e) => {
    e.preventDefault();
    setError(null);
    setEnviando(true);
    try {
      await api.adminLogin(email, password);
      onLogin();
    } catch (err) {
      setError(err.message);
      setEnviando(false);
    }
  };

  return (
    <main className="admin-mobile admin-mobile--login">
      <section className="admin-login">
        <span className="admin-login__icon"><Icon name="candado" size={28} /></span>
        <p className="admin-login__eyebrow">Jobia · Control de acceso</p>
        <h1>Administracion</h1>
        <p>Inicia sesion para revisar las computadoras del laboratorio.</p>

        <form onSubmit={enviar}>
          <label>
            <span>Correo</span>
            <div className="admin-input">
              <Icon name="sobre" size={18} />
              <input
                type="email"
                autoComplete="username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </label>
          <label>
            <span>Contrasena</span>
            <div className="admin-input">
              <Icon name="candado" size={18} />
              <input
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </label>
          {error && <p className="alerta" role="alert">{error}</p>}
          <button type="submit" className="btn btn--primario" disabled={enviando}>
            {enviando ? 'Comprobando...' : 'Entrar'}
            <Icon name="derecha" size={18} />
          </button>
        </form>
      </section>
    </main>
  );
}

export default function SuperAdmin() {
  const [autenticado, setAutenticado] = useState(null);
  const [equipos, setEquipos] = useState([]);
  const [error, setError] = useState(null);
  const [ocupado, setOcupado] = useState(null);
  const [allowAll, setAllowAll] = useState(false);
  const [cambiandoModo, setCambiandoModo] = useState(false);

  const cargar = useCallback(async () => {
    try {
      const [lista, configuracion] = await Promise.all([
        api.adminDispositivos(),
        api.adminConfiguracionAcceso(),
      ]);
      setEquipos(lista);
      setAllowAll(Boolean(configuracion.allowAll));
      setError(null);
    } catch (err) {
      if (err.status === 401) setAutenticado(false);
      else setError(err.message);
    }
  }, []);

  useEffect(() => {
    api.adminSesion()
      .then(() => setAutenticado(true))
      .catch(() => setAutenticado(false));
  }, []);

  useEffect(() => {
    if (!autenticado) return undefined;
    cargar();
    const intervalo = setInterval(cargar, 3000);
    return () => clearInterval(intervalo);
  }, [autenticado, cargar]);

  const grupos = useMemo(() => ({
    pendientes: equipos.filter((equipo) => equipo.status === 'pending'),
    autorizadas: equipos.filter((equipo) => equipo.status === 'approved'),
    otras: equipos.filter((equipo) => !['pending', 'approved'].includes(equipo.status)),
  }), [equipos]);

  const revisar = async (id, status) => {
    setOcupado(id);
    try {
      await api.adminRevisarDispositivo(id, status);
      await cargar();
    } catch (err) {
      setError(err.message);
    } finally {
      setOcupado(null);
    }
  };

  const salir = async () => {
    await api.adminLogout().catch(() => {});
    setAutenticado(false);
  };

  const cambiarModo = async (event) => {
    const activo = event.target.checked;
    setAllowAll(activo);
    setCambiandoModo(true);
    setError(null);
    try {
      const configuracion = await api.adminCambiarAccesoLibre(activo);
      setAllowAll(Boolean(configuracion.allowAll));
    } catch (err) {
      setAllowAll(!activo);
      setError(err.message);
    } finally {
      setCambiandoModo(false);
    }
  };

  if (autenticado == null) {
    return <div className="cargando">Comprobando acceso...</div>;
  }
  if (!autenticado) return <LoginAdmin onLogin={() => setAutenticado(true)} />;

  const seccion = (titulo, lista, vacio) => (
    <section className="admin-section">
      <header>
        <h2>{titulo}</h2>
        <span>{lista.length}</span>
      </header>
      {lista.length
        ? lista.map((equipo) => (
          <Equipo
            key={equipo.id}
            equipo={equipo}
            onRevisar={revisar}
            ocupado={ocupado === equipo.id}
          />
        ))
        : <p className="admin-section__empty">{vacio}</p>}
    </section>
  );

  return (
    <main className="admin-mobile">
      <header className="admin-head">
        <div>
          <p>Jobia · Casa abierta</p>
          <h1>Computadoras</h1>
        </div>
        <div className="admin-head__actions">
          <button type="button" onClick={cargar} aria-label="Actualizar">
            <Icon name="refrescar" size={20} />
          </button>
          <button type="button" onClick={salir} aria-label="Cerrar sesion">
            <Icon name="salir" size={20} />
          </button>
        </div>
      </header>

      <div className="admin-summary">
        <div><strong>{grupos.pendientes.length}</strong><span>Pendientes</span></div>
        <div><strong>{grupos.autorizadas.length}</strong><span>Autorizadas</span></div>
      </div>

      <label className={`admin-bypass ${allowAll ? 'admin-bypass--on' : ''}`}>
        <span className="admin-bypass__check">
          <input
            type="checkbox"
            checked={allowAll}
            onChange={cambiarModo}
            disabled={cambiandoModo}
          />
          <i aria-hidden="true"><Icon name="ok" size={15} /></i>
        </span>
        <span>
          <strong>Permitir acceso sin solicitud</strong>
          <small>
            {allowAll
              ? 'Activo: cualquier PC entra directamente al generador de CV.'
              : 'Emergencia: actívalo si las aprobaciones individuales fallan.'}
          </small>
        </span>
      </label>

      {error && <p className="alerta" role="alert">{error}</p>}
      {seccion('Solicitudes pendientes', grupos.pendientes, 'No hay solicitudes nuevas.')}
      {seccion('Computadoras autorizadas', grupos.autorizadas, 'Ninguna computadora autorizada.')}
      {grupos.otras.length > 0 && seccion('Historial', grupos.otras, '')}
    </main>
  );
}
