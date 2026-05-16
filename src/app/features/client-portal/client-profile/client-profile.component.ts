import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ClientPortalService, ClientProfile } from '../../../data/api/client-portal.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-client-profile',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './client-profile.component.html',
  styleUrls: ['./client-profile.component.css']
})
export class ClientProfileComponent implements OnInit {
  private clientService = inject(ClientPortalService);
  private toast = inject(ToastService);

  profile = signal<ClientProfile | null>(null);
  loading = signal(true);

  ngOnInit(): void {
    this.loadProfile();
  }

  loadProfile(): void {
    this.loading.set(true);
    this.clientService.getProfile().subscribe({
      next: (response) => {
        this.profile.set(response.data);
        this.loading.set(false);
      },
      error: (err) => {
        this.toast.error('فشل في تحميل البيانات الشخصية');
        this.loading.set(false);
      }
    });
  }
}
