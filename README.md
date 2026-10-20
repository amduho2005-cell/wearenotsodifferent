# we are not so different

> *Lo que te gusta también forma parte de ti.*

Un **diario colectivo** donde las personas comparten su interés más friki y las experiencias positivas y negativas que han vivido por él, con el objetivo de **visibilizar el bullying y crear empatía**.

No es una red social: no hay likes, seguidores, comentarios, mensajes privados ni rankings. Cada persona tiene **una sola página**, que puede editar, y todas las páginas se pueden leer y buscar desde el diario general.

---

## Requisitos

- **Node.js 22 o superior** (probado con Node 24) y **npm 10+**.
- Una base de datos **MongoDB**: un clúster de [MongoDB Atlas](https://www.mongodb.com/atlas) (el gratuito M0 sirve) o un MongoDB local.
- Un navegador moderno.

Las fuentes tipográficas están incluidas en el proyecto.

## Instalación

Desde la carpeta raíz del proyecto:

```bash
npm run install:all
```

Esto instala las dependencias de la raíz (solo `concurrently`), de `server/` y de `client/`.

### Configurar MongoDB

1. Copia `server/.env.example` como `server/.env`.
2. En `MONGODB_URI`, pon la cadena de conexión de tu clúster (Atlas → *Clusters → Connect → Drivers*) con tu usuario y contraseña de base de datos.
3. `MONGODB_DB` es el nombre de la base de datos (por defecto `wansd`).

En Atlas, el usuario necesita permiso de lectura y escritura sobre esa base de datos, y la IP desde la que te conectas debe estar en *Network Access*.

`server/.env` está en `.gitignore`: **nunca lo subas a GitHub**, contiene tu contraseña.

### Cargar los datos de ejemplo

```bash
npm run seed
```

Inserta (o restaura) las 6 entradas ficticias de `server/data/entries.seed.json`. No toca las demás entradas. La app crea sus índices al arrancar, incluido un índice único sobre `id`.

## Ejecutar en local

### Ambos servicios a la vez (recomendado)

```bash
npm run dev
```

- Web (Vite): **http://localhost:5173**
- API (Express): **http://localhost:4000**

Vite reenvía automáticamente `/api` y `/uploads` al servidor Express. Para usar otro puerto en la API, define la variable de entorno `API_PORT` (la leen tanto el servidor como Vite).

### Cada servicio por separado

En dos terminales:

```bash
npm run dev --prefix server
```

```bash
npm run dev --prefix client
```

### Versión compilada (un solo puerto)

```bash
npm run build
npm start
```

Compila servidor y cliente; después Express sirve la API **y** la web en **http://localhost:4000**.

### Migrar entradas de la versión con JSON

Si tienes un `entries.json` de la versión anterior:

```bash
npm run seed --prefix server -- ruta/a/entries.json
```

---

## Páginas

| Ruta | Contenido |
| --- | --- |
| `/` | Presentación, frase principal, buscador, acceso al diario y páginas recientes. |
| `/entradas` | Todas las entradas en tarjetas, buscador (en todos los campos públicos) y orden por fecha. |
| `/entradas/:id` | La página de una persona, como un diario abierto, con las 8 secciones en orden. |
| `/mi-entrada` | Crear o editar la entrada propia, con foto, vista previa y encuadre. |
| `/sobre-el-proyecto` | Propósito del diario, bullying, empatía y privacidad. |

## Estructura

```
we-are-not-so-different/
├── package.json            scripts para ejecutar ambos servicios
├── client/                 React + TypeScript + Vite
│   └── src/
│       ├── pages/          Home, Diary, EntryPage, MyEntry, About, NotFound
│       ├── components/     Layout, EntryCard, SearchBar, PhotoFramer, Doodles…
│       ├── styles/         global.css (identidad visual scrapbook)
│       ├── api.ts          llamadas a la API
│       ├── myEntry.ts      identificación local de "mi entrada"
│       └── validation.ts   validación en el cliente (mismas reglas que el servidor)
└── server/                 Node.js + Express + TypeScript
    ├── src/
    │   ├── index.ts        rutas de la API
    │   ├── db.ts           conexión a MongoDB e índices
    │   ├── store.ts        consultas y escrituras de entradas
    │   ├── seed.ts         carga de datos de ejemplo
    │   ├── moderate.ts     ocultar o mostrar entradas (npm run moderate)
    │   ├── rateLimit.ts    límite de peticiones por IP
    │   ├── validation.ts   validación de los datos
    │   ├── uploads.ts      subida y comprobación de fotografías
    │   └── editKey.ts      códigos de edición
    ├── scripts/
    │   └── test-protections.ts   pruebas del límite y la moderación
    ├── .env.example        plantilla de variables de entorno
    ├── data/
    │   └── entries.seed.json   datos de ejemplo ficticios
    └── uploads/            fotografías subidas en local
client/public/ejemplos/     ilustraciones de las entradas de ejemplo
```

## API

| Método | Ruta | Descripción |
| --- | --- | --- |
| `GET` | `/api/entries?q=&sort=desc\|asc&limit=` | Lista entradas. `q` busca en nombre, edad, pronombres, interés y los tres testimonios (sin distinguir mayúsculas ni tildes; varias palabras = todas deben aparecer). |
| `GET` | `/api/entries/:id` | Consulta una entrada. |
| `POST` | `/api/entries` | Crea una entrada (`multipart/form-data`, foto opcional en el campo `photo`). Devuelve la entrada y su **código de edición**. |
| `PUT` | `/api/entries/:id` | Edita una entrada. Requiere la cabecera `X-Edit-Key`. Admite una foto nueva o `removePhoto=true`. |
| `POST` | `/api/entries/:id/verify` | Comprueba un código de edición (`{ "editKey": "…" }`) para recuperar la entrada en otro navegador. |

Los errores se devuelven como `{ "error": "mensaje", "fields": { "campo": "mensaje" } }` con mensajes en español.

Las entradas **ocultas por moderación** no aparecen en el listado ni en la búsqueda, y `GET /api/entries/:id` responde `404` como si no existieran. Tampoco se pueden editar ni recuperar con su código (ver [Moderación](#moderación)).

### Límite de peticiones

Las rutas que escriben tienen un límite por IP. Al superarlo, la API responde **`429`** con un mensaje en español y la cabecera `Retry-After` (segundos hasta que se puede volver a intentar):

| Ruta | Límite por defecto | Variable para cambiarlo |
| --- | --- | --- |
| `POST /api/entries` | 10 entradas por hora | `RATE_LIMIT_CREATE` |
| `PUT /api/entries/:id` | 30 ediciones por hora | `RATE_LIMIT_EDIT` |
| `POST /api/entries/:id/verify` | 10 intentos cada 15 minutos | `RATE_LIMIT_VERIFY` |

- Cuentan todas las peticiones, también las que fallan (así se frenan los intentos de adivinar códigos de edición).
- La IP se lee de `X-Forwarded-For` (la primera) o, si no está, de `X-Real-IP`. En Vercel estas cabeceras las pone la propia plataforma.
- Como Vercel puede ejecutar cada petición en una instancia distinta, los contadores no se guardan en memoria sino en la colección **`rateLimits`** de MongoDB: un documento por ruta, IP y ventana de tiempo, con un índice **TTL** sobre `expiresAt` que los borra solos al caducar. De la IP solo se guarda un hash, nunca la dirección.
- Varias personas pueden compartir IP (un instituto, una biblioteca, los datos móviles). Si el diario se usa en un taller con un grupo, sube `RATE_LIMIT_CREATE` en las variables de entorno del proyecto de la API en Vercel y vuelve a desplegar.

### Campos y validación

| Campo | Regla |
| --- | --- |
| `photo` | Opcional. JPG, PNG o WebP, **máx. 4 MB** (Vercel limita las peticiones a 4,5 MB). Se comprueba la firma real del archivo, no solo la extensión. |
| `name` | Nombre o seudónimo, 1–40 caracteres. |
| `age` | Número entero entre 13 y 99. |
| `pronouns` | 1–30 caracteres. |
| `interest` | 2–80 caracteres. |
| `positiveExperience` | 20–2000 caracteres. |
| `negativeExperience` | **Opcional**, hasta 2000 caracteres. Nadie está obligado a contar (ni inventar) una experiencia negativa. |
| `differenceReflection` | 10–1500 caracteres. |
| `photoX`, `photoY`, `photoZoom` | Encuadre de la foto (0–100 %, 0–100 %, 1–3). |

Para no publicar información personal adicional, los textos que contienen **correos, teléfonos, enlaces o usuarios de redes sociales** se rechazan con un mensaje claro.

## Cómo se reconoce "mi entrada" (sin cuentas)

Al crear una entrada, el servidor genera un **identificador** (`entrada-1a2b3c4d`) y un **código de edición** (`abcd-1234-ef56`). El navegador los guarda en `localStorage` y así sabe cuál es tu página. En la base de datos solo se guarda el *hash* SHA-256 del código.

Si cambias de navegador, en `/mi-entrada` puedes recuperar tu página introduciendo esos dos datos. Esto **no es un sistema de autenticación**: es una solución sencilla y no impide que una misma persona cree más de una entrada desde navegadores distintos.

## Almacenamiento en MongoDB

Las entradas se guardan en la colección `entries` con esta forma:

```json
{
  "id": "entrada-1a2b3c4d",
  "photo": "/uploads/3f2c…-….webp",
  "photoFraming": { "x": 50, "y": 40, "zoom": 1.2 },
  "name": "Luna",
  "age": 19,
  "pronouns": "ella",
  "interest": "Anime y manga",
  "positiveExperience": "…",
  "negativeExperience": "",
  "differenceReflection": "…",
  "createdAt": "2026-01-15T12:00:00.000Z",
  "updatedAt": "2026-01-15T12:00:00.000Z",
  "editKeyHash": "…",
  "searchText": "luna
19
ella
anime y manga
…"
}
```

- `editKeyHash` y `searchText` nunca se devuelven en la API.
- `hidden: true` solo existe en las entradas ocultas por moderación; tampoco sale nunca en la API.
- Los contadores del límite de peticiones van aparte, en la colección `rateLimits` (se borran solos).
- `searchText` reúne los campos públicos en minúsculas y sin tildes; la búsqueda exige que aparezcan todas las palabras.
- MongoDB escribe cada documento de forma atómica y `id` tiene un índice único.
- Si la base de datos no responde, la API devuelve un error 503 con un mensaje claro.

Las fotos nunca se guardan en Base64 dentro de la base de datos:

- **En Vercel**, o en local si `server/.env` incluye `BLOB_READ_WRITE_TOKEN`, se suben a **Vercel Blob** y se guarda su URL pública.
- **En local sin token**, se guardan en `server/uploads/` y se sirven en `/uploads/`.

### Datos de ejemplo

Las seis entradas iniciales (`ejemplo-001` … `ejemplo-006`) son **personas ficticias**. Están marcadas con `"isSample": true`, se muestran con la etiqueta «ejemplo ficticio», usan ilustraciones en lugar de fotos reales y no se pueden editar.

## Moderación

No hay panel de administración: las entradas se ocultan o se vuelven a mostrar desde la terminal, con la base de datos configurada en `server/.env` (para la web publicada, la de producción):

```bash
npm run moderate --prefix server -- entrada-1a2b3c4d hide
```

```bash
npm run moderate --prefix server -- entrada-1a2b3c4d show
```

```bash
npm run moderate --prefix server -- list
```

- El id es la última parte del enlace de la entrada (`/entradas/entrada-1a2b3c4d`); también se puede pegar el enlace entero.
- **Ocultar no borra nada**: la entrada y su foto se conservan por si hay que revisarla o restaurarla con `show`. El cambio es inmediato en la web.
- El script indica en qué base de datos ha hecho el cambio. Para probarlo sin tocar la de producción, define antes `MONGODB_DB` (en PowerShell: `$env:MONGODB_DB = "wansd_test"`); la variable de entorno tiene prioridad sobre `server/.env`.

## Despliegue en Vercel

El repositorio se despliega como **dos proyectos de Vercel** conectados al mismo repositorio de GitHub:

| Proyecto | Root Directory | Framework | Variables de entorno |
| --- | --- | --- | --- |
| `wansd-api` | `server` | Express | `MONGODB_URI`, `MONGODB_DB` y el almacén de Blob conectado (`BLOB_READ_WRITE_TOKEN`); opcionales: `RATE_LIMIT_CREATE`, `RATE_LIMIT_EDIT`, `RATE_LIMIT_VERIFY` |
| web (p. ej. `we-are-not-so-different`) | `client` | Vite | ninguna |

- La API se detecta por el `export default app` de `server/src/index.ts`; en Vercel no se llama a `app.listen`.
- El almacén de **Vercel Blob** debe crearse con acceso **público**, porque las fotos se muestran directamente con su URL.
- `client/vercel.json` reenvía `/api/*` a `https://wansd-api.vercel.app` (así la web y la API comparten dominio y no hace falta CORS) y envía el resto de rutas a `index.html` para React Router. **Si el dominio de la API es otro, cámbialo ahí.**
- Las peticiones a funciones de Vercel no pueden superar 4,5 MB; por eso las fotos tienen un límite de 4 MB.
- En MongoDB Atlas, *Network Access* debe permitir las conexiones desde Vercel (`0.0.0.0/0`, porque Vercel no usa IPs fijas).

## ⚠️ Antes de publicarlo

- Hay un **límite de peticiones por IP** en las rutas que escriben (ver [Límite de peticiones](#límite-de-peticiones)). Frena el envío masivo y los intentos de adivinar códigos, pero no a alguien que cambie de IP; no es una protección completa contra abusos.
- La **moderación es posterior**: las entradas se publican al momento y nadie las revisa antes. Revisa el diario con frecuencia, sobre todo los primeros días después de compartir el enlace, y oculta lo inapropiado con `npm run moderate` (ver [Moderación](#moderación)). Ten a mano `server/.env` con acceso a la base de datos de producción para poder hacerlo rápido.
- Como escriben personas desde 13 años sobre experiencias de bullying, decide antes qué ocultarás (datos que identifiquen a alguien, ataques a otras personas, contenido sexual o violento) y explícalo en «Sobre el proyecto», junto con una forma de pedir que se oculte una entrada.
- Tras desplegar, comprueba que el límite cuenta IPs distintas a través de la reescritura de `client/vercel.json` (la web reenvía `/api` al proyecto de la API): si todas las peticiones llegaran con la misma IP, el límite sería común para todo el mundo.
- Los códigos de edición no sustituyen a un sistema de cuentas.
- Usa para la app un usuario de base de datos con permiso solo de lectura y escritura sobre `wansd`, no uno administrador.

## Comprobaciones realizadas

- `npm run build` compila servidor y cliente sin errores de TypeScript.
- Crear, editar (incluida la foto), ver y buscar entradas a través de la API y de la interfaz.
- Las entradas y fotos persisten después de reiniciar el servidor (con MongoDB).
- Validaciones: campos obligatorios, longitudes, edad, datos de contacto, formato y tamaño de la foto, código de edición incorrecto y entradas de ejemplo no editables.
- Límite de peticiones y moderación, con el script de pruebas:

```bash
npm run test:protections --prefix server
```

Arranca la API en un puerto libre contra la base de datos **`wansd_test`** (nunca la de `server/.env`), con un límite de 3 peticiones para ir rápido, y comprueba que la cuarta creación, edición o recuperación desde la misma IP recibe `429` (y otra IP no), que los contadores tienen índice TTL y no guardan la IP, y que una entrada ocultada con `npm run moderate` desaparece del listado, de la búsqueda y de su página (`404`), no se puede editar ni recuperar y vuelve con `show`. Al terminar **borra la base `wansd_test`** (`KEEP_TEST_DB=1` para conservarla; `TEST_DB` para usar otro nombre, que debe terminar en `_test`).
