import { Component, inject, signal, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { CommonModule } from '@angular/common';
import { LeadsService, Lead } from '../../../data/api/leads.service';
import { AuthStore } from '../../../core/auth/auth.store';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-employee-dashboard',
  standalone: true,
  imports: [CommonModule, TranslatePipe, RouterLink],
  template: `
    <div class="space-y-6">
      <!-- Header -->
      <div class="bg-gradient-to-r from-[#2876c9] to-[#2876c9]/80 rounded-2xl p-6 text-white">
        <h1 class="text-2xl font-bold mb-2">
          {{ 'dashboard.myTasks' | translate }}
        </h1>
        <p class="text-white/80 text-sm">
          {{ 'dashboard.myTasksSubtitle' | translate }}
        </p>
      </div>

      <!-- Loading State -->
      @if (loading()) {
        <div class="flex items-center justify-center py-12">
          <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2876c9]"></div>
        </div>
      }

      <!-- Empty State -->
      @if (!loading() && tasks().length === 0) {
        <div class="bg-white rounded-2xl shadow-lg p-12 text-center">
          <svg class="w-20 h-20 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
          </svg>
          <h3 class="text-lg font-bold text-[#0c0725] mb-2">
            {{ 'dashboard.noTasks' | translate }}
          </h3>
          <p class="text-gray-500 text-sm">
            {{ 'dashboard.noTasksDescription' | translate }}
          </p>
        </div>
      }

      <!-- Tasks Grid -->
      @if (!loading() && tasks().length > 0) {
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          @for (task of tasks(); track task.id) {
            <div class="bg-[#2876c9]/10 border-2 border-[#2876c9]/30 rounded-xl p-5 transition-all duration-200 hover:shadow-lg hover:border-[#2876c9]/50">
              <!-- Status Badge -->
              <div class="flex items-center justify-between mb-3">
                <span class="px-3 py-1 rounded-full text-xs font-bold"
                      [class]="getStatusBadgeClass(task.status)">
                  {{ getStatusLabel(task.status) }}
                </span>
                <span class="px-3 py-1 rounded-full text-xs font-bold"
                      [class]="getPriorityBadgeClass(task.priority)">
                  {{ getPriorityLabel(task.priority) }}
                </span>
              </div>

              <!-- Client Name -->
              <h3 class="text-lg font-bold text-[#0c0725] mb-2">
                {{ task.client_name }}
              </h3>

              <!-- Contact Info -->
              <div class="space-y-1 mb-4 text-sm text-gray-600">
                @if (task.contact_email) {
                  <p class="flex items-center gap-2">
                    <svg class="w-4 h-4 text-[#2876c9]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
                    </svg>
                    {{ task.contact_email }}
                  </p>
                }
                @if (task.contact_phone) {
                  <p class="flex items-center gap-2">
                    <svg class="w-4 h-4 text-[#2876c9]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/>
                    </svg>
                    {{ task.contact_phone }}
                  </p>
                }
              </div>

              <!-- Department (for engineers) -->
              @if (task.technical_dept_name && userRole() === 'engineer') {
                <p class="text-xs text-gray-500 mb-3 flex items-center gap-1">
                  <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
                  </svg>
                  {{ task.technical_dept_name }}
                </p>
              }

              <!-- Action Button -->
              <a [routerLink]="['/leads', task.id]"
                 class="block w-full px-4 py-2 bg-[#2876c9] text-white text-center rounded-xl font-bold hover:bg-[#2876c9]/90 transition-colors duration-200">
                {{ 'dashboard.viewDetails' | translate }}
              </a>
            </div>
          }
        </div>
      }

      <!-- Stats Summary -->
      @if (!loading() && tasks().length > 0) {
        <div class="bg-white rounded-2xl shadow-lg p-6">
          <h3 class="text-lg font-bold text-[#0c0725] mb-4">
            {{ 'dashboard.taskSummary' | translate }}
          </h3>
          <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div class="text-center p-4 bg-[#2876c9]/10 rounded-xl">
              <p class="text-2xl font-bold text-[#2876c9]">{{ tasks().length }}</p>
              <p class="text-xs text-gray-600 mt-1">{{ 'dashboard.totalTasks' | translate }}</p>
            </div>
            <div class="text-center p-4 bg-yellow-50 rounded-xl">
              <p class="text-2xl font-bold text-yellow-600">
                {{ tasks().filter(t => t.priority === 'high').length }}
              </p>
              <p class="text-xs text-gray-600 mt-1">{{ 'dashboard.highPriority' | translate }}</p>
            </div>
            <div class="text-center p-4 bg-green-50 rounded-xl">
              <p class="text-2xl font-bold text-green-600">
                {{ tasks().filter(t => t.status === 'inspection_assigned').length }}
              </p>
              <p class="text-xs text-gray-600 mt-1">{{ 'dashboard.pendingInspection' | translate }}</p>
            </div>
            <div class="text-center p-4 bg-blue-50 rounded-xl">
              <p class="text-2xl font-bold text-blue-600">
                {{ tasks().filter(t => t.status === 'contacted').length }}
              </p>
              <p class="text-xs text-gray-600 mt-1">{{ 'dashboard.activeLeads' | translate }}</p>
            </div>
          </div>
        </div>
      }
    </div>
  `
})
export class EmployeeDashboardComponent implements OnInit {
  private leadsService = inject(LeadsService);
  private auth = inject(AuthStore);
  private router = inject(Router);
  private toast = inject(ToastService);

