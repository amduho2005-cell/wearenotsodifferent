import { spawn, type ChildProcess } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

/*
 * Pruebas manuales del límite de peticiones y de la moderación.
 *   npm run test:protections
 *
 * Arranca la API en un puerto propio contra una base de datos de pruebas
 * (por defecto "wansd_test", nunca la de server/.env), con límites bajos para
 * no tener que crear decenas de entradas, y la BORRA entera al terminar
 * (KEEP_TEST_DB=1 para conservarla). Las IPs se simulan con X-Forwarded-For.
 */

const TEST_DB = process.env.TEST_DB || 'wansd_test';
if (!TEST_DB.endsWith('_test')) {
  console.error(`TEST_DB debe terminar en "_test" (se borra al final). Recibido: «${TEST_DB}».`);
  process.exit(1);
}
if (!process.env.MONGODB_URI) {
  console.error('Falta MONGODB_URI (server/.env).');
  process.exit(1);
}

const LIMIT = 3;
const PORT = 4100 + Math.floor(Math.random() * 800);
const BASE = `http://localhost:${PORT}`;
const SERVER_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

// Este proceso y los que lanza usan solo la base de pruebas, sin Blob ni límites de producción.
process.env.MONGODB_DB = TEST_DB;
const env: NodeJS.ProcessEnv = {
  ...process.env,
  MONGODB_DB: TEST_DB,
  API_PORT: String(PORT),
  RATE_LIMIT_CREATE: String(LIMIT),
  RATE_LIMIT_EDIT: String(LIMIT),
  RATE_LIMIT_VERIFY: String(LIMIT),
};
delete env.BLOB_READ_WRITE_TOKEN;
delete env.VERCEL;

const { closeDb, database, entriesCollection, rateLimitsCollection } = await import('../src/db.js');

// ---------- utilidades ----------

let failures = 0;
function check(ok: boolean, label: string, detail?: unknown) {
  if (ok) console.log(`  ✔ ${label}`);
  else {
    failures++;
    console.log(`  ✘ ${label}${detail === undefined ? '' : ` → ${JSON.stringify(detail)}`}`);
  }
}

const run = (n: number) => `${Date.now().toString(36)}${n}`;
let ipCounter = 0;
/** Una IP distinta por prueba, para que los contadores no se mezclen. */
const newIp = () => `203.0.113.${++ipCounter}`;

function entryForm(interest = 'Coleccionar minerales') {
  const f = new FormData();
  f.set('name', 'Prueba automática');
  f.set('age', '16');
  f.set('pronouns', 'elle');
  f.set('interest', interest);
  f.set('positiveExperience', 'Conocí a gente que también guarda piedras bonitas en cajas.');
  f.set('negativeExperience', '');
  f.set('differenceReflection', 'Un poco, pero ya no me importa.');
  return f;
}

async function call(method: string, url: string, ip: string, init: { body?: FormData | object; editKey?: string } = {}) {
  const headers: Record<string, string> = { 'X-Forwarded-For': `${ip}, 10.0.0.1` };
  if (init.editKey) headers['X-Edit-Key'] = init.editKey;
  let body: BodyInit | undefined;
  if (init.body instanceof FormData) body = init.body;
  else if (init.body) {
    headers['Content-Type'] = 'application/json';
    body = JSON.stringify(init.body);
  }
  const res = await fetch(BASE + url, { method, headers, body });
  const json = (await res.json().catch(() => null)) as Record<string, any> | null;
  return { status: res.status, json, headers: res.headers };
}

async function create(ip: string, interest?: string) {
  const r = await call('POST', '/api/entries', ip, { body: entryForm(interest) });
  return { ...r, id: r.json?.entry?.id as string, editKey: r.json?.editKey as string };
}

function moderate(...args: string[]): Promise<{ code: number | null; out: string }> {
  return new Promise((resolve) => {
    // Se prueba el script real de package.json; MONGODB_DB del entorno tiene prioridad sobre .env.
    // Una sola cadena (los argumentos los pone esta prueba): con shell, npm funciona igual en Windows.
    const child = spawn(`npm run --silent moderate -- ${args.join(' ')}`, { cwd: SERVER_DIR, env, shell: true });
    let out = '';
    child.stdout.on('data', (d) => (out += d));
    child.stderr.on('data', (d) => (out += d));
    child.on('close', (code) => resolve({ code, out }));
  });
}

