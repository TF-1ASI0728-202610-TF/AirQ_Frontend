import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth-guard';
import { DashboardLayoutComponent } from './layouts/dashboard-layout/dashboard-layout.component';
import { LoginComponent } from './features/auth/pages/login/login.component';
import { RegisterComponent } from './features/auth/pages/register/register.component';
import { ForgotPasswordComponent } from './features/auth/pages/forgot-password/forgot-password.component';
import { ResetPasswordComponent } from './features/auth/pages/reset-password/reset-password.component';
import { DashboardComponent } from './features/dashboard/pages/dashboard/dashboard.component';
import { ClientOnboardingComponent } from './features/admin/pages/client-onboarding/client-onboarding.component';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'forgot-password', component: ForgotPasswordComponent },
  { path: 'reset-password', component: ResetPasswordComponent },
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  {
    path: '',
    component: DashboardLayoutComponent,
    canActivateChild: [authGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: DashboardComponent, data: { roles: ['CLIENT'] } },
      { path: 'classrooms', component: DashboardComponent, data: { roles: ['CLIENT'] } },
      { path: 'alerts', component: DashboardComponent, data: { roles: ['CLIENT'] } },
      {
        path: 'support',
        loadComponent: () => import('./features/client/pages/client-support/client-support.component').then(m => m.ClientSupportComponent),
        data: { roles: ['CLIENT'] }
      },
      { path: 'clientSettings', component: DashboardComponent, data: { roles: ['CLIENT'] } },
      {
        path: 'clients',
        loadComponent: () => import('./features/admin/pages/client-directory/client-directory.component').then(m => m.ClientDirectoryComponent),
        data: { roles: ['ADMIN'] }
      },
      { path: 'admin/onboarding', component: ClientOnboardingComponent, data: { roles: ['ADMIN'] } },
      {
        path: 'admin/tech-management',
        loadComponent: () => import('./features/admin/pages/tech-management/tech-management.component').then(m => m.TechManagementComponent),
        data: { roles: ['ADMIN'] }
      },
      {
        path: 'billing',
        loadComponent: () => import('./features/admin/pages/billing/billing.component').then(m => m.BillingComponent),
        data: { roles: ['ADMIN'] }
      },
      {
        path: 'tickets',
        loadComponent: () => import('./features/admin/pages/ticket-management/ticket-management.component').then(m => m.TicketManagementComponent),
        data: { roles: ['ADMIN'] }
      },
      { path: 'adminSettings', component: DashboardComponent, data: { roles: ['ADMIN'] } }
    ]
  },
  { path: '**', redirectTo: 'login' }
];
