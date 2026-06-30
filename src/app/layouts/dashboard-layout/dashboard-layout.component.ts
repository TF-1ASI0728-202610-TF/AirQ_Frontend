import { Component, inject, OnInit } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../core/services/auth';

@Component({
  selector: 'app-dashboard-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './dashboard-layout.component.html',
  styleUrl: './dashboard-layout.component.css'
})
export class DashboardLayoutComponent implements OnInit {
  private router = inject(Router);
  private auth = inject(AuthService);

  menuItems: Array<{ label: string; route: string }> = [];

  ngOnInit(): void {
    this.menuItems = this.auth.isAdmin()
      ? [
          { label: 'Directorio de clientes', route: '/clients' },
          { label: 'Onboarding', route: '/admin/onboarding' },
          { label: 'Gestión de Técnicos', route: '/admin/tech-management' },
          { label: 'Facturación', route: '/billing' },
          { label: 'Supervisión Tickets', route: '/tickets' },
          { label: 'Configuración', route: '/adminSettings' }
        ]
      : [
          { label: 'Dashboard', route: '/dashboard' },
          { label: 'Mis sedes / aulas', route: '/classrooms' },
          { label: 'Centro de alertas', route: '/alerts' },
          { label: 'Soporte', route: '/support' },
          { label: 'Configuración', route: '/clientSettings' }
        ];
  }

  logout(): void {
    this.auth.logout();
    this.router.navigate(['/login']);
  }
}