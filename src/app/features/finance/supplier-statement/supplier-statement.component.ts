import { Component, OnInit, signal } from '@angular/core';
import { CommonModule, DatePipe, DecimalPipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute } from '@angular/router';
import { environment } from '../../../../environments/environment.prod';
import { ToastService } from '../../../core/services/toast.service';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-supplier-statement',
  standalone: true,
  imports: [CommonModule , TranslateModule],
  templateUrl: './supplier-statement.component.html',
  styleUrls: ['./supplier-statement.component.css']
})
export class SupplierStatementComponent implements OnInit {
  supplier = signal<any>(null);
  summary = signal<any>(null);
  transactions = signal<any[]>([]);
  isLoading = signal(true);
  
  // Date filters
  startDate = signal<string>('');
  endDate = signal<string>('');

  constructor(
    private http: HttpClient,
    private route: ActivatedRoute,
    private toast: ToastService
  ) {}

  ngOnInit(): void {
    const supplierId = this.route.snapshot.paramMap.get('id');
    if (supplierId) {
      this.loadStatement(parseInt(supplierId));
    }
  }

  loadStatement(supplierId: number): void {
    this.isLoading.set(true);
    
    const params: any = {};
    if (this.startDate()) params.start_date = this.startDate();
    if (this.endDate()) params.end_date = this.endDate();

    this.http.get<any>(`${environment.apiUrl}/finance/suppliers/${supplierId}/statement`, { params }).subscribe({
      next: (response) => {
        this.supplier.set(response.data.supplier);
        this.summary.set(response.data.summary);
        this.transactions.set(response.data.transactions);
        this.isLoading.set(false);
        
        console.log('[Supplier Statement] Statement loaded successfully');
        console.log('[Supplier Statement] Total Invoices:', response.data.summary.total_invoices_amount);
        console.log('[Supplier Statement] Total Paid:', response.data.summary.total_paid_amount);
        console.log('[Supplier Statement] Balance Due:', response.data.summary.balance_due);
      },
      error: (err) => {
        console.error('[Supplier Statement] Failed to load:', err);
        this.toast.error('فشل في تحميل كشف الحساب', 3000);
        this.isLoading.set(false);
      }
    });
  }

  applyFilters(): void {
    const supplierId = this.route.snapshot.paramMap.get('id');
    if (supplierId) {
      this.loadStatement(parseInt(supplierId));
    }
  }

  clearFilters(): void {
    this.startDate.set('');
    this.endDate.set('');
    const supplierId = this.route.snapshot.paramMap.get('id');
    if (supplierId) {
      this.loadStatement(parseInt(supplierId));
    }
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'decimal',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount) + ' ريال';
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  getTransactionTypeLabel(type: string): string {
    return type === 'invoice' ? 'فاتورة' : 'سند صرف';
  }

  getTransactionTypeClass(type: string): string {
    return type === 'invoice' ? 'type-invoice' : 'type-payment';
  }

  exportToPDF(): void {
    window.print();
  }
}
