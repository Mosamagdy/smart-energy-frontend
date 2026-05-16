import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

// ============================================
// INTERFACES
// ============================================

export interface ClientProfile {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  status: string;
  created_at: string;
}

export interface ClientQuotation {
  id: number;
  status: string;
  total_price: number;
  discount: number;
  tax: number;
  client_response: 'pending' | 'client_approved' | 'client_rejected';
  payment_status: string;
  created_at: string;
  client_name: string;
  boq_data?: any;
   comments?: string;  
}

export interface ClientProject {
  id: number;
  name: string;
  description: string;
  status: string;
  budget: number;
  start_date: string;
  end_date: string;
  created_at: string;
  tasks_count?: number;
  completed_tasks?: number;
}

export interface ClientProjectDetail extends ClientProject {
  tasks: ProjectTask[];
}

export interface ProjectTask {
  id: number;
  title: string;
  description: string;
  status: string;
  priority: string;
  start_date: string;
  due_date: string;
  completed_at: string;
  assigned_to_name: string;
}

export interface ClientInvoice {
  id: number;
  invoice_number: string;
  status: string;
  total_amount: number;
  paid_amount: number;
  due_date: string;
  issue_date: string;
  project_name?: string;
}

export interface ClientInvoiceDetail extends ClientInvoice {
  line_items: any[];
  payment_history: PaymentRecord[];
}

export interface PaymentRecord {
  id: number;
  amount: number;
  payment_date: string;
  payment_method: string;
  notes: string;
}

export interface ClientAsset {
  id: number;
  asset_name: string;
  asset_type: string;
  location: string;
  installation_date: string;
  status: string;
  warranty_until: string;
}

export interface MaintenanceVisit {
  id: number;
  visit_date: string;
  status: string;
  technician_name: string;
  notes: string;
  asset_name: string;
}

export interface MaintenanceContract {
  id: number;
  contract_number: string;
  status: string;
  start_date: string;
  end_date: string;
  value: number;
  asset_name: string;
}

export interface SupportMessage {
  id: number;
  message: string;
  sender_id: number;
  sender_name: string;
  sender_role: string;
  is_read: boolean;
  created_at: string;
  parent_message_id: number | null;
}

export interface RatingEligibility {
  eligible: boolean;
  reason: string;
  days_since_completion: number;
}

export interface ProjectRating {
  id: number;
  project_id: number;
  project_name: string;
  rating: number;
  comment: string;
  is_anonymous: boolean;
  created_at: string;
}

// ============================================
// SERVICE
// ============================================

@Injectable({
  providedIn: 'root'
})
export class ClientPortalService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/client`;

  // ============================================
  // PROFILE
  // ============================================

  getProfile(): Observable<{ status: string; data: ClientProfile }> {
    return this.http.get<{ status: string; data: ClientProfile }>(`${this.baseUrl}/profile`);
  }

  // ============================================
  // QUOTATIONS
  // ============================================

  getMyQuotations(): Observable<{ status: string; count: number; data: ClientQuotation[] }> {
    return this.http.get<{ status: string; count: number; data: ClientQuotation[] }>(`${this.baseUrl}/my-quotations`);
  }

  respondToQuotation(
    quotationId: number,
    response: { status: 'client_approved' | 'client_rejected'; rejection_reason?: string }
  ): Observable<{ status: string; data: ClientQuotation }> {
    return this.http.patch<{ status: string; data: ClientQuotation }>(
      `${this.baseUrl}/quotations/${quotationId}/respond`,
      response
    );
  }

  // ============================================
  // PROJECTS
  // ============================================

  getProjects(): Observable<{ status: string; count: number; data: ClientProject[] }> {
    return this.http.get<{ status: string; count: number; data: ClientProject[] }>(`${this.baseUrl}/projects`);
  }

  getProject(id: number): Observable<{ status: string; data: ClientProjectDetail }> {
    return this.http.get<{ status: string; data: ClientProjectDetail }>(`${this.baseUrl}/projects/${id}`);
  }

  // ============================================
  // INVOICES
  // ============================================

  getInvoices(): Observable<{ status: string; count: number; data: ClientInvoice[] }> {
    return this.http.get<{ status: string; count: number; data: ClientInvoice[] }>(`${this.baseUrl}/invoices`);
  }

  getInvoice(id: number): Observable<{ status: string; data: ClientInvoiceDetail }> {
    return this.http.get<{ status: string; data: ClientInvoiceDetail }>(`${this.baseUrl}/invoices/${id}`);
  }

  // ============================================
  // MAINTENANCE
  // ============================================

  getAssets(): Observable<{ status: string; count: number; data: ClientAsset[] }> {
    return this.http.get<{ status: string; count: number; data: ClientAsset[] }>(`${this.baseUrl}/maintenance/assets`);
  }

  getMaintenanceVisits(): Observable<{ status: string; count: number; data: MaintenanceVisit[] }> {
    return this.http.get<{ status: string; count: number; data: MaintenanceVisit[] }>(
      `${this.baseUrl}/maintenance/visits`
    );
  }

  getMaintenanceContracts(): Observable<{ status: string; count: number; data: MaintenanceContract[] }> {
    return this.http.get<{ status: string; count: number; data: MaintenanceContract[] }>(
      `${this.baseUrl}/maintenance/contracts`
    );
  }

  // ============================================
  // SUPPORT MESSAGES
  // ============================================

  getProjectMessages(projectId: number): Observable<{ status: string; count: number; data: SupportMessage[] }> {
    return this.http.get<{ status: string; count: number; data: SupportMessage[] }>(
      `${this.baseUrl}/projects/${projectId}/messages`
    );
  }

  sendMessage(
    projectId: number,
    message: { message: string; parent_message_id?: number }
  ): Observable<{ status: string; data: SupportMessage }> {
    return this.http.post<{ status: string; data: SupportMessage }>(
      `${this.baseUrl}/projects/${projectId}/messages`,
      message
    );
  }

  markMessageRead(messageId: number): Observable<{ status: string; data: SupportMessage }> {
    return this.http.patch<{ status: string; data: SupportMessage }>(
      `${this.baseUrl}/messages/${messageId}/read`,
      {}
    );
  }

  getUnreadCount(): Observable<{ status: string; data: { unread_count: number } }> {
    return this.http.get<{ status: string; data: { unread_count: number } }>(
      `${this.baseUrl}/messages/unread-count`
    );
  }

  // ============================================
  // RATINGS
  // ============================================

  checkRatingEligibility(
    projectId: number
  ): Observable<{ status: string; data: RatingEligibility }> {
    return this.http.get<{ status: string; data: RatingEligibility }>(
      `${this.baseUrl}/projects/${projectId}/rating-eligibility`
    );
  }

  submitRating(
    projectId: number,
    rating: { rating: number; comment?: string; is_anonymous?: boolean }
  ): Observable<{ status: string; data: ProjectRating }> {
    return this.http.post<{ status: string; data: ProjectRating }>(
      `${this.baseUrl}/projects/${projectId}/ratings`,
      rating
    );
  }

  getMyRatings(): Observable<{ status: string; count: number; data: ProjectRating[] }> {
    return this.http.get<{ status: string; count: number; data: ProjectRating[] }>(
      `${this.baseUrl}/ratings`
    );
  }
}
