import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { TranslateModule } from '@ngx-translate/core';
import { environment } from '../../../../environments/environment.prod';
import { AuthStore } from '../../../core/auth/auth.store';

interface Employee {
  id: number;
  employee_number: string;
  first_name: string;
  last_name: string;
  arabic_name?: string;
  department_id: number;
  department_name: string;
  dept_type?: string;
  basic_salary: number;
  housing_allowance: number;
  transport_allowance: number;
  other_allowances: number;
  nationality?: string;
  status: string;
  gosi_registered?: boolean;
  payroll_status?: boolean;
}

interface PayrollLine {
  employee: Employee;
  basic: number;
  housing: number;
  transport: number;
  other: number;
  gosi_employee: number;
  gosi_employer: number;
  gross: number;
  net: number;
  selected: boolean;
  isApproved: boolean;  // TASK 3: Flag for disabled checkboxes
}

interface DepartmentGroup {
  department_id: number;
  department_name: string;
  dept_type: string;
  account_code: string;
  employees: PayrollLine[];
  total_basic: number;
  total_housing: number;
  total_transport: number;
  total_other: number;
  total_gosi_employee: number;
  total_gosi_employer: number;
  total_gross: number;
  total_net: number;
}

@Component({
  selector: 'app-payroll',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  template: `
   <div class="p-6 pb-32">
  <!-- Header -->
  <div class="mb-6 flex items-center justify-between">
    <div>
      <h1 class="text-3xl font-bold text-gray-900">{{ 'payroll.title' | translate }}</h1>
      <p class="text-gray-600 mt-2">{{ 'payroll.subtitle' | translate }}</p>
    </div>
    <div class="flex gap-3 items-center">
      <!-- TASK 6-A: Export to Excel Button -->
      <button
        (click)="exportToExcel()"
        [disabled]="loading()"
        class="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-lg transition shadow-lg">
        <i class="fas fa-file-excel mr-2"></i>
        {{ 'payroll.exportExcel' | translate }}
      </button>
      
      <!-- Month/Year Filter -->
      <select
        [(ngModel)]="selectedMonth"
        (change)="checkPayrollStatus()"
        class="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500">
        <option *ngFor="let m of [1,2,3,4,5,6,7,8,9,10,11,12]" [value]="m">
          {{ ('payroll.month.' + m) | translate }}
        </option>
      </select>
      <input
        type="number"
        [(ngModel)]="selectedYear"
        (change)="checkPayrollStatus()"
        class="px-4 py-2 border border-gray-300 rounded-lg w-24 focus:ring-2 focus:ring-green-500"
        min="2020"
        max="2030"
      />
      <button
        (click)="loadEmployees()"
        class="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition">
        <i class="fas fa-sync-alt mr-2"></i>
        {{ 'payroll.refresh' | translate }}
      </button>
    </div>
  </div>

  <!-- Loading State -->
  @if (loading()) {
    <div class="flex items-center justify-center py-12">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
    </div>
  }

  <!-- Error State -->
  @if (error()) {
    <div class="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
      <p class="text-red-700">{{ error() }}</p>
    </div>
  }

  <!-- Success Notification -->
  @if (successMessage()) {
    <div class="bg-green-50 border-l-4 border-green-500 p-4 mb-6">
      <p class="text-green-700 font-semibold">{{ successMessage() }}</p>
    </div>
  }

  <!-- Summary Cards -->
  @if (!loading() && payrollData().length > 0) {
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      <div class="bg-white rounded-lg shadow p-4">
        <div class="text-sm text-gray-600">{{ 'payroll.totalEmployees' | translate }}</div>
        <div class="text-2xl font-bold text-blue-600 mt-2">{{ selectedEmployees().length }}</div>
      </div>
      <div class="bg-white rounded-lg shadow p-4">
        <div class="text-sm text-gray-600">{{ 'payroll.totalBasicSalary' | translate }}</div>
        <div class="text-2xl font-bold text-green-600 mt-2">{{ totalBasic().toFixed(2) }} SAR</div>
      </div>
      <div class="bg-white rounded-lg shadow p-4">
        <div class="text-sm text-gray-600">{{ 'payroll.totalAllowances' | translate }}</div>
        <div class="text-2xl font-bold text-purple-600 mt-2">{{ totalAllowances().toFixed(2) }} SAR</div>
      </div>
      <div class="bg-white rounded-lg shadow p-4">
        <div class="text-sm text-gray-600">{{ 'payroll.totalNetSalary' | translate }}</div>
        <div class="text-2xl font-bold text-orange-600 mt-2">{{ totalNet().toFixed(2) }} SAR</div>
      </div>
    </div>

    <!-- Department Groups -->
    @for (deptGroup of groupedPayroll(); track deptGroup.department_id) {
      <div class="bg-white rounded-lg shadow mb-6">
        <!-- Department Header -->
        <div class="bg-linear-to-r from-green-500 to-green-600 text-white px-6 py-4 rounded-t-lg">
          <div class="flex items-center justify-between">
            <div>
              <h2 class="text-xl font-bold">{{ deptGroup.department_name }}</h2>
              <p class="text-sm text-green-100 mt-1">
                {{ 'payroll.account' | translate }}: {{ deptGroup.account_code }} | {{ 'payroll.employeesCount' | translate }}: {{ deptGroup.employees.length }}
              </p>
            </div>
            <div class="text-right flex items-center gap-4">
              <!-- Status Badge - Only show if APPROVED -->
              <div *ngIf="payrollStatus()[deptGroup.department_id]" class="px-3 py-1 bg-white text-green-600 rounded-full text-sm font-semibold">
                <i class="fas fa-check-circle mr-1"></i>
                {{ 'payroll.approved' | translate }}
              </div>
              <div>
                <div class="text-sm">{{ 'payroll.total' | translate }}</div>
                <div class="text-2xl font-bold">{{ deptGroup.total_net.toFixed(2) }} SAR</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Employee Table -->
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                  <input
                    type="checkbox"
                    [checked]="areAllSelected(deptGroup)"
                    (change)="toggleDepartment(deptGroup)"
                    class="h-4 w-4"
                  />
                </th>
                <th class="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">{{ 'payroll.employeeNumber' | translate }}</th>
                <th class="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">{{ 'payroll.employeeName' | translate }}</th>
                <th class="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">{{ 'payroll.insurance' | translate }}</th>
                <th class="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">{{ 'payroll.basicSalary' | translate }}</th>
                <th class="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">{{ 'payroll.housingAllowance' | translate }}</th>
                <th class="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">{{ 'payroll.otherAllowances' | translate }}</th>
                <th class="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">{{ 'payroll.gosi' | translate }}</th>
                <th class="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">{{ 'payroll.netSalary' | translate }}</th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              @for (line of deptGroup.employees; track line.employee.id) {
                <tr class="hover:bg-gray-50" [class.bg-green-50]="line.selected && !line.isApproved">
                  <td class="px-4 py-3 text-center">
                    <input
                      type="checkbox"
                      [(ngModel)]="line.selected"
                      [disabled]="line.isApproved"
                      (change)="onSelectionChange()"
                      class="h-4 w-4"
                      [class.opacity-50]="line.isApproved"
                      [class.cursor-not-allowed]="line.isApproved"
                    />
                  </td>
                  <td class="px-4 py-3 text-sm text-right font-medium text-gray-900">
                    {{ line.employee.employee_number }}
                  </td>
                  <td class="px-4 py-3 text-sm text-right text-gray-900">
                    {{ line.employee.arabic_name || (line.employee.first_name + ' ' + line.employee.last_name) }}
                  </td>
                  <td class="px-4 py-3 text-center">
                    @if (line.employee.gosi_registered) {
                      <span class="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">
                        ✅ {{ 'payroll.registered' | translate }}
                      </span>
                    } @else {
                      <span class="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-semibold">
                        ⏳ {{ 'payroll.notRegistered' | translate }}
                      </span>
                    }
                  </td>
                  <td class="px-4 py-3 text-sm text-right font-mono">{{ line.basic.toFixed(2) }}</td>
                  <td class="px-4 py-3 text-sm text-right font-mono">{{ line.housing.toFixed(2) }}</td>
                  <td class="px-4 py-3 text-sm text-right font-mono">{{ line.other.toFixed(2) }}</td>
                  <td class="px-4 py-3 text-sm text-right font-mono text-red-600">{{ line.gosi_employee.toFixed(2) }}</td>
                  <td class="px-4 py-3 text-sm text-right font-mono font-bold text-green-600">{{ line.net.toFixed(2) }}</td>
                </tr>
              }
            </tbody>
            <!-- Department Totals -->
            <tfoot class="bg-gray-50 font-semibold">
              <tr>
                <td colspan="3" class="px-4 py-3 text-right">{{ 'payroll.total' | translate }}</td>
                <td class="px-4 py-3 text-right font-mono">{{ deptGroup.total_basic.toFixed(2) }}</td>
                <td class="px-4 py-3 text-right font-mono">{{ deptGroup.total_housing.toFixed(2) }}</td>
                <td class="px-4 py-3 text-right font-mono">{{ deptGroup.total_other.toFixed(2) }}</td>
                <td class="px-4 py-3 text-right font-mono text-red-600">{{ deptGroup.total_gosi_employee.toFixed(2) }}</td>
                <td class="px-4 py-3 text-right font-mono text-green-600">{{ deptGroup.total_net.toFixed(2) }}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    }
  }

  <!-- Empty State -->
  @if (!loading() && payrollData().length === 0 && !error()) {
    <div class="bg-white rounded-lg shadow p-12 text-center">
      <i class="fas fa-users text-6xl text-gray-300 mb-4"></i>
      <p class="text-gray-600 text-lg">{{ 'payroll.noActiveEmployees' | translate }}</p>
      <p class="text-gray-500 mt-2">{{ 'payroll.noActiveEmployeesDesc' | translate }}</p>
    </div>
  }

  <!-- FLOATING APPROVE & POST BUTTON -->
  <div class="fixed bottom-8 right-8 z-50">
    <button
      (click)="approveAndPost()"
      [disabled]="selectedEmployees().length === 0 || posting() || allSelectedDeptsApproved()"
      class="px-10 py-5 bg-linear-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 disabled:from-gray-400 disabled:to-gray-500 text-white rounded-full shadow-2xl hover:shadow-3xl transition-all font-bold text-lg disabled:cursor-not-allowed transform hover:scale-105 disabled:transform-none">
      @if (posting()) {
        <i class="fas fa-spinner fa-spin mr-3"></i>
        {{ 'payroll.posting' | translate }}
      } @else if (allSelectedDeptsApproved()) {
        <i class="fas fa-check-circle mr-3"></i>
        {{ 'payroll.alreadyPosted' | translate }}
      } @else {
        <i class="fas fa-check-double mr-3"></i>
        {{ 'payroll.approveAndPost' | translate }} {{ selectedEmployees().length }} {{ 'payroll.employeesNew' | translate }}
      }
    </button>
  </div>
</div>
  `
})
export class PayrollComponent implements OnInit {
  private http = inject(HttpClient);
  private authStore = inject(AuthStore);

