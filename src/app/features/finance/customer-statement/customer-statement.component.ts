import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { LeadsService } from '../../../data/api/leads.service';

@Component({
  selector: 'app-customer-statement',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  templateUrl: './customer-statement.component.html',
  styleUrls: ['./customer-statement.component.css']
})
export class CustomerStatementComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private leadsService = inject(LeadsService);
  private translate = inject(TranslateService);

  loading = signal(false);
  clientName = signal('');
  entries = signal<any[]>([]);

  ngOnInit(): void {
    const leadId = Number(this.route.snapshot.paramMap.get('leadId'));
    if (!leadId) return;

    this.loading.set(true);
    this.leadsService.getCustomerStatement(leadId).subscribe({
      next: (res) => {
        const data = res?.data;
        this.clientName.set(data?.client_name || '');
        this.entries.set(data?.entries || []);
        this.loading.set(false);
      },
      error: () => {
        this.entries.set([]);
        this.loading.set(false);
      }
    });
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'SAR',
      maximumFractionDigits: 2
    }).format(Number(amount || 0));
  }

  getTransactionTypeLabel(type: string): string {
    const labels: Record<string, string> = {
      'invoice': this.translate.instant('customerStatement.type.invoice'),
      'payment': this.translate.instant('customerStatement.type.payment'),
      'credit_note': this.translate.instant('customerStatement.type.creditNote'),
      'debit_note': this.translate.instant('customerStatement.type.debitNote'),
      'opening_balance': this.translate.instant('customerStatement.type.openingBalance')
    };
    return labels[type] || type;
  }
}