import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthStore } from '../auth/auth.store';

const FIRST_LOGIN_MESSAGE = 'يجب تغيير كلمة المرور أولاً قبل استخدام البوابة';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthStore);
  const router = inject(Router);

  return next(req).pipe(
    catchError((err: unknown) => {
      if (err instanceof HttpErrorResponse) {
        if (err.status === 401) {
          void auth.logoutAndRedirect();
        }

        if (err.status === 403) {
          const backendMessage =
            (typeof err.error?.message === 'string' && err.error.message) ||
            (typeof err.message === 'string' && err.message) ||
            '';

          // Backend currently does not serialize `err.code`, so we detect by message.
          if (backendMessage.includes(FIRST_LOGIN_MESSAGE)) {
            auth.firstLoginRequired.set(true);
            void router.navigateByUrl('/auth/update-password');
          }
        }
      }

      return throwError(() => err);
    })
  );
};

