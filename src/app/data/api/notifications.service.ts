import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment.prod';

export interface Notification {
  id: number;
  user_id: number;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
  entity_type?: string;
  entity_id?: number;
  read_at?: string;
  created_at: string;
}

/**
 * NotificationsService - Handles notification API calls
 */
@Injectable({ providedIn: 'root' })
export class NotificationsService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/notifications`;

  /**
   * Get user notifications
   * Backend returns: { status: 'success', data: { notifications: [...], unread_count: N } }
   */
  getNotifications(unreadOnly = false): Observable<{ 
    status: string; 
    data: { 
      notifications: Notification[]; 
      unread_count: number;
      count: number;
    } 
  }> {
    let params = new HttpParams();
    if (unreadOnly) {
      params = params.set('unread_only', 'true');
    }
        
    return this.http.get<{ status: string; data: { notifications: Notification[]; unread_count: number; count: number } }>(this.apiUrl, { params });
  }

  /**
   * Mark notification as read
   */
  markAsRead(id: number): Observable<{ status: string; data: { notification: Notification } }> {
    return this.http.patch<{ status: string; data: { notification: Notification } }>(
      `${this.apiUrl}/${id}/read`,
      {}
    );
  }

  /**
   * Mark all notifications as read
   */
  markAllAsRead(): Observable<{ status: string }> {
    return this.http.patch<{ status: string }>(`${this.apiUrl}/read-all`, {});
  }

  /**
   * Delete notification
   */
  deleteNotification(id: number): Observable<{ status: string }> {
    return this.http.delete<{ status: string }>(`${this.apiUrl}/${id}`);
  }
}
