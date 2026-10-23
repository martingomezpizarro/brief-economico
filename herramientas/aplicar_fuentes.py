#!/usr/bin/env python3
"""Copia a data/indice.json los enlaces oficiales de herramientas/fuentes.json.

Solo pasan las lecturas con estado "publico": reciben "url" (enlace oficial gratuito)
y "acceso": "publico". Las demás quedan sin enlace en el índice; a las que tenían un
enlace de una corrida anterior y ya no son públicas se les borra.

Uso:  python3 herramientas/aplicar_fuentes.py
"""
import json
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
REG = RAIZ / "herramientas" / "fuentes.json"
IDX = RAIZ / "data" / "indice.json"


def main():
    reg = json.loads(REG.read_text(encoding="utf-8"))["lecturas"]
    idx = json.loads(IDX.read_text(encoding="utf-8"))
    n = 0
    for p in idx["papers"]:
        e = reg.get(str(p["id"]))
        if e and e.get("estado") == "publico" and e.get("url"):
            p["url"] = e["url"]
            p["acceso"] = "publico"
            n += 1
        else:
            p.pop("url", None)
            p.pop("acceso", None)
    IDX.write_text(json.dumps(idx, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    pend = sum(1 for e in reg.values() if e.get("estado") == "verificar")
    print(f"{n} lecturas con enlace público en el índice; {pend} quedan para verificar a mano.")


if __name__ == "__main__":
    main()
