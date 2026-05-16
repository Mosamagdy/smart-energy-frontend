import { Component, inject, signal } from '@angular/core';
import { NgIf } from '@angular/common';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { AuthService } from '../../../core/auth/auth.service';

@Component({
  selector: 'app-verify-otp',
  standalone: true,
  imports: [TranslatePipe, NgIf],
  template: `
    <section class="rounded-2xl border border-black/10 bg-white p-6">
      <h1 class="text-lg font-semibold">{{ 'auth.verifyOtp' | translate }}</h1>

      <form class="mt-6 flex flex-col gap-4" (submit)="$event.preventDefault(); onSubmit()">
        <label class="flex flex-col gap-1 text-sm text-black/80">
          {{ 'auth.enterOtp' | translate }}
          <input
            type="text"
            inputmode="numeric"
            class="rounded-xl border border-black/10 bg-white px-3 py-2 outline-none focus:border-company-primary"
            [value]="otpCode()"
            (input)="otpCode.set($any($event.target).value)"
            autocomplete="one-time-code"
          />
        </label>

        <div *ngIf="error() as err" class="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-900">
          {{ err }}
        </div>

        <button
          type="submit"
          class="rounded-xl bg-[var(--color-company-primary)] px-4 py-2.5 text-sm font-semibold text-white hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-70"
          [disabled]="isSubmitting()"
        >
          {{ isSubmitting() ? ('auth.loggingIn' | translate) : ('auth.verifyOtp' | translate) }}
        </button>
      </form>
    </section>
  `,
})
export class VerifyOtpComponent {
  private readonly authService = inject(AuthService);
  private readonly translate = inject(TranslateService);

  readonly otpCode = signal('');
  readonly isSubmitting = signal(false);
  readonly error = signal<string | null>(null);

  async onSubmit() {
    this.error.set(null);
    const otp_code = this.otpCode().trim();
    if (!otp_code) {
      this.error.set(this.translate.instant('auth.requiredField'));
      return;
    }

    this.isSubmitting.set(true);
    try {
      await this.authService.verifyOtp(otp_code);
    } catch {
      this.error.set(this.translate.instant('auth.loginFailed'));
    } finally {
      this.isSubmitting.set(false);
    }
  }
}

