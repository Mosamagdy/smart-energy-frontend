import { Routes } from '@angular/router';
import { MainLayoutComponent } from './layouts/main-layout/main-layout.component';
import { AuthLayoutComponent } from './layouts/auth-layout/auth-layout.component';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';

const ROLES = {
  SUPER_ADMIN: 'super_admin',
  GENERAL_MANAGER: 'general_manager',
  HR_MANAGER: 'hr_manager',
  FINANCE_MANAGER: 'finance_manager',
  PROJECT_MANAGER: 'project_manager',
  DEPT_HEAD: 'dept_head',
  SALES_REP: 'sales_rep',
  ENGINEER: 'engineer',
  QUOTATION_SPECIALIST: 'quotation_specialist',
  WAREHOUSE_MANAGER: 'warehouse_manager',
  PROCUREMENT_MANAGER: 'procurement_manager',
  CONTRACT_DEPT_HEAD: 'contract_dept_head',
  CLIENT: 'client',
  EMPLOYEE: 'employee',
  // ✅ الجديدة
  SALES_MANAGER: 'sales_manager',
  DEP_PR_MANAGER: 'dep_pr_manager',
  MC_MANAGER: 'mc_manager',
  QS_MANAGER: 'qs_manager',
  TECH_HEAD: 'tech_head',
  INVENTORY_MANAGER: 'inventory_manager',
  LABOR: 'labor',
  TECHNICIANS: 'technicians',
} as const;

