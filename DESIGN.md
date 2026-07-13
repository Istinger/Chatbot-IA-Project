# Proyecto

Agente IA para búsqueda de empleo orientado a jóvenes profesionales y estudiantes.

La experiencia NO debe sentirse como una página web tradicional, sino como un sistema operativo moderno inspirado en la navegación de una consola de videojuegos de nueva generación.

---

# Filosofía del Diseño

La interfaz debe transmitir:

- Elegancia
- Minimalismo
- Profundidad
- Fluidez
- Tecnología
- Movimiento
- Experiencia cinematográfica

Se debe evitar por completo la apariencia de:

- Dashboard empresarial
- Portal de empleos tradicional
- Landing page
- Aplicación CRUD
- Diseño corporativo clásico

La navegación debe sentirse inmersiva.

---

# Concepto Visual

Inspiración:

- Interfaces de consolas modernas
- VisionOS
- Netflix TV
- Steam Big Picture
- Arc Browser
- Nothing OS

(No copiar ninguna interfaz, solo tomar inspiración en la filosofía de diseño.)

---

# Paleta de Colores

## Fondo Principal

```css
#071421
```

## Fondo Secundario

```css
#0B1E31
```

## Superficie

```css
#16283D
```

## Azul Principal

```css
#4FA3FF
```

## Glow

```css
#6EC8FF
```

## Texto Principal

```css
#FFFFFF
```

## Texto Secundario

```css
#D8DEE9
```

## Texto Descriptivo

```css
#98A4B3
```

## Glass

```css
rgba(255,255,255,.04)
```

## Bordes

```css
rgba(255,255,255,.08)
```

---

# Estilo Visual

Minimal Futurism

Dark Premium UI

Gaming Operating System

Glassmorphism ligero

Ambient Lighting

Floating UI

Depth Layers

Soft Blur

Cinematic Experience

Mucho espacio negativo.

Muy poco texto.

Grandes imágenes.

Grandes tarjetas.

---

# Fondo

El fondo nunca será completamente negro.

Debe incluir:

- Gradientes
- Neblina
- Iluminación ambiental
- Desenfoque
- Partículas
- Profundidad
- Bloom muy ligero

Debe sentirse vivo.

---

# Componentes

## Tarjetas

Características:

- Grandes
- Bordes redondeados (20–24 px)
- Glass muy sutil
- Glow tenue
- Elevación suave
- Mucha separación

Hover:

- Scale 1.03
- Glow azul
- Shadow suave

---

# Tipografía

Sans Serif

Pesos:

300

400

600

Jerarquía:

48 px

32 px

24 px

18 px

14 px

Nunca usar tipografía pesada.

---

# Navegación

La navegación imita un sistema operativo.

Vertical:

Cambio entre categorías.

Horizontal:

Carousel infinito dentro de cada categoría.

Cada tarjeta representa una pantalla.

Nunca listas largas.

Nunca tablas.

---

# Pantallas

## Autenticación

La autenticación NO debe sentirse como un formulario corporativo.

Debe sentirse como el arranque de un sistema operativo: pantalla de entrada cinematográfica, fondo vivo con gradientes y neblina, orb luminoso central.

### Login

- Fondo ambiental con bloom muy ligero.
- Orb luminoso central como punto focal.
- Campos flotantes con glass sutil (correo, contraseña).
- Un único botón principal con glow azul.
- Sin bordes duros ni cajas rígidas.
- Transición de entrada: fade + camera zoom suave hacia el Panel de inicio.

### Register / Ingresar CV

El registro es el momento clave del sistema: aquí el usuario alimenta el motor de matching.

- Onboarding guiado en 3 pasos, presentado como pantallas flotantes (no un formulario largo):
  1. **Sube tu CV** — zona de drop grande, glass, con animación de partículas al soltar el archivo.
  2. **Confirma tus skills** — el sistema extrae skills del CV y las muestra como chips seleccionables con glow.
  3. **Listo** — transición cinematográfica hacia las primeras ofertas recomendadas.
- Alternativa sin CV: registro manual de skills mediante chips.
- Cada paso ocupa la pantalla completa, con progreso sutil (puntos, no barra corporativa).
- El flujo debe sentirse como una secuencia, con transiciones fade + blur entre pasos.

---

## Inicio

Saludo personalizado.

```
Hola Juan
```

Accesos rápidos mediante carrusel.

---

## Categorías

- Nuevas ofertas
- Buscar trabajos
- Ideas para portafolio
- Certificados recomendados
- Comunidades
- Simulador de entrevistas
- Mis postulaciones

Cada categoría posee su propio carousel horizontal.

---

## Nuevas ofertas

Las ofertas se separan en dos contextos: **locales** y **en el exterior**.

- Toggle superior o dos carruseles apilados:
  - **Cerca de ti** — ofertas locales (Ecuador).
  - **En el exterior** — ofertas internacionales y remotas.
- Cada tarjeta indica su origen mediante una etiqueta de país / bandera sutil.

