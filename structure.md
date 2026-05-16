Smart Energy ERP — Angular Frontend Structure Prompt
Project Info

Framework: Angular 17+ (Standalone Components)
UI Library: Tailwind CSS
Direction: RTL (Arabic — عربي بالكامل)
Dark Mode: Yes (toggle between light/dark)
Rendering: SPA
Each role sees a different dashboard

Backend API

Base URL: http://localhost:3000/api
Auth: JWT Bearer token in Authorization header
All responses: { status: 'success'|'error', data: {...}, message: '' }

Roles in the system:
super_admin, general_manager, dept_head, hr_manager,
engineer, sales_rep, quotation_specialist, finance_manager,
project_manager, client, warehouse_manager, procurement_manager

Step 1 — Project Setup
bashng new smart-energy-erp --routing --style=scss --standalone
cd smart-energy-erp
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init
npm install @angular/cdk
npm install lucide-angular
npm install chart.js ng2-charts
Configure Tailwind for RTL in tailwind.config.js:
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}",
  ],
  // darkMode: 'class', // شيلنا السطر ده عشان نثبت ألوان الشركة
  theme: {
    extend: {
      colors: {
        // استبدل الأكواد دي بالأكواد اللي في ملف Color-company
        company: {
          primary: '#0055aa',   // اللون الأساسي للشركة
          secondary: '#f1c40f', // اللون الفرعي
          accent: '#e67e22',    // لون التميز (للأزرار مثلاً)
          surface: '#ffffff',   // لون الخلفيات
          text: '#1a1a1a',      // لون النصوص الرئيسي
        }
      },
      fontFamily: {
        // استبدل 'Cairo' باسم الفونت اللي في ملفك
        brand: ['JF Flat Bold for headings and titles', 'Secondary Typeface JF Flat Regular



for body text and descriptions'], 
      }
    },
  },
  plugins: [],
}
Add to index.html:
html<link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700&display=swap" rel="stylesheet">
Set RTL in index.html:
html<html lang="ar" dir="rtl">

