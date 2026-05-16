import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-role-dashboard',
  standalone: true,
  imports: [TranslatePipe],
  template: `
    <section class="rounded-2xl border border-black/10 bg-white p-6">
      <h1 class="text-lg font-semibold">
        {{ titleKey() | translate }}
      </h1>
      <p class="mt-2 text-sm text-black/70">
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

