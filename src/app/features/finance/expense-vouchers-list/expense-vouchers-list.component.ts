import { Component, OnInit, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { environment } from '../../../../environments/environment';
import { ToastService } from '../../../core/services/toast.service';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-expense-vouchers-list',
  standalone: true,
  imports: [CommonModule, RouterLink, TranslateModule],
  templateUrl: './expense-vouchers-list.component.html',
  styleUrls: ['./expense-vouchers-list.component.css']
})
export class ExpenseVouchersListComponent implements OnInit {
  private http = inject(HttpClient);
  private toast = inject(ToastService);

  vouchers = signal<any[]>([]);
  isLoading = signal(true);

  ngOnInit(): void {
    this.loadVouchers();
  }

  loadVouchers(): void {
    this.http.get<any>(`${environment.apiUrl}/finance/expenses`).subscribe({
      next: (response) => {
        this.vouchers.set(response.data || []);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('[Expense Vouchers] Failed to load:', err);
        this.toast.error('فشل في جلب سندات المصروفات', 3000);
        this.isLoading.set(false);
      }
    });
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('ar-EG');
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'decimal',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  }
}
