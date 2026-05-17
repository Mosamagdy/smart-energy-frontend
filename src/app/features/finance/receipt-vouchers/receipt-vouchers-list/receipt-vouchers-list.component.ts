import { Component, OnInit, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { environment } from '../../../../../environments/environment.prod';
import { ToastService } from '../../../../core/services/toast.service';
import { firstValueFrom } from 'rxjs';

interface ReceiptVoucher {
  id: number;
  voucher_no: string;
  receipt_date: string;
  client_name: string;
  amount: number;
  payment_method: string;
  status: string;
  created_at: string;
}

@Component({
  selector: 'app-receipt-vouchers-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, TranslateModule],
  templateUrl: './receipt-vouchers-list.component.html',
  styleUrl: './receipt-vouchers-list.component.css'
})
export class ReceiptVouchersListComponent implements OnInit {
  private http = inject(HttpClient);
  private toast = inject(ToastService);
  public router = inject(Router);

  vouchers = signal<ReceiptVoucher[]>([]);
  isLoading = signal(false);
  startDate = signal<string>(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
  endDate = signal<string>(new Date().toISOString().split('T')[0]);
  search = signal<string>('');
  statusFilter = signal<string>('all');

  ngOnInit(): void {
    this.loadVouchers();
  }

  async loadVouchers(): Promise<void> {
    this.isLoading.set(true);
    try {
      const params: any = {
        start_date: this.startDate(),
        end_date: this.endDate()
      };
      
      // Only add status filter if it's not 'all'
      if (this.statusFilter() !== 'all') {
        params.status = this.statusFilter();
      }
      
      // Only add search if not empty
      if (this.search()) {
        params.search = this.search();
      }
      
      console.log('[Receipt Vouchers List] Loading with params:', params);
      
      const response: any = await firstValueFrom(
        this.http.get(`${environment.apiUrl}/finance/receipt-vouchers`, { params })
      );
      console.log('[Receipt Vouchers List] Loaded', response.data?.length || 0, 'vouchers');
      this.vouchers.set(response.data || []);
    } catch (error: any) {
      console.error('[Receipt Vouchers List] Error:', error);
      this.toast.error('فشل تحميل سندات القبض');
    } finally {
      this.isLoading.set(false);
    }
  }

  async postVoucher(id: number): Promise<void> {
    // Use toast confirmation instead of alert
    if (!confirm('هل أنت متأكد من إعلان هذا السند؟ سيتم إنشاء القيد المحاسبي.')) {
      return;
    }

    try {
      console.log(`[Receipt Vouchers List] Posting voucher ID: ${id}`);
      await firstValueFrom(
        this.http.post(`${environment.apiUrl}/finance/receipt-vouchers/${id}/post`, {})
      );
      this.toast.success('تم إعلان سند القبض بنجاح - تم تحديث الرصيد');
      this.loadVouchers();
    } catch (error: any) {
      console.error('[Receipt Vouchers List] Post error:', error);
      this.toast.error(error?.error?.message || 'فشل إعلان السند');
    }
  }

  async cancelVoucher(id: number): Promise<void> {
    // Use confirmation dialog
    if (!confirm('هل أنت متأكد من إلغاء هذا السند؟')) {
      return;
    }

    try {
      console.log(`[Receipt Vouchers List] Cancelling voucher ID: ${id}`);
      await firstValueFrom(
        this.http.post(`${environment.apiUrl}/finance/receipt-vouchers/${id}/cancel`, {})
      );
      this.toast.success('تم إلغاء سند القبض بنجاح');
      this.loadVouchers();
    } catch (error: any) {
      console.error('[Receipt Vouchers List] Cancel error:', error);
      this.toast.error(error?.error?.message || 'فشل إلغاء السند');
    }
  }

  viewVoucher(id: number): void {
    console.log(`[Receipt Vouchers List] Viewing voucher ID: ${id}`);
    this.router.navigate(['/finance/receipt-vouchers', id]);
  }

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

  // ✅ Fix: Calculate total posted amount correctly
  get totalPostedAmount(): number {
    return this.vouchers()
      .filter(v => v.status === 'posted')
      .reduce((sum, v) => sum + (typeof v.amount === 'string' ? parseFloat(v.amount) : v.amount || 0), 0);
  }

  get totalDraftCount(): number {
    return this.vouchers().filter(v => v.status === 'draft').length;
  }

  get totalCount(): number {
    return this.vouchers().length;
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-SA', {
      style: 'decimal',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  }
}
