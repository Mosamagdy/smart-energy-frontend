import { Component, OnInit, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { environment } from '../../../../../environments/environment.prod';
import { ToastService } from '../../../../core/services/toast.service';
import { firstValueFrom } from 'rxjs';

interface VoucherDetail {
  id: number;
  voucher_no: string;
  receipt_date: string;
  client_name: string;
  client_email: string;
  amount: number;
  payment_method: string;
  payment_account_code: string;
  payment_account_name: string;
  reference_no: string | null;
  description: string | null;
  status: string;
  created_by_name: string;
  posted_at: string | null;
  created_at: string;
  invoices?: LinkedInvoice[];
}

interface LinkedInvoice {
  id: number;
  invoice_number: string;
  amount_applied: number;
  issue_date: string;
  total_amount: number;
  payment_status: string;
}

interface JournalEntry {
  id: number;
  entry_number: string;
  entry_date: string;
  description: string;
  is_posted: boolean;
  lines: JournalLine[];
}

interface JournalLine {
  id: number;
  account_code: string;
  account_name: string;
  debit_amount: number;
  credit_amount: number;
  description: string;
}

@Component({
  selector: 'app-receipt-voucher-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, TranslateModule],
  templateUrl: './receipt-voucher-detail.component.html',
  styleUrl: './receipt-voucher-detail.component.css'
})
export class ReceiptVoucherDetailComponent implements OnInit {
  private http = inject(HttpClient);
  private toast = inject(ToastService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  voucher = signal<VoucherDetail | null>(null);
  invoices = signal<LinkedInvoice[]>([]);
  journalEntry = signal<JournalEntry | null>(null);
  isLoading = signal(false);

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadVoucherDetail(parseInt(id));
    }
  }

  async loadVoucherDetail(id: number): Promise<void> {
    this.isLoading.set(true);
    try {
      console.log(`[Voucher Detail] Loading voucher ID: ${id}`);
      
      const response: any = await firstValueFrom(
        this.http.get(`${environment.apiUrl}/finance/receipt-vouchers/${id}`)
      );
      
      console.log('[Voucher Detail] Voucher data:', response.data);
      this.voucher.set(response.data);
      
      if (response.data && response.data.invoices) {
        this.invoices.set(response.data.invoices);
        console.log(`[Voucher Detail] Loaded ${response.data.invoices.length} linked invoices`);
      }
      
    } catch (error: any) {
      console.error('[Voucher Detail] Error:', error);
      this.toast.error('فشل تحميل تفاصيل السند');
      this.router.navigate(['/finance/receipt-vouchers']);
    } finally {
      this.isLoading.set(false);
    }
  }

  // ✅ Helper functions to safely access voucher properties (avoid null errors in template)
  getVoucherNumber(): string {
    return this.voucher()?.voucher_no || '-';
  }

  getClientName(): string {
    return this.voucher()?.client_name || '-';
  }

  getAmount(): number {
    return this.voucher()?.amount || 0;
  }

  getPaymentMethod(): string {
    return this.voucher()?.payment_method || '';
  }

  getReceiptDate(): string | null {
    return this.voucher()?.receipt_date || null;
  }

  getStatus(): string {
    return this.voucher()?.status || '';
  }

  getReferenceNo(): string | null {
    return this.voucher()?.reference_no || null;
  }

  getDescription(): string | null {
    return this.voucher()?.description || null;
  }

  // Status badge and label
  getStatusBadge(status: string): string {
    switch (status) {
      case 'posted':
        return 'bg-green-100 text-green-800';
      case 'draft':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  getStatusLabel(status: string): string {
    switch (status) {
      case 'posted':
        return 'مُعلن';
      case 'draft':
        return 'مسودة';
      case 'cancelled':
        return 'ملغي';
      default:
        return status;
    }
  }

  getMethodLabel(method: string): string {
    switch (method) {
      case 'bank':
        return 'بنك';
      case 'cash':
        return 'نقدية';
      case 'check':
        return 'شيك';
      default:
        return method;
    }
  }

  formatDate(date: string | null): string {
    if (!date) return '-';
    try {
      return new Date(date).toLocaleDateString('ar-SA', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return '-';
    }
  }

  formatDateTime(date: string | null): string {
    if (!date) return '-';
    try {
      return new Date(date).toLocaleDateString('ar-SA', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return '-';
    }
  }

  formatCurrency(amount: number): string {
    if (!amount && amount !== 0) return '-';
    return new Intl.NumberFormat('ar-EG', {
      style: 'decimal',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  }

  goBack(): void {
    this.router.navigate(['/finance/receipt-vouchers']);
  }

  // ✅ Check if voucher exists (for template use)
  hasVoucher(): boolean {
    return this.voucher() !== null;
  }

  // ✅ Check if has reference number
  hasReferenceNo(): boolean {
    return !!this.voucher()?.reference_no;
  }

  // ✅ Check if has description
  hasDescription(): boolean {
    return !!this.voucher()?.description;
  }
}