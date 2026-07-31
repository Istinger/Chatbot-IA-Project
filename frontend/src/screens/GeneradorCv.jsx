import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../components/Icon';
import { api } from '../lib/api';
import { useAuth } from '../lib/auth';
import { crearCvPdf, descargarPdf } from '../lib/cvPdf';
import { registrarAnimacion } from '../lib/animacion';

const PERSONAS_DEMO = [
  { nombre: 'Ana Torres', correo: 'ana@correo.com' },
  { nombre: 'Carlos Mena', correo: 'carlos@email.com' },
  { nombre: 'Sofia Vega', correo: 'sofia@ejemplo.com' },
  { nombre: 'Diego Castro', correo: 'diego@correo.com' },
];

const OPCIONES = {
  nombre: PERSONAS_DEMO.map((persona) => persona.nombre),
  telefono: ['+593 99 000 0000', '+593 98 123 4567', '+593 96 555 4321'],
  ciudad: ['Quito, Ecuador', 'Guayaquil, Ecuador', 'Cuenca, Ecuador', 'Remoto'],
  rol: [
    'Desarrollador frontend',
    'Desarrollador backend',
    'Desarrollador full stack',
    'Analista de datos',
    'Soporte tecnico',
    'Disenador UX/UI',
    'Especialista en ciberseguridad',
    'Administrador de sistemas',
  ],
  nivel: ['Sin experiencia', 'Practicante', 'Junior', 'Intermedio', 'Senior'],
  estudios: [
    'Bachillerato',
    'Tecnologia en curso',
    'Tecnologia completada',
    'Universidad en curso',
    'Titulo universitario',
    'Autodidacta',
  ],
  carrera: [
    'Ingenieria en Software',
    'Tecnologias de la Informacion',
    'Ciencias de la Computacion',
    'Diseno Digital',
    'Administracion de Empresas',
    'Analisis de Datos',
  ],
  experiencia: [
    'Sin experiencia laboral',
    'Proyectos academicos',
    'Practicas preprofesionales',
    'Menos de 1 ano',
    '1 a 2 anos',
    '3 a 5 anos',
    'Mas de 5 anos',
  ],
  puesto: [
    'Proyecto academico',
    'Desarrollador junior',
    'Asistente de soporte',
    'Analista junior',
    'Freelance',
  ],
  proyecto: [
    'Aplicacion web responsiva',
    'API y base de datos',
    'Dashboard de datos',
    'Automatizacion de procesos',
    'Diseno de experiencia de usuario',
    'Laboratorio de ciberseguridad',
  ],
  skill: [
    'JavaScript',
    'React',
    'Node.js',
    'Python',
    'SQL',
    'Git',
    'Docker',
    'Excel',
    'Power BI',
    'Soporte tecnico',
    'Comunicacion',
    'Trabajo en equipo',
  ],
  idioma: [
    'Espanol - Nativo',
    'Ingles - Basico',
    'Ingles - Intermedio',
    'Ingles - Avanzado',
    'Portugues - Basico',
  ],
};

const INICIAL = {
  nombre: '',
  email: '',
  telefono: '',
  ciudad: '',
  rol: '',
  nivel: 'Junior',
  perfil: '',
  estudios: 'Universidad en curso',
  carrera: '',
  experiencia: 'Proyectos academicos',
  puesto: 'Proyecto academico',
  proyecto: 'Aplicacion web responsiva',
};

const coincideCon = (opcion, texto) => (
  opcion.toLocaleLowerCase().includes(texto.trim().toLocaleLowerCase())
);

