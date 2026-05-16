import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ClientPortalService, ClientProjectDetail, ProjectTask, SupportMessage } from '../../../data/api/client-portal.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-client-project-details',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './client-project-details.component.html',
  styleUrls: ['./client-project-details.component.css']
})
export class ClientProjectDetailsComponent implements OnInit {
  private clientService = inject(ClientPortalService);
  private route = inject(ActivatedRoute);
  public router = inject(Router);
  private toast = inject(ToastService);

  project = signal<ClientProjectDetail | null>(null);
  loading = signal(true);
  activeTab = signal<'tasks' | 'messages'>('tasks');
  
  // Messages
  messages = signal<SupportMessage[]>([]);
  newMessage = '';
  sendingMessage = signal(false);

  ngOnInit(): void {
    const projectId = this.route.snapshot.paramMap.get('id');
    if (projectId) {
      this.loadProject(parseInt(projectId));
    }
  }

  

  loadProject(id: number): void {
    this.loading.set(true);
    this.clientService.getProject(id).subscribe({
      next: (response) => {
        this.project.set(response.data);
        this.loading.set(false);
        this.loadMessages(id);
      },
      error: (err) => {
        this.toast.error('فشل في تحميل تفاصيل المشروع');
        this.loading.set(false);
      }
    });
  }

  loadMessages(projectId: number): void {
    this.clientService.getProjectMessages(projectId).subscribe({
      next: (response) => {
        this.messages.set(response.data);
      },
      error: (err) => {
        console.error('Failed to load messages:', err);
      }
    });
  }

  sendMessage(): void {
    if (!this.newMessage.trim() || !this.project()) return;

    this.sendingMessage.set(true);
    this.clientService.sendMessage(this.project()!.id, {
      message: this.newMessage.trim()
    }).subscribe({
      next: (response) => {
        this.messages.update(msgs => [...msgs, response.data]);
        this.newMessage = '';
        this.sendingMessage.set(false);
        this.toast.success('تم إرسال الرسالة');
        
        // Scroll to bottom
        setTimeout(() => {
          const container = document.getElementById('messages-container');
          if (container) container.scrollTop = container.scrollHeight;
        }, 100);
      },
      error: (err) => {
        this.sendingMessage.set(false);
        this.toast.error(err.error?.message || 'فشل في إرسال الرسالة');
      }
    });
  }

  getStatusBadgeClass(status: string): string {
    const classes: Record<string, string> = {
      'planning': 'bg-blue-100 text-blue-800',
      'in_progress': 'bg-yellow-100 text-yellow-800',
      'completed': 'bg-green-100 text-green-800',
      'on_hold': 'bg-gray-100 text-gray-800',
      'cancelled': 'bg-red-100 text-red-800'
    };
    return classes[status] || 'bg-gray-100 text-gray-800';
  }

  getStatusText(status: string): string {
    const texts: Record<string, string> = {
      'planning': 'قيد التخطيط',
      'in_progress': 'قيد التنفيذ',
      'completed': 'مكتمل',
      'on_hold': 'متوقف',
      'cancelled': 'ملغي'
    };
    return texts[status] || status;
  }

  getTaskStatusClass(status: string): string {
    const classes: Record<string, string> = {
      'pending': 'bg-gray-100 text-gray-800',
      'in_progress': 'bg-blue-100 text-blue-800',
      'completed': 'bg-green-100 text-green-800',
      'blocked': 'bg-red-100 text-red-800'
    };
    return classes[status] || 'bg-gray-100 text-gray-800';
  }

  getTaskStatusText(status: string): string {
    const texts: Record<string, string> = {
      'pending': 'قيد الانتظار',
      'in_progress': 'قيد التنفيذ',
      'completed': 'مكتملة',
      'blocked': 'متوقفة'
    };
    return texts[status] || status;
  }

  getProgress(): number {
    const p = this.project();
    if (!p || !p.tasks_count || p.tasks_count === 0) return 0;
    return Math.round((p.completed_tasks || 0) / p.tasks_count * 100);
  }

  formatPrice(price: number): string {
    return new Intl.NumberFormat('ar-EG', {
      style: 'currency',
      currency: 'EGP',
      minimumFractionDigits: 0
    }).format(price);
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  formatMessageDate(date: string): string {
    return new Date(date).toLocaleString('ar-EG', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}
