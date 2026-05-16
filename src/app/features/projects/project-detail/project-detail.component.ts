import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule, DatePipe, DecimalPipe } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpParams } from '@angular/common/http';
import { ProjectsService, Project } from '../../../data/api/projects.service';
import { TasksService, Task, CreateTaskDto } from '../../../data/api/tasks.service';
import { AuthStore } from '../../../core/auth/auth.store';
import { ToastService } from '../../../core/services/toast.service';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-project-detail',
  standalone: true,
  imports: [CommonModule, DatePipe, DecimalPipe, TranslateModule, FormsModule],
  templateUrl: './project-detail.component.html',
  styleUrls: ['./project-detail.component.css']
})
export class ProjectDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private http = inject(HttpClient);
  public auth = inject(AuthStore);
  private toast = inject(ToastService);
  public translateService = inject(TranslateService);
  private projectsService = inject(ProjectsService);
  private tasksService = inject(TasksService);

  project = signal<Project | null>(null);
  loading = signal(true);
  error = signal<string | null>(null);
  activeTab = signal<'overview' | 'tasks' | 'team' | 'materials'>('overview');
  tasks = signal<Task[]>([]);
  tasksLoading = signal(false);
  teamMembers = signal<any[]>([]);
  teamLoading = signal(false);
  materials = signal<any[]>([]);
  materialsLoading = signal(false);
  totalMaterialCost = signal<number>(0);
  showCreateTaskModal = signal(false);
  createTaskForm = signal<CreateTaskDto>({ title: '', description: '', priority: 'medium', status: 'pending', due_date: '' });
  createTaskError = signal<string | null>(null);
  createTaskLoading = signal(false);
  availableEngineers = signal<any[]>([]);
  engineersLoading = signal(false);
  showAssignManagerModal = signal(false);
  availableManagers = signal<any[]>([]);
  managersLoading = signal(false);
  selectedManagerId = signal<number | null>(null);
  assignManagerError = signal<string | null>(null);
  assignManagerLoading = signal(false);
  showAddMemberModal = signal(false);
  availableTeamMembers = signal<any[]>([]);
  teamMembersLoading = signal(false);
  selectedTeamMemberIds = signal<number[]>([]);
  memberRoleInProject = signal<string>('member');
  addMemberError = signal<string | null>(null);
  addMemberLoading = signal(false);
  showAllocateMaterialsModal = signal(false);
  warehouses = signal<any[]>([]);
  selectedWarehouseId = signal<string>('');
  availableInventoryItems = signal<any[]>([]);
  inventoryCategories = signal<string[]>([]);
  selectedCategory = signal<string>('');
  filteredInventoryItems = signal<any[]>([]);
  inventoryLoading = signal(false);
  materialAllocations = signal<Array<{item_id: number, quantity: number, unit?: string, unit_price?: number, line_total?: number}>>([]);
  allocateMaterialsError = signal<any>(null);
  allocateMaterialsLoading = signal(false);
  grandTotal = signal<number>(0);
  showPurchaseRequestModal = signal(false);
  purchaseRequestForm = signal<any>({ item_id: 0, item_name: '', item_code: '', unit_of_measure: 'pcs', quantity: 0, unit_price: 0, priority: 'normal', notes: '' });
  purchaseRequestLoading = signal(false);
  purchaseRequestError = signal<string | null>(null);
  selectedContractFile: File | null = null;
  contractUploadLoading = signal(false);
  contractUploadError = signal<string | null>(null);
  contractUploadSuccess = signal<string | null>(null);

  ngOnInit(): void {
    const projectId = this.route.snapshot.paramMap.get('id');
    if (projectId) this.loadProject(+projectId);
  }

  // ============================================================================
  // Role-Based Access Control Helpers
  // ============================================================================

  hasRole(role: string): boolean {
    return (this.auth.role() || '').toLowerCase() === role.toLowerCase();
  }

  isDeptHead(): boolean {
    return this.hasRole('dept_head');
  }

  isEngineer(): boolean {
    return this.hasRole('engineer');
  }

  isProjectManager(): boolean {
    return this.hasRole('project_manager');
  }

  isAdmin(): boolean {
    return this.hasRole('super_admin') || this.hasRole('general_manager');
  }

  isDepPrManager(): boolean {
    return this.hasRole('dep_pr_manager');
  }

  isSalesManager(): boolean {
    return this.hasRole('sales_manager');
  }

  isTechHead(): boolean {
    return this.hasRole('tech_head');
  }

  /**
   * READ-ONLY: roles that cannot do ANY mutating action
   */
  isProjectReadOnly(): boolean {
    const role = (this.auth.role() || '').toLowerCase();
    return role === 'sales_manager' || role === 'finance_manager' || role === 'tech_head';
  }

  /**
   * Can perform all actions: add task, add member, allocate materials, update task status
   * Blocked for: read-only roles, dept_head, engineer, dep_pr_manager, contract_dept_head
   */
  canPerformActions(): boolean {
    return (
      !this.isProjectReadOnly() &&
      !this.isDeptHead() &&
      !this.isEngineer() &&
      !this.isDepPrManager() &&
      this.auth.role() !== 'contract_dept_head'
    );
  }

  /**
   * Can this user see the assign/change manager button?
   * Only dep_pr_manager + super_admin + general_manager
   */
  canAssignManager(): boolean {
    const role = (this.auth.role() || '').toLowerCase();
    return role === 'dep_pr_manager' || role === 'super_admin' || role === 'general_manager';
  }

  getCurrentUserId(): number | string | null {
    return this.auth.user()?.id || null;
  }

  // ============================================================================
  // Data Loading
  // ============================================================================

  private loadProject(id: number): void {
    this.loading.set(true);
    this.error.set(null);
    this.projectsService.getProjectById(id).subscribe({
      next: (response) => {
        this.project.set(response.data.project);
        this.loading.set(false);
        this.loadTasks(id);
        this.loadTeam(id);
        this.loadMaterials(id);
      },
      error: (err: any) => {
        console.error('Failed to load project:', err);
        this.error.set(this.translateService.instant('projects.details.failedToLoad'));
        this.loading.set(false);
      }
    });
  }

  private loadTasks(projectId: number): void {
    this.tasksLoading.set(true);
    this.tasksService.getProjectTasks(projectId).subscribe({
      next: (response) => { this.tasks.set(response.data.tasks); this.tasksLoading.set(false); },
      error: () => this.tasksLoading.set(false)
    });
  }

  private loadTeam(projectId: number): void {
    this.teamLoading.set(true);
    this.projectsService.getProjectEmployees(projectId).subscribe({
      next: (response) => { this.teamMembers.set(response.data.employees); this.teamLoading.set(false); },
      error: () => this.teamLoading.set(false)
    });
  }

  private loadMaterials(projectId: number): void {
    this.materialsLoading.set(true);
    this.projectsService.getProjectMaterials(projectId).subscribe({
      next: (response) => {
        this.materials.set(response.data.materials);
        this.materialsLoading.set(false);
        this.calculateMaterialCost();
      },
      error: () => this.materialsLoading.set(false)
    });
  }

  private calculateMaterialCost(): void {
    const total = this.materials().reduce((sum, m) => sum + (m.unit_cost ? m.quantity * m.unit_cost : 0), 0);
    this.totalMaterialCost.set(total);
  }

  setActiveTab(tab: 'overview' | 'tasks' | 'team' | 'materials'): void {
    this.activeTab.set(tab);
  }

  // ============================================================================
  // Status / Priority Helpers
  // ============================================================================

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
    const map: Record<string, string> = {
      planning: this.translateService.instant('projects.status.planning'),
      in_progress: this.translateService.instant('projects.status.in_progress'),
      completed: this.translateService.instant('projects.status.completed'),
      on_hold: this.translateService.instant('projects.status.on_hold'),
      cancelled: this.translateService.instant('projects.status.cancelled'),
    };
    return map[status] || status;
  }

  getTaskStatusColor(status: string): string {
    const colors: Record<string, string> = {
      pending: 'bg-gray-100 text-gray-700 border border-gray-200',
      in_progress: 'bg-blue-100 text-blue-700 border border-blue-200',
      completed: 'bg-green-100 text-green-700 border border-green-200',
      cancelled: 'bg-red-100 text-red-700 border border-red-200',
      on_hold: 'bg-orange-100 text-orange-700 border border-orange-200',
    };
    return colors[status] || 'bg-gray-100 text-gray-700 border border-gray-200';
  }

  getTaskStatusText(status: string): string {
    const map: Record<string, string> = {
      pending: this.translateService.instant('projects.details.tasks.status.pending'),
      in_progress: this.translateService.instant('projects.details.tasks.status.in_progress'),
      completed: this.translateService.instant('projects.details.tasks.status.completed'),
      cancelled: this.translateService.instant('projects.details.tasks.status.cancelled'),
      on_hold: this.translateService.instant('projects.details.tasks.status.on_hold'),
    };
    return map[status] || status;
  }

  getPriorityColor(priority: string): string {
    const colors: Record<string, string> = { low: 'text-green-600', medium: 'text-yellow-600', high: 'text-orange-600', urgent: 'text-red-600' };
    return colors[priority] || 'text-gray-600';
  }

  getPriorityText(priority: string): string {
    const map: Record<string, string> = {
      low: this.translateService.instant('projects.details.tasks.priority.low'),
      medium: this.translateService.instant('projects.details.tasks.priority.medium'),
      high: this.translateService.instant('projects.details.tasks.priority.high'),
      urgent: this.translateService.instant('projects.details.tasks.priority.urgent'),
    };
    return map[priority] || priority;
  }

  // ============================================================================
  // Navigation
  // ============================================================================

  goBack(): void { this.router.navigate(['/projects']); }

  viewProjectReports(): void {
    const id = this.project()?.id;
    if (id) this.router.navigate(['/projects', id, 'reports']);
  }

  // ============================================================================
  // Tasks
  // ============================================================================

  openCreateTaskModal(): void {
    this.showCreateTaskModal.set(true);
    this.createTaskError.set(null);
    this.createTaskForm.set({ title: '', description: '', priority: 'medium', status: 'pending', due_date: '', assigned_to: undefined });
    this.loadDepartmentEngineers();
  }

  loadDepartmentEngineers(): void {
    const project = this.project();
    if (!project?.department_id) return;
    this.engineersLoading.set(true);
    this.http.get<{ status: string; data: { users: any[] } }>(
      `${environment.apiUrl}/users/by-department/${project.department_id}/role/engineer`,
      { headers: { Authorization: `Bearer ${this.auth.token()}` } }
    ).subscribe({
      next: (r) => { this.availableEngineers.set(r.data.users); this.engineersLoading.set(false); },
      error: () => this.engineersLoading.set(false)
    });
  }

  closeCreateTaskModal(): void { this.showCreateTaskModal.set(false); this.createTaskError.set(null); }

  submitCreateTask(): void {
    const projectId = this.project()?.id;
    if (!projectId) return;
    const form = this.createTaskForm();
    if (!form.title?.trim()) { this.createTaskError.set(this.translateService.instant('projects.details.tasks.titleRequired')); return; }
    this.createTaskLoading.set(true);
    this.createTaskError.set(null);
    this.tasksService.createTask(projectId, form).subscribe({
      next: () => { this.createTaskLoading.set(false); this.closeCreateTaskModal(); this.loadTasks(projectId); },
      error: (err: any) => {
        this.createTaskLoading.set(false);
        this.createTaskError.set(err.error?.message || this.translateService.instant('projects.details.tasks.failedToCreate'));
      }
    });
  }

  updateTaskStatus(taskId: number, newStatus: string): void {
    const projectId = this.project()?.id;
    if (!projectId) return;
    this.tasksService.updateTaskStatus(projectId, taskId, { status: newStatus as any }).subscribe({
      next: () => this.loadTasks(projectId),
      error: (err: any) => console.error('Failed to update task status:', err)
    });
  }

  // ============================================================================
  // Assign Manager
  // ============================================================================

  openAssignManagerModal(): void {
    this.showAssignManagerModal.set(true);
    this.assignManagerError.set(null);
    this.selectedManagerId.set(null);
    this.loadManagersByDepartment();
  }

  closeAssignManagerModal(): void {
    this.showAssignManagerModal.set(false);
    this.assignManagerError.set(null);
    this.selectedManagerId.set(null);
  }

  loadManagersByDepartment(): void {
    const project = this.project();
    if (!project?.department_id) return;
    this.managersLoading.set(true);
    this.projectsService.getManagersByDepartment(project.department_id).subscribe({
      next: (r) => { this.availableManagers.set(r.data.managers); this.managersLoading.set(false); },
      error: () => { this.managersLoading.set(false); this.assignManagerError.set(this.translateService.instant('projects.details.team.failedToLoadManagers')); }
    });
  }

  submitAssignManager(): void {
    const projectId = this.project()?.id;
    const managerId = this.selectedManagerId();
    if (!projectId || !managerId) { this.assignManagerError.set(this.translateService.instant('projects.details.team.pleaseSelectManager')); return; }
    this.assignManagerLoading.set(true);
    this.assignManagerError.set(null);
    this.projectsService.assignManager(projectId, { manager_user_id: managerId }).subscribe({
      next: () => { this.assignManagerLoading.set(false); this.closeAssignManagerModal(); this.loadProject(projectId); },
      error: (err: any) => {
        this.assignManagerLoading.set(false);
        this.assignManagerError.set(err.error?.message || this.translateService.instant('projects.details.team.failedToAssignManager'));
      }
    });
  }

  // ============================================================================
  // Add Team Members
  // ============================================================================

  openAddMemberModal(): void {
    this.showAddMemberModal.set(true);
    this.addMemberError.set(null);
    this.selectedTeamMemberIds.set([]);
    this.memberRoleInProject.set('member');
    this.loadAvailableTeamMembers();
  }

  closeAddMemberModal(): void { this.showAddMemberModal.set(false); this.addMemberError.set(null); this.selectedTeamMemberIds.set([]); }

  loadAvailableTeamMembers(): void {
    const project = this.project();
    if (!project?.department_id) return;
    this.teamMembersLoading.set(true);
    this.http.get<{ status: string; data: { employees: any[] } }>(
      `${environment.apiUrl}/departments/${project.department_id}/employees`,
      { headers: { Authorization: `Bearer ${this.auth.token()}` } }
    ).subscribe({
      next: (r) => { this.availableTeamMembers.set(r.data.employees); this.teamMembersLoading.set(false); },
      error: () => { this.teamMembersLoading.set(false); this.addMemberError.set(this.translateService.instant('projects.details.team.failedToLoadMembers')); }
    });
  }

  toggleTeamMemberSelection(id: number): void {
    const selected = this.selectedTeamMemberIds();
    const idx = selected.indexOf(id);
    idx > -1 ? selected.splice(idx, 1) : selected.push(id);
    this.selectedTeamMemberIds.set([...selected]);
  }

  isTeamMemberSelected(id: number): boolean { return this.selectedTeamMemberIds().includes(id); }

  submitAddMembers(): void {
    const projectId = this.project()?.id;
    const ids = this.selectedTeamMemberIds();
    if (!projectId || ids.length === 0) { this.addMemberError.set(this.translateService.instant('projects.details.team.pleaseSelectMember')); return; }
    this.addMemberLoading.set(true);
    this.addMemberError.set(null);
    this.projectsService.assignEmployees(projectId, ids, this.memberRoleInProject()).subscribe({
      next: () => { this.addMemberLoading.set(false); this.closeAddMemberModal(); this.loadTeam(projectId); },
      error: (err: any) => { this.addMemberLoading.set(false); this.addMemberError.set(err.error?.message || this.translateService.instant('projects.details.team.failedToAddMembers')); }
    });
  }

  // ============================================================================
  // Allocate Materials
  // ============================================================================

  openAllocateMaterialsModal(): void {
    this.showAllocateMaterialsModal.set(true);
    this.allocateMaterialsError.set(null);
    this.materialAllocations.set([]);
    this.selectedCategory.set('');
    this.grandTotal.set(0);
    this.loadInventoryItems();
  }

  closeAllocateMaterialsModal(): void {
    this.showAllocateMaterialsModal.set(false);
    this.allocateMaterialsError.set(null);
    this.materialAllocations.set([]);
    this.selectedCategory.set('');
    this.grandTotal.set(0);
  }

  loadInventoryItems(): void {
    this.inventoryLoading.set(true);
    this.loadWarehouses();
    this.loadInventoryCategories();
    this.availableInventoryItems.set([]);
    this.filteredInventoryItems.set([]);
    this.inventoryLoading.set(false);
  }

  loadWarehouses(): void {
    this.http.get<{ status: string; data: any[] }>(
      `${environment.apiUrl}/warehouses`,
      { headers: { Authorization: `Bearer ${this.auth.token()}` } }
    ).subscribe({
      next: (r) => this.warehouses.set(r.data || []),
      error: () => this.warehouses.set([])
    });
  }

  onWarehouseChange(warehouseId: string): void {
    this.selectedWarehouseId.set(warehouseId);
    this.materialAllocations.set([]);
    this.selectedCategory.set('');
    this.grandTotal.set(0);
    this.allocateMaterialsError.set(null);
    if (!warehouseId) { this.availableInventoryItems.set([]); this.filteredInventoryItems.set([]); return; }
    this.loadItemsForWarehouse(parseInt(warehouseId));
  }

  loadItemsForWarehouse(warehouseId: number): void {
    this.inventoryLoading.set(true);
    this.http.get<{ status: string; data: any[] }>(
      `${environment.apiUrl}/inventory/by-warehouse/${warehouseId}`,
      { headers: { Authorization: `Bearer ${this.auth.token()}` }, params: new HttpParams().set('is_active', 'true') }
    ).subscribe({
      next: (r) => {
        this.availableInventoryItems.set(r.data || []);
        this.filteredInventoryItems.set(r.data || []);
        this.inventoryLoading.set(false);
        if (!r.data?.length) this.allocateMaterialsError.set(this.translateService.instant('projects.details.materials.noMaterialsAvailable'));
      },
      error: () => {
        this.inventoryLoading.set(false);
        this.allocateMaterialsError.set(this.translateService.instant('projects.details.materials.failedToLoadStock'));
        this.availableInventoryItems.set([]); this.filteredInventoryItems.set([]);
      }
    });
  }

  onCategoryChange(category: string): void {
    this.selectedCategory.set(category);
    const all = this.availableInventoryItems();
    this.filteredInventoryItems.set(category ? all.filter(i => i.category === category) : all);
  }

  addMaterialAllocation(): void {
    this.materialAllocations.set([...this.materialAllocations(), { item_id: 0, quantity: 1, unit: '', unit_price: 0, line_total: 0 }]);
  }

  removeMaterialAllocation(index: number): void {
    const a = this.materialAllocations();
    a.splice(index, 1);
    this.materialAllocations.set([...a]);
    this.calculateGrandTotal();
  }

  updateMaterialAllocation(index: number, field: string, value: any): void {
    const a = this.materialAllocations();
    a[index] = { ...a[index], [field]: value };
    if (field === 'item_id' && value > 0) {
      const item = this.filteredInventoryItems().find(i => i.id === value);
      if (item) {
        a[index].unit_price = item.unit_cost || 0;
        a[index].unit = item.unit_of_measure || item.unit || '';
        a[index].line_total = (a[index].quantity || 0) * (a[index].unit_price || 0);
      }
    }
    if (field === 'quantity') {
      a[index].line_total = a[index].quantity * (a[index].unit_price || 0);
    }
    this.materialAllocations.set([...a]);
    this.calculateGrandTotal();
  }

  calculateGrandTotal(): void {
    this.grandTotal.set(this.materialAllocations().reduce((s, a) => s + (a.line_total || 0), 0));
  }

  isStockInsufficient(itemId: number, qty: number): boolean {
    const item = this.availableInventoryItems().find(i => i.id === itemId);
    return item ? (parseFloat(item.quantity_on_hand) || 0) < qty : false;
  }

  getAvailableStock(itemId: number): number {
    const item = this.availableInventoryItems().find(i => i.id === itemId);
    return parseFloat(item?.quantity_on_hand) || 0;
  }

  isStockAvailable(itemId: number): boolean {
    const item = this.availableInventoryItems().find(i => i.id === itemId);
    return item ? (parseFloat(item.quantity_on_hand) || 0) > 0 : false;
  }

  getWarehouseName(): string {
    const wId = this.selectedWarehouseId();
    if (!wId) return '';
    const w = this.warehouses().find(w => w.id === parseInt(wId));
    return w?.warehouse_name_ar || w?.warehouse_name || '';
  }

  submitAllocateMaterials(): void {
    const projectId = this.project()?.id;
    const allocations = this.materialAllocations();
    const warehouseId = this.selectedWarehouseId();
    if (!projectId || !allocations.length) { this.allocateMaterialsError.set(this.translateService.instant('projects.details.materials.pleaseAddMaterial')); return; }
    if (!warehouseId) { this.allocateMaterialsError.set(this.translateService.instant('projects.details.materials.pleaseSelectWarehouse')); return; }
    if (!allocations.every(a => a.item_id > 0 && a.quantity > 0)) { this.allocateMaterialsError.set(this.translateService.instant('projects.details.materials.pleaseFillRequiredFields')); return; }
    this.allocateMaterialsLoading.set(true);
    this.allocateMaterialsError.set(null);
    this.projectsService.allocateMaterials(projectId, allocations.map(a => ({ item_id: Number(a.item_id), quantity: Number(a.quantity), unit: a.unit || '', warehouse_id: Number(warehouseId) }))).subscribe({
      next: () => { this.allocateMaterialsLoading.set(false); this.closeAllocateMaterialsModal(); this.loadMaterials(projectId); },
      error: (err: any) => { this.allocateMaterialsLoading.set(false); this.allocateMaterialsError.set(err.error?.message || this.translateService.instant('projects.details.materials.failedToAllocate')); }
    });
  }

  // ============================================================================
  // Contract Upload
  // ============================================================================

  showContractUploadAlert(): void {
    this.toast.warning(this.translateService.instant('projects.details.materials.cannotAllocate'), 5000);
  }

  onContractFileSelected(event: any): void {
    const file = event.target.files[0];
    if (!file) { this.contractUploadError.set(this.translateService.instant('projects.details.contract.pleaseSelectFile')); return; }
    if (file.type !== 'application/pdf') { this.contractUploadError.set(this.translateService.instant('projects.details.contract.pdfOnly')); this.selectedContractFile = null; return; }
    if (file.size > 50 * 1024 * 1024) { this.contractUploadError.set(this.translateService.instant('projects.details.contract.fileTooLarge')); this.selectedContractFile = null; return; }
    this.selectedContractFile = file;
    this.contractUploadError.set(null);
  }

  uploadContract(): void {
    const projectId = this.project()?.id;
    if (!projectId) { this.contractUploadError.set(this.translateService.instant('projects.details.contract.projectIdNotFound')); return; }
    if (!this.selectedContractFile) { this.contractUploadError.set(this.translateService.instant('projects.details.contract.pleaseSelectContractFile')); return; }
    this.contractUploadLoading.set(true);
    this.contractUploadError.set(null);
    const formData = new FormData();
    formData.append('contract', this.selectedContractFile);
    this.http.post<any>(`${environment.apiUrl}/contracts/${projectId}/upload`, formData, { headers: { 'Authorization': `Bearer ${this.auth.token()}` } }).subscribe({
      next: (r) => {
        this.contractUploadLoading.set(false);
        this.contractUploadSuccess.set(this.translateService.instant('projects.details.contract.uploadSuccess'));
        this.toast.success(this.translateService.instant('projects.details.contract.redirecting'), 4000);
        if (r.data?.project) this.project.set(r.data.project);
        setTimeout(() => this.router.navigate(['/projects', projectId, 'reports']), 1500);
      },
      error: (err) => {
        this.contractUploadLoading.set(false);
        const msg = err.error?.message || this.translateService.instant('projects.details.contract.failedToUpload');
        this.contractUploadError.set(msg);
        this.toast.error(`❌ ${msg}`, 5000);
      }
    });
  }

  // ============================================================================
  // Purchase Request
  // ============================================================================

  loadInventoryCategories(): void {
    this.http.get<{ status: string; data: { categories: string[] } }>(
      `${environment.apiUrl}/inventory/categories`,
      { headers: { Authorization: `Bearer ${this.auth.token()}` } }
    ).subscribe({
      next: (r) => this.inventoryCategories.set(r.data.categories),
      error: () => this.inventoryCategories.set(['solar_panel', 'inverter', 'cable', 'accessory', 'other'])
    });
  }

  openPurchaseRequestForm(itemId: number): void {
    const item = this.availableInventoryItems().find(i => i.id === itemId);
    const alloc = this.materialAllocations().find(a => a.item_id === itemId);
    if (!item) return;
    const requested = alloc?.quantity || 0;
    const available = item.quantity_on_hand || 0;
    const shortage = Math.max(0, requested - available);
    this.purchaseRequestForm.set({
      item_id: item.id, item_name: item.item_name || item.name, item_code: item.item_code || '',
      unit_of_measure: item.unit_of_measure || item.unit || 'pcs',
      quantity: shortage > 0 ? shortage : requested,
      unit_price: item.unit_cost || 0, priority: 'normal',
      notes: this.translateService.instant('projects.details.purchaseRequest.notesPlaceholder', { projectName: this.project()?.name })
    });
    this.showPurchaseRequestModal.set(true);
    this.purchaseRequestError.set(null);
  }

  closePurchaseRequestModal(): void { this.showPurchaseRequestModal.set(false); this.purchaseRequestError.set(null); }

  submitPurchaseRequest(): void {
    const projectId = this.project()?.id;
    const form = this.purchaseRequestForm();
    if (!projectId) { this.purchaseRequestError.set(this.translateService.instant('projects.details.purchaseRequest.projectIdNotFound')); return; }
    if (!form.item_id || form.quantity <= 0) { this.purchaseRequestError.set(this.translateService.instant('projects.details.purchaseRequest.pleaseFillRequiredFields')); return; }
    this.purchaseRequestLoading.set(true);
    this.purchaseRequestError.set(null);
    this.http.post<any>(
      `${environment.apiUrl}/purchasing/orders`,
      { project_id: projectId, items: [{ item_id: form.item_id, quantity: form.quantity, unit_cost: form.unit_price || 0 }], notes: form.notes, status: 'pending' },
      { headers: { Authorization: `Bearer ${this.auth.token()}` } }
    ).subscribe({
      next: () => {
        this.purchaseRequestLoading.set(false);
        this.closePurchaseRequestModal();
        this.closeAllocateMaterialsModal();
        this.toast.success(this.translateService.instant('projects.details.purchaseRequest.success'), 5000);
      },
      error: (err) => {
        this.purchaseRequestLoading.set(false);
        this.purchaseRequestError.set(err.error?.message || this.translateService.instant('projects.details.purchaseRequest.failedToCreate'));
      }
    });
  }
}