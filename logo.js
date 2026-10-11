/* Logo de Prebisch: sello de doble anillo con el diagrama de oferta y demanda.
   Lo usan la página (encabezado, carga, Hoy) y diseno/iconos.js (PNG de la app y de los avisos).
   sello(): el logo completo, con el texto en arco.  marca(): versión sin texto para tamaños chicos. */
(function (raiz) {
  "use strict";
  const SERIF = "Cormorant Garamond, Source Serif 4, Georgia, serif";
  const D = "M40 40Q50 64 82 76", S = "M38 78Q62 70 80 38";
  // punto de equilibrio: cruce numérico de las dos curvas
  const q = (a, b, c, t) => [(1 - t) ** 2 * a[0] + 2 * (1 - t) * t * b[0] + t * t * c[0], (1 - t) ** 2 * a[1] + 2 * (1 - t) * t * b[1] + t * t * c[1]];
  const E = (() => {
    let m = [0, 0, 1e9];
    for (let i = 0; i <= 300; i++) for (let j = 0; j <= 300; j++) {
      const u = q([40, 40], [50, 64], [82, 76], i / 300), v = q([38, 78], [62, 70], [80, 38], j / 300);
      const d = Math.hypot(u[0] - v[0], u[1] - v[1]);
      if (d < m[2]) m = [u[0], u[1], d];
    }
    return [+m[0].toFixed(2), +m[1].toFixed(2)];
  })();
  let uid = 0;
  const anillo = (r, w, c) => `<circle cx="60" cy="60" r="${r}" fill="none" stroke="${c}" stroke-width="${w}"/>`;
  function arco(txt, r, c, abajo, size, ls) {
    const id = "pb-arco-" + (uid++);
    const d = abajo ? `M${60 - r} 60A${r} ${r} 0 0 0 ${60 + r} 60` : `M${60 - r} 60A${r} ${r} 0 0 1 ${60 + r} 60`;
    return `<path id="${id}" d="${d}" fill="none"/><text font-family="${SERIF}" font-weight="600" font-size="${size}" letter-spacing="${ls}" fill="${c}"><textPath href="#${id}" startOffset="50%" text-anchor="middle">${txt}</textPath></text>`;
  }
  const rombo = (x, y, c, s) => `<path d="M${x} ${y - s}L${x + s * .35} ${y}L${x} ${y + s}L${x - s * .35} ${y}Z" fill="${c}"/>`;
  function diagrama(c, k, g) {
    return `<g transform="translate(60 60) scale(${k}) translate(-62 -59)">` +
      `<path d="M34 32V86H90" fill="none" stroke="${c}" stroke-width="${1.1 * g}" stroke-linecap="round" stroke-linejoin="round"/>` +
      (g < 1.6 ? `<path d="M34 ${E[1]}H${E[0]}V86" fill="none" stroke="${c}" stroke-width=".6" stroke-dasharray="1.6 1.8"/>` : "") +
      `<path d="${D}" fill="none" stroke="${c}" stroke-width="${1.9 * g}" stroke-linecap="round"/>` +
      `<path d="${S}" fill="none" stroke="${c}" stroke-width="${1.9 * g}" stroke-linecap="round"/>` +
      `<circle cx="${E[0]}" cy="${E[1]}" r="${2.8 * Math.sqrt(g)}" fill="${c}"/></g>`;
  }
  /* opciones: color, fondo (null = transparente), tam (px), titulo (texto accesible) */
  function sello(o) {
    o = o || {};
    const c = o.color || "currentColor", tam = o.tam || 120;
    const fondo = o.fondo ? `<rect width="120" height="120" rx="${o.radio || 0}" fill="${o.fondo}"/>` : "";
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="${tam}" height="${tam}" role="img" aria-label="${o.titulo || "Prebisch"}">${fondo}` +
      anillo(56, 1.1, c) + anillo(53.6, .5, c) +
      arco("PREBISCH", 43.5, c, false, 7.4, 2.2) + arco("ECONOMÍA · DE A POCO", 50.5, c, true, 6, 1.6) +
      rombo(18.5, 60, c, 1.6) + rombo(101.5, 60, c, 1.6) + diagrama(c, .86, 1) + `</svg>`;
  }
  /* Sin texto y con trazo más grueso (g) para 16–48 px y para la insignia de los avisos. */
  function marca(o) {
    o = o || {};
    const c = o.color || "currentColor", tam = o.tam || 32, g = o.grosor || 2.4;
    const fondo = o.fondo ? `<rect width="120" height="120" rx="${o.radio || 0}" fill="${o.fondo}"/>` : "";
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="${tam}" height="${tam}" aria-hidden="true">${fondo}` +
      anillo(o.fondo ? 46 : 54, 1.8 * g, c) + diagrama(c, o.fondo ? .78 : .9, g) + `</svg>`;
  }
  raiz.PREBISCH_LOGO = { sello, marca };
})(typeof self !== "undefined" ? self : globalThis);
