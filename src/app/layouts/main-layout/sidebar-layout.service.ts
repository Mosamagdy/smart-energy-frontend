import { Injectable, signal, computed, DestroyRef, inject } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class SidebarLayoutService {
  private readonly destroyRef = inject(DestroyRef);

  readonly expandedWidthPx = 280;

  readonly isCollapsed = signal(false);
  readonly mobileOpen = signal(false);
  private readonly isMobileView = signal(false);
  readonly isMobile = this.isMobileView.asReadonly();

  readonly isSidebarOpen = computed(() =>
    this.isMobileView() ? this.mobileOpen() : !this.isCollapsed()
  );

  constructor() {
    if (typeof window === 'undefined') {
      return;
    }

    const mq = window.matchMedia('(max-width: 1023px)');
    const sync = () => {
      const mobile = mq.matches;
      this.isMobileView.set(mobile);
      if (!mobile) {
        this.mobileOpen.set(false);
      }
    };

    sync();
    mq.addEventListener('change', sync);
    this.destroyRef.onDestroy(() => mq.removeEventListener('change', sync));
  }

  toggle(): void {
    if (this.isMobileView()) {
      this.mobileOpen.update((open) => !open);
      return;
    }
    this.isCollapsed.update((collapsed) => !collapsed);
  }

  open(): void {
    if (this.isMobileView()) {
      this.mobileOpen.set(true);
      return;
    }
    this.isCollapsed.set(false);
  }

  close(): void {
    if (this.isMobileView()) {
      this.mobileOpen.set(false);
      return;
    }
    this.isCollapsed.set(true);
  }

  closeMobile(): void {
    this.mobileOpen.set(false);
  }

  /** الدالة المطلوبة لحل المشكلة */
  contentInset(dir: 'rtl' | 'ltr'): string {
    if (this.isMobileView() || !this.isSidebarOpen()) {
      return '0px';
    }
    return `${this.expandedWidthPx}px`;
  }
}