import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ClientPortalService, ClientProject } from '../../../data/api/client-portal.service';
import { ToastService } from '../../../core/services/toast.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-client-messages',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './client-messages.component.html',
  styleUrls: ['./client-messages.component.css']
})
export class ClientMessagesComponent implements OnInit {
  private clientService = inject(ClientPortalService);
  private router = inject(Router);
  private toast = inject(ToastService);

  projects = signal<ClientProject[]>([]);
  loading = signal(true);

  ngOnInit(): void {
    this.loadProjects();
  }

  loadProjects(): void {
    this.loading.set(true);
    this.clientService.getProjects().subscribe({
      next: (response) => {
        this.projects.set(response.data);
        this.loading.set(false);
      },
      error: (err) => {
        this.toast.error('فشل في تحميل المشاريع');
        this.loading.set(false);
      }
    });
  }

  openChat(project: ClientProject): void {
    this.router.navigate(['/client/projects', project.id], { queryParams: { tab: 'messages' } });
  }
}
