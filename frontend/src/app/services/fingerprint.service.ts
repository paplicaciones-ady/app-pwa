import { Injectable, inject } from '@angular/core';
import { IndexedDbService } from './indexed-db.service';

@Injectable({ providedIn: 'root' })
export class FingerprintService {
  private readonly indexedDb = inject(IndexedDbService);

  async getFingerprint(): Promise<string> {
    let uuid = await this.indexedDb.get<string>('auth', 'deviceUuid');
    if (!uuid) {
      uuid = crypto.randomUUID();
      await this.indexedDb.put('auth', uuid, 'deviceUuid');
    }
    return uuid;
  }

  async getLegacyFingerprint(): Promise<string> {
    const parts: string[] = [];

    parts.push(Intl.DateTimeFormat().resolvedOptions().timeZone);
    parts.push(`${screen.width}x${screen.height}x${screen.colorDepth}`);
    parts.push(navigator.hardwareConcurrency?.toString() ?? '');
    parts.push((navigator as any).deviceMemory?.toString() ?? '');
    parts.push(navigator.language);
    parts.push(navigator.userAgent);

    try {
      const c = document.createElement('canvas');
      c.width = 200;
      c.height = 50;
      const ctx = c.getContext('2d')!;
      ctx.textBaseline = 'top';
      ctx.font = '14px Arial';
      ctx.fillStyle = '#f60';
      ctx.fillRect(125, 1, 62, 20);
      ctx.fillStyle = '#069';
      ctx.fillText('Cwm fjordbank glyphs vext quiz, \u{1F603}', 2, 15);
      parts.push(c.toDataURL());
    } catch {}

    try {
      const gl = (
        document.createElement('canvas').getContext('webgl') ||
        document.createElement('canvas').getContext('experimental-webgl') as any
      );
      if (gl) {
        const ext = gl.getExtension('WEBGL_debug_renderer_info');
        if (ext) {
          parts.push(gl.getParameter(ext.UNMASKED_VENDOR_WEBGL));
          parts.push(gl.getParameter(ext.UNMASKED_RENDERER_WEBGL));
        }
      }
    } catch {}

    try {
      const ac = new (window.AudioContext || (window as any).webkitAudioContext)();
      parts.push(ac.sampleRate.toString());
      ac.close();
    } catch {}

    try {
      await document.fonts.ready;
      for (const f of document.fonts) {
        parts.push(f.family);
      }
    } catch {}

    const apis = [
      'WebAssembly', 'SharedArrayBuffer', 'WebGL2', 'WebRTC', 'credentials',
      'serviceWorker', 'geolocation', 'clipboard', 'wakeLock',
    ];
    for (const api of apis) {
      if (api in window) parts.push(api);
    }

    const raw = parts.join('|');
    const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(raw));
    return Array.from(new Uint8Array(hash))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  }
}
