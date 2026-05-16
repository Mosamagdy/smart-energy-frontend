import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { AuthStore } from '../../../core/auth/auth.store';
import { AttendanceService } from '../../../data/api/attendance.service';

@Component({
  selector: 'app-employee-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  template: `
    <div class="p-6 bg-linear-to-r from-blue-50 to-indigo-100 min-h-screen" dir="rtl">

      <div class="mb-6 text-center">
        <h1 class="text-3xl font-bold text-gray-900">
          <i class="fas fa-user-clock ml-3 text-blue-600"></i>
          {{ 'attendance.dashboard.title' | translate }}
        </h1>
      </div>

      <div class="bg-white rounded-xl shadow-lg border border-gray-200 p-6 mb-6">

        <div class="flex items-center mb-6">
          <div class="w-24 h-24 bg-linear-to-r from-blue-400 to-indigo-600 rounded-full flex items-center justify-center ml-6">
            <i class="fas fa-user text-4xl text-white"></i>
          </div>
          <div class="flex-1">
            <h2 class="text-2xl font-bold text-gray-900">
              {{ currentUser?.first_name }} {{ currentUser?.last_name }}
            </h2>
            <p class="text-gray-600">{{ currentUser?.employee_number }} • {{ currentUser?.job_title }}</p>
            <div class="mt-2">
              <span
                class="px-3 py-1 rounded-full text-sm font-medium"
                [ngClass]="isClockedIn ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'"
              >
                {{ isClockedIn ? ('attendance.clockedIn' | translate) : ('attendance.notClockedIn' | translate) }}
              </span>
            </div>
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <button
            (click)="handleClockIn()"
            [disabled]="isClockedIn || isLoading"
            class="bg-linear-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-bold py-4 px-6 rounded-xl text-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
          >
            <i class="fas fa-sign-in-alt ml-2"></i>
            {{ 'attendance.clockIn' | translate }}
          </button>
          <button
            (click)="handleClockOut()"
            [disabled]="!isClockedIn || isLoading"
            class="bg-linear-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold py-4 px-6 rounded-xl text-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
          >
            <i class="fas fa-sign-out-alt ml-2"></i>
            {{ 'attendance.clockOut' | translate }}
          </button>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">{{ 'attendance.dashboard.personalNotes' | translate }}</label>
          <textarea
            [(ngModel)]="attendanceNotes"
            (blur)="saveNotes()"
            [placeholder]="'attendance.dashboard.notesPlaceholder' | translate"
            class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition resize-none"
            rows="3"
          ></textarea>
        </div>

        @if (statusMessage) {
          <div
            class="mt-4 p-4 rounded-xl border"
            [ngClass]="statusMessageType === 'success'
              ? 'bg-green-50 text-green-700 border-green-200'
              : 'bg-red-50 text-red-700 border-red-200'"
          >
            <i
              class="fas ml-2"
              [ngClass]="statusMessageType === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'"
            ></i>
            {{ statusMessage }}
          </div>
        }
      </div>

      <div class="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
        <div class="px-6 py-4 border-b border-gray-200 bg-linear-to-r from-blue-50 to-indigo-50">
          <h2 class="text-xl font-semibold text-gray-800">{{ 'attendance.dashboard.personalHistory' | translate }}</h2>
        </div>

        <div class="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">{{ 'attendance.dashboard.fromDate' | translate }}</label>
              <input
                type="date"
                [(ngModel)]="historyStartDate"
                (change)="loadEmployeeHistory()"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">{{ 'attendance.dashboard.toDate' | translate }}</label>
              <input
                type="date"
                [(ngModel)]="historyEndDate"
                (change)="loadEmployeeHistory()"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
              />
            </div>
            <div class="flex items-end">
              <button
                (click)="loadEmployeeHistory()"
                class="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-all"
              >
                <i class="fas fa-search ml-2"></i>
                {{ 'attendance.search' | translate }}
              </button>
            </div>
          </div>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-6 py-4 text-right text-sm font-semibold text-gray-700">{{ 'attendance.date' | translate }}</th>
                <th class="px-6 py-4 text-right text-sm font-semibold text-gray-700">{{ 'attendance.clockInTime' | translate }}</th>
                <th class="px-6 py-4 text-right text-sm font-semibold text-gray-700">{{ 'attendance.clockOutTime' | translate }}</th>
                <th class="px-6 py-4 text-right text-sm font-semibold text-gray-700">{{ 'attendance.hours' | translate }}</th>
                <th class="px-6 py-4 text-right text-sm font-semibold text-gray-700">{{ 'attendance.status' | translate }}</th>
                <th class="px-6 py-4 text-right text-sm font-semibold text-gray-700">{{ 'attendance.notes' | translate }}</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-200">
              @for (record of employeeHistory; track record.id) {
                <tr
                  class="hover:bg-gray-50 transition-colors"
                  [ngClass]="{'bg-red-50': record.status === 'late'}"
                >
                  <td class="px-6 py-4 text-sm text-gray-900">{{ record.attendance_date }}</td>
                  <td class="px-6 py-4 text-sm text-gray-600">{{ formatTime(record.clock_in_time) }}</td>
                  <td class="px-6 py-4 text-sm text-gray-600">{{ formatTime(record.clock_out_time) }}</td>
                  <td class="px-6 py-4 text-sm text-gray-600 font-medium">
                    {{ (+( record.actual_hours || 0)).toFixed(2) }}
                  </td>
                  <td class="px-6 py-4">
                    <span
                      class="px-3 py-1 rounded-full text-sm font-medium"
                      [ngClass]="getStatusClass(record.status)"
                    >
                      {{ getStatusText(record.status) }}
                    </span>
                  </td>
                  <td class="px-6 py-4 text-sm text-gray-600">{{ record.notes || '—' }}</td>
                </tr>
              }
              @empty {
                <tr>
                  <td colspan="6" class="px-6 py-12 text-center text-gray-500">
                    <i class="fas fa-inbox text-4xl mb-4 text-gray-300 block"></i>
                    <p class="text-lg">{{ 'attendance.noRecords' | translate }}</p>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>

    </div>
  `
})
export class EmployeeDashboardComponent implements OnInit {
  private attendanceService = inject(AttendanceService);
  private authStore         = inject(AuthStore);
  private cdr               = inject(ChangeDetectorRef);
  private translate = inject(TranslateService);

  isLoading        = false;
  isHistoryLoading = false;
  isClockedIn      = false;
  statusMessage    = '';
  statusMessageType: 'success' | 'error' = 'success';

  attendanceNotes  = '';
  historyStartDate = '';
  historyEndDate   = '';
  employeeHistory: any[] = [];
  currentUser: any = null;

  ngOnInit(): void {
    const today        = new Date();
    const thirtyAgo    = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
    this.historyEndDate   = today.toISOString().split('T')[0];
    this.historyStartDate = thirtyAgo.toISOString().split('T')[0];

    this.currentUser = this.authStore.user();

    if (this.currentUser?.employee_id) {
      this.loadEmployeeData();
    }
  }

  async loadEmployeeData(): Promise<void> {
    try {
      this.isLoading = true;
      await Promise.all([this.loadEmployeeHistory(), this.checkStatus()]);
    } catch (err) {
      console.error('Failed to load employee data:', err);
    } finally {
      setTimeout(() => { this.isLoading = false; this.cdr.detectChanges(); });
    }
  }

  loadEmployeeHistory(): void {
    if (!this.currentUser?.employee_id) return;
    this.isHistoryLoading = true;

    this.attendanceService
      .getEmployeeAttendanceHistory(
        this.currentUser.employee_id,
        this.historyStartDate,
        this.historyEndDate
      )
      .subscribe({
        next: (res) => {
          setTimeout(() => {
            this.employeeHistory  = res?.data?.records || [];
            this.isHistoryLoading = false;
            this.cdr.detectChanges();
          });
        },
        error: () => {
          setTimeout(() => {
            this.employeeHistory  = [];
            this.isHistoryLoading = false;
            this.cdr.detectChanges();
          });
        }
      });
  }

  async checkStatus(): Promise<void> {
    if (!this.currentUser?.employee_id) return;
    try {
      const res = await this.attendanceService.getStatusSelf().toPromise();
      if (res?.data) {
        setTimeout(() => { this.isClockedIn = res.data.is_clocked_in; this.cdr.detectChanges(); });
      }
    } catch (err) {
      console.error('Failed to check status:', err);
    }
  }

  async handleClockIn(): Promise<void> {
    if (!this.currentUser?.employee_id) return;
    if (!confirm(this.translate.instant('attendance.confirmClockIn'))) return;

    try {
      this.isLoading = true;
      const res = await this.attendanceService.clockInSelf().toPromise();
      if (res) {
        this.showMessage(res.message || this.translate.instant('attendance.clockInSuccess'), 'success');
        this.isClockedIn = true;
        await this.checkStatus();
        this.loadEmployeeHistory();
      }
    } catch (err: any) {
      this.showMessage(err?.error?.message || this.translate.instant('attendance.clockInError'), 'error');
    } finally {
      setTimeout(() => { this.isLoading = false; this.cdr.detectChanges(); });
    }
  }

  async handleClockOut(): Promise<void> {
    if (!this.currentUser?.employee_id) return;
    if (!confirm(this.translate.instant('attendance.confirmClockOut') + this.currentUser.first_name + ' ' + this.currentUser.last_name + this.translate.instant('attendance.confirmClockOutSuffix'))) return;

    try {
      this.isLoading = true;
      const res = await this.attendanceService.clockOutSelf().toPromise();
      if (res) {
        this.showMessage(res.message || this.translate.instant('attendance.clockOutSuccess'), 'success');
        this.isClockedIn = false;
        await this.checkStatus();
        this.loadEmployeeHistory();
      }
    } catch (err: any) {
      this.showMessage(err?.error?.message || this.translate.instant('attendance.clockOutError'), 'error');
    } finally {
      setTimeout(() => { this.isLoading = false; this.cdr.detectChanges(); });
    }
  }

  async saveNotes(): Promise<void> {
    if (!this.currentUser?.employee_id || !this.attendanceNotes.trim()) return;

    try {
      const today = new Date().toISOString().split('T')[0];
      const res   = await this.attendanceService
        .updateAttendanceNotes(this.currentUser.employee_id, today, this.attendanceNotes)
        .toPromise();

      if (res) {
        this.showMessage(res.message || this.translate.instant('attendance.noteSaved'), 'success');
        this.loadEmployeeHistory();
      }
    } catch (err: any) {
      this.showMessage(err?.error?.message || this.translate.instant('attendance.saveNotesError'), 'error');
    }
  }

  private showMessage(msg: string, type: 'success' | 'error'): void {
    setTimeout(() => {
      this.statusMessage     = msg;
      this.statusMessageType = type;
      this.cdr.detectChanges();
    });
  }

  formatTime(timeStr?: string): string {
    if (!timeStr) return '—';
    return new Date(timeStr).toLocaleTimeString(this.translate.currentLang === 'ar' ? 'ar-SA' : 'en-US', { hour: '2-digit', minute: '2-digit' });
  }

  getStatusText(status: string): string {
    const map: Record<string, string> = {
      present:  this.translate.instant('attendance.present'),
      late:     this.translate.instant('attendance.late'),
      absent:   this.translate.instant('attendance.absent'),
      half_day: this.translate.instant('attendance.halfDay'),
      leave:    this.translate.instant('attendance.leave'),
    };
    return map[status] ?? status;
  }

  getStatusClass(status: string): string {
    const map: Record<string, string> = {
      present:  'bg-green-100 text-green-800',
      late:     'bg-yellow-100 text-yellow-800',
      absent:   'bg-red-100 text-red-800',
      half_day: 'bg-blue-100 text-blue-800',
      leave:    'bg-purple-100 text-purple-800',
    };
    return map[status] ?? 'bg-gray-100 text-gray-800';
  }
}
