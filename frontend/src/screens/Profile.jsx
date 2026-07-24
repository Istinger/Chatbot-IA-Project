import { useEffect, useRef, useState } from 'react';
import { api } from '../lib/api';
import { useAuth } from '../lib/auth';
import { useVista } from '../lib/vista';
import Icon from '../components/Icon';
import AvisosTelegram from '../components/AvisosTelegram';

export default function Profile() {
  const { perfil, refrescar, salir } = useAuth();
  const { pedirIA, setContextoPantalla } = useVista();
  const inputArchivo = useRef(null);

  const [estado, setEstado] = useState(null); // { tipo: 'ok'|'error', texto }
  const [ocupado, setOcupado] = useState(false);
  const [nuevaSkill, setNuevaSkill] = useState('');

  const skills = perfil?.skills ?? [];

  // El chat conoce tu perfil mientras estas aqui (skills + estado del CV), asi
  // tambien responde bien a lo que escribas a mano. Se limpia al salir.
  useEffect(() => {
    const cv = perfil?.tieneCv ? `tiene un CV de ${perfil.cvLongitud} caracteres` : 'aun no ha subido su CV';
    setContextoPantalla(
      `El usuario esta en "Tu perfil". Sus habilidades: ${skills.join(', ') || '(ninguna)'}. ${cv}.`,
    );
    return () => setContextoPantalla(null);
    // skills se deriva de perfil; con perfil basta para reaccionar a los cambios.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [perfil, setContextoPantalla]);

  // Estado del CV en texto, para reutilizar en los mensajes a la IA.
  const cvTexto = perfil?.tieneCv
    ? `Tengo un CV de ${perfil.cvLongitud} caracteres`
    : 'Todavia no he subido mi CV';
  const skillsTexto = skills.join(', ') || '(ninguna todavia)';

  const subir = async (file) => {
    if (!file) return;
    setEstado(null);
    setOcupado(true);
    try {
      const r = await api.subirCv(file);
      await refrescar();
      setEstado({
        tipo: 'ok',
        texto: `CV actualizado. Detectamos ${r.skillsDetectadas.length} habilidades.`,
      });
    } catch (err) {
      setEstado({ tipo: 'error', texto: err.message });
    } finally {
      setOcupado(false);
    }
  };

  const quitar = async (skill) => {
    const quedan = skills.filter((s) => s !== skill);
    if (!quedan.length) {
      setEstado({ tipo: 'error', texto: 'Necesitas al menos una habilidad.' });
      return;
    }
    setOcupado(true);
    try {
      await api.guardarSkills(quedan);
      await refrescar();
    } catch (err) {
      setEstado({ tipo: 'error', texto: err.message });
    } finally {
      setOcupado(false);
    }
  };

  const agregar = async (e) => {
    e.preventDefault();
    const s = nuevaSkill.trim().toLowerCase();
    if (!s) return;
    if (skills.includes(s)) {
      setEstado({ tipo: 'error', texto: `Ya tienes "${s}".` });
      setNuevaSkill('');
      return;
    }
    setEstado(null);
    setOcupado(true);
    try {
      await api.guardarSkills([...skills, s]);
      await refrescar();
      setNuevaSkill('');
    } catch (err) {
      setEstado({ tipo: 'error', texto: err.message });
    } finally {
      setOcupado(false);
    }
  };

  // Consultas al asistente (mensajes autocontenidos con tus datos). La respuesta
  // sale en el panel del chat.
  const analizarPerfil = () =>
    pedirIA(
      `Analiza mi perfil profesional para el mercado tech (Ecuador y remoto). Mis habilidades: ${skillsTexto}. ${cvTexto}. Dime mis fortalezas, mis puntos debiles y 2-3 cosas concretas que deberia mejorar.`,
    );
  const sugerirSkills = () =>
    pedirIA(
      `Segun mi perfil (habilidades: ${skillsTexto}) y la demanda actual del sector tech, que habilidades me convendria aprender o añadir? Priorizalas y explica brevemente por que cada una.`,
    );
  const consejosCv = () =>
    pedirIA(
      `${cvTexto}. Mis habilidades: ${skillsTexto}. Dame consejos concretos para mejorar mi CV: que destacar, que reforzar y errores comunes a evitar.`,
    );

  return (
    <>
      <header className="saludo">
        <h1>Tu perfil</h1>
        <p className="saludo__sub">
          Esto es lo que el motor de busqueda sabe de ti. Cambialo y mejora tus
          recomendaciones al instante.
        </p>
      </header>

      <section className="panel">
        <header className="seccion__cab">
          <span className="seccion__icono seccion__icono--cursos"><Icon name="chispa" size={20} /></span>
          <div className="seccion__txt">
            <h2 className="seccion__titulo">Habilidades</h2>
            <p className="seccion__sub">
              {perfil?.skills?.length
                ? 'Pulsa una habilidad para quitarla.'
                : 'Aun no tienes habilidades. Sube tu CV.'}
            </p>
          </div>
          <span className="panel__grip" aria-hidden="true" />
        </header>

        <ul className="chips chips--grandes">
          {skills.map((s) => (
            <li key={s}>
              <button
                type="button"
                className="chip chip--btn chip--on"
                onClick={() => quitar(s)}
                disabled={ocupado}
                aria-label={`Quitar ${s}`}
              >
                {s}
                <Icon name="cerrar" size={14} />
              </button>
            </li>
          ))}
        </ul>

        <form className="perfil__skilladd" onSubmit={agregar}>
          <input
            className="perfil__skillinput"
            value={nuevaSkill}
            onChange={(e) => setNuevaSkill(e.target.value)}
            placeholder="Añadir una habilidad… (ej. kubernetes)"
            aria-label="Añadir habilidad"
            autoComplete="off"
            disabled={ocupado}
          />
          <button type="submit" className="btn btn--glass" disabled={ocupado || !nuevaSkill.trim()}>
            <Icon name="chispa2" size={18} /> Añadir
          </button>
        </form>

        <div className="perfil__ia">
          <button type="button" className="perfil__iabtn" onClick={sugerirSkills}>
            <Icon name="asistente" size={16} /> Sugerir habilidades
          </button>
          <button type="button" className="perfil__iabtn" onClick={analizarPerfil}>
            <Icon name="asistente" size={16} /> Analizar mi perfil
          </button>
        </div>
      </section>

      <section className="panel">
        <header className="seccion__cab">
          <span className="seccion__icono"><Icon name="maletin" size={20} /></span>
          <div className="seccion__txt">
            <h2 className="seccion__titulo">Curriculum</h2>
            <p className="seccion__sub">
              {perfil?.tieneCv
                ? `Tenemos tu CV (${perfil.cvLongitud} caracteres de texto). Sube uno nuevo para reemplazarlo.`
                : 'No tenemos tu CV.'}
            </p>
          </div>
          <span className="panel__grip" aria-hidden="true" />
        </header>

        <button
          type="button"
          className="btn btn--glass"
          onClick={() => inputArchivo.current?.click()}
          disabled={ocupado}
        >
          <Icon name="subir" size={18} />
          {ocupado ? 'Procesando…' : perfil?.tieneCv ? 'Reemplazar CV' : 'Subir CV'}
        </button>

        <input
          ref={inputArchivo}
          type="file"
          accept="application/pdf"
          className="sr-only"
          onChange={(e) => subir(e.target.files?.[0])}
        />

        <div className="perfil__ia">
          <button type="button" className="perfil__iabtn" onClick={consejosCv}>
            <Icon name="asistente" size={16} /> Consejos para mi CV
          </button>
        </div>

        {estado && (
          <p className={estado.tipo === 'ok' ? 'exito' : 'alerta'} role="status">
            <Icon name={estado.tipo === 'ok' ? 'ok' : 'aviso'} size={16} />
            {estado.texto}
          </p>
        )}
      </section>

      <AvisosTelegram />

      <section className="panel">
        <header className="seccion__cab">
          <span className="seccion__icono"><Icon name="usuario" size={20} /></span>
          <div className="seccion__txt">
            <h2 className="seccion__titulo">Sesion</h2>
            <p className="seccion__sub">
              {perfil?.email ? (
                <>
                  Sesion iniciada como <strong>{perfil.email}</strong>.
                </>
              ) : (
                'Sesion iniciada.'
              )}
            </p>
          </div>
          <span className="panel__grip" aria-hidden="true" />
        </header>

        <button type="button" className="btn btn--salir" onClick={salir}>
          <Icon name="salir" size={18} />
          Cerrar sesion
        </button>
      </section>
    </>
  );
}
