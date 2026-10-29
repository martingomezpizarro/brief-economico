# Estado del proyecto Prebisch (traspaso entre sesiones)

Resumen de lo hecho en la sesión web de Claude Code (octubre 2026), para seguir desde otra sesión.

## Dónde está
- Repo: `martingomezpizarro/brief-economico`. Sitio: GitHub Pages en **https://prebisch.martingomezpizarro.com.ar** (DNS en Cloudflare, CNAME `prebisch` → `martingomezpizarro.github.io`, en «DNS only»).
- La app se llama **Prebisch** (antes «Breve Económico»). Logo: sello de doble anillo con oferta y demanda (`logo.js`, íconos en `iconos/`, se regeneran con `node diseno/iconos.js`).
- La rama `claude/youthful-bell-1zs2od` ya está mergeada en `main` (PR #3).

## Servicios
- **Firebase propio**: proyecto `prebisch-785b1` (no el de idoneidad). Falta confirmar: dominio autorizado, proveedores Google y Email/Password activos, Firestore creado con las reglas de `worker/ACTIVAR.md`.
- **Cloudflare Worker** `brief-economico.gomezpizarromartin.workers.dev`: código en `worker/worker.js` (el prompt se sincroniza con `node worker/armar.js`). Necesita KV `CUPOS`, variables (`GEMINI_API_KEY`, `FIREBASE_PROJECT=prebisch-785b1`, `ADMINS`, límites), cron `*/30 * * * *` y abrir `/push/clave` una vez. Guía completa: `worker/ACTIVAR.md`.

## Qué tiene la app
- **Hoy**: brief del día + «Tarjetas de hoy» (repaso espaciado, cajas de Leitner). En compu, dos columnas.
- **Tarjetas**: 37 de los mazos del rack (`data/decks.json`) y 6 por brief (`tarjetas` en `data/lecciones/*.json`). Criterio: la pregunta es de economía (se puede pensar sin haber leído el paper) y la respuesta atribuye al autor; abajo, la cita completa con «Abrir la ficha», «Buscar el texto» y «Abrir mi PDF».
- **Briefs**: 48 escritos (ver `data/lecciones/index.json`), cada uno con 8 preguntas de control y 6 a 8 tarjetas.
- **Cuenta**: botón arriba a la derecha; Google o mail y contraseña (con verificación). Se puede usar sin cuenta.
- **Avisos** (Web Push vía el Worker) y **calendario** (evento diario en Google Calendar o .ics, y «Registrar esta actividad»).
- **Mi biblioteca** (Ajustes): conecta la carpeta local de PDF en Chrome/Edge de compu, recorre subcarpetas y vincula cada PDF con su lectura del rack. No sube archivos. No funciona en celular.
- **Navegación**: «← Volver a …» en lecturas, rutas y briefs.
- **Mi estudio**: PDF propios → ruta → briefs con IA (servidor con Gemini y cupo, o key propia de Gemini/Anthropic). El prompt maestro está en `prompts/prompts.js`.

## Cómo se escriben los briefs (desde octubre 2026)
- Los PDF se leen desde la compu de Martín, carpeta `C:\Users\Usuario\Desktop\MARTIN\ECONOMICS` (conectada a la sesión de Claude con «Add folder»). Tiene 455 PDF, casi todos de la facultad (el rack tiene 372 lecturas con origen `facultad` y 112 con origen `academia`).
- Los papers de origen `academia` (los que llegan por mail) **no están en esa carpeta**: hay que juntarlos aparte (por ejemplo, desde Gmail) antes de escribir sus briefs.
- Cada brief sale solo del texto del PDF (cifras verificadas contra el texto extraído); críticas propias marcadas como «lectura propia».
- **Toda fórmula lleva su «Donde:»**: cada ecuación de un brief (en `eq`, en el texto, en preguntas o explicaciones) va acompañada, justo debajo, de una lista que define cada símbolo (variables, parámetros, subíndices, operadores como Δ o E[·]) en palabras simples, con unidades o interpretación económica cuando corresponda. Si una letra se reusa con otro significado, se redefine. Si el paper no define un símbolo, se dice y la interpretación se marca como «lectura propia». Formato: en cada sección, `donde` es una lista paralela a `eq` (`donde[j]` define la ecuación `eq[j]`), con ítems `{"es": ..., "en": ...}`; la app la muestra bajo cada ecuación como «Donde:» / «Where:». En el texto corrido conviene describir las fórmulas en palabras y dejar las ecuaciones en `eq`. Antes de publicar, revisar que ninguna ecuación quede sin su «Donde:».
- `palabras` = palabras de `intro` + párrafos de `secciones` (sin notas). Hay que agregar la entrada en `data/lecciones/index.json`.
- Herramientas en `herramientas/`: `extraer.sh <pdf> <txt>` (pdftotext; si sale vacío, OCR con tesseract spa+eng, lento: correrlo en segundo plano), `publicar_brief.py <id> --fuente <id>=<txt>` (valida, calcula palabras y orden, actualiza el índice y lista cifras que no aparecen en la fuente), `mover_correcta.py` (rota la opción correcta) y `subir.sh "mensaje"` (commit y push a main).
- Si un PDF de la compu no se puede copiar a la sesión (archivos con hardlink), se lee con pdftotext directamente en la compu.
- Duplicados en el rack: 90 y 1221 son el mismo trabajo (Lasarte y Pérez); el brief tc-reg-03 cita los dos ids.

## Pendiente
1. Terminar Firebase y Cloudflare (ver arriba).
2. Probar «Mi biblioteca» con la carpeta real y ver cuántas de las 484 lecturas vincula.
3. **Los briefs restantes**. Finanzas públicas (fisc-general): Grión, Apuntes de Finanzas Públicas (1157), un brief por unidad: hechos caps. 1-2 (fisc-general-01), 3-4 (fisc-general-02), 5-6 (fisc-general-03, desigualdad y polarización), 7 (fisc-general-04, decisiones colectivas), 8-9 y apéndice A.1.1 (fisc-general-05, sistemas electorales y reparto de bancas) y 10 (fisc-general-06, índices de poder); falta el cap. 11 (división justa), y después sigue el resto de la ruta FISC. Las fórmulas del apunte son imágenes: hay que mirar las páginas (página del PDF = página impresa). En CREC quedan sin brief, además de los de Academia, cinco informes del INDEC (1206, 1209, 1207, 1208, 1203), que sí están en la carpeta. Resto: seguir ruta por ruta (un brief por capítulo en libros y por unidad en apuntes). Regímenes cambiarios: faltan 83, 85, 89 y 92 (origen `academia`). Crecimiento (crec-teoria y crec-ciclo): hechos 22 briefs; Sala-i-Martin, Apuntes de crecimiento (1344, escaneado de 263 páginas, un brief por capítulo): completo: introducción y caps. 1 a 10 en crec-teoria-07 a crec-teoria-16 (el apéndice matemático no lleva brief) (página del PDF = página impresa + 10; el OCR del libro entero tarda ~5 minutos con tesseract spa) y los 8 de Academia (23, 27, 62, 63, 69, 140, 166, 174). Los mails de Academia no aparecen en el Gmail conectado: hay que ubicar los PDF. 46 PDF están escaneados y pueden necesitar OCR.
4. Subir la carpeta a Google Drive, con sus subcarpetas, para abrir los PDF desde el celular y poder escribir briefs sin la compu prendida; vínculos a Drive por lectura, guardados en la cuenta del usuario (no en el repo).
