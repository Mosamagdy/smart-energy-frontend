import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule, DatePipe, DecimalPipe } from '@angular/common';
import { Router } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { ProjectsService, Project, CreateProjectDto } from '../../../data/api/projects.service';
import { DepartmentsService, Department } from '../../../data/api/departments.service';
import { AuthStore } from '../../../core/auth/auth.store';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-projects-list',
  standalone: true,
  imports: [CommonModule, DatePipe, DecimalPipe, TranslateModule, FormsModule],
  templateUrl: './projects-list.component.html',
  styleUrls: ['./projects-list.component.css']
})
export class ProjectsListComponent {
  private http = inject(HttpClient);
  private auth = inject(AuthStore);
  private router = inject(Router);
  private toast = inject(ToastService);
  public translateService = inject(TranslateService);
  private projectsService = inject(ProjectsService);
  private departmentsService = inject(DepartmentsService);

  // State
  projects = signal<Project[]>([]);
  loading = signal(true);
  error = signal<string | null>(null);
  userDepartmentName = signal<string | null>(null);

  // Filters
  filterStatus = signal('');
  filterDepartment = signal('');

  // Create Project Modal
  showCreateModal = signal(false);
  departments = signal<Department[]>([]);
  createForm = signal<CreateProjectDto>({
    name: '',
    description: '',
    budget: undefined,
    start_date: '',
    end_date: '',
    lead_id: undefined,
    department_id: undefined,
    status: 'planning'
  });
  createFormError = signal<string | null>(null);
  createFormLoading = signal(false);

  // Computed filtered projects
  filteredProjects = computed(() => {
    let result = this.projects();

    if (this.filterStatus()) {
      result = result.filter(p => p.status === this.filterStatus());
    }

    if (this.filterDepartment()) {
      result = result.filter(p => p.department_id === parseInt(this.filterDepartment()));
    }

    return result;
  });

  userDeptType = computed(() => this.auth.user()?.dept_type ?? null);

  roleAwareHeader = computed(() => {
    const deptType = this.userDeptType();
    const deptName = this.userDepartmentName();

    if (deptType === 'technical') {
      return `قسمي — ${deptName || 'الإدارة الفنية'}`;
    }

    if (deptType === 'administrative') {
      return 'جميع المشاريع';
    }

    return this.translateService.instant('projects.subtitle');
  });

  // Role check helpers
  canCreateProject(): boolean {
    const role = this.auth.role()?.toLowerCase();
    return role === 'super_admin' || role === 'general_manager' || role === 'dep_pr_manager';
  }

  // Stats
  stats = computed(() => {
    const all = this.projects();
    return {
      total: all.length,
      planning: all.filter(p => p.status === 'planning').length,
      inProgress: all.filter(p => p.status === 'in_progress').length,
      completed: all.filter(p => p.status === 'completed').length,
    };
  });

  ngOnInit(): void {
    void this.loadProjects();
    void this.loadUserDepartmentName();
  }

  private async loadProjects(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try {
      const response = await firstValueFrom(this.projectsService.getAllProjects());
      this.projects.set(response.data.projects || []);
    } catch (err: any) {
      console.error('Failed to load projects:', err);
      this.error.set(this.translateService.instant('projects.form.failedToLoad'));
    } finally {
      this.loading.set(false);
    }
  }

  private async loadUserDepartmentName(): Promise<void> {
    const user = this.auth.user();
    if (!user?.department_id) return;

    try {
      const response = await firstValueFrom(
        this.departmentsService.getDepartmentById(Number(user.department_id))
      );
      const dept = response.data.department;
      this.userDepartmentName.set(dept?.name_ar || dept?.name || null);
    } catch (e) {
      // Fallback: keep header default label
      this.userDepartmentName.set(null);
    }
  }

  // Status helpers
  getStatusColor(status: string): string {
    const colors: Record<string, string> = {
      planning: 'bg-blue-100 text-blue-700 border border-blue-200',
      in_progress: 'bg-yellow-100 text-yellow-700 border border-yellow-200',
      completed: 'bg-green-100 text-green-700 border border-green-200',
      on_hold: 'bg-orange-100 text-orange-700 border border-orange-200',
      cancelled: 'bg-red-100 text-red-700 border border-red-200',
    };
    return colors[status] || 'bg-gray-100 text-gray-700 border border-gray-200';
  }

  getStatusText(status: string): string {
    return this.translateService.instant('projects.status.' + status);
  }

  // Navigation
  goToProject(id: number): void {
    this.router.navigate(['/projects', id]);
  }

  // Filter helpers
  resetFilters(): void {
    this.filterStatus.set('');
    this.filterDepartment.set('');
  }

  // Create Project Methods
  openCreateModal(): void {
    this.showCreateModal.set(true);
    this.createFormError.set(null);
    this.loadDepartments();
  }

  closeCreateModal(): void {
    this.showCreateModal.set(false);
    this.createForm.set({
      name: '',
      description: '',
      budget: undefined,
      start_date: '',
      end_date: '',
      lead_id: undefined,
      department_id: undefined,
      status: 'planning'
    });
    this.createFormError.set(null);
  }

  private async loadDepartments(): Promise<void> {
    try {
      const response = await firstValueFrom(this.departmentsService.getAllDepartments());
      this.departments.set(response.data.departments || []);
    } catch (err: any) {
      console.error('Failed to load departments:', err);
    }
  }

  async submitCreateProject(): Promise<void> {
    const form = this.createForm();

    // Validate required fields
    if (!form.name || !form.name.trim()) {
      this.createFormError.set(this.translateService.instant('projects.form.nameRequired'));
      return;
    }

    if (!form.start_date) {
      this.createFormError.set(this.translateService.instant('projects.form.startDateRequired'));
      return;
    }

    this.createFormLoading.set(true);
    this.createFormError.set(null);

    try {
      const response = await firstValueFrom(this.projectsService.createProject(form));
      this.closeCreateModal();
      await this.loadProjects();
      await this.router.navigate(['/projects', response.data.project.id]);
    } catch (err: any) {
      console.error('Failed to create project:', err);
      const errorMsg = err.error?.message || this.translateService.instant('projects.form.failedToCreate');
      this.createFormError.set(errorMsg);
    } finally {
      this.createFormLoading.set(false);
    }
  }
}
