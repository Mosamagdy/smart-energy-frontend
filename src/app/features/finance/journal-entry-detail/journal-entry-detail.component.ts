import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { environment } from '../../../../environments/environment';
import { ToastService } from '../../../core/services/toast.service';

interface JournalEntry {
  id: number;
  entry_number: string;
  entry_date: string;
  type: string;
  description: string;
  status: string;
  is_posted: boolean;
  reference_documents?: any[];
  lines: JournalLine[];
}

interface JournalLine {
  id: number;
  account_code: string;
  account_name: string;
  account_name_ar?: string;
  debit_amount: number;
  credit_amount: number;
  description: string;
}

@Component({
  selector: 'app-journal-entry-detail',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  templateUrl: './journal-entry-detail.component.html',
  styleUrls: ['./journal-entry-detail.component.css']
})
export class JournalEntryDetailComponent implements OnInit {
  private http = inject(HttpClient);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private toast = inject(ToastService);


  
  journalEntry = signal<JournalEntry | null>(null);
  lines = signal<JournalLine[]>([]);
  referenceDocuments = signal<any[]>([]);
  totalDebit = signal(0);
  totalCredit = signal(0);
  isLoading = signal(true);

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadJournalEntry(parseInt(id));
    }
  }

  loadJournalEntry(id: number): void {
    this.isLoading.set(true);
    
    this.http.get<any>(`${environment.apiUrl}/journal-entries/${id}`).subscribe({
      next: (response) => {
        const entryData = response.data?.entry || response.data;
        this.journalEntry.set(entryData);
        this.lines.set(entryData?.lines || []);
        this.referenceDocuments.set(entryData?.reference_documents || []);
        this.calculateTotals();
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('[Journal Entry] Failed to load:', err);
        this.toast.error('فشل في تحميل القيد المحاسبي', 3000);
        this.isLoading.set(false);
      }
    });
  }

  calculateTotals(): void {
    const debit = this.lines().reduce((sum, line) => sum + (parseFloat(String(line.debit_amount)) || 0), 0);
    const credit = this.lines().reduce((sum, line) => sum + (parseFloat(String(line.credit_amount)) || 0), 0);
    this.totalDebit.set(debit);
    this.totalCredit.set(credit);
  }

  formatCurrency(amount: number): string {
    if (!amount && amount !== 0) return '0.00 ريال';
    return new Intl.NumberFormat('ar-EG', {
      style: 'decimal',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount) + ' ريال';
  }

  formatDate(dateStr?: string): string {
    if (!dateStr) return '-';
    try {
      return new Date(dateStr).toLocaleDateString('ar-EG', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return '-';
    }
  }

  getTypeLabel(type: string): string {
    const types: Record<string, string> = {
      'manual': 'يدوي',
      'auto': 'تلقائي',
      'recurring': 'دوري',
      'adjustment': 'تعديل',
      'purchase': 'شراء',
      'sale': 'بيع',
      'receipt': 'سند قبض',
      'payment': 'سند صرف'
    };
    return types[type] || type;
  }

  getStatusBadge(status: string): string {
    const badges: Record<string, string> = {
      'draft': 'bg-gray-100 text-gray-700',
      'pending': 'bg-yellow-100 text-yellow-700',
      'approved': 'bg-blue-100 text-blue-700',
      'rejected': 'bg-red-100 text-red-700',
      'posted': 'bg-green-100 text-green-700'
    };
    return badges[status] || 'bg-gray-100 text-gray-600';
  }

  getStatusLabel(status: string): string {
    const statuses: Record<string, string> = {
      'draft': 'مسودة',
      'pending': 'قيد المراجعة',
      'approved': 'معتمد',
      'rejected': 'مرفوض',
      'posted': 'مرحل'
    };
    return statuses[status] || status;
  }

  getEntryNumber(): string {
    return this.journalEntry()?.entry_number || '-';
  }

  getEntryDate(): string {
    return this.journalEntry()?.entry_date || '';
  }

  getEntryType(): string {
    return this.journalEntry()?.type || '';
  }

  getEntryStatus(): string {
    return this.journalEntry()?.status || '';
  }

  hasDescription(): boolean {
    return !!this.journalEntry()?.description;
  }

  getDescription(): string {
    return this.journalEntry()?.description || '';
  }

  viewReference(doc: any): void {
    if (doc.url || doc.file_path) {
      window.open(doc.url || doc.file_path, '_blank');
    }
  }

  goBack(): void {
    this.router.navigate(['/finance/journal-entries']);
  }
}