import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { catchError, tap, throwError } from 'rxjs';
import { AuthStore } from '../../core/auth/auth.store';

export interface Task {
  id: number;
  project_id: number;
  parent_task_id?: number;
  title: string;
  description?: string;
  assigned_to?: number;
  assigned_to_name?: string;
  assigned_to_email?: string;
  start_date?: string;
  due_date?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled' | 'on_hold';
  parent_task_title?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateTaskDto {
  title: string;
  description?: string;
  assigned_to?: number;
  start_date?: string;
  due_date?: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  status?: 'pending' | 'in_progress' | 'completed' | 'cancelled' | 'on_hold';
}

export interface UpdateTaskDto {
  title?: string;
  description?: string;
  assigned_to?: number;
  start_date?: string;
  due_date?: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
}

export interface UpdateTaskStatusDto {
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled' | 'on_hold';
}

@Injectable({ providedIn: 'root' })
export class TasksService {
  private readonly http = inject(HttpClient);
  private readonly auth = inject(AuthStore);

  /**
   * Get all tasks for a project
   * GET /api/projects/:id/tasks
   */
  getProjectTasks(projectId: number) {
    return this.http.get<{
      status: string;
      data: { tasks: Task[]; count: number };
    }>(`${environment.apiUrl}/projects/${projectId}/tasks`, {
      headers: { Authorization: `Bearer ${this.auth.token()}` }
    }).pipe(
      tap(response => {

      }),
      catchError(error => {
        console.error(`❌ Failed to get tasks for project ${projectId}:`, error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Create a new task in project
   * POST /api/projects/:id/tasks
   */
  createTask(projectId: number, task: CreateTaskDto) {
    return this.http.post<{
      status: string;
      message: string;
      data: { task: Task };
    }>(`${environment.apiUrl}/projects/${projectId}/tasks`, task, {
      headers: { Authorization: `Bearer ${this.auth.token()}` }
    }).pipe(
      tap(response => {
        console.log(`✅ Created task "${response.data.task.title}" in project ${projectId}`);
      }),
      catchError(error => {
        console.error(`❌ Failed to create task in project ${projectId}:`, error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Update task information
   * PATCH /api/projects/:id/tasks/:taskId
   */
  updateTask(projectId: number, taskId: number, data: UpdateTaskDto) {
    return this.http.patch<{
      status: string;
      message: string;
      data: { task: Task };
    }>(`${environment.apiUrl}/projects/${projectId}/tasks/${taskId}`, data, {
      headers: { Authorization: `Bearer ${this.auth.token()}` }
    }).pipe(
      tap(response => {
        console.log(`✅ Updated task ${taskId}`);
      }),
      catchError(error => {
        console.error(`❌ Failed to update task ${taskId}:`, error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Update task status only
   * PATCH /api/projects/:id/tasks/:taskId/status
   */
  updateTaskStatus(projectId: number, taskId: number, data: UpdateTaskStatusDto) {
    return this.http.patch<{
      status: string;
      message: string;
      data: { task: Task };
    }>(`${environment.apiUrl}/projects/${projectId}/tasks/${taskId}/status`, data, {
      headers: { Authorization: `Bearer ${this.auth.token()}` }
    }).pipe(
      tap(response => {
        console.log(`✅ Updated task ${taskId} status to ${data.status}`);
      }),
      catchError(error => {
        console.error(`❌ Failed to update task ${taskId} status:`, error);
        return throwError(() => error);
      })
    );
  }
}
