import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { environment } from '../../../../environments/environment';
import { AuthStore } from '../../../core/auth/auth.store';

@Component({
  selector: 'app-inventory-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  templateUrl: './inventory-dashboard.component.html',
  styleUrls: ['./inventory-dashboard.component.css']
})
export class InventoryDashboardComponent implements OnInit {
  private http = inject(HttpClient);
  public translate = inject(TranslateService);
  private auth = inject(AuthStore);

  inventoryItems = signal<any[]>([]);
  allInventoryItems = signal<any[]>([]);
  warehouses = signal<any[]>([]);
  loading = signal(false);

  // Filters
  selectedWarehouse = signal<number | null>(null);
  selectedCategory = signal<string>('');

  // Stock-in modal
  showStockInModal = signal(false);
  stockInForm = signal({
    item_id: null as number | null,
    warehouse_id: 1,
    quantity: null as number | null,
    notes: ''
  });

  // Create new item modal
  showCreateItemModal = signal(false);
  newItemForm = signal({
    item_name: '',
    item_name_ar: '',
    category: '',
    unit_of_measure: 'pcs',
    unit_cost: 0,
    reorder_level: 0
  });

  // Edit item modal
  showEditModal = signal(false);
  editingItem = signal<any>(null);
  editItemForm = signal({
    item_name: '',
    item_name_ar: '',
    unit_of_measure: 'pcs',
    unit_cost: 0,
    reorder_level: 0,
    notes: ''
  });
  editLoading = signal(false);
  editError = signal('');

  // Summary
  summary = signal<any>({
    total_items: 0,
    total_warehouses: 0,
    total_stock: 0,
    total_value: 0,
    low_stock_items: 0
  });

  // Computed
  filteredItems = computed(() => {
    const items = this.inventoryItems();
    const warehouse = this.selectedWarehouse();
    const category = this.selectedCategory();

    let filtered = items;

    if (warehouse) {
      filtered = filtered.filter(item => item.warehouse_id === warehouse);
    }

    if (category) {
      filtered = filtered.filter(item => item.category === category);
    }

    return filtered;
  });

  categories = computed(() => {
    const items = this.inventoryItems();
    const cats = new Set(items.map(item => item.category).filter(Boolean));
    return Array.from(cats).sort();
  });

  ngOnInit(): void {
    this.loadData();
    this.loadInventoryItems();
  }

  canManageInventory(): boolean {
    const role = this.auth.role();
    return role === 'super_admin' || role === 'general_manager' || role === 'finance_manager' || role === 'inventory_manager' || role === 'warehouse_manager';
  }

  loadData(): void {
    this.loading.set(true);

    this.http.get(`${environment.apiUrl}/inventory/dashboard`).subscribe({
      next: (response: any) => {
        const parsedData = (response.data || []).map((item: any) => ({
          ...item,
          quantity_on_hand:   parseFloat(item.quantity_on_hand)   || 0,
          reserved_quantity:  parseFloat(item.reserved_quantity)  || 0,
          available_quantity: parseFloat(item.available_quantity) || 0,
          unit_cost:          parseFloat(item.unit_cost)          || 0,
          reorder_level:      parseFloat(item.reorder_level)      || 0
        }));
        this.inventoryItems.set(parsedData);
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Failed to load inventory:', error);
        this.loading.set(false);
      }
    });

    this.http.get(`${environment.apiUrl}/warehouses`).subscribe({
      next: (response: any) => {
        this.warehouses.set(response.data || []);
      },
      error: (error) => {
        console.error('Failed to load warehouses:', error);
      }
    });

    this.http.get(`${environment.apiUrl}/inventory/summary`).subscribe({
      next: (response: any) => {
        const summaryData = response.data || {};
        this.summary.set({
          total_items:      parseInt(summaryData.total_items)      || 0,
          total_warehouses: parseInt(summaryData.total_warehouses) || 0,
          total_stock:      parseFloat(summaryData.total_stock)    || 0,
          total_value:      parseFloat(summaryData.total_value)    || 0,
          low_stock_items:  parseInt(summaryData.low_stock_items)  || 0
        });
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Failed to load summary:', error);
      }
    });
  }

  onWarehouseChange(event: any): void {
    const value = event.target.value;
    this.selectedWarehouse.set(value ? parseInt(value) : null);
  }

  onCategoryChange(event: any): void {
    this.selectedCategory.set(event.target.value);
  }

  clearFilters(): void {
    this.selectedWarehouse.set(null);
    this.selectedCategory.set('');
  }

  getStockStatus(item: any): { color: string; text: string } {
    const available = parseFloat(item.available_quantity || 0);
    const reorder   = parseFloat(item.reorder_level      || 0);

    if (available <= 0) {
      return { color: '#ef4444', text: this.translate.instant('inventory.stockStatus.outOfStock') };
    } else if (available <= reorder) {
      return { color: '#f59e0b', text: this.translate.instant('inventory.stockStatus.lowStock') };
    } else {
      return { color: '#10b981', text: this.translate.instant('inventory.stockStatus.available') };
    }
  }

