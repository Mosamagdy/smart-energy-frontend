import { Component, inject, OnInit, signal, HostListener } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { Router } from '@angular/router';
import { NotificationsService, Notification } from '../../../data/api/notifications.service';
import { AuthStore } from '../../../core/auth/auth.store';

@Component({
  selector: 'app-notification-dropdown',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './notification-dropdown.component.html',
  styleUrls: ['./notification-dropdown.component.css']
})
export class NotificationDropdownComponent implements OnInit {
  private notifService = inject(NotificationsService);
  private router = inject(Router);
  private authStore = inject(AuthStore);
  
  notifications = signal<Notification[]>([]);
  unreadCount = signal(0);
  loading = signal(true);
  showDropdown = signal(false);

  ngOnInit(): void {
    this.loadNotifications();
  }

  loadNotifications(): void {
    this.loading.set(true);
    this.notifService.getNotifications(false).subscribe({
      next: (response) => {
        this.notifications.set(response.data?.notifications || []);
        this.unreadCount.set(response.data?.unread_count || 0);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Failed to load notifications:', err);
        this.loading.set(false);
      }
    });
  }

  toggleDropdown(event: Event): void {
    event.stopPropagation();
    this.showDropdown.set(!this.showDropdown());
    if (this.showDropdown() && this.notifications().length === 0) {
      this.loadNotifications();
    }
  }

  closeDropdown(): void {
    this.showDropdown.set(false);
  }

  markAsRead(notification: Notification, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    
    // Mark as read immediately if not already read
    if (!notification.read_at) {
      this.notifService.markAsRead(notification.id).subscribe({
        next: () => {
          notification.read_at = new Date().toISOString();
          this.unreadCount.set(Math.max(0, this.unreadCount() - 1));
        },
        error: (err) => console.error('Failed to mark as read:', err)
      });
    }
    
    // Smart redirect based on entity_type
    const userRole = this.authStore.role();
    
    if (notification.entity_type === 'lead' && notification.entity_id) {
      this.router.navigate(['/leads', notification.entity_id]);
      this.closeDropdown();
      return;
    }
    
    // Redirect to lead details for inspection reports
    if (notification.entity_type === 'inspection_report' && notification.entity_id) {
      // First, get the inspection report to find the lead_id
      this.router.navigate(['/leads']); // Navigate to leads list first
      this.closeDropdown();
      return;
    }
    
    // Redirect to quotation details - DIFFERENT for clients vs staff
    if (notification.entity_type === 'quotation' && notification.entity_id) {
      if (userRole === 'client') {
        // Clients go to their portal
        this.router.navigate(['/client/quotations']);
      } else {
        // Staff goes to admin quotation details
        this.router.navigate(['/quotations', notification.entity_id]);
      }
      this.closeDropdown();
      return;
    }
    
    // Redirect to project details - DIFFERENT for clients vs staff
    if (notification.entity_type === 'project' && notification.entity_id) {
      if (userRole === 'client') {
        // Clients go to their portal
        this.router.navigate(['/client/projects']);
      } else {
        // Staff goes to admin project details
        this.router.navigate(['/projects', notification.entity_id]);
      }
      this.closeDropdown();
      return;
    }
    
    // ✅ TASK 3: Redirect to My Tasks for task notifications
    if (notification.entity_type === 'task' && notification.entity_id) {
      if (userRole === 'engineer') {
        // Engineers go to their My Tasks page
        this.router.navigate(['/dashboard/my-tasks']);
      } else {
        // Other roles go to project details with tasks tab
        this.router.navigate(['/projects', notification.entity_id], { queryParams: { tab: 'tasks' } });
      }
      this.closeDropdown();
      return;
    }
    
    // ✅ PROCUREMENT: Redirect to pending approvals for purchase_order notifications
    if (notification.entity_type === 'purchase_order') {
      // All roles go to procurement pending approvals
      this.router.navigate(['/procurement/pending-approvals']);
      this.closeDropdown();
      return;
    }
    
    this.closeDropdown();
  }

  markAllAsRead(event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    
    this.notifService.markAllAsRead().subscribe({
      next: () => {
        this.notifications.update(notifs => 
          notifs.map(n => ({ ...n, read_at: n.read_at || new Date().toISOString() }))
        );
        this.unreadCount.set(0);
      },
      error: (err) => console.error('Failed to mark all as read:', err)
    });
  }

  /**
   * Close dropdown when clicking outside
   */
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event): void {
    const target = event.target as HTMLElement;
    // Safe check: ensure target is an HTMLElement and not inside our component
    if (this.showDropdown() && !target.closest('app-notification-dropdown')) {
      this.closeDropdown();
    }
  }

  getNotificationIcon(type: string): string {
    switch (type) {
      case 'info': return 'ℹ️';
      case 'warning': return '⚠️';
      case 'error': return '❌';
      case 'success': return '✅';
      default: return '🔔';
    }
  }

  getNotificationColor(type: string): string {
    switch (type) {
      case 'info': return 'border-blue-500 bg-blue-50';
      case 'warning': return 'border-yellow-500 bg-yellow-50';
      case 'error': return 'border-red-500 bg-red-50';
      case 'success': return 'border-green-500 bg-green-50';
      default: return 'border-gray-300 bg-gray-50';
    }
  }

  getTimeAgo(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return 'الآن';
    if (seconds < 3600) return `${Math.floor(seconds / 60)} دقيقة`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} ساعة`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)} يوم`;
    return date.toLocaleDateString('ar-EG');
  }
}
