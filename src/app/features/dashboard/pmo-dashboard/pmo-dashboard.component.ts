import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule, DatePipe, DecimalPipe, NgClass } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { FormsModule } from '@angular/forms';
import { environment } from '../../../../environments/environment.prod';
import { AuthStore } from '../../../core/auth/auth.store';
import { ToastService } from '../../../core/services/toast.service';

interface DashboardStats {
  total_active_projects: number;
  delayed_tasks: number;
  resource_utilization: number;
  awaiting_pm_assignment: number;
}

interface ProjectProgress {
  id: number;
  name: string;
  progress: number;
  status: string;
  department_name: string;
}

interface DelayedTask {
  id: number;
  title: string;
  project_name: string;
  due_date: string;
  assigned_to_name: string;
  days_overdue: number;
}

@Component({
  selector: 'app-pmo-dashboard',
  standalone: true,
  imports: [CommonModule, DecimalPipe, NgClass, TranslateModule, FormsModule],
  templateUrl: './pmo-dashboard.component.html',
  styleUrls: ['./pmo-dashboard.component.css']
})
export class PmoDashboardComponent implements OnInit {
  private http = inject(HttpClient);
  private auth = inject(AuthStore);
  private toast = inject(ToastService);
  private router = inject(Router);

  // State
  loading = signal(true);
  stats = signal<DashboardStats>({
    total_active_projects: 0,
    delayed_tasks: 0,
    resource_utilization: 0,
    awaiting_pm_assignment: 0
  });

  projectProgress = signal<ProjectProgress[]>([]);
  delayedTasks = signal<DelayedTask[]>([]);
  recentProjects = signal<any[]>([]);

  // Computed
  utilizationColor = computed(() => {
    const util = this.stats().resource_utilization;
    if (util >= 80) return 'text-red-600';
    if (util >= 60) return 'text-yellow-600';
    return 'text-green-600';
  });

  ngOnInit(): void {
    this.loadDashboard();
  }

  loadDashboard(): void {
    this.loading.set(true);
    
    // Load all stats in parallel
    Promise.all([
      this.loadStats(),
      this.loadProjectProgress(),
      this.loadDelayedTasks(),
      this.loadRecentProjects()
    ]).then(() => {
      this.loading.set(false);
    }).catch(err => {
      console.error('Failed to load PMO dashboard:', err);
      this.toast.error('فشل في تحميل لوحة التحكم');
      this.loading.set(false);
    });
  }

  private loadStats(): Promise<void> {
    return new Promise((resolve) => {
      this.http.get<{ status: string; data: DashboardStats }>(
        `${environment.apiUrl}/pmo/stats`,
        { headers: { Authorization: `Bearer ${this.auth.token()}` } }
      ).subscribe({
        next: (response) => {
          this.stats.set(response.data);
          resolve();
        },
        error: (err) => {
          console.error('Failed to load stats:', err);
          resolve(); // Resolve anyway to not block other loads
        }
      });
    });
  }

  private loadProjectProgress(): Promise<void> {
    return new Promise((resolve) => {
      this.http.get<{ status: string; data: ProjectProgress[] }>(
        `${environment.apiUrl}/pmo/projects/progress`,
        { headers: { Authorization: `Bearer ${this.auth.token()}` } }
      ).subscribe({
        next: (response) => {
          this.projectProgress.set(response.data);
          resolve();
        },
        error: (err) => {
          console.error('Failed to load project progress:', err);
          resolve();
        }
      });
    });
  }

  private loadDelayedTasks(): Promise<void> {
    return new Promise((resolve) => {
      this.http.get<{ status: string; data: DelayedTask[] }>(
        `${environment.apiUrl}/pmo/tasks/delayed`,
        { headers: { Authorization: `Bearer ${this.auth.token()}` } }
      ).subscribe({
        next: (response) => {
          this.delayedTasks.set(response.data);
          resolve();
        },
        error: (err) => {
          console.error('Failed to load delayed tasks:', err);
          resolve();
        }
      });
    });
  }

  private loadRecentProjects(): Promise<void> {
    return new Promise((resolve) => {
      this.http.get<{ status: string; data: any[] }>(
        `${environment.apiUrl}/pmo/projects/recent`,
        { headers: { Authorization: `Bearer ${this.auth.token()}` } }
      ).subscribe({
        next: (response) => {
          this.recentProjects.set(response.data);
          resolve();
        },
        error: (err) => {
          console.error('Failed to load recent projects:', err);
          resolve();
        }
      });
    });
  }

  getProgressColor(progress: number): string {
    if (progress >= 75) return 'bg-green-500';
    if (progress >= 50) return 'bg-blue-500';
    if (progress >= 25) return 'bg-yellow-500';
    return 'bg-red-500';
  }

  getStatusText(status: string): string {
    const texts: Record<string, string> = {
      'planning': 'قيد التخطيط',
      'in_progress': 'قيد التنفيذ',
      'completed': 'مكتمل',
      'on_hold': 'متوقف',
      'awaiting_pm_assignment': 'بانتظار تعيين مدير'
    };
    return texts[status] || status;
  }

  getStatusBadgeClass(status: string): string {
    const classes: Record<string, string> = {
      'planning': 'bg-blue-100 text-blue-800',
      'in_progress': 'bg-green-100 text-green-800',
      'completed': 'bg-gray-100 text-gray-800',
      'on_hold': 'bg-yellow-100 text-yellow-800',
      'awaiting_pm_assignment': 'bg-red-100 text-red-800'
    };
    return classes[status] || 'bg-gray-100 text-gray-800';
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  viewProjectDetails(projectId: number): void {
    this.router.navigate(['/projects', projectId]);
  }
}