Cada tarjeta contiene:

- Imagen
- Cargo
- Empresa
- Ubicación
- Modalidad
- Origen (local / exterior)
- Etiquetas

---

## Buscar trabajos

Una barra grande y limpia.

Sin elementos innecesarios.

Búsqueda por lenguaje natural: el usuario escribe libremente ("remoto junior backend sin inglés") y el sistema interpreta la intención.

---

## Ideas para Portafolio

Cada tarjeta contiene:

- Imagen
- Nombre del proyecto
- Categoría
- Nivel
- Tiempo estimado
- Descripción corta

Al seleccionarla se abre un modal premium.

---

## Certificados

Cada tarjeta muestra:

- Plataforma
- Duración
- Nivel
- Habilidades

Los certificados se sugieren según las **skills faltantes** detectadas frente a las ofertas de interés (análisis de brechas).

---

## Comunidades

Cada tarjeta contiene:

- Imagen
- Comunidad
- Miembros
- Actividad

---

## Simulador de Entrevistas

Hero Card principal.

Botón de comenzar.

Estado de preparación.

### Flujo de la sesión

- El sistema genera preguntas HR y técnicas según las skills del perfil.
- Modo texto: conversación con el entrevistador IA en pantalla limpia.
- Al finalizar: pantalla de **feedback** con fortalezas, puntos a mejorar y una valoración general, presentada como tarjetas glass (nunca como tabla).

---

## Mis postulaciones

Tablero de seguimiento del ciclo de vida de cada postulación.

- Vista tipo tablero con estados: **Guardada → Postulada → Entrevista → Oferta / Rechazada**.
- Las tarjetas se arrastran entre estados (drag-and-drop fluido, con glow al mover).
- Cada tarjeta muestra: cargo, empresa, fecha de postulación y días sin respuesta.
- Botón directo "Prepararme para esta entrevista" que enlaza con el Simulador.
- Contadores sutiles arriba (postuladas, en entrevista) a modo de estado del sistema.
- Nunca debe verse como una tabla o un tablero corporativo: tarjetas grandes, glass, mucho espacio.

---

# Modal

Glassmorphism.

Fondo desenfocado.

Contenido:

- Título
- Categoría
- Descripción
- Objetivos
- Entregables
- Nivel
- Botón principal

---

# Chatbot IA

Dos modos.

## Escucha

Centro de pantalla.

Orb luminoso.

Texto:

```
Hola Juan

Estoy escuchando...
```

Micrófono inferior.

Fondo desenfocado.

---

## Escritura

Orb permanece.

Aparece únicamente una barra inferior:

```
Escribe tu mensaje...
```

Botón enviar.

Micrófono.

Sin teclado virtual.

---

# Animaciones

Utilizar únicamente animaciones suaves.

- Fade
- Blur
- Scale
- Glow
- Opacity
- Camera Zoom
- Floating
- Depth
- Parallax

Todo debe sentirse fluido.

### Referencias de inspiración

- **Page loader cinematográfico** (estilo Strawberry Group) para reforzar la sensación de "sistema operativo que arranca".
- **Modales premium e interacción de mouse** para las tarjetas con glow.
- **Microinteracciones** suaves en hover y transiciones entre pantallas.
- **Toques 3D** puntuales, usados con moderación por su costo.

---

# Estrategia de Rendimiento

El objetivo visual es ambicioso; la ejecución debe garantizar una demo fluida en equipos modestos.

## Base (obligatoria)

- **CSS + Canvas 2D + GSAP** para la mayoría de efectos: gradientes animados, blur, glow, parallax, floating, transiciones.
- Es la misma tecnología de las referencias de Awwwards y da el 90% del impacto visual con riesgo bajo.

## Mejora opcional

- **WebGPU** para partículas avanzadas, niebla volumétrica, bloom y luces volumétricas.
- Se implementa **solo si sobra tiempo** y con un fallback CSS/Canvas activo por defecto.

## Motivos

- Soporte de navegador de WebGPU aún desigual.
- Curva de aprendizaje alta para 22 días.
- Consumo que puede afectar el rendimiento en laptops modestas.

Regla: **ningún efecto puede comprometer la fluidez de la demo.** Si un efecto baja el rendimiento, se degrada al fallback.

---

# WebGPU

Utilizar WebGPU (como mejora opcional, ver Estrategia de Rendimiento) para renderizar:

- Gradientes dinámicos
- Partículas
- Niebla
- Bloom
- Luces volumétricas
- Desenfoques
- Reflejos
- Sombras suaves
- Transiciones

---

# Principios UX

El usuario nunca debe sentir que navega una página web.

Debe sentir que utiliza una consola moderna.

Cada interacción debe transmitir:

- Elegancia
- Rapidez
- Fluidez
- Claridad
- Tecnología
- Inmersión

El contenido es el protagonista.

La interfaz acompaña sin distraer.

Menos elementos, más impacto visual.
