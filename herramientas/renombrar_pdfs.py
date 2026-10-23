#!/usr/bin/env python3
"""Propone y aplica la convención de nombres de los PDF del rack.

Formato:  NNNN - Cita (año) - Título - tipo.pdf
Ejemplo:  0165 - Michel y Díaz (2015) - Determinantes del riesgo soberano en República Dominicana - paper.pdf

El número de cuatro cifras es el id de la lectura en data/indice.json y es lo que usa la app
para vincular cada PDF de Drive con su lectura sin adivinar. Los archivos que ya empiezan con
un número de lectura se respetan. El resto se empareja por parecido del nombre, con el mismo
criterio que «Mi biblioteca» de la app.

Uso:
  python3 herramientas/renombrar_pdfs.py "C:/Users/Usuario/Desktop/MARTIN/ECONOMICS"
      → escribe renombrar.csv en la carpeta, con la propuesta. No toca nada.
  (revisá el CSV: borrá las filas que no quieras o corregí la columna id)
  python3 herramientas/renombrar_pdfs.py "C:/.../ECONOMICS" --aplicar
      → renombra según renombrar.csv. Guarda deshacer.csv para volver atrás.
  python3 herramientas/renombrar_pdfs.py "C:/.../ECONOMICS" --deshacer
"""
import csv
import json
import re
import sys
import unicodedata
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
VACIAS = set("de la el los las del en y a the of and in on for to an un una por con sobre para que su sus al se es como entre from with at by".split())
ROM = {"i": "1", "ii": "2", "iii": "3", "iv": "4", "v": "5", "vi": "6", "vii": "7", "viii": "8", "ix": "9", "x": "10"}
TIPOS = {"paper", "libro", "capitulo", "apunte", "informe", "dato"}
PREFIJO = re.compile(r"^\s*(\d{4})\s*-\s")


def normal(t):
    t = unicodedata.normalize("NFD", str(t or "").lower())
    t = "".join(c for c in t if unicodedata.category(c) != "Mn")
    return re.sub(r"[^a-z0-9]+", " ", t).strip()


def fichas(t):
    out = []
    for w in normal(t).split():
        w = ROM.get(w, w)
        if w.isdigit() or (len(w) > 2 and w not in VACIAS):
            out.append(w)
    return out


def puntaje(p, f_fichas):
    """Mismo criterio que bibPuntaje() en index.html."""
    tt = fichas(p["titulo"])
    if not tt:
        return 0
    fs = set(f_fichas)
    pal = [w for w in tt if not w.isdigit()]
    num = [w for w in tt if w.isdigit()]
    s = (sum(w in fs for w in pal) / min(len(pal), 8)) if pal else 0.5
    if num and not all(w in fs for w in num):
        s *= 0.3
    if p.get("curso") and any(len(w) > 3 and w in fs for w in fichas(p["curso"])):
        s += 0.2
    au = [w for w in fichas(re.sub(r"\(.*?\)", " ", p.get("cita", ""))) if not w.isdigit() and w not in ("eds", "et", "al")]
    if any(w in fs for w in au):
        s += 0.35
    y = re.search(r"\d{4}", p.get("cita", ""))
    if y and y.group(0) in f_fichas:
        s += 0.15
    return s


def limpio(t):
    return re.sub(r"\s+", " ", re.sub(r'[\\/:*?"<>|]+', " ", str(t or ""))).strip()


def nombre_sugerido(p):
    tit = limpio(p["titulo"])
    if len(tit) > 90:
        tit = re.sub(r"\s+\S*$", "", tit[:90])
    tipo = p.get("tipo") if p.get("tipo") in TIPOS else "paper"
    partes = [str(p["id"]).zfill(4), limpio(p.get("cita", "")), tit, tipo]
    return " - ".join(x for x in partes if x) + ".pdf"


def proponer(carpeta, papers):
    by_id = {p["id"]: p for p in papers}
    archivos = sorted(x for x in carpeta.rglob("*") if x.is_file() and x.suffix.lower() == ".pdf")
    filas, libres, usados = [], [], set()
    for a in archivos:
        m = PREFIJO.match(a.name)
        if m and int(m.group(1)) in by_id:
            usados.add(int(m.group(1)))
            continue  # ya tiene número: se respeta
        libres.append(a)
    cand = []
    for a in libres:
        ff = fichas(str(a.relative_to(carpeta).with_suffix("")))
        for p in papers:
            if p["id"] in usados:
                continue
            s = puntaje(p, ff)
            if s >= 0.6:
                cand.append((s, p["id"], a))
    cand.sort(key=lambda x: -x[0])
    tomados = set()
    for s, pid, a in cand:
        if pid in usados or a in tomados:
            continue
        usados.add(pid)
        tomados.add(a)
        filas.append({"id": pid, "puntaje": f"{s:.2f}", "actual": str(a.relative_to(carpeta)), "nuevo": nombre_sugerido(by_id[pid])})
    sin = [str(a.relative_to(carpeta)) for a in libres if a not in tomados]
    return filas, sin, len(archivos)


def main():
    if len(sys.argv) < 2:
        print(__doc__)
        sys.exit(1)
    carpeta = Path(sys.argv[1]).expanduser()
    modo = sys.argv[2] if len(sys.argv) > 2 else ""
    papers = json.loads((RAIZ / "data" / "indice.json").read_text(encoding="utf-8"))["papers"]
    by_id = {p["id"]: p for p in papers}
    prop, desh = carpeta / "renombrar.csv", carpeta / "deshacer.csv"

    if modo == "--aplicar":
        hechos = []
        with prop.open(encoding="utf-8") as fh:
            for r in csv.DictReader(fh):
                src = carpeta / r["actual"]
                if not src.exists():
                    continue
                pid = int(r["id"])
                nuevo = nombre_sugerido(by_id[pid]) if pid in by_id else r["nuevo"]
                dst = src.with_name(nuevo)
                if dst.exists():
                    print("ya existe, salteo:", dst.name)
                    continue
                src.rename(dst)
                hechos.append({"nuevo": str(dst.relative_to(carpeta)), "actual": r["actual"]})
        with desh.open("w", newline="", encoding="utf-8") as fh:
            w = csv.DictWriter(fh, fieldnames=["nuevo", "actual"])
            w.writeheader()
            w.writerows(hechos)
        print(f"Renombrados {len(hechos)} archivos. Para volver atrás: --deshacer")
        return

    if modo == "--deshacer":
        n = 0
        with desh.open(encoding="utf-8") as fh:
            for r in csv.DictReader(fh):
                src, dst = carpeta / r["nuevo"], carpeta / r["actual"]
                if src.exists() and not dst.exists():
                    src.rename(dst)
                    n += 1
        print(f"Restaurados {n} nombres.")
        return

    filas, sin, total = proponer(carpeta, papers)
    with prop.open("w", newline="", encoding="utf-8") as fh:
        w = csv.DictWriter(fh, fieldnames=["id", "puntaje", "actual", "nuevo"])
        w.writeheader()
        w.writerows(filas)
    print(f"{total} PDF en la carpeta; {len(filas)} con propuesta de nombre; {len(sin)} sin emparejar.")
    print(f"Revisá {prop} y después corré con --aplicar.")


if __name__ == "__main__":
    main()
