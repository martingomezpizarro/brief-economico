"""Valida briefs de data/lecciones, completa campos derivados y actualiza el índice.

Uso: python3 herramientas/publicar_brief.py <id> [<id> ...] [--fuente id=ruta.txt ...]

- Calcula `palabras` (intro + párrafos de secciones, sin notas).
- Si falta `orden`, lo toma de la posición de la primera fuente en la ruta de su categoría.
- Valida: 8 preguntas con 4 opciones en es/en, 6 a 8 tarjetas con tipos válidos, ids coherentes.
- Reemplaza o agrega la entrada en data/lecciones/index.json.
- Con --fuente, lista los números del brief que no aparecen en el texto extraído del PDF.
"""
import json, re, sys, pathlib

RAIZ = pathlib.Path(__file__).resolve().parent.parent
LEC = RAIZ / "data" / "lecciones"
TIPOS = {"idea", "concepto", "mecanismo", "modelo", "econometria", "resultado", "critica", "aplicacion"}
ORDEN_CLAVES = ["id", "cat", "orden", "minutos", "titulo", "bajada", "fuentes", "cita", "intro",
                "secciones", "claves", "preguntas", "palabras", "tarjetas"]


def rutas():
    return {r["id"]: r for r in json.load(open(RAIZ / "data" / "rutas.json"))["rutas"]}


def validar(d):
    err = []
    bid = d["id"]
    if len(d["preguntas"]) != 8:
        err.append(f"{len(d['preguntas'])} preguntas")
    for i, q in enumerate(d["preguntas"], 1):
        q["id"] = f"{bid}-q{i}"
        for l in ("es", "en"):
            if len(q["op"][l]) != 4:
                err.append(f"q{i} {l}: {len(q['op'][l])} opciones")
            if not q["q"].get(l) or not q["exp"].get(l):
                err.append(f"q{i} sin texto {l}")
        if q["ok"] not in range(4):
            err.append(f"q{i} ok inválido")
    if not 6 <= len(d["tarjetas"]) <= 8:
        err.append(f"{len(d['tarjetas'])} tarjetas")
    for i, t in enumerate(d["tarjetas"], 1):
        t["id"] = f"{bid}-t{i}"
        if t["tipo"] not in TIPOS:
            err.append(f"t{i} tipo {t['tipo']}")
        for l in ("es", "en"):
            if not t["q"].get(l) or not t["a"].get(l):
                err.append(f"t{i} sin texto {l}")
    oks = [q["ok"] for q in d["preguntas"]]
    if max(oks.count(k) for k in range(4)) > 3:
        err.append(f"respuestas correctas poco variadas {oks}")
    return err


def numeros_ausentes(d, texto):
    plano = re.sub(r"[.,\s]", "", texto)
    cuerpo = json.dumps({k: d[k] for k in ("intro", "secciones", "claves", "preguntas", "tarjetas")}, ensure_ascii=False)
    cuerpo = re.sub(r"\\\\[a-zA-Z]+|_\{[^}]*\}|\^\{[^}]*\}|\"id\": \"[^\"]*\"", " ", cuerpo)
    nums = set(re.findall(r"\d+(?:[.,]\d+)*", cuerpo))
    return sorted(n for n in nums if len(re.sub(r"[.,]", "", n)) >= 2 and re.sub(r"[.,]", "", n) not in plano)


def main(args):
    fuentes = {}
    ids = []
    it = iter(args)
    for a in it:
        if a == "--fuente":
            k, v = next(it).split("=", 1)
            fuentes[k] = v
        else:
            ids.append(a)
    R = rutas()
    idx = json.load(open(LEC / "index.json"))
    ok_total = True
    for bid in ids:
        f = LEC / f"{bid}.json"
        d = json.load(open(f))
        d.setdefault("minutos", 15)
        if "orden" not in d:
            pasos = R.get(d["cat"], {}).get("pasos", [])
            d["orden"] = pasos.index(d["fuentes"][0]) + 1 if d["fuentes"][0] in pasos else len(pasos) + 1
        d["palabras"] = len(" ".join([d["intro"]] + [p for s in d["secciones"] for p in s["p"]]).split())
        err = validar(d)
        d = {k: d[k] for k in ORDEN_CLAVES}
        json.dump(d, open(f, "w"), ensure_ascii=False, indent=1)
        f.write_text(f.read_text() + "\n")
        entrada = {"id": d["id"], "cat": d["cat"], "orden": d["orden"], "titulo": d["titulo"], "bajada": d["bajada"],
                   "cita": d["cita"], "palabras": d["palabras"], "fuentes": d["fuentes"],
                   "nPreg": len(d["preguntas"]), "nTarj": len(d["tarjetas"])}
        idx = [e for e in idx if e["id"] != bid] + [entrada]
        msg = f"{bid}: {d['palabras']} palabras, {len(d['secciones'])} secciones, orden {d['orden']}"
        if err:
            ok_total = False
            msg += "  ERRORES: " + "; ".join(err)
        if bid in fuentes:
            aus = numeros_ausentes(d, open(fuentes[bid], errors="ignore").read())
            msg += f"\n   números que no están en la fuente: {aus}"
        print(msg)
    idx.sort(key=lambda e: (e["cat"], e["orden"], e["id"]))
    json.dump(idx, open(LEC / "index.json", "w"), ensure_ascii=False)
    sys.exit(0 if ok_total else 1)


if __name__ == "__main__":
    main(sys.argv[1:])
