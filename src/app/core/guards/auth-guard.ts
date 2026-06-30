import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth';

export const authGuard: CanActivateFn = (route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (!auth.isLoggedIn()) {
    router.navigate(['/login']);
    return false;
  }

  const allowedRoles = route.data['roles'] as string[] | undefined;
  if (!allowedRoles || allowedRoles.length === 0) {
    return true;
  }

  const role = auth.getRole()?.toUpperCase();
  const canAccess = role !== null && allowedRoles.some(r => r.toUpperCase() === role);

  if (!canAccess) {
    router.navigate([role === 'ADMIN' ? '/clients' : '/dashboard']);
    return false;
  }

  return true;
};
