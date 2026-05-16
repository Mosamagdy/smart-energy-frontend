import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { ClientPortalService, ClientInvoiceDetail } from '../../../data/api/client-portal.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-client-invoice-details',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './client-invoice-details.component.html',
  styleUrls: ['./client-invoice-details.component.css']
})
export class ClientInvoiceDetailsComponent implements OnInit {
  private clientService = inject(ClientPortalService);
  private route = inject(ActivatedRoute);
  private toast = inject(ToastService);

  invoice = signal<ClientInvoiceDetail | null>(null);
  loading = signal(true);

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) this.loadInvoice(parseInt(id));
  }

  loadInvoice(id: number): void {
    this.loading.set(true);
    this.clientService.getInvoice(id).subscribe({
      next: (response) => {
        this.invoice.set(response.data);
        this.loading.set(false);
      },
      error: (err) => {
        this.toast.error('فشل في تحميل الفاتورة');
        this.loading.set(false);
      }
    });
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
      'draft': 'مسودة', 'sent': 'مرسلة', 'paid': 'مدفوعة',
      'overdue': 'متأخرة', 'cancelled': 'ملغاة'
    };
    return texts[status] || status;
  }

  formatPrice(price: number): string {
    return new Intl.NumberFormat('ar-EG', { style: 'currency', currency: 'EGP', minimumFractionDigits: 0 }).format(price);
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' });
  }
}
