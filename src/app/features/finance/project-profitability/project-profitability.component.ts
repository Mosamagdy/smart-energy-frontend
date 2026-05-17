import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpParams } from '@angular/common/http';
import { TranslateModule } from '@ngx-translate/core';
import { environment } from '../../../../environments/environment.prod';

interface ProfitabilityRow {
  project_id: number;
  project_name: string;
  material_spend: number;
  invoiced_amount: number;
  gross_margin: number;
}

@Component({
  selector: 'app-project-profitability',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  templateUrl: './project-profitability.component.html',
  styleUrls: ['./project-profitability.component.css']
})
export class ProjectProfitabilityComponent implements OnInit {
  private http = inject(HttpClient);

  rows = signal<ProfitabilityRow[]>([]);
  loading = signal(false);

  projectSearch = '';
  startDate = '';
  endDate = '';

  filteredRows = computed(() => {
    const q = this.projectSearch.trim().toLowerCase();
    if (!q) return this.rows();
    return this.rows().filter(r => (r.project_name || '').toLowerCase().includes(q));
  });

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.loading.set(true);
    let params = new HttpParams();
    if (this.startDate) params = params.set('startDate', this.startDate);
    if (this.endDate) params = params.set('endDate', this.endDate);

    this.http.get<any>(`${environment.apiUrl}/reports/project-cost-vs-invoiced`, { params }).subscribe({
      next: (res) => {
        this.rows.set(res?.data?.projects || []);
        this.loading.set(false);
      },
      error: () => {
        this.rows.set([]);
        this.loading.set(false);
      }
    });
  }

  marginPercent(row: ProfitabilityRow): number {
    if (!row.invoiced_amount) return 0;
    return (row.gross_margin / row.invoiced_amount) * 100;
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'SAR',
      maximumFractionDigits: 2
    }).format(amount || 0);
  }
}