// Genera los íconos de la app a partir de logo.js. Uso: node diseno/iconos.js
// Necesita Playwright (Chromium) y la Cormorant Garamond SemiBold instalada en el sistema
// (o conexión a Google Fonts desde Chromium); si no está, el texto sale con otra serif.
const path = require("path"), fs = require("fs");
const { chromium } = require("playwright");
const raiz = path.join(__dirname, "..");
require(path.join(raiz, "logo.js"));
const L = globalThis.PREBISCH_LOGO;
const TINTA = "#5A3420", CREMA = "#FAF5EC";

// SVG del favicon (sin texto, así no depende de ninguna fuente)
fs.writeFileSync(path.join(raiz, "icono.svg"), L.marca({ tam: 64, color: TINTA, fondo: CREMA, radio: 26, grosor: 2.6 }) + "\n");

const PNG = [
  // nombre, lado, escala del sello dentro del cuadrado, fondo
  ["icono-192.png", 192, .9, CREMA, "sello"],
  ["icono-512.png", 512, .9, CREMA, "sello"],
  ["icono-maskable-512.png", 512, .72, CREMA, "sello"],
  ["apple-touch-icon.png", 180, .84, CREMA, "sello"],
  ["favicon-32.png", 32, 1, null, "marca"],
  ["insignia-96.png", 96, 1, null, "insignia"],
];
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage();
  for (const [nombre, lado, k, fondo, tipo] of PNG) {
    const svg = tipo === "sello" ? L.sello({ tam: Math.round(lado * k), color: TINTA })
      : tipo === "marca" ? L.marca({ tam: lado, color: TINTA, fondo: CREMA, radio: 26, grosor: 2.6 })
      : L.marca({ tam: lado, color: "#FFFFFF", grosor: 3 });
    await p.setViewportSize({ width: lado, height: lado });
    await p.setContent(`<!doctype html><html><head><link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@600&display=block" rel="stylesheet">
      <style>html,body{margin:0;width:${lado}px;height:${lado}px;background:${fondo || "transparent"};display:flex;align-items:center;justify-content:center}</style></head>
      <body>${svg}</body></html>`, { waitUntil: "networkidle" });
    await p.evaluate(() => document.fonts.ready);
    await p.screenshot({ path: path.join(raiz, "iconos", nombre), omitBackground: !fondo });
    console.log("iconos/" + nombre);
  }
  await b.close();
})();
