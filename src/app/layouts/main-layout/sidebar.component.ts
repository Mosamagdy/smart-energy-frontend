import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { AuthStore } from '../../core/auth/auth.store';
import { I18nService } from '../../core/i18n/i18n.service';
import { SidebarLayoutService } from './sidebar-layout.service';

interface NavItem {
  label: string;
  route: string;
  icon: string;
  roles: string[];
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, TranslateModule],
  template: `
    <aside
      class="fixed top-0 z-50 flex h-screen w-70 flex-col shadow-2xl transition-transform duration-300 ease-in-out"
      [class.rtl-flip]="i18n.dir() === 'rtl'"
      [class.right-0]="i18n.dir() === 'rtl'"
      [class.left-0]="i18n.dir() === 'ltr'"
      [class.translate-x-full]="i18n.dir() === 'rtl' && !layout.isSidebarOpen()"
      [class.-translate-x-full]="i18n.dir() === 'ltr' && !layout.isSidebarOpen()"
      [style.background]="'linear-gradient(180deg, #0c0725 0%, #1a0f3d 100%)'">
      
      <!-- Logo Section -->
      <div class="p-6 border-b border-white/10">
        <div class="flex items-center gap-3">
          <img 
            src="/img/logo.jpeg" 
            alt="Smart Energy ERP Logo"
            class="h-12 w-12 rounded-xl object-cover shadow-lg shrink-0"
          />
          <div class="overflow-hidden">
            <h1 class="text-white font-bold text-lg leading-tight">{{ 'sidebar.title' | translate }}</h1>
            <p class="text-white/50 text-xs mt-1">ERP System</p>
          </div>
        </div>
      </div>

      <!-- Navigation Links -->
      <nav class="flex-1 overflow-y-auto py-4 px-3 space-y-2">
        @for (item of navItems(); track item.route) {
          <a
            [routerLink]="item.route"
            routerLinkActive="active-link"
            [routerLinkActiveOptions]="{ exact: item.route === '/dashboard' }"
            class="nav-link flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group"
            [title]="item.label | translate"
            (click)="onNavClick()">
            
            <!-- Icon -->
            <div class="shrink-0 w-6 h-6 flex items-center justify-center">
              <i [class]="item.icon + ' text-xl'"></i>
            </div>
            
            <!-- Label -->
            <span class="font-medium">{{ item.label | translate }}</span>
            
            <!-- Active Indicator -->
            <div class="active-indicator"></div>
          </a>
        }
      </nav>

      <!-- User Profile Section -->
      <div class="p-4 border-t border-white/10">
        <div class="flex items-center gap-3 p-3 rounded-xl bg-white/5">
            <div class="w-10 h-10 rounded-full bg-gradient-to-br from-[#2cdc78] to-[#2cdc78]/70 flex items-center justify-center text-[#0c0725] font-bold text-lg shrink-0">
              {{ getUserInitial() }}
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-white font-semibold text-sm truncate">{{ getUserName() }}</p>
              <p class="text-white/50 text-xs truncate">{{ getUserRole() | translate }}</p>
            </div>
          </div>
          
          <!-- Logout Button -->
          <button
            (click)="logout()"
            class="w-full mt-3 mb-2 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 hover:bg-red-500/20 text-white hover:text-red-400 transition-all duration-200">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
            </svg>
            <span class="font-medium text-sm">{{ 'app.logout' | translate }}</span>
          </button>

        <button
          type="button"
          (click)="onSidebarClose()"
          class="flex w-full items-center justify-center gap-2 rounded-xl bg-white/5 px-4 py-2.5 text-white/70 transition-all duration-300 ease-in-out hover:bg-white/10 hover:text-white"
          [attr.aria-label]="'sidebar.collapse' | translate">
          <svg
            class="h-5 w-5 transition-transform duration-300 ease-in-out"
            [class.rotate-180]="i18n.dir() === 'rtl'"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 19l-7-7 7-7m8 14l-7-7 7-7"/>
          </svg>
          <span class="text-sm font-medium">{{ 'sidebar.collapse' | translate }}</span>
        </button>
      </div>
    </aside>
  `,
  styles: [`
    .nav-link {
      color: rgba(255, 255, 255, 0.7);
      position: relative;
      overflow: hidden;
    }

    .nav-link:hover {
      color: #2cdc78;
      background: rgba(44, 220, 120, 0.1);
      transform: translateX(4px);
    }

    .rtl-flip .nav-link:hover {
      transform: translateX(-4px);
    }

    .nav-link.active-link {
      color: #2cdc78;
      background: rgba(44, 220, 120, 0.15);
      font-weight: 600;
    }

    .active-indicator {
      position: absolute;
      top: 50%;
      transform: translateY(-50%);
      width: 3px;
      height: 0;
      background: #2cdc78;
      border-radius: 2px;
      transition: height 0.2s ease;
    }

    .rtl-flip .active-indicator {
      left: 0;
      right: auto;
    }

    .nav-link.active-link .active-indicator {
      height: 60%;
    }

    .rtl-flip .nav-link.active-link .active-indicator {
      right: 0;
      left: auto;
    }

    nav::-webkit-scrollbar {
      width: 4px;
    }

    nav::-webkit-scrollbar-track {
      background: rgba(255, 255, 255, 0.05);
    }

    nav::-webkit-scrollbar-thumb {
      background: rgba(44, 220, 120, 0.3);
      border-radius: 2px;
    }

    nav::-webkit-scrollbar-thumb:hover {
      background: rgba(44, 220, 120, 0.5);
    }
  `]
})
export class SidebarComponent {
  private auth = inject(AuthStore);
  private router = inject(Router);
  readonly i18n = inject(I18nService);
  readonly layout = inject(SidebarLayoutService);

