import { Component, signal, inject, OnInit, computed } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { AuthStore } from '../../../core/auth/auth.store';
import { TranslateModule } from '@ngx-translate/core';

interface CreditNote {
  id: number;
  credit_note_number: string;
  invoice_id: number;
  original_invoice_number?: string;
  client_name?: string;
  project_name?: string;
  subtotal: number;
  discount_amount: number;
  tax_amount: number;
  total_amount: number;
  reason: string;
  return_date: string;
  status: 'draft' | 'final' | 'cancelled';
  created_at: string;
}

@Component({
  selector: 'app-credit-notes-list',
  standalone: true,
  imports: [CommonModule, CurrencyPipe ,TranslateModule] ,
  templateUrl: './credit-notes-list.component.html',
  styleUrl: './credit-notes-list.component.css'
})
export class CreditNotesListComponent implements OnInit {
  private http = inject(HttpClient);
  private auth = inject(AuthStore);

  // State
  loading = signal(true);
  creditNotes = signal<CreditNote[]>([]);
  error = signal<string | null>(null);

  // Computed totals with safe Number conversion
  totalReturnedAmount = computed(() => {
    const notes = this.creditNotes();
    return notes.reduce((sum, n) => sum + Number(n.total_amount || 0), 0);
  });

  totalTaxAmount = computed(() => {
    const notes = this.creditNotes();
    return notes.reduce((sum, n) => sum + Number(n.tax_amount || 0), 0);
  });

  totalNotesCount = computed(() => {
    return this.creditNotes().length;
  });

  ngOnInit(): void {
    this.loadCreditNotes();
  }

  async loadCreditNotes(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);

    try {
      const response: any = await firstValueFrom(
        this.http.get('/api/credit-notes')
      );

      console.log('[CreditNotesList] Loaded:', response.data);
      this.creditNotes.set(response.data || []);
    } catch (err: any) {
      console.error('[CreditNotesList] Error:', err);
      this.error.set('Failed to load credit notes');
    } finally {
      this.loading.set(false);
    }
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'final':
        return 'status-final';
      case 'draft':
        return 'status-draft';
      case 'cancelled':
        return 'status-cancelled';
      default:
        return '';
    }
  }

  getStatusText(status: string): string {
    switch (status) {
      case 'final':
        return 'نهائي';
      case 'draft':
        return 'مسودة';
      case 'cancelled':
        return 'ملغي';
      default:
        return status;
    }
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  formatCurrency(amount: number): string {
    const numAmount = Number(amount || 0);
    return `${numAmount.toFixed(2)} SAR`;
  }

  async downloadPDF(creditNoteId: number): Promise<void> {
    try {
      const token = this.auth.token();
      
      console.log('[CreditNotes] Downloading PDF for ID:', creditNoteId);
      console.log('[CreditNotes] Token present:', !!token);
      console.log('[CreditNotes] Token length:', token?.length || 0);
      
      if (!token) {
        alert('يرجى تسجيل الدخول مرة أخرى');
        return;
      }
      
      const response = await fetch(`/api/credit-notes/${creditNoteId}/pdf`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log('[CreditNotes] PDF response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('[CreditNotes] PDF error response:', errorText);
        throw new Error(`Failed to generate PDF: ${response.status} ${response.statusText}`);
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `credit-note-${creditNoteId}.pdf`;
      link.click();
      window.URL.revokeObjectURL(url);
      
      console.log('[CreditNotes] ✅ PDF downloaded successfully');
    } catch (error) {
      console.error('[CreditNotes] PDF download error:', error);
      alert('Failed to download PDF');
    }
  }
}
