import { useEffect, useState } from 'react';

// Pantalla de diagnostico de la Parte 1: prueba que el navegador llega al
// frontend, que Nginx enruta /api a la API, y que la API alcanza a Postgres,
// Redis y al microservicio de matching. Se reemplaza por la UI real despues.
export default function App() {
  const [state, setState] = useState({ status: 'cargando' });

  useEffect(() => {
    fetch('/api/health')
      .then((r) => r.json())
      .then((body) => setState({ status: 'listo', body }))
      .catch((err) => setState({ status: 'error', message: err.message }));
  }, []);

  const services = state.body?.data ?? {};

  return (
    <main className="shell">
      <div className="orb" />
      <h1>Agente de Empleo</h1>
      <p className="sub">Verificacion del ciclo completo</p>

      {state.status === 'cargando' && <p className="sub">Consultando /api/health…</p>}

      {state.status === 'error' && (
        <p className="down">No se pudo contactar la API: {state.message}</p>
      )}

      {state.status === 'listo' && (
        <ul className="checks">
          {Object.entries(services)
            .filter(([key]) => key !== 'service')
            .map(([name, value]) => (
              <li key={name} className={value === 'up' ? 'up' : 'down'}>
                <span>{name}</span>
                <span>{value}</span>
              </li>
            ))}
        </ul>
      )}
    </main>
  );
}
