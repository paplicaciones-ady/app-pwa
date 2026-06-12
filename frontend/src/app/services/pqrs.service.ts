import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Pqrs {
  id: number;
  type: string;
  title: string;
  description: string;
  productId: number;
  productName: string | null;
  userId: number;
  userEmail: string | null;
  createdAt: string;
}

export interface CreatePqrsData {
  type: string;
  title: string;
  description: string;
  productId: number;
}

@Injectable({ providedIn: 'root' })
export class PqrsService {
  private readonly http = inject(HttpClient);

  getAll(): Observable<Pqrs[]> {
    return this.http.get<Pqrs[]>('/api/pqrs');
  }

  create(data: CreatePqrsData): Observable<Pqrs> {
    return this.http.post<Pqrs>('/api/pqrs', data);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`/api/pqrs/${id}`);
  }
}
