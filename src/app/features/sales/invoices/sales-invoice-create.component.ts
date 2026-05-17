import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { SalesService, CreateInvoiceResult } from '../../../core/services/sales.service';
import { ToastService } from '../../../core/services/toast.service';
import { Router } from '@angular/router';
import { environment } from '../../../../environments/environment.prod';
import { firstValueFrom } from 'rxjs';
import { TranslateModule } from '@ngx-translate/core';

interface ProjectOption {
  id: number;
  name: string;
  lead_id: number;
  client_id: number | null;
  client_name: string;
}

interface RevenueAccount {
  id: number;
  account_code: string;
  account_name: string;
}

interface InventoryItem {
  id: number;
  item_code: string;
  item_name: string;
  item_name_ar: string;
  unit_cost: number;
  category: string;
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
  unit_price: number;
  total_amount: number;
  notes: string;
}

@Component({
  selector: 'app-sales-invoice-create',
  standalone: true,
  imports: [CommonModule, FormsModule , TranslateModule],
  templateUrl: './sales-invoice-create.component.html',
  styleUrl: './sales-invoice-create.component.css'
})
export class SalesInvoiceCreateComponent implements OnInit {
  private http = inject(HttpClient);
  
  // Form state
  selectedProjectId = signal<number | null>(null);
  selectedClientId = signal<number | null>(null);
  selectedLeadId = signal<number | null>(null);
  discountAmount = signal<number>(0);
  vatRate = signal<number>(15); // Default 15% VAT
  revenueAccountId = signal<number | null>(null);
  issueDate = signal<string>(new Date().toISOString().split('T')[0]);
  dueDate = signal<string>('');
  description = signal<string>('');
  notes = signal<string>('');

  // Line items
  lineItems = signal<InvoiceLineItem[]>([]);
  
  // Data
  projects = signal<ProjectOption[]>([]);
  revenueAccounts = signal<RevenueAccount[]>([]);
  inventoryItems = signal<InventoryItem[]>([]);
  warehouses = signal<Warehouse[]>([]);
  
  // UI state
  loading = signal(false);
  submitting = signal(false);
  success = signal(false);
  createdInvoice = signal<CreateInvoiceResult | null>(null);

  // Computed values
  subtotal = computed(() => {
    return this.lineItems().reduce((sum, item) => sum + item.total_amount, 0);
  });

  taxableAmount = computed(() => {
    return parseFloat((this.subtotal() - this.discountAmount()).toFixed(2));
  });

  vatAmount = computed(() => {
    return parseFloat(((this.taxableAmount() * this.vatRate()) / 100).toFixed(2));
  });

  totalAmount = computed(() => {
    return parseFloat((this.taxableAmount() + this.vatAmount()).toFixed(2));
  });

  selectedProject = computed(() => {
    if (!this.selectedProjectId()) return null;
    return this.projects().find(p => p.id === this.selectedProjectId()) || null;
  });

  constructor(
    private salesService: SalesService,
    private toast: ToastService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadProjects();
    this.loadRevenueAccounts();
    this.loadInventoryItems();
    this.loadWarehouses();
    this.addLineItem(); // Add first empty row
  }

