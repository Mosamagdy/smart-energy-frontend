import { Component, signal, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
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
}

@Component({
  selector: 'app-suppliers-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink , TranslateModule],
  templateUrl: './suppliers-list.component.html',
  styleUrls: ['./suppliers-list.component.css']
})
export class SuppliersListComponent implements OnInit {
  private http = inject(HttpClient);
  private auth = inject(AuthStore);
  private toast = inject(ToastService);
  private router = inject(Router);

  suppliers = signal<Supplier[]>([]);
  loading = signal<boolean>(false);
  showModal = signal<boolean>(false);
  
  // Form data
  formData = signal({
    name: '',
    name_ar: '',
    supplier_type: 'local' as 'local' | 'foreign',
    vat_number: '',
    cr_number: '',
    contact_person: '',
    phone: '',
    email: '',
    address: '',
    payment_terms: 'Net 30',
    notes: ''
  });

  ngOnInit(): void {
    this.loadSuppliers();
  }

  loadSuppliers(): void {
    this.loading.set(true);
    
    this.http.get<any>(
      `${environment.apiUrl}/suppliers`,
      { headers: { Authorization: `Bearer ${this.auth.token()}` } }
    ).subscribe({
      next: (response) => {
        this.suppliers.set(response.data || []);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Failed to load suppliers:', err);
        this.toast.error('فشل في تحميل الموردين', 3000);
        this.loading.set(false);
      }
    });
  }

  viewStatement(supplierId: number): void {
    this.router.navigate(['/finance/suppliers', supplierId, 'statement']);
  }

  openAddModal(): void {
    this.formData.set({
      name: '',
      name_ar: '',
      supplier_type: 'local',
      vat_number: '',
      cr_number: '',
      contact_person: '',
      phone: '',
      email: '',
      address: '',
      payment_terms: 'Net 30',
      notes: ''
    });
    this.showModal.set(true);
  }

  closeModal(): void {
    this.showModal.set(false);
  }

  onTypeChange(type: 'local' | 'foreign'): void {
    this.formData.update(data => ({ ...data, supplier_type: type }));
  }

  createSupplier(): void {
    const data = this.formData();
    
    // Validate required fields
    if (!data.name.trim()) {
      this.toast.warning('اسم المورد مطلوب', 3000);
      return;
    }

    if (!data.supplier_type) {
      this.toast.warning('نوع المورد مطلوب', 3000);
      return;
    }

    this.http.post<any>(
      `${environment.apiUrl}/suppliers`,
      data,
      { headers: { Authorization: `Bearer ${this.auth.token()}` } }
    ).subscribe({
      next: (response) => {
        this.toast.success('✅ تم إضافة المورد بنجاح', 4000);
        this.showModal.set(false);
        this.loadSuppliers();
      },
      error: (err) => {
        console.error('Failed to create supplier:', err);
        this.toast.error(err.error?.message || 'فشل في إضافة المورد', 3000);
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

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }
}
