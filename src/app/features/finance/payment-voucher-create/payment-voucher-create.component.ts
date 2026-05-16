import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { environment } from '../../../../environments/environment';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-payment-voucher-create',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  templateUrl: './payment-voucher-create.component.html',
  styleUrls: ['./payment-voucher-create.component.css']
})
export class PaymentVoucherCreateComponent implements OnInit {
  invoices = signal<any[]>([]);
  selectedInvoice = signal<any>(null);
  submitting = signal(false);

  formData = signal({
    invoice_id: null as number | null,
    payment_amount: 0,
    payment_method: 'bank_transfer',
    payment_date: new Date().toISOString().split('T')[0],
    payment_account_type: 'bank',
    bank_account_number: '',
    bank_name: '',
    check_number: '',
    notes: ''
  });

  constructor(
    private http: HttpClient,
    public router: Router,
    private toast: ToastService
  ) {}

  ngOnInit(): void {
    this.loadDraftInvoices();
  }

  loadDraftInvoices(): void {
    console.log('[PaymentVoucher] Loading draft/partial invoices...');
    
    this.http.get<any>(`${environment.apiUrl}/purchasing/invoices?status=draft,partial`).subscribe({
      next: (response) => {
        console.log('[PaymentVoucher] Invoices received:', response);
        console.log('[PaymentVoucher] Invoices count:', response.data?.length);
        console.log('[PaymentVoucher] Invoices data:', JSON.stringify(response.data, null, 2));
        
        this.invoices.set(response.data || []);
        console.log('[PaymentVoucher] Invoices signal set:', this.invoices().length);
      },
      error: (err) => {
        console.error('[PaymentVoucher] Failed to load invoices:', err);
        this.toast.error('فشل في تحميل الفواتير', 3000);
      }
    });
  }

  onInvoiceChange(invoiceId: number): void {
    const invoice = this.invoices().find(inv => inv.id === invoiceId);
    this.selectedInvoice.set(invoice);
    
    if (invoice) {
      this.formData.update(data => ({
        ...data,
        payment_amount: parseFloat(invoice.remaining_amount || invoice.total_amount)
      }));
    }
  }

  onPaymentMethodChange(method: string): void {
    this.formData.update(data => ({
      ...data,
      payment_method: method,
      payment_account_type: method === 'cash' ? 'cash' : 'bank'
    }));
  }

  onSubmit(): void {
    const data = this.formData();
    
    if (!data.invoice_id) {
      this.toast.error('يرجى اختيار فاتورة', 3000);
      return;
    }

    if (data.payment_amount <= 0) {
      this.toast.error('مبلغ الدفع يجب أن يكون أكبر من صفر', 3000);
      return;
    }

    const selectedInv = this.selectedInvoice();
    if (selectedInv && data.payment_amount > parseFloat(selectedInv.remaining_amount || selectedInv.total_amount) + 0.01) {
      this.toast.error('مبلغ الدفع لا يمكن أن يتجاوز الرصيد المتبقي', 3000);
      return;
    }

    this.submitting.set(true);

    this.http.post<any>(`${environment.apiUrl}/finance/payment-vouchers`, data).subscribe({
      next: (response) => {
        this.submitting.set(false);
        this.toast.success('✅ تم إنشاء سند الصرف بنجاح', 4000);
        this.router.navigate(['/finance/payment-vouchers', response.data.voucher.id]);
      },
      error: (err) => {
        this.submitting.set(false);
        this.toast.error(err.error?.message || 'فشل في إنشاء سند الصرف', 3000);
      }
    });
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'decimal',
      minimumFractionDigits: 2
    }).format(amount) + ' ريال';
  }
}
