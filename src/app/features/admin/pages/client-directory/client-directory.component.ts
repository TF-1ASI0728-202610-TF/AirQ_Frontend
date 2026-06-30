import { Component, OnInit, inject, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { interval, Subscription } from 'rxjs';
import Swal from 'sweetalert2';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { environment } from '../../../../../environments/environment';
import { ToastService } from '../../../../core/services/toast.service';

/** Forma exacta que devuelve GET /api/v1/admin/clients */
interface AdminClientResponse {
  id: number;
  institutionName: string;
  contactName: string;
  contactEmail: string;
  subscriptionPlan: string;       // Ej: "Plan AirQ Pro"
  hardwareSensorsCount: number;   // sensores activos
  hardwareSensorsLimit: number;   // límite del plan
  monthlyBilling: number;
  status: string;                 // "ACTIVE" | "SUSPENDED"
}

@Component({
  selector: 'app-client-directory',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="container py-4">
      <div class="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 class="mb-1">Directorio de Clientes</h2>
          <p class="text-muted mb-0">Gestión de cuentas B2B activas en el sistema y facturación recurrente.</p>
        </div>
      </div>

      <div class="card shadow-sm border-0">
        <div class="card-body p-0">
          <div class="table-responsive">
            <table class="table table-hover align-middle mb-0">
              <thead class="table-light">
                <tr>
                  <th class="ps-4">Empresa</th>
                  <th>Contacto</th>
                  <th>Suscripción Actual</th>
                  <th>Hardware (Sensores)</th>
                  <th>Facturación Mensual</th>
                  <th>Estado</th>
                  <th class="text-center pe-4">Acciones</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngIf="clients.length === 0 && !isLoading">
                  <td colspan="7" class="text-center text-muted py-5">
                    No hay clientes registrados en el directorio.
                  </td>
                </tr>
                <tr *ngIf="isLoading">
                  <td colspan="7" class="text-center py-4">
                    <div class="spinner-border spinner-border-sm text-primary" role="status"></div>
                    <span class="ms-2 text-muted">Cargando...</span>
                  </td>
                </tr>

                <tr *ngFor="let client of clients">
                  <td class="ps-4 fw-medium text-dark">{{ client.institutionName }}</td>
                  <td>
                    <div class="d-flex flex-column">
                      <span class="text-dark">{{ client.contactEmail }}</span>
                    </div>
                  </td>
                  <td>
                    <span class="badge" [ngClass]="getBadgeClass(client.subscriptionPlan)">
                      {{ getPlanName(client.subscriptionPlan) }}
                    </span>
                  </td>
                  <td>
                    <div class="d-flex align-items-center">
                      <span>
                        {{ client.hardwareSensorsCount }} /
                        {{ client.hardwareSensorsLimit }}
                        <small class="text-muted ms-1">activos</small>
                      </span>
                    </div>
                  </td>
                  <td class="fw-semibold">
                    {{ client.monthlyBilling | currency:'PEN':'symbol-narrow':'1.2-2' }}
                  </td>
                  <td>
                    <span class="badge" [ngClass]="client.status === 'ACTIVE' ? 'bg-success' : 'bg-danger'">
                      {{ client.status === 'ACTIVE' ? 'Activo' : 'Suspendido' }}
                    </span>
                  </td>
                  <td class="text-end pe-4">
                    <button class="btn btn-sm me-2 fw-medium" type="button" (click)="openManageModal(client)" style="background-color: #207193; color: white; border: none; padding: 0.35rem 0.85rem; border-radius: 6px;">
                      Gestionar Plan
                    </button>
                    <button class="btn btn-sm fw-medium" 
                            [style.background-color]="client.status === 'ACTIVE' ? '#dc3545' : '#198754'" 
                            style="color: white; border: none; padding: 0.35rem 0.85rem; border-radius: 6px;"
                            type="button" (click)="toggleStatus(client)">
                      {{ client.status === 'ACTIVE' ? 'Suspender' : 'Reactivar' }}
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal Gestionar Plan -->
    <div class="modal fade show d-block" *ngIf="selectedClient" tabindex="-1" role="dialog" style="background: rgba(0,0,0,0.5);">
      <div class="modal-dialog modal-dialog-centered" role="document" style="max-width: 500px; margin: 1.75rem auto;">
        <div class="modal-content border-0 shadow-lg" style="background-color: #ffffff; border-radius: 12px; overflow: hidden;">
          <div class="modal-header border-bottom-0" style="padding: 1.5rem 1.5rem 0.5rem 1.5rem;">
            <h5 class="modal-title fw-bold" style="color: #207193; margin: 0;">Actualizar Plan Comercial</h5>
            <button type="button" class="btn-close" (click)="closeModal()"></button>
          </div>
          <div class="modal-body" style="padding: 1rem 1.5rem;">
            <p class="text-muted mb-4" style="margin-bottom: 1.5rem;">{{ selectedClient.institutionName }}</p>

            <div class="d-flex justify-content-between align-items-center mb-4 rounded" style="background-color: #f5f7fa; border-left: 4px solid #207193; padding: 1rem; margin-bottom: 1.5rem; display: flex; justify-content: space-between;">
              <div>
                <small class="text-muted text-uppercase fw-bold" style="font-size: 0.7rem; letter-spacing: 0.5px; display: block;">Plan Actual</small>
                <div class="fs-6 fw-bold" style="color: #207193; margin-top: 0.25rem;">{{ getPlanName(selectedClient.subscriptionPlan || '') }}</div>
              </div>
              <div class="text-end" style="text-align: right;">
                <small class="text-muted text-uppercase fw-bold" style="font-size: 0.7rem; letter-spacing: 0.5px; display: block;">Sensores Límite</small>
                <div class="fs-6 fw-bold text-dark" style="margin-top: 0.25rem;">{{ selectedClient.hardwareSensorsLimit }}</div>
              </div>
            </div>

            <form [formGroup]="manageForm">
              <div class="mb-4" style="margin-bottom: 1.5rem;">
                <label for="plan" class="form-label fw-semibold text-dark mb-2" style="display: block; margin-bottom: 0.5rem;">Nuevo Plan Comercial</label>
                <select id="plan" class="form-select form-control shadow-none" formControlName="plan" style="border-radius: 8px; font-size: 15px; padding: 0.5rem 0.75rem;">
                  <option value="BASIC">Plan AirQ Básico (S/ 1,200.00/mes - 20 sensores)</option>
                  <option value="PRO">Plan AirQ Pro (S/ 2,500.00/mes - 50 sensores)</option>
                </select>
              </div>

              <div class="mb-4" style="margin-bottom: 1.5rem;">
                <label for="newSensorsCount" class="form-label fw-semibold text-dark mb-2" style="display: block; margin-bottom: 0.5rem;">Nuevo Límite de Sensores</label>
                <input type="number" id="newSensorsCount" class="form-control shadow-none" formControlName="newSensorsCount"
                       style="border-radius: 8px; font-size: 15px; padding: 0.5rem 0.75rem;"
                       [class.is-invalid]="manageForm.get('newSensorsCount')?.invalid && manageForm.get('newSensorsCount')?.touched">
                
                <div *ngIf="manageForm.get('newSensorsCount')?.hasError('maxBasicSensors') && manageForm.get('newSensorsCount')?.touched" class="alert d-flex align-items-start" style="background-color: rgba(220, 53, 69, 0.08); border: 1px solid rgba(220, 53, 69, 0.2); border-radius: 8px; padding: 1rem; margin-top: 0.75rem; display: flex; gap: 1rem;">
                  <div style="color: #dc3545; margin-right: 0.75rem;">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" class="bi bi-exclamation-triangle-fill" viewBox="0 0 16 16">
                      <path d="M8.982 1.566a1.13 1.13 0 0 0-1.96 0L.165 13.233c-.457.778.091 1.767.98 1.767h13.713c.889 0 1.438-.99.98-1.767L8.982 1.566zM8 5c.535 0 .954.462.9.995l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 5.995A.905.905 0 0 1 8 5zm.002 6a1 1 0 1 1 0 2 1 1 0 0 1 0-2z"/>
                    </svg>
                  </div>
                  <div>
                    <p class="fw-bold mb-1" style="color: #dc3545; margin: 0 0 0.25rem 0;">Límite Excedido</p>
                    <div class="text-dark" style="margin: 0; font-size: 0.9rem;">El <strong>Plan Básico</strong> solo admite un máximo de <strong>20 sensores</strong>. Seleccione el Plan Pro o reduzca la cantidad.</div>
                  </div>
                </div>
              </div>
            </form>

            <div *ngIf="estimatedPrice > 0" class="alert d-flex align-items-start" style="background-color: rgba(32, 113, 147, 0.08); border: 1px solid rgba(32, 113, 147, 0.2); border-radius: 8px; padding: 1rem; margin-top: 1rem; display: flex; gap: 1rem;">
              <div style="color: #207193; margin-right: 0.75rem;">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" class="bi bi-info-circle-fill" viewBox="0 0 16 16">
                  <path d="M8 16A8 8 0 1 0 8 0a8 8 0 0 0 0 16m.93-9.412-1 4.705c-.07.34.029.533.304.533.194 0 .487-.07.686-.246l-.088.416c-.287.346-.92.598-1.465.598-.703 0-1.002-.422-.808-1.319l.738-3.468c.064-.293.006-.399-.287-.47l-.451-.081.082-.381 2.29-.287zM8 5.5a1 1 0 1 1 0-2 1 1 0 0 1 0 2"/>
                </svg>
              </div>
              <div>
                <p class="fw-bold mb-1" style="color: #207193; margin: 0 0 0.25rem 0;">Facturación Estimada</p>
                <div class="fs-5 fw-bolder text-dark mb-1" style="margin: 0 0 0.25rem 0; font-size: 1.25rem;">{{ estimatedPrice | currency:'PEN':'symbol-narrow':'1.2-2' }} <span class="fw-normal text-muted" style="font-size: 1rem;">/ mes</span></div>
                <small class="text-muted d-block" style="font-size: 0.8rem; margin: 0;">{{ priceBreakdown }}</small>
              </div>
            </div>
          </div>
          <div class="modal-footer border-top-0" style="padding: 0.5rem 1.5rem 1.5rem 1.5rem; display: flex; justify-content: flex-end; gap: 0.5rem;">
            <button class="btn fw-semibold" type="button" (click)="closeModal()" style="background-color: #dc3545; color: white; border: none; padding: 0.5rem 1rem; border-radius: 6px;">Cancelar</button>
            <button class="btn btn-primary fw-semibold" type="button" [disabled]="manageForm.invalid || isUpdating" (click)="updatePlan()" style="padding: 0.5rem 1.5rem; border-radius: 6px; background-color: #207193; border-color: #207193; color: white;">
              <span *ngIf="isUpdating" class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
              Actualizar Suscripción
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }
    .modal {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      z-index: 1055;
      overflow-x: hidden;
      overflow-y: auto;
      outline: 0;
      display: flex !important;
      align-items: center;
      justify-content: center;
    }
    .modal-dialog {
      width: 100%;
      pointer-events: none;
    }
    .modal-content {
      pointer-events: auto;
    }
  `]
})
export class ClientDirectoryComponent implements OnInit, OnDestroy {
  private http = inject(HttpClient);
  private cdr = inject(ChangeDetectorRef);
  private fb = inject(FormBuilder);
  private toastService = inject(ToastService);
  private refreshSubscription?: Subscription;

  clients: AdminClientResponse[] = [];
  isLoading = true;

  // Manage Modal State
  selectedClient: AdminClientResponse | null = null;
  manageForm: FormGroup;
  isUpdating = false;
  estimatedPrice = 0;
  priceBreakdown = '';

  constructor() {
    this.manageForm = this.fb.group({
      plan: ['BASIC', Validators.required],
      newSensorsCount: [1, [Validators.required, Validators.min(1)]]
    }, { validators: this.planSensorsValidator });

    this.manageForm.valueChanges.subscribe(() => this.calculatePrice());
  }

  planSensorsValidator(group: AbstractControl): ValidationErrors | null {
    const plan = group.get('plan')?.value;
    const sensorsCount = group.get('newSensorsCount')?.value;
    const control = group.get('newSensorsCount');

    if (plan === 'BASIC' && sensorsCount > 20) {
      control?.setErrors({ maxBasicSensors: true });
      return { maxBasicSensors: true };
    }

    if (control?.hasError('maxBasicSensors')) {
      const currentErrors = control.errors;
      if (currentErrors) {
        delete currentErrors['maxBasicSensors'];
        control.setErrors(Object.keys(currentErrors).length > 0 ? currentErrors : null);
      }
    }
    return null;
  }

  ngOnInit(): void {
    this.loadClients();
    this.refreshSubscription = interval(15000).subscribe(() => {
      this.loadClients(true);
    });
  }

  ngOnDestroy(): void {
    this.refreshSubscription?.unsubscribe();
  }

  loadClients(silent = false): void {
    if (!silent) {
      this.isLoading = true;
    }
    this.http.get<AdminClientResponse[]>(`${environment.apiUrl}/admin/clients`).subscribe({
      next: (data) => {
        // El backend devuelve directamente un array con todos los campos calculados
        const allClients = Array.isArray(data) ? data : [];
        // Filtrar clientes pendientes de verificación para que solo aparezcan en Onboarding
        this.clients = allClients.filter(c => c.status === 'ACTIVE' || c.status === 'SUSPENDED');
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error al cargar clientes:', err);
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  /** Determina la clase del badge de suscripción según el nombre del plan que devuelve el backend. */
  getBadgeClass(subscriptionPlan: string): string {
    if (subscriptionPlan?.toUpperCase().includes('PRO')) return 'bg-primary';
    return 'bg-info text-dark';
  }

  getPlanName(subscriptionPlan: string): string {
    if (!subscriptionPlan) return 'Sin Plan';
    if (subscriptionPlan.toUpperCase().includes('PRO')) return 'AirQ Pro';
    if (subscriptionPlan.toUpperCase().includes('BASIC')) return 'AirQ Básico';
    return subscriptionPlan;
  }

  // Acciones: Suspender o Reactivar
  toggleStatus(client: AdminClientResponse): void {
    const isActivating = client.status !== 'ACTIVE';
    const action = isActivating ? 'reactivar' : 'suspender';
    
    Swal.fire({
      title: `¿Confirmar acción?`,
      text: `¿Estás seguro de que deseas ${action} el acceso a ${client.institutionName}?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: isActivating ? '#198754' : '#dc3545',
      cancelButtonColor: '#6c757d',
      confirmButtonText: `Sí, ${action}`,
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        if (!isActivating) {
          // Suspender: PUT /suspend sin body
          this.http.put(`${environment.apiUrl}/admin/clients/${client.id}/suspend`, {}).subscribe({
            next: () => { client.status = 'SUSPENDED'; this.cdr.detectChanges(); },
            error: () => this.toastService.showError(`Error al intentar suspender al cliente.`)
          });
        } else {
          // Reactivar: PUT /activate requiere plan y sensores
          const planKey = client.subscriptionPlan?.toUpperCase().includes('PRO') ? 'PRO' : 'BASIC';
          const payload = {
            plan: planKey,
            organizationName: client.institutionName,
            initialSensorsCount: client.hardwareSensorsCount
          };
          this.http.put(`${environment.apiUrl}/admin/clients/${client.id}/activate`, payload).subscribe({
            next: () => { client.status = 'ACTIVE'; this.cdr.detectChanges(); },
            error: () => this.toastService.showError(`Error al intentar reactivar al cliente.`)
          });
        }
      }
    });
  }

  // Acciones: Gestionar Plan
  openManageModal(client: AdminClientResponse): void {
    this.selectedClient = client;
    const planKey = client.subscriptionPlan?.toUpperCase().includes('PRO') ? 'PRO' : 'BASIC';
    this.manageForm.reset({
      plan: planKey,
      newSensorsCount: client.hardwareSensorsCount || 1
    });
    this.calculatePrice();
  }

  closeModal(): void {
    this.selectedClient = null;
    this.isUpdating = false;
  }

  calculatePrice(): void {
    const { plan, newSensorsCount } = this.manageForm.value;
    if (!plan || !newSensorsCount || newSensorsCount <= 0 || this.manageForm.hasError('maxBasicSensors')) {
      this.estimatedPrice = 0;
      this.priceBreakdown = '';
      return;
    }

    if (plan === 'BASIC') {
      this.estimatedPrice = 1200;
      this.priceBreakdown = `Plan base (Hasta 20 sensores).`;
    } else if (plan === 'PRO') {
      const basePrice = 2500;
      const extraSensors = Math.max(0, newSensorsCount - 50);
      this.estimatedPrice = basePrice + (extraSensors * 45);
      if (extraSensors > 0) {
        this.priceBreakdown = `S/ 2,500.00 (Base) + ${extraSensors} extras (S/ ${extraSensors * 45})`;
      } else {
        this.priceBreakdown = `Plan base (Hasta 50 sensores).`;
      }
    }
  }

  updatePlan(): void {
    if (!this.selectedClient || this.manageForm.invalid) return;

    this.isUpdating = true;

    // PUT /api/v1/admin/clients/{id}/activate — mismo endpoint para aprobar y actualizar plan
    const payload = {
      plan: this.manageForm.value.plan,                    // "BASIC" | "PRO"
      organizationName: this.selectedClient.institutionName,
      initialSensorsCount: this.manageForm.value.newSensorsCount
    };

    this.http.put(`${environment.apiUrl}/admin/clients/${this.selectedClient.id}/activate`, payload).subscribe({
      next: () => {
        this.toastService.showSuccess('Plan de facturación actualizado exitosamente.');
        this.closeModal();
        this.loadClients(); // Recargamos para reflejar los nuevos valores de la DB
      },
      error: (err) => {
        console.error('Error al actualizar el plan:', err);
        this.toastService.showError('Ocurrió un error al actualizar el plan. Revisa la consola para más detalles.');
        this.isUpdating = false;
      }
    });
  }
}
