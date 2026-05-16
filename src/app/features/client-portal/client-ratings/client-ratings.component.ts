import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ClientPortalService, ProjectRating, ClientProject } from '../../../data/api/client-portal.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-client-ratings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './client-ratings.component.html',
  styleUrls: ['./client-ratings.component.css']
})
export class ClientRatingsComponent implements OnInit {
  private clientService = inject(ClientPortalService);
  private toast = inject(ToastService);

  ratings = signal<ProjectRating[]>([]);
  projects = signal<ClientProject[]>([]);
  loading = signal(true);
  showRatingModal = signal(false);
  selectedProject = signal<ClientProject | null>(null);
  ratingValue = 5;
  ratingComment = '';
  isAnonymous = false;
  submitting = signal(false);

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.loading.set(true);
    Promise.all([
      this.clientService.getMyRatings().toPromise(),
      this.clientService.getProjects().toPromise()
    ]).then(([ratings, projects]) => {
      this.ratings.set(ratings?.data || []);
      this.projects.set(projects?.data || []);
      this.loading.set(false);
    }).catch(() => {
      this.toast.error('فشل في تحميل البيانات');
      this.loading.set(false);
    });
  }

  openRatingModal(project: ClientProject): void {
    this.selectedProject.set(project);
    this.showRatingModal.set(true);
    this.ratingValue = 5;
    this.ratingComment = '';
    this.isAnonymous = false;
  }

  submitRating(): void {
    if (!this.selectedProject()) return;

    this.submitting.set(true);
    this.clientService.submitRating(this.selectedProject()!.id, {
      rating: this.ratingValue,
      comment: this.ratingComment,
      is_anonymous: this.isAnonymous
    }).subscribe({
      next: () => {
        this.submitting.set(false);
        this.showRatingModal.set(false);
        this.toast.success('تم تقديم التقييم بنجاح');
        this.loadData();
      },
      error: (err) => {
        this.submitting.set(false);
        this.toast.error(err.error?.message || 'فشل في تقديم التقييم');
      }
    });
  }

  getStars(rating: number): number[] {
    return Array(5).fill(0).map((_, i) => i < rating ? 1 : 0);
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' });
  }
}
