import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { Router } from '@angular/router';
import { DepartmentsService, Department } from '../../../data/api/departments.service';
import { RolesService, Role } from '../../../data/api/roles.service';
import { AuthStore } from '../../../core/auth/auth.store';

const DEPT_ICONS: Record<string, string> = {
  'sales': '💼', 'finance': '💰', 'hr': '👥', 'operations': '⚙️',
  'it': '💻', 'marketing': '📢', 'technical': '🔧', 'maintenance': '🛠️',
  'default': '🏢'
};

@Component({
  selector: 'app-departments-list',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslatePipe],
  templateUrl: './departments-list.component.html',
  styleUrls: ['./departments-list.component.css']
})
export class DepartmentsListComponent implements OnInit {
  private deptService  = inject(DepartmentsService);
  private translate    = inject(TranslateService);
  private router       = inject(Router);
  protected auth       = inject(AuthStore);
  private rolesService = inject(RolesService);

  departments  = signal<Department[]>([]);
  loading      = signal(true);
  error        = signal<string | null>(null);
  showAddModal = signal(false);

  // ── Toggle confirmation dialog ──────────────────────────────────────────────
  showConfirmDialog  = signal(false);
  confirmDept        = signal<Department | null>(null);   // which dept is pending toggle
  confirmLoading     = signal(false);

  // ── Add-department form ─────────────────────────────────────────────────────
  creationMode     = signal<'simple' | 'with-manager'>('simple');
  formDeptType     = signal<'administrative' | 'technical'>('administrative');
  formName         = signal('');
  formDescription  = signal('');
  formFirstName    = signal('');
  formLastName     = signal('');
  formEmail        = signal('');
  formUsername     = signal('');
  formPassword     = signal('');
  formPhone        = signal('');
  formRoleId       = signal<number | null>(null);
  roles            = signal<Role[]>([]);
  rolesLoading     = signal(false);

  ngOnInit(): void {
    this.loadDepartments();
    this.loadRoles();
  }

  private loadRoles(): void {
    this.rolesLoading.set(true);
    this.rolesService.getAllRoles().subscribe({
      next: r  => { this.roles.set(r.data.roles || []); this.rolesLoading.set(false); },
      error: () => this.rolesLoading.set(false)
    });
  }

  private loadDepartments(): void {
    this.loading.set(true);
    this.error.set(null);
    this.deptService.getAllDepartments().subscribe({
      next:  r   => { this.departments.set(r.data.departments || []); this.loading.set(false); },
      error: err => { console.error(err); this.error.set(this.translate.instant('departments.failedToLoadDepartments')); this.loading.set(false); }
    });
  }

  // ── Toggle flow ─────────────────────────────────────────────────────────────

  /** Called when user clicks the toggle — open confirmation dialog */
  requestToggle(dept: Department): void {
    this.confirmDept.set(dept);
    this.showConfirmDialog.set(true);
  }

  /** User confirmed — execute the toggle */
  confirmToggle(): void {
    const dept = this.confirmDept();
    if (!dept) return;

    this.confirmLoading.set(true);

    this.deptService.toggleDepartmentAuto(dept.id).subscribe({
      next: () => {
        // Update local state immediately
        this.departments.update(list =>
          list.map(d => d.id === dept.id ? { ...d, is_active: !d.is_active } : d)
        );
        this.confirmLoading.set(false);
        this.showConfirmDialog.set(false);
        this.confirmDept.set(null);
      },
      error: err => {
        console.error('Toggle failed:', err);
        this.confirmLoading.set(false);
        this.showConfirmDialog.set(false);
        this.confirmDept.set(null);
        this.error.set(err?.error?.message || this.translate.instant('departments.toggleFailed'));
      }
    });
  }

  /** User cancelled */
  cancelToggle(): void {
    this.showConfirmDialog.set(false);
    this.confirmDept.set(null);
  }

  // ── Add form ────────────────────────────────────────────────────────────────

  openAddModal(): void  { this.showAddModal.set(true); }
  closeAddModal(): void { this.showAddModal.set(false); this.clearForm(); }

  clearForm(): void {
    this.formDeptType.set('administrative'); this.formName.set('');
    this.formDescription.set(''); this.formFirstName.set('');
    this.formLastName.set(''); this.formEmail.set('');
    this.formUsername.set(''); this.formPassword.set('');
    this.formPhone.set(''); this.formRoleId.set(null);
    this.creationMode.set('simple');
  }

  submitForm(): void {
    if (!this.formName()) { alert(this.translate.instant('departments.departmentNameRequired')); return; }

    if (this.creationMode() === 'simple') {
      this.deptService.createDepartmentSimple({
        name: this.formName(),
        description: this.formDescription() || undefined,
        dept_type: this.formDeptType(),
      }).subscribe({
        next:  () => { this.loadDepartments(); this.closeAddModal(); },
        error: err => { console.error(err); alert(this.translate.instant('departments.failedToCreate')); }
      });
    } else {
      if (!this.formFirstName() || !this.formLastName() || !this.formEmail() ||
          !this.formUsername() || !this.formPassword()) {
        alert(this.translate.instant('departments.managerFieldsRequired')); return;
      }
      this.deptService.createDepartment({
        name: this.formName(),
        description: this.formDescription() || undefined,
        dept_type: this.formDeptType(),
        head_first_name: this.formFirstName(),
        head_last_name:  this.formLastName(),
        head_email:      this.formEmail(),
        head_username:   this.formUsername(),
        head_password:   this.formPassword(),
        head_phone:      this.formPhone() || undefined,
      }).subscribe({
        next:  () => { this.loadDepartments(); this.closeAddModal(); },
        error: err => { console.error(err); alert(this.translate.instant('departments.failedToCreateWithManager')); }
      });
    }
  }

  // ── Helpers ─────────────────────────────────────────────────────────────────

  goToDepartment(id: number): void { this.router.navigate(['/departments', id]); }

  getDeptIcon(dept: Department): string {
    const name = dept.name.toLowerCase();
    for (const [key, icon] of Object.entries(DEPT_ICONS)) {
      if (name.includes(key)) return icon;
    }
    return DEPT_ICONS['default'];
  }

  getHeadName(dept: Department): string | null {
    return dept.head_first_name && dept.head_last_name
      ? `${dept.head_first_name} ${dept.head_last_name}` : null;
  }

  getHeadRole(dept: Department): string {
    return dept.head_role_name
      ? dept.head_role_name.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
      : 'Manager';
  }

  canManageDepts(): boolean {
    const r = this.auth.role();
    return r === 'super_admin' || r === 'general_manager';
  }
}