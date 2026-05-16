import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LeaveService, LeaveBalance, LeaveRequest, CreateLeaveRequestDto, UpdateLeaveStatusDto } from '../../../data/api/leave.service';
import { AuthStore } from '../../../core/auth/auth.store';
import { EmployeeService, Employee } from '../../../data/api/employee.service';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-leave',
  standalone: true,
  imports: [CommonModule, FormsModule ,TranslateModule],
  templateUrl: './leave.component.html'
})
export class LeaveComponent implements OnInit {
  private leaveService = inject(LeaveService);
  private authStore = inject(AuthStore);
  private employeeService = inject(EmployeeService);

  isLoading = false;
  isSubmitting = false;
  isProcessingApproval = false;
  isLoadingAll = false;
  calculatedDays = 0;
  currentEmployeeId = 0;
  approvalComment = '';
  rejectionReason = '';

  activeTab = signal<'balance' | 'my-requests' | 'pending'>('balance');
  showApprovalModal = signal(false);
  selectedRequest = signal<LeaveRequest | null>(null);

  balances = signal<LeaveBalance[]>([]);
  myRequests = signal<LeaveRequest[]>([]);
  allRequests = signal<LeaveRequest[]>([]);
  allEmployees = signal<Employee[]>([]);

  pendingRequests = computed(() =>
    this.allRequests().filter(r =>
      r.status === 'pending' || r.status === 'dept_head_approved'
    )
  );

  requestForm: CreateLeaveRequestDto = {
    leave_type: '',
    start_date: '',
    end_date: '',
    reason: '',
    document_url: ''
  };

  get annualBalance(): LeaveBalance | undefined {
    return this.balances().find(b => b.leave_type === 'annual');
  }

  get sickBalance(): LeaveBalance | undefined {
    return this.balances().find(b => b.leave_type === 'sick');
  }

  isManager(): boolean {
    const role = this.authStore.role();
    return ['super_admin', 'general_manager', 'hr_manager', 'dept_head'].includes(role || '');
  }

  isHrManager(): boolean {
    return (this.authStore.role() || '').toLowerCase() === 'hr_manager';
  }

  ngOnInit() {
    this.loadAllEmployees();
    // HR Manager must not request / view own balances/requests
    if (!this.isHrManager()) {
      this.loadBalances();
      this.loadMyRequests();
    } else {
      this.activeTab.set('pending');
    }
    if (this.isManager()) {
      this.loadAllRequests();
    }
  }

  async loadAllEmployees() {
    try {
      const res = await this.employeeService.getEmployees().toPromise();
      if (res?.data?.employees) {
        setTimeout(() => {
          this.allEmployees.set(res.data.employees);
          this.findCurrentEmployee();
        }, 0);
      }
    } catch (err) {
      console.error('Failed to load employees:', err);
    }
  }

  findCurrentEmployee() {
    const userId = Number(this.authStore.user()?.id);
    const emp = this.allEmployees().find(e => e.user_id === userId);
    if (emp) {
      this.currentEmployeeId = emp.id;
    }
  }

  async loadBalances() {
    try {
      const res = await this.leaveService.getMyLeaveBalances().toPromise();
      if (res?.data?.balances) {
        setTimeout(() => {
          this.balances.set(res.data.balances);
        }, 0);
      }
    } catch (err) {
      console.error('Failed to load balances:', err);
    }
  }

  async loadMyRequests() {
    try {
      this.isLoading = true;
      const res = await this.leaveService.getMyLeaveRequests().toPromise();
      if (res?.data?.leaves) {
        setTimeout(() => {
          this.myRequests.set(res.data.leaves);
        }, 0);
      }
    } catch (err) {
      console.error('Failed to load requests:', err);
    } finally {
      this.isLoading = false;
    }
  }

