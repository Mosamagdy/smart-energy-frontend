import {
  Component,
  OnInit,
  inject,
  signal,
  computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { firstValueFrom } from 'rxjs';
import { AuthService } from '../../../core/auth/auth.service';
import { DepartmentsService, Department } from '../../../data/api/departments.service';
import { EmployeeService, Employee } from '../../../data/api/employee.service';
import { AttendanceService } from '../../../data/api/attendance.service';

interface AttendanceRecord {
  id?: number;
  employee_id: number;
  attendance_date: string;
  clock_in_time?: string;
  clock_out_time?: string;
  actual_hours?: number | string;
  overtime_hours?: number;
  late_minutes?: number;
  status: string;
  notes?: string;
}

interface DailyReportRecord {
  employee_id: number;
  employee_first_name?: string;
  employee_last_name?: string;
  clock_in_time?: string;
  clock_out_time?: string;
  actual_hours?: number | string;
  overtime_hours?: number;
  late_minutes?: number;
  status: string;
  notes?: string;
}

@Component({
  selector: 'app-attendance',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  template: `
    <div class="w-full min-w-0 bg-gray-50 p-4 sm:p-6" dir="rtl">

      <div class="mb-8">
        <h1 class="text-2xl font-bold text-gray-900">
          {{ isManager() ? ('attendance.controlCenter' | translate) : ('attendance.myAttendance' | translate) }}
        </h1>
        <p class="text-sm text-gray-500 mt-1">
          {{ isManager() ? ('attendance.todayMasterAttendanceEn' | translate) : ('attendance.myAttendance' | translate) }}
        </p>
      </div>

      @if (currentEmployee()) {
        <div class="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 mb-6">

          <div class="flex items-center gap-4 mb-6">
            <div class="w-14 h-14 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-xl shrink-0">
              {{ currentEmployee()!.first_name.charAt(0) }}{{ currentEmployee()!.last_name.charAt(0) }}
            </div>
            <div>
              <p class="font-semibold text-gray-900 text-lg">
                {{ currentEmployee()!.first_name }} {{ currentEmployee()!.last_name }}
              </p>
              <p class="text-sm text-gray-500">
                {{ currentEmployee()!.employee_number }} · {{ currentEmployee()!.job_title }}
              </p>
            </div>
            <span class="mr-auto px-3 py-1 rounded-full text-xs font-medium"
              [class]="isClockedIn() ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'">
              {{ isClockedIn() ? ('● ' + ('attendance.clockedIn' | translate)) : ('○ ' + ('attendance.notClockedIn' | translate)) }}
            </span>
          </div>

          <div class="grid grid-cols-3 gap-3 mb-5">
            <button
              (click)="handleClockIn(currentEmployee()!.id)"
              [disabled]="!canSelfClock() || isClockedIn() || actionLoading()"
              class="flex flex-col items-center justify-center gap-1 py-4 rounded-xl font-medium text-sm transition-all
                     bg-green-50 text-green-700 border border-green-200
                     hover:bg-green-100 disabled:opacity-40 disabled:cursor-not-allowed">
              <i class="fas fa-sign-in-alt text-lg"></i>
              {{ 'attendance.clockIn' | translate }}
            </button>
            <button
              (click)="handleClockOut(currentEmployee()!.id)"
              [disabled]="!canSelfClock() || !isClockedIn() || actionLoading()"
              class="flex flex-col items-center justify-center gap-1 py-4 rounded-xl font-medium text-sm transition-all
                     bg-orange-50 text-orange-700 border border-orange-200
                     hover:bg-orange-100 disabled:opacity-40 disabled:cursor-not-allowed">
              <i class="fas fa-sign-out-alt text-lg"></i>
              {{ 'attendance.clockOut' | translate }}
            </button>
            <button
              (click)="openNotePrompt(currentEmployee()!.id)"
              [disabled]="actionLoading()"
              class="flex flex-col items-center justify-center gap-1 py-4 rounded-xl font-medium text-sm transition-all
                     bg-blue-50 text-blue-700 border border-blue-200
                     hover:bg-blue-100 disabled:opacity-40 disabled:cursor-not-allowed">
              <i class="fas fa-sticky-note text-lg"></i>
              {{ 'attendance.addNote' | translate }}
            </button>
          </div>

          @if (statusMessage()) {
            <div class="px-4 py-3 rounded-xl text-sm flex items-center gap-2"
              [class]="statusType() === 'success'
                ? 'bg-green-50 text-green-700 border border-green-200'
                : 'bg-red-50 text-red-700 border border-red-200'">
              <i class="fas" [class]="statusType() === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'"></i>
              {{ statusMessage() }}
            </div>
          }
        </div>
      }

      @if (isManager()) {
        <div class="bg-white rounded-2xl border border-gray-200 shadow-sm mb-6 overflow-hidden">

          <div class="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <div>
              <h2 class="font-semibold text-gray-900">{{ 'attendance.todayMasterAttendance' | translate }}</h2>
              <p class="text-xs text-gray-400 mt-0.5">{{ 'attendance.todayMasterAttendanceEn' | translate }}</p>
            </div>
            <div class="flex items-center gap-3">
              <span class="px-2.5 py-1 bg-green-50 text-green-700 text-xs rounded-lg font-medium">
                {{ 'attendance.present' | translate }}: {{ todaySummary().present }}
              </span>
              <span class="px-2.5 py-1 bg-red-50 text-red-600 text-xs rounded-lg font-medium">
                {{ 'attendance.absent' | translate }}: {{ todaySummary().absent }}
              </span>
              <span class="px-2.5 py-1 bg-yellow-50 text-yellow-700 text-xs rounded-lg font-medium">
                {{ 'attendance.late' | translate }}: {{ todaySummary().late }}
              </span>
              <button (click)="loadDailyReport()"
                class="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors">
                <i class="fas fa-sync-alt text-sm" [class.animate-spin]="dailyReportLoading()"></i>
              </button>
            </div>
          </div>

          @if (dailyReportLoading()) {
            <div class="py-16 text-center text-gray-400 text-sm">
              <i class="fas fa-spinner fa-spin text-2xl mb-3 block"></i>
              {{ 'attendance.loading' | translate }}
            </div>
          } @else if (allEmployeesToday().length === 0) {
            <div class="py-16 text-center text-gray-400 text-sm">
              <i class="fas fa-inbox text-2xl mb-3 block"></i>
              {{ 'attendance.noRecordsToday' | translate }}
            </div>
          } @else {
            <div class="overflow-x-auto">
              <table class="w-full text-sm">
                <thead>
                  <tr class="bg-gray-50 text-gray-500 text-xs uppercase tracking-wide">
                    <th class="px-3 py-3 sm:px-6 text-right font-medium">{{ 'attendance.employee' | translate }}</th>
                    <th class="px-3 py-3 sm:px-6 text-right font-medium">{{ 'attendance.clockInTime' | translate }}</th>
                    <th class="px-3 py-3 sm:px-6 text-right font-medium">{{ 'attendance.clockOutTime' | translate }}</th>
                    <th class="px-3 py-3 sm:px-6 text-right font-medium">{{ 'attendance.hours' | translate }}</th>
                    <th class="px-3 py-3 sm:px-6 text-right font-medium">{{ 'attendance.status' | translate }}</th>
                    <th class="px-3 py-3 sm:px-6 text-right font-medium">{{ 'attendance.actions' | translate }}</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-gray-50">
                  @for (emp of allEmployeesToday(); track emp.employee_id) {
                    <tr class="hover:bg-gray-50 transition-colors"
                      [class.bg-red-50]="emp.status === 'absent'">
                      <td class="px-3 py-3 sm:px-6 font-medium text-gray-900">
                        {{ emp.employee_first_name }} {{ emp.employee_last_name }}
                      </td>
                      <td class="px-3 py-3 sm:px-6 text-gray-500">{{ formatTime(emp.clock_in_time) }}</td>
                      <td class="px-3 py-3 sm:px-6 text-gray-500">{{ formatTime(emp.clock_out_time) }}</td>
                      <td class="px-3 py-3 sm:px-6 text-gray-700 font-medium">
                        {{ formatHours(emp.actual_hours) }}
                      </td>
                      <td class="px-3 py-3 sm:px-6">
                        <span class="px-2.5 py-1 rounded-full text-xs font-medium"
                          [class]="getStatusClass(emp.status)">
                          {{ getStatusText(emp.status) }}
                        </span>
                      </td>
                      <td class="px-3 py-3 sm:px-6">
                        @if (emp.clock_in_time && !emp.clock_out_time) {
                          <button (click)="handleClockOut(emp.employee_id)"
                            class="px-3 py-1.5 bg-orange-500 hover:bg-orange-600 text-white text-xs font-medium rounded-lg transition-colors">
                            <i class="fas fa-sign-out-alt mr-1"></i> {{ 'attendance.clockOut' | translate }}
                          </button>
                        } @else {
                          <span class="text-gray-300">—</span>
                        }
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          }
        </div>

        <div class="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 mb-6">
          <h2 class="font-semibold text-gray-900 mb-4">
            {{ 'attendance.manageIndividual' | translate }}
            <span class="text-xs font-normal text-gray-400 mr-2">{{ 'attendance.manageIndividualEn' | translate }}</span>
          </h2>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-medium text-gray-500 mb-1.5">{{ 'attendance.department' | translate }}</label>
              <select [(ngModel)]="selectedDepartmentId" (ngModelChange)="onDepartmentChange($event)"
                class="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition outline-none">
                <option [ngValue]="null">{{ 'attendance.selectDepartment' | translate }}</option>
                @for (dept of departments(); track dept.id) {
                  <option [ngValue]="dept.id">{{ dept.name_ar || dept.name }}</option>
                }
              </select>
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-500 mb-1.5">{{ 'attendance.employee' | translate }}</label>
              <select [(ngModel)]="selectedEmployeeId" (ngModelChange)="onEmployeeChange($event)"
                [disabled]="!selectedDepartmentId"
                class="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition outline-none disabled:opacity-50 disabled:cursor-not-allowed">
                <option [ngValue]="null">{{ 'attendance.selectEmployee' | translate }}</option>
                @for (emp of departmentEmployees(); track emp.id) {
                  <option [ngValue]="emp.id">{{ emp.first_name }} {{ emp.last_name }}</option>
                }
              </select>
            </div>
          </div>

          @if (selectedEmployee()) {
            <div class="mt-5 pt-5 border-t border-gray-100">
              <div class="flex items-center gap-3 mb-4">
                <div class="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-sm shrink-0">
                  {{ selectedEmployee()!.first_name.charAt(0) }}{{ selectedEmployee()!.last_name.charAt(0) }}
                </div>
                <div>
                  <p class="font-medium text-gray-900 text-sm">
                    {{ selectedEmployee()!.first_name }} {{ selectedEmployee()!.last_name }}
                  </p>
                  <p class="text-xs text-gray-400">{{ selectedEmployee()!.job_title }}</p>
                </div>
                <span class="mr-auto text-xs px-2.5 py-1 rounded-full font-medium"
                  [class]="selectedEmployeeClockedIn()
                    ? 'bg-green-100 text-green-700'
                    : 'bg-red-100 text-red-600'">
                  {{ selectedEmployeeClockedIn() ? ('● ' + ('attendance.clockedIn' | translate)) : ('○ ' + ('attendance.notClockedIn' | translate)) }}
                </span>
              </div>
              <div class="flex gap-2">
                <button (click)="handleClockIn(selectedEmployee()!.id)"
                  [disabled]="selectedEmployeeClockedIn() || actionLoading()"
                  class="flex-1 py-2.5 rounded-xl text-sm font-medium transition-all
                         bg-green-50 text-green-700 border border-green-200
                         hover:bg-green-100 disabled:opacity-40 disabled:cursor-not-allowed">
                  <i class="fas fa-sign-in-alt mr-1.5"></i> {{ 'attendance.clockIn' | translate }}
                </button>
                <button (click)="handleClockOut(selectedEmployee()!.id)"
                  [disabled]="!selectedEmployeeClockedIn() || actionLoading()"
                  class="flex-1 py-2.5 rounded-xl text-sm font-medium transition-all
                         bg-orange-50 text-orange-700 border border-orange-200
                         hover:bg-orange-100 disabled:opacity-40 disabled:cursor-not-allowed">
                  <i class="fas fa-sign-out-alt mr-1.5"></i> {{ 'attendance.clockOut' | translate }}
                </button>
                <button (click)="openNotePrompt(selectedEmployee()!.id)"
                  [disabled]="actionLoading()"
                  class="flex-1 py-2.5 rounded-xl text-sm font-medium transition-all
                         bg-blue-50 text-blue-700 border border-blue-200
                         hover:bg-blue-100 disabled:opacity-40 disabled:cursor-not-allowed">
                  <i class="fas fa-sticky-note mr-1.5"></i> {{ 'attendance.addNoteLabel' | translate }}
                </button>
              </div>
            </div>
          }
        </div>
      }

      @if (historyEmployeeId()) {
        <div class="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div class="px-3 py-4 sm:px-6 border-b border-gray-100">
            <h2 class="font-semibold text-gray-900">
              {{ isManager() ? ('attendance.employeeHistory' | translate) : ('attendance.myHistory' | translate) }}
              <span class="text-xs font-normal text-gray-400 mr-2">{{ 'attendance.attendanceHistory' | translate }}</span>
            </h2>
          </div>

          <div class="px-3 py-4 sm:px-6 border-b border-gray-100 bg-gray-50">
            <div class="flex flex-wrap gap-3 items-end">
              <div>
                <label class="block text-xs font-medium text-gray-500 mb-1">{{ 'attendance.from' | translate }}</label>
                <input type="date" [(ngModel)]="historyStartDate"
                  class="px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div>
                <label class="block text-xs font-medium text-gray-500 mb-1">{{ 'attendance.to' | translate }}</label>
                <input type="date" [(ngModel)]="historyEndDate"
                  class="px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <button (click)="loadHistory()"
                class="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors">
                <i class="fas fa-search mr-1.5"></i> {{ 'attendance.search' | translate }}
              </button>
            </div>
          </div>

          @if (historyLoading()) {
            <div class="py-12 text-center text-gray-400 text-sm">
              <i class="fas fa-spinner fa-spin text-xl mb-2 block"></i> {{ 'attendance.loadingHistory' | translate }}
            </div>
          } @else if (employeeHistory().length === 0) {
            <div class="py-12 text-center text-gray-400 text-sm">
              <i class="fas fa-inbox text-xl mb-2 block"></i> {{ 'attendance.noRecords' | translate }}
            </div>
          } @else {
            <div class="overflow-x-auto">
              <table class="w-full text-sm">
                <thead>
                  <tr class="bg-gray-50 text-gray-500 text-xs uppercase tracking-wide">
                    <th class="px-3 py-3 sm:px-6 text-right font-medium">{{ 'attendance.date' | translate }}</th>
                    <th class="px-3 py-3 sm:px-6 text-right font-medium">{{ 'attendance.clockInTime' | translate }}</th>
                    <th class="px-3 py-3 sm:px-6 text-right font-medium">{{ 'attendance.clockOutTime' | translate }}</th>
                    <th class="px-3 py-3 sm:px-6 text-right font-medium">{{ 'attendance.hours' | translate }}</th>
                    <th class="px-3 py-3 sm:px-6 text-right font-medium">{{ 'attendance.status' | translate }}</th>
                    <th class="px-3 py-3 sm:px-6 text-right font-medium">{{ 'attendance.notes' | translate }}</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-gray-50">
                  @for (record of employeeHistory(); track record.attendance_date) {
                    <tr class="hover:bg-gray-50 transition-colors"
                      [class.bg-yellow-50]="record.status === 'late'">
                      <td class="px-3 py-3 sm:px-6 text-gray-700">{{ record.attendance_date }}</td>
                      <td class="px-3 py-3 sm:px-6 text-gray-500">{{ formatTime(record.clock_in_time) }}</td>
                      <td class="px-3 py-3 sm:px-6 text-gray-500">{{ formatTime(record.clock_out_time) }}</td>
                      <td class="px-3 py-3 sm:px-6 font-medium text-gray-700">
                        {{ formatHours(record.actual_hours) }}
                      </td>
                      <td class="px-3 py-3 sm:px-6">
                        <span class="px-2.5 py-1 rounded-full text-xs font-medium"
                          [class]="getStatusClass(record.status)">
                          {{ getStatusText(record.status) }}
                        </span>
                      </td>
                      <td class="px-3 py-3 sm:px-6 text-gray-400">{{ record.notes || '—' }}</td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          }
        </div>
      }

    </div>
  `,
})
export class AttendanceComponent implements OnInit {

  private readonly attendanceSvc = inject(AttendanceService);
  private readonly employeeSvc   = inject(EmployeeService);
  private readonly departmentSvc = inject(DepartmentsService);
  private readonly auth          = inject(AuthService);
  private readonly translate = inject(TranslateService);

  readonly isManager = computed(() =>
    ['super_admin', 'hr_manager'].includes((this.auth.getRole() ?? '').toLowerCase())
  );

  // HR manager: read-only for self (no self clock-in/out).
  canSelfClock(): boolean {
    const role = (this.auth.getRole() ?? '').toLowerCase();
    return ['labor', 'technicians', 'engineer', 'employee', 'sales_rep'].includes(role);
  }

  readonly currentEmployee = signal<Employee | null>(null);
  readonly isClockedIn     = signal(false);

  readonly allEmployeesToday   = signal<DailyReportRecord[]>([]);
  readonly dailyReportLoading  = signal(false);

  readonly todaySummary = computed(() => {
    const r = this.allEmployeesToday();
    return {
      present: r.filter(e => e.status === 'present' || e.status === 'late').length,
      absent:  r.filter(e => e.status === 'absent').length,
      late:    r.filter(e => e.status === 'late').length,
    };
  });

  readonly departments         = signal<Department[]>([]);
  readonly departmentEmployees = signal<Employee[]>([]);
  selectedDepartmentId: number | null = null;
  selectedEmployeeId:   number | null = null;
  readonly selectedEmployee          = signal<Employee | null>(null);
  readonly selectedEmployeeClockedIn = signal(false);

  readonly employeeHistory   = signal<AttendanceRecord[]>([]);
  readonly historyLoading    = signal(false);
  readonly historyEmployeeId = signal<number | null>(null);
  historyStartDate = '';
  historyEndDate   = '';

  readonly actionLoading = signal(false);
  readonly statusMessage = signal('');
  readonly statusType    = signal<'success' | 'error'>('success');

  ngOnInit() {
    const today = new Date();
    const ago30 = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
    this.historyStartDate = ago30.toISOString().split('T')[0];
    this.historyEndDate   = today.toISOString().split('T')[0];
    this.bootstrap();
  }

  private async bootstrap() {
    if (this.isManager()) {
      await Promise.all([
        this.loadDepartments(),
        this.loadDailyReport(),
        this.loadCurrentEmployee(),
      ]);
    } else {
      await this.loadCurrentEmployee();
    }
  }

  private async loadCurrentEmployee() {
    try {
      const res = await firstValueFrom(this.employeeSvc.getCurrentEmployee());
      const emp = res?.data?.employee;
      if (!emp) return;
      this.currentEmployee.set(emp);
      this.historyEmployeeId.set(emp.id);
      await Promise.all([this.refreshMyStatus(), this.loadHistory()]);
    } catch (err) {
      console.error('loadCurrentEmployee failed:', err);
    }
  }

  async loadDailyReport() {
    this.dailyReportLoading.set(true);
    try {
      const res = await firstValueFrom(this.attendanceSvc.getDailyReport());
      this.allEmployeesToday.set(res?.data?.records ?? []);
    } catch (err) {
      console.error('loadDailyReport failed:', err);
    } finally {
      this.dailyReportLoading.set(false);
    }
  }

  private async loadDepartments() {
    try {
      const res = await firstValueFrom(this.departmentSvc.getAllDepartments());
      this.departments.set(res?.data?.departments ?? []);
    } catch (err) {
      console.error('loadDepartments failed:', err);
    }
  }

  async loadHistory() {
    const empId = this.historyEmployeeId();
    if (!empId) return;
    this.historyLoading.set(true);
    try {
      const res = await firstValueFrom(
        this.attendanceSvc.getEmployeeAttendanceHistory(empId, this.historyStartDate, this.historyEndDate)
      );
      this.employeeHistory.set(res?.data?.records ?? []);
    } catch (err) {
      console.error('loadHistory failed:', err);
    } finally {
      this.historyLoading.set(false);
    }
  }

  async onDepartmentChange(deptId: number | null) {
    this.selectedEmployeeId = null;
    this.selectedEmployee.set(null);
    this.departmentEmployees.set([]);
    this.selectedEmployeeClockedIn.set(false);
    if (!deptId) return;
    try {
      const res = await firstValueFrom(this.employeeSvc.getEmployees({ department_id: deptId }));
      this.departmentEmployees.set(res?.data?.employees ?? []);
    } catch (err) {
      console.error('onDepartmentChange failed:', err);
    }
  }

  async onEmployeeChange(empId: number | null) {
    if (!empId) { this.selectedEmployee.set(null); return; }
    const emp = this.departmentEmployees().find(e => e.id === empId) ?? null;
    this.selectedEmployee.set(emp);
    this.historyEmployeeId.set(empId);
    await Promise.all([this.refreshSelectedStatus(), this.loadHistory()]);
  }

  private async refreshMyStatus() {
    const id = this.currentEmployee()?.id;
    if (!id) return;
    try {
      const res = this.isManager()
        ? await firstValueFrom(this.attendanceSvc.getStatus(id))
        : await firstValueFrom(this.attendanceSvc.getStatusSelf());
      this.isClockedIn.set(res?.data?.is_clocked_in ?? false);
    } catch (err) {
      console.error('refreshMyStatus failed:', err);
    }
  }

  private async refreshSelectedStatus() {
    const id = this.selectedEmployee()?.id;
    if (!id) return;
    try {
      const res = await firstValueFrom(this.attendanceSvc.getStatus(id));
      this.selectedEmployeeClockedIn.set(res?.data?.is_clocked_in ?? false);
    } catch (err) {
      console.error('refreshSelectedStatus failed:', err);
    }
  }

  async handleClockIn(employeeId: number) {
    this.actionLoading.set(true);
    this.statusMessage.set('');
    try {
      const res = this.isManager()
        ? await firstValueFrom(this.attendanceSvc.clockIn(employeeId))
        : await firstValueFrom(this.attendanceSvc.clockInSelf());
      this.setStatus(res?.message || this.translate.instant('attendance.clockInSuccess'), 'success');
      await this.afterAction(employeeId);
    } catch (err: any) {
      this.setStatus(err?.error?.message || this.translate.instant('attendance.clockInError'), 'error');
    } finally {
      this.actionLoading.set(false);
    }
  }

  async handleClockOut(employeeId: number) {
    const isOwn     = employeeId === this.currentEmployee()?.id;
    const isSelected = employeeId === this.selectedEmployee()?.id;
    const dailyEmp  = this.allEmployeesToday().find(e => e.employee_id === employeeId);

    const name = isOwn
      ? `${this.currentEmployee()!.first_name} ${this.currentEmployee()!.last_name}`
      : isSelected
        ? `${this.selectedEmployee()!.first_name} ${this.selectedEmployee()!.last_name}`
        : `${dailyEmp?.employee_first_name ?? ''} ${dailyEmp?.employee_last_name ?? ''}`;

    if (!confirm(`${this.translate.instant('attendance.confirmClockOut')} ${name}${this.translate.instant('attendance.confirmClockOutSuffix')}`)) return;

    this.actionLoading.set(true);
    this.statusMessage.set('');
    try {
      const res = this.isManager()
        ? await firstValueFrom(this.attendanceSvc.clockOut(employeeId))
        : await firstValueFrom(this.attendanceSvc.clockOutSelf());
      this.setStatus(res?.message || this.translate.instant('attendance.clockOutSuccess'), 'success');
      await this.afterAction(employeeId);
    } catch (err: any) {
      this.setStatus(err?.error?.message || this.translate.instant('attendance.clockOutError'), 'error');
    } finally {
      this.actionLoading.set(false);
    }
  }

  async openNotePrompt(employeeId: number) {
    const note = prompt(this.translate.instant('attendance.enterNote'));
    if (!note?.trim()) return;
    try {
      const today = new Date().toISOString().split('T')[0];
      await firstValueFrom(this.attendanceSvc.updateAttendanceNotes(employeeId, today, note));
      this.setStatus(this.translate.instant('attendance.noteSaved'), 'success');
      await this.loadHistory();
    } catch (err: any) {
      this.setStatus(err?.error?.message || this.translate.instant('attendance.saveNotesError'), 'error');
    }
  }

  private async afterAction(employeeId: number) {
    const tasks: Promise<any>[] = [this.loadHistory()];
    if (employeeId === this.currentEmployee()?.id)  tasks.push(this.refreshMyStatus());
    if (employeeId === this.selectedEmployee()?.id) tasks.push(this.refreshSelectedStatus());
    if (this.isManager()) tasks.push(this.loadDailyReport());
    await Promise.all(tasks);
  }

  private setStatus(msg: string, type: 'success' | 'error') {
    this.statusMessage.set(msg);
    this.statusType.set(type);
    setTimeout(() => this.statusMessage.set(''), 4000);
  }

  formatTime(val?: string): string {
    if (!val) return '—';
    const d = new Date(val);
    return isNaN(d.getTime()) ? '—' : d.toLocaleTimeString(this.translate.currentLang === 'ar' ? 'ar-EG' : 'en-US', { hour: '2-digit', minute: '2-digit' });
  }

  formatHours(hours?: number | string): string {
    if (hours === undefined || hours === null) return '—';
    const numHours = typeof hours === 'string' ? parseFloat(hours) : hours;
    if (isNaN(numHours)) return '—';
    return numHours.toFixed(2);
  }

  getStatusText(status: string): string {
    const map: Record<string, string> = {
      present: this.translate.instant('attendance.present'),
      late: this.translate.instant('attendance.late'),
      absent: this.translate.instant('attendance.absent'),
      half_day: this.translate.instant('attendance.halfDay'),
      leave: this.translate.instant('attendance.leave'),
    };
    return map[status] ?? status;
  }

  getStatusClass(status: string): string {
    const map: Record<string, string> = {
      present:  'bg-green-100 text-green-700',
      late:     'bg-yellow-100 text-yellow-700',
      absent:   'bg-red-100 text-red-600',
      half_day: 'bg-blue-100 text-blue-700',
      leave:    'bg-purple-100 text-purple-700',
    };
    return map[status] ?? 'bg-gray-100 text-gray-600';
  }
}