Step 2 — Folder Structure
Create this EXACT structure:
src/
  app/
    core/
      services/
        auth.service.ts          ← JWT storage, login, logout, getUser()
        api.service.ts           ← HTTP wrapper with base URL + auth header
        notification.service.ts  ← get notifications, mark read, unread count
        theme.service.ts         ← dark/light mode toggle
      guards/
        auth.guard.ts            ← redirect to /login if no token
        role.guard.ts            ← redirect if role not allowed
      interceptors/
        auth.interceptor.ts      ← adds Authorization: Bearer token to all requests
        error.interceptor.ts     ← handles 401 (logout), 403 (show error), 500
      models/
        user.model.ts
        lead.model.ts
        employee.model.ts
        project.model.ts
        invoice.model.ts
        notification.model.ts
      utils/
        role-permissions.ts      ← maps each role to allowed routes/features

    shared/
      components/
        sidebar/
          sidebar.component.ts   ← dynamic sidebar based on role
          sidebar.component.html
          sidebar.component.scss
        header/
          header.component.ts    ← notifications bell + user menu + dark mode toggle
          header.component.html
        stats-card/
          stats-card.component.ts ← reusable KPI card
        data-table/
          data-table.component.ts ← reusable table with pagination + search
        modal/
          modal.component.ts      ← reusable modal wrapper
        badge/
          badge.component.ts      ← status badge (color based on value)
        loading/
          loading.component.ts    ← spinner overlay
        empty-state/
          empty-state.component.ts ← when no data
        confirm-dialog/
          confirm-dialog.component.ts ← delete confirmation
        file-upload/
          file-upload.component.ts ← drag & drop file upload (for HR docs)
        notification-panel/
          notification-panel.component.ts ← slide-out notifications list
      pipes/
        arabic-date.pipe.ts      ← formats dates in Arabic
        currency-sar.pipe.ts     ← formats numbers as SAR currency
        status-label.pipe.ts     ← translates status strings to Arabic
      directives/
        has-role.directive.ts    ← *appHasRole="['gm', 'super_admin']" structural directive
        rtl-chart.directive.ts   ← fixes chart.js RTL issues

    layouts/
      main-layout/
        main-layout.component.ts  ← sidebar + header + router-outlet
        main-layout.component.html
      auth-layout/
        auth-layout.component.ts  ← centered card for login/otp
      client-layout/
        client-layout.component.ts ← simplified layout for client portal

    features/
      auth/
        login/
          login.component.ts
          login.component.html
        verify-otp/
          verify-otp.component.ts
          verify-otp.component.html
        services/
          auth-feature.service.ts

      dashboard/
        gm-dashboard/
          gm-dashboard.component.ts       ← full KPIs for general_manager
        hr-dashboard/
          hr-dashboard.component.ts       ← headcount, leaves, expiring docs
        finance-dashboard/
          finance-dashboard.component.ts  ← revenue, invoices, expenses
        projects-dashboard/
          projects-dashboard.component.ts ← active projects, tasks overdue
        sales-dashboard/
          sales-dashboard.component.ts    ← leads pipeline, won/lost
        maintenance-dashboard/
          maintenance-dashboard.component.ts
        engineer-dashboard/
          engineer-dashboard.component.ts ← my tasks only

      departments/
        departments-list/
        department-form/
        department-detail/
        services/
          departments.service.ts

      hr/
        employees-list/
        employee-form/          ← form-data with file upload
        employee-detail/
        leaves/
          leaves-list/
          leave-form/
        evaluations/
          evaluations-list/
          evaluation-form/
        services/
          hr.service.ts

      leads/
        leads-list/             ← kanban board view + table view toggle
        lead-form/
        lead-detail/
        services/
          leads.service.ts

      inspections/
        inspections-list/
        inspection-form/
        inspection-report/
        services/
          inspections.service.ts

      quotations/
        quotations-list/
        quotation-form/
        quotation-detail/       ← approval flow timeline
        services/
          quotations.service.ts

      projects/
        projects-list/
        project-form/
        project-detail/
          project-overview/
          project-tasks/
          project-team/
          project-materials/
          project-reports/
          project-qhse/
        task-form/
        services/
          projects.service.ts

      finance/
        invoices-list/
        invoice-form/
        invoice-detail/
        payments/
        expenses/
        chart-of-accounts/      ← tree view
        journal-entries/
        financial-reports/
        services/
          finance.service.ts

      maintenance/
        assets-list/
        asset-form/
        asset-detail/
        maintenance-records/
        maintenance-contracts/
        maintenance-alerts/
        services/
          maintenance.service.ts

      analytics/
        analytics-dashboard/    ← charts + tables
        department-performance/ ← bar chart ranking departments
        services/
          analytics.service.ts

      notifications/
        notifications-list/
        services/
          notifications.service.ts

      client-portal/
        client-home/
        client-quotations/
        client-projects/
        client-invoices/
        client-maintenance/
        services/
          client.service.ts

    app.routes.ts
    app.config.ts
    app.component.ts

Step 3 — Core Models
user.model.ts:
typescriptexport interface User {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  username: string;
  role: string;
  role_id: number;
  department_id: number | null;
  phone: string;
  status: string;
}

export interface AuthResponse {
  requires_otp: boolean;
  user_id?: number;
  token?: string;
  user?: User;
  message?: string;
}
notification.model.ts:
typescriptexport interface Notification {
  id: number;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'danger';
  entity_type: string;
  entity_id: number;
  is_read: boolean;
  created_at: string;
}

Step 4 — Core Services
auth.service.ts:
typescript@Injectable({ providedIn: 'root' })
export class AuthService {
  private tokenKey = 'erp_token';
  private userKey  = 'erp_user';

  saveToken(token: string): void
  getToken(): string | null
  saveUser(user: User): void
  getUser(): User | null
  getRole(): string
  isLoggedIn(): boolean
  logout(): void  // clears storage + navigates to /login
  hasRole(roles: string[]): boolean
}
api.service.ts:
typescript@Injectable({ providedIn: 'root' })
export class ApiService {
  private baseUrl = environment.apiUrl; // 'http://localhost:3000/api'