async function startServer(): Promise<{ child: ChildProcess; log: () => string }> {
  let log = '';
  const child = spawn(process.execPath, ['--import', 'tsx', 'src/index.ts'], { cwd: SERVER_DIR, env });
  child.stdout!.on('data', (d) => (log += d));
  child.stderr!.on('data', (d) => (log += d));
  for (let i = 0; i < 60; i++) {
    if (child.exitCode !== null) break;
    try {
      if ((await fetch(`${BASE}/api/entries?limit=1`)).ok) return { child, log: () => log };
    } catch {
      /* todavía arrancando */
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  child.kill();
  throw new Error(`La API no arrancó:\n${log}`);
}

// ---------- pruebas ----------

const testDb = await database();
if (testDb.databaseName !== TEST_DB) throw new Error(`Conectado a «${testDb.databaseName}» en lugar de «${TEST_DB}»; se cancela.`);
await testDb.dropDatabase(); // empezar de cero

console.log(`Base de datos de pruebas: ${TEST_DB} · API en ${BASE} · límite ${LIMIT} por ventana\n`);
const server = await startServer();

try {
  console.log('Límite de peticiones · POST /api/entries');
  const ipA = newIp();
  for (let i = 1; i <= LIMIT; i++) {
    const r = await create(ipA);
    check(r.status === 201, `creación ${i}/${LIMIT} aceptada (201)`, r.json);
  }
  const blocked = await create(ipA);
  check(blocked.status === 429, `creación ${LIMIT + 1} rechazada con 429`, blocked.status);
  check(/demasiadas entradas/i.test(blocked.json?.error ?? ''), 'mensaje claro en español', blocked.json);
  check(Number(blocked.headers.get('retry-after')) > 0, 'cabecera Retry-After', blocked.headers.get('retry-after'));
  const otherIp = await create(newIp());
  check(otherIp.status === 201, 'otra IP sigue pudiendo crear (el límite es por IP)', otherIp.status);
  const realIp = await fetch(`${BASE}/api/entries`, { method: 'POST', headers: { 'X-Real-IP': ipA }, body: entryForm() });
  check(realIp.status === 429, 'sin X-Forwarded-For se usa X-Real-IP (misma IP → sigue bloqueada)', realIp.status);

  console.log('\nLímite de peticiones · POST /api/entries/:id/verify');
  const target = otherIp;
  const ipV = newIp();
  for (let i = 1; i <= LIMIT; i++) {
    const r = await call('POST', `/api/entries/${target.id}/verify`, ipV, { body: { editKey: '0000-0000-0000' } });
    check(r.status === 403, `intento ${i}/${LIMIT} con código erróneo → 403`, r.status);
  }
  const vBlocked = await call('POST', `/api/entries/${target.id}/verify`, ipV, { body: { editKey: target.editKey } });
  check(vBlocked.status === 429, `intento ${LIMIT + 1} rechazado con 429 aunque el código sea correcto`, vBlocked.status);
  check(/demasiados intentos/i.test(vBlocked.json?.error ?? ''), 'mensaje claro en español', vBlocked.json);

  console.log('\nLímite de peticiones · PUT /api/entries/:id');
  const ipE = newIp();
  for (let i = 1; i <= LIMIT; i++) {
    const r = await call('PUT', `/api/entries/${target.id}`, ipE, { body: entryForm(), editKey: target.editKey });
    check(r.status === 200, `edición ${i}/${LIMIT} aceptada (200)`, r.json);
  }
  const eBlocked = await call('PUT', `/api/entries/${target.id}`, ipE, { body: entryForm(), editKey: target.editKey });
  check(eBlocked.status === 429, `edición ${LIMIT + 1} rechazada con 429`, eBlocked.status);
  check(/demasiadas veces/i.test(eBlocked.json?.error ?? ''), 'mensaje claro en español', eBlocked.json);

  console.log('\nContadores en MongoDB');
  const rl = await rateLimitsCollection();
  const ttl = (await rl.indexes()).find((ix) => ix.key.expiresAt === 1);
  check(ttl?.expireAfterSeconds === 0, 'índice TTL sobre expiresAt', ttl);
  const docs = await rl.find().toArray();
  check(docs.length > 0 && docs.every((d) => d.expiresAt instanceof Date), 'contadores con fecha de caducidad', docs.length);
  check(!JSON.stringify(docs).includes('203.0.113.'), 'no se guarda la IP en claro');

  console.log('\nModeración · campo hidden');
  const word = `zorblax${run(1)}`;
  const e = await create(newIp(), `Bichos raros ${word}`);
  check(e.status === 201, 'entrada de prueba creada', e.json);
  const visibleList = await call('GET', '/api/entries?limit=100', newIp());
  const totalBefore = visibleList.json?.total as number;
  check(visibleList.json?.entries.some((x: any) => x.id === e.id), 'antes: aparece en el listado');
  check((await call('GET', `/api/entries?q=${word}`, newIp())).json?.total === 1, 'antes: la búsqueda la encuentra');
  check((await call('GET', `/api/entries/${e.id}`, newIp())).status === 200, 'antes: su página responde 200');

  const hide = await moderate(e.id, 'hide');
  check(hide.code === 0 && hide.out.includes(TEST_DB), `npm run moderate -- ${e.id} hide`, hide.out.trim());
  const listed = await call('GET', '/api/entries?limit=100', newIp());
  check(!listed.json?.entries.some((x: any) => x.id === e.id), 'oculta: no aparece en el listado');
  check(listed.json?.total === totalBefore - 1, 'oculta: el total baja en 1', [totalBefore, listed.json?.total]);
  check((await call('GET', `/api/entries?q=${word}`, newIp())).json?.total === 0, 'oculta: la búsqueda no la encuentra');
  const page = await call('GET', `/api/entries/${e.id}`, newIp());
  check(page.status === 404, 'oculta: su página responde 404', page.status);
  const v = await call('POST', `/api/entries/${e.id}/verify`, newIp(), { body: { editKey: e.editKey } });
  check(v.status === 403, 'oculta: no se puede recuperar con el código', v.status);
  const put = await call('PUT', `/api/entries/${e.id}`, newIp(), { body: entryForm(), editKey: e.editKey });
  check(put.status === 404, 'oculta: no se puede editar', put.status);
  const stored = await (await entriesCollection()).findOne({ id: e.id });
  check(stored?.hidden === true && stored.name === 'Prueba automática', 'oculta: sigue guardada en la base de datos');
  const list = await moderate('list');
  check(list.code === 0 && list.out.includes(e.id), 'npm run moderate -- list la muestra', list.out.trim());
  const leaks = (await call('GET', '/api/entries?limit=100', newIp())).json?.entries.some((x: any) => 'hidden' in x);
  check(!leaks, 'el campo hidden no sale en la API');

  const show = await moderate(e.id, 'show');
  check(show.code === 0, `npm run moderate -- ${e.id} show`, show.out.trim());
  check((await call('GET', `/api/entries/${e.id}`, newIp())).status === 200, 'visible otra vez: su página responde 200');
  check((await call('GET', `/api/entries?q=${word}`, newIp())).json?.total === 1, 'visible otra vez: la búsqueda la encuentra');

  const missing = await moderate('entrada-noexiste', 'hide');
  check(missing.code !== 0 && /no existe/i.test(missing.out), 'id inexistente → error', missing.out.trim());
  const bad = await moderate(e.id, 'borrar');
  check(bad.code !== 0 && /uso:/i.test(bad.out), 'acción desconocida → muestra el uso', bad.out.trim());
} catch (err) {
  failures++;
  console.error(err);
  console.error(server.log());
} finally {
  server.child.kill();
  if (process.env.KEEP_TEST_DB === '1') console.log(`\nSe conserva la base de datos ${TEST_DB}.`);
  else {
    await testDb.dropDatabase();
    console.log(`\nBase de datos ${TEST_DB} borrada.`);
  }
  await closeDb();
}

console.log(failures ? `\n❌ ${failures} comprobaciones fallidas` : '\n✅ Todas las comprobaciones pasan');
process.exitCode = failures ? 1 : 0;
