import { Component, OnInit, inject, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { ToastService } from '../../../../core/services/toast.service';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Router, RouterModule, NavigationEnd } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { Subscription } from 'rxjs';
import { filter, debounceTime } from 'rxjs/operators';
import { environment } from '../../../../../environments/environment';

interface ClientOnboardingItem {
  id: number;
  collegeName: string;
  contact: string;
  registrationDate: string;
  status: string;
}

interface AdminClientResponse {
  id: number;
  institutionName?: string;
  contactName?: string;
  contactEmail?: string;
  subscriptionPlan?: string;
  hardwareSensorsCount?: number;
  hardwareSensorsLimit?: number;
  monthlyBilling?: number;
  status: string;
}

interface AdminClientsResponse {
  value?: AdminClientResponse[];
  Count?: number;
  content?: AdminClientResponse[];
}

@Component({
  selector: 'app-client-onboarding',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule],
  template: `
    <div class="container py-4">
      <div class="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 class="mb-1">Onboarding de colegios</h2>
          <p class="text-muted mb-0">Aprueba las cuentas B2B pendientes para que ingresen al sistema.</p>
        </div>
      </div>

      <div class="card shadow-sm border-0">
        <div class="card-body">
          <div class="table-responsive">
            <table class="table align-middle mb-0">
              <thead class="table-light">
                <tr>
                  <th>Empresa</th>
                  <th>Email</th>
                  <th>Fecha de Registro</th>
                  <th>Estado</th>
                  <th class="text-end">Acción</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngIf="clients.length === 0 && !isLoading">
                  <td colspan="5" class="text-center text-muted py-4">No hay clientes pendientes por aprobar.</td>
                </tr>
                <tr *ngIf="isLoading">
                    <td colspan="5" class="text-center py-4">
                        <div class="spinner-border spinner-border-sm text-primary" role="status"></div>
                        <span class="ms-2 text-muted">Cargando...</span>
                    </td>
                </tr>
                <tr *ngFor="let client of clients">
                  <td>{{ client.collegeName }}</td>
                  <td>{{ client.contact }}</td>
                  <td>{{ client.registrationDate | date:'dd/MM/yyyy' }}</td>
                  <td>
                    <span class="badge bg-warning text-dark">Pendiente</span>
                  </td>
                  <td class="text-end">
                    <button class="btn btn-sm fw-medium" type="button" (click)="openConfirm(client)" style="background-color: #207193; color: white; border: none; padding: 0.35rem 0.85rem; border-radius: 6px;">
                      Aprobar
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal de Aprobación -->
    <div class="modal fade show d-block" *ngIf="selectedClient" tabindex="-1" role="dialog" style="background: rgba(0,0,0,0.5);">
      <div class="modal-dialog modal-dialog-centered" role="document" style="max-width: 500px; margin: 1.75rem auto;">
        <div class="modal-content border-0 shadow-lg" style="background-color: #ffffff; border-radius: 12px; overflow: hidden;">
          <div class="modal-header border-bottom-0" style="padding: 1.5rem 1.5rem 0.5rem 1.5rem;">
            <h5 class="modal-title fw-bold" style="color: #207193; margin: 0;">Aprobar Cliente</h5>
            <button type="button" class="btn-close" (click)="closeModal()"></button>
          </div>
          <div class="modal-body" style="padding: 1rem 1.5rem;">
            <div class="mb-4" style="margin-bottom: 1.5rem;">
              <small class="text-muted text-uppercase fw-bold" style="font-size: 0.75rem; letter-spacing: 0.5px; display: block; margin-bottom: 0.25rem;">Nombre de la Organización</small>
              <div class="fs-5 fw-bold" style="color: #207193;">{{ selectedClient.collegeName !== 'Sin nombre' ? selectedClient.collegeName : 'Nombre no especificado' }}</div>
            </div>

            <form [formGroup]="approvalForm">

              <div class="mb-4" style="margin-bottom: 1.5rem;">
                <label for="plan" class="form-label fw-semibold text-dark mb-2" style="display: block; margin-bottom: 0.5rem;">Plan Comercial</label>
                <select id="plan" class="form-select form-control shadow-none" formControlName="plan" style="border-radius: 8px; font-size: 15px; padding: 0.5rem 0.75rem;">
                  <option value="BASIC">Plan AirQ Básico (S/ 1,200.00/mes - 20 sensores)</option>
                  <option value="PRO">Plan AirQ Pro (S/ 2,500.00/mes - 50 sensores)</option>
                </select>
              </div>

              <div class="mb-4" style="margin-bottom: 1.5rem;">
                <label for="initialSensorsCount" class="form-label fw-semibold text-dark mb-2" style="display: block; margin-bottom: 0.5rem;">Sensores Contratados</label>
                <input type="number" id="initialSensorsCount" class="form-control shadow-none" formControlName="initialSensorsCount"
                       style="border-radius: 8px; font-size: 15px; padding: 0.5rem 0.75rem;"
                       [class.is-invalid]="approvalForm.get('initialSensorsCount')?.invalid && approvalForm.get('initialSensorsCount')?.touched">
                
                <div *ngIf="approvalForm.get('initialSensorsCount')?.hasError('maxBasicSensors') && approvalForm.get('initialSensorsCount')?.touched" class="alert d-flex align-items-start" style="background-color: rgba(220, 53, 69, 0.08); border: 1px solid rgba(220, 53, 69, 0.2); border-radius: 8px; padding: 1rem; margin-top: 0.75rem; display: flex; gap: 1rem;">
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

                <div class="invalid-feedback text-danger mt-1" *ngIf="approvalForm.get('initialSensorsCount')?.hasError('min') && approvalForm.get('initialSensorsCount')?.touched" style="font-size: 0.875rem;">
                  Debe contratar al menos 1 sensor.
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
            <button class="btn btn-primary fw-semibold" type="button" [disabled]="approvalForm.invalid || isApproving" (click)="approveClient()" style="padding: 0.5rem 1.5rem; border-radius: 6px; background-color: #207193; border-color: #207193; color: white;">
              <span *ngIf="isApproving" class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
              Confirmar Aprobación
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
export class ClientOnboardingComponent implements OnInit, OnDestroy {
  private http = inject(HttpClient);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);
  private fb = inject(FormBuilder);
  private toastService = inject(ToastService);

  clients: ClientOnboardingItem[] = [];
  selectedClient: ClientOnboardingItem | null = null;
  isLoading = true;
  isApproving = false;

  approvalForm: FormGroup;
  estimatedPrice = 0;
  priceBreakdown = '';

  private refreshTimer: ReturnType<typeof setInterval> | null = null;
  private subscriptions = new Subscription();

  constructor() {
    this.approvalForm = this.fb.group({
      organizationName: [''],
      plan: ['BASIC', Validators.required],
      initialSensorsCount: [1, [Validators.required, Validators.min(1)]]
    }, { validators: this.planSensorsValidator });
  }

  ngOnInit(): void {
    this.loadClients();

    this.refreshTimer = setInterval(() => this.loadClients(), 10000);

    const routerSub = this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe(() => {
        if (this.router.url.includes('/admin/onboarding')) {
          this.loadClients();
        }
      });
    this.subscriptions.add(routerSub);

    const formSub = this.approvalForm.valueChanges
      .pipe(debounceTime(300))
      .subscribe(() => this.calculatePrice());
    this.subscriptions.add(formSub);
  }

  ngOnDestroy(): void {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
    }
    this.subscriptions.unsubscribe();
  }

  // Custom Validator to check if BASIC plan exceeds 20 sensors
  planSensorsValidator(group: AbstractControl): ValidationErrors | null {
    const plan = group.get('plan')?.value;
    const sensorsCount = group.get('initialSensorsCount')?.value;

    if (plan === 'BASIC' && sensorsCount > 20) {
      // Set error on the control itself so it displays the red border easily
      group.get('initialSensorsCount')?.setErrors({ maxBasicSensors: true });
      return { maxBasicSensors: true };
    }

    // If we passed the validation but the control previously had this specific error, we need to clear it
    if (group.get('initialSensorsCount')?.hasError('maxBasicSensors')) {
      const currentErrors = group.get('initialSensorsCount')?.errors;
      if (currentErrors) {
        delete currentErrors['maxBasicSensors'];
        group.get('initialSensorsCount')?.setErrors(Object.keys(currentErrors).length > 0 ? currentErrors : null);
      }
    }

    return null;
  }

  loadClients(): void {
    this.isLoading = true;
    this.http.get<AdminClientResponse[] | AdminClientsResponse>(`${environment.apiUrl}/admin/clients`).subscribe({
      next: (data) => {
        let items: AdminClientResponse[] = [];
        if (Array.isArray(data)) items = data;
        else if (data?.value) items = data.value;
        else if ((data as any)?.content) items = (data as any).content;

        this.clients = items
          .filter((client: any) => client.status !== 'ACTIVE')
          .map((client: any) => ({
            id: client.id,
            collegeName: client.institutionName || 'Sin nombre',
            contact: client.contactEmail || 'Sin correo',
            registrationDate: client.createdAt || client.registrationDate || new Date().toISOString(),
            status: client.status || 'PENDING_VERIFICATION'
          }));
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('No se pudieron cargar los clientes', err);
        this.isLoading = false;
      }
    });
  }

  openConfirm(client: ClientOnboardingItem): void {
    this.selectedClient = client;
    this.approvalForm.reset({
      organizationName: client.collegeName,
      plan: 'BASIC',
      initialSensorsCount: 1
    });
    this.calculatePrice();
  }

  closeModal(): void {
    this.selectedClient = null;
    this.isApproving = false;
  }

  calculatePrice(): void {
    const { plan, initialSensorsCount } = this.approvalForm.value;
    if (!plan || !initialSensorsCount || initialSensorsCount <= 0 || this.approvalForm.hasError('maxBasicSensors')) {
      this.estimatedPrice = 0;
      this.priceBreakdown = '';
      return;
    }

    if (plan === 'BASIC') {
      this.estimatedPrice = 1200;
      this.priceBreakdown = `Plan base incluye hasta 20 sensores.`;
    } else if (plan === 'PRO') {
      const basePrice = 2500;
      const extraSensors = Math.max(0, initialSensorsCount - 50);
      this.estimatedPrice = basePrice + (extraSensors * 45);
      if (extraSensors > 0) {
        this.priceBreakdown = `S/ 2,500.00 (Base) + ${extraSensors} sensores extra (S/ ${extraSensors * 45.00})`;
      } else {
        this.priceBreakdown = `Plan base incluye hasta 50 sensores.`;
      }
    }
    this.cdr.detectChanges();
  }

  approveClient(): void {
    if (!this.selectedClient || this.approvalForm.invalid) {
      this.approvalForm.markAllAsTouched();
      return;
    }

    this.isApproving = true;
    const payload = {
      plan: this.approvalForm.value.plan,
      organizationName: this.approvalForm.value.organizationName,
      initialSensorsCount: this.approvalForm.value.initialSensorsCount
    };

    this.http.put(`${environment.apiUrl}/admin/clients/${this.selectedClient.id}/activate`, payload).subscribe({
      next: () => {
        this.toastService.showSuccess('Cuenta aprobada correctamente');
        this.closeModal();
        this.loadClients();
      },
      error: (err) => {
        console.error('Error al aprobar la cuenta', err);
        this.toastService.showError(`No se pudo aprobar la cuenta. Error: ${err.message}`);
        this.isApproving = false;
      }
    });
  }
}
