import Icon from '../components/Icon';

const MENSAJES = {
  not_requested: {
    titulo: 'Esta computadora necesita acceso',
    texto: 'Solicita autorizacion y espera a que sea aceptada desde el panel de la demostracion.',
    boton: 'Solicitar acceso',
  },
  pending: {
    titulo: 'Solicitud enviada',
    texto: 'Esta computadora esta esperando aprobacion. La pantalla se actualizara automaticamente.',
    boton: null,
  },
  rejected: {
    titulo: 'Solicitud rechazada',
    texto: 'Puedes volver a solicitar acceso si esta computadora debe participar.',
    boton: 'Volver a solicitar',
  },
  revoked: {
    titulo: 'Acceso revocado',
    texto: 'Esta computadora ya no esta autorizada. Solicita acceso nuevamente si fue un error.',
    boton: 'Solicitar nuevamente',
  },
};

export function MobileBlocked() {
  return (
    <main className="access-gate access-gate--mobile">
      <section className="access-card">
        <span className="access-card__icon"><Icon name="aviso" size={30} /></span>
        <p className="access-card__eyebrow">Casa abierta</p>
        <h1>Jobia se usa desde las computadoras del laboratorio</h1>
        <p>Este telefono no puede entrar a la aplicacion.</p>
      </section>
    </main>
  );
}

export function AdminDesktopBlocked() {
  return (
    <main className="access-gate">
      <section className="access-card">
        <span className="access-card__icon"><Icon name="candado" size={30} /></span>
        <p className="access-card__eyebrow">Panel administrativo</p>
        <h1>Abre esta ruta desde tu telefono</h1>
        <p>El panel de autorizaciones no esta disponible en computadoras.</p>
      </section>
    </main>
  );
}

export default function AccessRequest({
  estado,
  solicitando,
  error,
  onSolicitar,
  onReintentar,
}) {
  const contenido = MENSAJES[estado] || MENSAJES.not_requested;

  return (
    <main className="access-gate">
      <section className="access-card">
        <span className="access-card__icon access-card__icon--pulse">
          <Icon name="candado" size={32} />
        </span>
        <p className="access-card__eyebrow">Jobia · Casa abierta</p>
        <h1>{contenido.titulo}</h1>
        <p>{contenido.texto}</p>

        {estado === 'pending' && (
          <div className="access-wait" role="status">
            <span aria-hidden="true" />
            Esperando aprobacion
          </div>
        )}

        {error && <p className="alerta" role="alert">{error}</p>}

        <div className="access-card__actions">
          {contenido.boton && (
            <button
              type="button"
              className="btn btn--primario"
              onClick={onSolicitar}
              disabled={solicitando}
            >
              <Icon name="enviar" size={18} />
              {solicitando ? 'Enviando...' : contenido.boton}
            </button>
          )}
          {error && (
            <button type="button" className="btn btn--glass" onClick={onReintentar}>
              <Icon name="refrescar" size={18} />
              Reintentar
            </button>
          )}
        </div>
      </section>
    </main>
  );
}