  loading = signal(false);
  error = signal<string | null>(null);
  successMessage = signal<string | null>(null);
  posting = signal(false);
  employees = signal<Employee[]>([]);
  payrollData = signal<PayrollLine[]>([]);
  
  // Current month filter
  selectedMonth = signal<number>(new Date().getMonth() + 1);
  selectedYear = signal<number>(new Date().getFullYear());
  payrollStatus = signal<Record<number, boolean>>({});

  // Department to 7-digit Account mapping (7 Core Services only)
  private deptAccountMap: Record<number, string> = {
    23: '31306',  // كفاءة الطاقة
    28: '31301',  // الأتمتة الصناعية
    45: '31302',  // التحول الرقمي
    46: '31303',  // التنفيذ والتشغيل
    47: '31304',  // البنية التحتية
    48: '31305',  // المباني الذكية
    49: '31307',  // الطاقة المتجددة
    // All other departments → Admin
    12: '3220003', 16: '3220003', 17: '3220003', 18: '3220003',
    19: '3220003', 20: '3220003', 21: '3220003', 22: '3220003',
    26: '3220003', 30: '3220003'
  };

  ngOnInit() {
    this.loadEmployees();
    this.checkPayrollStatus();
  }

  // Check payroll status for current month
  checkPayrollStatus() {
    const month = this.selectedMonth();
    const year = this.selectedYear();
    
    
    this.http.get<any>(
      `${environment.apiUrl}/payroll/status?month=${month}&year=${year}`,
      {
        headers: { Authorization: `Bearer ${this.authStore.token() as string}` }
      }
    ).subscribe({
      next: (response) => {
        const statusMap: Record<number, boolean> = {};
        
        // Response is now array of { department_id, department_name, payroll_status }
        const departments = Array.isArray(response?.data) ? response.data : [];
        
        
        departments.forEach((dept: any) => {
          if (dept.department_id && dept.payroll_status === true) {
            statusMap[dept.department_id] = true;
          }
        });
        
        this.payrollStatus.set(statusMap);
      },
      error: (err) => {
        // Frontend Resilience - Default to 'Pending' on error
        this.payrollStatus.set({}); // Empty = all pending
      }
    });
  }

