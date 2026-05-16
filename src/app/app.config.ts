import { ApplicationConfig, APP_INITIALIZER, inject, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideTranslateService, TranslateLoader, TranslateService, TranslationObject } from '@ngx-translate/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { routes } from './app.routes';
import { authInterceptor } from './core/interceptors/auth.interceptor';
import { errorInterceptor } from './core/interceptors/error.interceptor';
import { langInterceptor } from './core/interceptors/lang.interceptor';
import { I18nService } from './core/i18n/i18n.service';
import { AuthStore } from './core/auth/auth.store';
import { AuthService } from './core/auth/auth.service';

export function translateLoaderFactory(): TranslateLoader {
  const http = inject(HttpClient);
  return {
    getTranslation(lang: string): Observable<TranslationObject> {
      return http.get<TranslationObject>(`/i18n/${lang}.json`);
    }
  };
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(
      withInterceptors([authInterceptor, errorInterceptor, langInterceptor])
    ),
    provideTranslateService({
      defaultLanguage: 'ar',
      loader: {
        provide: TranslateLoader,
        useFactory: translateLoaderFactory
      }
    }),
    {
      provide: 'APP_I18N_BOOTSTRAP',
      useFactory: () => {
        const i18n = inject(I18nService);
        const translate = inject(TranslateService);
        translate.setDefaultLang('ar');
        i18n.setLanguage('ar');
        return true;
      }
    },
    // ✅ Auth bootstrap - لازم يخلص قبل ما الـ app يبدأ
    {
      provide: APP_INITIALIZER,
      useFactory: () => {
        const authStore = inject(AuthStore);
        const authService = inject(AuthService);
        return async () => {
          authStore.bootstrapFromStorage();
          await authService.bootstrapMeIfNeeded();
        };
      },
      multi: true,
    },
  ]
};