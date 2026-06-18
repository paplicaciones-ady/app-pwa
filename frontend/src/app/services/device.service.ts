import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Device {
  id: number;
  userId: number;
  deviceName: string;
  deviceFingerprint: string;
  isTrusted: boolean;
  lastUsedAt?: string;
  createdAt: string;
}

@Injectable({ providedIn: 'root' })
export class DeviceService {
  private readonly http = inject(HttpClient);

  registerDevice(deviceName: string, deviceFingerprint: string): Observable<Device> {
    return this.http.post<Device>('/api/devices', { deviceName, deviceFingerprint });
  }

  getDevices(): Observable<Device[]> {
    return this.http.get<Device[]>('/api/devices');
  }

  toggleTrust(id: number): Observable<Device> {
    return this.http.patch<Device>(`/api/devices/${id}/toggle-trust`, {});
  }

  deleteDevice(id: number): Observable<void> {
    return this.http.delete<void>(`/api/devices/${id}`);
  }
}
