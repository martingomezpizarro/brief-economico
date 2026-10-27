/* Bóveda de keys de Prebisch.
   Es el ÚNICO código que toca la key de Gemini o de Anthropic de un usuario. Corre como Web Worker,
   separado de la página: ninguna otra parte de la app (ni las librerías externas que carga la página,
   como MathJax, pdf.js o Firebase) puede leer la key.

   Qué hace, y nada más:
   - Guarda la key en memoria. Si el usuario marca «Recordar», también la guarda en este navegador,
     CIFRADA con AES-GCM. La llave de cifrado es una CryptoKey «no extraíble»: ni este código puede
     exportarla; solo sirve para cifrar y descifrar dentro de este navegador.
   - Llama SOLO a estas dos direcciones, fijas:
       https://generativelanguage.googleapis.com  (Gemini)
       https://api.anthropic.com                  (Anthropic)
   - A la página le devuelve el texto de la respuesta, si hay key y sus últimos 4 caracteres.
     Nunca le devuelve la key.
   No hay ningún servidor de Prebisch en el medio, no se sube a Firebase ni a la copia de seguridad.
   No importa ningún script: todo lo que ejecuta está en este archivo. */
"use strict";

const PROV = {
  gemini: modelo => "https://generativelanguage.googleapis.com/v1beta/models/" + encodeURIComponent(modelo) + ":generateContent",
  anthropic: () => "https://api.anthropic.com/v1/messages",
};
const MEM = {};            // prov -> key en texto, solo en la memoria de este worker
const DB = "prebisch-boveda";

function idb() {
  return new Promise((ok, mal) => {
    const r = indexedDB.open(DB, 1);
    r.onupgradeneeded = () => r.result.createObjectStore("s");
    r.onsuccess = () => ok(r.result); r.onerror = () => mal(r.error);
  });
}
async function leer(k) {
  const db = await idb();
  return new Promise(ok => { const q = db.transaction("s").objectStore("s").get(k); q.onsuccess = () => ok(q.result); q.onerror = () => ok(undefined); });
}
async function escribir(k, v) {
  const db = await idb();
  return new Promise((ok, mal) => { const t = db.transaction("s", "readwrite"); v === undefined ? t.objectStore("s").delete(k) : t.objectStore("s").put(v, k); t.oncomplete = ok; t.onerror = () => mal(t.error); });
}
async function llaveCifrado() {
  let c = await leer("cripto");
  if (!c) { c = await crypto.subtle.generateKey({ name: "AES-GCM", length: 256 }, false, ["encrypt", "decrypt"]); await escribir("cripto", c); }
  return c;
}
async function cifrar(texto) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, await llaveCifrado(), new TextEncoder().encode(texto));
  return { iv, ct };
}
async function descifrar(x) {
  const b = await crypto.subtle.decrypt({ name: "AES-GCM", iv: x.iv }, await llaveCifrado(), x.ct);
  return new TextDecoder().decode(b);
}
async function key(prov) {
  if (MEM[prov]) return MEM[prov];
  const x = await leer("k-" + prov);
  if (!x) return "";
  try { MEM[prov] = await descifrar(x); } catch (e) { await escribir("k-" + prov, undefined); return ""; }
  return MEM[prov];
}
async function estado() {
  const out = {};
  for (const p of Object.keys(PROV)) {
    const k = await key(p); const guardada = !!(await leer("k-" + p));
    out[p] = { tiene: !!k, fin: k ? k.slice(-4) : "", recordar: guardada };
  }
  return out;
}
function limpiar(k) { return String(k || "").trim().replace(/\s+/g, ""); }

async function llamar({ prov, modelo, sistema, usuario }) {
  if (!PROV[prov]) throw new Error("Proveedor desconocido.");
  const k = await key(prov);
  if (!k) throw new Error(prov === "gemini" ? "Falta tu key de Gemini en Ajustes." : "Falta tu key de Anthropic en Ajustes.");
  modelo = String(modelo || "");
  if (!/^[a-z0-9][a-z0-9.\-]{1,80}$/i.test(modelo)) throw new Error("Nombre de modelo inválido.");
  let r, j;
  if (prov === "gemini") {
    r = await fetch(PROV.gemini(modelo), { method: "POST", referrerPolicy: "no-referrer", credentials: "omit",
      headers: { "Content-Type": "application/json", "x-goog-api-key": k },
      body: JSON.stringify({ systemInstruction: { parts: [{ text: sistema }] }, contents: [{ role: "user", parts: [{ text: usuario }] }],
        generationConfig: { temperature: 0.4, maxOutputTokens: 16384, responseMimeType: "application/json" } }) });
    j = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error((j.error && j.error.message) || ("Gemini respondió " + r.status));
    const ps = (((j.candidates || [])[0] || {}).content || {}).parts || [];
    return ps.filter(p => p.text && !p.thought).map(p => p.text).join("");
  }
  r = await fetch(PROV.anthropic(), { method: "POST", referrerPolicy: "no-referrer", credentials: "omit",
    headers: { "Content-Type": "application/json", "x-api-key": k, "anthropic-version": "2023-06-01", "anthropic-dangerous-direct-browser-access": "true" },
    body: JSON.stringify({ model: modelo, max_tokens: 16000, system: sistema, messages: [{ role: "user", content: usuario }] }) });
  j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error((j.error && j.error.message) || ("Anthropic respondió " + r.status));
  return (j.content || []).filter(x => x.type === "text").map(x => x.text).join("");
}

const OPS = {
  estado: () => estado(),
  async guardar({ prov, key: k, recordar }) {
    if (!PROV[prov]) throw new Error("Proveedor desconocido.");
    k = limpiar(k); if (!k) throw new Error("La key está vacía.");
    MEM[prov] = k;
    await escribir("k-" + prov, recordar ? await cifrar(k) : undefined);
    return estado();
  },
  async recordar({ prov, recordar }) {
    const k = await key(prov);
    await escribir("k-" + prov, recordar && k ? await cifrar(k) : undefined);
    return estado();
  },
  async borrar({ prov }) {
    for (const p of prov ? [prov] : Object.keys(PROV)) { delete MEM[p]; await escribir("k-" + p, undefined); }
    return estado();
  },
  llamar: m => llamar(m),
};

self.onmessage = async e => {
  const m = e.data || {};
  try { self.postMessage({ id: m.id, ok: await OPS[m.op](m) }); }
  catch (err) { self.postMessage({ id: m.id, error: String((err && err.message) || err) }); }
};
