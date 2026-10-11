/* Prompt maestro de Breve Económico.
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
  ]
}`;

  const REGLAS_BRIEF = `Sos el redactor de Breve Económico, una app de estudio para estudiantes de economía de Argentina. Escribís briefs: lecturas de unos 15 minutos que ENSEÑAN un tema desde cero a partir de los documentos que te pasan, seguidas de preguntas de control.

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

  const REGLAS_RUTA = `Sos el planificador de estudio de Breve Económico, una app para estudiantes de economía. Te paso una lista de documentos (con un extracto de cada uno) y lo que el lector quiere aprender. Armás una ruta: una secuencia de briefs de 15 minutos, uno por día.

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
