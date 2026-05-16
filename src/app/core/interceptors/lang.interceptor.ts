import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { I18nService } from '../i18n/i18n.service';

export const langInterceptor: HttpInterceptorFn = (req, next) => {
  const i18n = inject(I18nService);
  const lang = i18n.language();

  return next(
    req.clone({
      setHeaders: {
        'Accept-Language': lang,
        'x-language': lang
      }
    })
  );
};