  // Navigation items with role-based access
  navItems = computed<NavItem[]>(() => {
    const items: NavItem[] = [
      {
        label: 'sidebar.pmoDashboard',
        route: '/dashboard/pmo',
        icon: 'fas fa-chart-line',
        roles: ['super_admin', 'general_manager', 'dept_head']
      },
      {
        label: 'sidebar.leads',
        route: '/leads',
        icon: 'fas fa-user-plus',
        // CRM roles only (no technical heads)
        roles: ['super_admin', 'general_manager', 'sales_rep', 'sales_manager' , 'tech_head']
      },
      // Dep PR Manager: dedicated Projects Dashboard (no Leads)
      {
        label: 'dashboard.projects',
        route: '/dashboard/dep-pr',
        icon: 'fas fa-chart-line',
        roles: ['dep_pr_manager']
      },
      {
        label: 'sidebar.departments',
        route: '/departments',
        icon: 'fas fa-building',
        roles: ['super_admin', 'general_manager']
      },
      {
        label: 'sidebar.projects',
        route: '/projects',
        icon: 'fas fa-project-diagram',
        roles: [
          'super_admin',
          'general_manager',
          'project_manager',
          'dep_pr_manager',
          'tech_head',
          'mc_manager',
          'qs_manager',
          'engineer',
          'contract_dept_head',
          // Sales manager: read-only access
          'sales_manager',
        ]
      },
      // ✅ TASK 1: My Tasks - Engineer only
      {
        label: 'sidebar.myTasks',
        route: '/dashboard/my-tasks',
        icon: 'fas fa-list-check',
        roles: ['engineer']
      },
      {
        label: 'sidebar.quotations',
        route: '/quotations',
        icon: 'fas fa-file-invoice-dollar',
        roles: ['super_admin', 'general_manager', 'finance_manager', 'quotation_specialist']
      },
      {
        label: 'sidebar.quotationTasks',
        route: '/quotations/tasks',
        icon: 'fas fa-tasks',
        roles: ['super_admin', 'general_manager', 'quotation_specialist']
      },
      {
        label: 'sidebar.employees',
        route: '/hr/employees',
        icon: 'fas fa-users',
        roles: ['super_admin', 'general_manager', 'hr_manager']
      },
      // ✅ HR MANAGEMENT MODULE
      {
        label: 'hr.attendance',
        route: '/hr/attendance',
        icon: 'fas fa-calendar-check',
        roles: ['super_admin', 'hr_manager', 'labor', 'technicians', 'engineer', 'employee', 'sales_rep']
      },
      {
        label: 'hr.payroll',
        route: '/hr/payroll',
        icon: 'fas fa-money-check-alt',
        roles: ['super_admin', 'general_manager', 'hr_manager', 'finance_manager']
      },
      // {
      //   label: 'hr.leaveManagement',
      //   route: '/hr/leave-management',
      //   icon: 'fas fa-umbrella-beach',
      //   roles: ['super_admin', 'hr_manager']
      // },
      {
        label: 'hr.leaveRequests',
        route: '/hr/leaves',
        icon: 'fas fa-umbrella-beach',
        roles: ['dept_head', 'engineer', 'sales_rep', 'employee' , 'hr_manager']
      },
      {
        label: 'hr.employeesOnLeave',
        route: '/hr/employees-on-leave',
        icon: 'fas fa-user-clock',
        roles: ['super_admin', 'general_manager', 'hr_manager']
      },
      // ✅ Suppliers Management - Procurement & Finance
      {
        label: 'sidebar.suppliers',
        route: '/suppliers',
        icon: 'fas fa-truck-loading',
        roles: ['super_admin', 'general_manager', 'finance_manager', 'purchase_manager', 'procurement_manager']
      },
      {
        label: 'procurement.pendingApprovals',
        route: '/procurement/pending-approvals',
        icon: 'fas fa-clock',
        // ✅ FIX 3: Add finance_manager to pending approvals visibility
        roles: ['super_admin', 'general_manager', 'procurement_manager', 'finance_manager']
      },
      {
        label: 'procurement.purchaseInvoices',
        route: '/finance/purchase-invoices',
        icon: 'fas fa-file-invoice-dollar',
        roles: ['super_admin', 'general_manager', 'procurement_manager', 'finance_manager']
      },
      // {
      //   label: 'procurement.createPurchaseInvoice',
      //   route: '/procurement/invoices/create',
      //   icon: 'fas fa-plus-circle',
      //   roles: ['super_admin', 'general_manager', 'procurement_manager', 'finance_manager']
      // },
      // ✅ WAREHOUSE MANAGEMENT - Inventory & Stock Control
      {
        label: 'sidebar.warehouses',
        route: '/inventory/warehouses',
        icon: 'fas fa-warehouse',
        roles: ['super_admin', 'general_manager', 'finance_manager', 'warehouse_manager', 'inventory_manager']
      },
      // ✅ GENERAL INVENTORY - Real-time Stock Dashboard
      {
        label: 'sidebar.generalInventory',
        route: '/inventory/dashboard',
        icon: 'fas fa-boxes',
        // dep_pr_manager: read-only inventory view (no add item/quantity)
        roles: ['super_admin', 'general_manager', 'finance_manager', 'project_manager', 'dep_pr_manager', 'warehouse_manager', 'inventory_manager']
      },
      // Dep PR Manager: employees in own department only
      // {
      //   label: 'hr.myDeptStaff',
      //   route: '/hr/my-dept-staff',
      //   icon: 'fas fa-users',
      //   roles: ['dep_pr_manager']
      // },
      // Tech Head: employees in own department only
      {
        label: 'hr.myTeam',
        route: '/hr/my-team',
        icon: 'fas fa-users-cog',
        roles: ['tech_head']
      },
      {
        label: 'paymentVouchers.title',
        route: '/finance/payment-vouchers',
        icon: 'fas fa-money-bill-wave',
        roles: ['super_admin', 'general_manager', 'finance_manager']
      },
      {
        label: 'supplierStatement.title',
        route: '/finance/suppliers/statements',
        icon: 'fas fa-file-alt',
        roles: ['super_admin', 'general_manager', 'finance_manager']
      },
      {
        label: 'expenseVouchers.title',
        route: '/finance/expenses',
        icon: 'fas fa-receipt',
        roles: ['super_admin', 'general_manager', 'finance_manager']
      },
      // ✅ PETTY CASH MODULE - Funds & Expense Vouchers
      {
        label: 'sidebar.pettyCashFunds',
        route: '/finance/petty-cash/funds',
        icon: 'fas fa-wallet',
        roles: ['super_admin', 'general_manager', 'finance_manager']
      },
      {
        label: 'sidebar.pettyCashExpense',
        route: '/finance/petty-cash/expense',
        icon: 'fas fa-file-invoice',
        roles: ['super_admin', 'general_manager', 'finance_manager']
      },
      {
        label: 'sidebar.pettyCashExpensesList',
        route: '/finance/petty-cash/expenses-list',
        icon: 'fas fa-list-alt',
        roles: ['super_admin', 'general_manager', 'finance_manager']
      },
      // ✅ TREASURY MODULE - Cash & Bank Management
      {
        label: 'sidebar.treasuryDashboard',
        route: '/finance/treasury/dashboard',
        icon: 'fas fa-vault',
        roles: ['super_admin', 'general_manager', 'finance_manager']
      },
      {
        label: 'sidebar.receiptVouchers',
        route: '/finance/receipt-vouchers',
        icon: 'fas fa-hand-holding-usd',
        roles: ['super_admin', 'general_manager', 'finance_manager']
      },
      // ✅ FINANCIAL REPORTS - Trial Balance, General Ledger & Profit/Loss
      {
        label: 'sidebar.trialBalance',
        route: '/finance/reports/trial-balance',
        icon: 'fas fa-balance-scale',
        roles: ['super_admin', 'general_manager', 'finance_manager']
      },
      {
        label: 'sidebar.profitLoss',
        route: '/finance/reports/profit-loss',
        icon: 'fas fa-chart-line',
        roles: ['super_admin', 'general_manager', 'finance_manager']
      },
      {
        label: 'sidebar.projectProfitability',
        route: '/finance/project-profitability',
        icon: 'fas fa-chart-pie',
        roles: ['super_admin', 'general_manager', 'finance_manager']
      },
      // ✅ PHASE 9: SALES MODULE - Won Leads & Sales Invoices
      {
        label: 'sidebar.wonLeads',
        route: '/sales/won-leads',
        icon: 'fas fa-handshake',
        roles: ['super_admin', 'general_manager', 'finance_manager']
      },
      {
        label: 'sidebar.salesInvoices',
        route: '/sales/invoices',
        icon: 'fas fa-file-invoice-dollar',
        roles: ['super_admin', 'general_manager', 'finance_manager']
      },
      {
        label: 'sidebar.creditNotesList',
        route: '/sales/credit-notes',
        icon: 'fas fa-undo-alt',
        roles: ['super_admin', 'general_manager', 'finance_manager']
      },
      {
        label: 'sidebar.taxInvoices',
        route: '/sales/tax-invoices',
        icon: 'fas fa-file-invoice',
        roles: ['super_admin', 'general_manager', 'finance_manager']
      },
      // ✅ FIXED ASSETS - Depreciation Engine
      {
        label: 'sidebar.fixedAssets',
        route: '/maintenance/assets',
        icon: 'fas fa-building',
        roles: ['super_admin', 'general_manager', 'finance_manager']
      },
      // Client Portal Navigation (Only for 'client' role)
      {
        label: 'client.quotations',
        route: '/client/quotations',
        icon: 'fas fa-file-alt',
        roles: ['client']
      },
      {
        label: 'client.projects',
        route: '/client/projects',
        icon: 'fas fa-project-diagram',
        roles: ['client']
      },
      {
        label: 'client.invoices',
        route: '/client/invoices',
        icon: 'fas fa-file-invoice',
        roles: ['client']
      },
      {
        label: 'client.maintenance',
        route: '/client/maintenance',
        icon: 'fas fa-tools',
        roles: ['client']
      },
      {
        label: 'client.messages',
        route: '/client/messages',
        icon: 'fas fa-comments',
        roles: ['client']
      },
      {
        label: 'client.ratings',
        route: '/client/ratings',
        icon: 'fas fa-star',
        roles: ['client']
      },
      {
        label: 'client.profile',
        route: '/client/profile',
        icon: 'fas fa-user-circle',
        roles: ['client']
      }
    ];

    const userRole = this.auth.role();
    if (!userRole) return [];

    const normalizedRole = userRole.toLowerCase();

    // Strict sidebar for inventory + warehouse managers
    if (normalizedRole === 'warehouse_manager' || normalizedRole === 'inventory_manager') {
      return items.filter(item =>
        ['/inventory/warehouses', '/inventory/dashboard'].includes(item.route)
      );
    }

    // Filter by user role
    return items.filter(item => 
      item.roles.map(r => r.toLowerCase()).includes(normalizedRole)
    );
  });

