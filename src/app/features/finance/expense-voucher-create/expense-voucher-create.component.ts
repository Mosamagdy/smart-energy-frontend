import { Component, OnInit, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { environment } from '../../../../environments/environment';
import { ToastService } from '../../../core/services/toast.service';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-expense-voucher-create',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, TranslateModule],
  templateUrl: './expense-voucher-create.component.html',
  styleUrls: ['./expense-voucher-create.component.css']
})
export class ExpenseVoucherCreateComponent implements OnInit {
  private http = inject(HttpClient);
  private toast = inject(ToastService);
  private router = inject(Router);

  expenseAccounts = signal<any[]>([]);
  paymentAccounts = signal<any[]>([]);
  isLoading = signal(false);
  isSubmitting = signal(false);

  // Form data
  form = {
    expense_date: new Date().toISOString().split('T')[0],
    expense_amount: '',
    expense_account_id: '',
    payment_account_id: '',
    payment_method: 'cash',
    description: '',
    reference_number: '',
    notes: ''
  };

  ngOnInit(): void {
    this.loadAccounts();
  }

  loadAccounts(): void {
    console.log('[Expense Voucher] Loading accounts...');
    
    // Load expense accounts (32xxx)
    this.http.get<any>(`${environment.apiUrl}/finance/expenses/accounts/expense`).subscribe({
      next: (response) => {
        console.log('[Expense Voucher] Loaded expense accounts:', response.data?.length);
        this.expenseAccounts.set(response.data || []);
      },
      error: (err) => {
        console.error('[Expense Voucher] Failed to load expense accounts:', err);
      }
    });

    // Load payment accounts (12301, 122)
    this.http.get<any>(`${environment.apiUrl}/finance/expenses/accounts/payment`).subscribe({
      next: (response) => {
        console.log('[Expense Voucher] Loaded payment accounts:', response.data?.length);
        this.paymentAccounts.set(response.data || []);
      },
      error: (err) => {
        console.error('[Expense Voucher] Failed to load payment accounts:', err);
      }
    });
  }

  onPaymentMethodChange(): void {
    // Auto-select appropriate account based on payment method
    if (this.form.payment_method === 'cash') {
      const cashAccount = this.paymentAccounts().find(a => a.account_code === '12301');
      if (cashAccount) {
        this.form.payment_account_id = cashAccount.id.toString();
      }
    } else {
      const bankAccount = this.paymentAccounts().find(a => a.account_code === '122');
      if (bankAccount) {
        this.form.payment_account_id = bankAccount.id.toString();
      }
    }
  }

  onSubmit(): void {
    if (!this.validateForm()) return;

    this.isSubmitting.set(true);

    const payload = {
      expense_date: this.form.expense_date,
      expense_amount: parseFloat(this.form.expense_amount),
      expense_account_id: parseInt(this.form.expense_account_id, 10),
      payment_account_id: parseInt(this.form.payment_account_id, 10),
      payment_method: this.form.payment_method,
      description: this.form.description,
      reference_number: this.form.reference_number || undefined,
      notes: this.form.notes || undefined
    };

    // CRITICAL: Log exact payload for debugging
    console.log('=== EXPENSE VOUCHER PAYLOAD ===');
    console.log('Payload:', JSON.stringify(payload, null, 2));
    console.log('expense_amount type:', typeof payload.expense_amount, payload.expense_amount);
    console.log('expense_account_id type:', typeof payload.expense_account_id, payload.expense_account_id);
    console.log('payment_account_id type:', typeof payload.payment_account_id, payload.payment_account_id);
    console.log('===============================');

    this.http.post<any>(`${environment.apiUrl}/finance/expenses`, payload).subscribe({
      next: (response) => {
        console.log('[Expense Voucher] Success:', response);
        this.toast.success('تم إنشاء سند المصروف بنجاح', 3000);
        this.router.navigate(['/finance/expenses']);
      },
      error: (err) => {
        console.error('[Expense Voucher] Failed to create:', err);
        console.error('[Expense Voucher] Error status:', err.status);
        console.error('[Expense Voucher] Error body:', err.error);
        console.error('[Expense Voucher] Full error:', JSON.stringify(err, null, 2));
        this.toast.error(err.error?.error || err.error?.message || 'فشل في إنشاء سند المصروف', 3000);
        this.isSubmitting.set(false);
      }
    });
  }

  validateForm(): boolean {
    if (!this.form.expense_date) {
      this.toast.error('التاريخ مطلوب', 3000);
      return false;
    }

    const amount = parseFloat(this.form.expense_amount);
    if (!this.form.expense_amount || isNaN(amount) || amount <= 0) {
      this.toast.error('المبلغ مطلوب ويجب أن يكون أكبر من صفر', 3000);
      return false;
    }

    if (!this.form.expense_account_id) {
      this.toast.error('حساب المصروف مطلوب', 3000);
      return false;
    }

    const expenseAccountId = parseInt(this.form.expense_account_id, 10);
    if (isNaN(expenseAccountId)) {
      this.toast.error('حساب المصروف غير صالح', 3000);
      return false;
    }

    if (!this.form.payment_account_id) {
      this.toast.error('حساب الدفع مطلوب', 3000);
      return false;
    }

    const paymentAccountId = parseInt(this.form.payment_account_id, 10);
    if (isNaN(paymentAccountId)) {
      this.toast.error('حساب الدفع غير صالح', 3000);
      return false;
    }

    if (!this.form.description || this.form.description.trim() === '') {
      this.toast.error('الوصف مطلوب', 3000);
      return false;
    }

    return true;
  }
}
