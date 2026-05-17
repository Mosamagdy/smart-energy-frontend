import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule, DatePipe, DecimalPipe } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { HttpClient } from '@angular/common/http';
import { AuthStore } from '../../../core/auth/auth.store';
import { ToastService } from '../../../core/services/toast.service';
import { environment } from '../../../../environments/environment.prod';

// ============================================================================
// Document Interface
// ============================================================================
export interface ProjectDocument {
  id: string | number;
  file_name: string;
  file_path: string;
  file_type: string;
  category: 'technical' | 'financial' | 'contract' | 'delivery';
  category_label: string;
  upload_date: string;
  uploader_name: string;
  size?: string;
  description?: string;
}

// ============================================================================
// ✅ Official Contract Interface (from contracts table)
// ============================================================================
export interface OfficialContract {
  id: number;
  contract_number: string;
  contract_type: string;
  start_date: string;
  end_date: string;
  total_value: number;
  currency: string;
  status: string;
  attachment_url: string;
  description: string;
  created_at: string;
  created_by_name: string;
  signed_by_client: boolean;
  signed_by_company: boolean;
}

// ============================================================================
// Project Reports Component
// ============================================================================
@Component({
  selector: 'app-project-reports',
  standalone: true,
  imports: [CommonModule, DatePipe, TranslateModule],
  templateUrl: './project-reports.component.html',
  styleUrls: ['./project-reports.component.css']
})
export class ProjectReportsComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private http = inject(HttpClient);
  private auth = inject(AuthStore);
  private toast = inject(ToastService);
  public translateService = inject(TranslateService);

  // State
  projectId = signal<number>(0);
  documents = signal<ProjectDocument[]>([]);
  loading = signal(true);
  error = signal<string | null>(null);
  
  // ✅ Official Contracts (from contracts table)
  officialContracts = signal<OfficialContract[]>([]);
  officialContractsLoading = signal<boolean>(false);
  
  // Contract indicator (for documents section)
  hasContracts = signal<boolean>(false);
  contractCount = signal<number>(0);
  
  // Filters
  selectedCategory = signal<string>('all');
  filteredDocuments = signal<ProjectDocument[]>([]);

  // Categories
  categories = [
    { value: 'all', label: this.translateService.instant('projectReports.categories.all'), icon: '📁' },
    { value: 'technical', label: this.translateService.instant('projectReports.categories.technical'), icon: '🔧' },
    { value: 'financial', label: this.translateService.instant('projectReports.categories.financial'), icon: '💰' },
    { value: 'contract', label: this.translateService.instant('projectReports.categories.contract'), icon: '📝' },
    { value: 'delivery', label: this.translateService.instant('projectReports.categories.delivery'), icon: '📸' }
  ];

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.projectId.set(+id);
      this.loadProjectDocuments(+id);
      this.loadOfficialContracts(+id); // ✅ Load official contracts separately
    }
  }

  // ============================================================================
  // Load All Project Documents from Multiple Sources
  // ============================================================================
  private loadProjectDocuments(projectId: number): void {
    this.loading.set(true);
    this.error.set(null);

    // Fetch documents from multiple sources in parallel
    Promise.all([
      this.fetchInspectionReports(projectId),
      this.fetchQuotations(projectId),
      this.fetchContracts(projectId),
      this.fetchInvoices(projectId)
    ]).then((results) => {
      const [inspections, quotations, contracts, invoices] = results;
      const allDocs = results.flat();
      
      this.documents.set(allDocs);
      this.filteredDocuments.set(allDocs);
      
      // Show summary toast with total count
      if (allDocs.length > 0) {
        this.toast.success(
          `✅ ${this.translateService.instant('projectReports.success', { count: allDocs.length })}`,
          4000
        );
      }
      
      this.loading.set(false);
    }).catch((err) => {
      console.error('Failed to load project documents:', err);
      this.error.set(this.translateService.instant('projectReports.errors.failedToLoad'));
      this.loading.set(false);
    });
  }

  // ============================================================================
  // ✅ Load Official Contracts from /api/contracts
  // ============================================================================
  private loadOfficialContracts(projectId: number): void {
    this.officialContractsLoading.set(true);
    
    this.http.get<any>(
      `${environment.apiUrl}/contracts?project_id=${projectId}`,
      { headers: { Authorization: `Bearer ${this.auth.token()}` } }
    ).subscribe({
      next: (response) => {
        const contracts = response.data?.contracts || [];
        this.officialContracts.set(contracts);
        this.officialContractsLoading.set(false);
      },
      error: (err) => {
        console.error('Failed to load official contracts:', err);
        this.officialContractsLoading.set(false);
      }
    });
  }

  // ============================================================================
  // Fetch Methods - Individual Data Sources
  // ============================================================================

  // Fetch Inspection Reports
  private async fetchInspectionReports(projectId: number): Promise<ProjectDocument[]> {
    try {
      // First get project to find lead_id
      const projectResponse: any = await this.http.get(
        `${environment.apiUrl}/projects/${projectId}`,
        { headers: { Authorization: `Bearer ${this.auth.token()}` } }
      ).toPromise();

      const project = projectResponse.data?.project;
      if (!project?.lead_id) return [];

      // Fetch inspection reports for this lead
      const reportsResponse: any = await this.http.get(
        `${environment.apiUrl}/leads/${project.lead_id}/reports`,
        { headers: { Authorization: `Bearer ${this.auth.token()}` } }
      ).toPromise();

      const reports = reportsResponse.data?.reports || [];
      
      return reports.map((report: any) => {
        const docs: ProjectDocument[] = [];
        
        // Add main file if exists (file_url column)
        if (report.file_url) {
          const fileExt = report.file_url.split('.').pop().toLowerCase();
          const fileType = ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(fileExt) ? 'image' : 'pdf';
          
          docs.push({
            id: `inspection_${report.id}`,
            file_name: `${this.translateService.instant('projectReports.document.inspectionReport')} #${report.id}`,
            file_path: report.file_url, // Backend stores relative path: /uploads/reports/...
            file_type: fileType,
            category: 'technical',
            category_label: this.translateService.instant('projectReports.document.inspectionReport'),
            upload_date: report.created_at,
            uploader_name: report.uploader_name || report.user_name || this.translateService.instant('projectReports.document.system'),
            description: report.report_text || report.summary || `${this.translateService.instant('projectReports.document.status')}: ${report.status}`
          });
        }

        // Add images from images_urls array
        if (report.images_urls && Array.isArray(report.images_urls)) {
          report.images_urls.forEach((imageUrl: string, index: number) => {
            docs.push({
              id: `inspection_photo_${report.id}_${index}`,
              file_name: `${this.translateService.instant('projectReports.document.inspectionPhoto')} #${report.id} - ${index + 1}`,
              file_path: imageUrl, // Backend stores relative path
              file_type: 'image',
              category: 'technical',
              category_label: this.translateService.instant('projectReports.document.inspectionPhoto'),
              upload_date: report.created_at,
              uploader_name: report.uploader_name || report.user_name || this.translateService.instant('projectReports.document.system'),
              description: `${this.translateService.instant('projectReports.document.inspectionPhoto')} ${this.translateService.instant('projectReports.document.inspectionReport')} #${report.id}`
            });
          });
        }

        return docs;
      }).flat();
    } catch (error) {
      console.error('Failed to fetch inspection reports:', error);
      return [];
    }
  }

  // Fetch Quotations
  private async fetchQuotations(projectId: number): Promise<ProjectDocument[]> {
    try {
      // First get project to find quotation_id
      const response: any = await this.http.get(
        `${environment.apiUrl}/projects/${projectId}`,
        { headers: { Authorization: `Bearer ${this.auth.token()}` } }
      ).toPromise();

      const project = response.data?.project;
      if (!project?.quotation_id) return [];

      // Fetch quotation details
      const quotationResponse: any = await this.http.get(
        `${environment.apiUrl}/quotations/${project.quotation_id}`,
        { headers: { Authorization: `Bearer ${this.auth.token()}` } }
      ).toPromise();

      const quotation = quotationResponse.data?.quotation;
      if (!quotation) return [];

      // ✅ Use file_url from database (stores actual uploaded file path)
      // Pattern: /uploads/reports/report-{timestamp}-{random}-{originalname}.{ext}
      const filePath = quotation.file_url || `/uploads/reports/quotation-${quotation.id}.pdf`;

      return [{
        id: `quotation_${quotation.id}`,
        file_name: `${this.translateService.instant('projectReports.document.quotation')} #${quotation.id}`,
        file_path: filePath, // ✅ Uses actual file_url from database
        file_type: 'pdf',
        category: 'technical',
        category_label: this.translateService.instant('projectReports.document.quotation'),
        upload_date: quotation.created_at || quotation.approved_at,
        uploader_name: quotation.created_by_name || quotation.created_by_first_name || this.translateService.instant('projectReports.document.system'),
        description: quotation.status === 'approved' ? this.translateService.instant('projectReports.document.approved') : this.translateService.instant('projectReports.document.underReview')
      }];
    } catch (error) {
      console.error('Failed to fetch quotations:', error);
      return [];
    }
  }

  // Fetch Contracts
  private async fetchContracts(projectId: number): Promise<ProjectDocument[]> {
    try {
      const response: any = await this.http.get(
        `${environment.apiUrl}/contracts?project_id=${projectId}`,
        { headers: { Authorization: `Bearer ${this.auth.token()}` } }
      ).toPromise();

      const contracts = response.data?.contracts || [];
      
      return contracts.map((contract: any) => {
        const filePath = contract.attachment_url || contract.file_path || contract.contract_file;
        
        return {
          id: `contract_${contract.id}`,
          file_name: `${this.translateService.instant('projectReports.document.contract')} #${contract.contract_number || contract.id}`,
          file_path: filePath,
          file_type: 'pdf',
          category: 'contract',
          category_label: this.translateService.instant('projectReports.document.contract'),
          upload_date: contract.created_at || contract.signed_at,
          uploader_name: contract.created_by_name || this.translateService.instant('projectReports.document.system'),
          description: `${this.translateService.instant('projectReports.document.contractValue')}: ${contract.total_value?.toLocaleString() || 0} SAR - ${contract.status}`
        };
      });
    } catch (error) {
      console.error('Failed to fetch contracts:', error);
      return [];
    }
  }

  // Fetch Invoices
  private async fetchInvoices(projectId: number): Promise<ProjectDocument[]> {
    try {
      // CORRECT ENDPOINT: /api/finance/projects/:projectId/invoices
      const response: any = await this.http.get(
        `${environment.apiUrl}/finance/projects/${projectId}/invoices`,
        { headers: { Authorization: `Bearer ${this.auth.token()}` } }
      ).toPromise();

      const invoices = response.data?.invoices || [];
      
      return invoices.map((invoice: any) => ({
        id: `invoice_${invoice.id}`,
        file_name: `${this.translateService.instant('projectReports.document.invoice')} #${invoice.invoice_number || invoice.id} - ${invoice.invoice_type === 'sales' ? this.translateService.instant('projectReports.document.sales') : this.translateService.instant('projectReports.document.purchases')}`,
        file_path: invoice.file_path || invoice.pdf_path,
        file_type: 'pdf',
        category: 'financial',
        category_label: this.translateService.instant('projectReports.document.invoice'),
        upload_date: invoice.created_at || invoice.issue_date,
        uploader_name: invoice.created_by_name || this.translateService.instant('projectReports.document.system'),
        description: `${invoice.total_amount?.toLocaleString() || 0} SAR - ${invoice.status}`
      }));
    } catch (error) {
      console.error('Failed to fetch invoices:', error);
      return [];
    }
  }

  // ============================================================================
  // Filter by Category
  // ============================================================================
  filterByCategory(category: string): void {
    this.selectedCategory.set(category);
    
    if (category === 'all') {
      this.filteredDocuments.set(this.documents());
    } else {
      this.filteredDocuments.set(
        this.documents().filter(doc => doc.category === category)
      );
    }
  }

  // ============================================================================
  // File Actions - CORRECT URL CONSTRUCTION
  // ============================================================================
  viewDocument(doc: ProjectDocument): void {
    // Database stores: /uploads/reports/report-123.jpeg
    // Environment.apiUrl: http://localhost:3000/api
    // Final URL: http://localhost:3000/uploads/reports/report-123.jpeg
    
    let fullUrl: string;
    
    if (doc.file_path.startsWith('http')) {
      // Already absolute URL
      fullUrl = doc.file_path;
    } else {
      // Relative path - combine with backend base URL
      const baseUrl = environment.apiUrl.replace('/api', ''); // http://localhost:3000
      const path = doc.file_path.startsWith('/') ? doc.file_path : `/${doc.file_path}`;
      fullUrl = `${baseUrl}${path}`;
    }
    
    console.log('Viewing document:', fullUrl);
    window.open(fullUrl, '_blank');
  }

  downloadDocument(doc: ProjectDocument): void {
    // Same URL construction as viewDocument
    let fullUrl: string;
    
    if (doc.file_path.startsWith('http')) {
      fullUrl = doc.file_path;
    } else {
      const baseUrl = environment.apiUrl.replace('/api', '');
      const path = doc.file_path.startsWith('/') ? doc.file_path : `/${doc.file_path}`;
      fullUrl = `${baseUrl}${path}`;
    }
    
    console.log('Downloading document:', fullUrl);
    const link = document.createElement('a');
    link.href = fullUrl;
    link.download = doc.file_name;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  // ============================================================================
  // Helper Methods
  // ============================================================================
  getCategoryColor(category: string): string {
    const colors: Record<string, string> = {
      technical: 'bg-blue-100 text-blue-700 border-blue-200',
      financial: 'bg-green-100 text-green-700 border-green-200',
      contract: 'bg-purple-100 text-purple-700 border-purple-200',
      delivery: 'bg-orange-100 text-orange-700 border-orange-200'
    };
    return colors[category] || 'bg-gray-100 text-gray-700 border-gray-200';
  }

  getFileIcon(fileType: string): string {
    const icons: Record<string, string> = {
      pdf: '📄',
      image: '🖼️',
      jpg: '🖼️',
      jpeg: '🖼️',
      png: '🖼️',
      doc: '📝',
      docx: '📝',
      xls: '📊',
      xlsx: '📊'
    };
    return icons[fileType] || '📎';
  }

  goBack(): void {
    this.router.navigate(['/projects', this.projectId()]);
  }

  // ============================================================================
  // ✅ Official Contracts Helper Methods
  // ============================================================================
  
  /**
   * Get contract type label in Arabic
   */
  getContractTypeLabel(type: string): string {
    return this.translateService.instant(`projectReports.contractType.${type}`);
  }

  /**
   * Get contract status badge color
   */
  getContractStatusColor(status: string): string {
    const colors: Record<string, string> = {
      'active': 'bg-green-100 text-green-700 border-green-300',
      'pending_signature': 'bg-yellow-100 text-yellow-700 border-yellow-300',
      'expired': 'bg-red-100 text-red-700 border-red-300',
      'terminated': 'bg-gray-100 text-gray-700 border-gray-300',
      'completed': 'bg-blue-100 text-blue-700 border-blue-300'
    };
    return colors[status] || 'bg-gray-100 text-gray-700 border-gray-300';
  }

  /**
   * Get contract status label in Arabic
   */
  getContractStatusLabel(status: string): string {
    return this.translateService.instant(`projectReports.contractStatus.${status}`);
  }

  /**
   * View official contract PDF
   */
  viewContract(contract: OfficialContract): void {
    if (!contract.attachment_url) {
      this.toast.warning(this.translateService.instant('projectReports.errors.noAttachment'), 3000);
      return;
    }

    let fullUrl: string;
    
    if (contract.attachment_url.startsWith('http')) {
      fullUrl = contract.attachment_url;
    } else {
      const baseUrl = environment.apiUrl.replace('/api', '');
      const path = contract.attachment_url.startsWith('/') ? contract.attachment_url : `/${contract.attachment_url}`;
      fullUrl = `${baseUrl}${path}`;
    }
    
    console.log('Viewing contract:', fullUrl);
    window.open(fullUrl, '_blank');
  }

  /**
   * Download official contract PDF
   */
  downloadContract(contract: OfficialContract): void {
    if (!contract.attachment_url) {
      this.toast.warning(this.translateService.instant('projectReports.errors.noAttachment'), 3000);
      return;
    }

    let fullUrl: string;
    
    if (contract.attachment_url.startsWith('http')) {
      fullUrl = contract.attachment_url;
    } else {
      const baseUrl = environment.apiUrl.replace('/api', '');
      const path = contract.attachment_url.startsWith('/') ? contract.attachment_url : `/${contract.attachment_url}`;
      fullUrl = `${baseUrl}${path}`;
    }
    
    console.log('Downloading contract:', fullUrl);
    const link = document.createElement('a');
    link.href = fullUrl;
    link.download = `${this.translateService.instant('projectReports.document.contract')}-${contract.contract_number}.pdf`;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}
