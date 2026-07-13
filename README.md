# Dónde va cada archivo

Estos archivos están nombrados con prefijo solo para agruparlos aquí. En tu
proyecto van renombrados y colocados así:

```
proyecto/
├── backend/
│   └── Dockerfile          ← backend.Dockerfile
├── matching-service/
│   ├── Dockerfile          ← matching.Dockerfile
│   └── requirements.txt    ← requirements.txt
└── frontend/
    ├── Dockerfile          ← frontend.Dockerfile
    └── nginx-spa.conf      ← nginx-spa.conf
```

## Notas

- **backend.Dockerfile** lo usan DOS servicios: `api` y `worker`. El worker
  reutiliza la misma imagen y solo cambia el comando en docker-compose
  (`command: node src/worker.js`).

- **frontend.Dockerfile** compila con Node y sirve con Nginx (build multi-etapa).
  Ese Nginx es INTERNO del contenedor y solo sirve la SPA; no lo confundas con
  Nginx Proxy Manager, que es el que da cara a internet y gestiona el HTTPS.

- Ajusta en **frontend.Dockerfile** la carpeta de salida del build:
  - Vite → `dist` (lo que está puesto)
  - Create React App → `build`

- El **matching-service** no instala modelos de ML: los embeddings se piden a
  OpenRouter por HTTP, por eso la imagen queda liviana.
