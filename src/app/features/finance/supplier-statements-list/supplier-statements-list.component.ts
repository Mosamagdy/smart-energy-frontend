import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { environment } from '../../../../environments/environment.prod';
import { ToastService } from '../../../core/services/toast.service';
import { TranslateModule } from '@ngx-translate/core';

interface SupplierSummary {
  id: number;
  name: string;
  email: string | null;
  phone: string | null;
  invoice_count: number;
  total_invoices: string;
  total_paid: string;
  balance_due: string;
}

@Component({
  selector: 'app-supplier-statements-list',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  templateUrl: './supplier-statements-list.component.html',
  styleUrls: ['./supplier-statements-list.component.css']
})
export class SupplierStatementsListComponent implements OnInit {
  suppliers = signal<SupplierSummary[]>([]);
  isLoading = signal(true);
  searchTerm = signal('');

  constructor(
    private http: HttpClient,
    private router: Router,
    private toast: ToastService
  ) {}

  ngOnInit(): void {
    this.loadSuppliers();
  }

  loadSuppliers(): void {
    this.isLoading.set(true);
    
    this.http.get<any>(`${environment.apiUrl}/finance/suppliers/statements/summary`).subscribe({
      next: (response) => {
        this.suppliers.set(response.data || []);
        this.isLoading.set(false);
        
        console.log('[Supplier Statements] Loaded', response.data?.length, 'suppliers');
      },
      error: (err) => {
        console.error('[Supplier Statements] Failed to load:', err);
        this.toast.error('فشل في تحميل قائمة الموردين', 3000);
        this.isLoading.set(false);
      }
    });
  }

  viewStatement(supplierId: number): void {
    this.router.navigate(['/finance/suppliers', supplierId, 'statement']);
  }

  formatCurrency(amount: string): string {
    const num = parseFloat(amount);
    return new Intl.NumberFormat('en-US', {
      style: 'decimal',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(num) + ' ريال';
  }

  getBalanceClass(balance: string): string {
    const num = parseFloat(balance);
    if (num > 0) return 'balance-debit';
    if (num === 0) return 'balance-paid';
    return 'balance-credit';
  }

  getBalanceLabel(balance: string): string {
    const num = parseFloat(balance);
    if (num > 0) return 'مدين';
    if (num === 0) return 'مسدد ✓';
    return 'دائن';
  }

  getFilteredSuppliers(): SupplierSummary[] {
    const term = this.searchTerm().toLowerCase();
    if (!term) return this.suppliers();
    
    return this.suppliers().filter(s => 
      s.name.toLowerCase().includes(term) || 
      (s.phone && s.phone.includes(term)) ||
      (s.email && s.email.toLowerCase().includes(term))
    );
  }
}
