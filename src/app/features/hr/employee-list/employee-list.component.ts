import { Component, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, NavigationEnd } from '@angular/router';
import { HttpClient, HttpParams } from '@angular/common/http';
import { TranslateModule } from '@ngx-translate/core';
import { environment } from '../../../../environments/environment.prod';
import { AuthStore } from '../../../core/auth/auth.store';
import { filter } from 'rxjs/operators';
import { Subscription } from 'rxjs';

interface Employee {
id: number;
employee_number: string;
first_name: string;
last_name: string;
arabic_name?: string;
job_title?: string;
department_name?: string;
basic_salary: number;
housing_allowance: number;
transport_allowance: number;
national_id?: string;
passport_number?: string;
passport_expiry?: string;
residence_expiry?: string;
bank_account?: string;
iban?: string;
contract_start_date?: string;
contract_end_date?: string;
status: string;
personal_email?: string;
personal_phone?: string;
system_email?: string;
role_name?: string;
created_at: string;
}

@Component({
selector: 'app-employee-list',
standalone: true,
imports: [CommonModule, RouterLink, TranslateModule],
templateUrl: './employee-list.component.html',
styleUrls: ['./employee-list.component.css']
})
export class EmployeeListComponent implements OnInit, OnDestroy {
private http = inject(HttpClient);
private auth = inject(AuthStore);
private router = inject(Router);

employees = signal<Employee[]>([]);
loading = signal(false);
error = signal<string | null>(null);

// TASK 5-C: Smart Filter Signals
activeFilter = signal<'all' | 'contracts' | 'passports' | 'residences'>('all');
expiringResidencesCount = signal(0);

// FIX: Router subscription for auto-refresh
private routerSubscription!: Subscription;

ngOnInit(): void {
  this.loadEmployees();
  
  // FIX: Listen for navigation events to refresh list when returning from edit
  this.routerSubscription = this.router.events
    .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
    .subscribe((event) => {
      // Refresh list when navigating back to employee list
      if (event.url === '/hr/employees' || event.url.startsWith('/hr/employees?')) {
        console.log('[EmployeeList] Navigation detected, refreshing list...');
        this.loadEmployees();
      }
    });
}

ngOnDestroy(): void {
  if (this.routerSubscription) {
    this.routerSubscription.unsubscribe();
  }
}

loadEmployees(): void {
  this.loading.set(true);
  this.error.set(null);

  const params = new HttpParams();
  
  this.http.get<{ status: string; data: { employees: Employee[] } }>(
    `${environment.apiUrl}/hr/employees`,
    {
      headers: { Authorization: `Bearer ${this.auth.token() as string}` },
      params
    }
  ).subscribe({
    next: (response) => {
      let employees = response.data.employees || [];
      
      // FIX: Ensure all employee objects have proper first_name and last_name
      employees = employees.map(emp => ({
        ...emp,
        first_name: emp.first_name || '',
        last_name: emp.last_name || '',
      }));
      
      this.employees.set(employees);
      
      // Calculate expiring residences count
      const today = new Date();
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(today.getDate() + 30);
      
      const expiringResidences = employees.filter(emp => {
        if (!emp.residence_expiry) return false;
        const expiryDate = new Date(emp.residence_expiry);
        return expiryDate >= today && expiryDate <= thirtyDaysFromNow;
      });
      
      this.expiringResidencesCount.set(expiringResidences.length);
      
      this.loading.set(false);
      console.log('[EmployeeList] Loaded employees:', employees.length);
    },
    error: (err) => {
      console.error('[EmployeeList] Failed to load employees:', err);
      this.error.set(err.error?.message || 'فشل في تحميل بيانات الموظفين');
      this.loading.set(false);
    }
  });
}

// TASK 5-C: Filtering Logic
filteredEmployees(): Employee[] {
  const allEmployees = this.employees();
  const filter = this.activeFilter();
  
  if (filter === 'all') {
    return allEmployees;
  }
  
  const today = new Date();
  const thirtyDaysFromNow = new Date();
  thirtyDaysFromNow.setDate(today.getDate() + 30);
  
  if (filter === 'contracts') {
    return allEmployees.filter(emp => {
      if (!emp.contract_end_date) return false;
      const endDate = new Date(emp.contract_end_date);
      return endDate >= today && endDate <= thirtyDaysFromNow;
    });
  }
  
  if (filter === 'passports') {
    return allEmployees.filter(emp => {
      if (!emp.passport_expiry) return false;
      const expiryDate = new Date(emp.passport_expiry);
      return expiryDate >= today && expiryDate <= thirtyDaysFromNow;
    });
  }
  
  // NEW: Residence expiry filter
  if (filter === 'residences') {
    return allEmployees.filter(emp => {
      if (!emp.residence_expiry) return false;
      const expiryDate = new Date(emp.residence_expiry);
      return expiryDate >= today && expiryDate <= thirtyDaysFromNow;
    });
  }
  
  return allEmployees;
}

// TASK 5-C: Count expiring items for badges
expiringContractsCount(): number {
  const today = new Date();
  const thirtyDaysFromNow = new Date();
  thirtyDaysFromNow.setDate(today.getDate() + 30);
  
  return this.employees().filter(emp => {
    if (!emp.contract_end_date) return false;
    const endDate = new Date(emp.contract_end_date);
    return endDate >= today && endDate <= thirtyDaysFromNow;
  }).length;
}

expiringPassportsCount(): number {
  const today = new Date();
  const thirtyDaysFromNow = new Date();
  thirtyDaysFromNow.setDate(today.getDate() + 30);
  
  return this.employees().filter(emp => {
    if (!emp.passport_expiry) return false;
    const expiryDate = new Date(emp.passport_expiry);
    return expiryDate >= today && expiryDate <= thirtyDaysFromNow;
  }).length;
}

// TASK 5-C: Check if date is expiring within 30 days
isExpiringSoon(dateString: string): boolean {
  if (!dateString) return false;
  
  const today = new Date();
  const thirtyDaysFromNow = new Date();
  thirtyDaysFromNow.setDate(today.getDate() + 30);
  
  const date = new Date(dateString);
  return date >= today && date <= thirtyDaysFromNow;
}

// TASK 5-C: Format date for display
formatDate(dateString: string): string {
  if (!dateString) return '-';
  
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
}

getStatusClass(status: string): string {
  const statusMap: Record<string, string> = {
    'active': 'status-active',
    'inactive': 'status-inactive',
    'on_leave': 'status-on_leave',
    'terminated': 'status-terminated'
  };
  return statusMap[status] || 'status-inactive';
}

getStatusLabel(status: string): string {
  const labelMap: Record<string, string> = {
    'active': 'hr.active',
    'inactive': 'hr.inactive',
    'on_leave': 'hr.onLeave',
    'terminated': 'hr.terminated'
  };
  return labelMap[status] || status;
}

viewEmployee(id: number): void {
  this.router.navigate(['/hr/employees', id, 'detail']);
}

// FIX: Method to update a specific employee in the list (called from detail/form after edit)
updateEmployeeInList(updatedEmployee: Employee): void {
  const currentEmployees = this.employees();
  const index = currentEmployees.findIndex(emp => emp.id === updatedEmployee.id);
  
  if (index !== -1) {
    // Create new array with updated employee
    const updatedEmployees = [...currentEmployees];
    updatedEmployees[index] = {
      ...updatedEmployees[index],
      ...updatedEmployee,
      first_name: updatedEmployee.first_name || '',
      last_name: updatedEmployee.last_name || '',
    };
    
    // Update the signal - this will trigger UI refresh
    this.employees.set(updatedEmployees);
    console.log('[EmployeeList] Employee updated in list:', updatedEmployee.id);
  }
}
}