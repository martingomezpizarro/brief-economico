// =====================================================================
//  Prebisch — servidor de briefs (Cloudflare Worker)
// ---------------------------------------------------------------------
//  La página lee los PDF en el navegador y manda acá el texto, con el
//  token de Firebase del usuario y sus indicaciones. El Worker:
//    1. verifica que el token sea de una cuenta real del proyecto,
//    2. controla el cupo diario (por persona y total),
//    3. arma el prompt maestro (el mismo de prompts/prompts.js) y le pide a Gemini
//       la ruta o el brief en JSON,
//    4. devuelve el texto; la página lo valida y lo guarda.
//
//  Variables (Settings → Variables and Secrets):
//    GEMINI_API_KEY   secreto — la key de Google AI Studio
//    FIREBASE_PROJECT prebisch-785b1
//    MODELO           gemini-3.8-flash            (opcional)
//    LIMITE_DIARIO    4    briefs por persona y día (opcional)
//    LIMITE_RUTAS     5    rutas por persona y día (opcional)
//    TOPE_GLOBAL      300  pedidos entre todos por día (opcional)
//    ADMINS           mails sin límite, separados por coma (opcional)
//    ORIGENES         dominios permitidos, separados por coma (opcional)
//    VAPID_JWK        secreto opcional — clave privada de los avisos (JWK). Si no está,
//                     el Worker crea una la primera vez y la guarda en el KV.
//  Enlace KV (Settings → Bindings → KV namespace):  CUPOS  (cupos y suscripciones a avisos)
//  Disparador (Settings → Triggers → Cron Triggers):  */30 * * * *   (manda los avisos diarios)
//  El bloque del prompt es copia de prompts/prompts.js: para actualizarlo, node worker/armar.js
// =====================================================================

const ORIGENES_DEF = [
  "https://prebisch.martingomezpizarro.com.ar",
  "https://martingomezpizarro.github.io",
  "http://localhost:8765",
  "http://127.0.0.1:8765",
];
const MODELO_DEF = "gemini-3.8-flash";
const JWKS_URL = "https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com";
const MAX_CHARS = 200000;   // texto de documentos por pedido

// ---------------------------------------------------------------- prompt maestro (copiado de prompts/prompts.js)

/* Prompt maestro de Prebisch.
   Lo usan la página (con key propia) y el Worker (con la key del sitio): es la misma
   instrucción en los dos lados para que los briefs salgan iguales. Si lo cambiás, corré
   `node worker/armar.js` para copiarlo dentro del Worker. */
