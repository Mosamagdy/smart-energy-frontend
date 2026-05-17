import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { SalesService, SalesInvoice } from '../../../core/services/sales.service';
import { ToastService } from '../../../core/services/toast.service';
import { environment } from '../../../../environments/environment.prod';
import { firstValueFrom } from 'rxjs';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-tax-invoices-list',
  standalone: true,
  imports: [CommonModule , TranslateModule],
  templateUrl: './tax-invoices-list.component.html',
  styleUrl: './tax-invoices-list.component.css'
})
export class TaxInvoicesListComponent implements OnInit {
  private http = inject(HttpClient);

  invoices = signal<SalesInvoice[]>([]);
  loading = signal(false);

  constructor(
    private salesService: SalesService,
    private toast: ToastService,
    public router: Router
  ) {}

  ngOnInit(): void {
    this.loadTaxInvoices();
  }

  async loadTaxInvoices(): Promise<void> {
    this.loading.set(true);
    try {
      // Load tax invoices from the invoices table (not sales_invoices)
      const response: any = await firstValueFrom(
        this.http.get(`${environment.apiUrl}/finance/tax-invoices`)
      );

      this.invoices.set(response.data || []);
      console.log(`[TaxInvoices] Loaded ${this.invoices().length} tax invoices from invoices table`);
      
    } catch (error) {
      console.error('[TaxInvoices] Error loading tax invoices:', error);
      this.toast.error('فشل تحميل الفواتير الضريبية');
    } finally {
      this.loading.set(false);
    }
  }

  getPdfUrl(pdfPath: string | null): string {
    if (!pdfPath) return '';
    const cleanPath = pdfPath.replace(/\\/g, '/').replace(/^\/+/, '');
    const backendBase = environment.apiUrl.replace(/\/api\/?$/, '');
    return `${backendBase}/${cleanPath}`;
  }

  viewPdf(invoice: SalesInvoice): void {
    const url = this.getPdfUrl(invoice.pdf_path);
    if (url) {
      window.open(url, '_blank');
    } else {
      this.toast.error('ملف PDF غير متوفر');
    }
  }

  getZatcaStatusBadge(status: string | undefined): string {
    switch (status) {
      case 'cleared':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  getZatcaStatusLabel(status: string | undefined): string {
    switch (status) {
      case 'cleared':
        return 'معتمدة ✅';
      case 'pending':
        return 'قيد المعالجة ⏳';
      case 'rejected':
        return 'مرفوضة ❌';
      default:
        return 'غير متاح';
    }
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-SA', {
      style: 'decimal',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  }
}
