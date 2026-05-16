import { Component, OnInit, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { environment } from '../../../../environments/environment';
import { ToastService } from '../../../core/services/toast.service';
import { firstValueFrom } from 'rxjs';

interface TreasuryAccount {
  id: number;
  account_code: string;
  account_name: string;
  account_name_ar: string;
  current_balance: number;
}

interface TreasuryTransaction {
  journal_entry_id: number;
  entry_number: string;
  entry_date: string;
  description: string;
  reference_type: string;
  account_code: string;
  account_name: string;
  transaction_type: 'in' | 'out' | 'unknown';
  amount: number;
  created_at: string;
}

interface TreasuryData {
  total_cash: number;
  total_bank: number;
  total_treasury: number;
  cash_accounts: TreasuryAccount[];
  bank_accounts: TreasuryAccount[];
  recent_transactions: TreasuryTransaction[];
}

@Component({
  selector: 'app-treasury-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, TranslateModule],
  templateUrl: './treasury-dashboard.component.html',
  styleUrl: './treasury-dashboard.component.css'
})
export class TreasuryDashboardComponent implements OnInit {
  private http = inject(HttpClient);
  private toast = inject(ToastService);

  treasuryData = signal<TreasuryData | null>(null);
  isLoading = signal(false);

  ngOnInit(): void {
    this.loadTreasuryData();
  }

  async loadTreasuryData(): Promise<void> {
    this.isLoading.set(true);
    try {
      const response: any = await firstValueFrom(
        this.http.get(`${environment.apiUrl}/finance/treasury/dashboard`)
      );

      this.treasuryData.set(response.data);
    } catch (error: any) {
      this.toast.error(error?.error?.message || 'فشل تحميل بيانات الخزينة');
    } finally {
      this.isLoading.set(false);
    }
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-SA', {
      style: 'decimal',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}
