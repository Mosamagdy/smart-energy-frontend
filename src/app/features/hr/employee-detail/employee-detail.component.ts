import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { environment } from '../../../../environments/environment.prod';
import { AuthStore } from '../../../core/auth/auth.store';

interface Employee {
  id?: number;
  user_id?: number;
  department_id?: number;
  first_name: string;
  last_name: string;
  arabic_name?: string;
  nationality?: string;
  date_of_birth?: string;
  gender?: string;
  marital_status?: string;
  religion?: string;
  personal_email?: string;
  personal_phone?: string;
  emergency_contact?: string;
  emergency_phone?: string;
  passport_number?: string;
  passport_expiry?: string;
  passport_file_path?: string;
  national_id?: string;
  national_id_expiry?: string;
  id_document_url?: string;
  residence_permit?: string;
  residence_expiry?: string;
  residence_file_path?: string;
  employee_number: string;
  job_title?: string;
  employment_type?: string;
  contract_start_date?: string;
  contract_end_date?: string;
  contract_file_path?: string;
  probation_end_date?: string;
  basic_salary?: number;
  housing_allowance?: number;
  transport_allowance?: number;
  other_allowances?: number;
  currency?: string;
  bank_name?: string;
  bank_account?: string;
  iban?: string;
  status?: string;
  gosi_registered?: boolean;
  payroll_status?: boolean;
  created_by?: number;
  created_by_name?: string;
  created_at?: string;
  updated_at?: string;
}

