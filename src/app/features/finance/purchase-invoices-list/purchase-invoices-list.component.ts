import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { environment } from '../../../../environments/environment.prod';

interface PurchaseInvoice {
  id: number;
  invoice_number: string;
  supplier_name: string;
  po_number: string;
  project_name: string;
  invoice_date: string;
  subtotal: string;
  tax_amount: string;
  total_amount: string;
  paid_amount: string;
  status: string;
  journal_entry_number: number | null;
  journal_entry_id: number | null;
  created_at: string;
}

@Component({
  selector: 'app-purchase-invoices-list',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  templateUrl: './purchase-invoices-list.component.html',
  styleUrls: ['./purchase-invoices-list.component.css']
})
export class PurchaseInvoicesListComponent implements OnInit {
  private http = inject(HttpClient);
  private router = inject(Router);
  private translate = inject(TranslateService);

  invoices = signal<PurchaseInvoice[]>([]);
  filteredInvoices = signal<PurchaseInvoice[]>([]);
  isLoading = signal<boolean>(true);
  error = signal<string | null>(null);

  // Filters
  selectedStatus = signal<string>('all');
  selectedSupplier = signal<string>('all');
  suppliers = signal<{id: number, name: string}[]>([]);

  ngOnInit(): void {
    this.loadInvoices();
  }

  loadInvoices(): void {
    this.isLoading.set(true);
    this.error.set(null);

    this.http.get<any>(`${environment.apiUrl}/purchasing/invoices`).subscribe({
      next: (response) => {
        
        if (response.status === 'success') {
          this.invoices.set(response.data || []);
          this.applyFilters();
          this.extractSuppliers(response.data || []);
          this.isLoading.set(false);
          console.log('✅ Loading complete, isLoading set to false');
        }
      },
      error: (err) => {
        console.error('❌ Failed to load invoices:', err);
        this.error.set('فشل في تحميل الفواتير');
        this.isLoading.set(false);
      }
    });
  }

  extractSuppliers(invoiceList: PurchaseInvoice[]): void {
    const uniqueSuppliers = new Map<number, string>();
    invoiceList.forEach(inv => {
      if (inv.supplier_name && !uniqueSuppliers.has(inv.id)) {
        // Use a simple deduplication based on name
        const existing = Array.from(uniqueSuppliers.values()).find(name => name === inv.supplier_name);
        if (!existing) {
          uniqueSuppliers.set(uniqueSuppliers.size + 1, inv.supplier_name);
        }
      }
    });
    
    this.suppliers.set(
      Array.from(uniqueSuppliers.entries()).map(([id, name]) => ({ id, name }))
    );
  }

  applyFilters(): void {
    let filtered = this.invoices();

    if (this.selectedStatus() !== 'all') {
      filtered = filtered.filter(inv => inv.status === this.selectedStatus());
    }

    if (this.selectedSupplier() !== 'all') {
      filtered = filtered.filter(inv => inv.supplier_name === this.selectedSupplier());
    }

    this.filteredInvoices.set(filtered);
  }

  filterByStatus(): void {
    this.applyFilters();
  }

  filterBySupplier(): void {
    this.applyFilters();
  }

  viewInvoiceDetails(invoiceId: number): void {
    // Validate invoice ID before navigation
    if (!invoiceId || isNaN(invoiceId)) {
      console.error('[PurchaseInvoices] Invalid invoice ID:', invoiceId);
      return;
    }
    this.router.navigate(['/procurement/invoices', invoiceId]);
  }

  viewJournalEntry(entryId: number): void {
    // Navigate to journal entry details
    this.router.navigate(['/accounting/journal-entries', entryId]);
  }

  getStatusLabel(status: string): string {
    const statusMap: Record<string, string> = {
      'draft': 'مسودة',
      'final': 'معتمد',
      'partial': 'مدفوع جزئياً',
      'paid': 'مدفوع'
    };
    return statusMap[status] || status;
  }

  getStatusColor(status: string): string {
    const colorMap: Record<string, string> = {
      'draft': 'bg-gray-100 text-gray-800',
      'final': 'bg-blue-100 text-blue-800',
      'partial': 'bg-yellow-100 text-yellow-800',
      'paid': 'bg-green-100 text-green-800'
    };
    return colorMap[status] || 'bg-gray-100 text-gray-800';
  }

  formatCurrency(amount: string | number): string {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  finalizeInvoice(invoiceId: number): void {
    // Validate invoice ID
    if (!invoiceId || isNaN(invoiceId)) {
      console.error('[PurchaseInvoices] Invalid invoice ID for finalize:', invoiceId);
      return;
    }
    
    if (!confirm('هل أنت متأكد من اعتماد فاتورة الشراء؟ سيتم زيادة المخزون وإنشاء قيد يومية.')) {
      return;
    }

    this.http.post<any>(`${environment.apiUrl}/purchasing/invoices/${invoiceId}/finalize`, {}).subscribe({
      next: (response) => {
        alert('تم اعتماد فاتورة الشراء بنجاح');
        this.loadInvoices();
      },
      error: (err) => {
        console.error('Failed to finalize invoice:', err);
        alert(err?.error?.message || 'فشل اعتماد الفاتورة');
      }
    });
  }
}
