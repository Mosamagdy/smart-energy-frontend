import { DOCUMENT } from '@angular/common';
import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

export type AppLanguage = 'ar' | 'en';

@Injectable({ providedIn: 'root' })
export class I18nService {
  private readonly translate = inject(TranslateService);
  private readonly document = inject(DOCUMENT);

  readonly language = signal<AppLanguage>('ar');
  readonly dir = computed<'rtl' | 'ltr'>(() => (this.language() === 'ar' ? 'rtl' : 'ltr'));

  constructor() {
    effect(() => {
      const lang = this.language();

      this.translate.use(lang);

      this.document.documentElement.lang = lang;
      this.document.documentElement.dir = this.dir();
    });
  }

  setLanguage(lang: AppLanguage) {
    this.language.set(lang);
  }

  toggleLanguage() {
    this.setLanguage(this.language() === 'ar' ? 'en' : 'ar');
  }
}