  loadEmployees() {
    this.loading.set(true);
    this.error.set(null);
    this.successMessage.set(null);

    this.http.get<any>(`${environment.apiUrl}/hr/employees`, {
      headers: { Authorization: `Bearer ${this.authStore.token() as string}` }
    }).subscribe({
      next: (response) => {
        
        // Robust data handling - extract employees array from any response format
        let emps: any[] = [];
        
        if (Array.isArray(response)) {
          emps = response;
        } else if (response.data && Array.isArray(response.data)) {
          emps = response.data;
        } else if (response.data && response.data.employees && Array.isArray(response.data.employees)) {
          emps = response.data.employees;
        } else if (response.employees && Array.isArray(response.employees)) {
          emps = response.employees;
        }
        
        
        // Safety check: ensure we have an array before filtering
        if (!Array.isArray(emps)) {
          console.error('ERROR: emps is not an array!', emps);
          emps = [];
        }
        
        // Filter active employees with departments
        const activeEmployees = emps.filter((e: any) => e.status === 'active' && e.department_id);
                
        this.employees.set(activeEmployees);
        this.calculatePayroll(activeEmployees);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error loading employees:', err);
        this.error.set('فشل في تحميل بيانات الموظفين - Failed to load employees');
        this.loading.set(false);
      }
    });
  }

