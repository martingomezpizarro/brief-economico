#!/bin/bash
# Uso: herramientas/extraer.sh <pdf> <salida.txt>  — texto compacto; OCR si el PDF no tiene capa de texto
pdf="$1"; out="$2"
pdftotext "$pdf" - 2>/dev/null | sed 's/[ \t]\+/ /g' | grep -v '^\s*$' > "$out"
if [ "$(wc -w < "$out")" -lt 200 ]; then
  tmp=$(mktemp -d); pdftoppm -r 200 -gray -png "$pdf" "$tmp/p" 2>/dev/null
  for i in "$tmp"/p*.png; do tesseract "$i" - -l spa+eng 2>/dev/null; done | sed 's/[ \t]\+/ /g' | grep -v '^\s*$' > "$out"
  rm -rf "$tmp"; echo "OCR: $out"
fi
wc -w "$out"
