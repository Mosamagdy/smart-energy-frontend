import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { TranslateModule } from '@ngx-translate/core';
import { environment } from '../../../../environments/environment.prod';
import { ToastService } from '../../../core/services/toast.service';
import { openFilePreview } from '../../../utils/file-url.util';

interface InvoiceItem {
  id: number;
  item_name: string;
  item_name_ar: string | null;
  item_code: string | null;
  warehouse_name: string | null;
  warehouse_name_ar: string | null;
  quantity: number;
  unit_price: string | number;
  vat_amount: string | number;
  total_amount: string | number;
}

interface InvoiceDetail {
  id: number;
  invoice_number: string;
  client_name: string;
  contact_email: string;
  contact_phone: string;
  project_name: string;
  issue_date: string;
  due_date: string;
  subtotal: string;
  vat_rate: string;
  vat_amount: string;
  total_amount: string;
  paid_amount: string;
  status: string;
  notes: string;
  description: string;
  pdf_path: string;
  journal_entry_number: number | null;
  created_at: string;
  items: InvoiceItem[];
}

@Component({
  selector: 'app-sales-invoice-detail',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  templateUrl: './sales-invoice-detail.component.html',
  styleUrls: ['./sales-invoice-detail.component.css']
})
export class SalesInvoiceDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private http = inject(HttpClient);
  private toast = inject(ToastService);

  invoice = signal<InvoiceDetail | null>(null);
  isLoading = signal<boolean>(true);
  error = signal<string | null>(null);

  ngOnInit(): void {
    const invoiceId = this.route.snapshot.paramMap.get('id');

    if (!invoiceId) {
      this.toast.error('رقم الفاتورة غير صحيح');
      this.router.navigate(['/sales/invoices']);
      return;
    }

    const id = parseInt(invoiceId);

    if (isNaN(id)) {
      this.toast.error('رقم الفاتورة غير صحيح');
      this.router.navigate(['/sales/invoices']);
      return;
    }

    this.loadInvoice(id);
  }

  loadInvoice(id: number): void {
    this.isLoading.set(true);
    this.error.set(null);

    console.log(`[SalesInvoiceDetail] Loading invoice ID: ${id}`);

    this.http.get<any>(`/api/sales/invoices/${id}`).subscribe({
      next: (response) => {
        console.log('[SalesInvoiceDetail] API Response:', response);
        
        if (response.status === 'success') {
          const invoiceData = response.data;
          
          console.log('[SalesInvoiceDetail] Invoice loaded:', invoiceData.invoice_number);
          console.log('[SalesInvoiceDetail] Items count:', invoiceData.items?.length || 0);
          console.log('[SalesInvoiceDetail] Items:', invoiceData.items);
          
          if (invoiceData.items && invoiceData.items.length > 0) {
            console.log('[SalesInvoiceDetail] First item:', invoiceData.items[0]);
          } else {
            console.warn('[SalesInvoiceDetail] ⚠️ No items found in invoice!');
          }
          
          this.invoice.set(invoiceData);
        }
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('[SalesInvoiceDetail] Failed to load invoice:', err);
        this.error.set('فشل في تحميل تفاصيل الفاتورة');
        this.isLoading.set(false);
      }
    });
  }

  viewPdf(): void {
    const inv = this.invoice();
    if (!inv?.pdf_path) {
      this.toast.warning('لا يوجد ملف PDF مرفق لهذه الفاتورة');
      console.warn('[SalesInvoiceDetail] viewPdf: missing pdf_path');
      return;
    }

    if (!openFilePreview(inv.pdf_path)) {
      this.toast.warning('تعذر فتح ملف PDF');
    }
  }

  viewJournalEntry(): void {
    const inv = this.invoice();
    if (inv && inv.journal_entry_number) {
      this.toast.info(`رقم القيد: ${inv.journal_entry_number} - صفحة تفاصيل قيد اليومية قيد التطوير`, 5000);
    }
  }

  goBack(): void {
    this.router.navigate(['/sales/invoices']);
  }

  finalizeInvoice(): void {
    const inv = this.invoice();
    if (!inv || !inv.id) {
      this.toast.error('رقم الفاتورة غير صحيح');
      return;
    }

    if (!confirm('هل أنت متأكد من اعتماد فاتورة المبيعات؟ سيتم إنقاص المخزون وإنشاء قيد يومية.')) {
      return;
    }

    this.http.post<any>(`/api/sales/invoices/${inv.id}/finalize`, {}).subscribe({
      next: (response) => {
        this.toast.success('تم اعتماد فاتورة المبيعات بنجاح');
        this.loadInvoice(inv.id);
      },
      error: (err) => {
        console.error('Failed to finalize invoice:', err);
        this.toast.error(err?.error?.message || 'فشل اعتماد الفاتورة');
      }
    });
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

  formatDate(date: string): string {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('en-GB');
  }

  getBalance(total: string, paid: string): number {
    return parseFloat(total) - parseFloat(paid);
  }
}