  calculatePayroll(emps: Employee[]) {
    const payrollLines: PayrollLine[] = emps.map(emp => {
      const basic = parseFloat(String(emp.basic_salary || 0));
      const housing = parseFloat(String(emp.housing_allowance || 0));
      const transport = parseFloat(String(emp.transport_allowance || 0));  // Kept for backward compatibility
      const other = parseFloat(String(emp.other_allowances || 0));

      // GOSI calculation - ONLY if gosi_registered = TRUE
      const gosi_employee = emp.gosi_registered ? basic * 0.0975 : 0;  // 9.75% of basic
      const gosi_employer = emp.gosi_registered ? basic * 0.12 : 0;    // 12% of basic

      // TASK 4-A: Gross Salary = Basic + Housing + Other (NO Transport)
      const gross = basic + housing + other;
      const net = gross - gosi_employee;

      // TASK 3: Smart Checkbox Logic
      // Approved employees (payroll_status == true): Disabled & Unchecked
      // Pending employees (payroll_status == false): Enabled & Checked by default
      const isApproved = emp.payroll_status === true;
      
      return {
        employee: emp,
        basic,
        housing,
        transport,
        other,
        gosi_employee: parseFloat(gosi_employee.toFixed(2)),
        gosi_employer: parseFloat(gosi_employer.toFixed(2)),
        gross: parseFloat(gross.toFixed(2)),
        net: parseFloat(net.toFixed(2)),
        selected: !isApproved,  // Pending = checked, Approved = unchecked
        isApproved: isApproved  // Flag for UI to disable checkbox
      };
    });

    this.payrollData.set(payrollLines);
  }

  getMonthName(month: number): string {
    const months = [
      '', 'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
      'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
    ];
    return months[month] || '';
  }

