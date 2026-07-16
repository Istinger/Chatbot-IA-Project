import { useRef, useState } from 'react';
import { api } from '../lib/api';
import { useAuth } from '../lib/auth';
import Icon from '../components/Icon';
import AvisosTelegram from '../components/AvisosTelegram';

export default function Profile() {
  const { perfil, refrescar, salir } = useAuth();
  const inputArchivo = useRef(null);

  const [estado, setEstado] = useState(null); // { tipo: 'ok'|'error', texto }
  const [ocupado, setOcupado] = useState(false);

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
    const quedan = perfil.skills.filter((s) => s !== skill);
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

  return (
    <>
      <header className="saludo">
        <h1>Tu perfil</h1>
        <p className="saludo__sub">
          Esto es lo que el motor de busqueda sabe de ti. Cambiarlo cambia tus
          recomendaciones al instante.
        </p>
      </header>

      <section className="panel">
        <h2 className="carrusel__title">Habilidades</h2>
        <p className="onb__sub">
          {perfil?.skills?.length
            ? 'Pulsa una habilidad para quitarla.'
            : 'Aun no tienes habilidades. Sube tu CV.'}
        </p>

        <ul className="chips chips--grandes">
          {perfil?.skills?.map((s) => (
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
      </section>

      <section className="panel">
        <h2 className="carrusel__title">Curriculum</h2>
        <p className="onb__sub">
          {perfil?.tieneCv
            ? `Tenemos tu CV (${perfil.cvLongitud} caracteres de texto). Subir uno nuevo lo reemplaza.`
            : 'No tenemos tu CV.'}
        </p>

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

        {estado && (
          <p className={estado.tipo === 'ok' ? 'exito' : 'alerta'} role="status">
            <Icon name={estado.tipo === 'ok' ? 'ok' : 'aviso'} size={16} />
            {estado.texto}
          </p>
        )}
      </section>

      <AvisosTelegram />

      <section className="panel">
        <h2 className="carrusel__title">Sesion</h2>
        <p className="onb__sub">
          {perfil?.email ? (
            <>
              Sesion iniciada como <strong>{perfil.email}</strong>.
            </>
          ) : (
            'Sesion iniciada.'
          )}
        </p>

        <button type="button" className="btn btn--salir" onClick={salir}>
          <Icon name="salir" size={18} />
          Cerrar sesion
        </button>
      </section>
    </>
  );
}
