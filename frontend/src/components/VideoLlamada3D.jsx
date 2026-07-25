import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { KTX2Loader } from 'three/examples/jsm/loaders/KTX2Loader.js';
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

/**
 * El entrevistador: una cara humana 3D que mira a camara y mueve la boca al hablar.
 *
 * Se carga con lazy import (ver VideoLlamada.jsx) para que three.js NO entre en el
 * bundle inicial: solo se descarga cuando el usuario elige la modalidad video.
 *
 * === Por que el modelo es LOCAL ===
 * La primera version cargaba un avatar de Ready Player Me por URL. Falla: el dominio
 * `readyplayer.me` no resuelve en la red del usuario (ni el CDN ni el dominio raiz),
 * asi que el GLB nunca llegaba y la llamada caia siempre al respaldo. Ahora el modelo
 * se sirve desde `public/`: sin DNS, sin CORS, funciona offline y no puede caducar.
 *
 * Modelo: escaneo facial real de Face Cap (https://www.bannaflak.com/face-cap),
 * el mismo que usa el ejemplo oficial `webgl_morphtargets_face` de three.js. Trae los
 * 52 blendshapes de ARKit, que es lo que permite animar la boca y los ojos.
 * Viene comprimido (EXT_meshopt_compression + KHR_texture_basisu), de ahi el
 * MeshoptDecoder y el KTX2Loader: sin ellos el GLB no se puede abrir.
 *
 * === Por que lip-sync PROCEDURAL y no fonetico ===
 * La libreria de referencia (@met4citizen/talkinghead) exige un TTS de pago (Google
 * Cloud) porque la Web Speech API del navegador no expone el audio ni timestamps de
 * fonemas; y encima su lip-sync no cubre espanol. Este proyecto habla espanol y su
 * presupuesto de IA es de ~$20, asi que se usa el TTS del navegador (gratis) y la boca
 * se anima con el ritmo del habla:
 *
 *   - `hablando`: la mandibula oscila a ~9 Hz con ruido, no en un bucle exacto (un
 *     movimiento perfectamente periodico se lee como robot).
 *   - `pulso`: sube en cada palabra (evento onboundary del TTS) y decae. Eso da los
 *     acentos, que es lo que el ojo interpreta como "esta diciendo palabras".
 *
 * A distancia de videollamada resulta creible; no pretende ser sincronia fonetica.
 *
 * === Lo que lo hace parecer una persona ===
 * Una cara quieta se lee como maniqui. Se anaden micro-conductas involuntarias:
 * parpadeo irregular, balanceo lento de cabeza y mirada que no se queda clavada.
 */

const MODELO = '/modelos/entrevistador.glb';
const BASIS = '/basis/'; // transcoder de KHR_texture_basisu, tambien local

/**
 * Indice de morph targets por nombre corto.
 * El GLB nombra los blendshapes con prefijo (`blendShape1.jawOpen`) y sufijo de lado
 * (`eyeBlink_L`), asi que se guarda la clave sin prefijo para poder pedir "jawOpen"
 * sin saber como los exporto la herramienta.
 */
function indexar(malla) {
  const dic = {};
  for (const [clave, i] of Object.entries(malla.morphTargetDictionary || {})) {
    dic[clave.split('.').pop()] = i;
  }
  return dic;
}

/** Pone un morph target (o su par _L/_R) en todas las mallas que lo tengan. */
function setMorph(mallas, nombre, valor) {
  for (const { malla, dic } of mallas) {
    for (const clave of [nombre, `${nombre}_L`, `${nombre}_R`]) {
      const i = dic[clave];
      if (i !== undefined) malla.morphTargetInfluences[i] = valor;
    }
  }
}

const lerp = (a, b, t) => a + (b - a) * t;

