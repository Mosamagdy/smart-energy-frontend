import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { environment } from '../../../../environments/environment.prod';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-payment-voucher-detail',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  templateUrl: './payment-voucher-detail.component.html',
  styleUrls: ['./payment-voucher-detail.component.css']
})
export class PaymentVoucherDetailComponent implements OnInit {
  voucher = signal<any>(null);
  paymentHistory = signal<any[]>([]);
  isLoading = signal(true);

  constructor(
    private http: HttpClient,
    private route: ActivatedRoute,
    public router: Router,
    private toast: ToastService
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadVoucher(parseInt(id));
    }
  }

  loadVoucher(id: number): void {
    this.http.get<any>(`${environment.apiUrl}/finance/payment-vouchers/${id}`).subscribe({
      next: (response) => {
        this.voucher.set(response.data);
        this.loadPaymentHistory(response.data.invoice_id);
        this.isLoading.set(false);
      },
      error: () => {
        this.toast.error('فشل في تحميل تفاصيل السند', 3000);
        this.isLoading.set(false);
      }
    });
  }

  loadPaymentHistory(invoiceId: number): void {
    this.http.get<any>(`${environment.apiUrl}/finance/payment-vouchers/invoice/${invoiceId}`).subscribe({
      next: (response) => {
        this.paymentHistory.set(response.data.payments || []);
      },
      error: () => {}
    });
  }

  viewJournalEntry(): void {
    const voucher = this.voucher();
    if (voucher && voucher.journal_entry_id) {
      this.router.navigate(['/accounting/journal-entries', voucher.journal_entry_id]);
    } else {
      this.toast.info('لا يوجد قيد يومية مرتبط', 3000);
    }
  }

  getMethodLabel(method: string): string {
    switch (method) {
      case 'cash': return 'نقدي';
      case 'bank_transfer': return 'تحويل بنكي';
      case 'check': return 'شيك';
      default: return method;
    }
  }

  getStatusBadge(status: string): string {
    switch (status) {
      case 'completed': return 'badge-success';
      case 'draft': return 'badge-warning';
      case 'cancelled': return 'badge-danger';
      default: return 'badge-secondary';
    }
  }

  getStatusLabel(status: string): string {
    switch (status) {
      case 'completed': return 'مكتمل';
      case 'draft': return 'مسودة';
      case 'cancelled': return 'ملغي';
      default: return status;
    }
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'decimal',
      minimumFractionDigits: 2
    }).format(amount) + ' ريال';
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }
}