  get<T>(path: string, params?: any): Observable<T>
  post<T>(path: string, body: any): Observable<T>
  patch<T>(path: string, body: any): Observable<T>
  delete<T>(path: string): Observable<T>
  uploadForm<T>(path: string, formData: FormData): Observable<T>
}
theme.service.ts:
typescript@Injectable({ providedIn: 'root' })
export class ThemeService {
  isDark = signal(false);

  init(): void  // reads from localStorage on app start
  toggle(): void  // adds/removes 'dark' class on <html>
  setDark(val: boolean): void
}

Step 5 — Routing Structure
app.routes.ts:
typescriptexport const routes: Routes = [
  // Auth (no layout)
  {
    path: 'auth',
    component: AuthLayoutComponent,
    children: [
      { path: 'login',      loadComponent: () => import('./features/auth/login/login.component') },
      { path: 'verify-otp', loadComponent: () => import('./features/auth/verify-otp/verify-otp.component') },
    ]
  },

  // Client Portal (simplified layout)
  {
    path: 'client',
    component: ClientLayoutComponent,
    canActivate: [authGuard, roleGuard(['client'])],
    children: [
      { path: '', loadComponent: () => import('./features/client-portal/client-home/...') },
      { path: 'quotations', ... },
      { path: 'projects', ... },
      { path: 'invoices', ... },
    ]
  },

  // Main App (sidebar + header layout)
  {
    path: '',
    component: MainLayoutComponent,
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },

      // Dashboard — redirects based on role
      { path: 'dashboard', loadComponent: () => import('./features/dashboard/...) },

      // Departments
      { path: 'departments', canActivate: [roleGuard(['super_admin','general_manager'])],
        loadComponent: ... },

      // HR
      { path: 'hr', canActivate: [roleGuard(['super_admin','hr_manager','general_manager'])],
        children: [
          { path: 'employees', ... },
          { path: 'employees/:id', ... },
          { path: 'leaves', ... },
          { path: 'evaluations', ... },
        ]
      },

      // Leads
      { path: 'leads', canActivate: [roleGuard(['super_admin','general_manager','dept_head','sales_rep'])], ... },

      // Inspections
      { path: 'inspections', ... },

      // Quotations
      { path: 'quotations', ... },

      // Projects
      { path: 'projects', ... },
      { path: 'projects/:id', children: [
          { path: 'overview', ... },
          { path: 'tasks', ... },
          { path: 'team', ... },
          { path: 'materials', ... },
          { path: 'reports', ... },
          { path: 'qhse', ... },
        ]
      },

      // Finance
      { path: 'finance', canActivate: [roleGuard(['super_admin','general_manager','finance_manager'])],
        children: [
          { path: 'invoices', ... },
          { path: 'expenses', ... },
          { path: 'accounts', ... },
          { path: 'journal-entries', ... },
          { path: 'reports', ... },
        ]
      },

      // Maintenance
      { path: 'maintenance', ... },

      // Analytics
      { path: 'analytics', canActivate: [roleGuard(['super_admin','general_manager'])], ... },

      // Notifications
      { path: 'notifications', ... },
    ]
  },

  { path: '**', redirectTo: 'dashboard' }
];