(function (raiz) {
  "use strict";

  const ESQUEMA_BRIEF = `{
  "titulo": "título del brief, que diga de qué trata (máx. 90 caracteres)",
  "bajada": "una o dos oraciones: qué vas a entender al terminar",
  "cita": "autor(es) (año) de los documentos usados, separados por punto y coma",
  "intro": "un párrafo que plantea la pregunta y por qué importa",
  "secciones": [
    {"t": "título de la sección",
     "p": ["párrafo", "párrafo"],
     "eq": ["ecuación en LaTeX sin delimitadores (opcional)"],
     "nota": "aclaración corta (opcional)"}
  ],
  "claves": ["idea para llevarse", "... (4 a 6)"],
  "preguntas": [
    {"q": {"es": "pregunta", "en": "question"},
     "op": {"es": ["A", "B", "C", "D"], "en": ["A", "B", "C", "D"]},
     "ok": 0,
     "exp": {"es": "por qué es la correcta", "en": "why it is correct"}}
  ],
  "tarjetas": [
    {"tipo": "concepto | idea | mecanismo | modelo | econometria | resultado | critica | aplicacion",
     "q": {"es": "pregunta corta", "en": "short question"},
     "a": {"es": "respuesta de una a tres oraciones", "en": "one-to-three sentence answer"}}
  ]
}`;

  const REGLAS_BRIEF = `Sos el redactor de Prebisch, una app de estudio para estudiantes de economía de Argentina. Escribís briefs: lecturas de unos 15 minutos que ENSEÑAN un tema desde cero a partir de los documentos que te pasan, seguidas de preguntas de control.

QUÉ TIENE QUE TENER UN BRIEF
- Entre 1.200 y 1.800 palabras de texto en total, en 5 a 7 secciones, en castellano claro, de tú a tú pero académico (sin voseo forzado ni coloquialismos).
- Recorrido: la pregunta y por qué importa → la idea central → el mecanismo (por qué pasa lo que pasa, paso a paso) → el modelo con sus ecuaciones principales, explicando qué es cada símbolo → la evidencia y la econometría (datos, período, método, cómo identifican, resultados con sus números) → críticas o límites → qué implica para Argentina cuando el material lo permite.
- Si el documento no es empírico (un manual, un capítulo teórico, un apunte), reemplazá la sección de econometría por ejemplos numéricos o aplicaciones que estén en el material.
- Ecuaciones en el campo "eq", en LaTeX sin delimitadores. Dentro de un párrafo podés usar \\( ... \\) para símbolos sueltos.
- Respetá las indicaciones del lector sobre qué profundizar, el nivel y el énfasis: dedicales más espacio, pero sin dejar huecos en lo básico.

DE DÓNDE SALE LO QUE DECÍS
- Solo de los DOCUMENTOS que te paso. Cada número, fecha, coeficiente o resultado tiene que estar en el texto del documento. No completes con memoria.
- Si algo importante no está en el material o el texto viene cortado, decilo en una "nota" de la sección en vez de inventarlo.
- Las críticas que no vengan del documento marcalas como lectura propia ("Una objeción posible es…").
- No copies párrafos textuales: explicá con tus palabras.

PREGUNTAS DE CONTROL
- Exactamente 8, de opción múltiple con 4 opciones, en castellano y en inglés.
- Se tienen que poder responder con lo que dice el brief. Mezclá: idea central, mecanismo, modelo, datos y método, resultados con números, y una de aplicación.
- Distractores plausibles (errores típicos), nunca absurdos. Variá la posición de la correcta ("ok" es el índice 0 a 3).
- "exp" explica en una o dos oraciones por qué es la correcta.

TARJETAS DE APRENDIZAJE
- Entre 6 y 8 tarjetas de pregunta y respuesta abierta, en castellano y en inglés, para el repaso espaciado de los días siguientes.
- Cada tarjeta fija una sola idea: un concepto, un mecanismo, un supuesto del modelo, un dato o un resultado con su número.
- La PREGUNTA es de economía, no del texto: tiene que poder pensarse con conocimientos de economía aunque no se haya leído el documento. No empieces con «Según X…» ni nombres al autor en la pregunta. Bien: «¿Por qué una depreciación real puede subir el riesgo soberano?». Mal: «¿Qué dicen Michel y Díaz sobre el tipo de cambio?».
- La RESPUESTA explica la economía y después atribuye: quién lo muestra, dónde y con qué número (por ejemplo «Michel y Díaz (2015) estiman 0,276 puntos para República Dominicana»).
- Si la pregunta pide un dato, pedí el orden de magnitud o el signo, no la cifra exacta, y dala en la respuesta.
- No repitas las preguntas de control: las tarjetas se responden de memoria, sin opciones.
- La respuesta tiene que poder recordarse: de una a tres oraciones.

FORMATO
Respondé SOLO con un objeto JSON válido, sin texto antes ni después, con esta forma:
${ESQUEMA_BRIEF}`;

  const ESQUEMA_RUTA = `{
  "titulo": "nombre corto de la ruta",
  "descripcion": "dos o tres oraciones: qué se va a aprender y en qué orden",
  "pasos": [
    {"titulo": "tema del brief",
     "foco": "qué tiene que profundizar este brief, en una o dos oraciones",
     "docs": [0],
     "paginas": "rango de páginas sugerido si el documento es largo, por ejemplo 12-40, o vacío",
     "nivel": "E | C | I  (esencial, complementario, investigación)"}
  ]
}`;

  const REGLAS_RUTA = `Sos el planificador de estudio de Prebisch, una app para estudiantes de economía. Te paso una lista de documentos (con un extracto de cada uno) y lo que el lector quiere aprender. Armás una ruta: una secuencia de briefs de 15 minutos, uno por día.

CÓMO ARMÁS LA RUTA
- Primero lo esencial (manuales, clásicos, lo que ordena el tema), después lo complementario y al final los trabajos de investigación puntuales.
- Cada paso es un brief que se puede leer en 15 minutos: un paper corto es un paso; un libro o un paper largo se parte en varios pasos por capítulo o sección, indicando el rango de páginas.
- Usá las indicaciones del lector para decidir qué profundizar, qué saltear y cuántos pasos hacer. Si pide pocos días, priorizá.
- "docs" son los índices (empezando en 0) de los documentos que necesita ese brief. No inventes documentos.
- Entre 3 y 20 pasos.

FORMATO
Respondé SOLO con un objeto JSON válido, sin texto antes ni después, con esta forma:
${ESQUEMA_RUTA}`;

  function bloqueDocs(docs, maxChars) {
    let resto = maxChars;
    return docs.map((d, i) => {
      const t = String(d.texto || "").slice(0, Math.max(0, resto));
      resto -= t.length;
      const corte = t.length < String(d.texto || "").length ? "\n[El texto sigue, pero se cortó acá por límite de largo.]" : "";
      return `<documento indice="${d.i != null ? d.i : i}" titulo="${String(d.titulo || "").replace(/"/g, "'")}">\n${t}${corte}\n</documento>`;
    }).join("\n\n");
  }

  function pedidoLector(p) {
    const partes = [];
    if (p.objetivo) partes.push("Qué quiero aprender: " + p.objetivo);
    if (p.nivel) partes.push("Mi nivel: " + p.nivel);
    if (p.enfasis && p.enfasis.length) partes.push("Énfasis: " + p.enfasis.join(", "));
    if (p.dias) partes.push("Días disponibles: " + p.dias);
    if (p.foco) partes.push("Qué profundizar en este brief: " + p.foco);
    return partes.join("\n");
  }

  /* Devuelve {sistema, usuario}. docs: [{titulo, texto}], p: indicaciones del lector. */
  function promptRuta(docs, p, maxChars) {
    const lista = docs.map((d, i) => ({ i, titulo: d.titulo, texto: String(d.texto || "").slice(0, 3000) }));
    return {
      sistema: REGLAS_RUTA,
      usuario: `<lector>\n${pedidoLector(p)}\n</lector>\n\nDocumentos disponibles (cada uno con su cantidad de páginas y un extracto del comienzo):\n\n` +
        docs.map((d, i) => `[${i}] ${d.titulo} — ${d.paginas || "?"} páginas, ${String(d.texto || "").length} caracteres`).join("\n") +
        "\n\n" + bloqueDocs(lista, maxChars || 60000),
    };
  }
  function promptBrief(docs, p, maxChars) {
    return {
      sistema: REGLAS_BRIEF,
      usuario: `<lector>\n${pedidoLector(p)}\n</lector>\n\n<documentos>\n${bloqueDocs(docs, maxChars || 250000)}\n</documentos>\n\nEscribí el brief según las reglas.`,
    };
  }

  /* Valida y normaliza un brief devuelto por el modelo. Tira un Error con el motivo si no sirve. */
  function validarBrief(b) {
    if (!b || typeof b !== "object") throw new Error("La respuesta no es un objeto.");
    const txt = x => typeof x === "string" && x.trim().length > 0;
    if (!txt(b.titulo) || !txt(b.intro)) throw new Error("Falta el título o la introducción.");
    if (!Array.isArray(b.secciones) || b.secciones.length < 3) throw new Error("Tiene menos de 3 secciones.");
    b.secciones = b.secciones.filter(s => s && txt(s.t) && Array.isArray(s.p) && s.p.length).map(s => ({
      t: s.t, p: s.p.filter(txt), eq: Array.isArray(s.eq) ? s.eq.filter(txt) : [], nota: txt(s.nota) ? s.nota : "",
    }));
    b.claves = Array.isArray(b.claves) ? b.claves.filter(txt).slice(0, 8) : [];
    const pr = Array.isArray(b.preguntas) ? b.preguntas : [];
    b.preguntas = pr.filter(q => q && q.q && txt(q.q.es) && q.op && Array.isArray(q.op.es) && q.op.es.length === 4 &&
      Number.isInteger(q.ok) && q.ok >= 0 && q.ok < 4).map(q => ({
      q: { es: q.q.es, en: txt(q.q.en) ? q.q.en : q.q.es },
      op: { es: q.op.es.map(String), en: Array.isArray(q.op.en) && q.op.en.length === 4 ? q.op.en.map(String) : q.op.es.map(String) },
      ok: q.ok,
      exp: { es: (q.exp && q.exp.es) || "", en: (q.exp && (q.exp.en || q.exp.es)) || "" },
    }));
    if (b.preguntas.length < 4) throw new Error("Tiene menos de 4 preguntas válidas.");
    const TIPOS = ["concepto", "idea", "mecanismo", "modelo", "econometria", "resultado", "critica", "aplicacion"];
    b.tarjetas = (Array.isArray(b.tarjetas) ? b.tarjetas : []).filter(c => c && c.q && c.a && txt(c.q.es) && txt(c.a.es)).slice(0, 10).map(c => ({
      tipo: TIPOS.includes(c.tipo) ? c.tipo : "concepto",
      q: { es: c.q.es, en: txt(c.q.en) ? c.q.en : c.q.es },
      a: { es: c.a.es, en: txt(c.a.en) ? c.a.en : c.a.es },
    }));
    b.bajada = txt(b.bajada) ? b.bajada : "";
    b.cita = txt(b.cita) ? b.cita : "";
    b.palabras = [b.intro].concat(...b.secciones.map(s => s.p)).join(" ").split(/\s+/).length;
    return b;
  }
  function validarRuta(r) {
    if (!r || !Array.isArray(r.pasos) || !r.pasos.length) throw new Error("La ruta no tiene pasos.");
    r.titulo = String(r.titulo || "Mi ruta");
    r.descripcion = String(r.descripcion || "");
    r.pasos = r.pasos.slice(0, 30).map(p => ({
      titulo: String(p.titulo || "Paso"), foco: String(p.foco || ""),
      docs: Array.isArray(p.docs) ? p.docs.filter(n => Number.isInteger(n)) : [],
      paginas: String(p.paginas || ""), nivel: /^[ECI]$/.test(p.nivel) ? p.nivel : "C",
    }));
    return r;
  }
  /* Saca el primer objeto JSON de un texto (por si el modelo agrega algo alrededor). */
  function extraerJSON(t) {
    t = String(t || "").trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
    try { return JSON.parse(t); } catch (e) { }
    const a = t.indexOf("{"), b = t.lastIndexOf("}");
    if (a >= 0 && b > a) return JSON.parse(t.slice(a, b + 1));
    throw new Error("La respuesta no trae JSON.");
  }

  raiz.BREVE_PROMPTS = { promptRuta, promptBrief, validarBrief, validarRuta, extraerJSON, REGLAS_BRIEF, REGLAS_RUTA };
})(typeof self !== "undefined" ? self : globalThis);

