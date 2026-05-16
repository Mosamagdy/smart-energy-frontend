import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { DepartmentsService, Department, AssignManagerDto } from '../../../data/api/departments.service';
import { EmployeeService, Employee } from '../../../data/api/employee.service';
import { RolesService, Role } from '../../../data/api/roles.service';
import { FormsModule } from '@angular/forms';

// Department icons mapping
const DEPT_ICONS: Record<string, string> = {
  'sales': '💼',
  'finance': '💰',
  'hr': '👥',
  'operations': '⚙️',
  'it': '💻',
  'marketing': '📢',
  'technical': '🔧',
  'maintenance': '🛠️',
  'default': '🏢'
};

@Component({
  selector: 'app-department-details',
  standalone: true,
  imports: [CommonModule, DatePipe, TranslatePipe, FormsModule],
  templateUrl: './department-details.component.html',
  styleUrls: ['./department-details.component.css']
})
export class DepartmentDetailsComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private deptService = inject(DepartmentsService);
  private employeeService = inject(EmployeeService);
  private rolesService = inject(RolesService);
  private translate = inject(TranslateService);

  // Department data
  department = signal<Department | null>(null);
  employees = signal<Employee[]>([]);
  loading = signal(true);
  error = signal<string | null>(null);

  // Add employee modal
  showAddModal = signal(false);
  formFullName = signal('');
  formFullNameAr = signal('');
  formJobTitle = signal('');
  formHireDate = signal('');
  formBasicSalary = signal<number>(0);
  formNationalId = signal('');
  formNationality = signal('');
  formNotes = signal('');

  // Assign Manager modal
  showAssignManagerModal = signal(false);
  roles = signal<Role[]>([]);
  managerForm = signal<AssignManagerDto>({
    first_name: '',
    last_name: '',
    email: '',
    username: '',
    password: '',
    phone: '',
    role_id: 0
  });
  managerFormError = signal<string | null>(null);
  managerFormLoading = signal(false);

  // Edit Department modal
  showEditModal = signal(false);
  editFormName = signal('');
  editFormDescription = signal('');
  editFormIcon = signal('');
  editFormError = signal<string | null>(null);
  editFormLoading = signal(false);

  // Delete confirmation
  showDeleteConfirm = signal(false);
  deleteLoading = signal(false);
  deleteError = signal<string | null>(null);

  ngOnInit(): void {
    const deptId = this.route.snapshot.paramMap.get('id');
    if (deptId) {
      this.loadDepartment(+deptId);
    }
  }

  private loadDepartment(id: number): void {
    this.loading.set(true);

    this.deptService.getDepartmentById(id).subscribe({
      next: (response) => {
        this.department.set(response.data.department);
        this.loadEmployees(id);
      },
      error: (err) => {
        console.error('Failed to load department:', err);
        this.error.set(this.translate.instant('departments.failedToLoad'));
        this.loading.set(false);
      }
    });
  }

  private loadEmployees(departmentId: number): void {
    this.employeeService.getEmployeesByDepartment(departmentId).subscribe({
      next: (response) => {
        // API returns { data: { employees: Employee[], count: number } }
        this.employees.set(response.data.employees || []);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Failed to load employees:', err);
        this.loading.set(false);
      }
    });
  }

  getDeptIcon(): string {
    const dept = this.department();
    if (!dept) return DEPT_ICONS['default'];

    const name = dept.name.toLowerCase();
    for (const [key, icon] of Object.entries(DEPT_ICONS)) {
      if (name.includes(key)) return icon;
    }
    return DEPT_ICONS['default'];
  }

  getHeadName(): string | null {
    const dept = this.department();
    if (dept?.head_first_name && dept?.head_last_name) {
      return `${dept.head_first_name} ${dept.head_last_name}`;
    }
    return null;
  }

  getHeadRole(): string {
    const dept = this.department();
    if (dept?.head_role_name) {
      return dept.head_role_name
        .split('_')
        .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
    }
    return 'Manager';
  }

  openAddModal(): void {
    this.showAddModal.set(true);
  }

  closeAddModal(): void {
    this.showAddModal.set(false);
    this.clearForm();
  }

  clearForm(): void {
    this.formFullName.set('');
    this.formFullNameAr.set('');
    this.formJobTitle.set('');
    this.formHireDate.set('');
    this.formBasicSalary.set(0);
    this.formNationalId.set('');
    this.formNationality.set('');
    this.formNotes.set('');
  }

  submitEmployeeForm(): void {
    if (!this.formFullName() || !this.formHireDate() || !this.formBasicSalary()) {
      alert(this.translate.instant('departments.requiredFields'));
      return;
    }

    const dept = this.department();
    if (!dept) return;

    const data = {
      full_name: this.formFullName(),
      full_name_ar: this.formFullNameAr() || undefined,
      department: dept.name,
      job_title: this.formJobTitle() || undefined,
      hire_date: this.formHireDate(),
      basic_salary: this.formBasicSalary(),
      national_id: this.formNationalId() || undefined,
      nationality: this.formNationality() || undefined,
      notes: this.formNotes() || undefined,
    };

    this.employeeService.createEmployee(data).subscribe({
      next: () => {
        this.loadDepartment(dept.id);
        this.closeAddModal();
      },
      error: (err) => {
        console.error('Failed to create employee:', err);
        alert(this.translate.instant('departments.failedToAddEmployee'));
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/departments']);
  }

  goToEmployee(employeeId: number): void {
    this.router.navigate(['/employees', employeeId]);
  }

  // Edit Department Methods
  openEditModal(): void {
    const dept = this.department();
    if (!dept) return;

    this.editFormName.set(dept.name);
    this.editFormDescription.set(dept.description || '');
    this.editFormIcon.set(dept.icon || '');
    this.editFormError.set(null);
    this.showEditModal.set(true);
  }

  closeEditModal(): void {
    this.showEditModal.set(false);
    this.editFormError.set(null);
  }

  submitEditDepartment(): void {
    const dept = this.department();
    if (!dept) return;

    const name = this.editFormName().trim();
    if (!name) {
      this.editFormError.set(this.translate.instant('departments.departmentNameRequired'));
      return;
    }

    this.editFormLoading.set(true);
    this.editFormError.set(null);

    const updateData = {
      name: name,
      description: this.editFormDescription().trim() || undefined,
      icon: this.editFormIcon().trim() || undefined,
    };

    this.deptService.updateDepartment(dept.id, updateData).subscribe({
      next: () => {
        this.editFormLoading.set(false);
        this.closeEditModal();
        this.loadDepartment(dept.id);
      },
      error: (err: any) => {
        this.editFormLoading.set(false);
        console.error('Failed to update department:', err);
        const errorMsg = err.error?.message || this.translate.instant('departments.failedToUpdate');
        this.editFormError.set(errorMsg);
      }
    });
  }

  // Delete Department Methods
  openDeleteConfirm(): void {
    this.showDeleteConfirm.set(true);
    this.deleteError.set(null);
  }

  closeDeleteConfirm(): void {
    this.showDeleteConfirm.set(false);
    this.deleteError.set(null);
  }

  confirmDelete(): void {
    const dept = this.department();
    if (!dept) return;

    this.deleteLoading.set(true);
    this.deleteError.set(null);

    this.deptService.deleteDepartment(dept.id).subscribe({
      next: () => {
        this.deleteLoading.set(false);
        this.closeDeleteConfirm();
        this.router.navigate(['/departments']);
      },
      error: (err: any) => {
        this.deleteLoading.set(false);
        console.error('Failed to delete department:', err);
        const errorMsg = err.error?.message || this.translate.instant('departments.failedToDelete');
        this.deleteError.set(errorMsg);
      }
    });
  }

  // Assign Manager Methods
  openAssignManagerModal(): void {
    this.showAssignManagerModal.set(true);
    this.managerFormError.set(null);
    this.loadRoles();
  }

  closeAssignManagerModal(): void {
    this.showAssignManagerModal.set(false);
    this.managerForm.set({
      first_name: '',
      last_name: '',
      email: '',
      username: '',
      password: '',
      phone: '',
      role_id: 0
    });
    this.managerFormError.set(null);
  }

  private loadRoles(): void {
    this.rolesService.getAllRoles().subscribe({
      next: (response) => {
        this.roles.set(response.data.roles || []);
      },
      error: (err) => {
        console.error('Failed to load roles:', err);
      }
    });
  }

  submitAssignManager(): void {
    const form = this.managerForm();

    if (!form.first_name || !form.last_name || !form.email || !form.username || !form.password || !form.role_id) {
      this.managerFormError.set(this.translate.instant('departments.allFieldsRequired'));
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(form.email)) {
      this.managerFormError.set(this.translate.instant('departments.invalidEmail'));
      return;
    }

    const dept = this.department();
    if (!dept) return;

    this.managerFormLoading.set(true);
    this.managerFormError.set(null);

    this.deptService.assignManager(dept.id, form).subscribe({
      next: () => {
        this.managerFormLoading.set(false);
        this.closeAssignManagerModal();
        this.loadDepartment(dept.id);
      },
      error: (err: any) => {
        this.managerFormLoading.set(false);
        console.error('Failed to assign manager:', err);
        const errorMsg = err.error?.message || err.error?.error || this.translate.instant('departments.failedToAssignManager');
        this.managerFormError.set(errorMsg);
      }
    });
  }
}