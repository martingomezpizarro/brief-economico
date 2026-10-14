#!/bin/bash
# Uso: herramientas/subir.sh "mensaje"  — commitea data/lecciones y docs, rebasea sobre main y sube
cd "$(dirname "$0")/.." || exit 1
git add data/lecciones docs herramientas
git commit -q -m "$1

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01Mf6P7c4FQ9YELjdxVCaSMM" || exit 0
git pull -q --rebase origin main && git push -q origin HEAD:main && git log --oneline -1
