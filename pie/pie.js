/* Pie de página institucional — componente reutilizable.
   Igual en todos los proyectos: los datos salen de window.PIE_CONFIG (pie/pie.config.js).
   Uso:
     <footer id="pie"></footer>                  → se completa solo al cargar la página
     PIE.montar(elemento)                        → montarlo a mano en otro elemento
     PIE.terminos()                              → devuelve el nodo de la página de términos
   Estilos: usa los tokens del sitio (--line, --muted, --accent, --honey, --ink, --serif, --mono)
   con valores de respaldo, así funciona en modo claro y oscuro sin tocar nada más. */
(function () {
  "use strict";
  const C = window.PIE_CONFIG || {};
  const A = C.autor || {}, P = C.proyecto || {}, COL = C.colaborar || {};

  /* ---------- utilidades ---------- */
  function h(tag, attrs, ...kids) {
    const e = document.createElement(tag);
    if (attrs) for (const k in attrs) {
      const v = attrs[k];
      if (v == null || v === false) continue;
      if (k === "on") for (const ev in v) e.addEventListener(ev, v[ev]);
      else if (k === "class") e.className = v;
      else e.setAttribute(k, v === true ? "" : v);
    }
    for (const c of kids.flat()) { if (c == null || c === false) continue; e.append(c.nodeType ? c : String(c)); }
    return e;
  }
  const ext = (href, ...kids) => h("a", { href, target: "_blank", rel: "noopener noreferrer" }, ...kids);
  const completar = qué => h("span", { class: "pie-completar" }, "[COMPLETAR: " + qué + "]");
  const sinProto = u => String(u || "").replace(/^https?:\/\//, "").replace(/\/$/, "");
  function fechaLarga(iso) {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso || "");
    if (!m) return null;
    return new Date(+m[1], +m[2] - 1, +m[3]).toLocaleDateString("es-AR", { day: "numeric", month: "long", year: "numeric" });
  }
  function anios() {
    const y = new Date().getFullYear(), i = P.anioInicio || y;
    return i < y ? i + "–" + y : String(y);
  }
  const derechos = () => "© " + anios() + " " + (A.nombre || "") + ". Todos los derechos reservados.";
  const rutaTerminos = (sec) => (P.terminos || "#terminos") + (sec ? "-" + sec : "");

  /* ---------- estilos ---------- */
  function estilos() {
    if (document.getElementById("pie-estilos")) return;
    const css = `
.pie{margin:56px auto 0;max-width:52rem;width:100%;box-sizing:border-box;border-top:1px solid var(--line,#ddd);padding-top:24px;display:flex;flex-direction:column;gap:20px;font-size:14px;line-height:1.5;color:var(--muted,#666)}
.pie a{color:var(--accent,inherit)}
.pie a:hover{color:var(--ink,inherit)}
.pie-grid{display:grid;grid-template-columns:minmax(0,1fr);gap:20px}
@media (min-width:760px){.pie-grid{grid-template-columns:minmax(0,1fr) minmax(0,1.3fr);gap:20px 48px}}
.pie-col{display:flex;flex-direction:column;gap:6px;min-width:0}
.pie-tit{font-family:var(--mono,monospace);font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:var(--accent,inherit);margin:0 0 2px}
.pie p{margin:0}
.pie-autor{color:var(--ink,inherit)}
.pie-col a{overflow-wrap:anywhere}
.pie-botones{display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin-block:4px}
.pie-btn{display:inline-flex;align-items:center;min-height:40px;padding:0 14px;border-radius:2px;font-family:var(--mono,monospace);font-size:12px;text-decoration:none;border:1px solid var(--line2,#ccc);color:var(--ink,inherit)}
.pie a.pie-btn.pie-cafe{background:var(--accent,#333);border-color:var(--accent,#333);color:var(--accent-ink,#fff)}
.pie a.pie-btn.pie-cafe:hover{color:var(--accent-ink,#fff);opacity:.9}
.pie-alias{display:inline-flex;align-items:center;gap:8px;flex-wrap:wrap;font-family:var(--mono,monospace);font-size:12px}
.pie-alias code{background:var(--honey,#eee);color:var(--ink,inherit);padding:3px 6px;border-radius:2px}
.pie-copiar{font:12px var(--mono,monospace);background:transparent;border:1px solid var(--line2,#ccc);border-radius:2px;min-height:32px;padding:0 8px;color:var(--muted,#666);cursor:pointer}
.pie-nota{font-size:12.5px}
.pie-legal{border-top:1px dashed var(--line2,#ccc);padding-top:16px;display:flex;flex-direction:column;gap:10px}
.pie-legal .pie-desc{text-align:justify;hyphens:auto;-webkit-hyphens:auto}
.pie-links{display:flex;flex-wrap:wrap;gap:4px 16px;font-family:var(--mono,monospace);font-size:12px}
.pie-links a{display:inline-flex;align-items:center;min-height:32px}
.pie-meta{font-family:var(--mono,monospace);font-size:11.5px;display:flex;flex-wrap:wrap;gap:2px 14px}
.pie-completar{display:inline-block;font-family:var(--mono,monospace);font-size:12px;color:var(--again,#b00);border:1px dashed currentColor;padding:2px 6px;border-radius:2px}
/* página de términos */
.terminos{display:flex;flex-direction:column;gap:14px}
.terminos h1{font-size:27px;line-height:1.22;text-align:center}
.terminos h2{font-size:19px;margin-top:14px}
.terminos section{display:flex;flex-direction:column;gap:10px;scroll-margin-top:16px}
.terminos p{text-align:justify;hyphens:auto;-webkit-hyphens:auto}
.terminos .terminos-sub{text-align:center;font-family:var(--mono,monospace);font-size:12px;color:var(--muted,#666)}
.terminos-indice{list-style:none;padding:0;margin:0;display:flex;flex-direction:column;gap:2px;border-top:1px solid var(--line,#ddd);border-bottom:1px solid var(--line,#ddd);padding-block:10px;font-size:15px}
.terminos-indice li{display:flex;gap:4px;align-items:baseline}
.terminos-indice a{text-decoration:none;flex:1;min-width:0;padding-block:5px}
.terminos-indice .n{font-family:var(--mono,monospace);font-size:11px;color:var(--muted,#666);min-width:1.8rem;flex:none}
`;
    document.head.append(h("style", { id: "pie-estilos" }, css));
  }

  /* ---------- pie ---------- */
  function opcionColaborar() {
    const o = COL.otra || {};
    const etiqueta = o.etiqueta || "Otra opción";
    if (o.link) { const a = ext(o.link, etiqueta); a.className = "pie-btn"; return a; }
    if (o.valor) {
      const btn = h("button", { class: "pie-copiar", type: "button", "aria-label": "Copiar " + o.valor }, "Copiar");
      btn.addEventListener("click", () => {
        (navigator.clipboard ? navigator.clipboard.writeText(o.valor) : Promise.reject())
          .then(() => { btn.textContent = "Copiado"; setTimeout(() => btn.textContent = "Copiar", 1600); })
          .catch(() => { btn.textContent = "Copialo a mano"; });
      });
      return h("span", { class: "pie-alias" }, etiqueta + ":", h("code", null, o.valor), btn);
    }
    return completar("alias o link de " + etiqueta);
  }

  function pie() {
    const actualizado = fechaLarga(P.actualizado);
    return [
      h("div", { class: "pie-grid" },
        h("section", { class: "pie-col", "aria-label": "Autoría" },
          h("p", { class: "pie-tit" }, "Autoría"),
          h("p", { class: "pie-autor" }, "Desarrollado por ", h("b", null, A.nombre || "")),
          A.mail ? h("p", null, "Contacto: ", h("a", { href: "mailto:" + A.mail }, A.mail)) : completar("mail de contacto"),
          A.sitio ? h("p", null, "Sitio personal: ", ext(A.sitio, sinProto(A.sitio))) : null),
        h("section", { class: "pie-col", "aria-label": "Colaborar" },
          h("p", { class: "pie-tit" }, "Colaborar"),
          h("p", null, COL.texto || ""),
          h("div", { class: "pie-botones" },
            COL.cafecito === false ? null : COL.cafecito ? Object.assign(ext(COL.cafecito, "Invitame un cafecito"), { className: "pie-btn pie-cafe" }) : completar("link de Cafecito"),
            opcionColaborar()),
          h("p", { class: "pie-nota" }, "Las colaboraciones son voluntarias, no constituyen contraprestación por ningún servicio ni otorgan derechos sobre el contenido."))),
      h("section", { class: "pie-legal", "aria-label": "Aviso legal" },
        C.descargoCorto ? h("p", { class: "pie-desc" }, C.descargoCorto) : null,
        h("p", { class: "pie-desc" }, "El contenido se ofrece «tal cual», sin garantías de exactitud, integridad ni actualización, y el autor no se responsabiliza por decisiones tomadas ni por daños derivados de su uso."),
        h("nav", { class: "pie-links", "aria-label": "Información legal" },
          (P.enlaces || []).map(e => h("a", { href: e.href }, e.texto)),
          h("a", { href: rutaTerminos() }, "Términos y condiciones de uso"),
          C.privacidad ? h("a", { href: rutaTerminos("privacidad") }, "Política de privacidad") : null,
          P.repo ? ext(P.repo + "/issues/new", "Reportar un error") : null),
        h("p", { class: "pie-meta" },
          h("span", null, P.licencia ? "© " + anios() + " " + A.nombre + " · " + P.licencia : derechos()),
          h("span", null, "Última actualización: ", actualizado || completar("fecha")),
          h("span", null, "Jurisdicción: República Argentina")))
    ];
  }

  function montar(el) {
    if (!el) return;
    estilos();
    el.classList.add("pie");
    el.replaceChildren(...pie());
  }

  /* ---------- términos y condiciones ---------- */
  function seccion(id, titulo, parrafos) {
    return { id, titulo, nodo: h("section", { id: id ? rutaTerminos(id).replace(/^#/, "") : null }, h("h2", null, titulo), parrafos.map(p => p.nodeType ? p : h("p", null, p))) };
  }

  function terminos() {
    estilos();
    const nom = P.nombre || "este sitio";
    const actualizado = fechaLarga(P.actualizado);
    const generales1 = [
      seccion("objeto", "Objeto y alcance", [
        P.descripcion || completar("descripción del proyecto"),
        "El uso del sitio implica la aceptación de estos términos. Si no estás de acuerdo con ellos, te pedimos que no lo uses.",
      ]),
      seccion("caracter", "Carácter informativo y educativo", [
        "El contenido de " + nom + " es informativo y educativo, y se ofrece «tal cual», sin garantías de ningún tipo, expresas o implícitas, sobre su exactitud, integridad, vigencia o adecuación a un fin determinado.",
      ]),
      seccion("responsabilidad", "Limitación de responsabilidad", [
        "El autor no se responsabiliza por las decisiones que se tomen a partir del contenido del sitio ni por los daños directos o indirectos, de cualquier naturaleza, que pudieran derivarse del uso del sitio o de su información, ni de la imposibilidad de usarlo.",
      ]),
      seccion("disponibilidad", "Disponibilidad y cambios", [
        "El sitio puede contener errores y sufrir interrupciones. Su contenido, sus funciones y estos términos pueden modificarse, suspenderse o discontinuarse en cualquier momento y sin previo aviso.",
      ]),
    ];
    const especificos = (C.especificos || []).map(e => seccion(e.id, e.titulo, e.parrafos || []));
    const o = COL.otra || {};
    const generales2 = [
      seccion("terceros", "Enlaces a sitios de terceros", [
        "Los enlaces a sitios y servicios de terceros se incluyen solo como referencia y no implican aval ni relación con ellos. El autor no responde por su contenido, su disponibilidad ni sus políticas.",
      ]),
      seccion("colaboraciones", "Colaboraciones voluntarias", [
        (COL.texto || "") + " Las colaboraciones son voluntarias, no constituyen contraprestación por ningún servicio ni otorgan derechos sobre el contenido, ni prioridad, soporte o funciones adicionales.",
        h("p", null, "Medios: ", ...(COL.cafecito === false ? [] : [COL.cafecito ? ext(COL.cafecito, "Cafecito") : completar("link de Cafecito"), " · "]),
          o.link ? ext(o.link, o.etiqueta || "otra opción") : o.valor ? (o.etiqueta || "Otra opción") + " (" + o.valor + ")" : completar("alias o link de " + (o.etiqueta || "la segunda opción")), "."),
      ]),
      seccion("propiedad", "Propiedad intelectual", [
        P.licencia
          ? "Contenido y código: " + P.licencia + ", salvo indicación en contrario."
          : derechos() + " Esto incluye los textos, el diseño, el logo y el código del sitio, salvo indicación en contrario.",
        "Las marcas, obras y materiales de terceros que se mencionan o citan pertenecen a sus respectivos titulares.",
      ]),
    ];
    const priv = C.privacidad ? [seccion("privacidad", "Privacidad y protección de datos personales (Ley 25.326)", [
      ...(C.privacidad.parrafos || []),
      h("p", null, "Contacto para consultas y pedidos sobre tus datos: ", A.mail ? h("a", { href: "mailto:" + A.mail }, A.mail) : completar("mail"), "."),
    ])] : [];
    const cierre = [
      seccion("jurisdiccion", "Actualización, ley aplicable y jurisdicción", [
        "Última actualización de estos términos y del sitio: " + (actualizado || "[COMPLETAR: fecha]") + ".",
        "Estos términos se rigen por las leyes de la República Argentina. Cualquier controversia se someterá a los tribunales competentes de la República Argentina.",
        h("p", null, "Responsable: ", A.nombre || "", A.mail ? [" · ", h("a", { href: "mailto:" + A.mail }, A.mail)] : null, A.sitio ? [" · ", ext(A.sitio, sinProto(A.sitio))] : null, "."),
      ]),
    ];
    const todas = [...generales1, ...especificos, ...generales2, ...priv, ...cierre];
    return h("article", { class: "terminos" },
      h("h1", null, "Términos y condiciones de uso"),
      h("p", { class: "terminos-sub" }, nom + (actualizado ? " · actualizados el " + actualizado : "")),
      h("ol", { class: "terminos-indice", "aria-label": "Contenido" },
        todas.map((s, i) => h("li", null, h("span", { class: "n" }, (i + 1) + "."), h("a", { href: rutaTerminos(s.id) }, s.titulo)))),
      todas.map(s => s.nodo));
  }

  window.PIE = { montar, terminos };
  const auto = () => montar(document.getElementById("pie"));
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", auto); else auto();
})();