Step 6 — Sidebar Logic
The sidebar menu items are dynamic based on role. Implement this in role-permissions.ts:
typescriptexport const ROLE_MENU: Record<string, MenuItem[]> = {
  super_admin: [
    { label: 'لوحة التحكم',   icon: 'layout-dashboard', route: '/dashboard' },
    { label: 'الإدارات',       icon: 'building',          route: '/departments' },
    { label: 'الموارد البشرية', icon: 'users',             route: '/hr/employees' },
    { label: 'العملاء المحتملين', icon: 'trending-up',    route: '/leads' },
    { label: 'المعاينات',      icon: 'search',            route: '/inspections' },
    { label: 'العروض',         icon: 'file-text',         route: '/quotations' },
    { label: 'المشاريع',       icon: 'briefcase',         route: '/projects' },
    { label: 'المالية',        icon: 'dollar-sign',       route: '/finance/invoices' },
    { label: 'الصيانة',        icon: 'tool',              route: '/maintenance/assets' },
    { label: 'التحليلات',      icon: 'bar-chart',         route: '/analytics' },
    { label: 'الإشعارات',      icon: 'bell',              route: '/notifications' },
  ],
  general_manager: [ /* same as super_admin minus departments */ ],
  hr_manager: [
    { label: 'لوحة التحكم',    icon: 'layout-dashboard', route: '/dashboard' },
    { label: 'الموظفون',       icon: 'users',            route: '/hr/employees' },
    { label: 'الإجازات',       icon: 'calendar',         route: '/hr/leaves' },
    { label: 'التقييمات',      icon: 'star',             route: '/hr/evaluations' },
    { label: 'الإشعارات',      icon: 'bell',             route: '/notifications' },
  ],
  finance_manager: [
    { label: 'لوحة التحكم',    icon: 'layout-dashboard', route: '/dashboard' },
    { label: 'الفواتير',       icon: 'file-invoice',     route: '/finance/invoices' },
    { label: 'المصروفات',      icon: 'credit-card',      route: '/finance/expenses' },
    { label: 'شجرة الحسابات',  icon: 'git-branch',       route: '/finance/accounts' },
    { label: 'القيود المحاسبية', icon: 'book',            route: '/finance/journal-entries' },
    { label: 'التقارير المالية', icon: 'bar-chart-2',    route: '/finance/reports' },
    { label: 'الإشعارات',      icon: 'bell',             route: '/notifications' },
  ],
  project_manager: [
    { label: 'لوحة التحكم',    icon: 'layout-dashboard', route: '/dashboard' },
    { label: 'مشاريعي',        icon: 'briefcase',        route: '/projects' },
    { label: 'الإشعارات',      icon: 'bell',             route: '/notifications' },
  ],
  engineer: [
    { label: 'مهامي',          icon: 'check-square',     route: '/projects' },
    { label: 'الإشعارات',      icon: 'bell',             route: '/notifications' },
  ],
  sales_rep: [
    { label: 'لوحة التحكم',    icon: 'layout-dashboard', route: '/dashboard' },
    { label: 'العملاء المحتملين', icon: 'trending-up',   route: '/leads' },
    { label: 'الإشعارات',      icon: 'bell',             route: '/notifications' },
  ],
  dept_head: [ /* dynamic based on department name */ ],
  client: [ /* handled by client-layout */ ],
};

Step 7 — Dashboard Routing Logic
In the main dashboard component, redirect based on role:
typescript@Component({ template: '' })
export class DashboardComponent implements OnInit {
  constructor(private auth: AuthService, private router: Router) {}

  ngOnInit() {
    const role = this.auth.getRole();
    const routes: Record<string, string> = {
      super_admin:          '/dashboard/gm',
      general_manager:      '/dashboard/gm',
      hr_manager:           '/dashboard/hr',
      finance_manager:      '/dashboard/finance',
      project_manager:      '/dashboard/projects',
      dept_head:            '/dashboard/dept',
      sales_rep:            '/dashboard/sales',
      engineer:             '/dashboard/engineer',
      quotation_specialist: '/dashboard/sales',
      warehouse_manager:    '/dashboard/projects',
      procurement_manager:  '/dashboard/projects',
    };
    this.router.navigate([routes[role] || '/dashboard/gm']);
  }
}

Step 8 — Auth Interceptor
typescriptexport const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = inject(AuthService).getToken();

  const authReq = token
    ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : req;

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) {
        inject(AuthService).logout();
      }
      return throwError(() => error);
    })
  );
};

Step 9 — Environment Setup
src/environments/environment.ts:
typescriptexport const environment = {
  production: false,
  apiUrl: 'http://localhost:3000/api',
};
src/environments/environment.prod.ts:
typescriptexport const environment = {
  production: true,
  apiUrl: 'https://your-production-url.com/api',
};

