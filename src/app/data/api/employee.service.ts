import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment.prod';

export interface Employee {
  id: number;
  user_id: number;
  department_id: number;
  first_name: string;
  last_name: string;
  arabic_name?: string;
  nationality?: string;
  date_of_birth?: string;
  gender?: string;
  marital_status?: string;
  religion?: string;
  personal_email: string;
  personal_phone: string;
  emergency_contact?: string;
  emergency_phone?: string;
  passport_number?: string;
  passport_expiry?: string;
  passport_file_path?: string;
  national_id?: string;
  national_id_file_path?: string;
  national_id_expiry?: string;
  id_document_url?: string;
  residence_permit?: string;
  residence_expiry?: string;
  residence_file_path?: string;
  employee_number: string;
  job_title?: string;
  employment_type: string;
  contract_start_date?: string;
  contract_end_date?: string;
  contract_file_path?: string;
  probation_end_date?: string;
  basic_salary: number;
  housing_allowance: number;
  transport_allowance: number;
  other_allowances: number;
  currency: string;
  bank_name?: string;
  bank_account?: string;
  iban?: string;
  status: string;
  is_active: boolean;
  created_by: number;
  created_by_name?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  department_name?: string;
  system_email?: string;
  role_name?: string;
}

export interface CreateEmployeeDto {
  full_name: string;
  full_name_ar?: string;
  department: string;
  job_title?: string;
  national_id?: string;
  iqama_number?: string;
  nationality?: string;
  hire_date: string;
  basic_salary: number;
  housing_allowance?: number;
  transport_allowance?: number;
  other_allowances?: number;
  bank_account?: string;
  bank_name?: string;
  notes?: string;
}

export interface EmployeesResponse {
  status: string;
  data: {
    employees: Employee[];
    pagination?: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
}

export interface EmployeeResponse {
  status: string;
  data: {
    employee: Employee;
  };
}

@Injectable({ providedIn: 'root' })
export class EmployeeService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/hr/employees`;

  /**
   * Get all employees with optional filters
   * @param filters - Optional filters (department_id, status, search, page, limit)
   */
  getEmployees(filters?: {
    department_id?: number;
    status?: string;
    search?: string;
    page?: number;
    limit?: number;
  }): Observable<EmployeesResponse> {
    let params = new HttpParams();
    
    if (filters?.department_id) {
      params = params.set('department_id', filters.department_id.toString());
    }
    if (filters?.status) {
      params = params.set('status', filters.status);
    }
    if (filters?.search) {
      params = params.set('search', filters.search);
    }
    if (filters?.page) {
      params = params.set('page', filters.page.toString());
    }
    if (filters?.limit) {
      params = params.set('limit', filters.limit.toString());
    }

    return this.http.get<EmployeesResponse>(this.apiUrl, { params });
  }

  /**
   * Get current logged-in employee's data
   */
  getCurrentEmployee(): Observable<EmployeeResponse> {
    return this.http.get<EmployeeResponse>(`${this.apiUrl}/me`);
  }

  /**
   * Get employees by department ID
   * @param departmentId - Department ID
   */
  getEmployeesByDepartment(departmentId: number): Observable<EmployeesResponse> {
    return this.getEmployees({ department_id: departmentId });
  }

  /**
   * Get employee by ID
   * @param id - Employee ID
   */
  getEmployeeById(id: number): Observable<EmployeeResponse> {
    return this.http.get<EmployeeResponse>(`${this.apiUrl}/${id}`);
  }

  /**
   * Create a new employee
   * @param data - Employee data
   */
  createEmployee(data: CreateEmployeeDto): Observable<{
    status: string;
    message?: string;
    data: Employee;
  }> {
    return this.http.post<{
      status: string;
      message?: string;
      data: Employee;
    }>(this.apiUrl, data);
  }

  /**
   * Update an existing employee
   * @param id - Employee ID
   * @param data - Partial employee data
   */
  updateEmployee(id: number, data: Partial<CreateEmployeeDto>): Observable<{
    status: string;
    message?: string;
    data: Employee;
  }> {
    return this.http.patch<{
      status: string;
      message?: string;
      data: Employee;
    }>(`${this.apiUrl}/${id}`, data);
  }

  /**
   * Delete an employee
   * @param id - Employee ID
   */
  deleteEmployee(id: number): Observable<{
    status: string;
    message: string;
  }> {
    return this.http.delete<{
      status: string;
      message: string;
    }>(`${this.apiUrl}/${id}`);
  }

  /**
   * Upload files for an employee
   * @param id - Employee ID
   * @param formData - Form data with files
   */
  uploadFiles(id: number, formData: FormData): Observable<{
    status: string;
    data: { employee: Employee };
  }> {
    return this.http.post<{
      status: string;
      data: { employee: Employee };
    }>(`${this.apiUrl}/${id}/upload-files`, formData);
  }
}