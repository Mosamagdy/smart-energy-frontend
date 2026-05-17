import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../../../environments/environment.prod';
import { AuthStore } from '../../../core/auth/auth.store';

interface Task {
  id: number;
  title: string;
  description: string;
  status: string;
  priority: string;
  due_date: string;
  assigned_to: number;
  project_id: number;
  project_name: string;
  created_at: string;
}

@Component({
  selector: 'app-my-tasks',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, TranslateModule],
  template: `
    <div [dir]="translateService.currentLang === 'ar' ? 'rtl' : 'ltr'" class="p-6 max-w-7xl mx-auto">
      <!-- Header -->
      <div class="mb-8">
        <h1 class="text-3xl font-bold text-gray-900">{{ 'myTasks.title' | translate }}</h1>
        <p class="text-gray-600 mt-2">{{ 'myTasks.subtitle' | translate }}</p>
      </div>

      <!-- Stats Cards -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div class="bg-white border-2 border-gray-200 rounded-xl p-6">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-semibold text-gray-600">{{ 'myTasks.stats.total' | translate }}</p>
              <p class="text-3xl font-bold text-gray-900 mt-2">{{ tasks().length }}</p>
            </div>
            <div class="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
              </svg>
            </div>
          </div>
        </div>

        <div class="bg-white border-2 border-gray-200 rounded-xl p-6">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-semibold text-gray-600">{{ 'myTasks.stats.pending' | translate }}</p>
              <p class="text-3xl font-bold text-yellow-600 mt-2">{{ getTasksByStatus('pending').length }}</p>
            </div>
            <div class="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
              <svg class="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
            </div>
          </div>
        </div>

        <div class="bg-white border-2 border-gray-200 rounded-xl p-6">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-semibold text-gray-600">{{ 'myTasks.stats.inProgress' | translate }}</p>
              <p class="text-3xl font-bold text-blue-600 mt-2">{{ getTasksByStatus('in_progress').length }}</p>
            </div>
            <div class="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
              </svg>
            </div>
          </div>
        </div>

        <div class="bg-white border-2 border-gray-200 rounded-xl p-6">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-semibold text-gray-600">{{ 'myTasks.stats.completed' | translate }}</p>
              <p class="text-3xl font-bold text-green-600 mt-2">{{ getTasksByStatus('completed').length }}</p>
            </div>
            <div class="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <svg class="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
            </div>
          </div>
        </div>
      </div>

      <!-- Loading State -->
      @if (loading()) {
        <div class="flex justify-center py-20">
          <div class="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-company-primary"></div>
        </div>
      }

      <!-- Error State -->
      @if (error()) {
        <div class="bg-red-50 border-l-4 border-red-500 p-6 rounded-lg mb-6">
          <p class="text-red-700 font-semibold">{{ error() }}</p>
        </div>
      }

      <!-- Tasks List -->
      @if (!loading() && !error()) {
        @if (tasks().length === 0) {
          <div class="bg-white border-2 border-gray-200 rounded-xl p-12 text-center">
            <svg class="w-24 h-24 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
            </svg>
            <h3 class="text-xl font-bold text-gray-900 mb-2">{{ 'myTasks.empty.title' | translate }}</h3>
            <p class="text-gray-600">{{ 'myTasks.empty.message' | translate }}</p>
          </div>
        } @else {
          <div class="space-y-4">
            @for (task of tasks(); track task.id) {
              <div class="bg-white border-2 border-gray-200 rounded-xl p-6 hover:border-company-primary/50 transition">
                <div class="flex items-start justify-between mb-4">
                  <div class="flex-1">
                    <h3 class="text-lg font-bold text-gray-900 mb-2">{{ task.title }}</h3>
                    @if (task.description) {
                      <p class="text-gray-600 text-sm mb-3">{{ task.description }}</p>
                    }
                    
                    <!-- Project Name with Link -->
                    <a 
                      [routerLink]="['/projects', task.project_id]" 
                      [queryParams]="{ tab: 'tasks' }"
                      class="inline-flex items-center gap-2 px-3 py-1.5 bg-purple-50 border border-purple-200 rounded-lg text-purple-700 text-sm font-semibold hover:bg-purple-100 transition">
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"/>
                      </svg>
                      {{ task.project_name }}
                    </a>
                  </div>

                  <!-- Status Badge -->
                  <div class="flex items-center gap-2">
                    @if (task.status === 'completed') {
                      <!-- ✅ TASK 4: LOCKED completed tasks -->
                      <span class="px-3 py-2 bg-green-100 border-2 border-green-300 rounded-lg text-sm font-bold text-green-700">
                        <svg class="w-4 h-4 inline-block ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
                        </svg>
                        {{ 'myTasks.status.completed' | translate }}
                      </span>
                    } @else {
                      <select 
                        [ngModel]="task.status"
                        (ngModelChange)="updateTaskStatus(task.id, $event)"
                        class="px-3 py-2 border-2 border-gray-300 rounded-lg text-sm font-semibold focus:border-company-primary focus:ring-2 focus:ring-company-primary/20 transition">
                        <option value="pending">{{ 'myTasks.status.pending' | translate }}</option>
                        <option value="in_progress">{{ 'myTasks.status.inProgress' | translate }}</option>
                        <option value="completed">{{ 'myTasks.status.completed' | translate }}</option>
                      </select>
                    }
                  </div>
                </div>

                <!-- Task Meta -->
                <div class="flex items-center gap-6 text-sm text-gray-600 border-t border-gray-200 pt-4">
                  <!-- Priority -->
                  <div class="flex items-center gap-2">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 11l5-5m0 0l5 5m-5-5v12"/>
                    </svg>
                    <span class="font-semibold" [ngClass]="getPriorityColor(task.priority)">
                      {{ getPriorityLabel(task.priority) }}
                    </span>
                  </div>

                  <!-- Due Date -->
                  @if (task.due_date) {
                    <div class="flex items-center gap-2">
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                      </svg>
                      <span>{{ task.due_date | date:'yyyy/MM/dd' }}</span>
                    </div>
                  }

                  <!-- Created Date -->
                  <div class="flex items-center gap-2">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    </svg>
                    <span>{{ task.created_at | date:'yyyy/MM/dd' }}</span>
                  </div>
                </div>
              </div>
            }
          </div>
        }
      }
    </div>
  `,
  styles: []
})
export class MyTasksComponent implements OnInit {
  private http = inject(HttpClient);
  private auth = inject(AuthStore);
  private router = inject(Router);
  public translateService = inject(TranslateService);