export const routes: Routes = [
  {
    path: 'auth',
    component: AuthLayoutComponent,
    children: [
      {
        path: 'login',
        loadComponent: () => import('./features/auth/login/login.component').then(m => m.LoginComponent)
      },
      {
        path: 'verify-otp',
        loadComponent: () => import('./features/auth/verify-otp/verify-otp.component').then(m => m.VerifyOtpComponent)
      },
      {
        path: 'update-password',
        loadComponent: () =>
          import('./features/auth/update-password/update-password.component').then(m => m.UpdatePasswordComponent)
      },
      { path: '', redirectTo: 'login', pathMatch: 'full' }
    ]
  },
  {
    path: '',
    component: MainLayoutComponent,
    canActivate: [authGuard],
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      },
      {
        path: 'dashboard',
        loadComponent: () => import('./features/dashboard/dashboard-redirect/dashboard-redirect.component').then(m => m.DashboardRedirectComponent)
      },

      // ============================================
      // DASHBOARDS
      // ============================================

      // GM Dashboard
      {
        path: 'dashboard/gm',
        canActivate: [roleGuard([ROLES.SUPER_ADMIN, ROLES.GENERAL_MANAGER])],
        loadComponent: () =>
          import('./features/dashboard/role-dashboard/role-dashboard.component').then(m => m.RoleDashboardComponent),
        data: { titleKey: 'dashboard.gm' }
      },

      // HR Dashboard
      {
        path: 'dashboard/hr',
        canActivate: [roleGuard([ROLES.HR_MANAGER])],
        loadComponent: () =>
          import('./features/dashboard/role-dashboard/role-dashboard.component').then(m => m.RoleDashboardComponent),
        data: { titleKey: 'dashboard.hr' }
      },

      // Finance Dashboard
      {
        path: 'dashboard/finance',
        canActivate: [roleGuard([ROLES.FINANCE_MANAGER])],
        loadComponent: () =>
          import('./features/dashboard/role-dashboard/role-dashboard.component').then(m => m.RoleDashboardComponent),
        data: { titleKey: 'dashboard.finance' }
      },

      // Projects Dashboard
      {
        path: 'dashboard/projects',
        canActivate: [roleGuard([ROLES.PROJECT_MANAGER, ROLES.WAREHOUSE_MANAGER, ROLES.PROCUREMENT_MANAGER])],
        loadComponent: () =>
          import('./features/dashboard/role-dashboard/role-dashboard.component').then(m => m.RoleDashboardComponent),
        data: { titleKey: 'dashboard.projects' }
      },

      // PMO Head Dashboard
      {
        path: 'dashboard/pmo',
        canActivate: [roleGuard([ROLES.DEPT_HEAD, ROLES.GENERAL_MANAGER])],
        loadComponent: () =>
          import('./features/dashboard/pmo-dashboard/pmo-dashboard.component').then(m => m.PmoDashboardComponent),
        data: { titleKey: 'projects.pmoDashboard' }
      },

      // Sales Dashboard (old roles)
      {
        path: 'dashboard/sales',
        canActivate: [roleGuard([ROLES.SALES_REP, ROLES.QUOTATION_SPECIALIST])],
        loadComponent: () =>
          import('./features/dashboard/employee-dashboard/employee-dashboard.component').then(m => m.EmployeeDashboardComponent),
        data: { titleKey: 'dashboard.sales' }
      },

      // Engineer Dashboard
      {
        path: 'dashboard/engineer',
        canActivate: [roleGuard([ROLES.ENGINEER])],
        loadComponent: () =>
          import('./features/dashboard/employee-dashboard/employee-dashboard.component').then(m => m.EmployeeDashboardComponent),
        data: { titleKey: 'dashboard.engineer' }
      },

      // Dept Head Dashboard
      {
        path: 'dashboard/dept',
        canActivate: [roleGuard([ROLES.DEP_PR_MANAGER])],
        loadComponent: () =>
          import('./features/dashboard/role-dashboard/role-dashboard.component').then(m => m.RoleDashboardComponent),
        data: { titleKey: 'dashboard.dept' }
      },

      // Client Dashboard
      {
        path: 'dashboard/client',
        canActivate: [roleGuard([ROLES.CLIENT])],
        loadComponent: () =>
          import('./features/dashboard/role-dashboard/role-dashboard.component').then(m => m.RoleDashboardComponent),
        data: { titleKey: 'dashboard.client' }
      },

      // ✅ Sales Manager Dashboard
      {
        path: 'dashboard/sales-manager',
        canActivate: [roleGuard([ROLES.SALES_MANAGER])],
        loadComponent: () =>
          import('./features/dashboard/role-dashboard/role-dashboard.component').then(m => m.RoleDashboardComponent),
        data: { titleKey: 'dashboard.sales' }
      },

      // ✅ Dep PR Manager Dashboard
      {
        path: 'dashboard/dep-pr',
        canActivate: [roleGuard([ROLES.DEP_PR_MANAGER])],
        loadComponent: () =>
          import('./features/dashboard/pmo-dashboard/pmo-dashboard.component').then(m => m.PmoDashboardComponent),
        data: { titleKey: 'dashboard.projects' }
      },

      // ✅ Technical Roles Dashboard (MC Manager, QS Manager, Tech Head)
      {
        path: 'dashboard/technical',
        canActivate: [roleGuard([ROLES.MC_MANAGER, ROLES.QS_MANAGER, ROLES.TECH_HEAD])],
        loadComponent: () =>
          import('./features/dashboard/role-dashboard/role-dashboard.component').then(m => m.RoleDashboardComponent),
        data: { titleKey: 'dashboard.projects' }
      },

      // ✅ Inventory Manager Dashboard
      {
        path: 'dashboard/inventory',
        canActivate: [roleGuard([ROLES.INVENTORY_MANAGER, ROLES.WAREHOUSE_MANAGER])],
        loadComponent: () =>
          import('./features/inventory/inventory-dashboard/inventory-dashboard.component').then(m => m.InventoryDashboardComponent),
        data: { titleKey: 'inventory.generalInventory' }
      },

      // ✅ My Tasks (Engineer + Labor + Technicians)
      {
        path: 'dashboard/my-tasks',
        canActivate: [roleGuard([ROLES.ENGINEER, ROLES.LABOR, ROLES.TECHNICIANS])],
        loadComponent: () =>
          import('./features/projects/my-tasks/my-tasks.component').then(m => m.MyTasksComponent),
        data: { titleKey: 'sidebar.myTasks' }
      },

      // ============================================
      // CLIENT PORTAL
      // ============================================
      {
        path: 'client/quotations',
        canActivate: [roleGuard([ROLES.CLIENT])],
        loadComponent: () =>
          import('./features/client-portal/client-quotations/client-quotations.component').then(m => m.ClientQuotationsComponent),
        data: { titleKey: 'client.quotations' }
      },
      {
        path: 'client/projects',
        canActivate: [roleGuard([ROLES.CLIENT])],
        loadComponent: () =>
          import('./features/client-portal/client-projects/client-projects.component').then(m => m.ClientProjectsComponent),
        data: { titleKey: 'client.projects' }
      },
      {
        path: 'client/projects/:id',
        canActivate: [roleGuard([ROLES.CLIENT])],
        loadComponent: () =>
          import('./features/client-portal/client-project-details/client-project-details.component').then(m => m.ClientProjectDetailsComponent),
        data: { titleKey: 'client.projectDetails' }
      },
      {
        path: 'client/invoices',
        canActivate: [roleGuard([ROLES.CLIENT])],
        loadComponent: () =>
          import('./features/client-portal/client-invoices/client-invoices.component').then(m => m.ClientInvoicesComponent),
        data: { titleKey: 'client.invoices' }
      },
      {
        path: 'client/invoices/:id',
        canActivate: [roleGuard([ROLES.CLIENT])],
        loadComponent: () =>
          import('./features/client-portal/client-invoice-details/client-invoice-details.component').then(m => m.ClientInvoiceDetailsComponent),
        data: { titleKey: 'client.invoiceDetails' }
      },
      {
        path: 'client/maintenance',
        canActivate: [roleGuard([ROLES.CLIENT])],
        loadComponent: () =>
          import('./features/client-portal/client-maintenance/client-maintenance.component').then(m => m.ClientMaintenanceComponent),
        data: { titleKey: 'client.maintenance' }
      },
      {
        path: 'client/messages',
        canActivate: [roleGuard([ROLES.CLIENT])],
        loadComponent: () =>
          import('./features/client-portal/client-messages/client-messages.component').then(m => m.ClientMessagesComponent),
        data: { titleKey: 'client.messages' }
      },
      {
        path: 'client/ratings',
        canActivate: [roleGuard([ROLES.CLIENT])],
        loadComponent: () =>
          import('./features/client-portal/client-ratings/client-ratings.component').then(m => m.ClientRatingsComponent),
        data: { titleKey: 'client.ratings' }
      },
      {
        path: 'client/profile',
        canActivate: [roleGuard([ROLES.CLIENT])],
        loadComponent: () =>
          import('./features/client-portal/client-profile/client-profile.component').then(m => m.ClientProfileComponent),
        data: { titleKey: 'client.profile' }
      },

      // ============================================
      // DEPARTMENTS (Super Admin & GM Only)
      // ============================================
      {
        path: 'departments',
        canActivate: [roleGuard([ROLES.SUPER_ADMIN, ROLES.GENERAL_MANAGER])],
        loadComponent: () =>
          import('./features/departments/departments-list/departments-list.component').then(m => m.DepartmentsListComponent),
        data: { titleKey: 'sidebar.departments' }
      },
      {
        path: 'departments/:id',
        canActivate: [roleGuard([ROLES.SUPER_ADMIN, ROLES.GENERAL_MANAGER])],
        loadComponent: () =>
          import('./features/departments/department-details/department-details.component').then(m => m.DepartmentDetailsComponent),
        data: { titleKey: 'departments.departmentDetails' }
      },

      // ============================================
      // EMPLOYEES
      // ============================================
      {
        path: 'employees/:id',
        canActivate: [roleGuard([ROLES.SUPER_ADMIN, ROLES.GENERAL_MANAGER, ROLES.HR_MANAGER])],
        loadComponent: () =>
          import('./features/employees/employee-details/employee-details.component').then(m => m.EmployeeDetailsComponent),
        data: { titleKey: 'employees.employeeDetails' }
      },

      // ============================================
      // HR MODULE
      // ============================================
      {
        path: 'hr/employees',
        canActivate: [roleGuard([ROLES.SUPER_ADMIN, ROLES.GENERAL_MANAGER, ROLES.HR_MANAGER])],
        loadComponent: () =>
          import('./features/hr/employee-list/employee-list.component').then(m => m.EmployeeListComponent),
        data: { titleKey: 'hr.employees' }
      },
      {
        path: 'hr/employees/create',
        canActivate: [roleGuard([ROLES.SUPER_ADMIN, ROLES.GENERAL_MANAGER, ROLES.HR_MANAGER])],
        loadComponent: () =>
          import('./features/hr/employee-form/employee-form.component').then(m => m.EmployeeFormComponent),
        data: { titleKey: 'hr.addEmployee' }
      },
      {
        path: 'hr/employees/:id/edit',
        canActivate: [roleGuard([ROLES.SUPER_ADMIN, ROLES.GENERAL_MANAGER, ROLES.HR_MANAGER])],
        loadComponent: () =>
          import('./features/hr/employee-form/employee-form.component').then(m => m.EmployeeFormComponent),
        data: { titleKey: 'hr.editEmployee' }
      },
      {
        path: 'hr/employees/:id/detail',
        canActivate: [roleGuard([ROLES.SUPER_ADMIN, ROLES.GENERAL_MANAGER, ROLES.HR_MANAGER, ROLES.DEPT_HEAD])],
        loadComponent: () =>
          import('./features/hr/employee-detail/employee-detail.component').then(m => m.EmployeeDetailComponent),
        data: { titleKey: 'hr.employeeDetails' }
      },
      {
        path: 'hr/employees/:id',
        canActivate: [roleGuard([ROLES.SUPER_ADMIN, ROLES.GENERAL_MANAGER, ROLES.HR_MANAGER, ROLES.DEPT_HEAD])],
        loadComponent: () =>
          import('./features/employees/employee-details/employee-details.component').then(m => m.EmployeeDetailsComponent),
        data: { titleKey: 'employees.employeeDetails' }
      },
      {
        path: 'hr/attendance',
        canActivate: [roleGuard([ROLES.SUPER_ADMIN, ROLES.HR_MANAGER, ROLES.ENGINEER, ROLES.EMPLOYEE, ROLES.SALES_REP, ROLES.LABOR, ROLES.TECHNICIANS])],
        loadComponent: () =>
          import('./features/hr/attendance/attendance.component').then(m => m.AttendanceComponent),
        data: { titleKey: 'hr.attendance' }
      },
      {
        path: 'hr/payroll',
        canActivate: [roleGuard([ROLES.SUPER_ADMIN, ROLES.GENERAL_MANAGER, ROLES.HR_MANAGER, ROLES.FINANCE_MANAGER])],
        loadComponent: () =>
          import('./features/hr/payroll/payroll.component').then(m => m.PayrollComponent),
        data: { titleKey: 'hr.payroll' }
      },
      {
        path: 'hr/leaves',
        canActivate: [roleGuard([ROLES.SUPER_ADMIN, ROLES.GENERAL_MANAGER, ROLES.DEPT_HEAD, ROLES.ENGINEER, ROLES.SALES_REP, ROLES.EMPLOYEE, ROLES.LABOR, ROLES.TECHNICIANS , ROLES.HR_MANAGER])],
        loadComponent: () =>
          import('./features/hr/leave/leave.component').then(m => m.LeaveComponent),
        data: { titleKey: 'hr.leaves' }
      },
      // {
      //   path: 'hr/leave-management',
      //   canActivate: [roleGuard([ROLES.SUPER_ADMIN, ROLES.HR_MANAGER])],
      //   loadComponent: () =>
      //     import('./features/hr/employees-on-leave/employees-on-leave.component').then(m => m.EmployeesOnLeaveComponent),
      //   data: { titleKey: 'hr.leaveManagement' }
      // },
      {
        path: 'hr/employees-on-leave',
        canActivate: [roleGuard([ROLES.SUPER_ADMIN, ROLES.HR_MANAGER , ROLES.GENERAL_MANAGER])],
        loadComponent: () =>
          import('./features/hr/employees-on-leave/employees-on-leave.component').then(m => m.EmployeesOnLeaveComponent),
        data: { titleKey: 'hr.employeesOnLeave' }
      },
      {
        path: 'hr/requests',
        canActivate: [roleGuard([ROLES.SUPER_ADMIN, ROLES.GENERAL_MANAGER, ROLES.HR_MANAGER, ROLES.DEPT_HEAD, ROLES.DEP_PR_MANAGER, ROLES.SALES_MANAGER, ROLES.TECH_HEAD])],
        loadComponent: () =>
          import('./features/hr/leave-requests/leave-requests.component').then(m => m.LeaveRequestsComponent),
        data: { titleKey: 'hr.leaveRequests' }
      },
      {
        path: 'hr/my-dept-staff',
        canActivate: [roleGuard([ROLES.DEP_PR_MANAGER])],
        loadComponent: () =>
          import('./features/hr/my-dept-staff/my-dept-staff.component').then(m => m.MyDeptStaffComponent),
        data: { titleKey: 'hr.myDeptStaff' }
      },
      {
        path: 'hr/my-team',
        canActivate: [roleGuard([ROLES.TECH_HEAD ])],
        loadComponent: () =>
          import('./features/hr/my-dept-staff/my-dept-staff.component').then(m => m.MyDeptStaffComponent),
        data: { titleKey: 'hr.myTeam' }
      },

      // ============================================
      // LEADS (Sales Module)
      // ============================================
      {
        path: 'leads',
        canActivate: [roleGuard([ROLES.SUPER_ADMIN, ROLES.GENERAL_MANAGER, ROLES.DEPT_HEAD, ROLES.SALES_REP, ROLES.QUOTATION_SPECIALIST, ROLES.FINANCE_MANAGER, ROLES.SALES_MANAGER , ROLES.TECH_HEAD])],
        loadComponent: () =>
          import('./features/leads/leads-list/leads-list.component').then(m => m.LeadsListComponent),
        data: { titleKey: 'sidebar.leads' }
      },
      {
        path: 'leads/:id',
        canActivate: [roleGuard([ROLES.SUPER_ADMIN, ROLES.GENERAL_MANAGER, ROLES.DEPT_HEAD, ROLES.SALES_REP, ROLES.ENGINEER, ROLES.QUOTATION_SPECIALIST, ROLES.FINANCE_MANAGER, ROLES.SALES_MANAGER , ROLES.TECH_HEAD])],
        loadComponent: () =>
          import('./features/leads/lead-details/lead-details.component').then(m => m.LeadDetailsComponent),
        data: { titleKey: 'leads.leadDetails' }
      },

      // ============================================
      // PROJECTS
      // ============================================
      {
        path: 'projects',
        canActivate: [roleGuard([ROLES.SUPER_ADMIN, ROLES.GENERAL_MANAGER, ROLES.PROJECT_MANAGER, ROLES.ENGINEER, ROLES.DEPT_HEAD, ROLES.CONTRACT_DEPT_HEAD, ROLES.MC_MANAGER, ROLES.QS_MANAGER, ROLES.TECH_HEAD, ROLES.SALES_MANAGER , ROLES.DEP_PR_MANAGER])],
        loadComponent: () =>
          import('./features/projects/projects-list/projects-list.component').then(m => m.ProjectsListComponent),
        data: { titleKey: 'sidebar.projects' }
      },
      {
        path: 'projects/:id',
        canActivate: [roleGuard([ROLES.SUPER_ADMIN, ROLES.GENERAL_MANAGER, ROLES.PROJECT_MANAGER, ROLES.ENGINEER, ROLES.DEPT_HEAD, ROLES.CONTRACT_DEPT_HEAD, ROLES.DEP_PR_MANAGER, ROLES.MC_MANAGER, ROLES.QS_MANAGER, ROLES.TECH_HEAD, ROLES.SALES_MANAGER])],
        loadComponent: () =>
          import('./features/projects/project-detail/project-detail.component').then(m => m.ProjectDetailComponent),
        data: { titleKey: 'projects.projectDetails' }
      },
      {
        path: 'projects/:id/reports',
        canActivate: [roleGuard([ROLES.SUPER_ADMIN, ROLES.GENERAL_MANAGER, ROLES.PROJECT_MANAGER, ROLES.ENGINEER, ROLES.DEPT_HEAD, ROLES.FINANCE_MANAGER, ROLES.CONTRACT_DEPT_HEAD, ROLES.DEP_PR_MANAGER, ROLES.TECH_HEAD, ROLES.MC_MANAGER, ROLES.QS_MANAGER, ROLES.SALES_MANAGER])],
        loadComponent: () =>
          import('./features/projects/project-reports/project-reports.component').then(m => m.ProjectReportsComponent),
        data: { titleKey: 'projects.projectReports' }
      },

      // ============================================
      // QUOTATIONS MODULE
      // ============================================
      {
        path: 'quotations',
        canActivate: [roleGuard([ROLES.SUPER_ADMIN, ROLES.GENERAL_MANAGER, ROLES.FINANCE_MANAGER, ROLES.QUOTATION_SPECIALIST])],
        loadComponent: () =>
          import('./features/quotations/quotations-list/quotations-list.component').then(m => m.QuotationsListComponent),
        data: { titleKey: 'sidebar.quotations' }
      },
      {
        path: 'quotations/tasks',
        canActivate: [roleGuard([ROLES.SUPER_ADMIN, ROLES.GENERAL_MANAGER, ROLES.QUOTATION_SPECIALIST])],
        loadComponent: () =>
          import('./features/quotations/quotation-tasks/quotation-tasks.component').then(m => m.QuotationTasksComponent),
        data: { titleKey: 'sidebar.quotationTasks' }
      },
      {
        path: 'quotations/:id',
        canActivate: [roleGuard([ROLES.SUPER_ADMIN, ROLES.GENERAL_MANAGER, ROLES.FINANCE_MANAGER, ROLES.QUOTATION_SPECIALIST])],
        loadComponent: () =>
          import('./features/quotations/quotation-details/quotation-details.component').then(m => m.QuotationDetailsComponent),
        data: { titleKey: 'quotations.quotationDetails' }
      },

      // ============================================
      // SUPPLIERS MODULE
      // ============================================
      {
        path: 'suppliers',
        canActivate: [roleGuard([ROLES.SUPER_ADMIN, ROLES.GENERAL_MANAGER, ROLES.FINANCE_MANAGER, ROLES.PROCUREMENT_MANAGER])],
        loadComponent: () =>
          import('./features/finance/suppliers-list/suppliers-list.component').then(m => m.SuppliersListComponent),
        data: { titleKey: 'sidebar.suppliers' }
      },
      {
        path: 'suppliers/:id',
        canActivate: [roleGuard([ROLES.SUPER_ADMIN, ROLES.GENERAL_MANAGER, ROLES.FINANCE_MANAGER, ROLES.PROCUREMENT_MANAGER])],
        loadComponent: () =>
          import('./features/finance/supplier-details/supplier-details.component').then(m => m.SupplierDetailsComponent),
        data: { titleKey: 'suppliers.supplierDetails' }
      },

      // ============================================
      // PROCUREMENT MODULE
      // ============================================
      {
        path: 'procurement/pending-approvals',
        canActivate: [roleGuard([ROLES.SUPER_ADMIN, ROLES.GENERAL_MANAGER, ROLES.PROCUREMENT_MANAGER, ROLES.FINANCE_MANAGER])],
        loadComponent: () =>
          import('./features/procurement/procurement-pending/procurement-pending.component').then(m => m.ProcurementPendingComponent),
        data: { titleKey: 'procurement.pendingApprovals' }
      },
      {
        path: 'procurement/invoices',
        canActivate: [roleGuard([ROLES.SUPER_ADMIN, ROLES.GENERAL_MANAGER, ROLES.PROCUREMENT_MANAGER, ROLES.FINANCE_MANAGER])],
        loadComponent: () =>
          import('./features/finance/purchase-invoices-list/purchase-invoices-list.component').then(m => m.PurchaseInvoicesListComponent),
        data: { titleKey: 'procurement.purchaseInvoices' }
      },
      {
        path: 'finance/purchase-invoices',
        canActivate: [roleGuard([ROLES.SUPER_ADMIN, ROLES.GENERAL_MANAGER, ROLES.PROCUREMENT_MANAGER, ROLES.FINANCE_MANAGER])],
        loadComponent: () =>
          import('./features/finance/purchase-invoices-list/purchase-invoices-list.component').then(m => m.PurchaseInvoicesListComponent),
        data: { titleKey: 'procurement.purchaseInvoices' }
      },
      {
        path: 'procurement/invoices/:id',
        canActivate: [roleGuard([ROLES.SUPER_ADMIN, ROLES.GENERAL_MANAGER, ROLES.PROCUREMENT_MANAGER, ROLES.FINANCE_MANAGER])],
        loadComponent: () =>
          import('./features/finance/purchase-invoice-detail/purchase-invoice-detail.component').then(m => m.PurchaseInvoiceDetailComponent),
        data: { titleKey: 'invoiceDetail.title' }
      },
      {
        path: 'procurement/invoices/create',
        canActivate: [roleGuard([ROLES.SUPER_ADMIN, ROLES.GENERAL_MANAGER, ROLES.PROCUREMENT_MANAGER, ROLES.FINANCE_MANAGER])],
        loadComponent: () =>
          import('./features/procurement/purchase-invoice-create/purchase-invoice-create.component').then(m => m.PurchaseInvoiceCreateComponent),
        data: { titleKey: 'procurement.createInvoice' }
      },

      // ============================================
      // INVENTORY & WAREHOUSE MODULE
      // ============================================
      {
        path: 'inventory/warehouses',
        // project_manager must NOT access warehouse management
        canActivate: [roleGuard([ROLES.SUPER_ADMIN, ROLES.GENERAL_MANAGER, ROLES.FINANCE_MANAGER, ROLES.DEP_PR_MANAGER, ROLES.WAREHOUSE_MANAGER, ROLES.INVENTORY_MANAGER])],
        loadComponent: () =>
          import('./features/inventory/warehouses/warehouses-list.component').then(m => m.WarehousesListComponent),
        data: { titleKey: 'inventory.warehouses' }
      },
      {
        path: 'inventory/dashboard',
        // General inventory is read-only for project_manager / dep_pr_manager
        canActivate: [roleGuard([ROLES.SUPER_ADMIN, ROLES.GENERAL_MANAGER, ROLES.FINANCE_MANAGER, ROLES.PROJECT_MANAGER, ROLES.DEP_PR_MANAGER, ROLES.WAREHOUSE_MANAGER, ROLES.INVENTORY_MANAGER])],
        loadComponent: () =>
          import('./features/inventory/inventory-dashboard/inventory-dashboard.component').then(m => m.InventoryDashboardComponent),
        data: { titleKey: 'inventory.generalInventory' }
      },

      // ============================================
      // FINANCE MODULE
      // ============================================

      // Payment Vouchers
      {
        path: 'finance/payment-vouchers',
        canActivate: [roleGuard([ROLES.SUPER_ADMIN, ROLES.GENERAL_MANAGER, ROLES.FINANCE_MANAGER])],
        loadComponent: () =>
          import('./features/finance/payment-vouchers-list/payment-vouchers-list.component').then(m => m.PaymentVouchersListComponent),
        data: { titleKey: 'paymentVouchers.list' }
      },
      {
        path: 'finance/payment-vouchers/create',
        canActivate: [roleGuard([ROLES.SUPER_ADMIN, ROLES.GENERAL_MANAGER, ROLES.FINANCE_MANAGER])],
        loadComponent: () =>
          import('./features/finance/payment-voucher-create/payment-voucher-create.component').then(m => m.PaymentVoucherCreateComponent),
        data: { titleKey: 'paymentVouchers.create' }
      },
      {
        path: 'finance/payment-vouchers/:id',
        canActivate: [roleGuard([ROLES.SUPER_ADMIN, ROLES.GENERAL_MANAGER, ROLES.FINANCE_MANAGER])],
        loadComponent: () =>
          import('./features/finance/payment-voucher-detail/payment-voucher-detail.component').then(m => m.PaymentVoucherDetailComponent),
        data: { titleKey: 'paymentVouchers.detail' }
      },

      // Petty Cash
      {
        path: 'finance/petty-cash/funds',
        canActivate: [roleGuard([ROLES.SUPER_ADMIN, ROLES.GENERAL_MANAGER, ROLES.FINANCE_MANAGER])],
        loadComponent: () =>
          import('./features/finance/petty-cash-funds/petty-cash-funds.component').then(m => m.PettyCashFundsComponent),
        data: { titleKey: 'pettyCash.funds' }
      },
      {
        path: 'finance/petty-cash/expense',
        canActivate: [roleGuard([ROLES.SUPER_ADMIN, ROLES.FINANCE_MANAGER , ROLES.GENERAL_MANAGER,])],
        loadComponent: () =>
          import('./features/finance/petty-cash-expense/petty-cash-expense.component').then(m => m.PettyCashExpenseComponent),
        data: { titleKey: 'pettyCash.expense' }
      },
      {
        path: 'finance/petty-cash/expenses-list',
        canActivate: [roleGuard([ROLES.SUPER_ADMIN, ROLES.GENERAL_MANAGER, ROLES.FINANCE_MANAGER])],
        loadComponent: () =>
          import('./features/finance/petty-cash-expenses-list/petty-cash-expenses-list.component').then(m => m.PettyCashExpensesListComponent),
        data: { titleKey: 'pettyCash.expensesList' }
      },

      // Journal Entry
      {
        path: 'accounting/journal-entries/:id',
        canActivate: [roleGuard([ROLES.SUPER_ADMIN, ROLES.GENERAL_MANAGER, ROLES.FINANCE_MANAGER])],
        loadComponent: () =>
          import('./features/finance/journal-entry-detail/journal-entry-detail.component').then(m => m.JournalEntryDetailComponent),
        data: { titleKey: 'journalEntries.detail' }
      },

      // Supplier Statements
      {
        path: 'finance/suppliers/statements',
        canActivate: [roleGuard([ROLES.SUPER_ADMIN, ROLES.GENERAL_MANAGER, ROLES.FINANCE_MANAGER])],
        loadComponent: () =>
          import('./features/finance/supplier-statements-list/supplier-statements-list.component').then(m => m.SupplierStatementsListComponent),
        data: { titleKey: 'supplierStatement.title' }
      },
      {
        path: 'finance/suppliers/:id/statement',
        canActivate: [roleGuard([ROLES.SUPER_ADMIN, ROLES.GENERAL_MANAGER, ROLES.FINANCE_MANAGER])],
        loadComponent: () =>
          import('./features/finance/supplier-statement/supplier-statement.component').then(m => m.SupplierStatementComponent),
        data: { titleKey: 'supplierStatement.title' }
      },

      // Expense Vouchers
      {
        path: 'finance/expenses',
        canActivate: [roleGuard([ROLES.SUPER_ADMIN, ROLES.GENERAL_MANAGER, ROLES.FINANCE_MANAGER])],
        loadComponent: () =>
          import('./features/finance/expense-vouchers-list/expense-vouchers-list.component').then(m => m.ExpenseVouchersListComponent),
        data: { titleKey: 'expenseVouchers.title' }
      },
      {
        path: 'finance/expenses/create',
        canActivate: [roleGuard([ROLES.SUPER_ADMIN, ROLES.GENERAL_MANAGER, ROLES.FINANCE_MANAGER])],
        loadComponent: () =>
          import('./features/finance/expense-voucher-create/expense-voucher-create.component').then(m => m.ExpenseVoucherCreateComponent),
        data: { titleKey: 'expenseVouchers.createNew' }
      },

      // Treasury
      {
        path: 'finance/treasury/dashboard',
        canActivate: [roleGuard([ROLES.SUPER_ADMIN, ROLES.GENERAL_MANAGER, ROLES.FINANCE_MANAGER])],
        loadComponent: () =>
          import('./features/finance/treasury-dashboard/treasury-dashboard.component').then(m => m.TreasuryDashboardComponent),
        data: { titleKey: 'treasury.dashboard' }
      },

      // Receipt Vouchers
      {
        path: 'finance/receipt-vouchers',
        canActivate: [roleGuard([ROLES.SUPER_ADMIN, ROLES.GENERAL_MANAGER, ROLES.FINANCE_MANAGER])],
        loadComponent: () =>
          import('./features/finance/receipt-vouchers/receipt-vouchers-list/receipt-vouchers-list.component').then(m => m.ReceiptVouchersListComponent),
        data: { titleKey: 'receiptVouchers' }
      },
      {
        path: 'finance/receipt-vouchers/create',
        canActivate: [roleGuard([ROLES.SUPER_ADMIN, ROLES.GENERAL_MANAGER, ROLES.FINANCE_MANAGER])],
        loadComponent: () =>
          import('./features/finance/receipt-vouchers/receipt-voucher-create/receipt-voucher-create.component').then(m => m.ReceiptVoucherCreateComponent),
        data: { titleKey: 'receiptVouchers.create' }
      },
      {
        path: 'finance/receipt-vouchers/:id',
        canActivate: [roleGuard([ROLES.SUPER_ADMIN, ROLES.GENERAL_MANAGER, ROLES.FINANCE_MANAGER])],
        loadComponent: () =>
          import('./features/finance/receipt-vouchers/receipt-voucher-detail/receipt-voucher-detail.component').then(m => m.ReceiptVoucherDetailComponent),
        data: { titleKey: 'receiptVouchers.detail' }
      },

      // ============================================
      // FINANCIAL REPORTS MODULE
      // ============================================
      {
        path: 'finance/reports/trial-balance',
        canActivate: [roleGuard([ROLES.SUPER_ADMIN, ROLES.GENERAL_MANAGER, ROLES.FINANCE_MANAGER])],
        loadComponent: () =>
          import('./features/finance/financial-reports/trial-balance/trial-balance.component').then(m => m.TrialBalanceComponent),
        data: { titleKey: 'reports.trialBalance' }
      },
      {
        path: 'finance/reports/ledger/:accountCode',
        canActivate: [roleGuard([ROLES.SUPER_ADMIN, ROLES.GENERAL_MANAGER, ROLES.FINANCE_MANAGER])],
        loadComponent: () =>
          import('./features/finance/financial-reports/general-ledger/general-ledger.component').then(m => m.GeneralLedgerComponent),
        data: { titleKey: 'reports.generalLedger' }
      },
      {
        path: 'finance/reports/profit-loss',
        canActivate: [roleGuard([ROLES.SUPER_ADMIN, ROLES.GENERAL_MANAGER, ROLES.FINANCE_MANAGER])],
        loadComponent: () =>
          import('./features/finance/financial-reports/profit-loss/profit-loss.component').then(m => m.ProfitLossComponent),
        data: { titleKey: 'reports.profitLoss' }
      },
      {
        path: 'finance/project-profitability',
        canActivate: [roleGuard([ROLES.SUPER_ADMIN, ROLES.GENERAL_MANAGER, ROLES.FINANCE_MANAGER])],
        loadComponent: () =>
          import('./features/finance/project-profitability/project-profitability.component').then(m => m.ProjectProfitabilityComponent),
        data: { titleKey: 'Project Profitability' }
      },
      {
        path: 'finance/customer-statement/:leadId',
        canActivate: [roleGuard([ROLES.SUPER_ADMIN, ROLES.GENERAL_MANAGER, ROLES.FINANCE_MANAGER, ROLES.SALES_MANAGER])],
        loadComponent: () =>
          import('./features/finance/customer-statement/customer-statement.component').then(m => m.CustomerStatementComponent),
        data: { titleKey: 'Statement of Account' }
      },

      // ============================================
      // SALES MODULE
      // ============================================
      {
        path: 'sales/won-leads',
        canActivate: [roleGuard([ROLES.SUPER_ADMIN, ROLES.GENERAL_MANAGER, ROLES.FINANCE_MANAGER, ROLES.SALES_MANAGER])],
        loadComponent: () =>
          import('./features/sales/won-leads/won-leads.component').then(m => m.WonLeadsComponent),
        data: { titleKey: 'sidebar.wonLeads' }
      },
      {
        path: 'sales/invoices',
        canActivate: [roleGuard([ROLES.SUPER_ADMIN, ROLES.GENERAL_MANAGER, ROLES.FINANCE_MANAGER, ROLES.SALES_MANAGER])],
        loadComponent: () =>
          import('./features/sales/invoices/sales-invoices-list.component').then(m => m.SalesInvoicesListComponent),
        data: { titleKey: 'sidebar.salesInvoices' }
      },
      {
        path: 'sales/invoices/create',
        canActivate: [roleGuard([ROLES.SUPER_ADMIN, ROLES.GENERAL_MANAGER, ROLES.FINANCE_MANAGER, ROLES.SALES_MANAGER])],
        loadComponent: () =>
          import('./features/sales/invoices/sales-invoice-create.component').then(m => m.SalesInvoiceCreateComponent),
        data: { titleKey: 'sidebar.createSalesInvoice' }
      },
      {
        path: 'sales/invoices/:id',
        canActivate: [roleGuard([ROLES.SUPER_ADMIN, ROLES.GENERAL_MANAGER, ROLES.FINANCE_MANAGER, ROLES.SALES_MANAGER])],
        loadComponent: () =>
          import('./features/sales/invoices/sales-invoice-detail.component').then(m => m.SalesInvoiceDetailComponent),
        data: { titleKey: 'invoiceDetail.title' }
      },
      {
        path: 'sales/invoices/:invoiceId/credit-note',
        canActivate: [roleGuard([ROLES.SUPER_ADMIN, ROLES.GENERAL_MANAGER, ROLES.FINANCE_MANAGER])],
        loadComponent: () =>
          import('./features/sales/invoices/credit-note-create.component').then(m => m.CreditNoteCreateComponent),
        data: { titleKey: 'sidebar.createCreditNote' }
      },
      {
        path: 'sales/credit-notes',
        canActivate: [roleGuard([ROLES.SUPER_ADMIN, ROLES.GENERAL_MANAGER, ROLES.FINANCE_MANAGER])],
        loadComponent: () =>
          import('./features/sales/invoices/credit-notes-list.component').then(m => m.CreditNotesListComponent),
        data: { titleKey: 'sidebar.creditNotesList' }
      },
      {
        path: 'sales/tax-invoices',
        canActivate: [roleGuard([ROLES.SUPER_ADMIN, ROLES.GENERAL_MANAGER, ROLES.FINANCE_MANAGER])],
        loadComponent: () =>
          import('./features/sales/tax-invoices/tax-invoices-list.component').then(m => m.TaxInvoicesListComponent),
        data: { titleKey: 'sidebar.taxInvoices' }
      },

      // ============================================
      // FIXED ASSETS
      // ============================================
      {
        path: 'maintenance/assets',
        canActivate: [roleGuard([ROLES.SUPER_ADMIN, ROLES.GENERAL_MANAGER, ROLES.FINANCE_MANAGER])],
        loadComponent: () =>
          import('./features/maintenance/assets-list/fixed-assets-list.component').then(m => m.FixedAssetsListComponent),
        data: { titleKey: 'sidebar.fixedAssets' }
      },
      {
        path: 'maintenance/assets/create',
        canActivate: [roleGuard([ROLES.SUPER_ADMIN, ROLES.GENERAL_MANAGER, ROLES.FINANCE_MANAGER])],
        loadComponent: () =>
          import('./features/maintenance/assets-list/fixed-asset-create.component').then(m => m.FixedAssetCreateComponent),
        data: { titleKey: 'fixedAssets.create' }
      },
      {
        path: 'maintenance/assets/:id',
        canActivate: [roleGuard([ROLES.SUPER_ADMIN, ROLES.GENERAL_MANAGER, ROLES.FINANCE_MANAGER])],
        loadComponent: () =>
          import('./features/maintenance/assets-list/fixed-asset-detail.component').then(m => m.FixedAssetDetailComponent),
        data: { titleKey: 'fixedAssets.detail' }
      },
    ]
  },

  {
    path: 'unauthorized',
    loadComponent: () => import('./features/auth/unauthorized/unauthorized.component').then(m => m.UnauthorizedComponent)
  },

  { path: '**', redirectTo: 'auth/login' }
];