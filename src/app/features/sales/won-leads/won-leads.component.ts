import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, Router } from '@angular/router';
import { SalesService, WonLead } from '../../../core/services/sales.service';
import { ToastService } from '../../../core/services/toast.service';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-won-leads',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  templateUrl: './won-leads.component.html',
  styleUrl: './won-leads.component.css'
})
export class WonLeadsComponent implements OnInit {
  wonLeads = signal<WonLead[]>([]);
  loading = signal(false);
  processing = signal<string | null>(null);
  private initialized = false; // Prevent multiple calls

  constructor(
    private salesService: SalesService,
    private toast: ToastService,
    private router: Router,
    private translate: TranslateService
  ) {}

  ngOnInit(): void {
    if (!this.initialized) {
      this.initialized = true;
      this.loadWonLeads();
    }
  }

  async loadWonLeads(): Promise<void> {
    if (this.loading()) return; // Prevent concurrent calls
    
    this.loading.set(true);
    console.log('[WonLeads] Loading won leads...');
    
    try {
      const leads = await this.salesService.getWonLeads();
      this.wonLeads.set(leads);
      console.log(`[WonLeads] Loaded ${leads.length} won leads`);
    } catch (error: any) {
      console.error('[WonLeads] Error loading won leads:', error);
      const message = error?.error?.message || error?.message || this.translate.instant('leads.wonLeads.failedToLoad');
      this.toast.error(message);
      this.wonLeads.set([]); // Set empty array on error
    } finally {
      this.loading.set(false);
    }
  }

  async processWonLead(lead: WonLead): Promise<void> {
    if (this.processing()) return;

    const confirmed = confirm(
      this.translate.instant('leads.wonLeads.confirmProcess', {clientName: lead.client_name})
    );

    if (!confirmed) return;

    this.processing.set(lead.lead_id.toString());

    try {
      const result = await this.salesService.processWonLead(lead.lead_id);
      
      this.toast.success(result.message || this.translate.instant('leads.wonLeads.processSuccess'));
      
      // Reload the list
      await this.loadWonLeads();
      
    } catch (error: any) {
      const message = error?.error?.message || this.translate.instant('leads.wonLeads.processFailed');
      this.toast.error(message);
    } finally {
      this.processing.set(null);
    }
  }

  getProcessedStatus(lead: WonLead): string {
    if (lead.client_user_id && lead.receivable_account_id) {
      return 'processed';
    } else if (lead.client_user_id) {
      return 'partial';
    }
    return 'not_processed';
  }

  getStatusBadge(status: string): { text: string; class: string } {
    switch (status) {
      case 'processed':
        return {
          text: this.translate.instant('leads.wonLeads.processed'),
          class: 'bg-green-100 text-green-800'
        };
      case 'partial':
        return {
          text: this.translate.instant('leads.wonLeads.partial'),
          class: 'bg-yellow-100 text-yellow-800'
        };
      default:
        return {
          text: this.translate.instant('leads.wonLeads.notProcessed'),
          class: 'bg-red-100 text-red-800'
        };
    }
  }

  viewGeneralLedger(lead: WonLead): void {
    if (!lead.receivable_account_code) {
      this.toast.error(this.translate.instant('leads.wonLeads.receivableAccountNotAvailable'));
      return;
    }
    
    console.log(`[WonLeads] Navigating to General Ledger for account: ${lead.receivable_account_code}`);
    
    // Navigate to General Ledger with account code (same route as Trial Balance drill-down)
    this.router.navigate(['/finance/reports/ledger', lead.receivable_account_code]);
  }

  openCustomerStatement(lead: WonLead): void {
    this.router.navigate(['/finance/customer-statement', lead.lead_id]);
  }
}