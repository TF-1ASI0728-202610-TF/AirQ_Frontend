import { Component, inject } from '@angular/core';

import {
  FormBuilder,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';

import { Router, RouterLink } from '@angular/router';

import { AuthService } from '../../../../core/services/auth';

@Component({
  selector: 'app-register',

  standalone: true,

  imports: [
    ReactiveFormsModule,
    RouterLink
  ],

  templateUrl: './register.component.html',

  styleUrl: './register.component.css'
})
export class RegisterComponent {

  private fb = inject(FormBuilder);

  private auth = inject(AuthService);

  private router = inject(Router);

  form = this.fb.group({

    fullName: [
      '',
      Validators.required
    ],

    companyName: [
      '',
      Validators.required
    ],

    email: [
      '',
      [
        Validators.required,
        Validators.email
      ]
    ],

    password: [
      '',
      [
        Validators.required,
        Validators.minLength(6)
      ]
    ],

    confirmPassword: [
      '',
      Validators.required
    ]

  });

  register() {

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const password = this.form.value.password;
    const confirmPassword = this.form.value.confirmPassword;

    if (password !== confirmPassword) {
      this.form.get('confirmPassword')?.setErrors({ mismatch: true });
      return;
    }

    this.auth.register({
      username: this.form.value.fullName ?? '',
      email: this.form.value.email ?? '',
      password: password ?? '',
      companyName: this.form.value.companyName ?? ''
    }).subscribe({
      next: () => {
        this.router.navigate(['/login']);
      },
      error: (err) => {
        console.error(err);
      }
    });
  }
}