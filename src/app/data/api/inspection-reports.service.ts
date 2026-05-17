import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpEventType, HttpRequest } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment.prod';

export interface InspectionReport {
  id: number;
  lead_id: number;
  user_id: number;
  report_text: string | null;
  file_url: string | null;
  images_urls: string[];
  uploader_name: string;
  uploader_email: string;
  uploader_role: string;
  created_at: string;
}

@Injectable({ providedIn: 'root' })
export class InspectionReportsService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/leads`;

  createReport(
    leadId: number,
    data: {
      report_text?: string;
      file_url?: string;
      images_urls?: string[];
    }
  ): Observable<{ status: string; data: { report: InspectionReport } }> {
    return this.http.post<{ status: string; data: { report: InspectionReport } }>(
      `${this.apiUrl}/${leadId}/reports`,
      data
    );
  }

  createReportWithFile(
    leadId: number,
    formData: FormData,
    progressCallback?: (progress: number) => void
  ): Observable<{ status: string; data: { report: InspectionReport } }> {
    const req = new HttpRequest(
      'POST',
      `${this.apiUrl}/${leadId}/reports`,
      formData,
      { reportProgress: true, responseType: 'json' }
    );

    return new Observable<{ status: string; data: { report: InspectionReport } }>(observer => {
      this.http.request(req).subscribe({
        next: (event) => {
          if (event.type === HttpEventType.UploadProgress) {
            const percentDone = Math.round((event.loaded * 100) / (event.total || 100));
            if (progressCallback) progressCallback(percentDone);
          } else if (event.type === HttpEventType.Response) {
            observer.next(event.body as { status: string; data: { report: InspectionReport } });
            observer.complete();
          }
        },
        error: (err) => observer.error(err)
      });
    });
  }

  getReports(leadId: number): Observable<{
    status: string;
    data: { reports: InspectionReport[]; count: number };
  }> {
    return this.http.get<{
      status: string;
      data: { reports: InspectionReport[]; count: number };
    }>(`${this.apiUrl}/${leadId}/reports`);
  }

  deleteReport(reportId: number): Observable<{ status: string; message: string }> {
    return this.http.delete<{ status: string; message: string }>(
      `${environment.apiUrl}/inspection-reports/${reportId}`
    );
  }
}