// main-layout.component.ts
import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { AuthStore } from '../../core/auth/auth.store';
import { I18nService } from '../../core/i18n/i18n.service';
import { NotificationDropdownComponent } from '../../features/notifications/notification-dropdown/notification-dropdown.component';
import { SidebarComponent } from './sidebar.component';
import { SidebarLayoutService } from './sidebar-layout.service';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [RouterOutlet, TranslateModule, NotificationDropdownComponent, SidebarComponent],
  template: `
    <!-- الحل: منع overflow على body level -->
    <div class="min-h-screen bg-gray-50 overflow-x-hidden" [dir]="i18n.dir()">
      @if (layout.isMobile() && layout.mobileOpen()) {
        <button
          type="button"
          class="fixed inset-0 z-40 bg-[#0c0725]/50 backdrop-blur-sm transition-opacity duration-300 ease-in-out"
          [attr.aria-label]="'sidebar.closeMenu' | translate"
          (click)="layout.closeMobile()">
        </button>
      }

      <app-sidebar />

      @if (!layout.isSidebarOpen()) {
        <button
          type="button"
          class="fixed top-1/2 z-[60] flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-gradient-to-br from-[#2cdc78] to-[#25b868] text-[#0c0725] shadow-lg shadow-[#2cdc78]/30 ring-2 ring-white/90 transition-all duration-300 ease-in-out hover:scale-105 hover:shadow-xl focus:outline-none focus-visible:ring-4 focus-visible:ring-[#2cdc78]/50"
          [class.right-4]="i18n.dir() === 'rtl'"
          [class.left-4]="i18n.dir() === 'ltr'"
          [attr.aria-label]="'sidebar.openMenu' | translate"
          (click)="layout.open()">
          <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/>
          </svg>
        </button>
      }

      <!-- ✅ الحل: استخدم width بدل margin -->
      <div
        class="min-h-screen transition-[margin,width] duration-300 ease-in-out overflow-x-hidden"
        [style.width]="layout.isSidebarOpen() && !layout.isMobile() 
          ? 'calc(100% - ' + layout.contentInset(i18n.dir()) + ')' 
          : '100%'"
        [style.margin-right]="i18n.dir() === 'rtl' && layout.isSidebarOpen() && !layout.isMobile() 
          ? layout.contentInset('rtl') 
          : null"
        [style.margin-left]="i18n.dir() === 'ltr' && layout.isSidebarOpen() && !layout.isMobile() 
          ? layout.contentInset('ltr') 
          : null">

        <header class="sticky top-0 z-30 border-b border-gray-200 bg-white/80 shadow-sm backdrop-blur-lg">
          <div class="flex items-center justify-between gap-3 px-4 py-3 sm:px-6 sm:py-4">
            <div class="flex min-w-0 items-center gap-2 sm:gap-3">
              @if (layout.isMobile()) {
                <button
                  type="button"
                  class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-700 transition hover:bg-gray-50"
                  [attr.aria-label]="'sidebar.openMenu' | translate"
                  (click)="layout.toggle()">
                  <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/>
                  </svg>
                </button>
              }

              <button
                type="button"
                class="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 transition hover:bg-gray-50 sm:px-4"
                (click)="i18n.toggleLanguage()">
                <svg class="h-5 w-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129"/>
                </svg>
                <span class="hidden text-sm font-medium sm:inline">
                  {{ i18n.language() === 'ar' ? ('lang.toggleToEn' | translate) : ('lang.toggleToAr' | translate) }}
                </span>
              </button>
            </div>

            <div class="flex shrink-0 items-center gap-2 sm:gap-4">
              <app-notification-dropdown />

              <div class="flex items-center gap-2 rounded-lg bg-gray-100 px-2 py-2 sm:gap-3 sm:px-4">
                <div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#2cdc78] to-[#2cdc78]/70 text-sm font-bold text-[#0c0725]">
                  {{ getUserInitial() }}
                </div>
                <div class="hidden min-w-0 md:block">
                  <p class="truncate text-sm font-semibold text-gray-900">{{ getUserName() }}</p>
                  <p class="truncate text-xs text-gray-600">{{ auth.role() }}</p>
                </div>
              </div>
            </div>
          </div>
        </header>

        <!-- ✅ أهم تغيير: overflow-x-hidden و max-width 100% -->
        <main class="w-full max-w-full overflow-x-hidden p-4 sm:p-6">
          <router-outlet />
        </main>
      </div>
    </div>
  `,
  // ✅ أضف الـ styles دي
  styles: [`
    :host {
      display: block;
      width: 100%;
      overflow-x: hidden;
    }
  `]
})
export class MainLayoutComponent {
  readonly i18n = inject(I18nService);
  readonly auth = inject(AuthStore);
  readonly layout = inject(SidebarLayoutService);

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