import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment.prod';

// ============================================================================
// Sales Module Types
// ============================================================================

export interface WonLead {
  lead_id: number;
  project_id: number;
  project_name: string;
  client_name: string;
  contact_email: string | null;
  contact_phone: string | null;
  lead_status: string;
  client_user_id: number | null;
  estimated_value: number | null;
  created_at: string;
  receivable_account_id: number | null; // Not in leads table - will be null until processWonLead creates it
  receivable_account_code: string | null; // Account code for navigation (e.g., "121001")
}

export interface SalesInvoice {
  id: number;
  invoice_number: string;
  project_id: number | null;
  client_id: number | null;
  lead_id: number;
  issue_date: string;
  due_date: string | null;
  subtotal: number;
  vat_rate: number;
  vat_amount: number;
  total_amount: number;
  status: string;
  payment_status: string;
  amount_paid: number;
  pdf_path: string | null;
  description: string | null;
  notes: string | null;
  client_name: string;
  contact_email: string | null;
  project_name: string | null;
  journal_entry_number: string | null;
  created_at: string;
  // Tax invoice fields
  is_tax_invoice?: boolean;
  tax_invoice_no?: string | null;
  zatca_uuid?: string | null;
  zatca_status?: string;
  qr_code_data?: string | null;
}

export interface ProcessWonLeadResult {
  success: boolean;
  lead_id: number;
  client_user_id: number;
  receivable_account_id: number;
  account_code: string;
  project_id: number | null;
}

export interface CreateInvoiceResult {
  success: boolean;
  invoice: SalesInvoice;
  pdf_path: string | null;
  journal_entry_id: number;
  journal_entry_details: {
    debit: {
      account_code: string;
      account_name: string;
      amount: number;
    };
    credit_revenue: {
      account_code: string;
      amount: number;
    };
    credit_vat: {
      account_code: string;
      amount: number;
    };
    total_debit: number;
    total_credit: number;
    is_balanced: boolean;
  };
}

// ============================================================================
// Sales Service
// ============================================================================

@Injectable({
  providedIn: 'root'
})
export class SalesService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/sales`;

  // ========================================================================
  // Won Leads
  // ========================================================================

  /**
   * Get all won leads from the system
   */
  async getWonLeads(): Promise<WonLead[]> {
    const response: any = await firstValueFrom(
      this.http.get(`${this.apiUrl}/leads/won`)
    );
    return response.data || [];
  }

  /**
   * Process a won lead: Create client user, AR account, link project
   */
  async processWonLead(leadId: number): Promise<any> {
    const response: any = await firstValueFrom(
      this.http.post(`${this.apiUrl}/leads/${leadId}/process-won`, {})
    );
    return response;
  }

  // ========================================================================
  // Sales Invoices
  // ========================================================================

  /**
   * Get all sales invoices with optional filters
   */
  async getInvoices(filters?: {
    status?: string;
    client_id?: number;
    lead_id?: number;
  }): Promise<SalesInvoice[]> {
    const params: any = {};
    if (filters?.status) params.status = filters.status;
    if (filters?.client_id) params.client_id = filters.client_id;
    if (filters?.lead_id) params.lead_id = filters.lead_id;

    const response: any = await firstValueFrom(
      this.http.get(`${this.apiUrl}/invoices`, { params })
    );
    return response.data || [];
  }

  /**
   * Get single invoice by ID
   */
  async getInvoiceById(invoiceId: number): Promise<SalesInvoice> {
    const response: any = await firstValueFrom(
      this.http.get(`${this.apiUrl}/invoices/${invoiceId}`)
    );
    return response.data;
  }

  /**
   * Create sales invoice with automatic journal entry and PDF
   */
  async createInvoice(data: {
    lead_id: number;
    client_id?: number; // Optional - backend will derive from lead if not provided
    project_id?: number;
    subtotal: number;
    vat_rate?: number;
    revenue_account_id: number;
    issue_date?: string;
    due_date?: string;
    description?: string;
    notes?: string;
  }): Promise<CreateInvoiceResult> {
    const response: any = await firstValueFrom(
      this.http.post(`${this.apiUrl}/invoices`, data)
    );
    return response.data;
  }

  /**
   * Get PDF path for an invoice
   */
  async getInvoicePDF(invoiceId: number): Promise<{ pdf_path: string; invoice_number: string }> {
    const response: any = await firstValueFrom(
      this.http.get(`${this.apiUrl}/invoices/${invoiceId}/pdf`)
    );
    return response.data;
  }
}
