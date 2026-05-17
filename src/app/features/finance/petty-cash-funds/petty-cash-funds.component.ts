import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment.prod';
import { ToastService } from '../../../core/services/toast.service';
import { firstValueFrom } from 'rxjs';
import { TranslateModule } from '@ngx-translate/core';

interface PettyCashFund {
  id: number;
  fund_name: string;
  engineer_name: string;
  project_name: string | null;
  initial_amount: number;
  current_balance: number;
  currency: string;
  status: string;
  created_at: string;
  last_reconciliation_date: string | null;
}

@Component({
  selector: 'app-petty-cash-funds',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  templateUrl: './petty-cash-funds.component.html',
  styleUrl: './petty-cash-funds.component.css'
})
export class PettyCashFundsComponent implements OnInit {
  private http = inject(HttpClient);
  private toast = inject(ToastService);

  funds = signal<PettyCashFund[]>([]);
  loading = signal(false);
  showFundModal = signal(false);
  showReplenishModal = signal(false);
  selectedFund = signal<PettyCashFund | null>(null);

  // Fund creation form
  fundForm = {
    fund_name: '',
    engineer_id: '',
    project_id: '',
    initial_amount: ''
  };

  // Replenish form - plain property for ngModel compatibility
  replenishAmount = '';

  employees = signal<any[]>([]);
  projects = signal<any[]>([]);

  ngOnInit(): void {
    this.loadFunds();
    this.loadEmployees();
    this.loadProjects();
  }

  async loadFunds(): Promise<void> {
    this.loading.set(true);
    try {
      const response: any = await firstValueFrom(
        this.http.get(`${environment.apiUrl}/finance/petty-cash/funds`)
      );
      this.funds.set(response.data?.funds || []);
    } catch (error: any) {
      this.toast.error(error?.error?.message || 'فشل تحميل صناديق العهد');
    } finally {
      this.loading.set(false);
    }
  }

  async loadEmployees(): Promise<void> {
    try {
      const response: any = await firstValueFrom(
        this.http.get(`${environment.apiUrl}/employees`)
      );
      this.employees.set(response.data?.employees || []);
    } catch (error) {
      console.error('Failed to load employees:', error);
    }
  }

  async loadProjects(): Promise<void> {
    try {
      const response: any = await firstValueFrom(
        this.http.get(`${environment.apiUrl}/projects`)
      );
      this.projects.set(response.data?.projects || []);
    } catch (error) {
      console.error('Failed to load projects:', error);
    }
  }

  openFundModal(): void {
    this.fundForm = {
      fund_name: '',
      engineer_id: '',
      project_id: '',
      initial_amount: ''
    };
    this.showFundModal.set(true);
  }

  openReplenishModal(fund: PettyCashFund): void {
    this.selectedFund.set(fund);
    this.replenishAmount = '';
    this.showReplenishModal.set(true);
  }

  async createFund(): Promise<void> {
    if (!this.fundForm.fund_name || !this.fundForm.engineer_id || !this.fundForm.initial_amount) {
      this.toast.error('جميع الحقول مطلوبة');
      return;
    }

    try {
      await firstValueFrom(
        this.http.post(`${environment.apiUrl}/finance/petty-cash/funds`, {
          fund_name: this.fundForm.fund_name,
          engineer_id: Number(this.fundForm.engineer_id),
          project_id: this.fundForm.project_id ? Number(this.fundForm.project_id) : null,
          initial_amount: Number(this.fundForm.initial_amount),
          currency: 'SAR'
        })
      );

      this.toast.success('تم إنشاء صندوق العهد بنجاح');
      this.showFundModal.set(false);
      this.loadFunds();
    } catch (error: any) {
      this.toast.error(error?.error?.message || 'فشل إنشاء صندوق العهد');
    }
  }

  async replenishFund(): Promise<void> {
    const fund = this.selectedFund();
    if (!fund || !this.replenishAmount) {
      this.toast.error('المبلغ مطلوب');
      return;
    }

    try {
      await firstValueFrom(
        this.http.post(`${environment.apiUrl}/finance/petty-cash/funds/${fund.id}/fund`, {
          amount: Number(this.replenishAmount)
        })
      );

      this.toast.success('تمت إضافة الأموال بنجاح');
      this.showReplenishModal.set(false);
      this.loadFunds();
    } catch (error: any) {
      this.toast.error(error?.error?.message || 'فشل إضافة الأموال');
    }
  }

  formatCurrency(amount: number): string {
    return amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  getStatusBadge(status: string): string {
    return status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800';
  }

  getStatusLabel(status: string): string {
    return status === 'active' ? 'نشط' : 'مغلق';
  }
}