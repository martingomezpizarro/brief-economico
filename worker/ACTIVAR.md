# Activar el servidor de briefs y los avisos

La página funciona sin esto: el rack, los briefs, las preguntas y el repaso andan igual, y en **Mi estudio** cualquiera puede generar briefs con su propia key de Gemini o de Anthropic. Este Worker agrega la tercera opción: **generar con tu key de Gemini, gratis para quien inicie sesión, con cupo diario**. Es el mismo esquema del tutor de idoneidad, pero con su propio proyecto de Firebase.

## 1. Key de Gemini
Podés reusar la del tutor de idoneidad o crear otra en https://aistudio.google.com/apikey (por ejemplo, en un proyecto `brief-economico`, así ves el consumo por separado). No va en la página ni en el código: se carga como secreto en el paso 4.

## 2. Crear el Worker
1. https://dash.cloudflare.com → **Workers & Pages** → **Create** → **Create Worker**.
2. Nombre: **`brief-economico`** → queda en `https://brief-economico.gomezpizarromartin.workers.dev`, que es la dirección que espera la página (`WORKER_URL` en `index.html`). → **Deploy**.
3. **Edit code** → borrá todo, pegá el contenido de `worker/worker.js` → **Deploy**.

## 3. Cupos (KV)
1. **Storage & Databases → KV → Create** → nombre `brief-economico-cupos`.
2. Worker → **Settings → Bindings → Add → KV namespace** → variable **`CUPOS`**, namespace `brief-economico-cupos` → Deploy.

## 4. Variables
Worker → **Settings → Variables and Secrets → + Add**, una fila por variable, y **Deploy** al final.

| Nombre | Tipo | Valor |
|---|---|---|
| `GEMINI_API_KEY` | **Secret** | la key del paso 1 |
| `FIREBASE_PROJECT` | Text | `prebisch-785b1` |
| `ADMINS` | Text | `gomezpizarromartin@gmail.com` (vos, sin tope) |
| `LIMITE_DIARIO` | Text | `4` (briefs por persona y día) |
| `LIMITE_RUTAS` | Text | `5` (rutas por persona y día) |
| `TOPE_GLOBAL` | Text | `300` (pedidos entre todos, por día) |
| `MODELO` | Text | opcional; por defecto `gemini-3.8-flash` |

Con el nivel gratuito de Gemini hay límites por minuto y por día; si se superan, la página avisa «saturado» y sugiere usar una key propia. En el nivel gratuito Google puede usar los textos para mejorar sus modelos: está dicho en Ajustes.

## 5. Firebase (las cuentas)
La página usa su propio proyecto de Firebase, **`prebisch-785b1`**, separado del de idoneidad: cuentas, mails, reglas y cupos no se comparten.

1. **Authentication → Sign-in method**: activá **Google** (con tu mail como mail de soporte) y **Email/Password** (solo el primer interruptor).
2. **Authentication → Settings → Authorized domains → Add domain** → `prebisch.martingomezpizarro.com.ar`.
3. **Firestore Database → Create database** (ubicación `southamerica-east1`, modo production) → pestaña **Rules** → pegá esto y **Publish**:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /brief/{uid} {
      allow read, write: if request.auth != null && request.auth.uid == uid;
      match /lecciones/{id} {
        allow read, write: if request.auth != null && request.auth.uid == uid;
      }
    }
  }
}
```
4. Opcional: **Authentication → Templates** → idioma español y remitente «Prebisch»; **Project settings → General → Public-facing name** → «Prebisch» (es el nombre que muestra la ventana de Google).

Las cuentas con mail tienen que verificarlo (abrir el enlace que les llega) antes de usar el servidor de briefs; las de Google ya vienen verificadas.

## 6. Avisos diarios (notificaciones)
Usan el mismo Worker y el mismo KV. La clave de los avisos (VAPID) la crea el Worker solo, la primera vez, y la guarda en el KV.

1. Si ya tenías el Worker creado, **Edit code** → pegá de nuevo `worker/worker.js` completo → **Deploy** (esta versión trae los avisos).
2. Worker → **Settings → Triggers → Cron Triggers → Add** → `*/30 * * * *` → **Add**. Cada media hora el Worker manda el aviso a quienes eligieron esa hora.
3. Abrí `https://brief-economico.gomezpizarromartin.workers.dev/push/clave` una vez: tiene que mostrar `{"clave":"B…"}`. Eso crea la clave; no la cambies después, porque las suscripciones existentes dejarían de funcionar.
4. En la página: **Ajustes → Cuenta** (iniciá sesión) → **Avisos y calendario → Activar avisos** → aceptá el permiso → **Probar aviso**.

En iPhone y iPad los avisos solo funcionan con la app agregada a la pantalla de inicio (Safari → Compartir → Agregar a inicio). En compu y Android funcionan desde el navegador.

## 7. Probar
1. `https://brief-economico.gomezpizarromartin.workers.dev/estado` → `"ok":true` y `"kv":true`.
2. En la página: **Ajustes → Entrar con Google**, motor «Servidor de la app» → **Mi estudio** → subí un PDF → **Un solo brief**.

## Cómo funciona
- La página lee el PDF en el navegador (pdf.js). El archivo no se sube: solo viaja el texto, y solo cuando generás.
- El Worker verifica el token de la cuenta, controla el cupo, arma el prompt maestro (el mismo de `prompts/prompts.js`) y le pide a Gemini la ruta o el brief en JSON.
- La página valida el JSON (secciones, 8 preguntas con 4 opciones y de 6 a 8 tarjetas), y si no sirve reintenta una vez. El brief queda en el navegador y, con sesión iniciada, en Firestore.
- Avisos: la página se suscribe (Web Push) con la clave pública del Worker y le pasa la hora elegida, redondeada a la media hora en UTC. El cron manda un push sin contenido; el texto («Brief de hoy: …») lo deja preparado la propia página en el navegador y lo muestra `sw.js`.
- Si cambiás `prompts/prompts.js`, corré `node worker/armar.js` para copiarlo dentro de `worker/worker.js` y volvé a pegar el Worker.
