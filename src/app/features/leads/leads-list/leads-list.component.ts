import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LeadsService, Lead, CreateLeadDto, LeadStatus, LeadPriority } from '../../../data/api/leads.service';
import { DepartmentsService, Department } from '../../../data/api/departments.service';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { AuthStore } from '../../../core/auth/auth.store';

@Component({
  selector: 'app-leads-list',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  templateUrl: './leads-list.component.html',
  styleUrls: ['./leads-list.component.css']
})
export class LeadsListComponent implements OnInit {
  private leadsService = inject(LeadsService);
  private departmentsService = inject(DepartmentsService);
  private router = inject(Router);
  private translate = inject(TranslateService);
  private auth = inject(AuthStore);

  // Data signals
  leads = signal<Lead[]>([]);
  loading = signal(true);
  error = signal<string | null>(null);
  showAddModal = signal(false);
  
  // Technical departments (filtered by dept_type='technical')
  technicalDepartments = signal<Department[]>([]);

  // Filter signals
  filterStatus = signal<string>('');
  filterPriority = signal<string>('');
  searchQuery = signal('');

  // Form state
  formClientName = signal('');
  formServiceType = signal('');
  formContactEmail = signal('');
  formContactPhone = signal('');
  formPriority = signal<LeadPriority>('medium');
  formTechnicalDeptId = signal<number | null>(null);
  formNotes = signal('');

  // Computed filtered leads
  filteredLeads = computed(() => {
    let result = this.leads();

    if (this.filterStatus()) {
      result = result.filter(lead => lead.status === this.filterStatus());
    }

    if (this.filterPriority()) {
      result = result.filter(lead => lead.priority === this.filterPriority());
    }

    if (this.searchQuery()) {
      const query = this.searchQuery().toLowerCase();
      result = result.filter(lead =>
        lead.client_name.toLowerCase().includes(query) ||
        (lead.contact_phone && lead.contact_phone.toLowerCase().includes(query)) ||
        (lead.contact_email && lead.contact_email.toLowerCase().includes(query)) ||
        (lead.service_type && lead.service_type.toLowerCase().includes(query)) ||
        (lead.source && lead.source.toLowerCase().includes(query))
      );
    }

    return result;
  });

  // Stats
  stats = computed(() => {
    const allLeads = this.leads();
    return {
      total: allLeads.length,
      new: allLeads.filter(l => l.status === 'new').length,
      qualified: allLeads.filter(l => l.status === 'qualified').length,
      won: allLeads.filter(l => l.status === 'won').length,
    };
  });

  statusOptions: { value: LeadStatus; label: string; labelAr: string }[] = [
    { value: 'new', label: 'New', labelAr: 'جديد' },
    { value: 'contacted', label: 'Contacted', labelAr: 'تم التواصل' },
    { value: 'proposal_sent', label: 'Proposal Sent', labelAr: 'تم إرسال العرض' },
    { value: 'won', label: 'Won', labelAr: 'مكسب' },
    { value: 'lost', label: 'Lost', labelAr: 'مفقود' },
  ];

  priorityOptions: { value: LeadPriority; label: string; labelAr: string }[] = [
    { value: 'low', label: 'Low', labelAr: 'منخفض' },
    { value: 'medium', label: 'Medium', labelAr: 'متوسط' },
    { value: 'high', label: 'High', labelAr: 'عالي' },
    { value: 'urgent', label: 'Urgent', labelAr: 'عاجل' },
  ];

  ngOnInit(): void {
    this.loadLeads();
    this.loadTechnicalDepartments();
  }

  canCreateLead(): boolean {
    const role = this.auth.role();
    return role === 'super_admin' || role === 'general_manager' || role === 'sales_manager';
  }

  private loadTechnicalDepartments(): void {
    this.departmentsService.getTechnicalDepartments().subscribe({
      next: (response) => {
        this.technicalDepartments.set(response.data.departments || []);
      },
      error: (err) => {
        console.error('Failed to load technical departments:', err);
      }
    });
  }

private loadLeads(): void {
  this.loading.set(true);
  this.error.set(null);

  // ✅ مش محتاج تبعت params — الباك بيعرف الـ role من الـ token
  this.leadsService.getAllLeads().subscribe({
    next: (response) => {
      this.leads.set(response.data.leads || []);
      this.loading.set(false);
    },
    error: (err) => {
      console.error('Failed to load leads:', err);
      this.error.set(this.translate.instant('leads.failedToLoad'));
      this.loading.set(false);
    }
  });
}
  openAddModal(): void {
    this.showAddModal.set(true);
  }