  async loadAllRequests() {
    try {
      this.isLoadingAll = true;
      const res = await this.leaveService.getAllLeaveRequests().toPromise();
      if (res?.data?.leaves) {
        const employees = this.allEmployees();
        const requestsWithNames = res.data.leaves.map(req => {
          const emp = employees.find(e => e.id === req.employee_id);
          return {
            ...req,
            first_name: emp?.first_name,
            last_name: emp?.last_name,
            department_name: (emp as any)?.department_name
          };
        });
        setTimeout(() => {
          this.allRequests.set(requestsWithNames.sort((a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          ));
        }, 0);
      }
    } catch (err) {
      console.error('Failed to load all requests:', err);
    } finally {
      this.isLoadingAll = false;
    }
  }

  calculateDays() {
    if (!this.requestForm.start_date || !this.requestForm.end_date) {
      this.calculatedDays = 0;
      return;
    }

    const start = new Date(this.requestForm.start_date);
    const end = new Date(this.requestForm.end_date);
    let count = 0;
    let current = new Date(start);

    while (current <= end) {
      const day = current.getDay();
      if (day !== 5 && day !== 6) {
        count++;
      }
      current.setDate(current.getDate() + 1);
    }

    this.calculatedDays = count;
  }

  getAnnualPercentage(): number {
    const total = this.annualBalance?.total_allowed || 21;
    const used = this.annualBalance?.used || 0;
    return (used / total) * 100;
  }

  getSickPercentage(): number {
    const total = this.sickBalance?.total_allowed || 10;
    const used = this.sickBalance?.used || 0;
    return (used / total) * 100;
  }

  totalUsedDays(): number {
    return (this.annualBalance?.used || 0) + (this.sickBalance?.used || 0);
  }

  getRemainingBalance(): number {
    if (this.requestForm.leave_type === 'annual') {
      return this.annualBalance?.remaining || 0;
    } else if (this.requestForm.leave_type === 'sick') {
      return this.sickBalance?.remaining || 0;
    }
    return 999;
  }

  hasInsufficientBalance(): boolean {
    if (!this.requestForm.leave_type || this.calculatedDays === 0) {
      return false;
    }
    if (this.requestForm.leave_type === 'unpaid') {
      return false;
    }
    return this.calculatedDays > this.getRemainingBalance();
  }

  async submitRequest() {
    try {
      this.isSubmitting = true;

      const requestData: CreateLeaveRequestDto = { ...this.requestForm };

      const res = await this.leaveService.createLeaveRequest(requestData).toPromise();
      if (res) {
        alert('تم تقديم طلب الإجازة بنجاح!');
        this.requestForm = {
          leave_type: '',
          start_date: '',
          end_date: '',
          reason: '',
          document_url: ''
        };
        this.calculatedDays = 0;
        this.loadBalances();
        this.loadMyRequests();
        if (this.isManager()) {
          this.loadAllRequests();
        }
      }
    } catch (err: any) {
      alert(err?.error?.message || 'حدث خطأ أثناء تقديم الطلب');
    } finally {
      this.isSubmitting = false;
    }
  }

  openApprovalModal(request: LeaveRequest) {
    this.selectedRequest.set(request);
    this.approvalComment = '';
    this.rejectionReason = '';
    this.showApprovalModal.set(true);
  }

  closeApprovalModal() {
    this.showApprovalModal.set(false);
    this.selectedRequest.set(null);
    this.approvalComment = '';
    this.rejectionReason = '';
  }

  async approveRequest() {
    if (!this.selectedRequest()) return;

    try {
      this.isProcessingApproval = true;
      const data: UpdateLeaveStatusDto = {
        status: 'approved',
        rejection_reason: undefined
      };
      const res = await this.leaveService.updateLeaveStatus(this.selectedRequest()!.id, data).toPromise();
      if (res) {
        alert('تمت الموافقة على طلب الإجازة!');
        this.closeApprovalModal();
        this.loadBalances();
        this.loadMyRequests();
        this.loadAllRequests();
      }
    } catch (err: any) {
      alert(err?.error?.message || 'حدث خطأ أثناء الموافقة');
    } finally {
      this.isProcessingApproval = false;
    }
  }

  async rejectRequest() {
    if (!this.selectedRequest()) return;
    if (!this.rejectionReason.trim()) {
      alert('يرجى إدخال سبب الرفض');
      return;
    }

    try {
      this.isProcessingApproval = true;
      const data: UpdateLeaveStatusDto = {
        status: 'rejected',
        rejection_reason: this.rejectionReason
      };
      const res = await this.leaveService.updateLeaveStatus(this.selectedRequest()!.id, data).toPromise();
      if (res) {
        alert('تم رفض طلب الإجازة!');
        this.closeApprovalModal();
        this.loadBalances();
        this.loadMyRequests();
        this.loadAllRequests();
      }
    } catch (err: any) {
      alert(err?.error?.message || 'حدث خطأ أثناء الرفض');
    } finally {
      this.isProcessingApproval = false;
    }
  }

  getLeaveTypeLabel(type: string): string {
    const map: Record<string, string> = {
      'annual': 'إجازة سنوية',
      'sick': 'إجازة مرضية',
      'unpaid': 'إجازة بدون راتب'
    };
    return map[type] || type;
  }

  getStatusLabel(status: string): string {
    const map: Record<string, string> = {
      'pending': 'قيد الانتظار',
      'dept_head_approved': 'موافق مبدئياً',
      'approved': 'موافق نهائياً',
      'rejected': 'مرفوض'
    };
    return map[status] || status;
  }

  getStatusClass(status: string): string {
    const map: Record<string, string> = {
      'pending': 'bg-yellow-100 text-yellow-800',
      'dept_head_approved': 'bg-blue-100 text-blue-800',
      'approved': 'bg-green-100 text-green-800',
      'rejected': 'bg-red-100 text-red-800'
    };
    return map[status] || 'bg-gray-100 text-gray-800';
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('ar-SA');
  }
}