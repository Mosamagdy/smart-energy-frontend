import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { AuthStore } from '../../../core/auth/auth.store';
import { environment } from '../../../../environments/environment.prod';
import { LeaveService, LeaveRequest } from '../../../data/api/leave.service';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';

type OnLeaveRecord = {
  leave_request_id: number;
  employee_id: number;
  leave_type: string;
  start_date: string;
  end_date: string;
  days_count: number;
  status: string;
  first_name: string;
  last_name: string;
  employee_number: string;
  department_id: number;
  department_name: string;
};

@Component({
  selector: 'app-employees-on-leave',
  standalone: true,
  imports: [CommonModule, TranslateModule , FormsModule],
template: `
  <div class="min-h-screen bg-gray-50 p-6" dir="rtl">
    <div class="mb-6">
      <h1 class="text-2xl font-bold text-gray-900">{{ 'hr.leaveRequests' | translate }}</h1>
    </div>

    <div class="mb-6 bg-white p-2 rounded-xl shadow-sm border border-gray-100 flex gap-3">
      <button
        (click)="activeTab.set('pending')"
        class="flex-1 px-6 py-3 rounded-lg font-semibold transition-all"
        [class.bg-blue-600]="activeTab() === 'pending'"
        [class.text-white]="activeTab() === 'pending'"
        [class.bg-gray-50]="activeTab() !== 'pending'"
        [class.text-gray-600]="activeTab() !== 'pending'"
      >
        طلبات الإجازة (Pending Requests)
        @if (pendingRequests().length > 0) {
          <span class="mr-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full">
            {{ pendingRequests().length }}
          </span>
        }
      </button>

      <button
        (click)="activeTab.set('on_leave')"
        class="flex-1 px-6 py-3 rounded-lg font-semibold transition-all"
        [class.bg-blue-600]="activeTab() === 'on_leave'"
        [class.text-white]="activeTab() === 'on_leave'"
        [class.bg-gray-50]="activeTab() !== 'on_leave'"
        [class.text-gray-600]="activeTab() !== 'on_leave'"
      >
        الموظفين في إجازة حالياً (Employees on Leave)
      </button>
    </div>

    @if (error()) {
      <div class="p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
        {{ error() }}
      </div>
    }

    <div class="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      <div class="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
        <div class="text-sm text-gray-600">
          @if (activeTab() === 'pending') {
            {{ 'leaves.tabs.pending' | translate }}:
            <span class="font-semibold text-gray-900">{{ pendingRequests().length }}</span>
          } @else {
            {{ 'hr.totalEmployees' | translate }}:
            <span class="font-semibold text-gray-900">{{ records().length }}</span>
          }
        </div>
        <button
          (click)="reload()"
          class="px-3 py-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-50 transition">
          <i class="fas fa-sync-alt" [class.animate-spin]="loading() || pendingLoading()"></i>
        </button>
      </div>

      @if ((activeTab() === 'pending' && pendingLoading()) || (activeTab() === 'on_leave' && loading())) {
        <div class="py-14 text-center text-gray-400 text-sm">
          <i class="fas fa-spinner fa-spin text-2xl mb-3 block"></i>
          {{ 'attendance.loading' | translate }}
        </div>
      } @else if (activeTab() === 'pending' && pendingRequests().length === 0) {
        <div class="py-14 text-center text-gray-400 text-sm">
          <i class="fas fa-inbox text-2xl mb-3 block"></i>
          {{ 'leaves.empty.noPendingRequests' | translate }}
        </div>
      } @else if (activeTab() === 'on_leave' && records().length === 0) {
        <div class="py-14 text-center text-gray-400 text-sm">
          <i class="fas fa-inbox text-2xl mb-3 block"></i>
          {{ 'hr.noEmployeesOnLeave' | translate }}
        </div>
      } @else {
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="bg-gray-50 text-gray-500 text-xs uppercase tracking-wide">
                <th class="px-6 py-3 text-right font-medium">{{ 'leaves.table.employee' | translate }}</th>
                <th class="px-6 py-3 text-right font-medium">{{ 'leaves.table.leaveType' | translate }}</th>
                <th class="px-6 py-3 text-right font-medium">{{ 'leaves.table.from' | translate }}</th>
                <th class="px-6 py-3 text-right font-medium">{{ 'leaves.table.to' | translate }}</th>
                <th class="px-6 py-3 text-right font-medium">{{ 'leaves.table.days' | translate }}</th>
                <th class="px-6 py-3 text-right font-medium">{{ 'leaves.table.status' | translate }}</th>
                @if (activeTab() === 'pending') {
                  <th class="px-6 py-3 text-right font-medium">{{ 'leaves.table.actions' | translate }}</th>
                }
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-50">
              @if (activeTab() === 'pending') {
                @for (r of pendingRequests(); track r.id) {
                  <tr class="hover:bg-gray-50 transition-colors cursor-pointer">
                    <td class="px-6 py-3 font-medium text-gray-900">
                      {{ r.first_name }} {{ r.last_name }} <span class="text-gray-400">(#{{ r.employee_number || '—' }})</span>
                    </td>
                    <td class="px-6 py-3 text-gray-700">{{ leaveTypeLabel(r.leave_type) }}</td>
                    <td class="px-6 py-3 text-gray-500">{{ formatDate(r.start_date) }}</td>
                    <td class="px-6 py-3 text-gray-500">{{ formatDate(r.end_date) }}</td>
                    <td class="px-6 py-3 text-gray-500">{{ r.days_count || '—' }}</td>
                    <td class="px-6 py-3">
                      <span class="px-3 py-1 rounded-full text-xs font-semibold" [ngClass]="getStatusClass(r.status)">
                        {{ r.status_arabic || getStatusLabel(r.status) }}
                      </span>
                    </td>
                    <td class="px-6 py-3">
                      <button
                        (click)="openApprovalModal(r)"
                        class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all text-xs font-medium">
                        {{ 'leaves.actions.review' | translate }}
                      </button>
                    </td>
                  </tr>
                }
              } @else {
                @for (r of records(); track r.leave_request_id) {
                  <tr class="hover:bg-gray-50 transition-colors">
                    <td class="px-6 py-3 font-medium text-gray-900">
                      {{ r.first_name }} {{ r.last_name }} <span class="text-gray-400">(#{{ r.employee_number || '—' }})</span>
                    </td>
                    <td class="px-6 py-3 text-gray-700">{{ leaveTypeLabel(r.leave_type) }}</td>
                    <td class="px-6 py-3 text-gray-500">{{ formatDate(r.start_date) }}</td>
                    <td class="px-6 py-3 text-gray-500">{{ formatDate(r.end_date) }}</td>
                    <td class="px-6 py-3 text-gray-500">{{ r.days_count || '—' }}</td>
                    <td class="px-6 py-3">
                      <span class="px-3 py-1 rounded-full text-xs font-semibold" [ngClass]="getStatusClass(r.status)">
                        {{ getStatusLabel(r.status) }}
                      </span>
                    </td>
                  </tr>
                }
              }
            </tbody>
          </table>
        </div>
      }
    </div>

    @if (showApprovalModal()) {
      <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div class="bg-white rounded-2xl shadow-2xl w-full max-w-lg">

          <div class="px-8 py-6 border-b border-gray-100">
            <h3 class="text-2xl font-bold text-gray-900">
              <i class="fas fa-file-alt ml-2 text-blue-600"></i>
              {{ 'leaves.modal.title' | translate }}
            </h3>
          </div>

          @if (selectedRequest()) {
            <div class="p-8 space-y-4">
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <span class="text-sm text-gray-500">{{ 'leaves.modal.employee' | translate }}</span>
                  <p class="font-semibold text-gray-900">{{ selectedRequest()?.first_name }} {{ selectedRequest()?.last_name }}</p>
                </div>
                <div>
                  <span class="text-sm text-gray-500">{{ 'leaves.modal.leaveType' | translate }}</span>
                  <p class="font-semibold text-gray-900">{{ leaveTypeLabel(selectedRequest()?.leave_type || '') }}</p>
                </div>
                <div>
                  <span class="text-sm text-gray-500">{{ 'leaves.modal.startDate' | translate }}</span>
                  <p class="font-semibold text-gray-900">{{ formatDate(selectedRequest()?.start_date || '') }}</p>
                </div>
                <div>
                  <span class="text-sm text-gray-500">{{ 'leaves.modal.endDate' | translate }}</span>
                  <p class="font-semibold text-gray-900">{{ formatDate(selectedRequest()?.end_date || '') }}</p>
                </div>
                <div>
                  <span class="text-sm text-gray-500">{{ 'leaves.modal.daysCount' | translate }}</span>
                  <p class="font-semibold text-gray-900">{{ selectedRequest()?.days_count }} {{ 'leaves.cards.days' | translate }}</p>
                </div>
              </div>

              <div>
                <label class="block text-sm font-semibold text-gray-700 mb-2">
                  {{ 'leaves.modal.rejectionReason' | translate }}
                  <span class="text-gray-400 font-normal text-xs">{{ 'leaves.modal.rejectionReasonRequired' | translate }}</span>
                </label>
                <textarea
                  [(ngModel)]="rejectionReason"
                  rows="2"
                  class="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 resize-none"
                  [placeholder]="'leaves.modal.rejectionPlaceholder' | translate">
                </textarea>
              </div>
            </div>
          }

          <div class="px-8 py-6 border-t border-gray-100 flex gap-4">
            <button
              (click)="closeApprovalModal()"
              class="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-all">
              {{ 'leaves.actions.cancel' | translate }}
            </button>
            <button
              (click)="rejectRequest()"
              [disabled]="isProcessingApproval() || !rejectionReason.trim()"
              class="flex-1 px-6 py-3 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 disabled:opacity-50 transition-all">
              <i class="fas fa-times ml-2"></i>
              {{ isProcessingApproval() ? ('leaves.actions.processing' | translate) : ('leaves.actions.reject' | translate) }}
            </button>
            <button
              (click)="approveRequest()"
              [disabled]="isProcessingApproval()"
              class="flex-1 px-6 py-3 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 disabled:opacity-50 transition-all">
              <i class="fas fa-check ml-2"></i>
              {{ isProcessingApproval() ? ('leaves.actions.processing' | translate) : ('leaves.actions.approve' | translate) }}
            </button>
          </div>

        </div>
      </div>
    }

  </div>
`,
})
export class EmployeesOnLeaveComponent implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly auth = inject(AuthStore);
  private readonly translate = inject(TranslateService);
  private readonly leaveService = inject(LeaveService);

  readonly loading = signal(false);
  readonly pendingLoading = signal(false);
  readonly records = signal<OnLeaveRecord[]>([]);
  readonly pendingRequests = signal<LeaveRequest[]>([]);
  readonly error = signal<string | null>(null);
  readonly activeTab = signal<'pending' | 'on_leave'>('pending');

  // ✅ Approval Modal
  readonly showApprovalModal = signal(false);
  readonly selectedRequest = signal<LeaveRequest | null>(null);
  readonly isProcessingApproval = signal(false);
  rejectionReason = '';

  readonly token = computed(() => this.auth.token());

  async ngOnInit() {
    await this.reload();
  }

  async reload() {
    this.error.set(null);
    await Promise.all([this.loadPendingRequests(), this.loadEmployeesOnLeave()]);
  }

  private async loadEmployeesOnLeave() {
    this.loading.set(true);
    try {
      const res: any = await this.http.get(
        `${environment.apiUrl}/leaves/on-leave`,
        { headers: { Authorization: `Bearer ${this.token()}` } }
      ).toPromise();
      this.records.set(res?.data?.records ?? []);
    } catch (err: any) {
      console.error('EmployeesOnLeave loadEmployeesOnLeave failed:', err);
      this.error.set(err?.error?.message || this.translate.instant('hr.failedToLoadEmployees'));
      this.records.set([]);
    } finally {
      this.loading.set(false);
    }
  }

  private async loadPendingRequests() {
    this.pendingLoading.set(true);
    try {
      const response = await this.leaveService.getAllLeaveRequests().toPromise();
      const requests = response?.data?.leaves ?? [];
      this.pendingRequests.set(
        requests.filter(r => r.status === 'pending' || r.status === 'dept_head_approved')
      );
    } catch (err: any) {
      console.error('EmployeesOnLeave loadPendingRequests failed:', err);
      this.error.set(err?.error?.message || this.translate.instant('hr.failedToLoadEmployees'));
      this.pendingRequests.set([]);
    } finally {
      this.pendingLoading.set(false);
    }
  }

  // ✅ Modal Functions
  openApprovalModal(request: LeaveRequest): void {
    this.selectedRequest.set(request);
    this.rejectionReason = '';
    this.showApprovalModal.set(true);
  }

  closeApprovalModal(): void {
    this.showApprovalModal.set(false);
    this.selectedRequest.set(null);
    this.rejectionReason = '';
  }

  async approveRequest(): Promise<void> {
    if (!this.selectedRequest()) return;
    try {
        this.isProcessingApproval.set(true);  // ✅
      await this.leaveService.updateLeaveStatus(
        this.selectedRequest()!.id,
        { status: 'approved' }
      ).toPromise();
      this.closeApprovalModal();
      await this.reload();
    } catch (err: any) {
      this.error.set(err?.error?.message || 'فشل الموافقة على الطلب');
    } finally {
      this.isProcessingApproval.set(false);  // ✅
    }
  }

  async rejectRequest(): Promise<void> {
    if (!this.selectedRequest() || !this.rejectionReason.trim()) return;
    try {
      this.isProcessingApproval.set(true);  // ✅
      await this.leaveService.updateLeaveStatus(
        this.selectedRequest()!.id,
        { status: 'rejected', rejection_reason: this.rejectionReason }
      ).toPromise();
      this.closeApprovalModal();
      await this.reload();
    } catch (err: any) {
      this.error.set(err?.error?.message || 'فشل رفض الطلب');
    } finally {
      this.isProcessingApproval.set(false);  // ✅
    }
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('ar-SA');
  }

  leaveTypeLabel(type: string): string {
    const map: Record<string, string> = {
      annual: 'إجازة سنوية',
      sick: 'إجازة مرضية',
      emergency: 'إجازة طارئة',
      unpaid: 'إجازة بدون راتب',
      maternity: 'إجازة أمومة',
      paternity: 'إجازة أبوة',
    };
    return map[(type || '').toLowerCase()] || type || '—';
  }

  getStatusClass(status: string): string {
    const map: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      dept_head_approved: 'bg-blue-100 text-blue-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
    };
    return map[status] || 'bg-gray-100 text-gray-800';
  }

  getStatusLabel(status: string): string {
    const map: Record<string, string> = {
      pending: 'قيد الانتظار',
      dept_head_approved: 'موافق مبدئياً',
      approved: 'موافق نهائياً',
      rejected: 'مرفوض',
    };
    return map[status] || status || '—';
  }
}