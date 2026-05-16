import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ClientPortalService, ClientAsset, MaintenanceVisit, MaintenanceContract } from '../../../data/api/client-portal.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-client-maintenance',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './client-maintenance.component.html',
  styleUrls: ['./client-maintenance.component.css']
})
export class ClientMaintenanceComponent implements OnInit {
  private clientService = inject(ClientPortalService);
  private toast = inject(ToastService);

  assets = signal<ClientAsset[]>([]);
  visits = signal<MaintenanceVisit[]>([]);
  contracts = signal<MaintenanceContract[]>([]);
  loading = signal(true);
  activeTab = signal<'assets' | 'visits' | 'contracts'>('assets');

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.loading.set(true);
    Promise.all([
      this.clientService.getAssets().toPromise(),
      this.clientService.getMaintenanceVisits().toPromise(),
      this.clientService.getMaintenanceContracts().toPromise()
    ]).then(([assets, visits, contracts]) => {
      this.assets.set(assets?.data || []);
      this.visits.set(visits?.data || []);
      this.contracts.set(contracts?.data || []);
      this.loading.set(false);
    }).catch(err => {
      this.toast.error('فشل في تحميل بيانات الصيانة');
      this.loading.set(false);
    });
  }

  getStatusClass(status: string): string {
    const classes: Record<string, string> = {
      'active': 'bg-green-100 text-green-800',
      'completed': 'bg-blue-100 text-blue-800',
      'scheduled': 'bg-yellow-100 text-yellow-800',
      'expired': 'bg-gray-100 text-gray-800',
      'cancelled': 'bg-red-100 text-red-800'
    };
    return classes[status] || 'bg-gray-100 text-gray-800';
  }

  getStatusText(status: string): string {
    const texts: Record<string, string> = {
      'active': 'نشط', 'completed': 'مكتمل', 'scheduled': 'مجدول',
      'expired': 'منتهي', 'cancelled': 'ملغي'
    };
    return texts[status] || status;
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' });
  }
}