function ComboEditable({ label, value, onChange, options, placeholder, required = false, type = 'text', editable = false }) {
  const id = useId();
  const [abierto, setAbierto] = useState(false);
  const opcionesFiltradas = options.filter((opcion) => (
    coincideCon(opcion, value)
  ));
  const muestraOpciones = abierto && opcionesFiltradas.length > 0;

  return (
    <label className="cvgen__campo" htmlFor={id}>
      <span>{label}</span>
      <div className="cvgen__combobox">
        <input
          id={id}
          type={type}
          value={value}
          onChange={(e) => {
            if (!editable) return;
            const texto = e.target.value;
            onChange(texto);
            setAbierto(options.some((opcion) => coincideCon(opcion, texto)));
          }}
          onFocus={() => setAbierto(true)}
          onKeyDown={(e) => {
            if (e.key === 'Escape' || e.key === 'Enter') setAbierto(false);
          }}
          placeholder={placeholder}
          required={required}
          readOnly={!editable}
          autoComplete="off"
          role="combobox"
          aria-readonly={!editable}
          aria-expanded={muestraOpciones}
          aria-controls={`${id}-opciones`}
        />
        <button
          type="button"
          className="cvgen__desplegar"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => setAbierto((actual) => !actual)}
          aria-label={`Ver opciones de ${label}`}
          aria-expanded={muestraOpciones}
        >
          <Icon name="derecha" size={17} />
        </button>
        {muestraOpciones && (
          <ul id={`${id}-opciones`} className="cvgen__opciones" role="listbox">
            {opcionesFiltradas.map((opcion) => (
              <li key={opcion}>
                <button
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    onChange(opcion);
                    setAbierto(false);
                  }}
                >
                  {opcion}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </label>
  );
}

function SelectorMultiple({ label, opciones, valores, onChange, placeholder }) {
  const id = useId();
  const [texto, setTexto] = useState('');
  const [abierto, setAbierto] = useState(false);
  const opcionesFiltradas = opciones.filter((opcion) => (
    !valores.includes(opcion) && coincideCon(opcion, texto)
  ));
  const muestraOpciones = abierto && opcionesFiltradas.length > 0;

  const agregar = () => {
    const valor = texto.trim();
    if (!valor) return;
    if (!valores.some((item) => item.toLowerCase() === valor.toLowerCase())) {
      onChange([...valores, valor]);
    }
    setTexto('');
    setAbierto(false);
  };

  return (
    <div className="cvgen__campo cvgen__campo--ancho">
      <span>{label}</span>
      <div className="cvgen__combo">
        <div className="cvgen__combobox">
          <input
            id={id}
            value={texto}
            onChange={(e) => {
              const siguiente = e.target.value;
              setTexto(siguiente);
              setAbierto(opciones.some((opcion) => !valores.includes(opcion) && coincideCon(opcion, siguiente)));
            }}
            onFocus={() => setAbierto(true)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                agregar();
              }
              if (e.key === 'Escape') setAbierto(false);
            }}
            placeholder={placeholder}
            autoComplete="off"
            role="combobox"
            aria-expanded={muestraOpciones}
            aria-controls={`${id}-opciones`}
          />
          <button
            type="button"
            className="cvgen__desplegar"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => setAbierto((actual) => !actual)}
            aria-label={`Ver opciones de ${label}`}
            aria-expanded={muestraOpciones}
          >
            <Icon name="derecha" size={17} />
          </button>
          {muestraOpciones && (
            <ul id={`${id}-opciones`} className="cvgen__opciones" role="listbox">
              {opcionesFiltradas.map((opcion) => (
                <li key={opcion}>
                  <button
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      onChange([...valores, opcion]);
                      setTexto('');
                      setAbierto(false);
                    }}
                  >
                    {opcion}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        <button type="button" className="iconbtn" onClick={agregar} aria-label={`Anadir ${label}`}>
          <Icon name="mas" size={18} />
        </button>
      </div>
      {valores.length > 0 && (
        <ul className="cvgen__chips" aria-label={`${label} seleccionados`}>
          {valores.map((valor) => (
            <li key={valor}>
              <button
                type="button"
                onClick={() => onChange(valores.filter((item) => item !== valor))}
                aria-label={`Quitar ${valor}`}
              >
                {valor}<Icon name="cerrar" size={13} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function ResumenEditable({ value, onChange, opciones }) {
  const id = useId();
  const [abierto, setAbierto] = useState(false);
  const opcionesFiltradas = opciones.filter((opcion) => (
    coincideCon(opcion, value)
  ));
  const muestraOpciones = abierto && opcionesFiltradas.length > 0;

  return (
    <label className="cvgen__campo cvgen__campo--ancho" htmlFor={id}>
      <span>Resumen profesional</span>
      <div className="cvgen__combobox cvgen__combobox--texto">
        <textarea
          id={id}
          rows="4"
          value={value}
          onChange={(e) => {
            const texto = e.target.value;
            onChange(texto);
            setAbierto(opciones.some((opcion) => coincideCon(opcion, texto)));
          }}
          onFocus={() => setAbierto(true)}
          onKeyDown={(e) => e.key === 'Escape' && setAbierto(false)}
          placeholder={opciones[0]}
          role="combobox"
          aria-expanded={muestraOpciones}
          aria-controls={`${id}-opciones`}
        />
        <button
          type="button"
          className="cvgen__desplegar"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => setAbierto((actual) => !actual)}
          aria-label="Ver opciones de resumen profesional"
          aria-expanded={muestraOpciones}
        >
          <Icon name="derecha" size={17} />
        </button>
        {muestraOpciones && (
          <ul id={`${id}-opciones`} className="cvgen__opciones" role="listbox">
            {opcionesFiltradas.map((opcion) => (
              <li key={opcion}>
                <button
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    onChange(opcion);
                    setAbierto(false);
                  }}
                >
                  {opcion}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </label>
  );
}

function VistaPrevia({ datos, skills, idiomas }) {
  const iniciales = datos.nombre
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((parte) => parte[0]?.toUpperCase())
    .join('') || 'CV';

  return (
    <article className="cvprev" aria-label="Vista previa del curriculum">
      <aside className="cvprev__lado">
        <span className="cvprev__avatar">{iniciales}</span>
        <section>
          <h3>Contacto</h3>
          <p>{datos.email || 'correo@ejemplo.com'}</p>
          <p>{datos.telefono || 'Telefono'}</p>
          <p>{datos.ciudad || 'Ciudad'}</p>
        </section>
        <section>
          <h3>Habilidades</h3>
          {(skills.length ? skills : ['Tus habilidades']).slice(0, 8).map((skill) => (
            <p key={skill}>{skill}</p>
          ))}
        </section>
        <section>
          <h3>Idiomas</h3>
          {(idiomas.length ? idiomas : ['Tus idiomas']).map((idioma) => <p key={idioma}>{idioma}</p>)}
        </section>
      </aside>
      <div className="cvprev__cuerpo">
        <header>
          <h2>{datos.nombre || 'Tu nombre'}</h2>
          <p>{datos.rol || 'Perfil profesional'} · {datos.nivel}</p>
        </header>
        <section>
          <h3>Perfil profesional</h3>
          <p>{datos.perfil || 'Tu resumen profesional aparecera aqui.'}</p>
        </section>
        <section>
          <h3>Experiencia</h3>
          <strong>{datos.puesto}</strong>
          <p>{datos.experiencia}</p>
        </section>
        <section>
          <h3>Formacion</h3>
          <strong>{datos.carrera || 'Tu carrera'}</strong>
          <p>{datos.estudios}</p>
        </section>
        <section>
          <h3>Proyecto destacado</h3>
          <strong>{datos.proyecto}</strong>
        </section>
      </div>
    </article>
  );
}

function resumenSugerido(datos, skills) {
  const herramientas = skills.slice(0, 3).join(', ');
  return `${datos.rol || 'Profesional'} de nivel ${datos.nivel.toLowerCase()}, con experiencia en ${datos.experiencia.toLowerCase()}. Me interesa aportar soluciones claras${herramientas ? ` aplicando ${herramientas}` : ''}, aprender de forma continua y colaborar con equipos orientados a resultados.`;
}

export default function GeneradorCv() {
  const { registrarDemo, refrescar } = useAuth();
  const navegar = useNavigate();
  const contenedorRef = useRef(null);
  const cuentaCreada = useRef(false);
  const [paso, setPaso] = useState(1);
  const [datos, setDatos] = useState(INICIAL);
  const [correosDemo, setCorreosDemo] = useState(PERSONAS_DEMO.map((persona) => persona.correo));
  const [skills, setSkills] = useState([]);
  const [idiomas, setIdiomas] = useState([]);
  const [error, setError] = useState('');
  const [procesando, setProcesando] = useState(false);

  const progreso = useMemo(() => `${paso} de 3`, [paso]);
  const cambiar = (campo, valor) => setDatos((actual) => ({ ...actual, [campo]: valor }));
  const correoVinculado = useMemo(() => {
    const nombre = datos.nombre.trim().toLowerCase();
    const indice = OPCIONES.nombre.findIndex((opcion) => opcion.toLowerCase() === nombre);
    return indice >= 0 ? correosDemo[indice] : '';
  }, [datos.nombre, correosDemo]);
  const opcionesResumen = useMemo(() => [
    resumenSugerido(datos, skills),
    `${datos.rol || 'Profesional'} ${datos.nivel.toLowerCase()} con interes en resolver necesidades reales, aprender de forma continua y aportar al trabajo colaborativo.`,
    `Perfil orientado a ${datos.rol || 'nuevos retos profesionales'}, con experiencia en ${datos.experiencia.toLowerCase()} y disposicion para seguir desarrollando habilidades tecnicas.`,
  ], [datos, skills]);

  const cambiarNombre = (nombre) => {
    const indice = OPCIONES.nombre.findIndex((opcion) => opcion.toLowerCase() === nombre.trim().toLowerCase());
    setDatos((actual) => ({
      ...actual,
      nombre,
      email: indice >= 0 ? correosDemo[indice] : actual.email,
    }));
  };

  useEffect(() => {
    contenedorRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  }, [paso]);

  useEffect(() => {
    let activo = true;
    api.correosDemo(PERSONAS_DEMO.map((persona) => persona.correo))
      .then(({ emails }) => {
        if (activo && emails?.length) setCorreosDemo(emails);
      })
      // Sin conexion se conservan las opciones locales y el registro demo
      // resolvera el sufijo cuando la API vuelva a estar disponible.
      .catch(() => {});
    return () => { activo = false; };
  }, []);

  useEffect(() => {
    if (correoVinculado && correoVinculado !== datos.email) cambiar('email', correoVinculado);
  }, [correoVinculado]);

  const siguiente = () => {
    setError('');
    if (paso === 1 && (!datos.nombre.trim() || !datos.email.includes('@') || !datos.rol.trim())) {
      setError('Completa nombre, correo y perfil profesional.');
      return;
    }
    if (paso === 2 && (!datos.carrera.trim() || skills.length === 0 || idiomas.length === 0)) {
      setError('Elige una carrera, al menos una habilidad y un idioma.');
      return;
    }
    if (paso === 2 && !datos.perfil.trim()) {
      cambiar('perfil', resumenSugerido(datos, skills));
    }
    setPaso((actual) => Math.min(actual + 1, 3));
  };

  const descargarYContinuar = async () => {
    setError('');
    setProcesando(true);

    try {
      let datosFinales = { ...datos };

      if (!cuentaCreada.current) {
        const claveTemporal = `Jobia-${crypto.randomUUID()}!`;
        const registro = await registrarDemo(datos.email, claveTemporal);
        datosFinales = { ...datosFinales, email: registro.user.email };
        cambiar('email', registro.user.email);
        cuentaCreada.current = true;
      }

      const completos = {
        ...datosFinales,
        perfil: datosFinales.perfil || resumenSugerido(datosFinales, skills),
        skills,
        idiomas,
      };
      const pdf = await crearCvPdf(completos);
      descargarPdf(pdf.blob, pdf.archivo);

      await api.subirCv(pdf.file);
      await api.guardarSkills(skills);
      registrarAnimacion('cv_generado', {
        nombre: datos.nombre,
        rol: datos.rol,
        skills,
        archivo: pdf.archivo,
        ofertas: 'Perfil listo para recibir ofertas',
      });
      await refrescar();
      navegar('/onboarding', {
        replace: true,
        state: {
          cvGenerado: {
            nombreArchivo: pdf.archivo,
            nombre: datos.nombre,
            rol: datos.rol,
            skills,
          },
        },
      });
    } catch (err) {
      setError(err.message || 'No se pudo guardar el CV. Intenta nuevamente.');
      setProcesando(false);
    }
  };

  return (
    <main ref={contenedorRef} className="cvgen">
      <header className="cvgen__cab">
        <div>
          <span className="cvgen__marca">JOBIA · CV EXPRESS</span>
          <h1>Crea tu curriculum</h1>
          <p>Completa tu perfil y sal con un CV listo para usar.</p>
        </div>
        <span className="cvgen__progreso">Paso {progreso}</span>
      </header>

      <div className="cvgen__layout">
        <section className="cvgen__panel">
          <nav className="cvgen__pasos" aria-label="Pasos del generador">
            {['Datos', 'Perfil', 'Revisar'].map((nombre, indice) => (
              <button
                key={nombre}
                type="button"
                className={paso === indice + 1 ? 'is-on' : ''}
                onClick={() => indice + 1 < paso && setPaso(indice + 1)}
                disabled={indice + 1 > paso}
              >
                <span>{indice + 1}</span>{nombre}
              </button>
            ))}
          </nav>

          {paso === 1 && (
            <div className="cvgen__form">
              <ComboEditable label="Nombre completo" value={datos.nombre} onChange={cambiarNombre} options={OPCIONES.nombre} placeholder="Elige o escribe tu nombre" required editable />
              <label className="cvgen__campo">
                <span>Correo</span>
                <input
                  className={correoVinculado ? 'cvgen__correo-vinculado' : ''}
                  type="email"
                  value={datos.email}
                  onChange={(e) => cambiar('email', e.target.value)}
                  placeholder="Escribe tu correo"
                  readOnly={Boolean(correoVinculado)}
                  required
                />
              </label>
              <ComboEditable label="Telefono" value={datos.telefono} onChange={(v) => cambiar('telefono', v)} options={OPCIONES.telefono} placeholder="Elige o escribe tu telefono" type="tel" />
              <ComboEditable label="Ciudad o modalidad" value={datos.ciudad} onChange={(v) => cambiar('ciudad', v)} options={OPCIONES.ciudad} placeholder="Elige o escribe" />
              <ComboEditable label="Perfil profesional" value={datos.rol} onChange={(v) => cambiar('rol', v)} options={OPCIONES.rol} placeholder="Elige o escribe tu profesion" required />
              <ComboEditable label="Nivel" value={datos.nivel} onChange={(v) => cambiar('nivel', v)} options={OPCIONES.nivel} placeholder="Elige" editable={false} />
            </div>
          )}

          {paso === 2 && (
            <div className="cvgen__form">
              <ComboEditable label="Nivel de estudios" value={datos.estudios} onChange={(v) => cambiar('estudios', v)} options={OPCIONES.estudios} placeholder="Elige o escribe" />
              <ComboEditable label="Carrera o especialidad" value={datos.carrera} onChange={(v) => cambiar('carrera', v)} options={OPCIONES.carrera} placeholder="Elige o escribe" required />
              <ComboEditable label="Experiencia" value={datos.experiencia} onChange={(v) => cambiar('experiencia', v)} options={OPCIONES.experiencia} placeholder="Elige o escribe" />
              <ComboEditable label="Ultimo puesto o actividad" value={datos.puesto} onChange={(v) => cambiar('puesto', v)} options={OPCIONES.puesto} placeholder="Elige o escribe" />
              <ComboEditable label="Proyecto destacado" value={datos.proyecto} onChange={(v) => cambiar('proyecto', v)} options={OPCIONES.proyecto} placeholder="Elige o escribe" />
              <SelectorMultiple label="Habilidades" opciones={OPCIONES.skill} valores={skills} onChange={setSkills} placeholder="Elige o escribe una habilidad" />
              <SelectorMultiple label="Idiomas" opciones={OPCIONES.idioma} valores={idiomas} onChange={setIdiomas} placeholder="Elige o escribe idioma y nivel" />
              <ResumenEditable value={datos.perfil} onChange={(v) => cambiar('perfil', v)} opciones={opcionesResumen} />
            </div>
          )}

          {paso === 3 && (
            <div className="cvgen__final">
              <span className="cvgen__listo"><Icon name="ok" size={24} /></span>
              <h2>Tu CV esta listo</h2>
              <p>Se descargara en PDF y quedara vinculado a tu nuevo perfil de Jobia.</p>
              <dl>
                <div><dt>Perfil</dt><dd>{datos.rol}</dd></div>
                <div><dt>Habilidades</dt><dd>{skills.length}</dd></div>
                <div><dt>Idioma</dt><dd>{idiomas[0]}</dd></div>
              </dl>
            </div>
          )}

          {error && <p className="alerta" role="alert"><Icon name="aviso" size={16} />{error}</p>}

          <footer className="cvgen__acciones">
            {paso > 1 && (
              <button type="button" className="btn btn--glass" onClick={() => setPaso((p) => p - 1)} disabled={procesando}>
                <Icon name="atras" size={17} /> Anterior
              </button>
            )}
            {paso < 3 ? (
              <button type="button" className="btn btn--primario" onClick={siguiente}>
                Continuar <Icon name="flecha" size={17} />
              </button>
            ) : (
              <button type="button" className="btn btn--primario" onClick={descargarYContinuar} disabled={procesando}>
                <Icon name="descargar" size={18} />
                {procesando ? 'Guardando perfil...' : 'Descargar CV y continuar'}
              </button>
            )}
          </footer>
        </section>

        <div className="cvgen__preview">
          <span className="cvgen__preview-titulo">Vista previa</span>
          <VistaPrevia datos={datos} skills={skills} idiomas={idiomas} />
        </div>
      </div>
    </main>
  );
}
