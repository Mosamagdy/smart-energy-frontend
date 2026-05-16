import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthStore } from '../auth/auth.store';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthStore);
  const token = auth.token();

  const isApiRequest = req.url.includes('/api/');
  
  const isPublicEndpoint = req.url.includes('/api/auth/');

  if (!token) {
  
    if (isApiRequest && !isPublicEndpoint) {
      console.warn('[AuthInterceptor] ⚠️ NO TOKEN on protected endpoint:', req.url);
    }
    return next(req);
  }

  const authReq = req.clone({
    setHeaders: { Authorization: `Bearer ${token}` }
  });

  return next(authReq);
};