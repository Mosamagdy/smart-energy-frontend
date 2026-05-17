import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment.prod';
import { TranslateModule } from '@ngx-translate/core';
import { AuthStore } from '../../../core/auth/auth.store';

@Component({
  selector: 'app-warehouses-list',
  standalone: true,
  imports: [CommonModule, FormsModule ,TranslateModule],
  templateUrl: './warehouses-list.component.html',
  styleUrls: ['./warehouses-list.component.css']
})
export class WarehousesListComponent implements OnInit {
  private http = inject(HttpClient);
  private auth = inject(AuthStore);

  warehouses = signal<any[]>([]);
  loading = signal(false);
  showModal = signal(false);
  editingWarehouse = signal<any>(null);

  // Form data
  formData = signal({
    warehouse_name: '',
    warehouse_name_ar: '',
    location: '',
    location_ar: '',
    address: '',
    supervisor_id: null,
    capacity_cubic_m: null,
    notes: ''
  });

  // Computed
  activeWarehouses = computed(() => this.warehouses().filter(w => w.is_active));
  totalWarehouses = computed(() => this.warehouses().length);
  activeCount = computed(() => this.activeWarehouses().length);

  ngOnInit(): void {
    this.loadWarehouses();
  }

  canManageWarehouses(): boolean {
    const role = this.auth.role();
    return role === 'super_admin' || role === 'general_manager' || role === 'finance_manager' || role === 'warehouse_manager' || role === 'inventory_manager';
  }

  loadWarehouses(): void {
    this.loading.set(true);
    this.http.get(`${environment.apiUrl}/warehouses`).subscribe({
      next: (response: any) => {
        this.warehouses.set(response.data || []);
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Failed to load warehouses:', error);
        this.loading.set(false);
      }
    });
  }

  openCreateModal(): void {
    this.editingWarehouse.set(null);
    this.formData.set({
      warehouse_name: '',
      warehouse_name_ar: '',
      location: '',
      location_ar: '',
      address: '',
      supervisor_id: null,
      capacity_cubic_m: null,
      notes: ''
    });
    this.showModal.set(true);
  }

  openEditModal(warehouse: any): void {
    this.editingWarehouse.set(warehouse);
    this.formData.set({
      warehouse_name: warehouse.warehouse_name || '',
      warehouse_name_ar: warehouse.warehouse_name_ar || '',
      location: warehouse.location || '',
      location_ar: warehouse.location_ar || '',
      address: warehouse.address || '',
      supervisor_id: warehouse.supervisor_id || null,
      capacity_cubic_m: warehouse.capacity_cubic_m || null,
      notes: warehouse.notes || ''
    });
    this.showModal.set(true);
  }

  closeModal(): void {
    this.showModal.set(false);
    this.editingWarehouse.set(null);
  }

  saveWarehouse(): void {
    const data = this.formData();
    
    // Validation
    if (!data.warehouse_name || !data.location) {
      alert('يرجى ملء جميع الحقول المطلوبة');
      return;
    }

    const isEditing = !!this.editingWarehouse();
    const url = isEditing 
      ? `${environment.apiUrl}/warehouses/${this.editingWarehouse().id}`
      : `${environment.apiUrl}/warehouses`;
    
    const request = isEditing 
      ? this.http.put(url, data)
      : this.http.post(url, data);

    request.subscribe({
      next: (response: any) => {
        this.closeModal();
        this.loadWarehouses();
        alert(isEditing ? 'تم تحديث المستودع بنجاح' : 'تم إنشاء المستودع بنجاح');
      },
      error: (error) => {
        console.error('Failed to save warehouse:', error);
        alert('فشل في حفظ المستودع');
      }
    });
  }

  deleteWarehouse(warehouse: any): void {
    if (!confirm(`هل أنت متأكد من حذف المستودع "${warehouse.warehouse_name}"؟`)) {
      return;
    }

    this.http.delete(`${environment.apiUrl}/warehouses/${warehouse.id}`).subscribe({
      next: (response: any) => {
        this.loadWarehouses();
        alert('تم حذف المستودع بنجاح');
      },
      error: (error) => {
        console.error('Failed to delete warehouse:', error);
        alert('فشل في حذف المستودع');
      }
    });
  }

  // Badge colors
  getStatusColor(isActive: boolean): string {
    return isActive ? '#10b981' : '#ef4444';
  }

  getStatusText(isActive: boolean): string {
    return isActive ? 'نشط' : 'غير نشط';
  }
}
