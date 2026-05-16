import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Lead {
  id: number;
  owner_id?: number;
  client_name: string;
  contact_email: string;
  contact_phone: string;
  service_type: string;
  location?: string;
  source?: string;
  status: 'new' | 'contacted' | 'survey_requested' | 'inspection_assigned' | 'inspection_completed' | 'quotation_sent' | 'won' | 'lost' | 'qualified' | 'proposal_sent' | 'negotiation';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  estimated_value?: number;
  notes?: string;

  // Database fields
  technical_dept_id?: number;
  assigned_sales_rep_id?: number;
  assigned_engineer_id?: number;
  
  // Joined fields (display names)
  technical_dept_name?: string;
  assigned_sales_rep_name?: string;
  assigned_sales_rep_email?: string;
  assigned_sales_rep_phone?: string;
  assigned_engineer_name?: string;
  assigned_engineer_email?: string;
  assigned_engineer_phone?: string;

  rejection_comment?: string;

  // Joined fields from users table (via LEFT JOIN)
  owner_first_name?: string;
  owner_last_name?: string;
  owner_email?: string;

  created_at: string;
  updated_at: string;
}

export interface CreateLeadDto {
  client_name: string;
  service_type: string;

  contact_email?: string;
  contact_phone?: string;

  source?: string;

  priority?: 'low' | 'medium' | 'high' | 'urgent';

  notes?: string;

  // CRITICAL: Must match backend column name exactly
  technical_dept_id?: number;
}

export interface UpdateLeadDto {
  client_name?: string;
  contact_email?: string;
  contact_phone?: string;

  source?: string;

  priority?: 'low' | 'medium' | 'high' | 'urgent';

  status?: 'new' | 'contacted' | 'qualified' | 'proposal_sent' | 'negotiation' | 'won' | 'lost';

  notes?: string;
}

export type LeadStatus = Lead['status'];
export type LeadPriority = Lead['priority'];

@Injectable({ providedIn: 'root' })
export class LeadsService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/leads`;

  getAllLeads(params?: { status?: string; priority?: string; owner_id?: number }): Observable<{ status: string; data: { leads: Lead[]; count: number } }> {
    let httpParams = new HttpParams();
    
    if (params?.status) httpParams = httpParams.set('status', params.status);
    if (params?.priority) httpParams = httpParams.set('priority', params.priority);
    if (params?.owner_id) httpParams = httpParams.set('owner_id', params.owner_id.toString());

    return this.http.get<{ status: string; data: { leads: Lead[]; count: number } }>(this.apiUrl, { params: httpParams });
  }

  getMyTasks(): Observable<{ status: string; data: { leads: Lead[]; count: number } }> {
    return this.http.get<{ status: string; data: { leads: Lead[]; count: number } }>(`${this.apiUrl}/my-tasks`);
  }

  getLeadById(id: number): Observable<{ status: string; data: { lead: Lead } }> {
    return this.http.get<{ status: string; data: { lead: Lead } }>(`${this.apiUrl}/${id}`);
  }

  createLead(data: CreateLeadDto): Observable<{ status: string; message?: string; data: { lead: Lead } }> {
    return this.http.post<{ status: string; message?: string; data: { lead: Lead } }>(this.apiUrl, data);
  }

  updateLead(id: number, data: UpdateLeadDto): Observable<{ status: string; message?: string; data: { lead: Lead } }> {
    return this.http.patch<{ status: string; message?: string; data: { lead: Lead } }>(`${this.apiUrl}/${id}`, data);
  }

  assignSalesRep(id: number, salesRepId: number): Observable<{ status: string; message?: string; data: { lead: Lead } }> {
    return this.http.patch<{ status: string; message?: string; data: { lead: Lead } }>(`${this.apiUrl}/${id}/assign`, {
      sales_rep_id: salesRepId
    });
  }

  removeSalesRep(id: number): Observable<{ status: string; message?: string; data: { lead: Lead } }> {
    return this.http.patch<{ status: string; message?: string; data: { lead: Lead } }>(`${this.apiUrl}/${id}/remove-sales-rep`, {});
  }

  assignEngineer(id: number, engineerId: number): Observable<{ status: string; message?: string; data: { lead: Lead } }> {
    return this.http.patch<{ status: string; message?: string; data: { lead: Lead } }>(`${this.apiUrl}/${id}/assign-engineer`, {
      engineer_id: engineerId
    });
  }

  removeEngineer(id: number): Observable<{ status: string; message?: string; data: { lead: Lead } }> {
    return this.http.patch<{ status: string; message?: string; data: { lead: Lead } }>(`${this.apiUrl}/${id}/remove-engineer`, {});
  }

  updateLeadStatus(id: number, status: LeadStatus, notes?: string): Observable<{ status: string; message?: string; data: { lead: Lead } }> {
    return this.http.patch<{ status: string; message?: string; data: { lead: Lead } }>(`${this.apiUrl}/${id}/status`, {
      status,
      notes
    });
  }

  getLeadStats(): Observable<{ 
    status: string; 
    data: {
      total: number;
      by_status: Record<string, number>;
      by_priority: Record<string, number>;
    }
  }> {
    return this.http.get<{ status: string; data: any }>(`${this.apiUrl}/stats`);
  }

  deleteLead(id: number): Observable<{ status: string; message: string }> {
    return this.http.delete<{ status: string; message: string }>(`${this.apiUrl}/${id}`);
  }

  // CRM Interaction Methods
  createInteraction(leadId: number, data: {
    interaction_type: 'call' | 'email' | 'meeting' | 'note';
    description: string;
    next_follow_up_date?: string;
  }): Observable<{ status: string; message: string; data: { interaction: any } }> {
    return this.http.post<{ status: string; message: string; data: { interaction: any } }>(
      `${this.apiUrl}/${leadId}/interactions`,
      data
    );
  }

  getInteractions(leadId: number): Observable<{ status: string; data: { interactions: any[] } }> {
    return this.http.get<{ status: string; data: { interactions: any[] } }>(
      `${this.apiUrl}/${leadId}/interactions`
    );
  }

  requestSurvey(leadId: number): Observable<{ status: string; message: string; data: { lead: Lead } }> {
    return this.http.patch<{ status: string; message: string; data: { lead: Lead } }>(
      `${this.apiUrl}/${leadId}/request-survey`,
      {}
    );
  }

  getUpcomingFollowUps(daysAhead = 3): Observable<{ status: string; data: { followUps: any[] } }> {
    return this.http.get<{ status: string; data: { followUps: any[] } }>(
      `${this.apiUrl}/follow-ups/upcoming?days=${daysAhead}`
    );
  }

  getCustomerStatement(leadId: number): Observable<{ status: string; message?: string; data: any }> {
    return this.http.get<{ status: string; message?: string; data: any }>(`${this.apiUrl}/${leadId}/customer-statement`);
  }
}