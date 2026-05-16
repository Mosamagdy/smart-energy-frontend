import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthStore } from '../auth/auth.store';

export function roleGuard(allowedRoles: string[]): CanActivateFn {
  return (route, state) => {
    const router = inject(Router);
    const auth = inject(AuthStore);

    // Ensure bootstrap has completed
    if (!auth.isBootstrapped()) {
      auth.bootstrapFromStorage();
    }

    const role = auth.role();
    const normalizedRole = typeof role === 'string' ? role.toLowerCase() : null;
    const normalizedAllowed = allowedRoles.map((r) => r.toLowerCase());

    // Check if role is in allowed list
    if (normalizedRole && normalizedAllowed.includes(normalizedRole)) {
      return true;
    }

    // Redirect to unauthorized or login
    if (!normalizedRole) {
      return router.parseUrl('/auth/login');
    }
    
    return router.parseUrl('/unauthorized');
  };
}

