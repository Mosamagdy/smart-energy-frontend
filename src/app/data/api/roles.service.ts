import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Role {
  id: number;
  name: string;
  description: string;
  created_at: string;
  updated_at: string;
}

/**
 * RolesService - Fetches available roles from backend
 */
@Injectable({ providedIn: 'root' })
export class RolesService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/roles`;

  /**
   * Get all roles
   * Backend returns: { status: 'success', data: { roles: [...] } }
   */
  getAllRoles(): Observable<{ status: string; data: { roles: Role[] } }> {
    return this.http.get<{ status: string; data: { roles: Role[] } }>(this.apiUrl);
  }
}