  onSidebarClose(): void {
    if (this.layout.isMobile()) {
      this.layout.closeMobile();
      return;
    }
    this.layout.close();
  }

  onNavClick(): void {
    if (this.layout.isMobile()) {
      this.layout.closeMobile();
    }
  }

  logout(): void {
    void this.auth.logoutAndRedirect();
  }

  getUserName(): string {
    return this.auth.user()?.first_name + ' ' + this.auth.user()?.last_name;
  }

  getUserInitial(): string {
    const firstName = this.auth.user()?.first_name || '';
    return firstName.charAt(0).toUpperCase();
  }

  getUserRole(): string {
    const role = this.auth.role();
    if (!role) return '';
    
    const roleMap: Record<string, string> = {
      'super_admin': 'مدير النظام',
      'general_manager': 'المدير العام',
      'hr_manager': 'مدير الموارد البشرية',
      'finance_manager': 'المدير المالي',
      'project_manager': 'مدير المشاريع',
      'dept_head': 'رئيس الإدارة',
      'sales_rep': 'مندوب المبيعات',
      'engineer': 'المهندس',
      'quotation_specialist': 'أخصائي العروض',
      'warehouse_manager': 'مدير المستودع',
      'inventory_manager': 'مدير المخزون',
      'procurement_manager': 'مدير المشتريات',
      'contract_dept_head': 'مسؤول العقود',
      'client': 'عميل'
    };
    
    return roleMap[role.toLowerCase()] || role;
  }
}