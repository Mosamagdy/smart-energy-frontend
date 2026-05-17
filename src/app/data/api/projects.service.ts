import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment.prod';

// ============================================================================
// Project Interface - Exact match with backend projects.repository.js
// ============================================================================
export interface Project {
  id: number;
  name: string;
  description?: string;
  budget?: number;
  start_date?: string;
  end_date?: string;
  quotation_id?: number;
  client_id?: number;
  lead_id?: number;
  department_id?: number;
  project_manager_id?: number;
  status: 'planning' | 'in_progress' | 'completed' | 'on_hold' | 'cancelled';
  
  // JOIN fields from backend query
  department_name?: string;
  technical_dept_name?: string;
  project_manager_name?: string; // "firstName lastName"
  client_name?: string; // from leads table
  client_email?: string;
  contact_phone?: string;
  quotation_value?: number;
  lead_original_name?: string;
  contract_status: 'not_uploaded' | 'uploaded' | 'verified'; // ✅ ضيف السطر ده هن
  created_at: string;
  updated_at: string;
}

// ============================================================================
// DTOs for API Operations
// ============================================================================

export interface CreateProjectDto {
  name: string;
  description?: string;
  budget?: number;
  start_date?: string;
  end_date?: string;
  quotation_id?: number;
  lead_id?: number;
  department_id?: number;
  status?: 'planning' | 'in_progress' | 'completed' | 'on_hold' | 'cancelled';
}

export interface UpdateProjectDto {
  name?: string;
  description?: string;
  budget?: number;
  start_date?: string;
  end_date?: string;
  status?: 'planning' | 'in_progress' | 'completed' | 'on_hold' | 'cancelled';
}

export interface AssignManagerDto {
  manager_user_id: number;
}

export interface ProjectFilters {
  department_id?: number;
  status?: string;
  client_id?: number;
}

// ============================================================================
// Projects Service
// ============================================================================
@Injectable({ providedIn: 'root' })
export class ProjectsService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/projects`;

  /**
   * Get all projects with optional filters
   * Backend returns: { status: 'success', data: { projects: [...], count: number } }
   */
  getAllProjects(filters?: ProjectFilters): Observable<{
    status: string;
    data: { projects: Project[]; count: number };
  }> {
    const params: any = {
      _t: Date.now().toString() // ✅ Cache-busting timestamp
    };
    if (filters?.department_id) params.department_id = filters.department_id;
    if (filters?.status) params.status = filters.status;
    if (filters?.client_id) params.client_id = filters.client_id;

    return this.http.get<{ status: string; data: { projects: Project[]; count: number } }>(
      this.apiUrl,
      { params }
    );
  }

  /**
   * Get single project by ID with full details
   * Backend returns: { status: 'success', data: { project: {...} } }
   */
  getProjectById(id: number): Observable<{
    status: string;
    data: { project: Project };
  }> {
    return this.http.get<{ status: string; data: { project: Project } }>(
      `${this.apiUrl}/${id}`
    );
  }

  /**
   * Create new project
   * Backend returns: { status: 'success', message: string, data: { project: {...} } }
   */
  createProject(data: CreateProjectDto): Observable<{
    status: string;
    message: string;
    data: { project: Project };
  }> {
    return this.http.post<{ status: string; message: string; data: { project: Project } }>(
      this.apiUrl,
      data
    );
  }

  /**
   * Update project information
   * Allowed fields: name, description, budget, start_date, end_date, status
   */
  updateProject(id: number, data: UpdateProjectDto): Observable<{
    status: string;
    message: string;
    data: { project: Project };
  }> {
    return this.http.patch<{ status: string; message: string; data: { project: Project } }>(
      `${this.apiUrl}/${id}`,
      data
    );
  }

  /**
   * Update project status only
   */
  updateProjectStatus(id: number, status: string): Observable<{
    status: string;
    message: string;
    data: { project: Project };
  }> {
    return this.http.patch<{ status: string; message: string; data: { project: Project } }>(
      `${this.apiUrl}/${id}/status`,
      { status }
    );
  }

  /**
   * Assign project manager
   */
  assignManager(id: number, data: AssignManagerDto): Observable<{
    status: string;
    message: string;
    data: any;
  }> {
    return this.http.post<{ status: string; message: string; data: any }>(
      `${this.apiUrl}/${id}/assign-manager`,
      data
    );
  }

  /**
   * Get project managers by department
   */
  getManagersByDepartment(departmentId: number): Observable<{
    status: string;
    data: { managers: any[]; count: number; department_id: number };
  }> {
    return this.http.get<{ status: string; data: { managers: any[]; count: number; department_id: number } }>(
      `${this.apiUrl}/managers/by-department/${departmentId}`
    );
  }

  /**
   * Delete project (if backend supports it)
   */
  deleteProject(id: number): Observable<{
    status: string;
    message: string;
  }> {
    return this.http.delete<{ status: string; message: string }>(
      `${this.apiUrl}/${id}`
    );
  }

  /**
   * Get employees assigned to project
   * GET /api/projects/:id/employees
   */
  getProjectEmployees(id: number): Observable<{
    status: string;
    data: { employees: any[]; count: number };
  }> {
    return this.http.get<{ status: string; data: { employees: any[]; count: number } }>(
      `${this.apiUrl}/${id}/employees`
    );
  }

  /**
   * Assign employees to project
   * POST /api/projects/:id/employees
   */
  assignEmployees(id: number, employeeIds: number[], roleInProject: string = 'member'): Observable<{
    status: string;
    message: string;
    data: { assignments: any[] };
  }> {
    return this.http.post<{ status: string; message: string; data: { assignments: any[] } }>(
      `${this.apiUrl}/${id}/employees`,
      { employee_ids: employeeIds, role_in_project: roleInProject }
    );
  }

  /**
   * Get materials allocated to project
   * GET /api/projects/:id/materials
   */
  getProjectMaterials(id: number): Observable<{
    status: string;
    data: { materials: any[]; count: number };
  }> {
    return this.http.get<{ status: string; data: { materials: any[]; count: number } }>(
      `${this.apiUrl}/${id}/materials`
    );
  }

  /**
   * Allocate materials to project
   * POST /api/projects/:id/materials
   */
  allocateMaterials(id: number, allocations: Array<{item_id: number, quantity: number, unit?: string, warehouse_id?: number}>): Observable<{
    status: string;
    message: string;
    data: { allocations: any[] };
  }> {
    return this.http.post<{ status: string; message: string; data: { allocations: any[] } }>(
      `${this.apiUrl}/${id}/materials`,
      { allocations }
    );
  }
}
