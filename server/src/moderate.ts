import { closeDb } from './db.js';
import { listHidden, setHidden } from './store.js';

/*
 * Moderación sin panel de administración:
 *   npm run moderate -- <id> hide   → oculta la entrada (deja de listarse, buscarse y abrirse)
 *   npm run moderate -- <id> show   → la vuelve a mostrar
 *   npm run moderate -- list        → lista las entradas ocultas
 * Ocultar no borra nada: la entrada y su foto se conservan por si hay que revisarla o restaurarla.
 * Usa la base de datos de server/.env (MONGODB_URI y MONGODB_DB).
 */

const USAGE = 'Uso: npm run moderate -- <id> hide|show   ·   npm run moderate -- list';
const db = process.env.MONGODB_DB || 'wansd';
const [id, action] = process.argv.slice(2);

try {
  if (id === 'list' && !action) {
    const hidden = await listHidden();
    console.log(`Entradas ocultas en «${db}»: ${hidden.length}`);
    for (const e of hidden) console.log(`  ${e.id}  ·  ${e.name}  ·  ${e.interest}`);
  } else if (id && (action === 'hide' || action === 'show')) {
    // Acepta también el enlace completo de la entrada (…/entradas/<id>).
    const entryId = id.replace(/\/+$/, '').split('/').pop()!;
    const entry = await setHidden(entryId, action === 'hide');
    if (!entry) {
      console.error(`No existe ninguna entrada con id «${entryId}» en la base de datos «${db}».`);
      process.exitCode = 1;
    } else {
      console.log(
        action === 'hide'
          ? `🙈 Entrada ${entry.id} (${entry.name}) ocultada en «${db}».`
          : `👀 Entrada ${entry.id} (${entry.name}) visible de nuevo en «${db}».`,
      );
    }
  } else {
    console.error(USAGE);
    process.exitCode = 1;
  }
} finally {
  await closeDb();
}
