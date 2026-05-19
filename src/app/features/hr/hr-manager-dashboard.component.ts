import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { EmployeeService, Employee } from '../../data/api/employee.service';
import { AttendanceService } from '../../data/api/attendance.service';

@Component({
  selector: 'app-hr-manager-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  template: `
    <div class="w-full min-w-0 bg-linear-to-r from-gray-50 to-gray-100 p-4 sm:p-6" dir="rtl">

      <div class="mb-6 text-center">
        <h1 class="text-2xl font-bold break-words text-gray-900 sm:text-3xl">
          <i class="fas fa-users-cog ml-3 text-blue-600"></i>
          {{ 'hrManagerDashboard.title' | translate }}
        </h1>
      </div>

      <div class="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">

        <div class="px-3 py-4 sm:px-6 border-b border-gray-200 bg-linear-to-r from-gray-50 to-gray-100">
          <div class="flex justify-between items-center flex-wrap gap-4">
            <h2 class="text-xl font-semibold text-gray-800">{{ 'hrManagerDashboard.allEmployees' | translate }}</h2>
            <div class="flex gap-3">
              <input
                type="text"
                [(ngModel)]="searchTerm"
                (input)="onSearchChange()"
                [placeholder]="'hrManagerDashboard.searchPlaceholder' | translate"
                class="w-72 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <button
                (click)="loadEmployees()"
                class="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-all"
              >
                <i class="fas fa-sync-alt ml-2"></i>
                {{ 'hrManagerDashboard.refresh' | translate }}
              </button>
            </div>
          </div>
        </div>

        @if (isLoading) {
          <div class="p-6 sm:p-12 flex items-center justify-center">
            <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        }

        @if (!isLoading) {
          <div class="overflow-x-auto">
            <table class="w-full min-w-[720px]">
              <thead class="bg-gray-50">
                <tr>
                  <th class="px-3 py-4 sm:px-6 text-right text-sm font-semibold text-gray-700">{{ 'hrManagerDashboard.columns.employee' | translate }}</th>
                  <th class="px-3 py-4 sm:px-6 text-right text-sm font-semibold text-gray-700">{{ 'hrManagerDashboard.columns.department' | translate }}</th>
                  <th class="px-3 py-4 sm:px-6 text-right text-sm font-semibold text-gray-700">{{ 'hrManagerDashboard.columns.clockInTime' | translate }}</th>
                  <th class="px-3 py-4 sm:px-6 text-right text-sm font-semibold text-gray-700">{{ 'hrManagerDashboard.columns.clockOutTime' | translate }}</th>
                  <th class="px-3 py-4 sm:px-6 text-right text-sm font-semibold text-gray-700">{{ 'hrManagerDashboard.columns.totalHours' | translate }}</th>
                  <th class="px-3 py-4 sm:px-6 text-right text-sm font-semibold text-gray-700">{{ 'hrManagerDashboard.columns.status' | translate }}</th>
                  <th class="px-3 py-4 sm:px-6 text-right text-sm font-semibold text-gray-700">{{ 'hrManagerDashboard.columns.actions' | translate }}</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-200">
                @for (employee of filteredEmployees; track employee.id) {
                  <tr class="hover:bg-gray-50 transition-colors">

                    <td class="px-3 py-4 sm:px-6">
                      <div class="flex items-center gap-3">
                        <div class="w-10 h-10 bg-linear-to-r from-blue-400 to-indigo-600 rounded-full flex items-center justify-center shrink-0">
                          <i class="fas fa-user text-white text-sm"></i>
                        </div>
                        <div>
                          <div class="font-medium text-gray-900 text-sm">
                            {{ employee.first_name }} {{ employee.last_name }}
                          </div>
                          <div class="text-xs text-gray-500">
                            {{ employee.employee_number }} • {{ employee.job_title }}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td class="px-3 py-4 sm:px-6 text-sm text-gray-600">
                      {{ employee.department_name || '—' }}
                    </td>

                    <td class="px-3 py-4 sm:px-6 text-sm text-gray-600">
                      {{ formatTime(employee.clock_in_time) }}
                    </td>

                    <td class="px-3 py-4 sm:px-6 text-sm text-gray-600">
                      {{ formatTime(employee.clock_out_time) }}
                    </td>

                    <td class="px-3 py-4 sm:px-6 text-sm font-medium text-gray-900">
                      {{ (+(employee.total_hours || 0)).toFixed(2) }}
                    </td>

                    <td class="px-3 py-4 sm:px-6">
                      <span
                        class="px-3 py-1 rounded-full text-xs font-semibold"
                        [ngClass]="getStatusClass(employee.attendance_status)"
                      >
                        {{ getStatusText(employee.attendance_status) }}
                      </span>
                    </td>

                    <td class="px-3 py-4 sm:px-6">
                      <div class="flex gap-2">
                        @if (!employee.isClockedIn) {
                          <button
                            (click)="handleClockIn(employee.id)"
                            class="bg-green-600 hover:bg-green-700 text-white text-xs font-medium py-1.5 px-3 rounded-lg transition-all"
                          >
                            <i class="fas fa-sign-in-alt ml-1"></i>
                            {{ 'attendance.clockIn' | translate }}
                          </button>
                        }
                        @if (employee.isClockedIn) {
                          <button
                            (click)="handleClockOut(employee.id)"
                            class="bg-orange-600 hover:bg-orange-700 text-white text-xs font-medium py-1.5 px-3 rounded-lg transition-all"
                          >
                            <i class="fas fa-sign-out-alt ml-1"></i>
                            {{ 'attendance.clockOut' | translate }}
                          </button>
                        }
                      </div>
                    </td>
                  </tr>
                }
                @empty {
                  <tr>
                    <td colspan="7" class="px-6 py-12 text-center text-gray-500">
                      <i class="fas fa-users text-4xl mb-4 text-gray-300 block"></i>
                      <p class="text-lg">{{ 'hrManagerDashboard.noEmployees' | translate }}</p>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        }

      </div>
    </div>
  `
})
export class HRManagerDashboardComponent implements OnInit {
  private employeeService   = inject(EmployeeService);
  private attendanceService = inject(AttendanceService);
  private cdr               = inject(ChangeDetectorRef);
  private translate         = inject(TranslateService);

  isLoading = false;
  searchTerm = '';

  employees: (Employee & { isClockedIn?: boolean; attendance_status?: string; clock_in_time?: string; clock_out_time?: string; total_hours?: number })[] = [];

  get filteredEmployees() {
    const term = this.searchTerm.trim().toLowerCase();
    if (!term) return this.employees;
    return this.employees.filter(e =>
      `${e.first_name} ${e.last_name}`.toLowerCase().includes(term) ||
      String(e.employee_number ?? '').toLowerCase().includes(term)
    );
  }

  ngOnInit(): void {
    this.loadEmployees();
  }

  async loadEmployees(): Promise<void> {
    try {
      this.isLoading = true;
      const res = await this.employeeService.getEmployees().toPromise();
      if (res?.data?.employees) {
        setTimeout(() => {
          this.employees = res.data.employees;
          this.cdr.detectChanges();
        });
      }
    } catch (err) {
      console.error('Failed to load employees:', err);
    } finally {
      setTimeout(() => { this.isLoading = false; this.cdr.detectChanges(); });
    }
  }

  onSearchChange(): void {
  }

  async handleClockIn(employeeId: number): Promise<void> {
    const emp = this.employees.find(e => e.id === employeeId);
    if (!emp) return;
    
    const confirmMsg = this.translate.instant('hrManagerDashboard.confirmClockIn', { name: `${emp.first_name} ${emp.last_name}` });
    if (!confirm(confirmMsg)) return;

    try {
      await this.attendanceService.clockIn(employeeId).toPromise();
      emp.isClockedIn = true;
      setTimeout(() => this.cdr.detectChanges());
    } catch (err) {
      console.error('Clock in failed:', err);
    }
  }

  async handleClockOut(employeeId: number): Promise<void> {
    const emp = this.employees.find(e => e.id === employeeId);
    if (!emp) return;
    
    const confirmMsg = this.translate.instant('hrManagerDashboard.confirmClockOut', { name: `${emp.first_name} ${emp.last_name}` });
    if (!confirm(confirmMsg)) return;

    try {
      await this.attendanceService.clockOut(employeeId).toPromise();
      emp.isClockedIn = false;
      setTimeout(() => this.cdr.detectChanges());
    } catch (err) {
      console.error('Clock out failed:', err);
    }
  }

  formatTime(timeStr?: string): string {
    if (!timeStr) return '—';
    return new Date(timeStr).toLocaleTimeString(
      this.translate.currentLang === 'ar' ? 'ar-SA' : 'en-US',
      { hour: '2-digit', minute: '2-digit' }
    );
  }

  getStatusText(status?: string): string {
    const map: Record<string, string> = {
      present:  this.translate.instant('attendance.present'),
      late:     this.translate.instant('attendance.late'),
      absent:   this.translate.instant('attendance.absent'),
      half_day: this.translate.instant('attendance.halfDay'),
      leave:    this.translate.instant('attendance.leave'),
    };
    return map[status ?? ''] ?? (status || '—');
  }

  getStatusClass(status?: string): string {
    const map: Record<string, string> = {
      present:  'bg-green-100 text-green-800',
      late:     'bg-yellow-100 text-yellow-800',
      absent:   'bg-red-100 text-red-800',
      half_day: 'bg-blue-100 text-blue-800',
      leave:    'bg-purple-100 text-purple-800',
    };
    return map[status ?? ''] ?? 'bg-gray-100 text-gray-800';
  }
}