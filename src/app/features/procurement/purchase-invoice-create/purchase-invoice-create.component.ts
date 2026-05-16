import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { ToastService } from '../../../core/services/toast.service';
import { Router } from '@angular/router';
import { environment } from '../../../../environments/environment';
import { firstValueFrom } from 'rxjs';

interface Supplier {
  id: number;
  name: string;
  supplier_code: string;
}

interface InventoryItem {
  id: number;
  item_code: string;
  item_name: string;
  item_name_ar: string;
  unit_cost: number;
}

interface Warehouse {
  id: number;
  warehouse_code: string;
  warehouse_name: string;
  warehouse_name_ar: string;
}

interface InvoiceLineItem {
  inventory_item_id: number | null;
  warehouse_id: number | null;
  quantity: number;
  unit_cost: number;
  total_amount: number;
  notes: string;
}

@Component({
  selector: 'app-purchase-invoice-create',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './purchase-invoice-create.component.html',
  styleUrl: './purchase-invoice-create.component.css'
})
export class PurchaseInvoiceCreateComponent implements OnInit {
  private http = inject(HttpClient);
  
  // Form state
  selectedSupplierId = signal<number | null>(null);
  invoiceDate = signal<string>(new Date().toISOString().split('T')[0]);
  dueDate = signal<string>('');
  taxRate = signal<number>(15);
  isTaxApplied = signal<boolean>(true);
  notes = signal<string>('');

  // Line items
  lineItems = signal<InvoiceLineItem[]>([]);
  
  // Data
  suppliers = signal<Supplier[]>([]);
  inventoryItems = signal<InventoryItem[]>([]);
  warehouses = signal<Warehouse[]>([]);
  
  // UI state
  loading = signal(false);
  submitting = signal(false);

  // Computed values
  subtotal = computed(() => {
    return this.lineItems().reduce((sum, item) => sum + item.total_amount, 0);
  });

  taxAmount = computed(() => {
    if (!this.isTaxApplied()) return 0;
    return parseFloat(((this.subtotal() * this.taxRate()) / 100).toFixed(2));
  });

  totalAmount = computed(() => {
    return parseFloat((this.subtotal() + this.taxAmount()).toFixed(2));
  });

  constructor(
    private toast: ToastService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadSuppliers();
    this.loadInventoryItems();
    this.loadWarehouses();
    this.addLineItem();
  }

  addLineItem(): void {
    const items = [...this.lineItems()];
    items.push({
      inventory_item_id: null,
      warehouse_id: this.warehouses()[0]?.id || null,
      quantity: 1,
      unit_cost: 0,
      total_amount: 0,
      notes: ''
    });
    this.lineItems.set(items);
  }

  removeLineItem(index: number): void {
    if (this.lineItems().length <= 1) {
      this.toast.error('يجب أن تحتوي الفاتورة على صنف واحد على الأقل');
      return;
    }
    const items = this.lineItems().filter((_, i) => i !== index);
    this.lineItems.set(items);
  }

  updateLineItem(index: number, field: keyof InvoiceLineItem, value: any): void {
    const items = [...this.lineItems()];
    items[index] = { ...items[index], [field]: value };
    
    // Auto-populate unit cost when item is selected
    if (field === 'inventory_item_id' && value) {
      const selectedItem = this.inventoryItems().find(item => item.id === value);
      if (selectedItem) {
        items[index].unit_cost = selectedItem.unit_cost || 0;
      }
    }
    
    // Auto-calculate total
    if (field === 'quantity' || field === 'unit_cost') {
      items[index].total_amount = parseFloat((items[index].quantity * items[index].unit_cost).toFixed(2));
    }
    
    this.lineItems.set(items);
  }

  async loadSuppliers(): Promise<void> {
    try {
      const response: any = await firstValueFrom(
        this.http.get(`${environment.apiUrl}/suppliers`)
      );
      this.suppliers.set(response.data || []);
    } catch (error) {
      console.error('[PurchaseInvoice] Error loading suppliers:', error);
      this.suppliers.set([]);
    }
  }

  async loadInventoryItems(): Promise<void> {
    try {
      const response: any = await firstValueFrom(
        this.http.get(`${environment.apiUrl}/inventory`)
      );
      this.inventoryItems.set(response.data || []);
    } catch (error) {
      console.error('[PurchaseInvoice] Error loading items:', error);
      this.inventoryItems.set([]);
    }
  }

  async loadWarehouses(): Promise<void> {
    try {
      const response: any = await firstValueFrom(
        this.http.get(`${environment.apiUrl}/warehouses`)
      );
      this.warehouses.set(response.data || []);
    } catch (error) {
      console.error('[PurchaseInvoice] Error loading warehouses:', error);
      this.warehouses.set([]);
    }
  }

  async submitForm(): Promise<void> {
    if (!this.selectedSupplierId()) {
      this.toast.error('يرجى اختيار المورد');
      return;
    }

    const validItems = this.lineItems().filter(item => 
      item.inventory_item_id && item.warehouse_id && item.quantity > 0 && item.unit_cost > 0
    );

    if (validItems.length === 0) {
      this.toast.error('يرجى إضافة صنف واحد على الأقل');
      return;
    }

    this.submitting.set(true);

    try {
      const payload = {
        supplier_id: this.selectedSupplierId()!,
        subtotal: this.subtotal(),
        is_tax_applied: this.isTaxApplied(),
        tax_percentage: this.taxRate(),
        invoice_date: this.invoiceDate(),
        due_date: this.dueDate() || undefined,
        notes: this.notes(),
        items: validItems.map(item => ({
          inventory_item_id: item.inventory_item_id!,
          warehouse_id: item.warehouse_id!,
          quantity: item.quantity,
          unit_cost: item.unit_cost,
          notes: item.notes || undefined
        }))
      };
      
      const response: any = await firstValueFrom(
        this.http.post(`${environment.apiUrl}/purchasing/invoices`, payload)
      );

      this.toast.success('تم إنشاء فاتورة الشراء بنجاح');
      this.router.navigate(['/finance/purchase-invoices']);
      
    } catch (error: any) {
      console.error('[PurchaseInvoice] Error:', error);
      this.toast.error(error?.error?.message || 'فشل إنشاء الفاتورة');
    } finally {
      this.submitting.set(false);
    }
  }
}
