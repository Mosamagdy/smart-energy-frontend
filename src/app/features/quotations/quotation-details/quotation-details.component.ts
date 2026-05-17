import { Component, inject, OnInit, signal, computed, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { QuotationsService, Quotation } from '../../../data/api/quotations.service';
import { LeadsService, Lead } from '../../../data/api/leads.service';
import { InspectionReportsService, InspectionReport } from '../../../data/api/inspection-reports.service';
import { ToastService } from '../../../core/services/toast.service';
import { AuthStore } from '../../../core/auth/auth.store';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { environment } from '../../../../environments/environment.prod';

@Component({
  selector: 'app-quotation-details',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  templateUrl: './quotation-details.component.html',
  styleUrls: ['./quotation-details.component.css']
})
export class QuotationDetailsComponent implements OnInit {
  private quotationsService = inject(QuotationsService);
  private leadsService = inject(LeadsService);
  private reportsService = inject(InspectionReportsService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private toast = inject(ToastService);
  private authStore = inject(AuthStore);
  private cdr = inject(ChangeDetectorRef);

  quotation = signal<Quotation | null>(null);
  lead = signal<Lead | null>(null);
  inspectionReport = signal<InspectionReport | null>(null);
  loading = signal(true);
  
  // Review state
  reviewComments = '';
  reviewLoading = false;
  showRejectionWarning = false;
  
  // New action states
  sendToClientLoading = false;
  paymentLoading = false;
  convertLoading = false;
  downpaymentAmount = 0;
  
  // User role
  userRole = computed(() => this.authStore.role());

  // ==========================================
  // COMPUTED PROPERTIES FOR PRICING
  // ==========================================
  
  /**
   * حساب المجموع الفرعي (Subtotal)
   * يأتي من boq_data.subtotal أو total_price
   */
  computedSubtotal = computed(() => {
    const q = this.quotation();
    if (!q) return 0;
    const boq = q.boq_data as any;
    return boq?.subtotal ?? Number(q.total_price) ?? 0;
  });
  
  /**
   * حساب السعر النهائي (Final Price)
   * يأتي من boq_data.final_price
   */
  computedFinalPrice = computed(() => {
    const q = this.quotation();
    if (!q) return 0;
    const boq = q.boq_data as any;
    return boq?.final_price ?? 0;
  });
  
  /**
   * حساب نسبة الخصم (Discount)
   */
  computedDiscount = computed(() => {
    const q = this.quotation();
    if (!q) return 0;
    return Number(q.discount) ?? 0;
  });
  
  /**
   * حساب نسبة الضريبة (Tax)
   */
  computedTax = computed(() => {
    const q = this.quotation();
    if (!q) return 0;
    return Number(q.tax) ?? 0;
  });

  ngOnInit(): void {
    const quotationId = this.route.snapshot.paramMap.get('id');
    if (quotationId) {
      this.loadQuotationDetails(parseInt(quotationId));
    }
  }

  private loadQuotationDetails(quotationId: number): void {
    this.loading.set(true);

    this.quotationsService.getQuotationById(quotationId).subscribe({
      next: (response: any) => {
        const q = response.data?.quotation;
        if (q) {
          const quotation = {
            ...q,
            total_price: Number(q.total_price),
            discount: Number(q.discount),
            tax: Number(q.tax)
          };
          this.quotation.set(quotation);
          
          // Load lead details if we have lead_id directly
          if (quotation.lead_id) {
            this.loadLeadDetails(quotation.lead_id);
          }
        } else {
          this.quotation.set(null);
        }
        
        this.loading.set(false);
      },
      error: (err: any) => {
        console.error('Failed to load quotation:', err);
        this.toast.error('فشل في تحميل عرض السعر');
        this.loading.set(false);
      }
    });
  }

  private loadLeadDetails(leadId: number): void {
    // Only load lead details if user has permission
    // This is optional - quotation can display without full lead data
    this.leadsService.getLeadById(leadId).subscribe({
      next: (response: any) => {
        this.lead.set(response.data?.lead || null);
      },
      error: (err: any) => {
        // Don't show error toast - lead details are optional
        console.warn('[Quotation Details] Could not load lead details (this is optional):', err.message);
        console.warn('[Quotation Details] HTTP Status:', err.status);
        // Set to null so UI can handle gracefully
        this.lead.set(null);
      }
    });
  }

  getStatusColor(status: string): string {
    const colors: Record<string, string> = {
      'draft': 'bg-gray-100 text-gray-700',
      'pending_finance_review': 'bg-yellow-100 text-yellow-800',
      'pending_gm_approval': 'bg-blue-100 text-blue-800',
      'gm_approved': 'bg-green-100 text-green-800',
      'approved': 'bg-green-100 text-green-800',
      'rejected': 'bg-red-100 text-red-800',
      'finance_rejected': 'bg-orange-100 text-orange-800',
      'gm_rejected': 'bg-red-100 text-red-800',
      'sent_to_client': 'bg-purple-100 text-purple-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-700';
  }

  getStatusText(status: string): string {
    const texts: Record<string, string> = {
      'draft': 'مسودة',
      'pending_finance_review': 'بانتظار المالية',
      'pending_gm_approval': 'بانتظار المدير العام',
      'gm_approved': 'معتمد من المدير العام',
      'approved': 'معتمد',
      'rejected': 'مرفوض',
      'finance_rejected': 'مرفوض من المالية',
      'gm_rejected': 'مرفوض من المدير العام',
      'sent_to_client': 'مُرسل للعميل'
    };
    return texts[status] || status;
  }

  getFileIcon(fileUrl: string): string {
    if (!fileUrl) return '📄';
    const ext = fileUrl.split('.').pop()?.toLowerCase();
    const icons: Record<string, string> = {
      'pdf': '📕',
      'jpg': '🖼️',
      'jpeg': '🖼️',
      'png': '🖼️',
      'gif': '🖼️',
      'webp': '🖼️',
      'doc': '📘',
      'docx': '📘',
      'xls': '📗',
      'xlsx': '📗'
    };
    return icons[ext || ''] || '📄';
  }

  isImage(fileUrl: string): boolean {
    if (!fileUrl) return false;
    const ext = fileUrl.split('.').pop()?.toLowerCase();
    return ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext || '');
  }

  getFullFileUrl(fileUrl: string): string {
  if (!fileUrl) return '';
  if (fileUrl.startsWith('http')) return fileUrl;
  return `${environment.apiUrl.replace('/api', '')}${fileUrl}`;
 } 
  downloadFile(fileUrl: string): void {
    const fullUrl = this.getFullFileUrl(fileUrl);
    const link = document.createElement('a');
    link.href = fullUrl;
    link.download = fileUrl.split('/').pop() || 'file';
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  viewFile(fileUrl: string): void {
    window.open(this.getFullFileUrl(fileUrl), '_blank');
  }

  goBack(): void {
    this.router.navigate(['/quotations']);
  }

  // ==========================================
  // REVIEW ACTIONS (Finance & GM)
  // ==========================================

  canReview(): boolean {
    const q = this.quotation();
    const role = this.userRole();
    
    console.log('=== CAN REVIEW DEBUG ===');
    console.log('Role:', role);
    console.log('Quotation Status:', q?.status);
    console.log('Has Quotation:', !!q);
    console.log('========================');
    
    if (!q || !role) return false;
    
    // Finance can review when status is pending_finance_review
    if (role === 'finance_manager' && q.status === 'pending_finance_review') {
      console.log('✅ Finance can review');
      return true;
    }
    
    // GM can review when status is pending_gm_approval
    if (role === 'general_manager' && q.status === 'pending_gm_approval') {
      console.log('✅ GM can review');
      return true;
    }
    
    console.log('❌ Cannot review - role or status mismatch');
    return false;
  }

  getReviewTitle(): string {
    const role = this.userRole();
    if (role === 'finance_manager') {
      return 'المراجعة المالية';
    }
    if (role === 'general_manager') {
      return 'اعتماد المدير العام';
    }
    return '';
  }

  getReviewBorderColor(): string {
    const role = this.userRole();
    if (role === 'finance_manager') {
      return 'border-yellow-300';
    }
    if (role === 'general_manager') {
      return 'border-blue-300';
    }
    return 'border-gray-200';
  }

  getReviewIconColor(): string {
    const role = this.userRole();
    if (role === 'finance_manager') {
      return 'text-yellow-600';
    }
    if (role === 'general_manager') {
      return 'text-blue-600';
    }
    return 'text-gray-600';
  }

  submitReview(status: 'approved' | 'rejected'): void {
    const q = this.quotation();
    if (!q) return;
    
    // Validate rejection comment
    if (status === 'rejected' && !this.reviewComments.trim()) {
      this.showRejectionWarning = true;
      this.toast.error('سبب الرفض مطلوب');
      return;
    }
    
    this.showRejectionWarning = false;
    this.reviewLoading = true;
    this.cdr.detectChanges();
    
    const role = this.userRole();
    const reviewService = role === 'finance_manager' 
      ? this.quotationsService.financeReview.bind(this.quotationsService)
      : this.quotationsService.gmReview.bind(this.quotationsService);
    
    reviewService(q.id, {
      status,
      comments: this.reviewComments.trim() || undefined
    }).subscribe({
      next: (response: any) => {
        const actionText = status === 'approved' ? 'الموافقة' : 'الرفض';
        this.toast.success(`تم ${actionText} عرض السعر بنجاح`);
        
        this.reviewLoading = false;
        this.reviewComments = '';
        this.cdr.detectChanges();
        
        this.loadQuotationDetails(q.id);
        
        setTimeout(() => {
          this.router.navigate(['/quotations']);
        }, 1500);
      },
      error: (err: any) => {
        console.error('Review failed:', err);
        this.toast.error(err.error?.message || 'فشل في معالجة الطلب');
        this.reviewLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  // ==========================================
  // SEND TO CLIENT & PROJECT CONVERSION
  // ==========================================

  canSendToClient(): boolean {
    const q = this.quotation();
    const role = this.userRole();
    return q?.status === 'gm_approved' && 
           (role === 'general_manager' || role === 'super_admin');
  }

  canConfirmPayment(): boolean {
    const q = this.quotation();
    const role = this.userRole();
    return q?.client_response === 'client_approved' && 
           q?.payment_status === 'pending' &&
           (role === 'finance_manager' || role === 'general_manager' || role === 'super_admin');
  }

  canConvertToProject(): boolean {
    const q = this.quotation();
    const role = this.userRole();
    
    const paymentReady = q?.payment_status === 'downpayment_received' || q?.payment_status === 'fully_paid';
    const clientApproved = q?.client_response === 'client_approved';
    
    return clientApproved && (paymentReady || role === 'general_manager') && 
           !q?.project_id &&
           (role === 'general_manager' || role === 'super_admin');
  }

  handleSendToClient(): void {
    if (!confirm('هل أنت متأكد من إرسال العرض للعميل؟')) return;
    
    this.sendToClientLoading = true;
    this.cdr.detectChanges();
    
    this.quotationsService.sendToClient(this.quotation()!.id).subscribe({
      next: (response) => {
        this.sendToClientLoading = false;
        this.cdr.detectChanges();
        
        if (response.data.temp_password) {
          this.toast.success(
            `تم إرسال العرض للعميل. كلمة المرور المؤقتة: ${response.data.temp_password}`
          );
          console.log('🔑 TEMP PASSWORD:', response.data.temp_password);
        } else {
          this.toast.success('تم إرسال العرض للعميل بنجاح');
        }
        
        this.loadQuotationDetails(this.quotation()!.id);
      },
      error: (err) => {
        this.sendToClientLoading = false;
        this.cdr.detectChanges();
        this.toast.error(err.error?.message || 'فشل في إرسال العرض');
      }
    });
  }

  handleConfirmDownpayment(): void {
    const amount = this.downpaymentAmount;
    if (!amount || amount <= 0) {
      this.toast.error('يرجى إدخال مبلغ صحيح');
      return;
    }
    
    if (!confirm(`هل أنت متأكد من تأكيد استلام دفعة بقيمة ${amount} ج.م؟`)) return;
    
    this.paymentLoading = true;
    this.cdr.detectChanges();
    
    this.quotationsService.confirmDownpayment(this.quotation()!.id, amount).subscribe({
      next: () => {
        this.paymentLoading = false;
        this.cdr.detectChanges();
        this.toast.success('تم تأكيد استلام الدفعة الأولى بنجاح');
        this.loadQuotationDetails(this.quotation()!.id);
      },
      error: (err) => {
        this.paymentLoading = false;
        this.cdr.detectChanges();
        this.toast.error(err.error?.message || 'فشل في تأكيد الدفعة');
      }
    });
  }

  handleConvertToProject(): void {
    if (!confirm('هل أنت متأكد من تحويل العرض لمشروع؟ سيتم نقل جميع البنود كمهام.')) return;
    
    this.convertLoading = true;
    this.cdr.detectChanges();
    
    this.quotationsService.convertToProject(this.quotation()!.id).subscribe({
      next: (response) => {
        this.convertLoading = false;
        this.cdr.detectChanges();
        this.toast.success(
          `تم إنشاء المشروع بنجاح! تم إنشاء ${response.data.tasks_created} مهام`
        );
        
        setTimeout(() => {
          this.router.navigate(['/projects', response.data.project.id]);
        }, 1500);
      },
      error: (err) => {
        this.convertLoading = false;
        this.cdr.detectChanges();
        this.toast.error(err.error?.message || 'فشل في تحويل العرض لمشروع');
      }
    });
  }
}