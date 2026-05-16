import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { QuotationsService, Quotation } from '../../../data/api/quotations.service';
import { ToastService } from '../../../core/services/toast.service';
import { LeadsService } from '../../../data/api/leads.service';
import { FormsModule } from '@angular/forms';
import { AuthStore } from '../../../core/auth/auth.store';
import { TranslateModule } from '@ngx-translate/core';

interface LeadWithReport {
  id: number;
  client_name: string;
  service_type: string;
  status: string;
  priority: string;
  inspection_report_id: number;
  inspection_report_date: string;
  inspector_name: string;
  has_quotation: boolean;
  quotation_status?: string;
}

@Component({
  selector: 'app-quotations-list',
  standalone: true,
  imports: [CommonModule, DatePipe, FormsModule , TranslateModule  ],
  templateUrl: './quotations-list.component.html',
  styleUrls: ['./quotations-list.component.css']
})
export class QuotationsListComponent implements OnInit {
  private quotationsService = inject(QuotationsService);
  private leadsService = inject(LeadsService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private toast = inject(ToastService);
  private authStore = inject(AuthStore);

  quotations = signal<Quotation[]>([]);
  loading = signal(true);
  selectedStatus = signal<string>('all');
  
  // User role for filtering - use authStore.role() computed signal
  userRole = computed(() => this.authStore.role());
  
  // Filtered quotations based on selected status
  filteredQuotations = computed(() => {
    const allQuotations = this.quotations();
    const status = this.selectedStatus();
    
    if (status === 'all') return allQuotations;
    if (status === 'awaiting_review') {
      // For finance: pending_finance_review
      // For GM: pending_gm_approval
      const role = this.userRole();
      if (role === 'finance_manager') {
        return allQuotations.filter(q => q.status === 'pending_finance_review');
      }
      if (role === 'general_manager') {
        return allQuotations.filter(q => q.status === 'pending_gm_approval');
      }
      return allQuotations;
    }
    
    return allQuotations.filter(q => q.status === status);
  });

  // Quotation form modal state
  showCreateModal = signal(false);
  selectedLeadId = signal<number | null>(null);
  selectedLeadName = signal<string>('');
  selectedInspectionReportId = signal<number | null>(null);
  
  // Form fields
  formTotalPrice = signal<number>(0);
  formDiscount = signal<number>(0);
  formTax = signal<number>(14); // Default 14% VAT
  formNotes = signal<string>('');
  formBoqItems = signal<Array<{name: string, description: string, quantity: number, unit_price: number, total: number}>>([]);
  
  // File upload
  uploadedFile = signal<File | null>(null);
  uploadProgress = signal<number>(0);
  isUploading = signal(false);

  ngOnInit(): void {
    this.loadQuotations();
    
    // Check if we should open create modal from URL params
    this.route.queryParams.subscribe(params => {
      if (params['action'] === 'create' && params['leadId']) {
        this.openCreateModal(+params['leadId']);
      }
    });
  }

  loadQuotations(): void {
    this.loading.set(true);
    this.quotationsService.getAllQuotations().subscribe({
      next: (response) => {
        const quotations = (response.data?.quotations || []).map((q: any) => ({
          ...q,
          total_price: Number(q.total_price),
          discount: Number(q.discount),
          tax: Number(q.tax)
        }));
        this.quotations.set(quotations);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Failed to load quotations:', err);
        this.toast.error('فشل في تحميل عروض الأسعار');
        this.loading.set(false);
      }
    });
  }

  getAwaitingCount(): number {
    const role = this.userRole();
    const allQuotations = this.quotations();
    
    if (role === 'finance_manager') {
      return allQuotations.filter(q => q.status === 'pending_finance_review').length;
    }
    if (role === 'general_manager') {
      return allQuotations.filter(q => q.status === 'pending_gm_approval').length;
    }
    
    return 0;
  }

  getStatusColor(status: string): string {
    const colors: Record<string, string> = {
      'draft': 'bg-gray-100 text-gray-700',
      'pending_finance': 'bg-yellow-100 text-yellow-800',
      'pending_gm': 'bg-blue-100 text-blue-800',
      'approved': 'bg-green-100 text-green-800',
      'rejected': 'bg-red-100 text-red-800',
      'sent_to_client': 'bg-purple-100 text-purple-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-700';
  }

  getStatusText(status: string): string {
    const texts: Record<string, string> = {
      'draft': 'مسودة',
      'pending_finance': 'بانتظار المالية',
      'pending_gm': 'بانتظار المدير العام',
      'approved': 'معتمد',
      'rejected': 'مرفوض',
      'sent_to_client': 'مُرسل للعميل'
    };
    return texts[status] || status;
  }

  viewQuotation(id: number): void {
    this.router.navigate(['/quotations', id]);
  }

  deleteQuotation(id: number): void {
    if (!confirm('هل أنت متأكد من حذف عرض السعر؟')) {
      return;
    }

    this.quotationsService.deleteQuotation(id).subscribe({
      next: () => {
        this.quotations.update(quots => quots.filter(q => q.id !== id));
        this.toast.success('تم حذف عرض السعر بنجاح');
      },
      error: (err) => {
        console.error('Failed to delete quotation:', err);
        this.toast.error('فشل في حذف عرض السعر');
      }
    });
  }

  // ── Quotation Creation Modal ──

  async openCreateModal(leadId: number): Promise<void> {
    try {
      // Fetch lead details to get client name and inspection report
      const response: any = await this.leadsService.getLeadById(leadId).toPromise();
      const lead = response?.data?.lead;
      
      if (!lead) {
        this.toast.error('العميل غير موجود');
        return;
      }

      this.selectedLeadId.set(leadId);
      this.selectedLeadName.set(lead.client_name || 'عميل');
      
      // Get inspection report ID
      if (lead.inspection_report_id) {
        this.selectedInspectionReportId.set(lead.inspection_report_id);
      }

      // Reset form
      this.formTotalPrice.set(0);
      this.formDiscount.set(0);
      this.formTax.set(14);
      this.formNotes.set('');
      this.formBoqItems.set([]);
      this.uploadedFile.set(null);
      this.uploadProgress.set(0);
      this.isUploading.set(false);

      this.showCreateModal.set(true);
    } catch (error) {
      console.error('Failed to load lead:', error);
      this.toast.error('فشل في تحميل بيانات العميل');
    }
  }

  closeCreateModal(): void {
    this.showCreateModal.set(false);
    this.selectedLeadId.set(null);
    this.selectedLeadName.set('');
    this.selectedInspectionReportId.set(null);
    this.uploadedFile.set(null);
    this.uploadProgress.set(0);
    this.isUploading.set(false);
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (file.size > maxSize) {
        this.toast.error('حجم الملف كبير جداً. الحد الأقصى 10MB');
        return;
      }
      this.uploadedFile.set(file);
      this.uploadProgress.set(0);
    }
  }

  removeUploadedFile(): void {
    this.uploadedFile.set(null);
    this.uploadProgress.set(0);
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  }

  addBoqItem(): void {
    const items = this.formBoqItems();
    items.push({
      name: '',
      description: '',
      quantity: 1,
      unit_price: 0,
      total: 0
    });
    this.formBoqItems.set([...items]);
  }

  removeBoqItem(index: number): void {
    const items = this.formBoqItems();
    items.splice(index, 1);
    this.formBoqItems.set([...items]);
    this.calculateTotal();
  }

  updateBoqItem(index: number, field: string, value: any): void {
    const items = this.formBoqItems();
    (items[index] as any)[field] = value;
    
    // Auto-calculate total for this item
    if (field === 'quantity' || field === 'unit_price') {
      items[index].total = items[index].quantity * items[index].unit_price;
    }
    
    this.formBoqItems.set([...items]);
    this.calculateTotal();
  }

  calculateTotal(): void {
    const items = this.formBoqItems();
    const subtotal = items.reduce((sum, item) => sum + (item.total || 0), 0);
    this.formTotalPrice.set(subtotal);
  }

  getFinalPrice(): number {
    const total = this.formTotalPrice();
    const discount = this.formDiscount();
    const tax = this.formTax();
    
    const afterDiscount = total - (total * discount / 100);
    const afterTax = afterDiscount + (afterDiscount * tax / 100);
    
    return Math.round(afterTax * 100) / 100;
  }

  submitQuotation(): void {
    const leadId = this.selectedLeadId();
    const inspectionReportId = this.selectedInspectionReportId();
    


    
    if (!leadId) {
      this.toast.error('معرف العميل غير موجود');
      return;
    }

    if (!inspectionReportId) {
      this.toast.error('بيانات المعاينة غير مكتملة - لا يوجد تقرير معاينة');
      return;
    }

    if (this.formBoqItems().length === 0) {
      this.toast.warning('يرجى إضافة بند واحد على الأقل في قائمة الكميات');
      return;
    }

    // Validate BOQ items have required fields
    const invalidItems = this.formBoqItems().filter(item => 
      !item.name || !item.quantity || !item.unit_price
    );
    if (invalidItems.length > 0) {
      this.toast.warning('يرجى ملء جميع الحقول المطلوبة في بنود قائمة الكميات (الاسم، الكمية، السعر)');
      return;
    }

    if (!this.uploadedFile()) {
      this.toast.warning('يرجى رفع ملف عرض السعر (PDF)');
      return;
    }

    this.isUploading.set(true);
    this.uploadProgress.set(10);

    // Create FormData for file upload
    const formData = new FormData();
    formData.append('inspection_report_id', inspectionReportId.toString());
    formData.append('total_price', this.formTotalPrice().toString());
    formData.append('discount', this.formDiscount().toString());
    formData.append('tax', this.formTax().toString());
    formData.append('comments', this.formNotes());
    formData.append('boq_data', JSON.stringify({
      items: this.formBoqItems(),
      subtotal: this.formTotalPrice(),
      discount: this.formDiscount(),
      tax: this.formTax(),
      final_price: this.getFinalPrice()
    }));
    formData.append('file', this.uploadedFile()!);

    this.quotationsService.createQuotationWithFile(formData, (progress) => {
      this.uploadProgress.set(progress);
    }).subscribe({
      next: (response) => {
        this.isUploading.set(false);
        this.closeCreateModal();
        this.loadQuotations();
        this.toast.success('تم إنشاء عرض السعر بنجاح');
        
        // Navigate to the new quotation
        if (response.data?.quotation?.id) {
          this.router.navigate(['/quotations', response.data.quotation.id]);
        }
      },
      error: (err) => {
        console.error('Failed to create quotation:', err);
        this.isUploading.set(false);
        this.uploadProgress.set(0);
        this.toast.error('فشل في إنشاء عرض السعر');
      }
    });
  }
}
