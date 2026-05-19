import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-role-dashboard',
  standalone: true,
  imports: [TranslatePipe],
  template: `
    <section
      class="w-full min-w-0 rounded-2xl border border-black/10 bg-white p-4 sm:p-6"
    >
      <h1 class="text-base font-semibold sm:text-lg">
        {{ titleKey() | translate }}
      </h1>
      <p class="mt-2 wrap-break-word text-sm text-black/70">
        {{ 'app.noData' | translate }}
      </p>
    </section>
  `,
})
export class RoleDashboardComponent {
  private readonly route = inject(ActivatedRoute);

  readonly titleKey = signal<string>(
    this.route.snapshot.data['titleKey'] ?? 'sidebar.dashboard'
  );
}