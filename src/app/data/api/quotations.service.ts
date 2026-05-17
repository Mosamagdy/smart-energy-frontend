import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment.prod';

export interface Quotation {
  id: number;
  inspection_report_id: number;
  lead_id: number;
  created_by: number;
  created_by_name?: string;
  client_name?: string;
  service_type?: string;
  file_url?: string;
  boq_data: {
    items: Array<{
      name: string;
      description: string;
      quantity: number;
      unit_price: number;
      total: number;
    }>;
    labor_cost?: number;
    equipment_cost?: number;
    subtotal?: number;
    final_price?: number;
    discount?: number;
    tax?: number;
  };
  total_price: number;
  discount: number;
  tax: number;
  final_price?: number;
  status: string;
  client_response?: string;
  payment_status?: string;
  downpayment_amount?: number;
  project_id?: number;
  finance_review?: any;
  gm_review?: any;
  details?: any;
  comments: string;
  created_at: string;
  updated_at: string;
}

@Injectable({
  providedIn: 'root'
})
export class QuotationsService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/quotations`;

  /**
   * Get all quotations (for GM, Finance, Quotation Specialist)
   */
  getAllQuotations(): Observable<{
    status: string;
    data: { quotations: Quotation[]; count: number };
  }> {
    return this.http.get<{
      status: string;
      data: { quotations: Quotation[]; count: number };
    }>(this.apiUrl);
  }

  /**
   * Get quotations for a specific lead
   */
  getQuotationsByLead(leadId: number): Observable<{
    status: string;
    data: { quotations: Quotation[]; count: number };
  }> {
    return this.http.get<{
      status: string;
      data: { quotations: Quotation[]; count: number };
    }>(`${this.apiUrl}/leads/${leadId}/quotations`);
  }

  /**
   * Get quotation by ID
   */
  getQuotationById(id: number): Observable<{
    status: string;
    data: { quotation: Quotation };
  }> {
    return this.http.get<{
      status: string;
      data: { quotation: Quotation };
    }>(`${this.apiUrl}/${id}`);
  }

  /**
   * Create quotation with BOQ
   */
  createQuotation(data: {
    inspection_report_id: number;
    boq_data: any;
    total_price?: number;
    discount?: number;
    tax?: number;
    details?: any;
    comments?: string;
  }): Observable<{
    status: string;
    data: { quotation: Quotation };
  }> {
    return this.http.post<{
      status: string;
      data: { quotation: Quotation };
    }>(this.apiUrl, data);
  }

  /**
   * Create quotation with file upload (BOQ PDF/Document)
   */
  createQuotationWithFile(
    formData: FormData,
    progressCallback?: (progress: number) => void
  ): Observable<{
    status: string;
    data: { quotation: Quotation };
  }> {
    return new Observable(observer => {
      const xhr = new XMLHttpRequest();
      
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable && progressCallback) {
          const progress = Math.round((event.loaded / event.total) * 100);
          progressCallback(progress);
        }
      });

      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const response = JSON.parse(xhr.response);
            observer.next(response);
            observer.complete();
          } catch (error) {
            observer.error(error);
          }
        } else {
          // Handle 401 and 403 errors specifically
          if (xhr.status === 401) {
            observer.error(new Error('غير مصرح - يرجى تسجيل الدخول مرة أخرى'));
          } else if (xhr.status === 403) {
            observer.error(new Error('ممنوع - ليس لديك صلاحية'));
          } else {
            observer.error(new Error(xhr.statusText || `HTTP ${xhr.status}`));
          }
        }
      });

      xhr.addEventListener('error', () => {
        observer.error(new Error('فشل في الاتصال بالخادم'));
      });

      xhr.open('POST', this.apiUrl);
      
      // Add auth token - CORRECT KEY: 'erp.jwt'
      const token = localStorage.getItem('erp.jwt');
      console.log('[Quotation Upload] Token present:', !!token);
      
      if (token) {
        xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      } else {
        console.error('[Quotation Upload] No token found in localStorage!');
        observer.error(new Error('التوكن غير موجود - يرجى تسجيل الدخول'));
        return;
      }

      // DO NOT set Content-Type - let browser set it with boundary for FormData
      // xhr.setRequestHeader('Content-Type', 'multipart/form-data'); // ❌ WRONG

      console.log('[Quotation Upload] Sending request to:', this.apiUrl);
      xhr.send(formData);
    });
  }

  /**
   * Update quotation (before approval)
   */
  updateQuotation(id: number, data: any): Observable<{
    status: string;
    data: { quotation: Quotation };
  }> {
    return this.http.patch<{
      status: string;
      data: { quotation: Quotation };
    }>(`${this.apiUrl}/${id}`, data);
  }

  /**
   * Finance review
   * Backend expects: { action: 'approve' | 'reject', rejection_comment?: string }
   */
  financeReview(id: number, data: {
    status: 'approved' | 'rejected';
    comments?: string;
  }): Observable<{
    status: string;
    data: { quotation: Quotation };
  }> {
    // Map frontend format to backend format
    const backendData = {
      action: data.status === 'approved' ? 'approve' : 'reject',
      rejection_comment: data.comments || null
    };
    
    return this.http.patch<{
      status: string;
      data: { quotation: Quotation };
    }>(`${this.apiUrl}/${id}/finance-review`, backendData);
  }

  /**
   * GM review (final approval)
   * Backend expects: { action: 'approve' | 'reject', rejection_comment?: string }
   */
  gmReview(id: number, data: {
    status: 'approved' | 'rejected';
    comments?: string;
  }): Observable<{
    status: string;
    data: { quotation: Quotation };
  }> {
    // Map frontend format to backend format
    const backendData = {
      action: data.status === 'approved' ? 'approve' : 'reject',
      rejection_comment: data.comments || null
    };
    
    return this.http.patch<{
      status: string;
      data: { quotation: Quotation };
    }>(`${this.apiUrl}/${id}/gm-review`, backendData);
  }

  /**
   * Delete quotation
   */
  deleteQuotation(id: number): Observable<{
    status: string;
  }> {
    return this.http.delete<{
      status: string;
    }>(`${this.apiUrl}/${id}`);
  }

  /**
   * Send quotation to client (auto-creates client account if needed)
   */
  sendToClient(id: number): Observable<{
    status: string;
    data: { 
      quotation: Quotation;
      client_user_id: number;
      temp_password?: string;
    };
  }> {
    return this.http.patch<{
      status: string;
      data: { 
        quotation: Quotation;
        client_user_id: number;
        temp_password?: string;
      };
    }>(`${this.apiUrl}/${id}/send-to-client`, {});
  }

  /**
   * Convert approved quotation to project
   */
  convertToProject(id: number): Observable<{
    status: string;
    data: { 
      project: any;
      tasks_created: number;
      quotation_id: number;
    };
  }> {
    return this.http.post<{
      status: string;
      data: { 
        project: any;
        tasks_created: number;
        quotation_id: number;
      };
    }>(`${this.apiUrl}/${id}/convert-to-project`, {});
  }

  /**
   * Confirm downpayment received
   */
  confirmDownpayment(id: number, amount: number): Observable<{
    status: string;
    data: { quotation: Quotation };
  }> {
    return this.http.patch<{
      status: string;
      data: { quotation: Quotation };
    }>(`${this.apiUrl}/${id}/confirm-downpayment`, { amount });
  }
}
