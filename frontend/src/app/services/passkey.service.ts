import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, lastValueFrom } from 'rxjs';
import { startRegistration, startAuthentication } from '@simplewebauthn/browser';

@Injectable({ providedIn: 'root' })
export class PasskeyService {
  private readonly http = inject(HttpClient);

  async registerPasskey(deviceId?: number): Promise<boolean> {
    const opts = await lastValueFrom(
      this.http.post<{ publicKey: any }>('/api/auth/passkey/register/begin', {}),
    );
    const credential = await startRegistration(opts.publicKey);
    const body: any = { credential };
    if (deviceId !== undefined) {
      body.deviceId = deviceId;
    }
    await lastValueFrom(
      this.http.post('/api/auth/passkey/register/complete', body),
    );
    return true;
  }

  async loginPasskey(email: string, deviceFingerprint?: string): Promise<string> {
    const body: any = { email };
    if (deviceFingerprint !== undefined) {
      body.deviceFingerprint = deviceFingerprint;
    }
    const opts = await lastValueFrom(
      this.http.post<{ sessionId: string; publicKey: any; deviceId?: number | null }>(
        '/api/auth/passkey/login/begin',
        body,
      ),
    );
    const credential = await startAuthentication(opts.publicKey);
    const res = await lastValueFrom(
      this.http.post<{ access_token: string }>(
        '/api/auth/passkey/login/complete',
        { sessionId: opts.sessionId, credential },
      ),
    );
    return res.access_token;
  }

  async loginPasskeyByFingerprint(fingerprint: string): Promise<string> {
    const opts = await lastValueFrom(
      this.http.post<{ sessionId: string; publicKey: any }>(
        '/api/auth/passkey/login/begin',
        { deviceFingerprint: fingerprint },
      ),
    );
    const credential = await startAuthentication(opts.publicKey);
    const res = await lastValueFrom(
      this.http.post<{ access_token: string }>(
        '/api/auth/passkey/login/complete',
        { sessionId: opts.sessionId, credential },
      ),
    );
    return res.access_token;
  }

  getPasskeys(): Observable<
    { id: number; deviceName?: string; deviceId?: number | null; createdAt: string }[]
  > {
    return this.http.get<any[]>('/api/auth/passkey');
  }

  deletePasskey(id: number): Observable<void> {
    return this.http.delete<void>(`/api/auth/passkey/${id}`);
  }
}
