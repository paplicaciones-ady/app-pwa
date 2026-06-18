import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class FingerprintService {
  async getFingerprint(): Promise<string> {
    const raw = navigator.userAgent + navigator.language + screen.width + screen.height;
    const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(raw));
    const hex = Array.from(new Uint8Array(hash))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
    return hex;
  }
}
