import { Component, signal, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment.prod';
import { AuthStore } from '../../../core/auth/auth.store';
import { ToastService } from '../../../core/services/toast.service';
import { TranslateModule } from '@ngx-translate/core';

interface PendingApproval {
  id: number;
  po_number: string;
  project_id: number;
  project_name: string;
  project_status: string;
  supplier_id: number;
  supplier_name: string;
  created_by: number;
  creator_name: string;
  creator_email: string;
  status: string;
  total_amount: number;
  notes: string;
  procurement_notes: string;
  created_at: string;
  items_count: number;
  items?: ApprovalItem[];
  priority: string;
}

interface ApprovalItem {
  id: number;
  item_name: string;
  item_name_ar: string | null;
  item_code?: string;
  quantity: number;
  unit_cost: number;
  total_cost: number;
}

@Component({
  selector: 'app-pending-finance-approvals',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  templateUrl: './pending-finance-approvals.component.html',
  styleUrls: ['./pending-finance-approvals.component.css']
})
export class PendingFinanceApprovalsComponent implements OnInit {
  private http = inject(HttpClient);
  private auth = inject(AuthStore);
  private toast = inject(ToastService);

  approvals = signal<PendingApproval[]>([]);
  loading = signal<boolean>(false);
  selectedApproval = signal<PendingApproval | null>(null);
  showApprovalModal = signal<boolean>(false);
  showRejectionModal = signal<boolean>(false);

  // Plain properties for ngModel compatibility
  rejectionReason = '';
  approvalNotes = '';

  ngOnInit(): void {
    this.loadPendingApprovals();
  }

  loadPendingApprovals(): void {
    this.loading.set(true);

    this.http.get<any>(
      `${environment.apiUrl}/procurement/pending-finance`,
      { headers: { Authorization: `Bearer ${this.auth.token()}` } }
    ).subscribe({
      next: (response) => {
        const approvals = response.data?.approvals || [];
        
        // Log items for debugging
        console.log('[PendingApprovals] Loaded approvals:', approvals.length);
        approvals.forEach((approval: any) => {
          console.log(`[PendingApprovals] ${approval.po_number}:`, {
            items_count: approval.items_count,
            items_loaded: approval.items?.length || 0,
            items: approval.items?.map((item: any) => ({
              name: item.item_name_ar || item.item_name,
              qty: item.quantity,
              cost: item.unit_cost,
              total: item.total_cost
            }))
          });
        });
        
        this.approvals.set(approvals);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Failed to load pending approvals:', err);
        this.toast.error('فشل في تحميل طلبات الموافقة', 3000);
        this.loading.set(false);
      }
    });
  }

  viewDetails(approval: PendingApproval): void {
    this.selectedApproval.set(approval);
  }

  openApprovalModal(approval: PendingApproval): void {
    console.log('[ApprovalModal] Opening modal for:', approval.po_number);
    console.log('[ApprovalModal] Items available:', approval.items?.length || 0);
    
    if (!approval.items || approval.items.length === 0) {
      console.warn('[ApprovalModal] ⚠️ No items found in approval data!');
    } else {
      console.log('[ApprovalModal] Items:', approval.items.map(item => ({
        name: item.item_name_ar || item.item_name,
        quantity: item.quantity,
        unit_cost: item.unit_cost,
        total_cost: item.total_cost
      })));
    }
    
    this.selectedApproval.set(approval);
    this.approvalNotes = '';
    this.showApprovalModal.set(true);
  }

  openRejectionModal(approval: PendingApproval): void {
    this.selectedApproval.set(approval);
    this.rejectionReason = '';
    this.showRejectionModal.set(true);
  }

  approveRequest(): void {
    const approval = this.selectedApproval();
    if (!approval) return;

    this.http.post<any>(
      `${environment.apiUrl}/procurement/approve-by-finance/${approval.id}`,
      { approval_notes: this.approvalNotes || 'موافقة مالية' },
      { headers: { Authorization: `Bearer ${this.auth.token()}` } }
    ).subscribe({
      next: (response) => {
        this.toast.success('✅ تمت الموافقة المالية على أمر الشراء', 4000);
        this.showApprovalModal.set(false);
        this.loadPendingApprovals();
      },
      error: (err) => {
        console.error('Approval failed:', err);
        this.toast.error(err.error?.message || 'فشل في الموافقة', 3000);
      }
    });
  }

  rejectRequest(): void {
    const approval = this.selectedApproval();
    if (!approval) return;

    if (!this.rejectionReason.trim()) {
      this.toast.warning('يجب إدخال سبب الرفض', 3000);
      return;
    }

    this.http.post<any>(
      `${environment.apiUrl}/procurement/reject/${approval.id}`,
      {
        rejection_reason: this.rejectionReason,
        rejection_stage: 'finance'
      },
      { headers: { Authorization: `Bearer ${this.auth.token()}` } }
    ).subscribe({
      next: (response) => {
        this.toast.success('✅ تم رفض أمر الشراء', 3000);
        this.showRejectionModal.set(false);
        this.loadPendingApprovals();
      },
      error: (err) => {
        console.error('Rejection failed:', err);
        this.toast.error(err.error?.message || 'فشل في الرفض', 3000);
      }
    });
  }

  getPriorityColor(priority: string): string {
    const colors: Record<string, string> = {
      'urgent': 'bg-red-100 text-red-700 border-red-300',
      'high': 'bg-orange-100 text-orange-700 border-orange-300',
      'normal': 'bg-blue-100 text-blue-700 border-blue-300',
      'low': 'bg-gray-100 text-gray-700 border-gray-300'
    };
    return colors[priority] || 'bg-gray-100 text-gray-700 border-gray-300';
  }

  getPriorityLabel(priority: string): string {
    const labels: Record<string, string> = {
      'urgent': 'عاجل',
      'high': 'عالي',
      'normal': 'عادي',
      'low': 'منخفض'
    };
    return labels[priority] || priority;
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }
}