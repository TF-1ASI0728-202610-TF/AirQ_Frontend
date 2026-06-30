import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../../environments/environment';

interface AdminClientResponse {
  id: number;
  institutionName: string;
  contactName: string;
  contactEmail: string;
  subscriptionPlan: string;
  hardwareSensorsCount: number;
  hardwareSensorsLimit: number;
  monthlyBilling: number;
  status: string;
}

@Component({
  selector: 'app-billing',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="container py-4">
      <div class="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 class="mb-1">Facturación</h2>
          <p class="text-muted mb-0">Supervisión de ingresos recurrentes y suscripciones activas B2B.</p>
        </div>
      </div>

      <!-- KPIs o Tarjetas de Resumen -->
      <div class="row mb-4">
        <div class="col-md-4">
          <div class="card border border-light shadow-sm bg-white text-dark">
            <div class="card-body">
              <h6 class="text-uppercase fw-semibold mb-2 text-muted">Ingreso Recurrente Total</h6>
              <div class="d-flex align-items-center">
                <h2 class="mb-0 fw-bold me-2" style="color: #207193;">{{ totalRevenue | currency:'PEN':'symbol-narrow':'1.2-2' }}</h2>
                <span class="badge bg-light text-muted">/ mes</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Tabla de Facturación -->
      <div class="card shadow-sm border-0">
        <div class="card-body p-0">
          <div class="table-responsive">
            <table class="table table-hover align-middle mb-0">
              <thead class="table-light">
                <tr>
                  <th class="ps-4">Empresa</th>
                  <th>Plan Contratado</th>
                  <th>Sensores Activos</th>
                  <th class="text-end pe-4">Factura Mensual</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngIf="clients.length === 0 && !isLoading">
                  <td colspan="4" class="text-center text-muted py-5">
                    No hay información de facturación disponible.
                  </td>
                </tr>
                <tr *ngIf="isLoading">
                  <td colspan="4" class="text-center text-muted py-4">
                    <div class="spinner-border spinner-border-sm text-primary me-2" role="status"></div>
                    Calculando facturación...
                  </td>
                </tr>

                <tr *ngFor="let client of clients">
                  <td class="ps-4 fw-medium text-dark">{{ client.institutionName || 'Sin asignar' }}</td>
                  <td>
                    <span class="badge" [ngClass]="client.subscriptionPlan.includes('Pro') ? 'bg-primary' : 'bg-info text-dark'">
                      {{ client.subscriptionPlan }}
                    </span>
                  </td>
                  <td>
                    {{ client.hardwareSensorsCount }} <span class="text-muted small">sensores</span>
                  </td>
                  <td class="text-end pe-4 fw-semibold text-success">
                    {{ client.monthlyBilling | currency:'PEN':'symbol-narrow':'1.2-2' }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`:host { display: block; }`]
})
export class BillingComponent implements OnInit {
  private http = inject(HttpClient);
  private cdr = inject(ChangeDetectorRef);

  clients: AdminClientResponse[] = [];
  isLoading = true;
  totalRevenue = 0;

  ngOnInit(): void {
    this.loadBillingData();
  }

  loadBillingData(): void {
    this.isLoading = true;

    // De acuerdo a la documentación, la lista de clientes completa con información
    // financiera ya calculada viene desde el endpoint GET /api/v1/admin/clients
    this.http.get<AdminClientResponse[]>(`${environment.apiUrl}/admin/clients`).subscribe({
      next: (data) => {
        let items: AdminClientResponse[] = [];

        // Manejador genérico de respuestas (lista o paginación)
        if (Array.isArray(data)) {
          items = data;
        } else if (data && (data as any).value) {
          items = (data as any).value;
        } else if (data && (data as any).content) {
          items = (data as any).content;
        }

        // Para facturación, solo nos interesan los clientes activos (que pagan)
        this.clients = items.filter(c => c.status === 'ACTIVE' || c.status === 'SUSPENDED');

        // El frontend calcula el total general sumando la propiedad monthlyBilling de cada cliente
        this.totalRevenue = this.clients.reduce((sum, client) => {
          return sum + (client.monthlyBilling || 0);
        }, 0);

        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error al cargar datos de facturación:', err);
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }
}
