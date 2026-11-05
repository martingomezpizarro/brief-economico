# Gráficos interactivos en los briefs

Cada ecuación de un brief puede llevar, justo debajo, un gráfico con sliders. Al mover un
parámetro cambian a la vez la fórmula (repetida con los números puestos), los valores
destacados y la curva. Lo dibuja `graficos.js`; no hay pestaña aparte.

Primer brief con gráficos: `crec-teoria-09` (Ramsey). Sirve de ejemplo para todos los campos.

## Dónde va

En cada sección, `graf` es una lista paralela a `eq` (como `donde`): `graf[j]` es el gráfico de
la ecuación `eq[j]`, o una lista de gráficos si conviene más de uno, o `null` si esa ecuación
no se grafica.

```json
"eq": ["\\dot b = w + (r-n)\\,b - c", "\\lim_{t\\to\\infty} b_t\\,\\nu_t = 0"],
"graf": [{ ... }, null]
```

## Cuándo graficar

Solo cuando mover un parámetro enseña algo: utilidad, producción, Euler, curvas de oferta y
demanda, estados estacionarios, coeficientes que dependen de un parámetro. No se grafican
identidades contables, hamiltonianos ni condiciones de transversalidad.

## Campos de un gráfico

- `titulo` `{es,en}`: para lectores de pantalla.
- `x`: `{"id","min","max","label"}`. `min` y `max` pueden ser números o fórmulas de los parámetros.
- `y` (opcional): `{"min","max","label"}`; sin límites se ajusta solo e incluye el cero.
- `params`: sliders. `{"id","sym","label","min","max","step","val","dec"}`. `sym` es como se ve (ρ, θ).
- `calc`: valores derivados, en orden. `{"id","f","dec"}` o `{"id","integral": i}` (área bajo la curva `i` en todo el rango de x).
- `curvas`: `{"f","label","estilo","color"}`. `f` usa la variable de x, los parámetros y los `calc`.
  `estilo`: `linea` (por defecto), `punteada` o `area`. `color`: 0 acento, 1 tinta, 2 rojo.
- `marcas`: líneas verticales `{"x","label"}`. `puntos`: `{"x","y"}`.
- `tex`: la fórmula con números. `[[id]]` se reemplaza por el valor de un parámetro o `calc`
  (con coma decimal en castellano y entre paréntesis si es negativo). Puede ser una lista
  `[{"si": "condición", "tex": ...}, {"tex": ...}]`: se usa la primera cuya condición se cumpla.
  Para que entre en el celular, partir en dos líneas con `\begin{gathered} ... \\ ... \end{gathered}`.
- `valores`: tarjetas con números. `{"label","f","dec","pct","unidad"}` o, para un veredicto en
  palabras, `{"label","casos":[{"si","texto"}, ...]}`.
- `mirar` `{es,en}`: qué tiene que notar el lector al mover los sliders. Mismas reglas que el
  brief: solo lo que dice la fuente; lo propio, marcado como «lectura propia».

## Fórmulas

Se evalúan con un intérprete propio (no se ejecuta código): números, `+ - * / ^`, paréntesis,
comparaciones (`< > <= >= == !=`, `&&`, `||`), y las funciones `exp`, `log`/`ln`, `sqrt`, `abs`,
`min`, `max`, `pow`, `si(cond, a, b)` y `crra(c, θ)` (utilidad CRRA, logarítmica en θ = 1).
Constante: `pi`.
