// Идемпотентная миграция для Neon (обход Prisma db push, который падает из-за обрыва соединений на pooler)
const { Client } = require('pg');
require('dotenv').config();

const cs = process.env.DATABASE_URL.replace('-pooler', '');
const Q = '"';

async function run(sql, params = []) {
  const c = new Client({ connectionString: cs, ssl: { rejectUnauthorized: false }, connectionTimeoutMillis: 15000 });
  await c.connect();
  try {
    return await c.query(sql, params);
  } finally {
    try { await c.end(); } catch (_) {}
  }
}

async function main() {
  // 1. enum'ы через DO-блоки
  const doEnum = async (typeName, values) => {
    const valList = values.map((v) => `'${v}'`).join(',');
    const sql = `DO $do$ BEGIN CREATE TYPE ${Q}${typeName}${Q} AS ENUM (${valList}); EXCEPTION WHEN duplicate_object THEN NULL; END $do$;`;
    try { await run(sql); console.log(`${typeName} ok`); }
    catch (e) { console.log(`${typeName} err:`, e.message.slice(0, 80)); }
  };
  await doEnum('Role', ['USER', 'ADMIN']);
  await doEnum('UtcNodeType', ['PRODUCT', 'ELEMENT', 'PROCESS']);

  // 2. users
  await run(
    `CREATE TABLE IF NOT EXISTS ${Q}users${Q} (
       ${Q}id${Q} TEXT NOT NULL,
       ${Q}email${Q} TEXT NOT NULL,
       ${Q}passwordHash${Q} TEXT NOT NULL,
       ${Q}name${Q} TEXT,
       ${Q}role${Q} ${Q}Role${Q} NOT NULL DEFAULT 'USER',
       ${Q}createdAt${Q} TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
       ${Q}updatedAt${Q} TIMESTAMP(3) NOT NULL,
       CONSTRAINT ${Q}users_pkey${Q} PRIMARY KEY (${Q}id${Q}),
       CONSTRAINT ${Q}users_email_key${Q} UNIQUE (${Q}email${Q})
     )`
  );
  console.log('users ok');

  // 3. utc_records (создание если нет)
  const utcExists = await run(`SELECT to_regclass('public.utc_records') AS t`);
  if (!utcExists.rows[0].t) {
    await run(
      `CREATE TABLE ${Q}utc_records${Q} (
         ${Q}id${Q} SERIAL NOT NULL,
         ${Q}organization${Q} TEXT NOT NULL,
         ${Q}keyProduct${Q} TEXT NOT NULL,
         ${Q}purpose${Q} TEXT NOT NULL,
         ${Q}categories${Q} TEXT NOT NULL,
         ${Q}principle${Q} TEXT NOT NULL,
         ${Q}advantages${Q} TEXT NOT NULL,
         ${Q}owner${Q} TEXT NOT NULL,
         ${Q}formulation${Q} TEXT NOT NULL,
         ${Q}createdAt${Q} TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
         ${Q}updatedAt${Q} TIMESTAMP(3) NOT NULL,
         ${Q}ownerId${Q} TEXT,
         ${Q}nodeType${Q} ${Q}UtcNodeType${Q} NOT NULL DEFAULT 'PRODUCT',
         ${Q}parentId${Q} INTEGER,
         ${Q}decompositionCharacteristic${Q} TEXT,
         CONSTRAINT ${Q}utc_records_pkey${Q} PRIMARY KEY (${Q}id${Q})
       )`
    );
    console.log('utc_records created');
  } else {
    console.log('utc_records exists');
  }

  // 4. индексы + FK (через DO-блоки для идемпотентности)
  await run('CREATE INDEX IF NOT EXISTS utc_records_ownerId_idx ON utc_records("ownerId")').catch(() => {});
  await run('CREATE INDEX IF NOT EXISTS utc_records_parentId_idx ON utc_records("parentId")').catch(() => {});
  const fkOwner = `ALTER TABLE ${Q}utc_records${Q} ADD CONSTRAINT utc_records_ownerId_fkey FOREIGN KEY (${Q}ownerId${Q}) REFERENCES ${Q}users${Q}(${Q}id${Q}) ON DELETE SET NULL ON UPDATE CASCADE`;
  await run(`DO $do$ BEGIN ${fkOwner}; EXCEPTION WHEN duplicate_object THEN NULL; END $do$;`).catch((e) => console.log('fk owner warn:', e.message.slice(0, 60)));
  const fkParent = `ALTER TABLE ${Q}utc_records${Q} ADD CONSTRAINT utc_records_parentId_fkey FOREIGN KEY (${Q}parentId${Q}) REFERENCES ${Q}utc_records${Q}(${Q}id${Q}) ON DELETE SET NULL ON UPDATE CASCADE`;
  await run(`DO $do$ BEGIN ${fkParent}; EXCEPTION WHEN duplicate_object THEN NULL; END $do$;`).catch((e) => console.log('fk parent warn:', e.message.slice(0, 60)));
  console.log('indexes + fk ok');

  // 5. app_settings
  const setExists = await run(`SELECT to_regclass('public.app_settings') AS t`);
  if (!setExists.rows[0].t) {
    await run(
      `CREATE TABLE ${Q}app_settings${Q} (
         ${Q}id${Q} INTEGER NOT NULL DEFAULT 1,
         ${Q}llmProvider${Q} TEXT NOT NULL DEFAULT 'cloud',
         ${Q}localLlmBaseUrl${Q} TEXT DEFAULT 'http://localhost:11434',
         ${Q}localLlmModel${Q} TEXT DEFAULT 'llama3.1',
         ${Q}updatedAt${Q} TIMESTAMP(3) NOT NULL,
         ${Q}updatedById${Q} TEXT,
         CONSTRAINT ${Q}app_settings_pkey${Q} PRIMARY KEY (${Q}id${Q})
       )`
    );
    console.log('app_settings created');
  } else {
    console.log('app_settings exists');
  }

  // 6. дефолтная строка app_settings
  await run(
    `INSERT INTO ${Q}app_settings${Q} (${Q}id${Q}, ${Q}updatedAt${Q}) VALUES (1, CURRENT_TIMESTAMP)
     ON CONFLICT (${Q}id${Q}) DO NOTHING`
  );
  console.log('app_settings row ok');
  console.log('MIGRATION DONE');
}

main().catch((e) => { console.error('FATAL:', e.message); process.exit(1); });