export default function VideoLlamada3D({ hablando, pulso, onListo, onFallo }) {
  const contRef = useRef(null);
  const [estado, setEstado] = useState('cargando'); // cargando | listo | error

  // Los props cambian en cada palabra; el bucle de render los lee por ref para no
  // reconstruir la escena en cada cambio.
  const hablandoRef = useRef(hablando);
  const pulsoRef = useRef(pulso);
  useEffect(() => { hablandoRef.current = hablando; }, [hablando]);
  useEffect(() => { pulsoRef.current = pulso; }, [pulso]);

  useEffect(() => {
    const cont = contRef.current;
    if (!cont) return undefined;

    let renderer;
    let raf;
    let cancelado = false;
    const relojGl = new THREE.Clock();

    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    } catch {
      setEstado('error'); // sin WebGL: el cromo de la llamada sigue funcionando
      onFallo?.();
      return undefined;
    }

    const escena = new THREE.Scene();
    const camara = new THREE.PerspectiveCamera(34, 1, 0.1, 100);

    // Encuadre calculado desde la caja del modelo, no con numeros a mano: asi la cara
    // queda igual de bien encuadrada en el panel ancho del escritorio y en el
    // recuadro mas alto del movil, y se recalcula al cambiar de tamano.
    let objetivo = null; // { centro, tam }
    const encuadrar = () => {
      const { clientWidth: w, clientHeight: h } = cont;
      if (!w || !h) return;
      renderer.setSize(w, h, false);
      camara.aspect = w / h;
      camara.updateProjectionMatrix();

      if (!objetivo) return;
      const { centro, tam } = objetivo;
      const fovV = (camara.fov * Math.PI) / 180;
      // Que la cara ocupe ~78% del alto; y comprobar tambien el ancho, porque en
      // vertical el limite es el otro.
      const porAlto = tam.y / 0.78 / 2 / Math.tan(fovV / 2);
      const fovH = 2 * Math.atan(Math.tan(fovV / 2) * camara.aspect);
      const porAncho = tam.x / 0.72 / 2 / Math.tan(fovH / 2);
      const dist = Math.max(porAlto, porAncho);
      camara.position.set(centro.x, centro.y + tam.y * 0.04, centro.z + dist);
      camara.lookAt(centro.x, centro.y, centro.z);
    };

    // Limitar el pixelRatio: en pantallas 3x renderizar a resolucion nativa cuesta
    // el triple de fragmentos por un detalle que nadie ve en un recuadro de video.
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    cont.appendChild(renderer.domElement);
    encuadrar();

    // La piel es un material PBR: sin mapa de entorno se ve plana y apagada. Se usa
    // el RoomEnvironment de three (procedural, no descarga nada) como luz base.
    const pmrem = new THREE.PMREMGenerator(renderer);
    const entorno = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    escena.environment = entorno;

    // Encima, luces de retrato: principal calida al frente y contra fria desde atras
    // para separar la cara del fondo azul de la "sala".
    const principal = new THREE.DirectionalLight(0xfff1e2, 1.5);
    principal.position.set(0.6, 1.1, 2);
    const contra = new THREE.DirectionalLight(0x5aa2ff, 0.9);
    contra.position.set(-0.8, 0.9, -1.6);
    escena.add(principal, contra);

    const sinMovimiento = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;

    let mallas = [];
    let raiz = null;
    let rotBase = null; // rotacion inicial, para animar sobre ella sin acumular
    let mandibula = 0; // valor suavizado de apertura de boca
    let proxParpadeo = 1.5;
    let parpadeo = 0;

    const ktx2 = new KTX2Loader().setTranscoderPath(BASIS).detectSupport(renderer);

    new GLTFLoader()
      .setKTX2Loader(ktx2)
      .setMeshoptDecoder(MeshoptDecoder)
      .load(
        MODELO,
        (gltf) => {
          if (cancelado) return;
          const modelo = gltf.scene;

          modelo.traverse((o) => {
            if (!o.isMesh) return;
            o.frustumCulled = false; // la cara encuadrada muy cerca se recortaba
            if (o.morphTargetDictionary) mallas.push({ malla: o, dic: indexar(o) });
          });

          if (!mallas.length) {
            // GLB sin blendshapes: no hay boca que animar, mejor el respaldo que una
            // cara congelada.
            setEstado('error');
            onFallo?.();
            return;
          }

          // Ojo: el GLB trae una animacion de captura facial. NO se reproduce a
          // proposito — pelearia con los morphs que controlamos aqui.
          escena.add(modelo);
          raiz = modelo;
          rotBase = modelo.rotation.clone();

          const caja = new THREE.Box3().setFromObject(modelo);
          objetivo = {
            centro: caja.getCenter(new THREE.Vector3()),
            tam: caja.getSize(new THREE.Vector3()),
          };
          encuadrar();

          setEstado('listo');
          onListo?.();
        },
        undefined,
        () => {
          if (cancelado) return;
          // El modelo va en public/, asi que esto solo pasa si el build no lo copio.
          // No es fatal: la llamada continua con el respaldo.
          setEstado('error');
          onFallo?.();
        },
      );

    const animar = () => {
      raf = requestAnimationFrame(animar);
      const t = relojGl.getElapsedTime();
      const dt = Math.min(relojGl.getDelta(), 0.1);

      if (mallas.length) {
        // --- Boca ---
        let objetivoBoca = 0;
        if (hablandoRef.current) {
          // Dos senos desfasados: el ritmo no se repite igual y evita el "tic-tac".
          const onda = 0.5 + 0.5 * Math.sin(t * 9) * Math.sin(t * 2.3 + 1.1);
          objetivoBoca = 0.12 + onda * 0.34 + Math.min(pulsoRef.current || 0, 1) * 0.22;
        }
        // Suavizado: la mandibula tiene inercia, no salta entre valores.
        mandibula = lerp(mandibula, objetivoBoca, 1 - Math.exp(-dt * 18));
        setMorph(mallas, 'jawOpen', mandibula);
        // Los labios no solo se abren: se redondean y se estiran. Con solo jawOpen
        // parece una marioneta de bisagra.
        setMorph(mallas, 'mouthFunnel', mandibula * 0.35);
        setMorph(mallas, 'mouthStretch', mandibula * 0.2);
        setMorph(mallas, 'mouthLowerDown', mandibula * 0.3);
        // Una pizca de sonrisa al hablar: la cara neutra se lee como enfado.
        setMorph(mallas, 'mouthSmile', hablandoRef.current ? 0.14 : 0.07);

        // --- Parpadeo (irregular a proposito) ---
        proxParpadeo -= dt;
        if (proxParpadeo <= 0) {
          parpadeo = 1;
          proxParpadeo = 2.5 + Math.random() * 3.5;
        }
        if (parpadeo > 0) parpadeo = Math.max(0, parpadeo - dt * 7);
        const ojo = parpadeo > 0 ? Math.sin(Math.min(parpadeo, 1) * Math.PI) : 0;
        setMorph(mallas, 'eyeBlink', ojo);

        // --- Cabeza: balanceo lento + acento al hablar ---
        if (raiz && rotBase && !sinMovimiento) {
          const enfasis = hablandoRef.current ? 1 : 0.45;
          raiz.rotation.x = rotBase.x + Math.sin(t * 0.9) * 0.022 * enfasis;
          raiz.rotation.y = rotBase.y + Math.sin(t * 0.6 + 0.8) * 0.05 * enfasis;
          raiz.rotation.z = rotBase.z + Math.sin(t * 0.45) * 0.015 * enfasis;
        }

        // --- Mirada: no clavada al frente ---
        const vertical = Math.sin(t * 0.5) * 0.5 + 0.5;
        setMorph(mallas, 'eyeLookUp', vertical * 0.06);
        setMorph(mallas, 'eyeLookDown', (1 - vertical) * 0.06);
      }

      renderer.render(escena, camara);
    };
    animar();

    const ro = new ResizeObserver(encuadrar);
    ro.observe(cont);

    return () => {
      cancelado = true;
      cancelAnimationFrame(raf);
      ro.disconnect();
      // Liberar la VRAM: sin esto, entrar y salir de la llamada la va acumulando.
      escena.traverse((o) => {
        if (o.isMesh) {
          o.geometry?.dispose();
          const mats = Array.isArray(o.material) ? o.material : [o.material];
          mats.forEach((m) => {
            Object.values(m || {}).forEach((v) => v?.isTexture && v.dispose());
            m?.dispose?.();
          });
        }
      });
      entorno.dispose();
      pmrem.dispose();
      ktx2.dispose();
      renderer.dispose();
      renderer.domElement.remove();
      mallas = [];
    };
    // Montar una sola vez: los cambios de hablando/pulso viajan por ref.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="vc__escena" ref={contRef} data-estado={estado} aria-hidden="true">
      {estado === 'cargando' && <span className="vc__conectando">Conectando…</span>}
    </div>
  );
}
