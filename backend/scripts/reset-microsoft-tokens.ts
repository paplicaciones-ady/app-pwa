import { DataSource } from 'typeorm';

async function main() {
  console.log('Conectando a PostgreSQL...');
  const ds = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST ?? 'localhost',
    port: +(process.env.DB_PORT ?? 5432),
    username: process.env.DB_USER ?? 'app',
    password: process.env.DB_PASSWORD ?? 'app-secret',
    database: process.env.DB_NAME ?? 'webauthn',
  });

  await ds.initialize();

  await ds.query(
    'UPDATE "users" SET "microsoftRefreshToken" = NULL WHERE "microsoftRefreshToken" IS NOT NULL',
  );

  console.log(`✅ microsoftRefreshToken limpiado para todos los usuarios`);

  await ds.destroy();
}

main().catch((err) => {
  console.error('❌ Error:', err.message ?? err);
  process.exit(1);
});