  // Line Items Management
  addLineItem(): void {
    const items = [...this.lineItems()];
    items.push({
      inventory_item_id: null,
      warehouse_id: this.warehouses()[0]?.id || null,
      quantity: 1,
      unit_price: 0,
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
    console.log(`[SalesInvoice] updateLineItem called: index=${index}, field=${field}, value=${value}, type=${typeof value}`);
    
    const items = [...this.lineItems()];
    items[index] = { ...items[index], [field]: value };
    
    // Auto-populate unit price when item is selected
    if (field === 'inventory_item_id' && value) {
      // Convert value to number (HTML select returns string)
      const itemId = typeof value === 'string' ? parseInt(value, 10) : value;
            
      const selectedItem = this.inventoryItems().find(item => item.id === itemId);
      
      if (selectedItem) {
        
        // Convert unit_cost to number (PostgreSQL returns NUMERIC as string)
        const price = typeof selectedItem.unit_cost === 'string' 
          ? parseFloat(selectedItem.unit_cost) 
          : selectedItem.unit_cost;
        
        // Set unit_price to item's unit_cost (user can still edit it)
        items[index].unit_price = price || 0;
        
        console.log(`[SalesInvoice] ✅ Auto-set unit_price to: ${items[index].unit_price} (converted from: ${selectedItem.unit_cost})`);
      } else {
        console.warn(`[SalesInvoice] ❌ Item NOT FOUND! inventoryItems().length=${this.inventoryItems().length}`);
      }
    }
    
    // Auto-calculate total when quantity or unit_price changes
    if (field === 'quantity' || field === 'unit_price') {
      items[index].total_amount = parseFloat((items[index].quantity * items[index].unit_price).toFixed(2));
      console.log(`[SalesInvoice] Calculated total: ${items[index].quantity} x ${items[index].unit_price} = ${items[index].total_amount}`);
    }
    
    this.lineItems.set(items);
    console.log(`[SalesInvoice] Updated lineItems[${index}]:`, items[index]);
  }

  // Data Loading
  async loadProjects(): Promise<void> {
    this.loading.set(true);
    try {
      const response: any = await firstValueFrom(
        this.http.get(`${environment.apiUrl}/projects`, {
          params: { status: 'won' }
        })
      );
      
      const projectsArray = response?.data?.projects || response?.data || [];
      
      const projectsWithClients = projectsArray.map((p: any) => ({
        id: p.id,
        name: p.name,
        lead_id: p.lead_id,
        client_id: p.client_id || null,
        client_name: p.client_name || p.lead_client_name || 'Client'
      }));

      this.projects.set(projectsWithClients);
    } catch (error) {
      console.error('[SalesInvoice] Error loading projects:', error);
      this.toast.error('فشل تحميل المشاريع');
      this.projects.set([]);
    } finally {
      this.loading.set(false);
    }
  }

  async loadRevenueAccounts(): Promise<void> {
    try {
      const response: any = await firstValueFrom(
        this.http.get(`${environment.apiUrl}/coa/search/41`)
      );
      
      const accountsArray = response.data?.accounts || response.data || [];
      this.revenueAccounts.set(accountsArray);
    } catch (error) {
      console.error('[SalesInvoice] Error loading revenue accounts:', error);
      this.toast.error('فشل تحميل حسابات الإيرادات');
      this.revenueAccounts.set([]);
    }
  }

  async loadInventoryItems(): Promise<void> {
    try {
      console.log(`[SalesInvoice] Loading inventory items from: ${environment.apiUrl}/inventory`);
      
      const response: any = await firstValueFrom(
        this.http.get(`${environment.apiUrl}/inventory`)
      );
      
      const itemsArray = response.data || [];
      console.log(`[SalesInvoice] ✅ Loaded ${itemsArray.length} inventory items`);
      
      if (itemsArray.length > 0) {
        console.log(`[SalesInvoice] Sample item:`, itemsArray[0]);
        console.log(`[SalesInvoice] First item fields:`, Object.keys(itemsArray[0]));
        console.log(`[SalesInvoice] First item unit_cost:`, itemsArray[0].unit_cost);
      }
      
      this.inventoryItems.set(itemsArray);
    } catch (error) {
      console.error('[SalesInvoice] ❌ Error loading inventory items:', error);
      this.inventoryItems.set([]);
    }
  }

  async loadWarehouses(): Promise<void> {
    try {
      const response: any = await firstValueFrom(
        this.http.get(`${environment.apiUrl}/warehouses`)
      );
      
      const warehousesArray = response.data || [];
      this.warehouses.set(warehousesArray);
      console.log(`[SalesInvoice] Loaded ${warehousesArray.length} warehouses`);
    } catch (error) {
      console.error('[SalesInvoice] Error loading warehouses:', error);
      this.warehouses.set([]);
    }
  }

  onProjectSelect(projectIdValue: string): void {
    const projectId = Number(projectIdValue);
    
    if (!projectId || isNaN(projectId)) {
      this.selectedProjectId.set(null);
      this.selectedLeadId.set(null);
      this.selectedClientId.set(null);
      return;
    }
    
    const project = this.projects().find(p => p.id === projectId);
    if (project) {
      this.selectedProjectId.set(project.id);
      this.selectedLeadId.set(project.lead_id);
      this.selectedClientId.set(project.client_id || null);
    }
  }

  async submitForm(): Promise<void> {
    console.log('[SalesInvoice] === SUBMIT VALIDATION ===');
    
    if (!this.selectedLeadId()) {
      this.toast.error('يرجى اختيار مشروع');
      return;
    }

    // Validate line items
    const validItems = this.lineItems().filter(item => 
      item.inventory_item_id && item.warehouse_id && item.quantity > 0 && item.unit_price > 0
    );

    if (validItems.length === 0) {
      this.toast.error('يرجى إضافة صنف واحد على الأقل مع الكمية والسعر');
      return;
    }

    if (!this.revenueAccountId()) {
      this.toast.error('يرجى اختيار حساب الإيرادات');
      return;
    }

    this.submitting.set(true);

    try {
      const invoicePayload = {
        lead_id: this.selectedLeadId()!,
        client_id: this.selectedClientId() || undefined,
        project_id: this.selectedProjectId() || undefined,
        subtotal: this.subtotal(),
        discount_amount: this.discountAmount() || 0,
        vat_rate: this.vatRate(),
        revenue_account_id: this.revenueAccountId()!,
        issue_date: this.issueDate(),
        due_date: this.dueDate() || undefined,
        description: this.description(),
        notes: this.notes(),
        items: validItems.map(item => ({
          inventory_item_id: item.inventory_item_id!,
          warehouse_id: item.warehouse_id!,
          quantity: item.quantity,
          unit_price: item.unit_price,
          total_amount: item.total_amount,
          notes: item.notes || undefined
        }))
      };
            
      const result = await this.salesService.createInvoice(invoicePayload);

      this.createdInvoice.set(result);
      this.success.set(true);
      
      this.toast.success('تم إنشاء فاتورة المبيعات بنجاح!');
      
    } catch (error: any) {
      console.error('[SalesInvoice] ❌ Error creating invoice:', error);
      this.toast.error(error?.error?.message || 'فشل إنشاء الفاتورة');
    } finally {
      this.submitting.set(false);
    }
  }

  resetForm(): void {
    this.selectedProjectId.set(null);
    this.selectedClientId.set(null);
    this.selectedLeadId.set(null);
    this.discountAmount.set(0);
    this.vatRate.set(15);
    this.revenueAccountId.set(null);
    this.issueDate.set(new Date().toISOString().split('T')[0]);
    this.dueDate.set('');
    this.description.set('');
    this.notes.set('');
    this.lineItems.set([]);
    this.addLineItem();
    this.success.set(false);
    this.createdInvoice.set(null);
  }

  downloadPDF(): void {
    const pdfPath = this.createdInvoice()?.pdf_path;
    if (pdfPath) {
      const cleanPath = pdfPath.replace(/\\/g, '/').replace(/^\/+/, '');
      const backendBase = environment.apiUrl.replace(/\/api\/?$/, '');
      window.open(`${backendBase}/${cleanPath}`, '_blank');
    }
  }

  createAnother(): void {
    this.resetForm();
  }

  viewInList(): void {
    this.router.navigate(['/sales/invoices']);
  }
}