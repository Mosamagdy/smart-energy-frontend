import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface AttendanceRecord {
  id: number;
  employee_id: number;
  employee_first_name?: string;
  employee_last_name?: string;
  attendance_date: string;
  department_id?: number;
  department_name?: string;
  expected_hours?: number;
  actual_hours?: number;
  overtime_hours?: number;
  late_minutes?: number;
  status: 'present' | 'late' | 'absent' | 'half_day' | 'leave';
  clock_in_time?: string;
  clock_out_time?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface AttendanceSummary {
  total_records: number;
  total_hours: number;
  total_overtime: number;
  days_present: number;
  days_absent: number;
  days_late: number;
  total_late_minutes: number;
}

export interface AttendanceRangeResponse {
  status: string;
  data: {
    records: AttendanceRecord[];
    summary: AttendanceSummary;
  };
}

export interface AttendanceStatusResponse {
  status: string;
  data: {
    is_clocked_in: boolean;
    current_session: any;
    today_summary: AttendanceRecord;
  };
}

export interface ClockInOutResponse {
  status: string;
  message: string;
  data: any;
}

export interface DailyReportResponse {
  status: string;
  data: {
    records: AttendanceRecord[];
    summary: {
      total_employees: number;
      present: number;
      absent: number;
      late: number;
      on_leave: number;
    };
  };
}

@Injectable({ providedIn: 'root' })
export class AttendanceService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/hr/attendance`;

  // Clock in for a specific employee (HR/Admin only)
  clockIn(employeeId: number, ip?: string, location?: string): Observable<ClockInOutResponse> {
    return this.http.post<ClockInOutResponse>(`${this.apiUrl}/clock-in/${employeeId}`, { ip, location });
  }

  // Clock out for a specific employee (HR/Admin only)
  clockOut(employeeId: number, ip?: string, location?: string): Observable<ClockInOutResponse> {
    return this.http.post<ClockInOutResponse>(`${this.apiUrl}/clock-out/${employeeId}`, { ip, location });
  }

  // Get status for a specific employee (HR/Admin only)
  getStatus(employeeId: number): Observable<AttendanceStatusResponse> {
    return this.http.get<AttendanceStatusResponse>(`${this.apiUrl}/status/${employeeId}`);
  }

  // Methods for employees to access their own data (no employeeId required)
  clockInSelf(ip?: string, location?: string): Observable<ClockInOutResponse> {
    return this.http.post<ClockInOutResponse>(`${this.apiUrl}/clock-in`, { ip, location });
  }

  clockOutSelf(ip?: string, location?: string): Observable<ClockInOutResponse> {
    return this.http.post<ClockInOutResponse>(`${this.apiUrl}/clock-out`, { ip, location });
  }

  getStatusSelf(): Observable<AttendanceStatusResponse> {
    return this.http.get<AttendanceStatusResponse>(`${this.apiUrl}/status`);
  }

  // Get attendance within date range with optional filters
  getAttendanceRange(
    start_date: string,
    end_date: string,
    department_id?: number,
    employee_id?: number
  ): Observable<AttendanceRangeResponse> {
    let params: any = { start_date, end_date };
    if (department_id) params.department_id = department_id;
    if (employee_id) params.employee_id = employee_id;
    return this.http.get<AttendanceRangeResponse>(`${this.apiUrl}/range`, { params });
  }

  // Get daily report (today's attendance for all employees)
  getDailyReport(date?: string, department_id?: number): Observable<DailyReportResponse> {
    let params: any = {};
    if (date) params.date = date;
    if (department_id) params.department_id = department_id;
    return this.http.get<DailyReportResponse>(`${this.apiUrl}/daily-report`, { params });
  }

  // Get attendance history for a specific employee
  getEmployeeAttendanceHistory(
    employeeId: number,
    start_date: string,
    end_date: string
  ): Observable<{
    status: string;
    data: { records: AttendanceRecord[] };
  }> {
    const params = { start_date, end_date };
    return this.http.get<{
      status: string;
      data: { records: AttendanceRecord[] };
    }>(`${this.apiUrl}/employee/${employeeId}/history`, { params });
  }

  // Update notes for a specific employee on a specific date
  updateAttendanceNotes(
    employeeId: number,
    date: string,
    notes: string
  ): Observable<{
    status: string;
    message: string;
    data: AttendanceRecord;
  }> {
    return this.http.patch<{
      status: string;
      message: string;
      data: AttendanceRecord;
    }>(`${this.apiUrl}/notes/${employeeId}`, { date, notes });
  }
}