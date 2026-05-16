import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface User {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  department_id: number | null;
  role_name: string;
}

@Injectable({ providedIn: 'root' })
export class UsersService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/users`;

  /**
   * Get all users by role name
   * Example: getUsersByRole('sales_rep')
   */
  getUsersByRole(roleName: string): Observable<{
    status: string;
    data: { users: User[] };
  }> {
    return this.http.get<{ status: string; data: { users: User[] } }>(
      `${this.apiUrl}/by-role/${roleName}`
    );
  }

  /**
   * Get users by department AND role
   * Example: getUsersByDepartmentAndRole(5, 'engineer')
   */
  getUsersByDepartmentAndRole(
    departmentId: number,
    roleName: string
  ): Observable<{
    status: string;
    data: { users: User[] };
  }> {
    return this.http.get<{ status: string; data: { users: User[] } }>(
      `${this.apiUrl}/by-department/${departmentId}/role/${roleName}`
    );
  }
}