  groupedPayroll = computed<DepartmentGroup[]>(() => {
    const data = this.payrollData();
    const groups: Record<number, DepartmentGroup> = {};

    data.forEach(line => {
      const deptId = line.employee.department_id;
      if (!groups[deptId]) {
        groups[deptId] = {
          department_id: deptId,
          department_name: line.employee.department_name,
          dept_type: line.employee.dept_type || 'administrative',
          account_code: this.deptAccountMap[deptId] || '3220003',
          employees: [],
          total_basic: 0,
          total_housing: 0,
          total_transport: 0,
          total_other: 0,
          total_gosi_employee: 0,
          total_gosi_employer: 0,
          total_gross: 0,
          total_net: 0
        };
      }

      groups[deptId].employees.push(line);
      groups[deptId].total_basic += line.basic;
      groups[deptId].total_housing += line.housing;
      groups[deptId].total_transport += line.transport;
      groups[deptId].total_other += line.other;
      groups[deptId].total_gosi_employee += line.gosi_employee;
      groups[deptId].total_gosi_employer += line.gosi_employer;
      groups[deptId].total_gross += line.gross;
      groups[deptId].total_net += line.net;
    });

    // Round totals
    Object.values(groups).forEach(group => {
      group.total_basic = parseFloat(group.total_basic.toFixed(2));
      group.total_housing = parseFloat(group.total_housing.toFixed(2));
      group.total_transport = parseFloat(group.total_transport.toFixed(2));
      group.total_other = parseFloat(group.total_other.toFixed(2));
      group.total_gosi_employee = parseFloat(group.total_gosi_employee.toFixed(2));
      group.total_gosi_employer = parseFloat(group.total_gosi_employer.toFixed(2));
      group.total_gross = parseFloat(group.total_gross.toFixed(2));
      group.total_net = parseFloat(group.total_net.toFixed(2));
    });

    return Object.values(groups).sort((a, b) => a.department_id - b.department_id);
  });

  selectedEmployees = computed<PayrollLine[]>(() => {
    // TASK 3: Only count PENDING employees (not approved)
    return this.payrollData().filter(line => line.selected && !line.isApproved);
  });

  // Check if all selected departments are already approved
  allSelectedDeptsApproved = computed<boolean>(() => {
    const selected = this.selectedEmployees();
    if (selected.length === 0) return false;
    
    // Get unique department IDs from selected employees
    const selectedDeptIds = new Set(selected.map(line => line.employee.department_id));
    const statusMap = this.payrollStatus();
    
    // Check if ALL selected departments have been approved
    return Array.from(selectedDeptIds).every(deptId => statusMap[deptId] === true);
  });

  totalBasic = computed(() => {
    return this.selectedEmployees().reduce((sum, line) => sum + line.basic, 0);
  });

  totalAllowances = computed(() => {
    // TASK 4-A: Exclude transport from allowances calculation
    return this.selectedEmployees().reduce((sum, line) => sum + line.housing + line.other, 0);
  });

  totalNet = computed(() => {
    return this.selectedEmployees().reduce((sum, line) => sum + line.net, 0);
  });

  areAllSelected(group: DepartmentGroup): boolean {
    // TASK 3: Only check pending employees (approved ones are always unchecked)
    const pendingEmployees = group.employees.filter(emp => !emp.isApproved);
    return pendingEmployees.length > 0 && pendingEmployees.every(emp => emp.selected);
  }

  toggleDepartment(group: DepartmentGroup) {
    // TASK 3: Toggle only pending employees, skip approved ones
    const allSelected = this.areAllSelected(group);
    group.employees.forEach(emp => {
      if (!emp.isApproved) {
        // Only toggle pending employees
        emp.selected = !allSelected;
      }
    });
    this.onSelectionChange();
  }

  onSelectionChange() {
    this.payrollData.set([...this.payrollData()]);
  }

