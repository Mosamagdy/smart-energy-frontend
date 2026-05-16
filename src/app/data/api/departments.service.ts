import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Department {
  id: number;
  name: string;
  name_ar?: string;
  description?: string;
  icon?: string;
  dept_type?: 'administrative' | 'technical';
  department_head_id?: number;
  head_first_name?: string;
  head_last_name?: string;
  head_email?: string;
  head_phone?: string;
  head_role_name?: string;
  head_role_description?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateDepartmentDto {
  name: string;
  name_ar?: string;
  description?: string;
  dept_type?: 'administrative' | 'technical';
  head_email?: string;
  head_name?: string;
  head_phone?: string;
}

export interface UpdateDepartmentDto {
  name?: string;
  name_ar?: string;
  description?: string;
}

export interface AssignManagerDto {
  first_name: string;
  last_name: string;
  email: string;
  username: string;
  password: string;
  phone?: string;
  role_id: number;
}

/**
 * DepartmentsService - Handles all department-related API calls
 */
@Injectable({ providedIn: 'root' })
export class DepartmentsService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/departments`;

  /**
   * Get all departments
   * Backend returns: { status: 'success', data: { departments: [...] } }
   */
  getAllDepartments(): Observable<{ status: string; data: { departments: Department[] } }> {
    return this.http.get<{ status: string; data: { departments: Department[] } }>(this.apiUrl);
  }

  /**
   * Get only technical departments (for lead assignment)
   * Backend returns: { status: 'success', data: { departments: [...] } }
   */
  getTechnicalDepartments(): Observable<{ status: string; data: { departments: Department[] } }> {
    return this.http.get<{ status: string; data: { departments: Department[] } }>(`${this.apiUrl}/technical`);
  }

  /**
   * Get department by ID
   * Backend returns: { status: 'success', data: { department: {...} } }
   */
  getDepartmentById(id: number): Observable<{ status: string; data: { department: Department } }> {
    return this.http.get<{ status: string; data: { department: Department } }>(`${this.apiUrl}/${id}`);
  }

  /**
   * Create department with department head (full workflow)
   * Required: name, head_first_name, head_last_name, head_email, head_username, head_password
   * dept_type is independent and can be 'administrative' or 'technical'
   */
  createDepartment(data: {
    name: string;
    description?: string;
    icon?: string;
    dept_type?: 'administrative' | 'technical';
    head_first_name: string;
    head_last_name: string;
    head_email: string;
    head_username: string;
    head_password: string;
    head_phone?: string;
  }): Observable<{ status: string; message?: string; data: any }> {
    return this.http.post<{ status: string; message?: string; data: any }>(this.apiUrl, data);
  }

  /**
   * Create department without head (simple)
   */
  createDepartmentSimple(data: { name: string; description?: string; icon?: string; dept_type?: 'administrative' | 'technical' }): Observable<{ status: string; message?: string; data: { department: Department } }> {
    return this.http.post<{ status: string; message?: string; data: { department: Department } }>(`${this.apiUrl}/simple`, data);
  }

  /**
   * Update department
   */
  updateDepartment(id: number, data: { name?: string; description?: string; icon?: string }): Observable<{ status: string; message?: string; data: { department: Department } }> {
    return this.http.patch<{ status: string; message?: string; data: { department: Department } }>(`${this.apiUrl}/${id}`, data);
  }

  /**
   * Toggle department active/inactive (requires is_active in body)
   */
  toggleDepartment(id: number, is_active: boolean): Observable<{ status: string; message?: string; data: { department: Department } }> {
    return this.http.patch<{ status: string; message?: string; data: { department: Department } }>(`${this.apiUrl}/${id}/toggle`, { is_active });
  }

  /**
   * Auto-toggle department active status (flips current status automatically)
   */
  toggleDepartmentAuto(id: number): Observable<{ status: string; message?: string; data: { department: Department } }> {
    return this.http.patch<{ status: string; message?: string; data: { department: Department } }>(`${this.apiUrl}/${id}/toggle`, {});
  }

  /**
   * Assign manager to department
   * Backend returns: { status: 'success', message: 'تم تعيين المدير بنجاح', data: { manager: {...} } }
   */
  assignManager(id: number, data: AssignManagerDto): Observable<{ status: string; message: string; data: { manager: any } }> {
    return this.http.post<{ status: string; message: string; data: { manager: any } }>(`${this.apiUrl}/${id}/assign-manager`, data);
  }

  /**
   * Delete department (hard delete)
   * Backend returns: { status: 'success', message: '...' }
   */
  deleteDepartment(id: number): Observable<{ status: string; message: string }> {
    return this.http.delete<{ status: string; message: string }>(`${this.apiUrl}/${id}`);
  }
}
