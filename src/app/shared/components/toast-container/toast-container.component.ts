import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-toast-container',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="toast-container">
      @for (toast of toastService.toasts$(); track toast.id) {
        <div class="toast toast-{{toast.type}} animate-slide-in">
          <div class="toast-icon">
            @if (toast.type === 'success') {
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
            } @else if (toast.type === 'error') {
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
            } @else if (toast.type === 'warning') {
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
              </svg>
            } @else {
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
            }
          </div>
          <div class="toast-content">{{ toast.message }}</div>
          <button class="toast-close" (click)="toastService.remove(toast.id)">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>
      }
    </div>
  `,
  styles: [`
    .toast-container {
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 9999;
      display: flex;
      flex-direction: column;
      gap: 12px;
      max-width: 400px;
    }

    .toast {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 16px 20px;
      border-radius: 12px;
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
      background: white;
      border-right: 4px solid;
      animation: slideIn 0.3s ease-out;
    }

    .toast-success {
      border-color: #10b981;
    }

    .toast-success .toast-icon {
      color: #10b981;
    }

    .toast-error {
      border-color: #ef4444;
    }

    .toast-error .toast-icon {
      color: #ef4444;
    }

    .toast-warning {
      border-color: #f59e0b;
    }

    .toast-warning .toast-icon {
      color: #f59e0b;
    }

    .toast-info {
      border-color: #3b82f6;
    }

    .toast-info .toast-icon {
      color: #3b82f6;
    }

    .toast-icon {
      flex-shrink: 0;
      width: 24px;
      height: 24px;
    }

    .toast-content {
      flex: 1;
      font-size: 14px;
      font-weight: 500;
      color: #1f2937;
      line-height: 1.5;
    }

    .toast-close {
      flex-shrink: 0;
      padding: 4px;
      border: none;
      background: transparent;
      color: #9ca3af;
      cursor: pointer;
      border-radius: 4px;
      transition: all 0.2s;
    }

    .toast-close:hover {
      background: #f3f4f6;
      color: #374151;
    }

    @keyframes slideIn {
      from {
        transform: translateX(100%);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }

    .animate-slide-in {
      animation: slideIn 0.3s ease-out;
    }

    @media (max-width: 640px) {
      .toast-container {
        top: 10px;
        right: 10px;
        left: 10px;
        max-width: none;
      }

      .toast {
        padding: 12px 16px;
      }

      .toast-content {
        font-size: 13px;
      }
    }
  `]
})
export class ToastContainerComponent {
  toastService = inject(ToastService);
}