  readonly tasks = signal<Lead[]>([]);
  readonly loading = signal<boolean>(true);
  readonly userRole = signal<string>(this.auth.role() || '');

  ngOnInit(): void {
    this.loadTasks();
  }

  private loadTasks(): void {
    this.loading.set(true);
    
    this.leadsService.getMyTasks().subscribe({
      next: (response) => {
        this.tasks.set(response.data.leads || []);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Failed to load tasks:', err);
        this.toast.error('فشل في تحميل المهام المكلفة بها');
        this.tasks.set([]);
        this.loading.set(false);
      }
    });
  }

  getStatusBadgeClass(status: string): string {
    const classes: Record<string, string> = {
      'new': 'bg-gray-100 text-gray-700',
      'contacted': 'bg-blue-100 text-blue-700',
      'survey_requested': 'bg-purple-100 text-purple-700',
      'inspection_assigned': 'bg-yellow-100 text-yellow-700',
      'inspection_completed': 'bg-green-100 text-green-700',
      'quotation_sent': 'bg-indigo-100 text-indigo-700',
      'won': 'bg-emerald-100 text-emerald-700',
      'lost': 'bg-red-100 text-red-700'
    };
    return classes[status] || 'bg-gray-100 text-gray-700';
  }

  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      'new': 'جديد',
      'contacted': 'تم التواصل',
      'survey_requested': 'مطلوب معاينة',
      'inspection_assigned': 'معاينة مكلفة',
      'inspection_completed': 'معاينة مكتملة',
      'quotation_sent': 'عرض مرسل',
      'won': 'مقبول',
      'lost': 'مرفوض'
    };
    return labels[status] || status;
  }

  getPriorityBadgeClass(priority: string): string {
    const classes: Record<string, string> = {
      'low': 'bg-gray-100 text-gray-600',
      'medium': 'bg-blue-100 text-blue-600',
      'high': 'bg-orange-100 text-orange-600',
      'urgent': 'bg-red-100 text-red-600'
    };
    return classes[priority] || 'bg-gray-100 text-gray-600';
  }

  getPriorityLabel(priority: string): string {
    const labels: Record<string, string> = {
      'low': 'منخفضة',
      'medium': 'متوسطة',
      'high': 'عالية',
      'urgent': 'عاجلة'
    };
    return labels[priority] || priority;
  }
}
