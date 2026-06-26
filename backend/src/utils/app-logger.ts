import * as fs from 'node:fs';
import * as path from 'node:path';

function ts(): string {
  const d = new Date();
  return [
    d.getFullYear(), '-', String(d.getMonth() + 1).padStart(2, '0'),
    '-', String(d.getDate()).padStart(2, '0'),
    ' ', String(d.getHours()).padStart(2, '0'),
    ':', String(d.getMinutes()).padStart(2, '0'),
    ':', String(d.getSeconds()).padStart(2, '0'),
    ',', String(d.getMilliseconds()).padStart(3, '0'),
  ].join('');
}

class AppLogger {
  private stream: fs.WriteStream | null = null;

  private ensureStream() {
    if (this.stream) return;
    const dir = path.join('logs', 'app');
    fs.mkdirSync(dir, { recursive: true });
    this.stream = fs.createWriteStream(path.join(dir, 'app.log'), { flags: 'a' });
  }

  log(service: string, method: string, msg: string, details?: unknown): void {
    this.ensureStream();
    const line = `${ts()} [${service}] ${method}: ${msg}` + (details !== undefined ? ` ${JSON.stringify(details)}` : '');
    this.stream!.write(line + '\n');
    console.log(line);
  }

  close(): void {
    this.stream?.end();
  }
}

export const appLogger = new AppLogger();
