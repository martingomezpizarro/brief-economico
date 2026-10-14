"""Uso: python3 herramientas/mover_correcta.py <id> <n_pregunta> <nueva_pos>  — mueve la opción correcta a otra posición."""
import json, sys
bid, n, pos = sys.argv[1], int(sys.argv[2]), int(sys.argv[3])
f = f"data/lecciones/{bid}.json"; d = json.load(open(f)); q = d["preguntas"][n - 1]
for l in ("es", "en"):
    op = q["op"][l]; op[q["ok"]], op[pos] = op[pos], op[q["ok"]]
q["ok"] = pos
json.dump(d, open(f, "w"), ensure_ascii=False, indent=1)
