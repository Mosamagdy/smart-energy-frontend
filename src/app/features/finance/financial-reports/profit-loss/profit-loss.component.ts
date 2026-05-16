import { Component, OnInit, signal, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { environment } from '../../../../../environments/environment';
import { ToastService } from '../../../../core/services/toast.service';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-profit-loss',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  templateUrl: './profit-loss.component.html',
  styleUrl: './profit-loss.component.css'
})
export class ProfitLossComponent implements OnInit {
  private http = inject(HttpClient);
  private toast = inject(ToastService);

  // Date range
  startDate = signal<string>(new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0]);
  endDate = signal<string>(new Date().toISOString().split('T')[0]);

  // Report data
  reportData = signal<any>(null);
  isLoading = signal(false);

  // Summary cards
  totalRevenue = signal(0);
  totalCOGS = signal(0);
  grossProfit = signal(0);
  totalExpenses = signal(0);
  netProfit = signal(0);
  isProfitable = signal(false);

  ngOnInit(): void {
    this.loadProfitLoss();
  }

  async loadProfitLoss(): Promise<void> {
    this.isLoading.set(true);
    try {
      const params = new HttpParams()
        .set('startDate', this.startDate())
        .set('endDate', this.endDate());

      const response: any = await firstValueFrom(
        this.http.get(`${environment.apiUrl}/reports/income-statement`, { params })
      );

      this.reportData.set(response.data);
      
      // Update summary cards
      this.totalRevenue.set(response.data.revenue?.total || 0);
      this.totalCOGS.set(response.data.cogs?.total || 0);
      this.grossProfit.set(response.data.gross_profit || 0);
      this.totalExpenses.set((response.data.operating_expenses?.total || 0) + (response.data.other_expenses?.total || 0));
      this.netProfit.set(response.data.net_profit || 0);
      this.isProfitable.set(response.data.is_profitable || false);

    } catch (error: any) {
      this.toast.error(error?.error?.message || 'فشل تحميل قائمة الأرباح والخسائر');
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

  getProfitLossClass(): string {
    return this.isProfitable() ? 'text-green-600' : 'text-red-600';
  }

  getProfitLossBgClass(): string {
    return this.isProfitable() 
      ? 'bg-gradient-to-r from-green-500 to-emerald-600' 
      : 'bg-gradient-to-r from-red-500 to-rose-600';
  }

  abs(value: number): number {
    return Math.abs(value);
  }

  async exportToPDF(): Promise<void> {
    try {
      this.toast.info('جاري تحضير ملف PDF...');
      
      // Use browser's print functionality for now
      // In production, you would call backend PDF generation endpoint
      window.print();
      
      this.toast.success('تم تصدير التقرير بنجاح');
    } catch (error: any) {
      this.toast.error(error?.message || 'فشل تصدير PDF');
    }
  }
}
