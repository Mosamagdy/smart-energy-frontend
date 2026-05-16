
import { Component, inject, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { AuthStore } from '../../core/auth/auth.store';
import { I18nService } from '../../core/i18n/i18n.service';
import { NotificationDropdownComponent } from '../../features/notifications/notification-dropdown/notification-dropdown.component';
import { SidebarComponent } from './sidebar.component';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [RouterOutlet, TranslateModule, NotificationDropdownComponent, SidebarComponent],
  template: `
    <div class="min-h-screen bg-gray-50" [dir]="i18n.dir()">
      <!-- Sidebar -->
      <app-sidebar />

      <!-- Main Content Area -->
      <div 
        class="transition-all duration-300 min-h-screen"
        [style.margin-right]="i18n.dir() === 'rtl' ? '280px' : '0'"
        [style.margin-left]="i18n.dir() === 'ltr' ? '280px' : '0'">
        
        <!-- Top Bar -->
        <header class="sticky top-0 z-40 bg-white/80 backdrop-blur-lg border-b border-gray-200 shadow-sm">
          <div class="flex items-center justify-between px-6 py-4">
            <!-- Left: Language Toggle -->
            <button
              type="button"
              class="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 transition"
              (click)="i18n.toggleLanguage()">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129"/>
              </svg>
              <span class="text-sm font-medium">
                {{ i18n.language() === 'ar' ? ('lang.toggleToEn' | translate) : ('lang.toggleToAr' | translate) }}
              </span>
            </button>

            <!-- Right: Notifications & User Info -->
            <div class="flex items-center gap-4">
              <!-- Notification Bell -->
              <app-notification-dropdown />
              
              <!-- User Info -->
              <div class="flex items-center gap-3 px-4 py-2 rounded-lg bg-gray-100">
                <div class="w-8 h-8 rounded-full bg-gradient-to-br from-[#2cdc78] to-[#2cdc78]/70 flex items-center justify-center text-[#0c0725] font-bold text-sm">
                  {{ getUserInitial() }}
                </div>
                <div class="hidden md:block">
                  <p class="text-sm font-semibold text-gray-900">{{ getUserName() }}</p>
                  <p class="text-xs text-gray-600">{{ auth.role() }}</p>
                </div>
              </div>
            </div>
          </div>
        </header>

        <!-- Scrollable Content -->
        <main class="p-6">
          <router-outlet />
        </main>
      </div>
    </div>
  `
})
export class MainLayoutComponent {
  readonly i18n = inject(I18nService);
  readonly auth = inject(AuthStore);

  getUserName(): string {
    const user = this.auth.user();
    if (!user) return '';
    return (user.first_name || '') + ' ' + (user.last_name || '');
  }

  getUserInitial(): string {
    const user = this.auth.user();
    if (!user || !user.first_name) return '?';
    return user.first_name.charAt(0).toUpperCase();
  }
}