import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ClientPortalService, ClientQuotation } from '../../../data/api/client-portal.service';
import { ToastService } from '../../../core/services/toast.service';
import { FormsModule } from '@angular/forms'; 
@Component({
  selector: 'app-client-quotations',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './client-quotations.component.html',
  styleUrls: ['./client-quotations.component.css']
})
export class ClientQuotationsComponent implements OnInit {
  private clientService = inject(ClientPortalService);
  private router = inject(Router);
  private toast = inject(ToastService);

  quotations = signal<ClientQuotation[]>([]);
  loading = signal(true);
  selectedQuotation = signal<ClientQuotation | null>(null);
  showResponseModal = signal(false);
  rejectionReason = '';
  responding = signal(false);

  ngOnInit(): void {
    this.loadQuotations();
  }

  loadQuotations(): void {
    this.loading.set(true);
    this.clientService.getMyQuotations().subscribe({
      next: (response) => {
        const quotations = response.data.map((q: any) => ({
          ...q,
          total_price: Number(q.total_price),
          discount: Number(q.discount),
          tax: Number(q.tax)
        }));
        this.quotations.set(quotations);
        this.loading.set(false);
      },
      error: (err) => {
        this.toast.error('فشل في تحميل عروض الأسعار');
        this.loading.set(false);
      }
    });
  }

  viewDetails(quotation: ClientQuotation): void {
    this.selectedQuotation.set(quotation);
  }

  openResponseModal(quotation: ClientQuotation): void {
    this.selectedQuotation.set(quotation);
    this.showResponseModal.set(true);
    this.rejectionReason = '';
  }

  respondToQuotation(response: 'client_approved' | 'client_rejected'): void {
    const quotation = this.selectedQuotation();
    if (!quotation) return;

    if (response === 'client_rejected' && !this.rejectionReason.trim()) {
      this.toast.error('يرجى ذكر سبب الرفض');
      return;
    }

    this.responding.set(true);
    this.clientService.respondToQuotation(quotation.id, {
      status: response,
      rejection_reason: response === 'client_rejected' ? this.rejectionReason : undefined
    }).subscribe({
      next: () => {
        this.responding.set(false);
        this.showResponseModal.set(false);
        this.selectedQuotation.set(null);
        this.rejectionReason = '';
        
        const message = response === 'client_approved' 
          ? 'تم قبول عرض السعر بنجاح' 
          : 'تم رفض عرض السعر';
        this.toast.success(message);
        
        this.loadQuotations();
      },
      error: (err) => {
        this.responding.set(false);
        this.toast.error(err.error?.message || 'فشل في الرد على العرض');
      }
    });
  }

  getStatusBadgeClass(status: string): string {
    const classes: Record<string, string> = {
      'pending_finance_review': 'bg-gray-100 text-gray-800',
      'pending_gm_approval': 'bg-yellow-100 text-yellow-800',
      'gm_approved': 'bg-blue-100 text-blue-800',
      'sent_to_client': 'bg-purple-100 text-purple-800',
      'client_approved': 'bg-green-100 text-green-800',
      'client_rejected': 'bg-red-100 text-red-800'
    };
    return classes[status] || 'bg-gray-100 text-gray-800';
  }

  getStatusText(status: string): string {
    const texts: Record<string, string> = {
      'pending_finance_review': 'قيد المراجعة المالية',
      'pending_gm_approval': 'بانتظار اعتماد المدير العام',
      'gm_approved': 'معتمد من المدير العام',
      'sent_to_client': 'مرسل للعميل',
      'client_approved': 'مقبول',
      'client_rejected': 'مرفوض'
    };
    return texts[status] || status;
  }

  getPaymentStatusText(status: string): string {
    const texts: Record<string, string> = {
      'pending': 'بانتظار الدفع',
      'awaiting_downpayment': 'بانتظار الدفعة الأولى',
      'downpayment_received': 'تم استلام الدفعة الأولى',
      'fully_paid': 'مدفوع بالكامل'
    };
    return texts[status] || status;
  }

  formatPrice(price: number): string {
    return new Intl.NumberFormat('ar-EG', {
      style: 'currency',
      currency: 'EGP',
      minimumFractionDigits: 0
    }).format(price);
  }

  calculateTax(quotation: any): number {
    const total = quotation?.total_price || 0;
    const discount = quotation?.discount || 0;
    const taxRate = quotation?.tax || 0;
    return (total - discount) * (taxRate / 100);
  }

  calculateFinalPrice(quotation: any): number {
    const total = quotation?.total_price || 0;
    const discount = quotation?.discount || 0;
    const tax = this.calculateTax(quotation);
    return total - discount + tax;
  }

  closeModal(): void {
    this.showResponseModal.set(false);
    this.selectedQuotation.set(null);
    this.rejectionReason = '';
  }
}