  tasks = signal<Task[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);

  ngOnInit(): void {
    this.loadMyTasks();
  }

  loadMyTasks(): void {
    this.loading.set(true);
    this.error.set(null);

    const userId = this.auth.user()?.id;
    if (!userId) {
      this.error.set(this.translateService.instant('myTasks.errors.userIdNotFound'));
      this.loading.set(false);
      return;
    }

    // Fetch all tasks assigned to current user
    this.http.get<{ status: string; data: { tasks: Task[] } }>(
      `${environment.apiUrl}/tasks/my-tasks`,  // ✅ Correct endpoint
      {
        headers: new HttpHeaders({
          Authorization: `Bearer ${this.auth.token()}`
        })
      }
    ).subscribe({
      next: (response) => {
        this.tasks.set(response.data.tasks);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Failed to load my tasks:', err);
        this.error.set(this.translateService.instant('myTasks.errors.failedToLoad'));
        this.loading.set(false);
      }
    });
  }

  updateTaskStatus(taskId: number, newStatus: string): void {
    this.http.patch<{ status: string; data: any }>(
      `${environment.apiUrl}/tasks/${taskId}/status`,
      { status: newStatus },
      {
        headers: new HttpHeaders({
          Authorization: `Bearer ${this.auth.token()}`
        })
      }
    ).subscribe({
      next: () => {
        // Reload tasks to get updated data
        this.loadMyTasks();
      },
      error: (err) => {
        console.error('Failed to update task status:', err);
        this.error.set(this.translateService.instant('myTasks.errors.failedToUpdate'));
      }
    });
  }

  getTasksByStatus(status: string): Task[] {
    return this.tasks().filter(t => t.status === status);
  }

  getPriorityColor(priority: string): string {
    const colors: Record<string, string> = {
      'high': 'text-red-600',
      'medium': 'text-yellow-600',
      'low': 'text-green-600'
    };
    return colors[priority] || 'text-gray-600';
  }

  getPriorityLabel(priority: string): string {
    return this.translateService.instant(`myTasks.priority.${priority}`);
  }
}
