import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';

type JwtToken = string;

export type RoleName =
  | 'super_admin'
  | 'general_manager'
  | 'hr_manager'
  | 'finance_manager'
  | 'project_manager'
  | 'dept_head'
  | 'sales_rep'
  | 'sales_manager'
  | 'engineer'
  | 'quotation_specialist'
  | 'procurement_manager'
  | 'warehouse_manager'
  | 'inventory_manager'
  | 'contract_dept_head'
  | 'dep_pr_manager'
  | 'tech_head'
  | 'mc_manager'
  | 'qs_manager'
  | 'employee'
  | 'labor'
  | 'technicians'
  | 'client';

export interface AuthUser {
  id: number | string;
  email?: string;
  first_name?: string;
  last_name?: string;
  role?: RoleName | string;
  role_name?: RoleName | string;
  roleName?: RoleName | string;
  department_id?: number;
  dept_type?: 'technical' | 'administrative' | null;  // NEW: Department type
}

const TOKEN_STORAGE_KEY = 'erp.jwt';
const USER_STORAGE_KEY = 'erp.user';

@Injectable({ providedIn: 'root' })
export class AuthStore {
  private readonly router = inject(Router);

  readonly token = signal<JwtToken | null>(null);
  readonly user = signal<AuthUser | null>(null);
  readonly isBootstrapped = signal(false);

  readonly firstLoginRequired = signal(false);

  readonly pendingOtpUserId = signal<number | string | null>(null);

  readonly role = computed(() => {
    const u = this.user();
    const r = u?.role ?? u?.role_name ?? u?.roleName;
    return typeof r === 'string' ? r.toLowerCase() : null;
  });

  readonly isAuthenticated = computed(() => Boolean(this.token()));

  bootstrapFromStorage() {
    const token = localStorage.getItem(TOKEN_STORAGE_KEY);
    const userStr = localStorage.getItem(USER_STORAGE_KEY);
    
    if (token) {
      this.token.set(token);
      
      // Restore user info if available
      if (userStr) {
        try {
          const user = JSON.parse(userStr) as AuthUser;
          this.user.set(user);
        } catch (e) {
          console.error('Failed to parse stored user:', e);
        }
      }
    }
    
    this.isBootstrapped.set(true);
  }

  setSession(token: JwtToken, user?: AuthUser | null) {
    localStorage.setItem(TOKEN_STORAGE_KEY, token);
    this.token.set(token);
    if (user !== undefined) {
      this.user.set(user);
      // Persist user to localStorage
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
    }
    this.pendingOtpUserId.set(null);
    this.firstLoginRequired.set(false);
  }

  setUserOnly(user: AuthUser | null) {
    this.user.set(user);
    // Update localStorage
    if (user) {
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(USER_STORAGE_KEY);
    }
    this.firstLoginRequired.set(false);
  }

  setPendingOtpUserId(user_id: number | string) {
    this.pendingOtpUserId.set(user_id);
    this.firstLoginRequired.set(false);
  }

  clearSession() {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    localStorage.removeItem(USER_STORAGE_KEY);
    this.token.set(null);
    this.user.set(null);
    this.pendingOtpUserId.set(null);
    this.firstLoginRequired.set(false);
  }

  async logoutAndRedirect() {
    this.clearSession();
    await this.router.navigateByUrl('/auth/login');
  }
}

