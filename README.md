# Prebisch

Briefs diarios de economía: lecturas de 15 minutos que enseñan un paper, un capítulo o un tema desde cero, con preguntas de control y repaso espaciado. Y **Mi estudio**: subís tus PDF, contás qué querés aprender y la app arma una ruta de briefs a tu medida.

**https://prebisch.martingomezpizarro.com.ar**

## Qué tiene
- **Hoy**: el brief del día (de la ruta que tengas en foco) y las **tarjetas de hoy**: las nuevas de tus áreas, las del brief que acabás de leer y las que te tocan repasar.
- **Rutas**: 12 áreas abiertas en 49 categorías (por ejemplo, *Tipo de cambio real y competitividad* o *Deuda soberana y default*). Cada ruta ordena las lecturas de lo esencial a lo puntual: manuales y clásicos, cursada, complementarios, investigación y referencia.
- **Rack**: 484 lecturas de economía clasificadas por área, categoría y nivel.
- **Mi estudio**: PDF propios + indicaciones → ruta → un brief por día generado con IA. Tres motores: el servidor de la app (gratis con cupo, iniciando sesión), tu key de Gemini o tu key de Anthropic.
- **Repaso espaciado**: cajas de Leitner (1, 3, 7, 16, 35 y 90 días). Cada brief trae de 6 a 8 tarjetas de aprendizaje y 8 preguntas de control; unas y otras entran al repaso después de leer el brief, nunca antes. Las tarjetas de los mazos del rack están disponibles desde el primer día.
- **Cuenta**: con Google o con mail y contraseña. Sincroniza el progreso entre dispositivos.
- **Avisos y calendario**: un aviso diario a la hora del repaso (Web Push), un evento diario en Google Calendar o en cualquier calendario (.ics), y la opción de registrar cada brief o sesión de tarjetas como actividad.

## Cómo está hecho
Una página HTML sin build. Los datos son archivos JSON en `data/`:

| Archivo | Qué es |
|---|---|
| `data/indice.json` | el rack: cada lectura con área, categoría, tipo y nivel |
| `data/rutas.json` | rutas por área y por categoría, en orden de lectura |
| `data/lecciones/index.json` | los briefs publicados (metadatos) |
| `data/lecciones/<id>.json` | cada brief con sus secciones, ecuaciones, 8 preguntas y sus tarjetas |
| `data/fichas.json`, `data/decks.json` | fichas técnicas de papers y sus tarjetas |
| `prompts/prompts.js` | el prompt maestro de rutas y briefs, y su validación |
| `worker/worker.js` | servidor de briefs (Cloudflare Worker + Gemini) y de avisos — ver `worker/ACTIVAR.md` |
| `logo.js`, `iconos/`, `icono.svg` | el logo (sello con oferta y demanda) y los íconos; se regeneran con `node diseno/iconos.js` |
| `manifest.webmanifest`, `sw.js` | instalación como app y recepción de los avisos |

El progreso queda en el navegador; con sesión iniciada se sincroniza en Firestore. Los PDF de Mi estudio se leen en el navegador y no se suben.

## Sumar un brief al rack
Crear `data/lecciones/<id>.json` con el formato de los existentes (`id`, `cat`, `orden`, `titulo`, `bajada`, `cita`, `fuentes`, `intro`, `secciones`, `claves`, `preguntas`, `tarjetas`) y agregar su entrada en `data/lecciones/index.json`.

## Errores
Cada brief tiene un enlace «Reportar un error» que abre un issue en este repo.

> Material de estudio sin fines de lucro. Los briefs explican y citan los trabajos; no los reemplazan. Las lecturas del rack se enlazan a su búsqueda pública: el repo no aloja PDF de terceros.
