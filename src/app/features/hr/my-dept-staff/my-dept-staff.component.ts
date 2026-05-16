import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { firstValueFrom } from 'rxjs';
import { AuthStore } from '../../../core/auth/auth.store';
import { EmployeeService, type Employee } from '../../../data/api/employee.service';

@Component({
  selector: 'app-my-dept-staff',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  template: `
    <div class="min-h-screen bg-gray-50 p-6" dir="rtl">
      <div class="mb-6">
        <h1 class="text-2xl font-bold text-gray-900">
          {{ title() | translate }}
        </h1>
        <p class="text-sm text-gray-500 mt-1">
          {{ 'hr.filteredByDepartment' | translate }}
        </p>
      </div>

      @if (error()) {
        <div class="p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
          {{ error() }}
        </div>
      }

      <div class="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div class="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div class="text-sm text-gray-600">
            {{ 'hr.totalEmployees' | translate }}: <span class="font-semibold text-gray-900">{{ employees().length }}</span>
          </div>
          <button
            (click)="reload()"
            class="px-3 py-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-50 transition">
            <i class="fas fa-sync-alt" [class.animate-spin]="loading()"></i>
          </button>
        </div>

        @if (loading()) {
          <div class="py-14 text-center text-gray-400 text-sm">
            <i class="fas fa-spinner fa-spin text-2xl mb-3 block"></i>
            {{ 'attendance.loading' | translate }}
          </div>
        } @else if (employees().length === 0) {
          <div class="py-14 text-center text-gray-400 text-sm">
            <i class="fas fa-inbox text-2xl mb-3 block"></i>
            {{ 'hr.noEmployees' | translate }}
          </div>
        } @else {
          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead>
                <tr class="bg-gray-50 text-gray-500 text-xs uppercase tracking-wide">
                  <th class="px-6 py-3 text-right font-medium">{{ 'hr.employee' | translate }}</th>
                  <th class="px-6 py-3 text-right font-medium">{{ 'hr.jobTitle' | translate }}</th>
                  <th class="px-6 py-3 text-right font-medium">{{ 'hr.employeeNumber' | translate }}</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-50">
                @for (e of employees(); track e.id) {
                  <tr class="hover:bg-gray-50 transition-colors">
                    <td class="px-6 py-3 font-medium text-gray-900">
                      {{ e.first_name }} {{ e.last_name }}
                    </td>
                    <td class="px-6 py-3 text-gray-600">{{ e.job_title || '—' }}</td>
                    <td class="px-6 py-3 text-gray-500">{{ e.employee_number || '—' }}</td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        }
      </div>
    </div>
  `,
})
export class MyDeptStaffComponent implements OnInit {
  private readonly auth = inject(AuthStore);
  private readonly employeeSvc = inject(EmployeeService);
  private readonly translate = inject(TranslateService);

  readonly loading = signal(false);
  readonly employees = signal<Employee[]>([]);
  readonly error = signal<string | null>(null);

  readonly title = computed(() => {
    const role = (this.auth.role() || '').toLowerCase();
    return role === 'tech_head' ? 'hr.myTeam' : 'hr.myDeptStaff';
  });

  async ngOnInit() {
    await this.reload();
  }

  async reload() {
    this.loading.set(true);
    this.error.set(null);
    try {
      const deptId = this.auth.user()?.department_id;
      if (!deptId) {
        this.employees.set([]);
        this.error.set(this.translate.instant('hr.departmentNotFound'));
        return;
      }

      const res = await firstValueFrom(this.employeeSvc.getEmployees({ department_id: deptId }));
      this.employees.set(res?.data?.employees ?? []);
    } catch (err: any) {
      console.error('MyDeptStaff reload failed:', err);
      this.error.set(err?.error?.message || this.translate.instant('hr.failedToLoadEmployees'));
    } finally {
      this.loading.set(false);
    }
  }
}