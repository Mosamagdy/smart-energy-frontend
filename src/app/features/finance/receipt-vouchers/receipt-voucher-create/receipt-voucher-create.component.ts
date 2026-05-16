import { Component, OnInit, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { environment } from '../../../../../environments/environment';
import { ToastService } from '../../../../core/services/toast.service';
import { firstValueFrom } from 'rxjs';

interface Client {
  id: number;
  client_name: string;
  lead_id: number;
  receivable_account_id: number | null;
  receivable_account_code: string | null;
}

interface Invoice {
  id: number;
  invoice_number: string;
  issue_date: string;
  total_amount: number;
  paid_amount: number;
  outstanding_balance: number;
  amount_to_pay: number;
}

interface PaymentAccount {
  id: number;
  account_code: string;
  account_name_ar: string;
}

@Component({
  selector: 'app-receipt-voucher-create',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, TranslateModule],
  templateUrl: './receipt-voucher-create.component.html',
  styleUrl: './receipt-voucher-create.component.css'
})
export class ReceiptVoucherCreateComponent implements OnInit {
  private http = inject(HttpClient);
  private toast = inject(ToastService);
  private router = inject(Router);

  // Form data
  selectedClientId = signal<number | null>(null);
  selectedClientName = signal<string>('');
  receiptDate = signal<string>(new Date().toISOString().split('T')[0]);
  paymentMethod = signal<string>('bank');
  selectedPaymentAccountId = signal<number | null>(null);
  referenceNo = signal<string>('');
  description = signal<string>('');

  // Data
  clients = signal<Client[]>([]);
  invoices = signal<Invoice[]>([]);
  paymentAccounts = signal<PaymentAccount[]>([]);
  isLoading = signal(false);
  isSubmitting = signal(false);

  ngOnInit(): void {
    this.loadClients();
    this.loadPaymentAccounts();
  }

  async loadClients(): Promise<void> {
    try {
      const response: any = await firstValueFrom(
        this.http.get(`${environment.apiUrl}/sales/leads/won`)
      );
      // Map won leads to client format
      const clients = (response.data || [])
        .filter((lead: any) => lead.client_user_id !== null) // Only processed leads
        .map((lead: any) => ({
          id: lead.client_user_id,
          client_name: lead.client_name,
          lead_id: lead.lead_id,
          receivable_account_id: lead.receivable_account_id,
          receivable_account_code: lead.receivable_account_code
        }));
      this.clients.set(clients);
    } catch (error: any) {
      console.error('Failed to load clients:', error);
    }
  }

  async loadPaymentAccounts(): Promise<void> {
    try {
      const response: any = await firstValueFrom(
        this.http.get(`${environment.apiUrl}/finance/treasury/dashboard`)
      );
      const dashboard = response.data;
      // Combine cash and bank accounts
      const accounts = [
        ...(dashboard.cash_accounts || []),
        ...(dashboard.bank_accounts || [])
      ];
      this.paymentAccounts.set(accounts);
    } catch (error: any) {
      console.error('Failed to load payment accounts:', error);
    }
  }

  async onClientSelect(clientId: number): Promise<void> {
    console.log('[Receipt Voucher Create] Client selected - ID:', clientId);
    
    this.selectedClientId.set(clientId);
    const client = this.clients().find(c => c.id === clientId);
    if (client) {
      console.log('[Receipt Voucher Create] Client details:', client);
      this.selectedClientName.set(client.client_name);
    }

    // Load outstanding invoices
    try {
      console.log(`[Receipt Voucher Create] Loading invoices for client ID: ${clientId}`);
      const response: any = await firstValueFrom(
        this.http.get(`${environment.apiUrl}/finance/receipt-vouchers/clients/${clientId}/outstanding-invoices`)
      );
      console.log('[Receipt Voucher Create] Invoices response:', response);
      
      const invoices = (response.data || []).map((inv: any) => ({
        ...inv,
        amount_to_pay: 0
      }));
      console.log(`[Receipt Voucher Create] Loaded ${invoices.length} invoices`);
      this.invoices.set(invoices);
    } catch (error: any) {
      console.error('[Receipt Voucher Create] Error loading invoices:', error);
      this.toast.error(error?.error?.message || 'فشل تحميل الفواتير');
    }
  }

  onAmountChange(invoice: Invoice, amount: string): void {
    const numAmount = parseFloat(amount) || 0;
    if (numAmount > invoice.outstanding_balance) {
      this.toast.error('المبلغ يتجاوز الرصيد المتبقي');
      invoice.amount_to_pay = invoice.outstanding_balance;
    } else {
      invoice.amount_to_pay = numAmount;
    }
    this.invoices.set([...this.invoices()]);
  }

  get totalAmount(): number {
    return this.invoices().reduce((sum, inv) => sum + inv.amount_to_pay, 0);
  }

  get canSubmit(): boolean {
    return this.selectedClientId() !== null &&
           this.selectedPaymentAccountId() !== null &&
           this.totalAmount > 0 &&
           this.invoices().some(inv => inv.amount_to_pay > 0);
  }

  async submitVoucher(postImmediately: boolean = false): Promise<void> {
    if (!this.canSubmit) {
      this.toast.error('يرجى تعبئة جميع الحقول المطلوبة');
      return;
    }

    this.isSubmitting.set(true);
    try {
      const invoices = this.invoices()
        .filter(inv => inv.amount_to_pay > 0)
        .map(inv => ({
          sales_invoice_id: inv.id,
          amount_applied: inv.amount_to_pay
        }));

      const payload = {
        client_id: this.selectedClientId(),
        receipt_date: this.receiptDate(),
        amount: this.totalAmount,
        payment_method: this.paymentMethod(),
        payment_account_id: this.selectedPaymentAccountId(),
        reference_no: this.referenceNo() || null,
        description: this.description() || null,
        status: postImmediately ? 'posted' : 'draft',
        invoices: invoices
      };

      const response: any = await firstValueFrom(
        this.http.post(`${environment.apiUrl}/finance/receipt-vouchers`, payload)
      );

      if (postImmediately) {
        this.toast.success('تم إنشاء وإعلان سند القبض بنجاح - تم تحديث رصيد البنك');
      } else {
        this.toast.success('تم إنشاء سند القبض كمسودة');
      }

      this.router.navigate(['/finance/receipt-vouchers']);
    } catch (error: any) {
      this.toast.error(error?.error?.message || 'فشل إنشاء سند القبض');
    } finally {
      this.isSubmitting.set(false);
    }
  }
}