@Component({
  selector: 'app-employee-detail',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  template: `
    <div class="p-6 bg-gray-50 min-h-screen">
      <!-- Header -->
      <div class="mb-6 flex items-center justify-between bg-white p-6 rounded-lg shadow">
        <div>
          <h1 class="text-3xl font-bold text-gray-900">
            <i class="fas fa-user-tie mr-3 text-blue-600"></i>
            {{ 'employees.detail.title' | translate }}
          </h1>
          <p class="text-gray-600 mt-2">{{ employee().employee_number }} - {{ employee().first_name }} {{ employee().last_name }}</p>
        </div>
        <div class="flex gap-3">
          <button
            (click)="editEmployee()"
            class="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition shadow">
            <i class="fas fa-edit mr-2"></i>
            {{ 'employees.detail.edit' | translate }}
          </button>
          <button
            (click)="deleteEmployee()"
            class="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg transition shadow">
            <i class="fas fa-trash mr-2"></i>
            {{ 'employees.detail.delete' | translate }}
          </button>
          <button
            (click)="goBack()"
            class="px-6 py-3 bg-gray-200 hover:bg-gray-300 rounded-lg transition">
            <i class="fas fa-arrow-left mr-2"></i>
            {{ 'employees.detail.back' | translate }}
          </button>
        </div>
      </div>

      <!-- Loading State -->
      @if (loading()) {
        <div class="flex items-center justify-center py-12">
          <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      }

      <!-- Error State -->
      @if (error()) {
        <div class="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
          <p class="text-red-700">{{ error() }}</p>
        </div>
      }

      <!-- Content -->
      @if (!loading() && employee().id) {
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">

          <!-- Section A: Personal & Contact -->
          <div class="bg-white rounded-lg shadow overflow-hidden">
            <div class="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
              <h2 class="text-xl font-bold text-white">
                <i class="fas fa-user mr-2"></i>
                {{ 'employees.detail.personalAndContact' | translate }}
              </h2>
            </div>
            <div class="p-6 grid grid-cols-2 gap-4">
              <div>
                <label class="text-xs text-gray-500">{{ 'employees.detail.firstName' | translate }}</label>
                <p class="font-semibold text-gray-900">{{ employee().first_name || ('employees.detail.na' | translate) }}</p>
              </div>
              <div>
                <label class="text-xs text-gray-500">{{ 'employees.detail.lastName' | translate }}</label>
                <p class="font-semibold text-gray-900">{{ employee().last_name || ('employees.detail.na' | translate) }}</p>
              </div>
              <div class="col-span-2">
                <label class="text-xs text-gray-500">{{ 'employees.detail.arabicName' | translate }}</label>
                <p class="font-semibold text-gray-900" dir="rtl">{{ employee().arabic_name || ('employees.detail.na' | translate) }}</p>
              </div>
              <div>
                <label class="text-xs text-gray-500">{{ 'employees.detail.nationalId' | translate }}</label>
                <p class="font-semibold text-gray-900">{{ employee().national_id || ('employees.detail.na' | translate) }}</p>
              </div>
              <div>
                <label class="text-xs text-gray-500">{{ 'employees.detail.nationality' | translate }}</label>
                <p class="font-semibold text-gray-900">{{ employee().nationality || ('employees.detail.na' | translate) }}</p>
              </div>
              <div>
                <label class="text-xs text-gray-500">{{ 'employees.dateOfBirth' | translate }}</label>
                <p class="font-semibold text-gray-900">{{ formatDate(employee().date_of_birth) }}</p>
              </div>
              <div>
                <label class="text-xs text-gray-500">{{ 'employees.detail.gender' | translate }}</label>
                <p class="font-semibold text-gray-900">{{ getGenderLabel(employee().gender) }}</p>
              </div>
              <div>
                <label class="text-xs text-gray-500">{{ 'employees.maritalStatus' | translate }}</label>
                <p class="font-semibold text-gray-900">{{ getMaritalStatusLabel(employee().marital_status) }}</p>
              </div>
              <div>
                <label class="text-xs text-gray-500">{{ 'employees.religion' | translate }}</label>
                <p class="font-semibold text-gray-900">{{ employee().religion || ('employees.detail.na' | translate) }}</p>
              </div>
              <div>
                <label class="text-xs text-gray-500">{{ 'employees.personalEmail' | translate }}</label>
                <p class="font-semibold text-gray-900">{{ employee().personal_email || ('employees.detail.na' | translate) }}</p>
              </div>
              <div>
                <label class="text-xs text-gray-500">{{ 'employees.personalPhone' | translate }}</label>
                <p class="font-semibold text-gray-900" dir="ltr">{{ employee().personal_phone || ('employees.detail.na' | translate) }}</p>
              </div>
              <div>
                <label class="text-xs text-gray-500">{{ 'employees.emergencyContact' | translate }}</label>
                <p class="font-semibold text-gray-900">{{ employee().emergency_contact || ('employees.detail.na' | translate) }}</p>
              </div>
              <div>
                <label class="text-xs text-gray-500">{{ 'employees.emergencyPhone' | translate }}</label>
                <p class="font-semibold text-gray-900" dir="ltr">{{ employee().emergency_phone || ('employees.detail.na' | translate) }}</p>
              </div>
            </div>
          </div>

          <!-- Section B: Job & Department -->
          <div class="bg-white rounded-lg shadow overflow-hidden">
            <div class="bg-gradient-to-r from-green-600 to-green-700 px-6 py-4">
              <h2 class="text-xl font-bold text-white">
                <i class="fas fa-briefcase mr-2"></i>
                {{ 'employees.detail.jobAndDepartment' | translate }}
              </h2>
            </div>
            <div class="p-6 grid grid-cols-2 gap-4">
              <div>
                <label class="text-xs text-gray-500">{{ 'employees.detail.employeeNumber' | translate }}</label>
                <p class="font-semibold text-gray-900">{{ employee().employee_number || ('employees.detail.na' | translate) }}</p>
              </div>
              <div>
                <label class="text-xs text-gray-500">{{ 'employees.detail.jobTitle' | translate }}</label>
                <p class="font-semibold text-gray-900">{{ getJobTitleLabel(employee().job_title) || ('employees.detail.na' | translate) }}</p>
              </div>
              <div>
                <label class="text-xs text-gray-500">{{ 'employees.detail.departmentId' | translate }}</label>
                <p class="font-semibold text-gray-900">{{ employee().department_id || ('employees.detail.na' | translate) }}</p>
              </div>
              <div>
                <label class="text-xs text-gray-500">{{ 'employees.employmentType' | translate }}</label>
                <p class="font-semibold text-gray-900">{{ getEmploymentTypeLabel(employee().employment_type) }}</p>
              </div>
              <div>
                <label class="text-xs text-gray-500">{{ 'employees.detail.hireDate' | translate }}</label>
                <p class="font-semibold text-gray-900">{{ formatDate(employee().contract_start_date) }}</p>
              </div>
              <div>
                <label class="text-xs text-gray-500">{{ 'hr.status' | translate }}</label>
                <p class="font-semibold">
                  <span [class]="getStatusClass(employee().status)">
                    {{ getStatusLabel(employee().status) }}
                  </span>
                </p>
              </div>
              <div>
                <label class="text-xs text-gray-500">{{ 'employees.probationEnd' | translate }}</label>
                <p class="font-semibold text-gray-900">{{ formatDate(employee().probation_end_date) }}</p>
              </div>
              <div>
                <label class="text-xs text-gray-500">{{ 'employees.detail.createdBy' | translate }}</label>
                <p class="font-semibold text-gray-900">{{ employee().created_by_name || ('employees.detail.na' | translate) }}</p>
              </div>
              <div>
                <label class="text-xs text-gray-500">{{ 'employees.detail.createdAt' | translate }}</label>
                <p class="font-semibold text-gray-900">{{ formatDateTime(employee().created_at) }}</p>
              </div>
              <div>
                <label class="text-xs text-gray-500">{{ 'employees.detail.updatedAt' | translate }}</label>
                <p class="font-semibold text-gray-900">{{ formatDateTime(employee().updated_at) }}</p>
              </div>
            </div>
          </div>

          <!-- Section C: Financial & Insurance -->
          <div class="bg-white rounded-lg shadow overflow-hidden">
            <div class="bg-gradient-to-r from-purple-600 to-purple-700 px-6 py-4">
              <h2 class="text-xl font-bold text-white">
                <i class="fas fa-money-bill-wave mr-2"></i>
                {{ 'employees.detail.financialAndInsurance' | translate }}
              </h2>
            </div>
            <div class="p-6 grid grid-cols-2 gap-4">
              <div>
                <label class="text-xs text-gray-500">{{ 'hr.basicSalary' | translate }}</label>
                <p class="font-bold text-lg text-green-600">{{ formatCurrency(employee().basic_salary) }}</p>
              </div>
              <div>
                <label class="text-xs text-gray-500">{{ 'employees.housingAllowance' | translate }}</label>
                <p class="font-semibold text-gray-900">{{ formatCurrency(employee().housing_allowance) }}</p>
              </div>
              <div>
                <label class="text-xs text-gray-500">{{ 'employees.detail.transportAllowance' | translate }}</label>
                <p class="font-semibold text-gray-900">{{ formatCurrency(employee().transport_allowance) }}</p>
              </div>
              <div>
                <label class="text-xs text-gray-500">{{ 'employees.otherAllowances' | translate }}</label>
                <p class="font-semibold text-gray-900">{{ formatCurrency(employee().other_allowances) }}</p>
              </div>
              <div class="col-span-2 bg-green-50 p-4 rounded-lg">
                <label class="text-xs text-gray-500">{{ 'employees.totalSalary' | translate }}</label>
                <p class="font-bold text-2xl text-green-700">{{ formatCurrency(calculateTotalSalary()) }}</p>
                @if (employee().gosi_registered) {
                  <p class="text-xs text-red-600 mt-1">
                    <i class="fas fa-minus-circle mr-1"></i>
                    {{ 'employees.detail.gosiDeduction' | translate }}: -{{ formatCurrency(getGosiAmount()) }}
                  </p>
                }
              </div>
              <div>
                <label class="text-xs text-gray-500">{{ 'employees.currency' | translate }}</label>
                <p class="font-semibold text-gray-900">{{ employee().currency || ('employees.detail.na' | translate) }}</p>
              </div>
              <div>
                <label class="text-xs text-gray-500">{{ 'employees.gosiRegistered' | translate }}</label>
                <p class="font-semibold cursor-pointer" (click)="toggleGosi()" title="Click to toggle">
                  @if (employee().gosi_registered) {
                    <span class="text-green-600">
                      <i class="fas fa-check-circle mr-1"></i> {{ 'employees.detail.gosiRegisteredYesWithPercent' | translate }}
                      <span class="ml-2 text-xs text-gray-500">(-{{ formatCurrency(getGosiAmount()) }})</span>
                    </span>
                  } @else {
                    <span class="text-red-600">
                      <i class="fas fa-times-circle mr-1"></i> {{ 'employees.gosiRegisteredNo' | translate }}
                      <span class="ml-2 text-xs text-gray-400">(Click to activate)</span>
                    </span>
                  }
                </p>
              </div>
              <div>
                <label class="text-xs text-gray-500">{{ 'employees.bankName' | translate }}</label>
                <p class="font-semibold text-gray-900">{{ employee().bank_name || ('employees.detail.na' | translate) }}</p>
              </div>
              <div>
                <label class="text-xs text-gray-500">{{ 'employees.detail.bankAccount' | translate }}</label>
                <p class="font-semibold text-gray-900" dir="ltr">{{ employee().bank_account || ('employees.detail.na' | translate) }}</p>
              </div>
              <div class="col-span-2">
                <label class="text-xs text-gray-500">{{ 'hr.iban' | translate }}</label>
                <p class="font-semibold text-gray-900 font-mono" dir="ltr">{{ employee().iban || ('employees.detail.na' | translate) }}</p>
              </div>
              <div>
                <label class="text-xs text-gray-500">{{ 'employees.payrollStatus' | translate }}</label>
                <p class="font-semibold">
                  @if (employee().payroll_status) {
                    <span class="text-green-600"><i class="fas fa-check-circle mr-1"></i> {{ 'employees.payrollApproved' | translate }}</span>
                  } @else {
                    <span class="text-yellow-600"><i class="fas fa-clock mr-1"></i> {{ 'employees.payrollPending' | translate }}</span>
                  }
                </p>
              </div>
            </div>
          </div>

          <!-- Section D: Documents & Expiry -->
          <div class="bg-white rounded-lg shadow overflow-hidden">
            <div class="bg-gradient-to-r from-orange-600 to-orange-700 px-6 py-4">
              <h2 class="text-xl font-bold text-white">
                <i class="fas fa-file-alt mr-2"></i>
                {{ 'employees.detail.documentsAndExpiry' | translate }}
              </h2>
            </div>
            <div class="p-6 grid grid-cols-2 gap-4">
              <div>
                <label class="text-xs text-gray-500">{{ 'employees.passportNumber' | translate }}</label>
                <p class="font-semibold text-gray-900">{{ employee().passport_number || ('employees.detail.na' | translate) }}</p>
              </div>
              <div>
                <label class="text-xs text-gray-500">{{ 'employees.detail.passportExpiryLabel' | translate }}</label>
                <p class="font-semibold" [class]="isExpiringSoon(employee().passport_expiry) ? 'text-red-600 font-bold' : 'text-gray-900'">
                  {{ formatDate(employee().passport_expiry) }}
                  @if (isExpiringSoon(employee().passport_expiry)) {
                    <span class="ml-2 px-2 py-1 bg-red-100 text-red-700 rounded text-xs">
                      <i class="fas fa-exclamation-triangle mr-1"></i>{{ 'employees.detail.expiringSoon' | translate }}
                    </span>
                  }
                </p>
              </div>
              <div>
                <label class="text-xs text-gray-500">{{ 'employees.detail.nationalIdExpiryLabel' | translate }}</label>
                <p class="font-semibold text-gray-900">{{ formatDate(employee().national_id_expiry) }}</p>
              </div>
              <div>
                <label class="text-xs text-gray-500">{{ 'employees.detail.residenceNumber' | translate }}</label>
                <p class="font-semibold text-gray-900">{{ employee().residence_permit || ('employees.detail.na' | translate) }}</p>
              </div>
              <div>
                <label class="text-xs text-gray-500">{{ 'employees.detail.residenceExpiryLabel' | translate }}</label>
                <p class="font-semibold" [class]="isExpiringSoon(employee().residence_expiry) ? 'text-red-600 font-bold' : 'text-gray-900'">
                  {{ formatDate(employee().residence_expiry) }}
                  @if (isExpiringSoon(employee().residence_expiry)) {
                    <span class="ml-2 px-2 py-1 bg-red-100 text-red-700 rounded text-xs">
                      <i class="fas fa-exclamation-triangle mr-1"></i>{{ 'employees.detail.expiringSoon' | translate }}
                    </span>
                  }
                </p>
              </div>
              <div>
                <label class="text-xs text-gray-500">{{ 'employees.detail.contractEndDate' | translate }}</label>
                <p class="font-semibold" [class]="isExpiringSoon(employee().contract_end_date) ? 'text-red-600 font-bold' : 'text-gray-900'">
                  {{ formatDate(employee().contract_end_date) }}
                  @if (isExpiringSoon(employee().contract_end_date)) {
                    <span class="ml-2 px-2 py-1 bg-red-100 text-red-700 rounded text-xs">
                      <i class="fas fa-exclamation-triangle mr-1"></i>{{ 'employees.detail.expiringSoon' | translate }}
                    </span>
                  }
                </p>
              </div>
            </div>

            <!-- Files Section -->
            <div class="px-6 pb-6">
              <label class="text-sm font-semibold text-gray-700 mb-3 block">{{ 'employees.detail.attachedFiles' | translate }}</label>
              <div class="grid grid-cols-2 gap-4">
                <!-- Passport File -->
                <div class="border-2 rounded-lg p-4 text-center" [class]="employee().passport_file_path ? 'border-green-500 bg-green-50' : 'border-gray-300 bg-gray-50'">
                  <i class="fas fa-passport text-3xl mb-2" [class]="employee().passport_file_path ? 'text-green-600' : 'text-gray-400'"></i>
                  <p class="text-xs text-gray-700 font-medium">{{ 'employees.detail.passportFile' | translate }}</p>
                  @if (employee().passport_file_path) {
                    <a [href]="getFullFileUrl(employee().passport_file_path!)" target="_blank" class="mt-2 inline-block px-3 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700">
                      <i class="fas fa-eye mr-1"></i> {{ 'employees.detail.view' | translate }}
                    </a>
                  } @else {
                    <p class="text-xs text-gray-500 mt-2">{{ 'employees.detail.notAttached' | translate }}</p>
                  }
                </div>

                <!-- ID Document -->
                <div class="border-2 rounded-lg p-4 text-center" [class]="employee().id_document_url ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-gray-50'">
                  <i class="fas fa-id-card text-3xl mb-2" [class]="employee().id_document_url ? 'text-blue-600' : 'text-gray-400'"></i>
                  <p class="text-xs text-gray-700 font-medium">{{ 'employees.detail.nationalIdFile' | translate }}</p>
                  @if (employee().id_document_url) {
                    <a [href]="getFullFileUrl(employee().id_document_url!)" target="_blank" class="mt-2 inline-block px-3 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700">
                      <i class="fas fa-eye mr-1"></i> {{ 'employees.detail.view' | translate }}
                    </a>
                  } @else {
                    <p class="text-xs text-gray-500 mt-2">{{ 'employees.detail.notAttached' | translate }}</p>
                  }
                </div>

                <!-- Residence File -->
                <div class="border-2 rounded-lg p-4 text-center" [class]="employee().residence_file_path ? 'border-purple-500 bg-purple-50' : 'border-gray-300 bg-gray-50'">
                  <i class="fas fa-file-alt text-3xl mb-2" [class]="employee().residence_file_path ? 'text-purple-600' : 'text-gray-400'"></i>
                  <p class="text-xs text-gray-700 font-medium">{{ 'employees.detail.residenceFile' | translate }}</p>
                  @if (employee().residence_file_path) {
                    <a [href]="getFullFileUrl(employee().residence_file_path!)" target="_blank" class="mt-2 inline-block px-3 py-1 bg-purple-600 text-white rounded text-xs hover:bg-purple-700">
                      <i class="fas fa-eye mr-1"></i> {{ 'employees.detail.view' | translate }}
                    </a>
                  } @else {
                    <p class="text-xs text-gray-500 mt-2">{{ 'employees.detail.notAttached' | translate }}</p>
                  }
                </div>

                <!-- Contract File -->
                <div class="border-2 rounded-lg p-4 text-center" [class]="employee().contract_file_path ? 'border-orange-500 bg-orange-50' : 'border-gray-300 bg-gray-50'">
                  <i class="fas fa-file-contract text-3xl mb-2" [class]="employee().contract_file_path ? 'text-orange-600' : 'text-gray-400'"></i>
                  <p class="text-xs text-gray-700 font-medium">{{ 'employees.detail.contractFile' | translate }}</p>
                  @if (employee().contract_file_path) {
                    <a [href]="getFullFileUrl(employee().contract_file_path!)" target="_blank" class="mt-2 inline-block px-3 py-1 bg-orange-600 text-white rounded text-xs hover:bg-orange-700">
                      <i class="fas fa-eye mr-1"></i> {{ 'employees.detail.view' | translate }}
                    </a>
                  } @else {
                    <p class="text-xs text-gray-500 mt-2">{{ 'employees.detail.notAttached' | translate }}</p>
                  }
                </div>
              </div>
            </div>
          </div>

        </div>
      }
    </div>
  `
})
export class EmployeeDetailComponent implements OnInit {
  private http = inject(HttpClient);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private auth = inject(AuthStore);
  private translate = inject(TranslateService);

