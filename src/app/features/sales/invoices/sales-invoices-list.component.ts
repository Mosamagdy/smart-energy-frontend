import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { SalesService, SalesInvoice } from '../../../core/services/sales.service';
import { ToastService } from '../../../core/services/toast.service';
import { environment } from '../../../../environments/environment';
import { firstValueFrom } from 'rxjs';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-sales-invoices-list',
  standalone: true,
  imports: [CommonModule, FormsModule ,TranslateModule],
  templateUrl: './sales-invoices-list.component.html',
  styleUrl: './sales-invoices-list.component.css'
})
export class SalesInvoicesListComponent implements OnInit {
  private http = inject(HttpClient);

  invoices = signal<SalesInvoice[]>([]);
  loading = signal(false);
  generatingTaxInvoiceId = signal<number | null>(null); // Track which invoice is being generated
  finalizingInvoiceId = signal<number | null>(null); // Track which invoice is being finalized
  
  // Warehouse selection for finalization
  warehouses = signal<any[]>([]);
  showWarehouseModal = signal(false);
  selectedWarehouseId = signal<number | null>(1); // Default to WH-DEFAULT
  pendingInvoiceId = signal<number | null>(null);

  constructor(
    private salesService: SalesService,
    private toast: ToastService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadInvoices();
    this.loadWarehouses();
  }

  async loadWarehouses(): Promise<void> {
    try {
      const response: any = await firstValueFrom(
        this.http.get(`${environment.apiUrl}/warehouses`)
      );
      this.warehouses.set(response.data || []);
      console.log('[Sales Invoice] Loaded warehouses:', this.warehouses());
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

      this.invoices.set(response.data || []);
      console.log(`[SalesInvoices] Loaded ${this.invoices().length} invoices`);
      
      // Debug: Log first invoice to check fields
      if (this.invoices().length > 0) {
        const firstInvoice = this.invoices()[0];
        console.log('[SalesInvoices] First invoice sample:', {
          id: firstInvoice.id,
          invoice_number: firstInvoice.invoice_number,
          status: firstInvoice.status,
          is_tax_invoice: firstInvoice.is_tax_invoice,
          tax_invoice_no: firstInvoice.tax_invoice_no,
          has_is_tax_invoice_field: 'is_tax_invoice' in firstInvoice
        });
        
        // Log ALL invoices with tax status
        console.log('[SalesInvoices] Tax invoice status for all invoices:');
        this.invoices().forEach(inv => {
          console.log(`  - ID: ${inv.id}, Number: ${inv.invoice_number}, Status: ${inv.status}, is_tax_invoice: ${inv.is_tax_invoice}`);
        });
      }
    } catch (error) {
      console.error('[SalesInvoices] Error loading invoices:', error);
      this.toast.error('فشل تحميل الفواتير');
    } finally {
      this.loading.set(false);
    }
  }

  getPdfUrl(pdfPath: string | null): string {
    if (!pdfPath) return '';
    // Normalize slashes and strip leading slash
    const cleanPath = pdfPath.replace(/\\/g, '/').replace(/^\/+/, '');
    // Strip /api suffix from apiUrl to get backend root (e.g. http://localhost:3000)
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
      // Immediately disable button
      this.generatingTaxInvoiceId.set(invoiceId);
      
      console.log(`[Tax Invoice] Generating for sales invoice ID: ${invoiceId}`);
      
      const response: any = await firstValueFrom(
        this.http.post(`${environment.apiUrl}/finance/invoices/${invoiceId}/generate-tax-invoice`, {})
      );
      
      console.log('[Tax Invoice] ✅ Success response:', response);
      
      this.toast.success(response.message || 'تم إصدار الفاتورة الضريبية بنجاح');
      
      // IMMEDIATE STATE SYNC: Update the local invoice object without waiting for reload
      const currentInvoices = this.invoices();
      const updatedInvoices = currentInvoices.map(inv => {
        if (inv.id === invoiceId) {
          return {
            ...inv,
            is_tax_invoice: true,
            tax_invoice_no: response.data?.tax_invoice_no || inv.tax_invoice_no,
            zatca_uuid: response.data?.zatca_uuid || inv.zatca_uuid,
            qr_code_data: response.data?.qr_code_data || inv.qr_code_data
          };
        }
        return inv;
      });
      
      // Update signal immediately
      this.invoices.set(updatedInvoices);
      
      console.log('[Tax Invoice] ✅ Local state updated - button will change to green');
      
      // Reload invoices in background to ensure full sync
      await this.loadInvoices();
      
      // Navigate to tax invoices page to see the result
      setTimeout(() => {
        this.router.navigate(['/sales/tax-invoices']);
      }, 1000);
      
    } catch (error: any) {
      console.error('[Tax Invoice] Error:', error);
      this.toast.error(error.error?.message || 'فشل إصدار الفاتورة الضريبية');
    } finally {
      // Re-enable button
      this.generatingTaxInvoiceId.set(null);
    }
  }
  
  showDraftToast(): void {
    this.toast.error('يجب تحويل الفاتورة إلى نهائية أولاً');
  }
  
  async finalizeInvoice(invoiceId: number): Promise<void> {
    // Show warehouse selection modal
    this.pendingInvoiceId.set(invoiceId);
    this.selectedWarehouseId.set(1); // Default to WH-DEFAULT
    this.showWarehouseModal.set(true);
  }

  async confirmFinalize(): Promise<void> {
    const invoiceId = this.pendingInvoiceId();
    const warehouseId = this.selectedWarehouseId();
    
    if (!invoiceId) {
      this.toast.error('خطأ: لم يتم تحديد الفاتورة');
      return;
    }
    
    this.showWarehouseModal.set(false);
    
    try {
      console.log(`[Finalize Button] ===== CLICKED =====`);
      console.log(`[Finalize Button] Invoice ID: ${invoiceId}`);
      console.log(`[Finalize Button] Warehouse ID: ${warehouseId}`);
      
      // Immediately disable button
      this.finalizingInvoiceId.set(invoiceId);
      
      const url = `${environment.apiUrl}/sales/invoices/${invoiceId}/finalize`;
      console.log(`[Finalize Button] POST URL: ${url}`);
      
      const response: any = await firstValueFrom(
        this.http.post(url, { warehouse_id: warehouseId })
      );
      
      console.log(`[Finalize Button] ✅ Response:`, response);
      
      this.toast.success(response.message || 'تم اعتماد الفاتورة وخصم المخزون بنجاح');
      
      // Reload invoices to show updated status
      await this.loadInvoices();
      
    } catch (error: any) {
      console.error(`[Finalize Button] ❌ ERROR:`, error);
      console.error(`[Finalize Button] Error status:`, error.status);
      console.error(`[Finalize Button] Error message:`, error.error?.message);
      this.toast.error(error.error?.message || 'فشل اعتماد الفاتورة');
    } finally {
      // Re-enable button
      this.finalizingInvoiceId.set(null);
      this.pendingInvoiceId.set(null);
    }
  }

  cancelFinalize(): void {
    this.showWarehouseModal.set(false);
    this.pendingInvoiceId.set(null);
  }

  createCreditNote(invoiceId: number): void {
    this.router.navigate(['/sales/invoices', invoiceId, 'credit-note']);
  }
}