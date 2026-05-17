import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-credit-note-create',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './credit-note-create.component.html',
  styleUrl: './credit-note-create.css'
})
export class CreditNoteCreateComponent {
  private http = inject(HttpClient);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  // Loading state
  loading = signal(false);
  error = signal<string | null>(null);

  // Invoice data
  invoiceId = signal<number>(0);
  invoice = signal<any>(null);

  // Form fields
  reason = signal('');
  returnDate = signal(new Date().toISOString().split('T')[0]);
  notes = signal('');

  // Return items
  returnItems = signal<Array<{
    description: string;
    quantity: number;
    unit_price: number;
    discount_amount: number;
    tax_rate: number;
  }>>([]);

  // Calculations
  subtotal = signal(0);
  discountAmount = signal(0);
  taxRate = signal(15);
  taxAmount = signal(0);
  totalAmount = signal(0);

  async ngOnInit(): Promise<void> {
    const id = this.route.snapshot.paramMap.get('invoiceId');
    console.log('[CreditNote] Route param invoiceId:', id);
    
    if (id) {
      this.invoiceId.set(Number(id));
      await this.loadInvoice();
    } else {
      this.error.set('No invoice ID provided in URL');
      console.error('[CreditNote] No invoiceId in route params');
    }
  }

  async loadInvoice(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    
    try {      
      const response: any = await firstValueFrom(
        this.http.get(`${environment.apiUrl}/sales/invoices/${this.invoiceId()}`)
      );
      
      this.invoice.set(response.data);

      // Sales invoices don't have line items - create a single return entry
      const invoiceData = response.data;
      this.returnItems.set([{
        description: `Return for Invoice ${invoiceData.invoice_number}`,
        quantity: 1,
        unit_price: Number(invoiceData.subtotal) || 0,
        discount_amount: Number(invoiceData.discount_amount) || 0,
        tax_rate: Number(invoiceData.vat_rate) || 15
      }]);
      
      this.calculateTotals();
      
    } catch (err: any) {
      console.error('[CreditNote] Error loading invoice:', err);
      console.error('[CreditNote] Error response:', err.error);
      this.error.set('Failed to load invoice: ' + (err.error?.message || err.message || 'Unknown error'));
    } finally {
      this.loading.set(false);
    }
  }

  calculateTotals(): void {
    let subtotal = 0;
    let discount = 0;
    let tax = 0;

    this.returnItems().forEach(item => {
      const lineSubtotal = item.quantity * item.unit_price;
      const lineDiscount = item.discount_amount;
      const lineTaxable = lineSubtotal - lineDiscount;
      const lineTax = lineTaxable * (item.tax_rate / 100);

      subtotal += lineSubtotal;
      discount += lineDiscount;
      tax += lineTax;
    });

    this.subtotal.set(parseFloat(subtotal.toFixed(2)));
    this.discountAmount.set(parseFloat(discount.toFixed(2)));
    this.taxAmount.set(parseFloat(tax.toFixed(2)));
    this.totalAmount.set(parseFloat((subtotal - discount + tax).toFixed(2)));
  }

  async submit(): Promise<void> {
    // Validation
    if (!this.reason()) {
      this.error.set('Please enter a reason for the return');
      return;
    }

    const itemsWithQuantity = this.returnItems().filter(item => item.quantity > 0);
    if (itemsWithQuantity.length === 0) {
      this.error.set('Please specify at least one item to return');
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    try {
      const payload = {
        invoice_id: this.invoiceId(),
        reason: this.reason(),
        return_date: this.returnDate(),
        notes: this.notes(),
        items: itemsWithQuantity,
        subtotal: this.subtotal(),
        discount_amount: this.discountAmount(),
        tax_rate: this.taxRate(),
        tax_amount: this.taxAmount(),
        total_amount: this.totalAmount()
      };

      await firstValueFrom(
        this.http.post(`${environment.apiUrl}/credit-notes`, payload)

      );
      
      // Navigate to credit notes list
      this.router.navigate(['/sales/credit-notes']);
    } catch (err: any) {
      this.error.set(err.error?.message || 'Failed to create credit note');
    } finally {
      this.loading.set(false);
    }
  }

  cancel(): void {
    this.router.navigate(['/sales/invoices', this.invoiceId()]);
  }

  formatCurrency(amount: number): string {
    return `${Number(amount || 0).toFixed(2)} SAR`;
  }
}
