import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { TranslateModule } from '@ngx-translate/core';
import { environment } from '../../../../environments/environment.prod';
import { ToastService } from '../../../core/services/toast.service';

interface SalesInvoice {
  id: number;
  invoice_number: string;
  client_id: number;
  client_name: string;
  project_id: number;
  project_name: string;
  issue_date: string;
  due_date: string;
  total_amount: number;
  vat_amount: number;
  net_amount: number;
  status: 'draft' | 'final' | 'cancelled';
  payment_status: 'paid' | 'partial' | 'unpaid';
  pdf_path: string;
  is_tax_invoice: boolean;
  tax_invoice_no: string;
  tax_invoice_pdf?: string;
  credit_note_id?: number;
  created_at: string;
}

@Component({
  selector: 'app-sales-invoices-list',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  templateUrl: './sales-invoices-list.component.html',
  styleUrl: './sales-invoices-list.component.css'
})
export class SalesInvoicesListComponent implements OnInit {
  private http = inject(HttpClient);
  private toast = inject(ToastService);
  private router = inject(Router);

  invoices = signal<SalesInvoice[]>([]);
  loading = signal(false);
  generatingTaxInvoiceId = signal<number | null>(null);
  finalizingInvoiceId = signal<number | null>(null);
  
  // Warehouse selection for finalization
  warehouses = signal<any[]>([]);
  showWarehouseModal = signal(false);
  selectedWarehouseId = signal<number | null>(null);
  currentFinalizingInvoiceId = signal<number | null>(null);

  ngOnInit(): void {
    this.loadInvoices();
  }

  async loadWarehouses(): Promise<void> {
    try {
      const response: any = await firstValueFrom(
        this.http.get(`${environment.apiUrl}/inventory/warehouses`)
      );
      this.warehouses.set(response.data?.warehouses || []);
      console.log('[Sales Invoice] Loaded warehouses:', this.warehouses().length);
    } catch (error) {
      console.error('[Sales Invoice] Error loading warehouses:', error);
    }
  }

  async loadInvoices(): Promise<void> {
    this.loading.set(true);
    try {
      const response: any = await firstValueFrom(
        this.http.get(`${environment.apiUrl}/sales/invoices`)
      );
      this.invoices.set(response.data || response.invoices || response || []);
    } catch (error) {
      console.error('[SalesInvoices] Error loading invoices:', error);
      this.toast.error('فشل تحميل الفواتير');
    } finally {
      this.loading.set(false);
    }
  }

  getPdfUrl(pdfPath: string | null): string {
    if (!pdfPath) return '';
    if (pdfPath.startsWith('http')) return pdfPath;
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

  createNewInvoice(): void {
    this.router.navigate(['/sales/invoices/create']);
  }

  async generateTaxInvoice(invoiceId: number): Promise<void> {
    try {
      this.generatingTaxInvoiceId.set(invoiceId);
      console.log(`[Tax Invoice] Generating for sales invoice ID: ${invoiceId}`);
      
      // ✅ التصحيح: استخدام المسار الصحيح /sales/invoices
      const response: any = await firstValueFrom(
        this.http.post(`${environment.apiUrl}/finance/invoices/${invoiceId}/generate-tax-invoice`, {})
      );
      
      this.toast.success(response.message || 'تم إصدار الفاتورة الضريبية بنجاح');
      
      // Update local state immediately
      const currentInvoices = this.invoices();
      const updatedInvoices = currentInvoices.map(inv => {
        if (inv.id === invoiceId) {
          return {
            ...inv,
            is_tax_invoice: true,
            tax_invoice_no: response.data?.tax_invoice_no || inv.tax_invoice_no
          };
        }
        return inv;
      });
      this.invoices.set(updatedInvoices);
      
      // Reload to ensure full sync
      await this.loadInvoices();
      
      // Navigate to tax invoices page
      setTimeout(() => {
        this.router.navigate(['/sales/tax-invoices']);
      }, 1000);
      
    } catch (error: any) {
      console.error('[Tax Invoice] Error:', error);
      this.toast.error(error.error?.message || 'فشل إصدار الفاتورة الضريبية');
    } finally {
      this.generatingTaxInvoiceId.set(null);
    }
  }
  
  showDraftToast(): void {
    this.toast.warning('يجب تحويل الفاتورة إلى نهائية أولاً');
  }
  
  async finalizeInvoice(invoiceId: number): Promise<void> {
    // Load warehouses first
    await this.loadWarehouses();
    if (this.warehouses().length === 0) {
      this.toast.error('لا توجد مستودعات متاحة للخصم');
      return;
    }
    this.currentFinalizingInvoiceId.set(invoiceId);
    this.showWarehouseModal.set(true);
  }

  async confirmFinalize(): Promise<void> {
    const invoiceId = this.currentFinalizingInvoiceId();
    const warehouseId = this.selectedWarehouseId();
    
    if (!invoiceId) {
      this.toast.error('خطأ: لم يتم تحديد الفاتورة');
      return;
    }
    
    if (!warehouseId) {
      this.toast.warning('يرجى اختيار المستودع');
      return;
    }
    
    this.showWarehouseModal.set(false);
    this.finalizingInvoiceId.set(invoiceId);
    
    try {      
      const response: any = await firstValueFrom(
        this.http.post(`${environment.apiUrl}/sales/invoices/${invoiceId}/finalize`, { 
          warehouse_id: warehouseId 
        })
      );
      
      this.toast.success(response.message || 'تم اعتماد الفاتورة وخصم المخزون بنجاح');
      
      // Reload invoices to show updated status
      await this.loadInvoices();
      
    } catch (error: any) {
      console.error('[Finalize] Error:', error);
      this.toast.error(error.error?.message || 'فشل اعتماد الفاتورة');
    } finally {
      this.finalizingInvoiceId.set(null);
      this.currentFinalizingInvoiceId.set(null);
      this.selectedWarehouseId.set(null);
    }
  }

  cancelFinalize(): void {
    this.showWarehouseModal.set(false);
    this.currentFinalizingInvoiceId.set(null);
    this.selectedWarehouseId.set(null);
  }

  createCreditNote(invoiceId: number): void {
    this.router.navigate(['/sales/invoices', invoiceId, 'credit-note']);
  }
}