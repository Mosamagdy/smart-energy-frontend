import { Component, signal, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { AuthStore } from '../../../core/auth/auth.store';
import { ToastService } from '../../../core/services/toast.service';
import { TranslateModule } from '@ngx-translate/core';

interface PendingPO {
  id: number;
  po_number: string;
  project_id: number;
  project_name: string;
  supplier_id?: number;
  supplier_name?: string;
  status: string;
  total_amount: number;
  notes?: string;
  created_by: number;
  creator_name: string;
  created_at: string;
  items_count: number;
  items?: POItem[];
  finance_rejection_reason?: string; // ✅ For rejected POs
}

interface POItem {
  id: number;
  item_id: number;
  item_name: string;
  item_name_ar?: string;
  item_code?: string;
  quantity: number;
  unit_cost: number;
  total_cost: number;
}

interface Supplier {
  id: number;
  name: string;
  supplier_code: string;
}

@Component({
  selector: 'app-procurement-pending',
  standalone: true,
  imports: [CommonModule, FormsModule ,TranslateModule],
  templateUrl: './procurement-pending.component.html',
  styleUrls: ['./procurement-pending.component.css']
})
export class ProcurementPendingComponent implements OnInit {
  private http = inject(HttpClient);
  private auth = inject(AuthStore);
  private toast = inject(ToastService);

  pendingPOs = signal<PendingPO[]>([]);
  filteredPOs = signal<PendingPO[]>([]);
  suppliers = signal<Supplier[]>([]);
  loading = signal<boolean>(false);
  selectedPO = signal<PendingPO | null>(null);
  showSupplierModal = signal<boolean>(false);
  
  // ✅ Phase 1: Status Filter
  selectedStatus = signal<string>('all');
  
  // Form data
  selectedSupplierId = signal<number | null>(null);
  itemPrices = signal<Map<number, number>>(new Map()); // key: item_id, value: unit_cost
  itemQuantities = signal<Map<number, number>>(new Map()); // key: item_id, value: quantity
  rejectionReason = signal<string>('');
  showRejectionModal = signal<boolean>(false);
  submitting = signal<boolean>(false);
  
  // ✅ VAT Toggle - SCOPED TO EACH PO (not shared)
  poTaxToggles = signal<Map<number, boolean>>(new Map()); // key: po_id, value: is_tax_applied
  
  // ✅ Approval confirmation modal
  showApprovalModal = signal<boolean>(false);
  selectedApprovalPO = signal<PendingPO | null>(null);

  ngOnInit(): void {
    this.loadPendingPOs();
    this.loadSuppliers();
  }

  /**
   * ✅ Phase 1: Apply status filters
   * Fixed: Ensure proper status matching with database values
   */
  applyFilters(): void {
    const allPOs = this.pendingPOs();
    const status = this.selectedStatus();
    
    console.log(`[Filter] Applying filter: "${status}" on ${allPOs.length} POs`);
    
    if (status === 'all' || !status) {
      console.log(`[Filter] Showing all POs`);
      this.filteredPOs.set(allPOs);
      return;
    }
    
    // Filter by status - matching DB values exactly
    const filtered = allPOs.filter(po => {
      switch (status) {
        case 'pending':
        case 'pending_procurement':
          // New POs waiting for procurement manager
          const isPending = po.status === 'pending' || po.status === 'pending_procurement';
          // Exclude rejected ones (they have rejection reason)
          return isPending && !po.finance_rejection_reason;
          
        case 'pending_finance':
          // POs waiting for finance approval
          return po.status === 'pending_finance';
          
        case 'approved':
          // Finance approved POs
          return po.status === 'approved';
          
        case 'rejected':
          // POs rejected by finance (status stays pending_procurement but has rejection reason)
          return po.finance_rejection_reason && po.finance_rejection_reason.trim() !== '';
          
        default:
          console.warn(`[Filter] Unknown status filter: "${status}"`);
          return true;
      }
    });
    
    console.log(`[Filter] Filtered to ${filtered.length} POs`);
    this.filteredPOs.set(filtered);
  }

  /**
   * ✅ Phase 1: Filter by status (called from UI)
   */
  filterByStatus(): void {
    this.applyFilters();
  }

  loadPendingPOs(): void {
    this.loading.set(true);
    
    // ✅ FIX 2: Check if user is authenticated before making request
    const userRole = this.auth.role();
    const token = this.auth.token();
    
    if (!token) {
      console.error('[Procurement] No auth token found - user not authenticated');
      this.toast.error('يجب تسجيل الدخول أولاً', 3000);
      this.loading.set(false);
      return;
    }
    
    let endpoint = '/procurement/pending-procurement'; // default for procurement_manager
    
    if (userRole === 'finance_manager') {
      endpoint = '/procurement/pending-finance'; // finance_manager sees different queue
    }
    
    console.log(`[Procurement] Loading pending POs from: ${endpoint}`);
    console.log(`[Procurement] User role: ${userRole}`);
    
    // Rely on AuthInterceptor instead of manually setting headers
    // This ensures consistent token attachment and avoids 401 errors
    this.http.get<any>(
      `${environment.apiUrl}${endpoint}`
    ).subscribe({
      next: (response) => {
        const approvals = response.data?.approvals || [];
        console.log('[Procurement] Successfully loaded pending POs:', approvals.length);
        
        // Log items for each PO
        approvals.forEach((po: any) => {
          console.log(`[Procurement] ${po.po_number}:`, {
            items_count: po.items_count,
            items_loaded: po.items?.length || 0,
            has_items: !!po.items && po.items.length > 0
          });
        });
        
        this.pendingPOs.set(approvals);
        this.applyFilters(); // ✅ Apply filters after loading
        this.loading.set(false);
      },
      error: (err) => {
        console.error('[Procurement] Failed to load pending POs:', err);
        console.error('[Procurement] Error status:', err.status);
        console.error('[Procurement] Error response:', err.error);
        
        if (err.status === 401) {
          this.toast.error('خطأ في المصادقة - يرجى تسجيل الدخول مرة أخرى', 4000);
        } else if (err.status === 403) {
          this.toast.error('ليس لديك صلاحية للوصول', 4000);
        } else {
          this.toast.error('فشل في تحميل أوامر الشراء', 3000);
        }
        this.loading.set(false);
      }
    });
  }

  loadSuppliers(): void {
    // ✅ FIX 1: Rely on AuthInterceptor for consistent auth
    this.http.get<any>(
      `${environment.apiUrl}/suppliers`
    ).subscribe({
      next: (response) => {
        this.suppliers.set(response.data || []);
      },
      error: (err) => {
        console.error('Failed to load suppliers:', err);
      }
    });
  }

  openSupplierModal(po: PendingPO): void {
    this.selectedPO.set(po);
    this.selectedSupplierId.set(po.supplier_id || null);
    
    // Load existing prices and quantities using item_id as key
    const priceMap = new Map<number, number>();
    const quantityMap = new Map<number, number>();
    
    if (po.items) {
      po.items.forEach(item => {
        priceMap.set(item.item_id, item.unit_cost || 0);
        quantityMap.set(item.item_id, item.quantity || 1);
      });
    }
    
    this.itemPrices.set(priceMap);
    this.itemQuantities.set(quantityMap);
    
    this.showSupplierModal.set(true);
  }

  updateItemPrice(itemId: number, price: number): void {
    const currentPrices = this.itemPrices();
    const updatedPrices = new Map(currentPrices);
    updatedPrices.set(itemId, price);
    this.itemPrices.set(updatedPrices);
  }

  getItemPrice(itemId: number): number {
    return this.itemPrices().get(itemId) || 0;
  }

  updateItemQuantity(itemId: number, quantity: number): void {
    const currentQuantities = this.itemQuantities();
    const updatedQuantities = new Map(currentQuantities);
    updatedQuantities.set(itemId, quantity);
    this.itemQuantities.set(updatedQuantities);
  }

  getItemQuantity(itemId: number): number {
    return this.itemQuantities().get(itemId) || 1;
  }

  calculateTotal(): number {
    const po = this.selectedPO();
    if (!po || !po.items) return 0;

    let total = 0;
    po.items.forEach(item => {
      const price = this.getItemPrice(item.item_id);
      const quantity = this.getItemQuantity(item.item_id);
      total += price * quantity;
    });
    return total;
  }

  saveSupplierAndPrices(): void {
    const po = this.selectedPO();
    if (!po) return;

    if (!this.selectedSupplierId()) {
      this.toast.warning('يجب اختيار المورد', 3000);
      return;
    }

    // ✅ Prepare items with updated prices
    // quantity is OPTIONAL - only include if user modified it
    const items = po.items?.map(item => {
      const itemData: any = {
        item_id: item.item_id,  // ✅ Correct field name
        unit_cost: this.getItemPrice(item.item_id)
      };

      // Only include quantity if it was explicitly changed by user
      const originalQty = item.quantity || 1;
      const currentQty = this.getItemQuantity(item.item_id);
      
      if (currentQty !== originalQty) {
        itemData.quantity = currentQty;
      }
      // If quantity unchanged, omit it - backend will use original

      return itemData;
    }) || [];

    console.log('[Procurement] Sending payload:', {
      supplier_id: this.selectedSupplierId(),
      items: items,
      status: 'pending_finance'
    });

    this.http.put<any>(
      `${environment.apiUrl}/purchasing/orders/${po.id}`,
      {
        supplier_id: this.selectedSupplierId(),
        items: items,
        status: 'pending_finance'
      }
    ).subscribe({
      next: (response) => {
        this.toast.success('✅ تم حفظ البيانات وإرسال أمر الشراء للإدارة المالية', 4000);
        this.showSupplierModal.set(false);
        this.loadPendingPOs();
      },
      error: (err) => {
        console.error('Failed to update PO:', err);
        this.toast.error(err.error?.message || 'فشل في حفظ البيانات', 3000);
      }
    });
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  /**
   * ✅ Check if current user is finance_manager
   */
  isFinanceManager(): boolean {
    return this.auth.role() === 'finance_manager';
  }

  /**
   * ✅ Check if current user is procurement_manager
   */
  isProcurementManager(): boolean {
    return this.auth.role() === 'procurement_manager';
  }

  /**
   * ✅ Finance Manager: Open approval confirmation modal
   */
  openApprovalModal(po: PendingPO): void {
    console.log('[ApprovalModal] Opening modal for PO:', po.po_number);
    console.log('[ApprovalModal] PO ID:', po.id);
    console.log('[ApprovalModal] Items count:', po.items?.length || 0);
    console.log('[ApprovalModal] Items:', po.items);
    
    if (!po.items || po.items.length === 0) {
      console.warn('[ApprovalModal] ⚠️ NO ITEMS FOUND in PO data!');
      console.warn('[ApprovalModal] Items count from DB:', po.items_count);
    } else {
      console.log('[ApprovalModal] ✅ Items loaded successfully:');
      po.items.forEach((item, idx) => {
        console.log(`  ${idx + 1}. ${item.item_name_ar || item.item_name} | Qty: ${item.quantity} | Cost: ${item.unit_cost} | Total: ${item.total_cost}`);
      });
    }
    
    this.selectedApprovalPO.set(po);
    
    // Initialize tax toggle for this PO if not exists
    if (!this.poTaxToggles().has(po.id)) {
      const toggles = new Map(this.poTaxToggles());
      toggles.set(po.id, true); // Default: tax applied
      this.poTaxToggles.set(toggles);
    }
    
    this.showApprovalModal.set(true);
  }

  /**
   * ✅ Get tax toggle for specific PO
   */
  getPOTaxToggle(poId: number): boolean {
    return this.poTaxToggles().get(poId) ?? true;
  }

  /**
   * ✅ Set tax toggle for specific PO
   */
  setPOTaxToggle(poId: number, value: boolean): void {
    const toggles = new Map(this.poTaxToggles());
    toggles.set(poId, value);
    this.poTaxToggles.set(toggles);
  }

  /**
   * ✅ Finance Manager: Approve PO with VAT Toggle (from modal)
   * Tax-Inclusive Logic: Procurement prices already include 15% VAT
   */
  approveByFinance(): void {
    const po = this.selectedApprovalPO();
    if (!po) return;

    const isTaxApplied = this.getPOTaxToggle(po.id);
    const totalWithVAT = po.total_amount;
    
    // Calculate based on tax-inclusive pricing
    const subtotalWithoutVAT = parseFloat((totalWithVAT / 1.15).toFixed(2));
    const vatPortion = parseFloat((totalWithVAT - subtotalWithoutVAT).toFixed(2));

    this.submitting.set(true);
    this.showApprovalModal.set(false);

    this.http.post<any>(
      `${environment.apiUrl}/procurement/approve-by-finance/${po.id}`,
      { 
        approvalNotes: 'موافقة مالية',
        is_tax_applied: isTaxApplied // ✅ Send scoped VAT toggle
      }
    ).subscribe({
      next: (response) => {
        this.submitting.set(false);
        this.toast.success('تمت الموافقة على أمر الشراء بنجاح', 4000);
        // Reset toggle for this PO
        const toggles = new Map(this.poTaxToggles());
        toggles.set(po.id, true);
        this.poTaxToggles.set(toggles);
        this.loadPendingPOs(); // ✅ Auto-refresh
      },
      error: (err) => {
        this.submitting.set(false);
        this.toast.error(err.error?.message || 'فشل في الموافقة على أمر الشراء', 3000);
      }
    });
  }

  /**
   * ✅ Finance Manager: Open rejection modal
   */
  openRejectionModal(po: PendingPO): void {
    this.selectedPO.set(po);
    this.rejectionReason.set('');
    this.showRejectionModal.set(true);
  }

  /**
   * ✅ Finance Manager: Reject PO
   */
  rejectByFinance(): void {
    const po = this.selectedPO();
    if (!po) return;

    if (!this.rejectionReason().trim()) {
      this.toast.warning('يجب إدخال سبب الرفض', 3000);
      return;
    }

    this.submitting.set(true);

    this.http.post<any>(
      `${environment.apiUrl}/procurement/reject/${po.id}`,
      { 
        rejection_reason: this.rejectionReason(),  // ✅ snake_case to match backend
        rejection_stage: 'finance'  // ✅ snake_case to match backend
      }
    ).subscribe({
      next: (response) => {
        this.submitting.set(false);
        this.showRejectionModal.set(false);
        this.toast.info('🔄 تم رفض أمر الشراء وإعادته للمشتريات', 4000);
        this.loadPendingPOs();
      },
      error: (err) => {
        this.submitting.set(false);
        console.error('Failed to reject PO:', err);
        this.toast.error(err.error?.message || 'فشل في رفض أمر الشراء', 3000);
      }
    });
  }
}
