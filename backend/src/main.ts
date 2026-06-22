import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

function ts(): string {
  const d = new Date();
  const M = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const h = String(d.getHours()).padStart(2, '0');
  const m = String(d.getMinutes()).padStart(2, '0');
  const s = String(d.getSeconds()).padStart(2, '0');
  const ms = String(d.getMilliseconds()).padStart(3, '0');
  return `${d.getFullYear()}-${M}-${day} ${h}:${m}:${s},${ms}`;
}

async function bootstrap() {
  console.log(`${ts()} [INFO] main.bootstrap: ${'='.repeat(60)}`);
  console.log(`${ts()} [INFO] main.bootstrap: APP STARTUP — app-pwa backend`);
  console.log(`${ts()} [INFO] main.bootstrap: ${'='.repeat(60)}`);

  console.log(`${ts()} [INFO] main.bootstrap: JWT_SECRET set=${!!process.env.JWT_SECRET}`);
  console.log(`${ts()} [INFO] main.bootstrap: DB_HOST=${process.env.DB_HOST ?? 'localhost'}`);
  console.log(`${ts()} [INFO] main.bootstrap: COPILOTSTUDIOAGENT__ENVIRONMENTID=${process.env.COPILOTSTUDIOAGENT__ENVIRONMENTID ?? '(not set)'}`);
  console.log(`${ts()} [INFO] main.bootstrap: COPILOTSTUDIOAGENT__SCHEMANAME=${process.env.COPILOTSTUDIOAGENT__SCHEMANAME ?? '(not set)'}`);

  const app = await NestFactory.create(AppModule);
  app.enableCors();
  app.setGlobalPrefix('api');

  app.use((req: any, res: any, next: any) => {
    const start = Date.now();
    console.log(`${ts()} [DEBUG] HTTP: >>> ${req.method} ${req.originalUrl} from=${req.ip ?? req.connection?.remoteAddress ?? '-'}`);
    res.on('finish', () => {
      console.log(`${ts()} [DEBUG] HTTP: <<< ${req.method} ${req.originalUrl} -> ${res.statusCode} (${Date.now() - start}ms)`);
    });
    next();
  });

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  console.log(`${ts()} [INFO] main.bootstrap: Server listening on :${port}`);
}
bootstrap();