  approveAndPost() {
    const selected = this.selectedEmployees();
    if (selected.length === 0) {
      this.error.set('يرجى اختيار موظف واحد على الأقل');
      return;
    }

    this.posting.set(true);
    this.error.set(null);
    this.successMessage.set(null);

    // Group by department
    const byDept: Record<number, PayrollLine[]> = {};
    selected.forEach(line => {
      const deptId = line.employee.department_id;
      if (!byDept[deptId]) byDept[deptId] = [];
      byDept[deptId].push(line);
    });

    // Create journal entries for each department
    const promises: Promise<any>[] = [];

    Object.entries(byDept).forEach(([deptId, lines]) => {
      const accountCode = this.deptAccountMap[parseInt(deptId)] || '3220003';
      const deptName = lines[0].employee.department_name;

      // Calculate totals
      let totalBasic = 0, totalHousing = 0, totalOther = 0, totalGross = 0;
      lines.forEach(line => {
        totalBasic += line.basic;
        totalHousing += line.housing;
        // TASK 4-A: Transport excluded from new calculations
        totalOther += line.other;
        totalGross += line.gross;  // gross already excludes transport
      });

      const payload = {
        department_id: parseInt(deptId),
        department_name: deptName,
        account_code: accountCode,
        employees: lines.map(line => ({
          employee_id: line.employee.id,
          employee_number: line.employee.employee_number,
          employee_name: line.employee.arabic_name || `${line.employee.first_name} ${line.employee.last_name}`,
          basic_salary: line.basic,
          housing_allowance: line.housing,
          transport_allowance: 0,  // TASK 4-A: Always 0 for new payroll entries
          other_allowances: line.other,
          gosi_employee: line.gosi_employee,
          gosi_employer: line.gosi_employer,
          net_salary: line.net
        })),
        totals: {
          basic_salary: parseFloat(totalBasic.toFixed(2)),
          housing_allowance: parseFloat(totalHousing.toFixed(2)),
          transport_allowance: 0,  // TASK 4-A: Always 0 for new payroll entries
          other_allowances: parseFloat(totalOther.toFixed(2)),
          gross_salary: parseFloat(totalGross.toFixed(2))
        },
        auto_post: true,
        payroll_month: this.selectedMonth(),
        payroll_year: this.selectedYear()
      };

      promises.push(
        this.http.post(
          `${environment.apiUrl}/payroll/approve-and-post`,
          payload,
          {
            headers: { Authorization: `Bearer ${this.authStore.token() as string}` }
          }
        ).toPromise()
      );
    });

    Promise.all(promises).then(results => {
      this.posting.set(false);
      const successCount = results.filter(r => r.success).length;
      
      // Show success message
      this.successMessage.set(`✅ تم ترحيل ${successCount} قيد بنجاح! Successfully posted ${successCount} journal entries!`);
      
      // TASK 3: Immediately update UI to disable checkboxes for approved employees
      console.log('[Payroll] Updating UI state after successful post...');
      
      // Mark all successfully posted employees as approved in the UI
      const updatedData = this.payrollData().map(line => {
        if (line.selected) {
          // This employee was just approved, disable their checkbox
          return { ...line, selected: false, isApproved: true };
        }
        return line;
      });
      
      this.payrollData.set(updatedData);
      
      // Also refresh status from backend
      this.checkPayrollStatus();
      
      // Reload to refresh data from server
      this.loadEmployees();
    }).catch((err: HttpErrorResponse) => {
      this.posting.set(false);
      
      // Handle 409 Conflict (duplicate posting)
      if (err.status === 409) {
        const errorMsg = err.error?.message || err.error?.error || 'تم اعتماد رواتب هذا القسم مسبقاً لهذا الشهر ✅';
        this.error.set(errorMsg);
      } else {
        this.error.set('فشل في ترحيل القيود - Failed to post journal entries');
        console.error('Error posting payroll:', err);
      }
    });
  }

  // TASK 6-A: Export Payroll to Excel
  exportToExcel(): void {
    console.log('[Payroll Export] Exporting to Excel...');
    
    const month = this.selectedMonth();
    const year = this.selectedYear();
    
    // Call backend export endpoint
    const url = `${environment.apiUrl}/payroll/export/excel?month=${month}&year=${year}`;
    
    // Create a hidden anchor element to trigger download
    const link = document.createElement('a');
    link.href = url;
    link.download = `Payroll_${year}_${String(month).padStart(2, '0')}.xlsx`;
    
    // Add authorization header by fetching with auth
    this.http.get(url, {
      headers: { Authorization: `Bearer ${this.authStore.token() as string}` },
      responseType: 'blob' // Important: expect binary data
    }).subscribe({
      next: (blob) => {
        // Create object URL from blob
        const objectUrl = URL.createObjectURL(blob);
        link.href = objectUrl;
        
        // Trigger download
        link.click();
        
        // Clean up
        URL.revokeObjectURL(objectUrl);
        
        console.log('[Payroll Export] ✅ Excel file downloaded successfully');
        this.successMessage.set('✅ تم تصدير ملف Excel بنجاح - Excel file exported successfully');
      },
      error: (err) => {
        console.error('[Payroll Export] ❌ Failed to export Excel:', err);
        this.error.set('فشل في تصدير ملف Excel - Failed to export Excel file');
      }
    });
  }
}
