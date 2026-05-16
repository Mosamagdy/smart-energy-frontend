import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthStore } from '../auth/auth.store';
import { AuthService } from '../auth/auth.service';

export const authGuard: CanActivateFn = async (route, state) => {
  const router = inject(Router);
  const auth = inject(AuthStore);
  const authService = inject(AuthService);

  // Wait for bootstrap from localStorage to complete
  if (!auth.isBootstrapped()) {
    // Bootstrap is synchronous, but check just in case
    auth.bootstrapFromStorage();
  }

  // Now check if authenticated
  if (!auth.isAuthenticated()) {
    return router.parseUrl('/auth/login');
  }

  // Bootstrap user data from backend if needed
  await authService.bootstrapMeIfNeeded();

  if (auth.firstLoginRequired()) {
    return router.parseUrl('/auth/update-password');
  }

  return true;
};

