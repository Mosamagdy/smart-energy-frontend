import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-auth-layout',
  standalone: true,
  imports: [RouterOutlet],
  template: `
    <div class="min-h-dvh bg-gray-50 text-company-text">
      <main class="mx-auto flex max-w-xl flex-col gap-6 px-4 py-10">
        <router-outlet />
      </main>
    </div>
  `
})
export class AuthLayoutComponent {}

