import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthApi, LoginStep1Result } from '../../data/api/auth.api';
import { AuthStore, type AuthUser } from './auth.store';
import { firstValueFrom } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly api = inject(AuthApi);
  private readonly store = inject(AuthStore);
  private readonly router = inject(Router);

  async login(email: string, password: string) {
    const result = await firstValueFrom(this.api.loginStep1(email, password));
    return this.handleLoginStep1(result);
  }

  private async handleLoginStep1(result: LoginStep1Result) {
    if (result.requires_otp) {
      this.store.clearSession(); // Ensure no stale auth
      this.store.setPendingOtpUserId(result.user_id);
      await this.router.navigateByUrl('/auth/verify-otp');
      return { requiresOtp: true };
    }

    const token = result.token;
    const user = result.user as AuthUser;
    this.store.setSession(token, user);
    await this.router.navigateByUrl('/dashboard');
    return { requiresOtp: false };
  }

  async verifyOtp(otp_code: string) {
    const user_id = this.store.pendingOtpUserId();
    if (!user_id) throw new Error('Missing pending OTP user_id');

    const result = await firstValueFrom(this.api.verifyOtp(user_id, otp_code));
    this.store.setSession(result.token, result.user as AuthUser);
    await this.router.navigateByUrl('/dashboard');
  }

  async updatePassword(old_password: string, new_password: string) {
    const updatedUser = (await firstValueFrom(this.api.updatePassword(old_password, new_password))) as AuthUser;
    // Token remains valid; backend already invalidates first-login policy.
    this.store.setUserOnly(updatedUser);
    await this.router.navigateByUrl('/dashboard');
  }

  async bootstrapMeIfNeeded() {
    const token = this.store.token();
    if (!token || this.store.user()) return;

    const user = (await firstValueFrom(this.api.getMe())) as AuthUser;
    this.store.setUserOnly(user);
  }

  // Convenience methods for components
  isLoggedIn(): boolean {
    return this.store.isAuthenticated();
  }

  getRole(): string | null {
    return this.store.role();
  }

  getUser(): AuthUser | null {
    return this.store.user();
  }

  hasRole(roles: string[]): boolean {
    const currentRole = this.store.role();
    if (!currentRole) return false;
    return roles.map(r => r.toLowerCase()).includes(currentRole);
  }

  getToken(): string | null {
    return this.store.token();
  }

  logout(): void {
    this.store.logoutAndRedirect();
  }
}

