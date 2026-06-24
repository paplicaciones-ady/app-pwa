import { Component, inject, signal, OnInit } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PqrsStore } from '../../services/pqrs.store';
import { ProductService, Product } from '../../services/product.service';

const TYPE_LABELS: Record<string, string> = {
  peticion: 'Petición',
  queja: 'Queja',
  reclamo: 'Reclamo',
  sugerencia: 'Sugerencia',
};

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [DatePipe, FormsModule],
  template: `
    <div class="container">
      <h2>PQRS</h2>

      @if (error(); as e) {
        <div class="error">{{ e }}</div>
      }

      <button class="primary-btn" (click)="toggleForm()">
        {{ showForm() ? 'Cancelar' : 'Nueva PQRS' }}
      </button>

      @if (showForm()) {
        <form class="pqrs-form" (ngSubmit)="onSubmit()">
          <select [(ngModel)]="formData.type" name="type" required>
            <option value="" disabled selected>Tipo</option>
            <option value="peticion">Petición</option>
            <option value="queja">Queja</option>
            <option value="reclamo">Reclamo</option>
            <option value="sugerencia">Sugerencia</option>
          </select>
          <input [(ngModel)]="formData.title" name="title" type="text" placeholder="Título" required />
          <textarea [(ngModel)]="formData.description" name="description" placeholder="Descripción" rows="4" required></textarea>
          <select [(ngModel)]="formData.productId" name="productId" required>
            <option value="" disabled selected>Producto</option>
            @for (p of products(); track p.id) {
              <option [value]="p.id">{{ p.name }}</option>
            }
          </select>
          <button type="submit" [disabled]="submitting()">
            {{ submitting() ? 'Enviando...' : 'Enviar' }}
          </button>
        </form>
      }

      @if (pqrsList().length === 0) {
        <p class="empty">No hay PQRS registradas</p>
      }

      @for (pqrs of pqrsList(); track pqrs.id) {
        <div class="card">
          <div class="card-header">
            <span class="badge" [class]="pqrs.type">{{ TYPE_LABELS[pqrs.type] || pqrs.type }}</span>
            <span class="date">{{ pqrs.createdAt | date:'short' }}</span>
          </div>
          <h3>{{ pqrs.title }}</h3>
          <p class="desc">{{ pqrs.description }}</p>
          <div class="card-meta">
            <span>Producto: <strong>{{ pqrs.productName || '—' }}</strong></span>
            <span>Usuario: <strong>{{ pqrs.userEmail || '—' }}</strong></span>
          </div>
        </div>
      }
    </div>
  `,
  styles: `
    .container { max-width: 720px; margin: 2rem auto; padding: 0 1rem; font-family: sans-serif; }
    h2 { margin-bottom: 1rem; }
    .primary-btn { padding: 0.75rem 1.5rem; border: none; border-radius: 6px; font-size: 1rem; cursor: pointer; background: #007bff; color: #fff; margin-bottom: 1.5rem; }
    .primary-btn:hover { opacity: .9; }
    .pqrs-form { display: flex; flex-direction: column; gap: 0.75rem; padding: 1.5rem; background: #f8f9fa; border-radius: 8px; margin-bottom: 1.5rem; }
    .pqrs-form select, .pqrs-form input, .pqrs-form textarea { padding: 0.75rem; border: 1px solid #ccc; border-radius: 6px; font-size: 1rem; font-family: inherit; }
    .pqrs-form button { padding: 0.75rem; border: none; border-radius: 6px; font-size: 1rem; cursor: pointer; background: #28a745; color: #fff; }
    .pqrs-form button:disabled { opacity: .5; cursor: default; }
    .empty { color: #888; font-size: 0.9rem; }
    .card { border: 1px solid #e0e0e0; border-radius: 8px; padding: 1rem; margin-bottom: 1rem; }
    .card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem; }
    .badge { display: inline-block; padding: 0.2rem 0.6rem; border-radius: 12px; font-size: 0.8rem; font-weight: 600; color: #fff; }
    .badge.peticion { background: #17a2b8; }
    .badge.queja { background: #dc3545; }
    .badge.reclamo { background: #fd7e14; }
    .badge.sugerencia { background: #6f42c1; }
    .date { font-size: 0.8rem; color: #888; }
    h3 { margin: 0 0 0.5rem; font-size: 1.1rem; }
    .desc { margin: 0 0 0.75rem; color: #555; line-height: 1.4; }
    .card-meta { display: flex; gap: 1rem; font-size: 0.85rem; color: #666; }
    .error { background: #f8d7da; color: #721c24; padding: 0.75rem; border-radius: 6px; margin-bottom: 1rem; font-size: 0.9rem; }
  `,
})
export class Home implements OnInit {
  private readonly pqrsStore = inject(PqrsStore);
  private readonly productService = inject(ProductService);

  protected readonly TYPE_LABELS = TYPE_LABELS;
  protected readonly pqrsList = this.pqrsStore.allPqrs;
  protected readonly syncStatus = this.pqrsStore.syncStatus;
  protected readonly products = signal<Product[]>([]);
  protected readonly showForm = signal(false);
  protected readonly submitting = signal(false);
  protected readonly error = signal<string | null>(null);

  protected readonly formData = {
    type: '',
    title: '',
    description: '',
    productId: '' as any,
  };

  ngOnInit() {
    this.pqrsStore.loadPqrs();
    this.productService.getAll().subscribe({
      next: (list) => this.products.set(list),
    });
  }

  protected toggleForm() {
    this.showForm.update((v) => !v);
    this.error.set(null);
  }

  protected async onSubmit() {
    if (!this.formData.type || !this.formData.title || !this.formData.description || !this.formData.productId) return;

    this.submitting.set(true);
    this.error.set(null);

    try {
      await this.pqrsStore.createPqrs({
        type: this.formData.type,
        title: this.formData.title,
        description: this.formData.description,
        productId: Number(this.formData.productId),
      });
      this.submitting.set(false);
      this.showForm.set(false);
      this.formData.type = '';
      this.formData.title = '';
      this.formData.description = '';
      this.formData.productId = '';
    } catch (err: any) {
      this.submitting.set(false);
      this.error.set(err?.error?.message ?? 'Error al crear PQRS');
    }
  }
}
