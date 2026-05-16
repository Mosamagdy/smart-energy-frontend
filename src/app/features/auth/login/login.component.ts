import { Component, inject, signal } from '@angular/core';
import {  TranslateModule, TranslatePipe, TranslateService } from '@ngx-translate/core';
import { AuthService } from '../../../core/auth/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [TranslatePipe , TranslateModule],
  styles: [`
    :host { display: block; }
    .login-bg {
      position: fixed;
      inset: 0;
      background-color: #0f0c29;
      background-image: 
        linear-gradient(135deg, #0f0c29 0%, #1a1a3e 50%, #24243e 100%);
    }
    .grid-overlay {
      position: absolute;
      inset: 0;
      pointer-events: none;
      background-image:
        linear-gradient(rgba(56,189,248,0.08) 1px, transparent 1px),
        linear-gradient(90deg, rgba(56,189,248,0.08) 1px, transparent 1px);
      background-size: 44px 44px;
    }
    input {
      background: white !important;
      border: 1px solid #e2e8f0 !important;
      color: #1e293b !important;
    }
    input:focus {
      border-color: #3b82f6 !important;
      box-shadow: 0 0 0 3px rgba(59,130,246,0.2) !important;
      outline: none !important;
    }
    input::placeholder {
      color: #94a3b8 !important;
    }
    input:-webkit-autofill,
    input:-webkit-autofill:focus {
      background-color: white !important;
      -webkit-box-shadow: 0 0 0 1000px white inset !important;
      -webkit-text-fill-color: #1e293b !important;
      caret-color: #1e293b !important;
    }
  `],
  template: `
    <div class="login-bg flex items-center justify-center">
      <div class="grid-overlay"></div>

      <div class="absolute top-0 left-0 w-64 h-64 rounded-full pointer-events-none"
           style="background: radial-gradient(circle, rgba(56,189,248,0.15), transparent 70%); transform: translate(-30%,-30%)"></div>
      <div class="absolute bottom-0 right-0 w-56 h-56 rounded-full pointer-events-none"
           style="background: radial-gradient(circle, rgba(250,204,21,0.10), transparent 70%); transform: translate(30%,30%)"></div>

      <div class="relative z-10 w-full max-w-5xl mx-6 flex items-center gap-0" style="height: 100vh; max-height: 680px;">

        <!-- LEFT: Branding panel -->
        <div class="hidden md:flex flex-col justify-center flex-1 pr-12">
          <div class="flex items-center gap-4 mb-6">
            <div class="relative">
              <div class="absolute inset-0 rounded-xl blur-xl opacity-50"
                   style="background: radial-gradient(circle, #38bdf8, #facc15);"></div>
              <div class="relative w-16 h-16 rounded-xl flex items-center justify-center overflow-hidden"
                   style="background: linear-gradient(135deg,#0d0922,#1a1040); border: 1px solid rgba(56,189,248,0.25);">
                <img [src]="logoBase64" alt="Smart Energy" class="w-12 h-12 object-contain rounded-lg" />
              </div>
            </div>
            <div>
              <h1 class="text-2xl font-extrabold text-white leading-tight">Smart Energy</h1>
              <span class="text-xl font-extrabold"
                    style="background: linear-gradient(90deg,#38bdf8,#facc15); -webkit-background-clip:text; -webkit-text-fill-color:transparent;">
                Services
              </span>
            </div>
          </div>

          <p class="text-3xl font-bold text-white leading-snug mb-3">خدمات الطاقه الذكيه</p>

          <div class="flex flex-col gap-2.5">
            @for (f of features; track f.label) {
              <div class="flex items-center gap-3">
                <span class="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                      style="background: rgba(56,189,248,0.12); border: 1px solid rgba(56,189,248,0.2);">
                  <span class="text-sm">{{ f.icon }}</span>
                </span>
                <span class="text-sm" style="color: rgba(148,163,184,0.8);">{{ f.label }}</span>
              </div>
            }
          </div>

          <p class="mt-8 text-xs" style="color: rgba(148,163,184,0.35);">
            Powered by <span style="color: rgba(56,189,248,0.7);">Automata</span> Industrial &amp; Solar Technology
          </p>
        </div>

        <!-- Vertical divider -->
        <div class="hidden md:block w-px self-stretch my-8 shrink-0"
             style="background: linear-gradient(to bottom, transparent, rgba(56,189,248,0.3), rgba(250,204,21,0.3), transparent);"></div>

        <!-- RIGHT: Login card -->
        <div class="shrink-0 w-full md:w-95 md:pl-12">
          <div class="rounded-2xl overflow-hidden"
               style="background: rgba(20,20,50,0.9);
                      border: 1px solid rgba(255,255,255,0.1);
                      backdrop-filter: blur(16px);">

            <div class="px-7 pt-7 pb-5 text-center"
                 style="border-bottom: 1px solid rgba(255,255,255,0.08);">

              <!-- Mobile logo -->
              <div class="md:hidden flex justify-center mb-4">
                <div class="relative">
                  <div class="absolute inset-0 rounded-xl blur-xl opacity-50"
                       style="background: radial-gradient(circle,#38bdf8,#facc15);"></div>
                  <div class="relative w-14 h-14 rounded-xl flex items-center justify-center overflow-hidden"
                       style="background: linear-gradient(135deg,#0d0922,#1a1040); border: 1px solid rgba(56,189,248,0.25);">
                    <img [src]="logoBase64" alt="" class="w-10 h-10 object-contain rounded-lg" />
                  </div>
                </div>
              </div>

              <p class="text-xs font-bold tracking-[0.18em] uppercase mb-1"
                 style="color: rgba(148,163,184,0.6);">{{ 'auth.welcomeBack' | translate }}</p>
              <h2 class="text-lg font-extrabold text-white">{{ 'auth.login' | translate }}</h2>

              <div class="flex items-center justify-center gap-2 mt-3">
                <span class="flex-1 h-px max-w-10"
                      style="background: linear-gradient(90deg,transparent,rgba(56,189,248,0.4));"></span>
                <svg viewBox="0 0 20 20" class="w-6 h-6" fill="none">
                  <polygon points="11,1 4,10 8.5,10 7.5,18 15,8.5 10,8.5" fill="#facc15" stroke="#facc15" stroke-width="0.5"/>
                </svg>
                <span class="flex-1 h-px max-w-10"
                      style="background: linear-gradient(90deg,rgba(250,204,21,0.4),transparent);"></span>
              </div>
            </div>

            <!-- Form -->
            <div class="px-7 py-5">
              <form class="flex flex-col gap-4" (submit)="$event.preventDefault(); onSubmit()">

                <!-- Email -->
                <label class="flex flex-col gap-1">
                  <span class="text-xs font-semibold tracking-wider uppercase"
                        style="color: rgba(148,163,184,0.7);">{{ 'auth.email' | translate }}</span>
                  <div class="relative">
                    <span class="absolute inset-y-0 right-3 flex items-center pointer-events-none">
                      <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" style="color: #94a3b8;">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                              d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
                      </svg>
                    </span>
                    <input type="email" [placeholder]="'auth.emailPlaceholder' | translate" autocomplete="username"
                      class="w-full rounded-xl px-3.5 pr-9 py-2.5 text-sm text-gray-900 outline-none transition-all duration-200 bg-white border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                      [value]="email()" (input)="email.set($any($event.target).value)" />
                  </div>
                </label>

                <!-- Password -->
                <label class="flex flex-col gap-1">
                  <span class="text-xs font-semibold tracking-wider uppercase"
                        style="color: rgba(148,163,184,0.7);">{{ 'auth.password' | translate }}</span>
                  <div class="relative">
                    <!-- ✅ زر إظهار/إخفاء الباسوورد -->
                    <button type="button"
                      class="absolute inset-y-0 right-3 flex items-center"
                      (click)="showPassword.set(!showPassword())"
                      [attr.aria-label]="showPassword() ? 'Hide password' : 'Show password'">
                      @if (showPassword()) {
                        <!-- Eye-off icon: إخفاء -->
                        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" style="color: #94a3b8;">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"/>
                        </svg>
                      } @else {
                        <!-- Eye icon: إظهار -->
                        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" style="color: #94a3b8;">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                        </svg>
                      }
                    </button>
                    <input
                      [type]="showPassword() ? 'text' : 'password'"
                      [placeholder]="'auth.passwordPlaceholder' | translate"
                      autocomplete="current-password"
                      class="w-full rounded-xl px-3.5 pr-9 py-2.5 text-sm text-gray-900 outline-none transition-all duration-200 bg-white border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                      [value]="password()" (input)="password.set($any($event.target).value)" />
                  </div>
                </label>

                <!-- Error -->
                @if (error()) {
                  <div class="rounded-xl px-3.5 py-2.5 text-xs flex items-center gap-2"
                       style="background: rgba(239,68,68,0.15); border: 1px solid rgba(239,68,68,0.3); color: #fca5a5;">
                    <svg class="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                            d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    </svg>
                    {{ error() }}
                  </div>
                }

                <!-- Submit -->
                <button type="submit" [disabled]="isSubmitting()"
                  class="mt-1 w-full rounded-xl py-2.5 text-sm font-bold text-white tracking-wide transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  style="background: linear-gradient(135deg,#2563eb,#0ea5e9); box-shadow: 0 4px 20px rgba(14,165,233,0.28);">
                  @if (isSubmitting()) {
                    <svg class="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                    </svg>
                    {{ 'auth.loggingIn' | translate }}
                  } @else {
                    {{ 'auth.login' | translate }}
                    <svg viewBox="0 0 16 16" class="w-3.5 h-3.5 shrink-0" fill="none">
                      <polygon points="9,1 4,8.5 8,8.5 7,15 12,7.5 8,7.5" fill="#facc15"/>
                    </svg>
                  }
                </button>
              </form>
            </div>

            <div class="px-7 pb-5 text-center">
              <p class="text-xs" style="color: rgba(148,163,184,0.4);">
                © {{ currentYear }} Smart Energy Services
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class LoginComponent {
  readonly email        = signal('');
  readonly password     = signal('');
  readonly isSubmitting = signal(false);
  readonly error        = signal<string | null>(null);
  readonly showPassword = signal(false);
  readonly currentYear  = new Date().getFullYear();

  readonly logoBase64 = 'data:image/png;base64,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';

  readonly features = [
    { icon: '☀️', label: 'Solar Energy Project Management' },
    { icon: '⚡', label: 'Industrial Systems Monitoring' },
    { icon: '📊', label: 'Integrated Financial & Operational Reports' },
    { icon: '🔒', label: 'Multi-Level Authorization System' },
  ];

  private readonly authService = inject(AuthService);
  private readonly translate   = inject(TranslateService);

  async onSubmit() {
    this.error.set(null);
    const email    = this.email().trim();
    const password = this.password();
    if (!email || !password) {
      this.error.set(this.translate.instant('auth.requiredField'));
      return;
    }
    this.isSubmitting.set(true);
    try {
      await this.authService.login(email, password);
    } catch {
      this.error.set(this.translate.instant('auth.loginFailed'));
    } finally {
      this.isSubmitting.set(false);
    }
  }
}