  employee = signal<Employee>({
    first_name: '',
    last_name: '',
    employee_number: ''
  });
  loading = signal(false);
  error = signal<string | null>(null);

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadEmployee(parseInt(id));
    }
  }

  loadEmployee(id: number): void {
    this.loading.set(true);
    this.error.set(null);

    this.http.get<{ status: string; data: { employee: Employee } }>(
      `${environment.apiUrl}/hr/employees/${id}`,
      { headers: { Authorization: `Bearer ${this.auth.token() as string}` } }
    ).subscribe({
      next: (response) => {
        this.employee.set(response.data.employee);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('[EmployeeDetail] Failed to load:', err);
        this.error.set(this.translate.instant('employees.detail.loadingError'));
        this.loading.set(false);
      }
    });
  }

  formatDate(dateStr: string | undefined): string {
    if (!dateStr) return this.translate.instant('employees.detail.na');
    return new Date(dateStr).toLocaleDateString(this.translate.currentLang === 'ar' ? 'ar-SA' : 'en-US');
  }

  formatDateTime(dateStr: string | undefined): string {
    if (!dateStr) return this.translate.instant('employees.detail.na');
    return new Date(dateStr).toLocaleString(this.translate.currentLang === 'ar' ? 'ar-SA' : 'en-US');
  }

  formatCurrency(amount: number | undefined): string {
    if (!amount && amount !== 0) return this.translate.instant('employees.detail.na');
    return `${amount.toLocaleString('en-US')} SAR`;
  }

  getFullFileUrl(filePath: string): string {
    if (!filePath) return '';
    
    if (filePath.startsWith('http://') || filePath.startsWith('https://')) {
      return filePath;
    }
    
    let cleanPath = filePath;
    
    const uploadsMatch = cleanPath.match(/uploads[\\/](.+)$/i);
    if (uploadsMatch) {
      cleanPath = uploadsMatch[0];
    }
    
    cleanPath = cleanPath.replace(/\\/g, '/');
    
    cleanPath = cleanPath.replace(/^\//, '');
    
    const baseUrl = environment.apiUrl.replace(/\/api\/?$/, '');
    
    return `${baseUrl}/${cleanPath}`;
  }

  calculateTotalSalary(): number {
    const emp = this.employee();
    const grossSalary = Number(emp.basic_salary || 0) + 
                       Number(emp.housing_allowance || 0) + 
                       Number(emp.transport_allowance || 0) + 
                       Number(emp.other_allowances || 0);
    
    if (emp.gosi_registered) {
      const gosiAmount = Number(emp.basic_salary || 0) * 0.0975;
      return grossSalary - gosiAmount;
    }
    
    return grossSalary;
  }

  getGosiAmount(): number {
    const emp = this.employee();
    if (!emp.gosi_registered) return 0;
    return Number(emp.basic_salary || 0) * 0.0975;
  }

  toggleGosi(): void {
    const emp = this.employee();
    if (!emp.id) return;
    
    const newGosiStatus = !emp.gosi_registered;
    
    this.http.patch<{ status: string; data: any }>(
      `${environment.apiUrl}/hr/employees/${emp.id}`,
      { gosi_registered: newGosiStatus },
      { headers: { Authorization: `Bearer ${this.auth.token() as string}` } }
    ).subscribe({
      next: (response) => {
        const updatedEmp = { ...emp, gosi_registered: newGosiStatus };
        this.employee.set(updatedEmp);
        
        const statusText = newGosiStatus ? 
          this.translate.instant('employees.detail.gosiActivated') : 
          this.translate.instant('employees.detail.gosiDeactivated');
        console.log(`[GOSI] ${statusText} - New total:`, this.calculateTotalSalary());
      },
      error: (err) => {
        console.error('[GOSI] Failed to update:', err);
        alert(this.translate.instant('employees.detail.gosiUpdateError'));
      }
    });
  }

  isExpiringSoon(dateStr: string | undefined): boolean {
    if (!dateStr) return false;
    const today = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(today.getDate() + 30);
    const expiryDate = new Date(dateStr);
    return expiryDate >= today && expiryDate <= thirtyDaysFromNow;
  }

  getGenderLabel(gender: string | undefined): string {
    const map: Record<string, string> = { 
      male: this.translate.instant('employees.detail.male'), 
      female: this.translate.instant('employees.detail.female') 
    };
    return map[gender || ''] || this.translate.instant('employees.detail.na');
  }

  getMaritalStatusLabel(status: string | undefined): string {
    const map: Record<string, string> = {
      single: this.translate.instant('employees.single'), 
      married: this.translate.instant('employees.married'), 
      divorced: this.translate.instant('employees.divorced'), 
      widowed: this.translate.instant('employees.widowed')
    };
    return map[status || ''] || this.translate.instant('employees.detail.na');
  }

  getJobTitleLabel(title: string | undefined): string {
    if (!title) return '';
    return this.translate.instant('jobTitles.' + title);
  }

  getEmploymentTypeLabel(type: string | undefined): string {
    const map: Record<string, string> = {
      full_time: this.translate.instant('employees.fullTime'),
      part_time: this.translate.instant('employees.partTime'),
      contract: this.translate.instant('employees.contract'),
      internship: this.translate.instant('employees.internship')
    };
    return map[type || ''] || this.translate.instant('employees.detail.na');
  }

  getStatusLabel(status: string | undefined): string {
    return this.translate.instant('employees.status.' + (status || 'active'));
  }

  getStatusClass(status: string | undefined): string {
    const map: Record<string, string> = {
      active: 'text-green-600',
      inactive: 'text-red-600',
      on_leave: 'text-yellow-600',
      terminated: 'text-gray-600'
    };
    return map[status || ''] || 'text-gray-600';
  }

  editEmployee(): void {
    const emp = this.employee();
    if (emp.id) {
      this.router.navigate(['/hr/employees', emp.id, 'edit']);
    }
  }

  deleteEmployee(): void {
    const emp = this.employee();
    if (!emp.id) return;
    
    const confirmed = confirm(
      `${this.translate.instant('employees.detail.deleteConfirm')} ${emp.first_name} ${emp.last_name}?\n\n${this.translate.instant('employees.detail.deleteWarning')}`
    );
    
    if (!confirmed) return;
    
    this.http.delete<{ status: string; message: string }>(
      `${environment.apiUrl}/hr/employees/${emp.id}`,
      { headers: { Authorization: `Bearer ${this.auth.token() as string}` } }
    ).subscribe({
      next: () => {
        alert(this.translate.instant('employees.detail.deleteSuccess'));
        this.router.navigate(['/hr/employees']);
      },
      error: (err) => {
        console.error('[EmployeeDetail] Delete error:', err);
        alert(err.error?.message || this.translate.instant('employees.detail.deleteError'));
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/hr/employees']);
  }
}
