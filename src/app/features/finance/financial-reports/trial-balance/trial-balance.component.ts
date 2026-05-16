import { Component, OnInit, signal, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { environment } from '../../../../../environments/environment';
import { ToastService } from '../../../../core/services/toast.service';

@Component({
  selector: 'app-trial-balance',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, TranslateModule],
  templateUrl: './trial-balance.component.html',
  styleUrls: ['./trial-balance.component.css']
})
export class TrialBalanceComponent implements OnInit {
  private http = inject(HttpClient);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private toast = inject(ToastService);

  // Date range filters
  startDate = signal<string>('');
  endDate = signal<string>(new Date().toISOString().split('T')[0]);

  // Report data
  reportData = signal<any>(null);
  isLoading = signal(false);
  accounts = signal<any[]>([]);

  // Totals
  totalDebit = signal(0);
  totalCredit = signal(0);
  difference = signal(0);
  isBalanced = signal(false);
  accountCount = signal(0);
  accountsWithActivity = signal(0);

  ngOnInit(): void {
    // Check for query params (from drill-down navigation)
    this.route.queryParams.subscribe(params => {
      if (params['startDate']) {
        this.startDate.set(params['startDate']);
      }
      if (params['endDate']) {
        this.endDate.set(params['endDate']);
      }
      this.loadTrialBalance();
    });
  }

  loadTrialBalance(): void {
    this.isLoading.set(true);
    console.log('[Trial Balance] Loading report...');

    let params = new HttpParams();
    if (this.startDate()) {
      params = params.set('startDate', this.startDate());
    }
    if (this.endDate()) {
      params = params.set('endDate', this.endDate());
    }

    this.http.get(`${environment.apiUrl}/reports/trial-balance`, { params }).subscribe({
      next: (response: any) => {
        console.log('[Trial Balance] Report loaded:', response.data);
        this.reportData.set(response.data);
        this.accounts.set(response.data.accounts || []);
        this.totalDebit.set(response.data.total_debit || 0);
        this.totalCredit.set(response.data.total_credit || 0);
        this.difference.set(response.data.difference || 0);
        this.isBalanced.set(response.data.is_balanced);
        this.accountCount.set(response.data.account_count || 0);
        this.accountsWithActivity.set(response.data.accounts_with_activity || 0);
        this.isLoading.set(false);

        if (!response.data.is_balanced) {
          console.warn('[Trial Balance] ⚠️ WARNING: Trial Balance is NOT balanced!');
          console.warn(`[Trial Balance] Difference: ${response.data.difference}`);
        }
      },
      error: (err) => {
        console.error('[Trial Balance] Error loading report:', err);
        this.toast.error('فشل في تحميل ميزان المراجعة', 3000);
        this.isLoading.set(false);
      }
    });
  }

  onDateChange(): void {
    this.loadTrialBalance();
  }

  drillDownToLedger(accountCode: string): void {
    console.log(`[Trial Balance] Drilling down to ledger for account: ${accountCode}`);
    this.router.navigate(['/finance/reports/ledger', accountCode], {
      queryParams: {
        startDate: this.startDate(),
        endDate: this.endDate()
      }
    });
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('ar-SA', {
      style: 'currency',
      currency: 'SAR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount || 0);
  }

  getBalanceClass(account: any): string {
    if (account.balance > 0) return 'debit-balance';
    if (account.balance < 0) return 'credit-balance';
    return 'zero-balance';
  }
}