  closeAddModal(): void {
    this.showAddModal.set(false);
    this.clearForm();
  }

  clearForm(): void {
    this.formClientName.set('');
    this.formServiceType.set('');
    this.formContactEmail.set('');
    this.formContactPhone.set('');
    this.formPriority.set('medium');
    this.formTechnicalDeptId.set(null);
    this.formNotes.set('');
  }

  submitForm(): void {
    if (!this.formClientName() || !this.formServiceType()) {
      alert(this.translate.instant('leads.nameAndServiceRequired'));
      return;
    }

    if (!this.formTechnicalDeptId()) {
      alert(this.translate.instant('leads.technicalDeptRequired'));
      return;
    }

    const data: CreateLeadDto = {
      client_name: this.formClientName(),
      service_type: this.formServiceType(),
      contact_email: this.formContactEmail() || undefined,
      contact_phone: this.formContactPhone() || undefined,
      priority: this.formPriority(),
      notes: this.formNotes() || undefined,
      technical_dept_id: this.formTechnicalDeptId() || undefined,
    };

    this.leadsService.createLead(data).subscribe({
      next: (response) => {
        // ✅ FIX: بنضيف الليد الجديد للـ array مباشرة بدل loadLeads()
        // علشان بعد الـ create، الباك ممكن ما يرجعوش في الـ getAllLeads بسبب الفلترة
        this.leads.update(leads => [response.data.lead, ...leads]);
        this.closeAddModal();
      },
      error: (err) => {
        console.error('Failed to create lead:', err);
        alert(this.translate.instant('leads.failedToCreate'));
      }
    });
  }

  getStatusBadgeClass(status: LeadStatus): string {
    const classes: Record<LeadStatus, string> = {
      new: 'bg-blue-100 text-blue-800',
      contacted: 'bg-gray-100 text-gray-800',
      survey_requested: 'bg-yellow-100 text-yellow-800',
      inspection_assigned: 'bg-purple-100 text-purple-800',
      inspection_completed: 'bg-indigo-100 text-indigo-800',
      quotation_sent: 'bg-orange-100 text-orange-800',
      qualified: 'bg-purple-100 text-purple-800',
      proposal_sent: 'bg-yellow-100 text-yellow-800',
      negotiation: 'bg-orange-100 text-orange-800',
      won: 'bg-green-100 text-green-800',
      lost: 'bg-red-100 text-red-800',
    };
    return classes[status];
  }

  getStatusLabel(status: LeadStatus): string {
    return this.translate.instant(`leads.${status}`);
  }

  getPriorityBadgeClass(priority: LeadPriority): string {
    const classes: Record<LeadPriority, string> = {
      low: 'bg-gray-100 text-gray-600',
      medium: 'bg-blue-100 text-blue-800',
      high: 'bg-orange-100 text-orange-800',
      urgent: 'bg-red-100 text-red-800',
    };
    return classes[priority];
  }

  getPriorityLabel(priority: LeadPriority): string {
    return this.translate.instant(`leads.priority.${priority}`);
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

  getPriorityText(priority: string): string {
    return this.translate.instant(`leads.priority.${priority}`);
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'new': return 'bg-green-100 text-green-700 border border-green-200';
      case 'contacted': return 'bg-blue-100 text-blue-700 border border-blue-200';
      case 'qualified': return 'bg-purple-100 text-purple-700 border border-purple-200';
      case 'proposal_sent': return 'bg-yellow-100 text-yellow-700 border border-yellow-200';
      case 'negotiation': return 'bg-orange-100 text-orange-700 border border-orange-200';
      case 'won': return 'bg-emerald-100 text-emerald-700 border border-emerald-200';
      case 'lost': return 'bg-red-100 text-red-700 border border-red-200';
      default: return 'bg-gray-100 text-gray-700 border border-gray-200';
    }
  }

  getStatusText(status: string): string {
    return this.translate.instant(`leads.${status}`);
  }

  viewLeadDetails(leadId: number): void {
    this.router.navigate(['/leads', leadId]);
  }

  canEditDelete(lead: Lead): boolean {
    return ['new', 'lost'].includes(lead.status);
  }

  deleteLead(leadId: number): void {
    if (!confirm(this.translate.instant('leads.confirmDelete'))) {
      return;
    }

    this.leadsService.deleteLead(leadId).subscribe({
      next: () => {
        this.loadLeads();
      },
      error: (err: any) => {
        console.error('Failed to delete lead:', err);
        alert(this.translate.instant('leads.failedToDelete'));
      }
    });
  }

  resetFilters(): void {
    this.filterStatus.set('');
    this.filterPriority.set('');
    this.searchQuery.set('');
  }
}