  formatCurrency(value: any): string {
    if (value === null || value === undefined || value === '') return '0.00 ريال';
    const numValue = Number(value);
    if (isNaN(numValue)) return '0.00 ريال';
    return `${numValue.toFixed(2)} ريال`;
  }

  // ── Stock-In ─────────────────────────────────────────────────────────────

  openStockInModal(): void {
    this.stockInForm.set({ item_id: null, warehouse_id: 1, quantity: null, notes: '' });
    this.showStockInModal.set(true);
  }

  closeStockInModal(): void {
    this.showStockInModal.set(false);
  }

  submitStockIn(): void {
    const form = this.stockInForm();

    if (!form.item_id || !form.quantity || form.quantity <= 0) {
      alert(this.translate.instant('inventory.stockInModal.validation'));
      return;
    }

    this.loading.set(true);

    const payload = {
      item_id:       form.item_id,
      warehouse_id:  form.warehouse_id,
      quantity:      form.quantity,
      movement_type: 'in',
      notes:         form.notes || 'Stock receipt'
    };

    this.http.post(`${environment.apiUrl}/inventory/stock-in`, payload).subscribe({
      next: () => {
        alert(this.translate.instant('inventory.stockInModal.success'));
        this.closeStockInModal();
        this.loadData();
      },
      error: (error) => {
        console.error('Failed to add stock:', error);
        alert(error.error?.message || this.translate.instant('inventory.stockInModal.error'));
        this.loading.set(false);
      }
    });
  }

  // ── Load all items (dropdown) ─────────────────────────────────────────────

  loadInventoryItems(): void {
    this.http.get(`${environment.apiUrl}/inventory`).subscribe({
      next: (response: any) => {
        this.allInventoryItems.set(response.data || []);
        console.log('[Inventory Dashboard] Loaded', this.allInventoryItems().length, 'items for dropdown');
      },
      error: (error) => {
        console.error('Failed to load inventory items:', error);
      }
    });
  }

  // ── Create Item ───────────────────────────────────────────────────────────

  openCreateItemModal(): void {
    this.newItemForm.set({
      item_name: '', item_name_ar: '', category: '',
      unit_of_measure: 'piece', unit_cost: 0, reorder_level: 0
    });
    this.showCreateItemModal.set(true);
  }

  closeCreateItemModal(): void {
    this.showCreateItemModal.set(false);
  }

  createNewItem(): void {
    const form = this.newItemForm();

    if (!form.item_name || !form.category) {
      alert(this.translate.instant('inventory.createItemModal.validation'));
      return;
    }

    this.loading.set(true);

    this.http.post(`${environment.apiUrl}/inventory`, form).subscribe({
      next: () => {
        alert(this.translate.instant('inventory.createItemModal.success'));
        this.closeCreateItemModal();
        this.loadData();
        this.loadInventoryItems();
      },
      error: (error) => {
        console.error('Failed to create item:', error);
        alert(error.error?.message || this.translate.instant('inventory.createItemModal.error'));
        this.loading.set(false);
      }
    });
  }

  // ── Edit Item ─────────────────────────────────────────────────────────────

  openEditModal(item: any): void {
    this.editingItem.set(item);
    this.editItemForm.set({
      item_name:       item.item_name        || '',
      item_name_ar:    item.item_name_ar     || '',
      unit_of_measure: item.unit_of_measure  || 'pcs',
      unit_cost:       parseFloat(item.unit_cost)     || 0,
      reorder_level:   parseFloat(item.reorder_level) || 0,
      notes:           item.notes            || ''
    });
    this.editError.set('');
    this.showEditModal.set(true);
  }

  closeEditModal(): void {
    this.showEditModal.set(false);
    this.editingItem.set(null);
    this.editError.set('');
  }

  submitEdit(): void {
    const item = this.editingItem();
    if (!item) return;

    const form = this.editItemForm();

    // بناء payload بالحقول المتغيرة فقط
    const payload: any = {};
    if (form.item_name       !== (item.item_name        || '')) payload.item_name       = form.item_name;
    if (form.item_name_ar    !== (item.item_name_ar     || '')) payload.item_name_ar    = form.item_name_ar;
    if (form.unit_of_measure !== (item.unit_of_measure  || '')) payload.unit_of_measure = form.unit_of_measure;
    if (form.unit_cost       !== (parseFloat(item.unit_cost)     || 0)) payload.unit_cost     = form.unit_cost;
    if (form.reorder_level   !== (parseFloat(item.reorder_level) || 0)) payload.reorder_level = form.reorder_level;
    if (form.notes           !== (item.notes            || '')) payload.notes           = form.notes;

    if (Object.keys(payload).length === 0) {
      this.closeEditModal();
      return;
    }

    this.editLoading.set(true);
    this.editError.set('');

    this.http.put(`${environment.apiUrl}/inventory/${item.id}`, payload).subscribe({
      next: () => {
        this.editLoading.set(false);
        this.closeEditModal();
        this.loadData();
        this.loadInventoryItems();
      },
      error: (error) => {
        this.editLoading.set(false);
        this.editError.set(error.error?.message || 'فشل تحديث الصنف، حاول مرة أخرى');
      }
    });
  }
}