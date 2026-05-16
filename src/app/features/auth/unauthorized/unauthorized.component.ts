import { Component } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-unauthorized',
  standalone: true,
  imports: [TranslatePipe],
  template: `
    <section class="rounded-2xl border border-black/10 bg-white p-6">
      <h1 class="text-lg font-semibold">{{ 'app.unauthorized' | translate }}</h1>
      <p class="mt-2 text-sm text-black/70">{{ 'app.noData' | translate }}</p>
    </section>
  `,
})
export class UnauthorizedComponent {}

