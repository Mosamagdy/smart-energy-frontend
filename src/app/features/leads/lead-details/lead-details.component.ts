import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { HttpClient } from '@angular/common/http';
import { LeadsService, Lead } from '../../../data/api/leads.service';
import { UsersService, User } from '../../../data/api/users.service';
import { InspectionReportsService, InspectionReport } from '../../../data/api/inspection-reports.service';
import { ToastService } from '../../../core/services/toast.service';
import { AuthStore } from '../../../core/auth/auth.store';
import { environment } from '../../../../environments/environment.prod';

interface Interaction {
  id: number;
  lead_id: number;
  interaction_type: 'call' | 'email' | 'meeting' | 'note';
  description: string;
  performed_by: number;
  performed_by_name: string;
  next_follow_up_date: string | null;
  created_at: string;
}

@Component({
  selector: 'app-lead-details',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  templateUrl: './lead-details.component.html',
  styleUrls: ['./lead-details.component.css']
})
export class LeadDetailsComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private leadsService = inject(LeadsService);
  private usersService = inject(UsersService);
  private reportsService = inject(InspectionReportsService);
  private toast = inject(ToastService);
  private sanitizer = inject(DomSanitizer);
  protected auth = inject(AuthStore);
  public translate = inject(TranslateService);
  private http = inject(HttpClient);

  lead = signal<Lead | null>(null);
  loading = signal(true);
  error = signal<string | null>(null);

  interactions = signal<Interaction[]>([]);
  interactionsLoading = signal(false);
  showInteractionForm = signal(false);

  formInteractionType = signal<'call' | 'email' | 'meeting' | 'note'>('call');
  formDescription = signal('');
  formNextFollowUp = signal('');

  showAssignSalesModal = signal(false);
  showAssignEngineerModal = signal(false);

  salesReps = signal<User[]>([]);
  engineers = signal<User[]>([]);
  usersLoading = signal(false);

  selectedSalesRepId = signal<number | null>(null);
  selectedEngineerId = signal<number | null>(null);

  reports = signal<InspectionReport[]>([]);
  reportsLoading = signal(false);
  showReportUploadModal = signal(false);
  formReportText = signal('');
  formReportFileUrl = signal('');
  formReportImagesUrls = signal<string[]>([]);

  uploadedFile = signal<File | null>(null);
  uploadProgress = signal<number>(0);

  fileViewerUrl = signal<string | null>(null);
  fileViewerType = signal<'image' | 'pdf' | 'other'>('other');

  fileViewerSafeUrl = computed<SafeResourceUrl>(() =>
    this.sanitizer.bypassSecurityTrustResourceUrl(this.fileViewerUrl() ?? '')
  );

  ngOnInit(): void {
    const leadId = this.route.snapshot.paramMap.get('id');
    if (leadId) {
      this.loadLead(+leadId);
      this.loadInteractions(+leadId);
      this.loadReports(+leadId);
    }
  }

  loadLead(id: number): void {
    this.loading.set(true);
    this.error.set(null);

    this.leadsService.getLeadById(id).subscribe({
      next: (response) => {
        const leadData = response.data.lead;

        const userRole = this.auth.role();
        const userId = this.auth.user()?.id;
        const userDeptId = this.auth.user()?.department_id;
        const userDeptType = this.auth.user()?.dept_type;

        if (userRole === 'engineer') {
          if (leadData.assigned_engineer_id !== userId) {
            this.toast.error(this.translate.instant('leads.unauthorizedAccess'));
            this.router.navigate(['/dashboard/engineer']);
            return;
          }
        }

        if (userRole === 'sales_rep') {
          if (leadData.assigned_sales_rep_id !== userId) {
            this.toast.error(this.translate.instant('leads.unauthorizedAccess'));
            this.router.navigate(['/dashboard/sales']);
            return;
          }
        }

        if (userRole === 'tech_head' && userDeptId) {
          if (userDeptType === 'technical') {
            if (leadData.technical_dept_id !== userDeptId) {
              this.toast.error(this.translate.instant('leads.unauthorizedAccessNotYourDept'));
              this.router.navigate(['/leads']);
              return;
            }
          }
        }

        this.lead.set(leadData);
        this.loading.set(false);
      },
      error: (err: any) => {
        console.error('Failed to load lead:', err);

        if (err.status === 403 || err.status === 401) {
          const userRole = this.auth.role();
          this.toast.error(this.translate.instant('leads.unauthorizedAccess'));
          if (userRole === 'engineer') {
            this.router.navigate(['/dashboard/engineer']);
          } else if (userRole === 'sales_rep') {
            this.router.navigate(['/dashboard/sales']);
          } else {
            this.router.navigate(['/leads']);
          }
          return;
        }

        this.error.set(this.translate.instant('leads.failedToLoadLead'));
        this.loading.set(false);
      }
    });
  }

  private loadInteractions(leadId: number): void {
    this.interactionsLoading.set(true);

    this.leadsService.getInteractions(leadId).subscribe({
      next: (response) => {
        this.interactions.set(response.data.interactions || []);
        this.interactionsLoading.set(false);
      },
      error: (err) => {
        console.error('Failed to load interactions:', err);
        this.interactions.set([]);
        this.interactionsLoading.set(false);
      }
    });
  }

  getCurrentStage(): number {
    const lead = this.lead();
    if (!lead) return 0;

    const stageMap: Record<string, number> = {
      'new': 1,
      'contacted': 1,
      'survey_requested': 2,
      'inspection_assigned': 2,
      'inspection_completed': 3,
      'quotation_sent': 3,
      'won': 4,
      'lost': 4
    };

    return stageMap[lead.status] || 1;
  }

  private readonly surveyAllowedRoles = [
    'super_admin',
    'general_manager',
    'sales_manager',
    'sales_rep',
    'dept_head'
  ];

  canRequestSurvey(): boolean {
    const lead = this.lead();
    const role = this.auth.role();
    return (
      !!lead &&
      ['new', 'contacted'].includes(lead.status) &&
      !!lead.technical_dept_id &&
      this.surveyAllowedRoles.includes(role || '')
    );
  }

  canAssignSalesRep(): boolean {
    const lead = this.lead();
    const role = this.auth.role();
    if (lead?.assigned_sales_rep_id) return false;
    return !!lead && ['super_admin', 'general_manager', 'sales_manager'].includes(role || '');
  }

  canAssignEngineer(): boolean {
    const lead = this.lead();
    const role = this.auth.role();
    const userDeptId = this.auth.user()?.department_id;

    if (lead?.assigned_engineer_id) return false;

    if (role === 'tech_head' && userDeptId) {
      if (lead?.technical_dept_id !== userDeptId) return false;
    }

    return (
      !!lead &&
      lead.status === 'survey_requested' &&
      ['super_admin', 'general_manager', 'tech_head'].includes(role || '')
    );
  }

  canCreateQuotation(): boolean {
    const lead = this.lead();
    const role = this.auth.role();
    return (
      !!lead &&
      lead.status === 'inspection_completed' &&
      ['super_admin', 'general_manager', 'quotation_specialist'].includes(role || '')
    );
  }

  canUploadReport(): boolean {
    const lead = this.lead();
    const userId = this.auth.user()?.id;
    return !!lead && lead.assigned_engineer_id === userId;
  }

  canLogInteraction(): boolean {
    const role = this.auth.role();
    return !['engineer', 'quotation_specialist'].includes(role || '');
  }

  navigateToCreateQuotation(): void {
    const lead = this.lead();
    if (!lead) return;
    this.router.navigate(['/quotations'], {
      queryParams: { leadId: lead.id, action: 'create' }
    });
  }

  requestSurvey(): void {
    const lead = this.lead();
    const leadId = lead?.id;
    if (!leadId) return;

    const role = this.auth.role();

    if (!this.surveyAllowedRoles.includes(role || '')) {
      this.toast.warning(this.translate.instant('leads.unauthorizedSurveyRequest'));
      return;
    }

    if (!lead?.technical_dept_id) {
      this.toast.error(this.translate.instant('leads.mustAssignTechnicalDeptFirst'));
      return;
    }

    this.leadsService.requestSurvey(leadId).subscribe({
      next: (response) => {
        this.lead.set(response.data.lead);
        this.loadInteractions(leadId);
        this.toast.success(this.translate.instant('leads.surveyRequestSuccess'));
      },
      error: (err) => {
        console.error('Failed to request survey:', err);
        this.toast.error(this.translate.instant('leads.surveyRequestFailed'));
      }
    });
  }

  openInteractionForm(): void {
    this.showInteractionForm.set(true);
    this.formInteractionType.set('call');
    this.formDescription.set('');
    this.formNextFollowUp.set('');
  }

  closeInteractionForm(): void {
    this.showInteractionForm.set(false);
  }

  submitInteraction(): void {
    if (!this.formDescription()) {
      this.toast.warning(this.translate.instant('leads.descriptionRequired'));
      return;
    }

    const leadId = this.lead()?.id;
    if (!leadId) return;

    const interactionData = {
      interaction_type: this.formInteractionType(),
      description: this.formDescription(),
      next_follow_up_date: this.formNextFollowUp() || undefined
    };

    this.leadsService.createInteraction(leadId, interactionData).subscribe({
      next: () => {
        this.loadInteractions(leadId);
        this.closeInteractionForm();
        this.toast.success(this.translate.instant('leads.interactionLoggedSuccess'));
      },
      error: (err) => {
        console.error('Failed to create interaction:', err);
        this.toast.error(this.translate.instant('leads.interactionLogFailed'));
      }
    });
  }

  openAssignSalesModal(): void {
    this.showAssignSalesModal.set(true);
    this.selectedSalesRepId.set(null);
    this.loadSalesReps();
  }

  closeAssignSalesModal(): void {
    this.showAssignSalesModal.set(false);
    this.selectedSalesRepId.set(null);
  }

  loadSalesReps(): void {
    this.usersLoading.set(true);
    this.usersService.getUsersByRole('sales_rep').subscribe({
      next: (response) => {
        this.salesReps.set(response.data.users || []);
        this.usersLoading.set(false);
      },
      error: (err) => {
        console.error('Failed to load sales reps:', err);
        this.toast.error(this.translate.instant('leads.failedToLoadSalesReps'));
        this.usersLoading.set(false);
      }
    });
  }

  submitAssignSalesRep(): void {
    if (!this.selectedSalesRepId()) {
      this.toast.warning(this.translate.instant('leads.pleaseSelectSalesRep'));
      return;
    }

    const role = this.auth.role();
    if (!['super_admin', 'general_manager', 'sales_manager'].includes(role || '')) {
      this.toast.warning(this.translate.instant('leads.unauthorizedAssignSalesRep'));
      return;
    }

    const leadId = this.lead()?.id;
    if (!leadId) return;

    this.leadsService.assignSalesRep(leadId, this.selectedSalesRepId()!).subscribe({
      next: () => {
        this.closeAssignSalesModal();
        this.loadLead(leadId); // ✅ reload كامل عشان يجيب الاسم
        this.toast.success(this.translate.instant('leads.salesRepAssignedSuccess'));
      },
      error: (err) => {
        console.error('Failed to assign sales rep:', err);
        this.toast.error(this.translate.instant('leads.salesRepAssignFailed'));
      }
    });
  }

  openAssignEngineerModal(): void {
    this.showAssignEngineerModal.set(true);
    this.selectedEngineerId.set(null);
    this.loadEngineers();
  }

  closeAssignEngineerModal(): void {
    this.showAssignEngineerModal.set(false);
    this.selectedEngineerId.set(null);
  }

  loadEngineers(): void {
    const lead = this.lead();
    if (!lead?.technical_dept_id) {
      this.toast.error(this.translate.instant('leads.noTechnicalDeptAssigned'));
      return;
    }

    this.usersLoading.set(true);
    this.usersService.getUsersByDepartmentAndRole(lead.technical_dept_id, 'engineer').subscribe({
      next: (response) => {
        this.engineers.set(response.data.users || []);
        this.usersLoading.set(false);
      },
      error: (err) => {
        console.error('Failed to load engineers:', err);
        this.toast.error(this.translate.instant('leads.failedToLoadEngineers'));
        this.usersLoading.set(false);
      }
    });
  }

  submitAssignEngineer(): void {
    if (!this.selectedEngineerId()) {
      this.toast.warning(this.translate.instant('leads.pleaseSelectEngineer'));
      return;
    }

    const role = this.auth.role();
    const userDeptId = this.auth.user()?.department_id;
    const lead = this.lead();

    if (!['super_admin', 'general_manager', 'tech_head'].includes(role || '')) {
      this.toast.warning(this.translate.instant('leads.unauthorizedAssignEngineer'));
      return;
    }

    if (role === 'tech_head' && userDeptId && lead?.technical_dept_id) {
      if (lead.technical_dept_id !== userDeptId) {
        this.toast.error(this.translate.instant('leads.notAuthorizedLeadNotYourDept'));
        return;
      }
    }

    const leadId = lead?.id;
    if (!leadId) return;

    this.leadsService.assignEngineer(leadId, this.selectedEngineerId()!).subscribe({
      next: () => {
        this.closeAssignEngineerModal();
        this.loadLead(leadId); // ✅ reload كامل عشان يجيب الاسم
        this.toast.success(this.translate.instant('leads.engineerAssignedSuccess'));
      },
      error: (err) => {
        console.error('Failed to assign engineer:', err);
        this.toast.error(this.translate.instant('leads.engineerAssignFailed'));
      }
    });
  }

  removeSalesRep(): void {
    const lead = this.lead();
    if (!lead) return;

    if (!confirm(this.translate.instant('leads.confirmRemoveSalesRep'))) return;

    this.leadsService.removeSalesRep(lead.id).subscribe({
      next: (response) => {
        this.lead.set(response.data.lead);
        this.toast.success(this.translate.instant('leads.salesRepRemovedSuccess'));
      },
      error: (err) => {
        console.error('Failed to remove sales rep:', err);
        this.toast.error(this.translate.instant('leads.salesRepRemoveFailed'));
      }
    });
  }

  removeEngineer(): void {
    const lead = this.lead();
    if (!lead) return;

    if (!confirm(this.translate.instant('leads.confirmRemoveEngineer'))) return;

    this.leadsService.removeEngineer(lead.id).subscribe({
      next: (response) => {
        this.lead.set(response.data.lead);
        this.toast.success(this.translate.instant('leads.engineerRemovedSuccess'));
      },
      error: (err) => {
        console.error('Failed to remove engineer:', err);
        this.toast.error(this.translate.instant('leads.engineerRemoveFailed'));
      }
    });
  }

  private loadReports(leadId: number): void {
    this.reportsLoading.set(true);

    this.reportsService.getReports(leadId).subscribe({
      next: (response) => {
        this.reports.set(response.data.reports || []);
        this.reportsLoading.set(false);
      },
      error: (err) => {
        console.error('Failed to load reports:', err);
        if (err.status === 403 || err.status === 401) {
          this.toast.error(this.translate.instant('leads.unauthorizedViewReports'));
        } else if (err.status === 500) {
          this.toast.error(this.translate.instant('leads.serverErrorLoadReports'));
        } else {
          this.toast.error(this.translate.instant('leads.failedToLoadReports'));
        }
        this.reports.set([]);
        this.reportsLoading.set(false);
      }
    });
  }

  openReportUploadModal(): void {
    this.showReportUploadModal.set(true);
    this.formReportText.set('');
    this.formReportFileUrl.set('');
    this.formReportImagesUrls.set([]);
  }

  closeReportUploadModal(): void {
    this.showReportUploadModal.set(false);
    this.formReportText.set('');
    this.formReportFileUrl.set('');
    this.formReportImagesUrls.set([]);
    this.uploadedFile.set(null);
    this.uploadProgress.set(0);
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      const maxSize = 10 * 1024 * 1024;
      if (file.size > maxSize) {
        this.toast.error(this.translate.instant('leads.fileTooLarge'));
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

  submitReport(): void {
    if (!this.formReportText() && !this.uploadedFile() && !this.formReportFileUrl()) {
      this.toast.warning(this.translate.instant('leads.pleaseAddReportTextOrFile'));
      return;
    }

    const leadId = this.lead()?.id;
    if (!leadId) return;

    if (this.uploadedFile()) {
      const formData = new FormData();
      formData.append('report_text', this.formReportText());
      formData.append('file', this.uploadedFile()!);

      this.uploadProgress.set(10);

      this.reportsService.createReportWithFile(leadId, formData, (progress: number) => {
        this.uploadProgress.set(progress);
      }).subscribe({
        next: () => {
          this.loadReports(leadId);
          this.closeReportUploadModal();
          this.toast.success(this.translate.instant('leads.reportUploadSuccess'));
        },
        error: (err: any) => {
          console.error('Failed to upload report:', err);
          this.uploadProgress.set(0);
          this.toast.error(this.translate.instant('leads.reportUploadFailed'));
        }
      });
    } else {
      const reportData = {
        report_text: this.formReportText() || undefined,
        file_url: this.formReportFileUrl() || undefined,
        images_urls: []
      };

      this.reportsService.createReport(leadId, reportData).subscribe({
        next: () => {
          this.loadReports(leadId);
          this.closeReportUploadModal();
          this.toast.success(this.translate.instant('leads.reportUploadSuccess'));
        },
        error: (err: any) => {
          console.error('Failed to upload report:', err);
          this.toast.error(this.translate.instant('leads.reportUploadFailed'));
        }
      });
    }
  }

  getFileType(url: string): 'image' | 'pdf' | 'other' {
    if (!url) return 'other';
    const lower = url.toLowerCase().split('?')[0];
    if (/\.(jpg|jpeg|png|gif|webp|bmp|svg)$/.test(lower)) return 'image';
    if (/\.pdf$/.test(lower)) return 'pdf';
    return 'other';
  }

  resolveFileUrl(url: string): string {
    if (!url) return url;
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    const backendBase = environment.apiUrl.replace('/api', '');
    return `${backendBase}${url.startsWith('/') ? '' : '/'}${url}`;
  }

  openFileViewer(url: string, type: 'image' | 'pdf' | 'other'): void {
    this.fileViewerUrl.set(this.resolveFileUrl(url));
    this.fileViewerType.set(type);
  }

  closeFileViewer(): void {
    this.fileViewerUrl.set(null);
    this.fileViewerType.set('other');
  }

  setInteractionType(type: string): void {
    if (type === 'call' || type === 'email' || type === 'meeting' || type === 'note') {
      this.formInteractionType.set(type);
    }
  }

  getInteractionIcon(type: string): string {
    const icons: Record<string, string> = {
      'call': '📞', 'email': '📧', 'meeting': '🤝', 'note': '📝'
    };
    return icons[type] || '📋';
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'new': return 'bg-green-100 text-green-700 border border-green-200';
      case 'contacted': return 'bg-blue-100 text-blue-700 border border-blue-200';
      case 'survey_requested': return 'bg-yellow-100 text-yellow-700 border border-yellow-200';
      case 'inspection_assigned': return 'bg-purple-100 text-purple-700 border border-purple-200';
      case 'inspection_completed': return 'bg-indigo-100 text-indigo-700 border border-indigo-200';
      case 'quotation_sent': return 'bg-orange-100 text-orange-700 border border-orange-200';
      case 'won': return 'bg-emerald-100 text-emerald-700 border border-emerald-200';
      case 'lost': return 'bg-red-100 text-red-700 border border-red-200';
      default: return 'bg-gray-100 text-gray-700 border border-gray-200';
    }
  }

  getPriorityColor(priority: string): string {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-700 border border-red-200';
      case 'medium': return 'bg-blue-100 text-blue-700 border border-blue-200';
      case 'low': return 'bg-gray-100 text-gray-700 border border-gray-200';
      case 'urgent': return 'bg-red-200 text-red-800 border border-red-300 animate-pulse';
      default: return 'bg-gray-100 text-gray-700 border border-gray-200';
    }
  }

  goBack(): void {
    this.router.navigate(['/leads']);
  }
}