import { Component, effect, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthStore } from '../../../core/auth/auth.store';

const ROLE_TO_PATH: Record<string, string> = {
  super_admin: '/dashboard/gm',
  general_manager: '/dashboard/gm',
  hr_manager: '/dashboard/hr',
  finance_manager: '/dashboard/finance',
  project_manager: '/dashboard/projects',
  warehouse_manager: '/dashboard/projects',
  inventory_manager: '/dashboard/inventory',
  procurement_manager: '/dashboard/projects',
  sales_rep: '/dashboard/sales',
  quotation_specialist: '/dashboard/sales',
  engineer: '/dashboard/engineer',
  dept_head: '/dashboard/dept',
  dep_pr_manager: '/dashboard/dep-pr',
  tech_head: '/dashboard/technical',
  mc_manager: '/dashboard/technical',
  qs_manager: '/dashboard/technical',
  // Sales manager lands on primary leads overview (CRM)
  sales_manager: '/leads',
  contract_dept_head: '/projects', // ✅ Contract dept head goes directly to projects
  client: '/dashboard/client',
};

@Component({
  selector: 'app-dashboard-redirect',
  standalone: true,
  template: ``
})
export class DashboardRedirectComponent {
  private readonly router = inject(Router);
  private readonly auth = inject(AuthStore);
  private navigated = false;

  constructor() {
    effect(() => {
      const role = this.auth.role();
      if (!role || this.navigated) return;

      this.navigated = true;
      // Fallback to /projects so unknown roles don't hit a locked dashboard
      const target = ROLE_TO_PATH[role] ?? '/projects';
      void this.router.navigateByUrl(target);
    });
  }
}

