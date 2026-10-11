# Activar el servidor de briefs

La página funciona sin esto: el rack, los briefs, las preguntas y el repaso andan igual, y en **Mi estudio** cualquiera puede generar briefs con su propia key de Gemini o de Anthropic. Este Worker agrega la tercera opción: **generar con tu key de Gemini, gratis para quien inicie sesión, con cupo diario**. Es el mismo esquema del tutor de idoneidad.

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
| `FIREBASE_PROJECT` | Text | `idoneidad-48c77` |
| `ADMINS` | Text | `gomezpizarromartin@gmail.com` (vos, sin tope) |
| `LIMITE_DIARIO` | Text | `4` (briefs por persona y día) |
| `LIMITE_RUTAS` | Text | `5` (rutas por persona y día) |
| `TOPE_GLOBAL` | Text | `300` (pedidos entre todos, por día) |
| `MODELO` | Text | opcional; por defecto `gemini-3.8-flash` |

Con el nivel gratuito de Gemini hay límites por minuto y por día; si se superan, la página avisa «saturado» y sugiere usar una key propia. En el nivel gratuito Google puede usar los textos para mejorar sus modelos: está dicho en Ajustes.

## 5. Firebase (las cuentas)
La página usa el mismo proyecto que idoneidad (`idoneidad-48c77`), así una cuenta sirve para las dos páginas.

1. **Authentication → Settings → Authorized domains → Add domain** → `prebisch.martingomezpizarro.com.ar`.
2. **Firestore → Rules**: sumá el bloque `brief` sin borrar el de `usuarios` y **Publish**. Quedan así:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /usuarios/{uid} {
      allow read, write: if request.auth != null && request.auth.uid == uid;
      match /datos/{doc} {
        allow read, write: if request.auth != null && request.auth.uid == uid
                           && doc in ['quiz', 'micro'];
      }
    }
    // Prebisch: cada persona lee y escribe solo lo suyo.
    match /brief/{uid} {
      allow read, write: if request.auth != null && request.auth.uid == uid;
      match /lecciones/{id} {
        allow read, write: if request.auth != null && request.auth.uid == uid;
      }
    }
  }
}
```
Copiá también este archivo en `firestore.rules` del repo de idoneidad para que no quede desactualizado.

## 6. Probar
1. `https://brief-economico.gomezpizarromartin.workers.dev/estado` → `"ok":true` y `"kv":true`.
2. En la página: **Ajustes → Entrar con Google**, motor «Servidor de la app» → **Mi estudio** → subí un PDF → **Un solo brief**.

## Cómo funciona
- La página lee el PDF en el navegador (pdf.js). El archivo no se sube: solo viaja el texto, y solo cuando generás.
- El Worker verifica el token de la cuenta, controla el cupo, arma el prompt maestro (el mismo de `prompts/prompts.js`) y le pide a Gemini la ruta o el brief en JSON.
- La página valida el JSON (secciones, 8 preguntas con 4 opciones), y si no sirve reintenta una vez. El brief queda en el navegador y, con sesión iniciada, en Firestore.
