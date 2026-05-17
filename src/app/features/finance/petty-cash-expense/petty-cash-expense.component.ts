import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment.prod';
import { ToastService } from '../../../core/services/toast.service';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { TranslateModule } from '@ngx-translate/core';

interface ExpenseAccount {
  id: number;
  account_code: string;
  account_name: string;
  account_name_ar: string;
}

interface PettyCashFund {
  id: number;
  fund_name: string;
  engineer_name: string;
  current_balance: number;
  project_id: number | null;
  project_name: string | null;
}

@Component({
  selector: 'app-petty-cash-expense',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  templateUrl: './petty-cash-expense.component.html',
  styleUrl: './petty-cash-expense.component.css'
})
export class PettyCashExpenseComponent implements OnInit {
  private http = inject(HttpClient);
  private toast = inject(ToastService);
  private router = inject(Router);

  funds = signal<PettyCashFund[]>([]);
  expenseAccounts = signal<ExpenseAccount[]>([]);
  loading = signal(false);
  submitting = signal(false);

  // Form
  selectedFundId = signal<number | null>(null);
  expenseAccountId = signal<number | null>(null);
  amount = signal('');
  description = signal('');
  projectId = signal<number | null>(null);

  // Computed
  selectedFund = computed(() => {
    if (!this.selectedFundId()) return null;
    return this.funds().find(f => f.id === this.selectedFundId()) || null;
  });

  remainingBalance = computed(() => {
    const fund = this.selectedFund();
    if (!fund) return 0;
    const expenseAmount = Number(this.amount()) || 0;
    return Math.max(0, fund.current_balance - expenseAmount);
  });

  isSufficientBalance = computed(() => {
    const fund = this.selectedFund();
    if (!fund) return true;
    const expenseAmount = Number(this.amount()) || 0;
    return expenseAmount <= fund.current_balance;
  });

  ngOnInit(): void {
    this.loadFunds();
    this.loadExpenseAccounts();
  }

  async loadFunds(): Promise<void> {
    try {
      const response: any = await firstValueFrom(
        this.http.get(`${environment.apiUrl}/finance/petty-cash/funds`)
      );
      // Filter only active funds
      const activeFunds = (response.data?.funds || []).filter((f: any) => f.status === 'active');
      this.funds.set(activeFunds);
    } catch (error) {
      this.toast.error('فشل تحميل صناديق العهد');
    }
  }

  async loadExpenseAccounts(): Promise<void> {
    try {
      const response: any = await firstValueFrom(
        this.http.get(`${environment.apiUrl}/coa/search/32`)
      );
      const accounts = response.data?.accounts || response.data || [];
      this.expenseAccounts.set(accounts);
    } catch (error) {
      this.toast.error('فشل تحميل حسابات المصروفات');
    }
  }

  onFundChange(): void {
    const fund = this.selectedFund();
    if (fund && fund.project_id) {
      this.projectId.set(fund.project_id);
    }
  }

  async submitExpense(): Promise<void> {
    if (!this.selectedFundId()) {
      this.toast.error('يرجى اختيار صندوق العهد');
      return;
    }

    if (!this.expenseAccountId()) {
      this.toast.error('يرجى اختيار حساب المصروف');
      return;
    }

    const expenseAmount = Number(this.amount());
    if (!expenseAmount || expenseAmount <= 0) {
      this.toast.error('المبلغ يجب أن يكون أكبر من صفر');
      return;
    }

    if (!this.description()) {
      this.toast.error('يرجى إدخال وصف المصروف');
      return;
    }

    if (!this.isSufficientBalance()) {
      this.toast.error('الرصيد غير كافٍ');
      return;
    }

    this.submitting.set(true);

    try {
      await firstValueFrom(
        this.http.post(`${environment.apiUrl}/finance/petty-cash/funds/${this.selectedFundId()}/expense`, {
          expense_amount: expenseAmount,
          expense_account_id: this.expenseAccountId()!,
          description: this.description(),
          project_id: this.projectId() || undefined
        })
      );

      this.toast.success('تم تسجيل المصروف بنجاح');
      
      // Reset form
      this.amount.set('');
      this.description.set('');
      this.expenseAccountId.set(null);

      // Reload funds to update balances
      this.loadFunds();

    } catch (error: any) {
      this.toast.error(error?.error?.message || 'فشل تسجيل المصروف');
    } finally {
      this.submitting.set(false);
    }
  }

  cancel(): void {
    this.router.navigate(['/finance/petty-cash/funds']);
  }

  formatCurrency(amount: number): string {
    return amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
}
