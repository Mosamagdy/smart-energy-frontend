import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ClientPortalService, ClientProject } from '../../../data/api/client-portal.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-client-projects',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './client-projects.component.html',
  styleUrls: ['./client-projects.component.css']
})
export class ClientProjectsComponent implements OnInit {
  private clientService = inject(ClientPortalService);
  private router = inject(Router);
  private toast = inject(ToastService);

  projects = signal<ClientProject[]>([]);
  loading = signal(true);

  ngOnInit(): void {
    this.loadProjects();
  }

  loadProjects(): void {
    this.loading.set(true);
    this.clientService.getProjects().subscribe({
      next: (response) => {
        this.projects.set(response.data);
        this.loading.set(false);
      },
      error: (err) => {
        this.toast.error('فشل في تحميل المشاريع');
        this.loading.set(false);
      }
    });
  }

  viewProject(project: ClientProject): void {
    this.router.navigate(['/client/projects', project.id]);
  }

  getStatusBadgeClass(status: string): string {
    const classes: Record<string, string> = {
      'planning': 'bg-blue-100 text-blue-800',
      'in_progress': 'bg-yellow-100 text-yellow-800',
      'completed': 'bg-green-100 text-green-800',
      'on_hold': 'bg-gray-100 text-gray-800',
      'cancelled': 'bg-red-100 text-red-800'
    };
    return classes[status] || 'bg-gray-100 text-gray-800';
  }

  getStatusText(status: string): string {
    const texts: Record<string, string> = {
      'planning': 'قيد التخطيط',
      'in_progress': 'قيد التنفيذ',
      'completed': 'مكتمل',
      'on_hold': 'متوقف',
      'cancelled': 'ملغي'
    };
    return texts[status] || status;
  }

  getProgress(project: ClientProject): number {
    if (!project.tasks_count || project.tasks_count === 0) return 0;
    return Math.round((project.completed_tasks || 0) / project.tasks_count * 100);
  }

  formatPrice(price: number): string {
    return new Intl.NumberFormat('ar-EG', {
      style: 'currency',
      currency: 'EGP',
      minimumFractionDigits: 0
    }).format(price);
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }
}
