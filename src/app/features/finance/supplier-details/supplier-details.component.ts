import { Component, signal, OnInit, inject } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment.prod';
import { AuthStore } from '../../../core/auth/auth.store';
import { ToastService } from '../../../core/services/toast.service';
import { TranslateModule } from '@ngx-translate/core';

interface Supplier {
  id: number;
  supplier_code: string;
  name: string;
  name_ar?: string;
  supplier_type: 'local' | 'foreign';
  vat_number?: string;
  cr_number?: string;
  contact_person?: string;
  phone?: string;
  email?: string;
  address?: string;
  payment_terms?: string;
  coa_account_code?: string;
  is_active: boolean;
  notes?: string;
  created_at: string;
  updated_at: string;
}

@Component({
  selector: 'app-supplier-details',
  standalone: true,
  imports: [CommonModule, DatePipe, TranslateModule],
  templateUrl: './supplier-details.component.html',
  styleUrls: ['./supplier-details.component.css']
})
export class SupplierDetailsComponent implements OnInit {
  private http = inject(HttpClient);
  private auth = inject(AuthStore);
  private toast = inject(ToastService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  supplier = signal<Supplier | null>(null);
  loading = signal<boolean>(false);

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadSupplier(id);
    }
  }

  loadSupplier(id: string): void {
    this.loading.set(true);
    
    this.http.get<any>(
      `${environment.apiUrl}/suppliers/${id}`,
      { headers: { Authorization: `Bearer ${this.auth.token()}` } }
    ).subscribe({
      next: (response) => {
        this.supplier.set(response.data);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Failed to load supplier:', err);
        this.toast.error('فشل في تحميل بيانات المورد', 3000);
        this.loading.set(false);
        this.router.navigate(['/suppliers']);
      }
    });
  }

  getSupplierTypeLabel(type: string): string {
    return type === 'local' ? 'محلي' : 'أجنبي';
  }

  getSupplierTypeColor(type: string): string {
    return type === 'local' 
      ? 'bg-green-100 text-green-700 border-green-300'
      : 'bg-blue-100 text-blue-700 border-blue-300';
  }

  getStatusColor(isActive: boolean): string {
    return isActive 
      ? 'bg-green-100 text-green-700 border-green-300'
      : 'bg-red-100 text-red-700 border-red-300';
  }

  getStatusLabel(isActive: boolean): string {
    return isActive ? 'نشط' : 'غير نشط';
  }

  goBack(): void {
    this.router.navigate(['/suppliers']);
  }
}
