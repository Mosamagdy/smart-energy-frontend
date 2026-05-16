import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ClientPortalService, ClientInvoice } from '../../../data/api/client-portal.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-client-invoices',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './client-invoices.component.html',
  styleUrls: ['./client-invoices.component.css']
})
export class ClientInvoicesComponent implements OnInit {
  private clientService = inject(ClientPortalService);
  private router = inject(Router);
  private toast = inject(ToastService);

  invoices = signal<ClientInvoice[]>([]);
  loading = signal(true);

  ngOnInit(): void {
    this.loadInvoices();
  }

  loadInvoices(): void {
    this.loading.set(true);
    this.clientService.getInvoices().subscribe({
      next: (response) => {
        this.invoices.set(response.data);
        this.loading.set(false);
      },
      error: (err) => {
        this.toast.error('فشل في تحميل الفواتير');
        this.loading.set(false);
      }
    });
  }

  viewInvoice(invoice: ClientInvoice): void {
    this.router.navigate(['/client/invoices', invoice.id]);
  }

  getStatusBadgeClass(status: string): string {
    const classes: Record<string, string> = {
      'draft': 'bg-gray-100 text-gray-800',
      'sent': 'bg-blue-100 text-blue-800',
      'paid': 'bg-green-100 text-green-800',
      'overdue': 'bg-red-100 text-red-800',
      'cancelled': 'bg-gray-100 text-gray-800'
    };
    return classes[status] || 'bg-gray-100 text-gray-800';
  }

  getStatusText(status: string): string {
    const texts: Record<string, string> = {
      'draft': 'مسودة',
      'sent': 'مرسلة',
      'paid': 'مدفوعة',
      'overdue': 'متأخرة',
      'cancelled': 'ملغاة'
    };
    return texts[status] || status;
  }

  formatPrice(price: number): string {
    return new Intl.NumberFormat('ar-EG', {
      style: 'currency',
      currency: 'EGP',
      minimumFractionDigits: 0
    }).format(price);
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }
}
