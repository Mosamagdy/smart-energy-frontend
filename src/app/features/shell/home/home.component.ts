import { Component } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [TranslatePipe],
  template: `
    <section class="rounded-2xl border border-black/10 bg-white p-6">
      <h1 class="text-lg font-semibold">
        {{ 'app.title' | translate }}
      </h1>
      <p class="mt-2 text-sm text-black/70">
        Core shell is running. Next phase will implement Auth Flow screens.
      </p>
    </section>
  `
})
export class HomeComponent {}

