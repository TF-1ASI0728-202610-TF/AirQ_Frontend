import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../../core/services/auth';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);

  errorMessage = '';
  isLoading = false;

  form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required]
  });

  login() {
    if (this.form.invalid) {
      this.errorMessage = 'Por favor, complete todos los campos correctamente.';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    this.auth.login(this.form.getRawValue() as any).subscribe({
      next: (response) => {
        this.isLoading = false;
        const role = response.role?.toUpperCase();
        const targetRoute = role === 'ADMIN' ? '/clients' : '/dashboard';
        this.router.navigate([targetRoute]);
      },
      error: (err) => {
        this.isLoading = false;
        console.error(err);
        if (err.status === 401 || err.status === 403) {
          this.errorMessage = 'Credenciales incorrectas. Verifique su correo y contraseña.';
        } else {
          this.errorMessage = 'Ocurrió un error al intentar iniciar sesión. Intente más tarde.';
        }
      }
    });
  }
}