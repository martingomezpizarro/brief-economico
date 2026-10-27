# Keys de los usuarios: cómo se protegen

Quien elige «Mi propia key de Gemini» o «de Anthropic» en Ajustes la carga una vez y la app la usa para escribir sus briefs. Garantías:

1. **Ningún servidor de Prebisch la recibe.** La única llamada que la lleva va directo del navegador a `generativelanguage.googleapis.com` (Gemini) o a `api.anthropic.com` (Anthropic). Lo ven solo el usuario y el proveedor que emite la key.
2. **No está en la nube.** No se guarda en Firebase, no se sincroniza entre dispositivos y no va en «Bajar copia». La administración (`#admin`) lee briefs, no keys: en Firestore no hay ninguna.
3. **Está aislada del resto de la página.** La maneja solo `ia/boveda.js`, un Web Worker sin dependencias. La página le pasa la key al guardarla y desde ahí solo recibe «hay key» y los últimos 4 caracteres. Las librerías externas de la página (MathJax, pdf.js, Firebase, Google) no tienen forma de leerla.
4. **Cifrada en reposo.** Con «Recordar», se guarda en IndexedDB cifrada con AES-GCM de 256 bits; la llave de cifrado es una `CryptoKey` no extraíble. Sin «Recordar», vive solo en la memoria del worker y desaparece al cerrar o recargar la página.
5. **Migración.** Las keys que versiones anteriores dejaron en `localStorage`/`sessionStorage` pasan a la bóveda al abrir la app y se borran de ahí.

Límites (lo que ninguna web puede prometer): quien tenga acceso al dispositivo con la sesión del navegador abierta puede usar la app con esa key; y quien teclea la key en la página la expone a lo que esté corriendo en ese momento en esa pestaña. Por eso la app recomienda una key dedicada con tope de gasto.

Para verificarlo: leer `ia/boveda.js` (≈130 líneas) y, en el navegador, F12 › Red al generar un brief.

Prueba automática hecha (navegador headless): key vieja en `localStorage` → migra y desaparece del almacenamiento y del DOM; persiste cifrada al recargar; el único pedido con la key fue a `api.anthropic.com`; «Borrar» la elimina.
