import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { environment } from '../../../../environments/environment.prod';
import { ToastService } from '../../../core/services/toast.service';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-payment-vouchers-list',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  templateUrl: './payment-vouchers-list.component.html',
  styleUrls: ['./payment-vouchers-list.component.css']
})
export class PaymentVouchersListComponent implements OnInit {
  vouchers = signal<any[]>([]);
  filteredVouchers = signal<any[]>([]);
  isLoading = signal(true);
  selectedStatus = signal('all');

  constructor(
    private http: HttpClient,
    public router: Router,
    private toast: ToastService
  ) {}

  ngOnInit(): void {
    this.loadVouchers();
  }

  loadVouchers(): void {
    this.isLoading.set(true);
    
    this.http.get<any>(`${environment.apiUrl}/finance/payment-vouchers`).subscribe({
      next: (response) => {
        this.vouchers.set(response.data.vouchers || []);
        this.filteredVouchers.set(this.vouchers());
        this.isLoading.set(false);
      },
      error: (err) => {
        this.toast.error('فشل في تحميل سندات الصرف', 3000);
        this.isLoading.set(false);
      }
    });
  }

  applyFilters(): void {
    const allVouchers = this.vouchers();
    const status = this.selectedStatus();
    
    if (status === 'all' || !status) {
      this.filteredVouchers.set(allVouchers);
      return;
    }
    
    const filtered = allVouchers.filter(v => v.status === status);
    this.filteredVouchers.set(filtered);
  }

  viewVoucher(id: number): void {
    this.router.navigate(['/finance/payment-vouchers', id]);
  }

  getStatusBadge(status: string): string {
    switch (status) {
      case 'completed':
        return 'badge-success';
      case 'draft':
        return 'badge-warning';
      case 'cancelled':
        return 'badge-danger';
      default:
        return 'badge-secondary';
    }
  }

  getStatusLabel(status: string): string {
    switch (status) {
      case 'completed':
        return 'مكتمل';
      case 'draft':
        return 'مسودة';
      case 'cancelled':
        return 'ملغي';
      default:
        return status;
    }
  }

  getMethodLabel(method: string): string {
    switch (method) {
      case 'cash':
        return 'نقدي';
      case 'bank_transfer':
        return 'تحويل بنكي';
      case 'check':
        return 'شيك';
      default:
        return method;
    }
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'decimal',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount) + ' ريال';
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }
}
