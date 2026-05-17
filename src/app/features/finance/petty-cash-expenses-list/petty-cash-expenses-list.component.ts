import { Component, OnInit, signal, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { environment } from '../../../../environments/environment.prod';
import { ToastService } from '../../../core/services/toast.service';
import { firstValueFrom } from 'rxjs';

interface PettyCashExpense {
  id: number;
  created_at: string;
  amount: number;
  description: string;
  fund_name: string;
  custodian_name: string;
  expense_account_name: string;
  account_code: string;
  expense_id: number | null;
  journal_entry_id: number | null;
}

@Component({
  selector: 'app-petty-cash-expenses-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, TranslateModule],
  templateUrl: './petty-cash-expenses-list.component.html',
  styleUrl: './petty-cash-expenses-list.component.css'
})
export class PettyCashExpensesListComponent implements OnInit {
  private http = inject(HttpClient);
  private toast = inject(ToastService);

  // Filters
  startDate = signal<string>(new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0]);
  endDate = signal<string>(new Date().toISOString().split('T')[0]);
  searchTerm = signal<string>('');

  // Data
  expenses = signal<PettyCashExpense[]>([]);
  filteredExpenses = signal<PettyCashExpense[]>([]);
  isLoading = signal(false);
  totalAmount = signal(0);

  ngOnInit(): void {
    this.loadExpenses();
  }

  async loadExpenses(): Promise<void> {
    this.isLoading.set(true);
    try {
      const params = new HttpParams()
        .set('startDate', this.startDate())
        .set('endDate', this.endDate());

      const response: any = await firstValueFrom(
        this.http.get(`${environment.apiUrl}/finance/petty-cash/expenses`, { params })
      );

      this.expenses.set(response.data?.expenses || []);
      this.filteredExpenses.set(response.data?.expenses || []);
      this.calculateTotal();
    } catch (error: any) {
      this.toast.error(error?.error?.message || 'فشل تحميل مصاريف العهد');
    } finally {
      this.isLoading.set(false);
    }
  }

  applyFilters(): void {
    const search = this.searchTerm().toLowerCase();
    
    if (!search) {
      this.filteredExpenses.set(this.expenses());
    } else {
      const filtered = this.expenses().filter(expense =>
        expense.custodian_name?.toLowerCase().includes(search) ||
        expense.description?.toLowerCase().includes(search) ||
        expense.fund_name?.toLowerCase().includes(search) ||
        expense.expense_account_name?.toLowerCase().includes(search)
      );
      this.filteredExpenses.set(filtered);
    }
    
    this.calculateTotal();
  }

  calculateTotal(): void {
    const total = this.filteredExpenses().reduce((sum, exp) => sum + parseFloat(exp.amount.toString()), 0);
    this.totalAmount.set(total);
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
      day: 'numeric'
    });
  }
}
