import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule, DatePipe, DecimalPipe } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { EmployeeService, Employee } from '../../../data/api/employee.service';
import { environment } from '../../../../environments/environment.prod';

@Component({
  selector: 'app-employee-details',
  standalone: true,
  imports: [CommonModule, DecimalPipe],
  templateUrl: './employee-details.component.html',
  styleUrls: ['./employee-details.component.css']
})
export class EmployeeDetailsComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private employeeService = inject(EmployeeService);

  employee = signal<Employee | null>(null);
  loading = signal(true);
  error = signal<string | null>(null);

  ngOnInit(): void {
    const employeeId = this.route.snapshot.paramMap.get('id');
    if (employeeId) {
      this.loadEmployee(+employeeId);
    }
  }

  private loadEmployee(id: number): void {
    this.loading.set(true);
    this.employeeService.getEmployeeById(id).subscribe({
      next: (response) => {
        // API returns { data: { employee: Employee } }
        const emp = response.data.employee;

        // Clean salary fields - remove commas and convert to float
        const salaryFields: (keyof Employee)[] = [
          'basic_salary',
          'housing_allowance',
          'transport_allowance',
          'other_allowances'
        ];

        salaryFields.forEach(field => {
          if (emp[field] !== undefined && emp[field] !== null) {
            (emp as any)[field] = parseFloat(
              String(emp[field]).replace(/,/g, '')
            );
          }
        });

        this.employee.set(emp);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Failed to load employee:', err);
        this.error.set('فشل في تحميل بيانات الموظف');
        this.loading.set(false);
      }
    });
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-700';
      case 'inactive': return 'bg-red-100 text-red-700';
      case 'on_leave': return 'bg-yellow-100 text-yellow-700';
      case 'terminated': return 'bg-gray-100 text-gray-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  }

  getStatusText(status: string): string {
    switch (status) {
      case 'active': return 'نشط';
      case 'inactive': return 'غير نشط';
      case 'on_leave': return 'في إجازة';
      case 'terminated': return 'منهي خدمة';
      default: return status;
    }
  }

  hasDocuments(): boolean {
    const emp = this.employee();
    return !!(emp?.passport_file_path || emp?.national_id_file_path ||
              emp?.residence_file_path || emp?.contract_file_path);
  }

  getFileUrl(filePath: string): string {
    if (!filePath) return '#';
    const filename = filePath.split('\\').pop() || filePath.split('/').pop() || filePath;
    return `${environment.apiUrl}/employees/${this.employee()?.id}/documents/${filename}`;
  }

  goBack(): void {
    this.router.navigate(['/hr/employees']);
  }
}