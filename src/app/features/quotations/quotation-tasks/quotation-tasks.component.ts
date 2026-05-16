import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { LeadsService, Lead } from '../../../data/api/leads.service';
import { ToastService } from '../../../core/services/toast.service';
import { TranslateModule } from '@ngx-translate/core';

interface LeadTask {
  id: number;
  client_name: string;
  service_type: string;
  status: string;
  priority: string;
  contact_phone: string;
  contact_email: string;
  location?: string;
  notes?: string;
  inspection_completed_at: string;
  assigned_engineer_name?: string;
  assigned_sales_rep_name?: string;
  days_since_inspection: number;
}

@Component({
  selector: 'app-quotation-tasks',
  standalone: true,
  imports: [CommonModule , TranslateModule  ],
  templateUrl: './quotation-tasks.component.html',
  styleUrls: ['./quotation-tasks.component.css']
})
export class QuotationTasksComponent implements OnInit {
  private leadsService = inject(LeadsService);
  private router = inject(Router);
  private toast = inject(ToastService);

  tasks = signal<LeadTask[]>([]);
  loading = signal(true);
  filterStatus = signal<string>('all');

  ngOnInit(): void {
    this.loadTasks();
  }

  loadTasks(): void {
    this.loading.set(true);
    
    // Get leads with inspection_completed status
    this.leadsService.getAllLeads({ status: 'inspection_completed' }).subscribe({
      next: (response) => {
        const leads = response.data?.leads || [];
        
        // Transform leads into tasks
        const transformedTasks: LeadTask[] = leads.map(lead => {
          const inspectionDate = lead.updated_at; // When status was updated to inspection_completed
          const daysSince = this.calculateDaysSince(inspectionDate);
          
          return {
            id: lead.id,
            client_name: lead.client_name,
            service_type: lead.service_type,
            status: lead.status,
            priority: lead.priority,
            contact_phone: lead.contact_phone,
            contact_email: lead.contact_email,
            location: lead.location,
            notes: lead.notes,
            inspection_completed_at: inspectionDate,
            assigned_engineer_name: lead.assigned_engineer_name,
            assigned_sales_rep_name: lead.assigned_sales_rep_name,
            days_since_inspection: daysSince
          };
        });

        this.tasks.set(transformedTasks);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Failed to load quotation tasks:', err);
        this.toast.error('فشل في تحميل مهام عروض الأسعار');
        this.loading.set(false);
      }
    });
  }

  calculateDaysSince(dateString: string): number {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    return Math.floor(diffTime / (1000 * 60 * 60 * 24));
  }

  getPriorityColor(priority: string): string {
    const colors: Record<string, string> = {
      'low': 'bg-gray-100 text-gray-700',
      'medium': 'bg-blue-100 text-blue-800',
      'high': 'bg-orange-100 text-orange-800',
      'urgent': 'bg-red-100 text-red-800'
    };
    return colors[priority] || 'bg-gray-100 text-gray-700';
  }

  getPriorityText(priority: string): string {
    const texts: Record<string, string> = {
      'low': 'منخفضة',
      'medium': 'متوسطة',
      'high': 'عالية',
      'urgent': 'عاجلة'
    };
    return texts[priority] || priority;
  }

  getUrgencyClass(days: number): string {
    if (days >= 7) return 'border-red-500 bg-red-50';
    if (days >= 3) return 'border-yellow-500 bg-yellow-50';
    return 'border-green-500 bg-white';
  }

  createQuotation(leadId: number): void {
    // Navigate to lead details where they can create quotation
    this.router.navigate(['/leads', leadId]);
  }

  viewLeadDetails(leadId: number): void {
    this.router.navigate(['/leads', leadId]);
  }

  refreshTasks(): void {
    this.loadTasks();
    this.toast.info('جاري تحديث المهام...');
  }
}
