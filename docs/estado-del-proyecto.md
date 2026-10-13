# Estado del proyecto Prebisch (traspaso entre sesiones)

Resumen de lo hecho en la sesión web de Claude Code (octubre 2026), para seguir desde otra sesión.

## Dónde está
- Repo: `martingomezpizarro/brief-economico`. Sitio: GitHub Pages en **https://prebisch.martingomezpizarro.com.ar** (DNS en Cloudflare, CNAME `prebisch` → `martingomezpizarro.github.io`, en «DNS only»).
- La app se llama **Prebisch** (antes «Breve Económico»). Logo: sello de doble anillo con oferta y demanda (`logo.js`, íconos en `iconos/`, se regeneran con `node diseno/iconos.js`).
- Cambios de la última tanda en la rama `claude/youthful-bell-1zs2od`; hay que mergearla a `main` si todavía no se hizo.

## Servicios
- **Firebase propio**: proyecto `prebisch-785b1` (no el de idoneidad). Falta confirmar: dominio autorizado, proveedores Google y Email/Password activos, Firestore creado con las reglas de `worker/ACTIVAR.md`.
- **Cloudflare Worker** `brief-economico.gomezpizarromartin.workers.dev`: código en `worker/worker.js` (el prompt se sincroniza con `node worker/armar.js`). Necesita KV `CUPOS`, variables (`GEMINI_API_KEY`, `FIREBASE_PROJECT=prebisch-785b1`, `ADMINS`, límites), cron `*/30 * * * *` y abrir `/push/clave` una vez. Guía completa: `worker/ACTIVAR.md`.

## Qué tiene la app
- **Hoy**: brief del día + «Tarjetas de hoy» (repaso espaciado, cajas de Leitner). En compu, dos columnas.
- **Tarjetas**: 37 de los mazos del rack (`data/decks.json`) y 6 por brief (`tarjetas` en `data/lecciones/*.json`). Criterio: la pregunta es de economía (se puede pensar sin haber leído el paper) y la respuesta atribuye al autor; abajo, la cita completa con «Abrir la ficha», «Buscar el texto» y «Abrir mi PDF».
- **Briefs**: 6 escritos (comercio, deuda externa, tipo de cambio real), cada uno con 8 preguntas de control y 6 tarjetas.
- **Cuenta**: botón arriba a la derecha; Google o mail y contraseña (con verificación). Se puede usar sin cuenta.
- **Avisos** (Web Push vía el Worker) y **calendario** (evento diario en Google Calendar o .ics, y «Registrar esta actividad»).
- **Mi biblioteca** (Ajustes): conecta la carpeta local de PDF en Chrome/Edge de compu, recorre subcarpetas y vincula cada PDF con su lectura del rack. No sube archivos. No funciona en celular.
- **Navegación**: «← Volver a …» en lecturas, rutas y briefs.
- **Mi estudio**: PDF propios → ruta → briefs con IA (servidor con Gemini y cupo, o key propia de Gemini/Anthropic). El prompt maestro está en `prompts/prompts.js`.

## Pendiente
1. Merge de la rama a `main` y terminar Firebase y Cloudflare (ver arriba).
2. Probar «Mi biblioteca» con la carpeta real y ver cuántas de las 484 lecturas vincula.
3. **Los 484 briefs con sus tarjetas**: subir la carpeta de PDF a Google Drive para poder leerlos; escribir por tandas, ruta por ruta (un brief por capítulo en libros y por unidad en apuntes). 46 PDF están escaneados y pueden necesitar OCR.
4. Vínculos a Drive por lectura, guardados en la cuenta del usuario (no en el repo), para abrir los PDF desde el celular.
