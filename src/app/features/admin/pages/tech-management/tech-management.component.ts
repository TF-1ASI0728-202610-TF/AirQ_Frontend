import { Component, OnInit, inject, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { interval, Subscription } from 'rxjs';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';
import Swal from 'sweetalert2';
import { TechService } from '../../../../core/services/tech.service';

@Component({
  selector: 'app-tech-management',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './tech-management.component.html',
  styleUrls: ['./tech-management.component.css']
})
export class TechManagementComponent implements OnInit, OnDestroy {
  private fb = inject(FormBuilder);
  private techService = inject(TechService);
  private cdr = inject(ChangeDetectorRef);

  technicians: any[] = [];
  isLoading = false;
  showModal = false;
  private refreshSubscription?: Subscription;

  techForm: FormGroup = this.fb.group({
    fullName: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    phone: ['', Validators.required],
    zone: ['Lima Centro', Validators.required]
  });

  ngOnInit(): void {
    this.loadTechnicians();
    this.refreshSubscription = interval(15000).subscribe(() => {
      this.loadTechnicians(true);
    });
  }

  ngOnDestroy(): void {
    this.refreshSubscription?.unsubscribe();
  }

  loadTechnicians(silent = false): void {
    if (!silent) {
      this.isLoading = true;
    }
    this.techService.getTechnicians().subscribe({
      next: (data) => {
        this.technicians = data;
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.isLoading = false;
        this.cdr.detectChanges();
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No se pudo cargar la lista de técnicos.'
        });
      }
    });
  }

  openModal(): void {
    this.showModal = true;
    this.techForm.reset({ zone: 'Lima Centro' });
  }

  closeModal(): void {
    this.showModal = false;
    this.techForm.reset({ zone: 'Lima Centro' });
  }

  submitTechnician(): void {
    if (this.techForm.invalid) {
      this.techForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    this.techService.createTechnician(this.techForm.value).subscribe({
      next: (response) => {
        this.isLoading = false;
        this.showModal = false;
        this.loadTechnicians();
        Swal.fire({
          icon: 'success',
          title: 'Técnico creado con éxito',
          text: 'Se ha enviado un correo al técnico con sus credenciales de acceso temporal.',
          confirmButtonText: 'Aceptar'
        });
      },
      error: () => {
        this.isLoading = false;
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No se pudo crear el técnico.'
        });
      }
    });
  }

  deleteTechnician(id: number): void {
    Swal.fire({
      title: '¿Estás seguro?',
      text: 'Esta acción eliminará al técnico permanentemente.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc3545',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.isLoading = true;
        this.techService.deleteTechnician(id).subscribe({
          next: () => {
            this.loadTechnicians();
            Swal.fire('Eliminado', 'El técnico ha sido eliminado.', 'success');
          },
          error: () => {
            this.isLoading = false;
            Swal.fire('Error', 'No se pudo eliminar al técnico.', 'error');
          }
        });
      }
    });
  }
}
