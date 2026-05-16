import { Component, OnInit, signal, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Router, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { environment } from '../../../../../environments/environment';
import { ToastService } from '../../../../core/services/toast.service';

@Component({
  selector: 'app-general-ledger',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  templateUrl: './general-ledger.component.html',
  styleUrls: ['./general-ledger.component.css']
})
export class GeneralLedgerComponent implements OnInit {
  private http = inject(HttpClient);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private toast = inject(ToastService);

  // Account info
  accountCode = signal<string>('');
  accountName = signal<string>('');
  accountNameAr = signal<string>('');

  // Date range
  startDate = signal<string>('');
  endDate = signal<string>('');

  // Transactions
  transactions = signal<any[]>([]);
  isLoading = signal(false);

  // Running balance
  runningBalance = signal(0);
  totalDebit = signal(0);
  totalCredit = signal(0);
  endingBalance = signal(0);

  ngOnInit(): void {
    // Get account code from route params
    this.route.params.subscribe(params => {
      if (params['accountCode']) {
        this.accountCode.set(params['accountCode']);
        console.log(`[General Ledger] Account code from route: ${this.accountCode()}`);
      }
    });

    // Get date range from query params
    this.route.queryParams.subscribe(queryParams => {
      if (queryParams['startDate']) {
        this.startDate.set(queryParams['startDate']);
      }
      if (queryParams['endDate']) {
        this.endDate.set(queryParams['endDate']);
      }
    });
    
    // Load ledger after both params and queryParams are set
    // Use setTimeout to ensure both subscriptions have fired
    setTimeout(() => {
      this.loadGeneralLedger();
    }, 0);
  }

  loadGeneralLedger(): void {
    if (!this.accountCode()) {
      this.toast.error('كود الحساب مطلوب', 3000);
      return;
    }

    this.isLoading.set(true);
    console.log(`[General Ledger] Loading for account: ${this.accountCode()}`);

    let params = new HttpParams();
    if (this.startDate()) {
      params = params.set('startDate', this.startDate());
    }
    if (this.endDate()) {
      params = params.set('endDate', this.endDate());
    }

    this.http.get(`${environment.apiUrl}/reports/ledger/${this.accountCode()}`, { params }).subscribe({
      next: (response: any) => {
        console.log('[General Ledger] Raw API Response:', response);
        console.log('[General Ledger] Data object:', response.data);
        
        const data = response.data;
        
        // Map account info
        this.accountCode.set(data.account_code || this.accountCode());
        this.accountName.set(data.account_name || '');
        this.accountNameAr.set(data.account_name_ar || '');
        
        // CRITICAL FIX: Backend returns "entries" not "transactions"
        const entries = data.entries || [];
        console.log('[General Ledger] Entries count:', entries.length);
        console.log('[General Ledger] First entry:', entries[0]);
        
        // Map entries to transactions with correct field names
        const transactions = entries.map((entry: any) => ({
          entry_date: entry.entry_date,
          entry_number: entry.entry_number,
          description: entry.line_description || entry.entry_description || 'بدون وصف',
          debit_amount: entry.debit || 0,
          credit_amount: entry.credit || 0,
          running_balance: entry.running_balance || 0
        }));
        
        this.transactions.set(transactions);
        
        // Calculate totals
        const totalDebit = transactions.reduce((sum: number, t: any) => sum + t.debit_amount, 0);
        const totalCredit = transactions.reduce((sum: number, t: any) => sum + t.credit_amount, 0);
        
        this.totalDebit.set(parseFloat(totalDebit.toFixed(2)));
        this.totalCredit.set(parseFloat(totalCredit.toFixed(2)));
        this.endingBalance.set(data.closing_balance || 0);
        
        console.log('[General Ledger] Mapped transactions:', transactions.length);
        console.log('[General Ledger] Total Debit:', totalDebit);
        console.log('[General Ledger] Total Credit:', totalCredit);
        
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('[General Ledger] Error loading data:', err);
        this.toast.error('فشل في تحميل دفتر الأستاذ', 3000);
        this.isLoading.set(false);
      }
    });
  }

  onDateChange(): void {
    this.loadGeneralLedger();
  }

  goBack(): void {
    this.router.navigate(['/finance/reports/trial-balance'], {
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

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }
}
