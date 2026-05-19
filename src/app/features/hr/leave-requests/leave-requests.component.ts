import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-leave-requests',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  template: `
    <div class="w-full min-w-0 p-4 sm:p-6">
      <h1 class="text-2xl font-bold break-words text-gray-900 sm:text-3xl">{{ 'hr.leaveRequests' | translate }}</h1>
      <p class="text-gray-600 mt-2">Leave requests management module - Coming Soon</p>
    </div>
  `
})
export class LeaveRequestsComponent {}