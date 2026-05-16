import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface LeaveBalance {
  id: number;
  employee_id: number;
  leave_type: string;
  total_allowed: number;
  used: number;
  remaining: number;
  year: number;
  created_at: string;
  updated_at: string;
}

export interface LeaveRequest {
  id: number;
  employee_id: number;
  leave_type: 'annual' | 'sick' | 'emergency' | 'unpaid' | 'maternity' | 'paternity' | string;
  start_date: string;
  end_date: string;
  days_count: number;
  reason?: string;
  document_url?: string;
  status: 'pending' | 'dept_head_approved' | 'approved' | 'rejected';
  approved_by?: number;
  approved_at?: string;
  rejection_reason?: string;
  created_at: string;
  updated_at: string;
  // Joined fields from backend
  first_name?: string;
  last_name?: string;
  employee_number?: string;
  department_name?: string;
  employee_user_id?: number;
  approver_first_name?: string;
  approver_last_name?: string;
  status_arabic?: string;
}

export interface CreateLeaveRequestDto {
  leave_type: string;
  start_date: string;
  end_date: string;
  reason?: string;
  document_url?: string;
}

export interface UpdateLeaveStatusDto {
  status: 'approved' | 'rejected';
  rejection_reason?: string;
}

export interface ApiResponse<T> {
  status: string;
  message: string;
  data: T;
}

@Injectable({ providedIn: 'root' })
export class LeaveService {
  private http = inject(HttpClient);

  private base = `${environment.apiUrl}/leaves`;

  getMyLeaveBalances(): Observable<ApiResponse<{ balances: LeaveBalance[] }>> {
    return this.http.get<ApiResponse<{ balances: LeaveBalance[] }>>(
      `${this.base}/my/balances`
    );
  }

  getMyLeaveRequests(): Observable<ApiResponse<{ leaves: LeaveRequest[]; count?: number }>> {
    return this.http.get<ApiResponse<{ leaves: LeaveRequest[]; count?: number }>>(
      `${this.base}/my`
    );
  }

  createLeaveRequest(data: CreateLeaveRequestDto): Observable<ApiResponse<{ leave: LeaveRequest }>> {
    return this.http.post<ApiResponse<{ leave: LeaveRequest }>>(
      `${this.base}`,
      data
    );
  }

  getAllLeaveRequests(status?: string): Observable<ApiResponse<{ leaves: LeaveRequest[]; count: number }>> {
    const params = status ? `?status=${status}` : '';
    return this.http.get<ApiResponse<{ leaves: LeaveRequest[]; count: number }>>(
      `${this.base}${params}`
    );
  }

  getEmployeeLeaveRequests(employeeId: number): Observable<ApiResponse<{ leaves: LeaveRequest[]; count?: number }>> {
    return this.http.get<ApiResponse<{ leaves: LeaveRequest[]; count?: number }>>(
      `${this.base}/employee/${employeeId}`
    );
  }

  getEmployeeLeaveBalances(employeeId: number): Observable<ApiResponse<{ balances: LeaveBalance[] }>> {
    return this.http.get<ApiResponse<{ balances: LeaveBalance[] }>>(
      `${this.base}/balances/${employeeId}`
    );
  }

  updateLeaveStatus(id: number, data: UpdateLeaveStatusDto): Observable<ApiResponse<{ leave: LeaveRequest }>> {
    return this.http.patch<ApiResponse<{ leave: LeaveRequest }>>(
      `${this.base}/${id}/status`,
      data
    );
  }
}
