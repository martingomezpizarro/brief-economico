# Instrucciones para Claude — Prebisch (brief-economico)

## Flujo de trabajo con GitHub

- La rama que publica el sitio es `main`.
- Cuando Martín pide un cambio, hacelo directamente: commit y push a `main`.
  No abras ramas `claude/...` ni pull requests, y no le pidas que haga merge,
  pull ni push a mano. Solo usá una rama aparte si él lo pide explícitamente.
- Antes de cada cambio, traé lo último de `main` (`git pull --ff-only origin main`)
  para no pisar trabajo de otras sesiones.
- Si hay pull requests abiertos de otras sesiones, no los pises: antes de
  mergear uno, verificá que no haya conflictos y que los cambios ya publicados
  en `main` sigan presentes.
- Commits con mensajes claros, en español.
- Después de cada push, decile qué cambió, en qué rama y el hash del commit.
- Pedí confirmación antes de cambios grandes o destructivos: borrar archivos,
  reescribir historial, `push --force`.
- Si el push directo a `main` falla (permisos, protección de rama, restricción
  de la sesión), decíselo con el error textual en vez de abrir un PR por tu cuenta.
