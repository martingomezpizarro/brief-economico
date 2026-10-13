// Copia prompts/prompts.js dentro de worker/worker.js, entre las marcas
// «prompt maestro» y «utilidades». Uso: node worker/armar.js
const fs = require("fs"), path = require("path");
const raiz = path.join(__dirname, "..");
const prompts = fs.readFileSync(path.join(raiz, "prompts/prompts.js"), "utf8").trimEnd();
const wp = path.join(__dirname, "worker.js");
const w = fs.readFileSync(wp, "utf8");
const ini = w.search(/^\/\/ -+ prompt maestro.*$/m), fin = w.search(/^\/\/ -+ utilidades/m);
if (ini < 0 || fin < 0) throw new Error("No encontré las marcas en worker.js");
const cab = w.slice(ini, w.indexOf("\n", ini) + 1);
fs.writeFileSync(wp, w.slice(0, ini) + cab + "\n" + prompts + "\n\n" + w.slice(fin));
console.log("worker.js actualizado con prompts/prompts.js");
