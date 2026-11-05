/* Gráficos interactivos dentro de los briefs de Prebisch.
   Cada sección de un brief puede traer "graf", una lista paralela a "eq": graf[j] es el
   gráfico (o la lista de gráficos) de la ecuación j y se dibuja justo debajo de ella.
   Las fórmulas de las curvas se leen con un evaluador propio (no se usa eval), así que
   un brief generado por IA no puede ejecutar código. Formato completo: docs/graficos.md */
(function (raiz) {
  "use strict";

  /* ---------- evaluador de expresiones ---------- */
  const FN = {
    exp: Math.exp, log: Math.log, ln: Math.log, sqrt: Math.sqrt, abs: Math.abs,
    min: Math.min, max: Math.max, pow: Math.pow,
    // utilidad CRRA: (c^(1-θ) - 1)/(1-θ), con el caso logarítmico en θ = 1
    crra: (c, th) => Math.abs(th - 1) < 1e-9 ? Math.log(c) : (Math.pow(c, 1 - th) - 1) / (1 - th),
    si: (c, a, b) => c ? a : b,
  };
  const CONST = { pi: Math.PI };

  function tokens(s) {
    const out = []; let i = 0;
    while (i < s.length) {
      const ch = s[i];
      if (/\s/.test(ch)) { i++; continue; }
      const num = /^(\d+\.?\d*|\.\d+)(e[+-]?\d+)?/i.exec(s.slice(i));
      if (num) { out.push({ k: "n", v: parseFloat(num[0]) }); i += num[0].length; continue; }
      const id = /^[A-Za-z_][A-Za-z0-9_]*/.exec(s.slice(i));
      if (id) { out.push({ k: "id", v: id[0] }); i += id[0].length; continue; }
      const op = /^(<=|>=|==|!=|&&|\|\||[-+*/^(),<>!])/.exec(s.slice(i));
      if (op) { out.push({ k: "op", v: op[0] }); i += op[0].length; continue; }
      throw new Error("Carácter no válido en la fórmula: " + ch);
    }
    return out;
  }
  // devuelve una función env => número
  function compilar(src) {
    const tk = tokens(String(src)); let p = 0;
    const ver = v => tk[p] && tk[p].k === "op" && tk[p].v === v;
    const tomar = v => { if (!ver(v)) throw new Error("Se esperaba «" + v + "» en: " + src); p++; };
    const bin = (sig, ops) => () => {
      let a = sig();
      while (tk[p] && tk[p].k === "op" && ops.includes(tk[p].v)) {
        const o = tk[p++].v, b = sig(), x = a;
        a = ({
          "||": e => x(e) || b(e), "&&": e => x(e) && b(e),
          "<": e => +(x(e) < b(e)), ">": e => +(x(e) > b(e)), "<=": e => +(x(e) <= b(e)), ">=": e => +(x(e) >= b(e)),
          "==": e => +(x(e) === b(e)), "!=": e => +(x(e) !== b(e)),
          "+": e => x(e) + b(e), "-": e => x(e) - b(e), "*": e => x(e) * b(e), "/": e => x(e) / b(e),
        })[o];
      }
      return a;
    };
    function potencia() {
      const a = unario();
      if (ver("^")) { p++; const b = potencia(); return e => Math.pow(a(e), b(e)); }
      return a;
    }
    function unario() {
      if (ver("-")) { p++; const a = unario(); return e => -a(e); }
      if (ver("+")) { p++; return unario(); }
      if (ver("!")) { p++; const a = unario(); return e => +!a(e); }
      return atomo();
    }
    function atomo() {
      const t = tk[p++];
      if (!t) throw new Error("Fórmula incompleta: " + src);
      if (t.k === "n") return () => t.v;
      if (t.k === "op" && t.v === "(") { const a = o(); tomar(")"); return a; }
      if (t.k === "id") {
        if (ver("(")) {
          const f = FN[t.v]; if (!f) throw new Error("Función desconocida: " + t.v);
          p++; const args = [];
          if (!ver(")")) { args.push(o()); while (ver(",")) { p++; args.push(o()); } }
          tomar(")");
          return e => f(...args.map(a => a(e)));
        }
        const nombre = t.v;
        return e => {
          if (Object.prototype.hasOwnProperty.call(e, nombre)) return e[nombre];
          if (nombre in CONST) return CONST[nombre];
          throw new Error("Variable desconocida: " + nombre);
        };
      }
      throw new Error("No entiendo «" + t.v + "» en: " + src);
    }
    const mul = bin(potencia, ["*", "/"]), suma = bin(mul, ["+", "-"]), comp = bin(suma, ["<", ">", "<=", ">=", "==", "!="]);
    const y = bin(comp, ["&&"]), o = bin(y, ["||"]);
    const f = o();
    if (p < tk.length) throw new Error("Sobra texto en la fórmula: " + src);
    return f;
  }
  const cache = new Map();
  function ev(src, env) {
    if (typeof src === "number") return src;
    let f = cache.get(src); if (!f) { f = compilar(src); cache.set(src, f); }
    try { return f(env); } catch (_) { return NaN; }
  }

  /* ---------- utilidades ---------- */
  const NS = "http://www.w3.org/2000/svg";
  function el(tag, at, ...kids) {
    const e = document.createElement(tag);
    for (const k in at || {}) { const v = at[k]; if (v == null) continue; if (k === "on") for (const x in v) e.addEventListener(x, v[x]); else e.setAttribute(k, v); }
    kids.flat().forEach(c => c != null && e.append(c.nodeType ? c : String(c)));
    return e;
  }
  function sv(tag, at) { const e = document.createElementNS(NS, tag); for (const k in at) e.setAttribute(k, at[k]); return e; }
  const L = (x, lang) => x == null ? "" : typeof x === "string" ? x : (x[lang] || x.es || "");
  function decDe(step) { const s = String(step); return s.includes(".") ? s.split(".")[1].length : 0; }
  function fmt(v, dec, lang) {
    if (!isFinite(v)) return "—";
    const s = Math.abs(v) >= 1e5 ? v.toExponential(2) : v.toFixed(dec);
    return lang === "es" ? s.replace(".", ",") : s;
  }
  function fmtTex(v, dec, lang) {
    if (!isFinite(v)) return "\\text{—}";
    let s = Math.abs(v) >= 1e5 ? v.toExponential(2).replace(/e\+?(-?)(\d+)/, "\\times 10^{$1$2}") : v.toFixed(dec);
    if (s.includes(".") && !s.includes("times")) s = s.replace(/\.?0+$/, "");
    return lang === "es" ? s.replace(".", "{,}") : s;
  }
  function ticks(a, b, n) {
    const paso0 = (b - a) / Math.max(1, n), mag = Math.pow(10, Math.floor(Math.log10(paso0)));
    const paso = [1, 2, 2.5, 5, 10].map(m => m * mag).find(s => s >= paso0) || paso0;
    const out = []; for (let v = Math.ceil(a / paso) * paso; v <= b + paso * 1e-9; v += paso) out.push(+v.toFixed(10));
    return { out, dec: Math.max(0, -Math.floor(Math.log10(paso) + 1e-9)) };
  }
  const COLORES = ["var(--accent)", "var(--ink2)", "var(--again)"];

  /* ---------- un gráfico ---------- */
  function uno(G, lang) {
    const es = lang === "es";
    const caja = el("div", { class: "graf" });
    const N = 160, W = 340, H = 210, M = { l: 40, r: 10, t: 10, b: 32 };
    const vals = {};
    (G.params || []).forEach(p => { vals[p.id] = p.val; });

    // fórmula con los números vivos
    const formula = el("div", { class: "graf-f", "aria-live": "polite" });
    caja.append(formula);

    // sliders
    const ctrls = el("div", { class: "graf-c" });
    const salidas = {};
    (G.params || []).forEach(p => {
      const dec = p.dec != null ? p.dec : decDe(p.step || 0.01);
      const out = el("output", null, fmt(p.val, dec, lang));
      salidas[p.id] = { out, dec };
      const inp = el("input", {
        type: "range", min: p.min, max: p.max, step: p.step || 0.01, value: p.val,
        "aria-label": L(p.label, lang) || p.id,
        on: { input: e => { vals[p.id] = +e.target.value; pedir(); } },
      });
      ctrls.append(el("label", null, el("span", { class: "graf-n" }, p.sym || p.id, p.label ? el("small", null, L(p.label, lang)) : null), inp, out));
    });
    caja.append(ctrls);

    // valores destacados
    const chips = el("div", { class: "graf-v" });
    caja.append(chips);

    // lienzo
    const svg = sv("svg", { viewBox: `0 0 ${W} ${H}`, class: "graf-svg", role: "img" });
    svg.setAttribute("aria-label", L(G.titulo, lang) || (es ? "Gráfico interactivo de la ecuación" : "Interactive chart of the equation"));
    caja.append(svg);
    const ley = el("div", { class: "graf-l" });
    (G.curvas || []).forEach((c, i) => {
      const col = c.color != null ? COLORES[c.color] : COLORES[i % 3];
      const muestra = el("i", { style: c.estilo === "punteada" ? `border-top:2px dashed ${col}` : `border-top:2px solid ${col}` });
      ley.append(el("span", null, muestra, L(c.label, lang)));
    });
    caja.append(ley);
    if (G.mirar) caja.append(el("p", { class: "graf-m" }, el("b", null, es ? "Qué mirar: " : "What to look for: "), L(G.mirar, lang)));

    function entorno() {
      const env = Object.assign({}, vals);
      const x0 = ev(G.x.min, env), x1 = ev(G.x.max, env);
      env.__x0 = x0; env.__x1 = x1;
      (G.calc || []).forEach(c => {
        if (c.integral != null) {
          const cv = G.curvas[c.integral]; let s = 0, prev = null; const n = 400;
          for (let i = 0; i <= n; i++) {
            const x = x0 + (x1 - x0) * i / n; const y = ev(cv.f, Object.assign({}, env, { [G.x.id]: x }));
            if (prev != null && isFinite(y) && isFinite(prev)) s += (y + prev) / 2 * (x1 - x0) / n;
            prev = y;
          }
          env[c.id] = s;
        } else env[c.id] = ev(c.f, env);
      });
      return env;
    }

    function pintarFormula(env) {
      let tpl = G.tex;
      if (Array.isArray(tpl)) { const t = tpl.find(o => o.si == null || ev(o.si, env)); tpl = t ? t.tex : ""; }
      if (!tpl) { formula.textContent = ""; return; }
      const decs = {};
      (G.params || []).forEach(p => { decs[p.id] = salidas[p.id].dec; });
      (G.calc || []).forEach(c => { decs[c.id] = c.dec != null ? c.dec : 2; });
      const tex = tpl.replace(/\[\[([A-Za-z_][A-Za-z0-9_]*)\]\]/g, (m, id) => {
        const v = env[id]; const s = fmtTex(v, decs[id] != null ? decs[id] : 2, lang);
        return v < 0 ? "(" + s + ")" : s;
      });
      if (raiz.MathJax && MathJax.tex2svg) {
        try { formula.replaceChildren(MathJax.tex2svg(tex, { display: true })); return; } catch (_) { }
      }
      formula.replaceChildren(el("code", null, tex));
    }

    function pintarChips(env) {
      chips.replaceChildren(...(G.valores || []).map(v => {
        let txt;
        if (v.casos) { const c = v.casos.find(o => o.si == null || ev(o.si, env)); txt = c ? L(c.texto, lang) : ""; }
        else {
          const x = ev(v.f, env);
          txt = v.pct ? fmt(x * 100, v.dec != null ? v.dec : 1, lang) + " %" : fmt(x, v.dec != null ? v.dec : 2, lang) + (v.unidad ? " " + L(v.unidad, lang) : "");
        }
        return el("div", null, el("small", null, L(v.label, lang)), el("b", null, txt));
      }));
    }

    function pintarSvg(env) {
      svg.replaceChildren();
      const x0 = env.__x0, x1 = env.__x1;
      const series = (G.curvas || []).map(c => {
        const pts = [];
        for (let i = 0; i <= N; i++) {
          const x = x0 + (x1 - x0) * i / N; pts.push([x, ev(c.f, Object.assign({}, env, { [G.x.id]: x }))]);
        }
        return pts;
      });
      let y0 = G.y && G.y.min != null ? ev(G.y.min, env) : Infinity, y1 = G.y && G.y.max != null ? ev(G.y.max, env) : -Infinity;
      const auto0 = !(G.y && G.y.min != null), auto1 = !(G.y && G.y.max != null);
      series.flat().forEach(([, y]) => { if (!isFinite(y)) return; if (auto0) y0 = Math.min(y0, y); if (auto1) y1 = Math.max(y1, y); });
      if (!isFinite(y0) || !isFinite(y1)) { y0 = 0; y1 = 1; }
      if (G.y && G.y.cero !== false) { if (auto0) y0 = Math.min(y0, 0); if (auto1) y1 = Math.max(y1, 0); }
      if (y1 - y0 < 1e-9) { y1 += 1; y0 -= 1; }
      const pad = (y1 - y0) * 0.06; if (auto1) y1 += pad; if (auto0 && y0 < 0) y0 -= pad;
      const X = x => M.l + (x - x0) / (x1 - x0) * (W - M.l - M.r);
      const Y = y => M.t + (1 - (y - y0) / (y1 - y0)) * (H - M.t - M.b);
      const ty = ticks(y0, y1, 4), tx = ticks(x0, x1, 5);
      ty.out.forEach(v => {
        svg.append(sv("line", { x1: M.l, x2: W - M.r, y1: Y(v), y2: Y(v), style: "stroke:var(--line);stroke-width:1" }));
        const t = sv("text", { x: M.l - 4, y: Y(v) + 3.5, "text-anchor": "end", class: "graf-t" }); t.textContent = fmt(v, ty.dec, lang); svg.append(t);
      });
      tx.out.forEach(v => { const t = sv("text", { x: X(v), y: H - M.b + 13, "text-anchor": "middle", class: "graf-t" }); t.textContent = fmt(v, tx.dec, lang); svg.append(t); });
      if (y0 < 0 && y1 > 0) svg.append(sv("line", { x1: M.l, x2: W - M.r, y1: Y(0), y2: Y(0), style: "stroke:var(--line2);stroke-width:1" }));
      svg.append(sv("line", { x1: M.l, x2: M.l, y1: M.t, y2: H - M.b, style: "stroke:var(--line2);stroke-width:1" }));
      const ex = sv("text", { x: (M.l + W - M.r) / 2, y: H - 4, "text-anchor": "middle", class: "graf-t graf-eje" }); ex.textContent = L(G.x.label, lang) || G.x.id; svg.append(ex);
      if (G.y && G.y.label) { const ey = sv("text", { x: M.l + 4, y: M.t + 10, class: "graf-t graf-eje" }); ey.textContent = L(G.y.label, lang); svg.append(ey); }
      // recorte para que nada se salga del área
      const id = "gc" + Math.random().toString(36).slice(2, 8);
      const defs = sv("defs", {}), cp = sv("clipPath", { id }); cp.append(sv("rect", { x: M.l, y: M.t, width: W - M.l - M.r, height: H - M.t - M.b })); defs.append(cp); svg.append(defs);
      const g = sv("g", { "clip-path": `url(#${id})` }); svg.append(g);
      (G.curvas || []).forEach((c, i) => {
        const col = c.color != null ? COLORES[c.color] : COLORES[i % 3];
        let d = "", abierto = false;
        series[i].forEach(([x, y]) => {
          if (!isFinite(y)) { abierto = false; return; }
          const yy = Math.max(-1e4, Math.min(1e4, Y(y)));
          d += (abierto ? "L" : "M") + X(x).toFixed(1) + " " + yy.toFixed(1); abierto = true;
        });
        if (c.estilo === "area") {
          const base = Y(Math.max(y0, Math.min(y1, 0)));
          const fin = series[i].filter(([, y]) => isFinite(y));
          if (fin.length) g.append(sv("path", { d: "M" + X(fin[0][0]) + " " + base + d.replace(/^M/, "L") + "L" + X(fin[fin.length - 1][0]) + " " + base + "Z", style: `fill:${col};opacity:.16;stroke:none` }));
        }
        g.append(sv("path", { d, style: `fill:none;stroke:${col};stroke-width:2;stroke-linejoin:round;stroke-linecap:round${c.estilo === "punteada" ? ";stroke-dasharray:5 4" : ""}` }));
      });
      (G.marcas || []).forEach(m => {
        const x = ev(m.x, env); if (!isFinite(x) || x < x0 || x > x1) return;
        g.append(sv("line", { x1: X(x), x2: X(x), y1: M.t, y2: H - M.b, style: "stroke:var(--muted);stroke-width:1;stroke-dasharray:2 3" }));
        if (m.label) { const t = sv("text", { x: X(x) + 3, y: M.t + 10, class: "graf-t" }); t.textContent = L(m.label, lang); g.append(t); }
      });
      (G.puntos || []).forEach(pt => {
        const x = ev(pt.x, env), y = ev(pt.y, env); if (!isFinite(x) || !isFinite(y)) return;
        g.append(sv("circle", { cx: X(x), cy: Y(y), r: 4, style: "fill:var(--accent);stroke:var(--surface);stroke-width:2" }));
      });
    }

    let pendiente = false;
    function pintar() {
      pendiente = false;
      const env = entorno();
      for (const id in salidas) salidas[id].out.textContent = fmt(vals[id], salidas[id].dec, lang);
      pintarFormula(env); pintarChips(env); pintarSvg(env);
    }
    function pedir() { if (!pendiente) { pendiente = true; requestAnimationFrame(pintar); } }
    pintar();
    // si MathJax todavía no cargó, vuelve a pintar la fórmula cuando esté
    if (!(raiz.MathJax && MathJax.tex2svg)) {
      let n = 0; const iv = setInterval(() => { if ((raiz.MathJax && MathJax.tex2svg) || ++n > 40) { clearInterval(iv); pintar(); } }, 250);
    }
    return caja;
  }

  function render(spec, lang) {
    if (!spec) return null;
    const lista = Array.isArray(spec) ? spec : [spec];
    const nodos = [];
    lista.forEach(G => {
      try { if (G && G.x && Array.isArray(G.curvas)) nodos.push(uno(G, lang || "es")); }
      catch (e) { console.warn("Prebisch: gráfico inválido", e); }
    });
    return nodos.length ? nodos : null;
  }

  raiz.PrebischGraf = { render, compilar };
})(typeof window !== "undefined" ? window : globalThis);