Step 10 — Shared Components Specs
stats-card.component.ts:
typescript// Inputs: title, value, icon, color, change (percentage), trend ('up'|'down')
// Shows a KPI card with icon, value, title, and trend indicator
badge.component.ts:
typescript// Input: value (string like 'won', 'pending', 'active')
// Maps to Arabic label + color class automatically
// Status map:
// new → 'جديد' (blue)
// contacted → 'تم التواصل' (yellow)
// won → 'رابح' (green)
// lost → 'خسارة' (red)
// pending → 'قيد الانتظار' (yellow)
// approved → 'معتمد' (green)
// rejected → 'مرفوض' (red)
// active → 'نشط' (green)
// in_progress → 'جاري التنفيذ' (blue)
// completed → 'مكتمل' (green)
// delivered → 'تم التسليم' (purple)
// overdue → 'متأخر' (red)
data-table.component.ts:
typescript// Inputs: columns[], data[], loading, pagination
// Features: search, sort, pagination, row click
// Outputs: rowClick, pageChange, searchChange
has-role.directive.ts:
typescript// Usage: <div *appHasRole="['general_manager', 'super_admin']">
// Hides element if current user's role is not in the array

Implementation Order:
Step 1:  ng new + install dependencies
Step 2:  Configure  RTL + fonts
Step 3:  Create environment files
Step 4:  Create core/models (all interfaces)
Step 5:  Create core/services (auth, api, theme, notification)
Step 6:  Create interceptors (auth, error)
Step 7:  Create guards (auth, role)
Step 8:  Create shared/components (sidebar, header, stats-card, badge, data-table, modal)
Step 9:  Create shared/pipes and directives
Step 10: Create layouts (main, auth, client)
Step 11: Create app.routes.ts with all routes (lazy loaded)
Step 12: Create app.config.ts with providers
Step 13: Build auth feature (login + verify-otp)
Step 14: Build dashboard routing logic
Step 15: Build each feature module (in order: departments → hr → leads → inspections → quotations → projects → finance → maintenance → analytics → client-portal)

After completing the structure:
Create FRONTEND_REPORT.md:
markdown# Frontend Implementation Report

## Setup
- Tailwind CSS: configured with RTL
- Dark mode: implemented via ThemeService + 'dark' class on <html>

## Folder structure created: [list all files]

## Routes configured: [list all routes]

## Shared components created: [list with inputs/outputs]

## Services created: [list with methods]

## Guards created: [list with logic]

## Known issues / decisions: [list]

## How to run:
- `ng serve` → http://localhost:4200
- Login with: superadmin@gmail.com / super123




🌐 ثانياً: نظام الترجمة الشامل (Internationalization - i18n)
عشان السيستم يقلب من عربي لإنجليزي بالكامل (بما فيها كل كلمة في الجداول والـ Sidebar)، هنستخدم مكتبة @ngx-translate/core. دي أفضل طريقة للأنجيولار.

الأوامر اللي لازم تتنفذ:

Bash
npm install @ngx-translate/core @ngx-translate/http-loader
تعديل الـ Structure للترجمة:

الملفات: هنضيف فولدر جديد src/assets/i18n/ وفيه ملفين:

ar.json: فيه كل الكلمات بالعربي.

en.json: فيه كل الكلمات بالإنجليزي.

الـ Service: هنضيف translation.service.ts في الـ core/services عشان يتحكم في تبديل اللغة وتغيير الـ dir (من rtl لـ ltr).

📂 ثالثاً: التعديلات على هيكلة الملفات (Folder Structure Updates)
بناءً على طلبك، ضيف دول للـ Structure اللي معاك:

src/assets/i18n/ar.json: قاموس الكلمات العربي.

src/assets/i18n/en.json: قاموس الكلمات الإنجليزي.

src/app/core/services/translation.service.ts: لتبديل اللغة والـ Direction.

src/app/core/interceptors/lang.interceptor.ts: عشان يبعت لغة المستخدم للباك إند في كل Request (عشان لو فيه رسائل خطأ تيجي باللغة الصح).

🚀 برومبت معدل للـ IDE (عشان يبدأ صح):
Update on Step 1 & 2:

Theme: Ignore Dark Mode. Use the company colors defined in the tailwind.config.js extension under the company key.

Multi-language: Implement @ngx-translate. Create a dedicated TranslationService that handles:

Language switching (AR/EN).

Dynamically changing document direction (dir="rtl" for AR, dir="ltr" for EN).

Saving language preference in localStorage.

UI Sync: Ensure all shared components (Sidebar, Stats-card, etc.) use translate pipes {{ 'KEY' | translate }} instead of hardcoded text.