// ---------------------------------------------------------------- utilidades
function cors(req, env) {
  const permitidos = env.ORIGENES ? env.ORIGENES.split(",").map(s => s.trim()) : ORIGENES_DEF;
  const o = req.headers.get("Origin") || "";
  return {
    "Access-Control-Allow-Origin": permitidos.includes(o) ? o : permitidos[0],
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Authorization, Content-Type",
    "Access-Control-Max-Age": "86400",
    "Vary": "Origin",
  };
}
function json(req, env, obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status, headers: { "Content-Type": "application/json; charset=utf-8", ...cors(req, env) },
  });
}
const b64u = s => Uint8Array.from(atob(s.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((s.length + 3) % 4)), c => c.charCodeAt(0));
const hoyAR = () => new Date(Date.now() - 3 * 3600e3).toISOString().slice(0, 10);

// ---------------------------------------------------------------- token de Firebase
let JWKS = null, JWKS_VENCE = 0;
async function llaves() {
  if (JWKS && Date.now() < JWKS_VENCE) return JWKS;
  const r = await fetch(JWKS_URL, { cf: { cacheTtl: 3600 } });
  if (!r.ok) throw new Error("No se pudieron bajar las llaves de Google");
  const j = await r.json();
  JWKS = {};
  for (const k of j.keys) {
    JWKS[k.kid] = await crypto.subtle.importKey("jwk", k, { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["verify"]);
  }
  JWKS_VENCE = Date.now() + 3600e3;
  return JWKS;
}
async function usuario(req, env) {
  const m = (req.headers.get("Authorization") || "").match(/^Bearer\s+(.+)$/);
  if (!m) return null;
  const partes = m[1].split(".");
  if (partes.length !== 3) return null;
  const cab = JSON.parse(new TextDecoder().decode(b64u(partes[0])));
  const p = JSON.parse(new TextDecoder().decode(b64u(partes[1])));
  if (cab.alg !== "RS256") return null;
  let ks = await llaves();
  if (!ks[cab.kid]) { JWKS = null; ks = await llaves(); }
  const llave = ks[cab.kid];
  if (!llave) return null;
  const ok = await crypto.subtle.verify("RSASSA-PKCS1-v1_5", llave, b64u(partes[2]),
    new TextEncoder().encode(partes[0] + "." + partes[1]));
  if (!ok) return null;
  const proy = env.FIREBASE_PROJECT || "prebisch-785b1";
  const ahora = Math.floor(Date.now() / 1000);
  if (p.aud !== proy || p.iss !== "https://securetoken.google.com/" + proy) return null;
  if (!p.sub || p.exp < ahora || p.iat > ahora + 300) return null;
  return { uid: p.sub, mail: (p.email || "").toLowerCase(), verificado: !!p.email_verified };
}

// ---------------------------------------------------------------- cupos
const MEM = new Map();   // respaldo si no hay KV enlazado (cuenta por instancia, no es exacto)
async function leer(env, k) {
  if (env.CUPOS) return +(await env.CUPOS.get(k)) || 0;
  return MEM.get(k) || 0;
}
async function sumar(env, k, n) {
  if (env.CUPOS) return env.CUPOS.put(k, String(n), { expirationTtl: 60 * 60 * 48 });
  MEM.set(k, n);
}
async function cupo(env, u, tipo) {
  const dia = hoyAR();
  const admin = (env.ADMINS || "").toLowerCase().split(",").map(s => s.trim()).filter(Boolean).includes(u.mail);
  const lim = admin ? Infinity : (tipo === "ruta" ? (+env.LIMITE_RUTAS || 5) : (+env.LIMITE_DIARIO || 4));
  const tope = +env.TOPE_GLOBAL || 300;
  const kU = `${tipo}:${dia}:${u.uid}`, kG = `${tipo}:${dia}:todos`;
  const [usados, global] = await Promise.all([leer(env, kU), leer(env, kG)]);
  if (usados >= lim) return { ok: false, motivo: `Llegaste al tope de ${lim} ${tipo === "ruta" ? "rutas" : "briefs"} por día con el servidor. Mañana se renueva, o cargá tu propia key en Ajustes.` };
  if (!admin && global >= tope) return { ok: false, motivo: "El servidor llegó al tope del día entre todos los usuarios. Mañana vuelve, o cargá tu propia key en Ajustes." };
  return {
    ok: true,
    quedan: lim === Infinity ? null : lim - usados - 1,
    anotar: () => Promise.all([sumar(env, kU, usados + 1), sumar(env, kG, global + 1)]),
  };
}

// ---------------------------------------------------------------- Gemini
async function gemini(env, cuerpo) {
  const modelo = env.MODELO || MODELO_DEF;
  const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${modelo}:generateContent`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-goog-api-key": env.GEMINI_API_KEY },
    body: JSON.stringify(cuerpo),
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) {
    const msg = (j.error && j.error.message) || ("Gemini respondió " + r.status);
    const e = new Error(r.status === 429 ? "El servidor de briefs está saturado. Probá de nuevo en un minuto." : msg);
    e.status = r.status === 429 ? 429 : 502;
    throw e;
  }
  return j;
}
function textoDe(j) {
  const c = j.candidates && j.candidates[0];
  const partes = (c && c.content && c.content.parts) || [];
  return partes.filter(p => p.text && !p.thought).map(p => p.text).join("").trim();
}


const PR = globalThis.BREVE_PROMPTS;

async function generar(req, env, u) {
  if (!u.verificado) return json(req, env, { error: "Verificá tu mail para usar el servidor: abrí el enlace que te mandamos al crear la cuenta (en Ajustes podés pedir que te lo reenviemos)." }, 403);
  const d = await req.json().catch(() => null);
  if (!d || (d.tipo !== "ruta" && d.tipo !== "brief")) return json(req, env, { error: "Pedido inválido." }, 400);
  const docs = (Array.isArray(d.docs) ? d.docs : []).slice(0, 12)
    .filter(x => x && typeof x.texto === "string")
    .map(x => ({ titulo: String(x.titulo || "").slice(0, 200), texto: x.texto, paginas: +x.paginas || 0 }));
  if (!docs.length) return json(req, env, { error: "No llegó texto de ningún documento." }, 400);
  const total = docs.reduce((a, x) => a + x.texto.length, 0);
  if (total < 400) return json(req, env, { error: "Los documentos casi no tienen texto (¿son escaneados?)." }, 400);
  const p = d.pedido && typeof d.pedido === "object" ? d.pedido : {};
  const pedido = {
    objetivo: String(p.objetivo || "").slice(0, 1500), nivel: String(p.nivel || "").slice(0, 40),
    enfasis: Array.isArray(p.enfasis) ? p.enfasis.slice(0, 10).map(x => String(x).slice(0, 40)) : [],
    dias: String(p.dias || "").slice(0, 10), foco: String(p.foco || "").slice(0, 800),
  };
  const c = await cupo(env, u, d.tipo);
  if (!c.ok) return json(req, env, { error: c.motivo, tope: true }, 429);
  const pr = d.tipo === "ruta" ? PR.promptRuta(docs, pedido, 60000) : PR.promptBrief(docs, pedido, MAX_CHARS);
  const j = await gemini(env, {
    systemInstruction: { parts: [{ text: pr.sistema }] },
    contents: [{ role: "user", parts: [{ text: pr.usuario }] }],
    generationConfig: { temperature: 0.4, maxOutputTokens: 16384, responseMimeType: "application/json" },
  });
  const texto = textoDe(j);
  if (!texto) return json(req, env, { error: "El modelo no devolvió respuesta. Probá de nuevo." }, 502);
  await c.anotar();
  return json(req, env, { texto, quedan: c.quedan });
}

// ---------------------------------------------------------------- avisos (Web Push con VAPID, sin contenido)
// La página se suscribe con la clave pública y elige una franja de media hora en UTC.
// En el KV queda «push:HH:MM:<id>» → {endpoint, uid} y «pushid:<id>» → franja actual.
// El cron de cada media hora lista la franja y manda un push vacío; el texto lo arma el service worker.
const b64uEnc = a => btoa(String.fromCharCode(...new Uint8Array(a))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
let VAPID = null;
async function vapid(env) {
  if (VAPID) return VAPID;
  if (!env.CUPOS && !env.VAPID_JWK) throw Object.assign(new Error("Falta enlazar el KV CUPOS para los avisos."), { status: 500 });
  let jwk = env.VAPID_JWK ? JSON.parse(env.VAPID_JWK) : await env.CUPOS.get("vapid:jwk", "json");
  if (!jwk) {
    const par = await crypto.subtle.generateKey({ name: "ECDSA", namedCurve: "P-256" }, true, ["sign", "verify"]);
    jwk = await crypto.subtle.exportKey("jwk", par.privateKey);
    await env.CUPOS.put("vapid:jwk", JSON.stringify(jwk));
  }
  const privada = await crypto.subtle.importKey("jwk", { kty: "EC", crv: "P-256", d: jwk.d, x: jwk.x, y: jwk.y }, { name: "ECDSA", namedCurve: "P-256" }, false, ["sign"]);
  const pub = new Uint8Array(65); pub[0] = 4; pub.set(b64u(jwk.x), 1); pub.set(b64u(jwk.y), 33);
  return VAPID = { privada, publica: b64uEnc(pub), jwts: new Map() };
}
async function cabeceraVapid(env, endpoint) {
  const v = await vapid(env), aud = new URL(endpoint).origin, ahora = Math.floor(Date.now() / 1000);
  const guardado = v.jwts.get(aud);
  if (guardado && guardado.vence > ahora + 600) return guardado.cab;
  const enc = o => b64uEnc(new TextEncoder().encode(JSON.stringify(o)));
  const cuerpo = enc({ typ: "JWT", alg: "ES256" }) + "." + enc({ aud, exp: ahora + 12 * 3600, sub: env.VAPID_SUB || ORIGENES_DEF[0] });
  const firma = await crypto.subtle.sign({ name: "ECDSA", hash: "SHA-256" }, v.privada, new TextEncoder().encode(cuerpo));
  const cab = `vapid t=${cuerpo}.${b64uEnc(firma)}, k=${v.publica}`;
  v.jwts.set(aud, { cab, vence: ahora + 12 * 3600 });
  return cab;
}
async function mandarPush(env, endpoint) {
  const r = await fetch(endpoint, { method: "POST", headers: { Authorization: await cabeceraVapid(env, endpoint), TTL: "43200", Urgency: "normal", "Content-Length": "0" } });
  return r.status;
}
async function idDe(endpoint) {
  const h = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(endpoint));
  return [...new Uint8Array(h)].slice(0, 12).map(b => b.toString(16).padStart(2, "0")).join("");
}
function endpointValido(e) {
  try { const u = new URL(e); return u.protocol === "https:" && e.length < 1000; } catch (_) { return false; }
}
async function borrarSus(env, id) {
  const franja = await env.CUPOS.get("pushid:" + id);
  if (franja) await env.CUPOS.delete(`push:${franja}:${id}`);
  await env.CUPOS.delete("pushid:" + id);
}
async function push(req, env, ruta) {
  if (!env.CUPOS) return json(req, env, { error: "Falta enlazar el KV CUPOS en el Worker." }, 500);
  if (ruta === "/push/clave") return json(req, env, { clave: (await vapid(env)).publica });
  const u = await usuario(req, env);
  if (!u) return json(req, env, { error: "Tenés que iniciar sesión para activar los avisos.", login: true }, 401);
  const d = await req.json().catch(() => null) || {};
  const endpoint = String((d.sub && d.sub.endpoint) || d.endpoint || "");
  if (!endpointValido(endpoint)) return json(req, env, { error: "Suscripción inválida." }, 400);
  const id = await idDe(endpoint);
  if (ruta === "/push/alta") {
    const franja = String(d.slot || "");
    if (!/^([01]\d|2[0-3]):(00|30)$/.test(franja)) return json(req, env, { error: "Horario inválido." }, 400);
    const anterior = await env.CUPOS.get("pushid:" + id);
    if (anterior && anterior !== franja) await env.CUPOS.delete(`push:${anterior}:${id}`);
    await env.CUPOS.put(`push:${franja}:${id}`, JSON.stringify({ endpoint, uid: u.uid, t: Date.now() }));
    await env.CUPOS.put("pushid:" + id, franja);
    return json(req, env, { ok: true, franja });
  }
  const guardada = await env.CUPOS.get("pushid:" + id);
  if (ruta === "/push/baja") { await borrarSus(env, id); return json(req, env, { ok: true }); }
  if (ruta === "/push/probar") {
    if (!guardada) return json(req, env, { error: "Este dispositivo no figura suscripto: desactivá y volvé a activar los avisos." }, 404);
    const st = await mandarPush(env, endpoint);
    if (st === 404 || st === 410) { await borrarSus(env, id); return json(req, env, { error: "La suscripción venció: volvé a activar los avisos." }, 410); }
    if (st >= 400) return json(req, env, { error: "El servicio de avisos del navegador respondió " + st + "." }, 502);
    return json(req, env, { ok: true });
  }
  return json(req, env, { error: "No existe." }, 404);
}
async function avisosDeLaFranja(env) {
  if (!env.CUPOS) return;
  const ahora = new Date(), m = Math.round((ahora.getUTCHours() * 60 + ahora.getUTCMinutes()) / 30) * 30 % 1440;
  const franja = String(Math.floor(m / 60)).padStart(2, "0") + ":" + String(m % 60).padStart(2, "0");
  let cursor;
  do {
    const l = await env.CUPOS.list({ prefix: `push:${franja}:`, cursor });
    for (const k of l.keys) {
      const v = await env.CUPOS.get(k.name, "json");
      if (!v) continue;
      const st = await mandarPush(env, v.endpoint).catch(() => 0);
      if (st === 404 || st === 410) await borrarSus(env, k.name.split(":").pop());
    }
    cursor = l.list_complete ? null : l.cursor;
  } while (cursor);
}

// ---------------------------------------------------------------- entrada
export default {
  async fetch(req, env) {
    if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: cors(req, env) });
    const ruta = new URL(req.url).pathname.replace(/\/+$/, "") || "/";
    try {
      if (req.method === "GET" && (ruta === "/" || ruta === "/estado")) {
        return json(req, env, {
          ok: !!env.GEMINI_API_KEY, servicio: "brief-economico", modelo: env.MODELO || MODELO_DEF,
          limite: +env.LIMITE_DIARIO || 4, kv: !!env.CUPOS,
        });
      }
      if (ruta.startsWith("/push/")) {
        if (ruta === "/push/clave" ? req.method !== "GET" : req.method !== "POST") return json(req, env, { error: "No existe." }, 404);
        return await push(req, env, ruta);
      }
      if (req.method !== "POST" || ruta !== "/generar") return json(req, env, { error: "No existe." }, 404);
      if (!env.GEMINI_API_KEY) return json(req, env, { error: "Falta cargar la GEMINI_API_KEY en el Worker." }, 500);
      const u = await usuario(req, env);
      if (!u) return json(req, env, { error: "Tenés que iniciar sesión para usar el servidor.", login: true }, 401);
      return await generar(req, env, u);
    } catch (e) {
      return json(req, env, { error: (e && e.message) || "Algo salió mal en el servidor." }, e.status || 500);
    }
  },
  async scheduled(evento, env, ctx) {
    ctx.waitUntil(avisosDeLaFranja(env));
  },
};
