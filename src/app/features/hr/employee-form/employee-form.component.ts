import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { TranslateModule } from '@ngx-translate/core';
import { environment } from '../../../../environments/environment';
import { AuthStore } from '../../../core/auth/auth.store';

interface Employee {
  id?: number;
  user_id?: number;
  department_id?: number;
  department?: string;
  first_name: string;
  last_name: string;
  arabic_name?: string;
  nationality?: string;
  date_of_birth?: string;
  gender?: string;
  marital_status?: string;
  religion?: string;
  personal_email: string;
  personal_phone: string;
  emergency_contact?: string;
  emergency_phone?: string;
  passport_number?: string;
  passport_expiry?: string;
  passport_file_path?: string;
  national_id?: string;
  national_id_expiry?: string;
  id_document_url?: string;  // DB column name is id_document_url
  residence_permit?: string;
  residence_expiry?: string;
  residence_file_path?: string;
  employee_number: string;
  job_title?: string;
  employment_type: string;
  contract_start_date?: string;
  contract_end_date?: string;
  contract_file_path?: string;
  probation_end_date?: string;
  basic_salary: number;
  housing_allowance: number;
  transport_allowance: number;  // TASK 4-A: Kept for backward compatibility, but HIDDEN from UI
  other_allowances: number;
  currency: string;
  bank_name?: string;
  bank_account?: string;
  iban?: string;
  status: string;
  system_email?: string;
  department_name?: string;
  role_name?: string;
  // NEW FIELDS
  photo_url?: string;  // TASK 5-B: Kept for backward compatibility (column deleted)
  // TASK 5-B: overtime_rate removed (column deleted from database)
  // overtime_rate?: number;
  gosi_registered?: boolean;
  payroll_status?: boolean;
  created_by?: number;
  created_by_name?: string;
  created_at?: string;
  updated_at?: string;
}

interface Department {
  id: number;
  name: string;
  name_ar?: string;
}

@Component({
  selector: 'app-employee-form',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  template: `
  <div class="p-6">
  <!-- Header -->
  <div class="mb-6 flex items-center justify-between">
    <div>
      <h1 class="text-3xl font-bold text-gray-900">
        {{ (isEditMode() ? 'hr.editEmployee' : 'hr.addEmployee') | translate }}
      </h1>
      <p class="text-gray-600 mt-2">{{ 'hr.title' | translate }}</p>
    </div>
    <button
      (click)="goBack()"
      class="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg transition">
      <i class="fas fa-arrow-left mr-2"></i>
      {{ 'common.back' | translate }}
    </button>
  </div>

  <!-- Error Message -->
  @if (error()) {
    <div class="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
      <p class="text-red-700">{{ error() }}</p>
    </div>
  }

  <!-- Success Message -->
  @if (success()) {
    <div class="bg-green-50 border-l-4 border-green-500 p-4 mb-6">
      <p class="text-green-700">{{ success() }}</p>
    </div>
  }

  <!-- Loading State -->
  @if (loading()) {
    <div class="flex items-center justify-center py-12">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>
  }

  <!-- Form -->
  @if (!loading()) {
    <div class="bg-white rounded-lg shadow">
      <!-- Tabs -->
      <div class="border-b border-gray-200">
        <nav class="flex -mb-px">
          @for (tab of tabs; track tab.key) {
            <button
              (click)="activeTab.set(tab.key)"
              class="py-4 px-6 text-center border-b-2 font-medium text-sm transition"
              [class]="activeTab() === tab.key 
                ? 'border-blue-500 text-blue-600' 
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'">
              <i [class]="tab.icon + ' mr-2'"></i>
              {{ tab.label | translate }}
            </button>
          }
        </nav>
      </div>

      <!-- Tab Content -->
      <div class="p-6">
        <!-- Tab 1: Basic Information -->
        @if (activeTab() === 'basic') {
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <!-- Employee Number -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                {{ 'hr.employeeNumber' | translate }} <span class="text-red-500">*</span>
              </label>
              <input
                type="text"
                [(ngModel)]="employee().employee_number"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                [class.border-red-500]="errors()['employee_number']"
                placeholder="EMP-0016"
                required />
              @if (errors()['employee_number']) {
                <p class="text-red-500 text-xs mt-1">{{ errors()['employee_number'] }}</p>
              }
            </div>

            <!-- First Name -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                {{ 'employees.firstName' | translate }} <span class="text-red-500">*</span>
              </label>
              <input
                type="text"
                [(ngModel)]="employee().first_name"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                [class.border-red-500]="errors()['first_name']"
                required />
              @if (errors()['first_name']) {
                <p class="text-red-500 text-xs mt-1">{{ errors()['first_name'] }}</p>
              }
            </div>

            <!-- Last Name -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                {{ 'employees.lastName' | translate }} <span class="text-red-500">*</span>
              </label>
              <input
                type="text"
                [(ngModel)]="employee().last_name"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                [class.border-red-500]="errors()['last_name']"
                required />
              @if (errors()['last_name']) {
                <p class="text-red-500 text-xs mt-1">{{ errors()['last_name'] }}</p>
              }
            </div>

            <!-- Arabic Name -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                {{ 'employees.arabicName' | translate }}
              </label>
              <input
                type="text"
                [(ngModel)]="employee().arabic_name"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                dir="rtl" />
            </div>

            <!-- National ID -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                {{ 'hr.nationalId' | translate }}
              </label>
              <input
                type="text"
                [(ngModel)]="employee().national_id"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                [class.border-red-500]="errors()['national_id']"
                placeholder="1234567890" />
              @if (errors()['national_id']) {
                <p class="text-red-500 text-xs mt-1">{{ errors()['national_id'] }}</p>
              }
            </div>

            <!-- Passport Number (MANDATORY) -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                {{ 'employees.passportNumber' | translate }} <span class="text-red-500">*</span>
              </label>
              <input
                type="text"
                [(ngModel)]="employee().passport_number"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                [class.border-red-500]="errors()['passport_number']"
                placeholder="A12345678"
                required />
              @if (errors()['passport_number']) {
                <p class="text-red-500 text-xs mt-1">{{ errors()['passport_number'] }}</p>
              }
            </div>

            <!-- Passport Expiry (MANDATORY) -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                {{ 'employees.passportExpiry' | translate }} <span class="text-red-500">*</span>
              </label>
              <input
                type="date"
                [(ngModel)]="employee().passport_expiry"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                [class.border-red-500]="errors()['passport_expiry']"
                required />
              @if (errors()['passport_expiry']) {
                <p class="text-red-500 text-xs mt-1">{{ errors()['passport_expiry'] }}</p>
              }
            </div>

            <!-- National ID (Mandatory) -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                {{ 'employees.nationalId' | translate }} <span class="text-red-500">*</span>
              </label>
              <input
                type="text"
                [(ngModel)]="employee().national_id"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                [class.border-red-500]="errors()['national_id']"
                placeholder="1XXXXXXXXX"
                maxlength="10"
                required />
              @if (errors()['national_id']) {
                <p class="text-red-500 text-xs mt-1">{{ errors()['national_id'] }}</p>
              }
            </div>

            <!-- National ID Expiry -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                {{ 'employees.nationalIdExpiry' | translate }}
              </label>
              <input
                type="date"
                [(ngModel)]="employee().national_id_expiry"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
            </div>

            <!-- Residence Expiry (MANDATORY) -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                {{ 'employees.residenceExpiry' | translate }} <span class="text-red-500">*</span>
              </label>
              <input
                type="date"
                [(ngModel)]="employee().residence_expiry"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                [class.border-red-500]="errors()['residence_expiry']"
                required />
              @if (errors()['residence_expiry']) {
                <p class="text-red-500 text-xs mt-1">{{ errors()['residence_expiry'] }}</p>
              }
            </div>

            <!-- Personal Email -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                {{ 'employees.personalEmail' | translate }} <span class="text-red-500">*</span>
              </label>
              <input
                type="email"
                [(ngModel)]="employee().personal_email"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required />
            </div>

            <!-- Personal Phone -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                {{ 'employees.personalPhone' | translate }} <span class="text-red-500">*</span>
              </label>
              <input
                type="tel"
                [(ngModel)]="employee().personal_phone"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="+966 5XX XXX XXX"
                required />
            </div>

            <!-- Date of Birth -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                {{ 'employees.dateOfBirth' | translate }}
              </label>
              <input
                type="date"
                [(ngModel)]="employee().date_of_birth"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
            </div>

            <!-- Gender -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                {{ 'employees.gender' | translate }}
              </label>
              <select
                [(ngModel)]="employee().gender"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                <option value="">{{ 'common.select' | translate }}</option>
                <option value="male">{{ 'employees.male' | translate }}</option>
                <option value="female">{{ 'employees.female' | translate }}</option>
              </select>
            </div>

            <!-- Marital Status -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                {{ 'employees.maritalStatus' | translate }}
              </label>
              <select
                [(ngModel)]="employee().marital_status"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                <option value="">{{ 'common.select' | translate }}</option>
                <option value="single">{{ 'employees.single' | translate }}</option>
                <option value="married">{{ 'employees.married' | translate }}</option>
                <option value="divorced">{{ 'employees.divorced' | translate }}</option>
                <option value="widowed">{{ 'employees.widowed' | translate }}</option>
              </select>
            </div>

            <!-- Nationality -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                {{ 'employees.nationality' | translate }}
              </label>
              <input
                type="text"
                [(ngModel)]="employee().nationality"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="{{ 'employees.saudi' | translate }}" />
            </div>

            <!-- Religion -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                {{ 'employees.religion' | translate }}
              </label>
              <input
                type="text"
                [(ngModel)]="employee().religion"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value="{{ 'employees.muslim' | translate }}" />
            </div>

            <!-- Emergency Contact -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                {{ 'employees.emergencyContact' | translate }}
              </label>
              <input
                type="text"
                [(ngModel)]="employee().emergency_contact"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
            </div>

            <!-- Emergency Phone -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                {{ 'employees.emergencyPhone' | translate }}
              </label>
              <input
                type="tel"
                [(ngModel)]="employee().emergency_phone"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="+966 5XX XXX XXX" />
            </div>
          </div>
        }

        <!-- Tab 2: Professional Information -->
        @if (activeTab() === 'professional') {
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <!-- Department -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                {{ 'hr.department' | translate }} <span class="text-red-500">*</span>
              </label>
              <select
                [(ngModel)]="employee().department_id"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                [class.border-red-500]="errors()['department_id']">
                <option value="">{{ 'common.select' | translate }} {{ 'hr.department' | translate }}</option>
                @for (dept of departments(); track dept.id) {
                  <option [value]="dept.id">{{ dept.name_ar || dept.name }}</option>
                }
              </select>
              @if (errors()['department_id']) {
                <p class="text-red-500 text-xs mt-1">{{ errors()['department_id'] }}</p>
              }
            </div>

            <!-- Job Title -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                {{ 'hr.jobTitle' | translate }}
              </label>
              <select
                [(ngModel)]="employee().job_title"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                <option value="">{{ 'common.select' | translate }} {{ 'hr.jobTitle' | translate }}</option>
                @for (title of jobTitles; track title) {
                  <option [value]="title">{{ ('jobTitles.' + title) | translate }}</option>
                }
              </select>
            </div>

            <!-- Employment Type -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                {{ 'employees.employmentType' | translate }}
              </label>
              <select
                [(ngModel)]="employee().employment_type"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                <option value="full_time">{{ 'employees.fullTime' | translate }}</option>
                <option value="part_time">{{ 'employees.partTime' | translate }}</option>
                <option value="contract">{{ 'employees.contract' | translate }}</option>
                <option value="internship">{{ 'employees.internship' | translate }}</option>
              </select>
            </div>

            <!-- Status -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                {{ 'hr.status' | translate }}
              </label>
              <select
                [(ngModel)]="employee().status"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                <option value="active">{{ 'hr.active' | translate }}</option>
                <option value="inactive">{{ 'hr.inactive' | translate }}</option>
                <option value="on_leave">{{ 'hr.onLeave' | translate }}</option>
                <option value="terminated">{{ 'hr.terminated' | translate }}</option>
              </select>
            </div>

            <!-- Contract Start Date -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                {{ 'hr.contractStart' | translate }}
              </label>
              <input
                type="date"
                [(ngModel)]="employee().contract_start_date"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
            </div>

            <!-- Contract End Date -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                {{ 'hr.contractEnd' | translate }}
              </label>
              <input
                type="date"
                [(ngModel)]="employee().contract_end_date"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
            </div>

            <!-- Probation End Date -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                {{ 'employees.probationEnd' | translate }}
              </label>
              <input
                type="date"
                [(ngModel)]="employee().probation_end_date"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
            </div>
          </div>
        }

        <!-- Tab 3: Financial Information -->
        @if (activeTab() === 'financial') {
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <!-- Basic Salary -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                {{ 'hr.basicSalary' | translate }} (SAR) <span class="text-red-500">*</span>
              </label>
              <input
                type="number"
                [(ngModel)]="employee().basic_salary"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                [class.border-red-500]="errors()['basic_salary']"
                min="0"
                step="0.01"
                required />
              @if (errors()['basic_salary']) {
                <p class="text-red-500 text-xs mt-1">{{ errors()['basic_salary'] }}</p>
              }
            </div>

            <!-- Housing Allowance -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                {{ 'employees.housingAllowance' | translate }} (SAR)
              </label>
              <input
                type="number"
                [(ngModel)]="employee().housing_allowance"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                min="0"
                step="0.01" />
            </div>

            <!-- Transport Allowance HIDDEN -->
            <div class="hidden">
              <label class="block text-sm font-medium text-gray-700 mb-2">
                {{ 'employees.transportAllowance' | translate }} (SAR)
              </label>
              <input
                type="number"
                [(ngModel)]="employee().transport_allowance"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                min="0"
                step="0.01" />
            </div>

            <!-- Other Allowances -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                {{ 'employees.otherAllowances' | translate }} (SAR)
              </label>
              <input
                type="number"
                [(ngModel)]="employee().other_allowances"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                min="0"
                step="0.01" />
            </div>

            <!-- Total Package (Read Only) -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                {{ 'employees.totalSalary' | translate }} (SAR)
              </label>
              <input
                type="text"
                [value]="calculateTotalSalary() | number:'1.2-2'"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100"
                readonly />
            </div>

            <!-- Currency -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                {{ 'employees.currency' | translate }}
              </label>
              <select
                [(ngModel)]="employee().currency"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                <option value="SAR">{{ 'employees.sar' | translate }}</option>
                <option value="USD">{{ 'employees.usd' | translate }}</option>
                <option value="EUR">{{ 'employees.eur' | translate }}</option>
              </select>
            </div>

            <!-- Bank Name -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                {{ 'employees.bankName' | translate }}
              </label>
              <select
                [(ngModel)]="employee().bank_name"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                <option value="">{{ 'common.select' | translate }} {{ 'employees.bankName' | translate }}</option>
                @for (bank of banks; track bank) {
                  <option [value]="bank">{{ bank }}</option>
                }
              </select>
            </div>

            <!-- Bank Account -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                {{ 'hr.bankAccount' | translate }}
              </label>
              <input
                type="text"
                [(ngModel)]="employee().bank_account"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
            </div>

            <!-- IBAN -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                {{ 'hr.iban' | translate }}
              </label>
              <input
                type="text"
                [(ngModel)]="employee().iban"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="SA00 0000 0000 0000 0000 0000"
                dir="ltr" />
            </div>

            <!-- GOSI Registered -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                {{ 'employees.gosiRegistered' | translate }}
              </label>
              <div class="flex items-center mt-2">
                <input
                  type="checkbox"
                  [(ngModel)]="employee().gosi_registered"
                  class="h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded" />
                <span class="ml-2 text-sm text-gray-700">
                  @if (employee().gosi_registered) {
                    <i class="fas fa-check-circle text-green-600 mr-1"></i> {{ 'employees.gosiRegisteredYes' | translate }}
                  } @else {
                    <i class="fas fa-clock text-yellow-600 mr-1"></i> {{ 'employees.gosiRegisteredNo' | translate }}
                  }
                </span>
              </div>
            </div>

            <!-- Payroll Status (Read Only) -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                {{ 'employees.payrollStatus' | translate }}
              </label>
              <div class="px-4 py-2 border border-gray-300 rounded-lg bg-gray-100">
                @if (employee().payroll_status) {
                  <span class="text-green-600 font-semibold">
                    <i class="fas fa-check-circle mr-1"></i> {{ 'employees.payrollApproved' | translate }}
                  </span>
                } @else {
                  <span class="text-yellow-600 font-semibold">
                    <i class="fas fa-clock mr-1"></i> {{ 'employees.payrollPending' | translate }}
                  </span>
                }
              </div>
            </div>
          </div>
        }

        <!-- Tab 4: Documents -->
        @if (activeTab() === 'documents') {
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <!-- Passport File -->
            <div class="border-2 border-dashed rounded-lg p-6 text-center transition"
                 [class]="selectedFiles().passport_file ? 'border-green-500 bg-green-50' : 'border-gray-300 hover:border-blue-500'">
              <i class="fas fa-passport text-4xl mb-3" [class]="selectedFiles().passport_file ? 'text-green-500' : 'text-gray-400'"></i>
              <p class="text-sm font-medium text-gray-700 mb-2">{{ 'documents.passportFile' | translate }}</p>
              <p class="text-xs text-gray-500">{{ 'documents.allowedFormats' | translate }}</p>
              
              @if (employee().passport_file_path) {
                <div class="mt-3">
                  <a [href]="'/' + employee().passport_file_path" target="_blank" class="text-blue-600 hover:underline text-sm">
                    <i class="fas fa-eye mr-1"></i> {{ 'common.view' | translate }}
                  </a>
                </div>
              }
              
              @if (selectedFiles().passport_file) {
                <div class="mt-3 flex items-center justify-center gap-2">
                  <span class="text-green-600 text-sm font-medium">{{ selectedFiles().passport_file!.name }}</span>
                  <i class="fas fa-check-circle text-green-500"></i>
                  <button (click)="removeFile('passport_file')" class="text-red-500 hover:text-red-700 ml-2">
                    <i class="fas fa-times-circle"></i>
                  </button>
                </div>
              } @else {
                <input type="file" class="hidden" id="passport_file" accept=".pdf,.jpg,.jpeg,.png" (change)="onFileSelect($event, 'passport_file')" />
                <label for="passport_file" class="mt-3 inline-block px-4 py-2 bg-blue-600 text-white rounded-lg cursor-pointer hover:bg-blue-700 transition">
                  {{ 'common.chooseFile' | translate }}
                </label>
              }
            </div>

            <!-- National ID File (stored as id_document_url in DB) -->
            <div class="border-2 border-dashed rounded-lg p-6 text-center transition"
                 [class]="selectedFiles().national_id_file ? 'border-green-500 bg-green-50' : 'border-gray-300 hover:border-blue-500'">
              <i class="fas fa-id-card text-4xl mb-3" [class]="selectedFiles().national_id_file ? 'text-green-500' : 'text-gray-400'"></i>
              <p class="text-sm font-medium text-gray-700 mb-2">{{ 'documents.nationalIdFile' | translate }}</p>
              <p class="text-xs text-gray-500">{{ 'documents.allowedFormats' | translate }}</p>
              
              @if (employee().id_document_url) {
                <div class="mt-3">
                  <a [href]="'/' + employee().id_document_url" target="_blank" class="text-blue-600 hover:underline text-sm">
                    <i class="fas fa-eye mr-1"></i> {{ 'common.view' | translate }}
                  </a>
                </div>
              }
              
              @if (selectedFiles().national_id_file) {
                <div class="mt-3 flex items-center justify-center gap-2">
                  <span class="text-green-600 text-sm font-medium">{{ selectedFiles().national_id_file!.name }}</span>
                  <i class="fas fa-check-circle text-green-500"></i>
                  <button (click)="removeFile('national_id_file')" class="text-red-500 hover:text-red-700 ml-2">
                    <i class="fas fa-times-circle"></i>
                  </button>
                </div>
              } @else {
                <input type="file" class="hidden" id="national_id_file" accept=".pdf,.jpg,.jpeg,.png" (change)="onFileSelect($event, 'national_id_file')" />
                <label for="national_id_file" class="mt-3 inline-block px-4 py-2 bg-blue-600 text-white rounded-lg cursor-pointer hover:bg-blue-700 transition">
                  {{ 'common.chooseFile' | translate }}
                </label>
              }
            </div>

            <!-- Residence File -->
            <div class="border-2 border-dashed rounded-lg p-6 text-center transition"
                 [class]="selectedFiles().residence_file ? 'border-green-500 bg-green-50' : 'border-gray-300 hover:border-blue-500'">
              <i class="fas fa-file-alt text-4xl mb-3" [class]="selectedFiles().residence_file ? 'text-green-500' : 'text-gray-400'"></i>
              <p class="text-sm font-medium text-gray-700 mb-2">{{ 'documents.residenceFile' | translate }}</p>
              <p class="text-xs text-gray-500">{{ 'documents.allowedFormats' | translate }}</p>
              
              @if (employee().residence_file_path) {
                <div class="mt-3">
                  <a [href]="'/' + employee().residence_file_path" target="_blank" class="text-blue-600 hover:underline text-sm">
                    <i class="fas fa-eye mr-1"></i> {{ 'common.view' | translate }}
                  </a>
                </div>
              }
              
              @if (selectedFiles().residence_file) {
                <div class="mt-3 flex items-center justify-center gap-2">
                  <span class="text-green-600 text-sm font-medium">{{ selectedFiles().residence_file!.name }}</span>
                  <i class="fas fa-check-circle text-green-500"></i>
                  <button (click)="removeFile('residence_file')" class="text-red-500 hover:text-red-700 ml-2">
                    <i class="fas fa-times-circle"></i>
                  </button>
                </div>
              } @else {
                <input type="file" class="hidden" id="residence_file" accept=".pdf,.jpg,.jpeg,.png" (change)="onFileSelect($event, 'residence_file')" />
                <label for="residence_file" class="mt-3 inline-block px-4 py-2 bg-blue-600 text-white rounded-lg cursor-pointer hover:bg-blue-700 transition">
                  {{ 'common.chooseFile' | translate }}
                </label>
              }
            </div>

            <!-- Contract File -->
            <div class="border-2 border-dashed rounded-lg p-6 text-center transition"
                 [class]="selectedFiles().contract_file ? 'border-green-500 bg-green-50' : 'border-gray-300 hover:border-blue-500'">
              <i class="fas fa-file-contract text-4xl mb-3" [class]="selectedFiles().contract_file ? 'text-green-500' : 'text-gray-400'"></i>
              <p class="text-sm font-medium text-gray-700 mb-2">{{ 'documents.contractFile' | translate }}</p>
              <p class="text-xs text-gray-500">{{ 'documents.allowedFormats' | translate }}</p>
              
              @if (employee().contract_file_path) {
                <div class="mt-3">
                  <a [href]="'/' + employee().contract_file_path" target="_blank" class="text-blue-600 hover:underline text-sm">
                    <i class="fas fa-eye mr-1"></i> {{ 'common.viewContract' | translate }}
                  </a>
                </div>
              }
              
              @if (selectedFiles().contract_file) {
                <div class="mt-3 flex items-center justify-center gap-2">
                  <span class="text-green-600 text-sm font-medium">{{ selectedFiles().contract_file!.name }}</span>
                  <i class="fas fa-check-circle text-green-500"></i>
                  <button (click)="removeFile('contract_file')" class="text-red-500 hover:text-red-700 ml-2">
                    <i class="fas fa-times-circle"></i>
                  </button>
                </div>
              } @else {
                <input type="file" class="hidden" id="contract_file" accept=".pdf,.jpg,.jpeg,.png" (change)="onFileSelect($event, 'contract_file')" />
                <label for="contract_file" class="mt-3 inline-block px-4 py-2 bg-blue-600 text-white rounded-lg cursor-pointer hover:bg-blue-700 transition">
                  {{ 'common.chooseFile' | translate }}
                </label>
              }
            </div>
          </div>

          <div class="mt-6 p-4 bg-yellow-50 border-l-4 border-yellow-500 rounded">
            <p class="text-sm text-yellow-700">
              <i class="fas fa-info-circle mr-2"></i>
              {{ 'documents.uploadNote' | translate }}
            </p>
          </div>
        }
      </div>

      <!-- Form Actions -->
      <div class="border-t border-gray-200 px-6 py-4 flex items-center justify-between bg-gray-50">
        <button
          (click)="goBack()"
          class="px-6 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg transition">
          {{ 'common.cancel' | translate }}
        </button>

        <button
          (click)="submitForm()"
          [disabled]="submitting()"
          class="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed">
          @if (submitting()) {
            <i class="fas fa-spinner fa-spin mr-2"></i>
          } @else {
            <i class="fas fa-save mr-2"></i>
          }
          {{ submitting() ? ('common.saving' | translate) : (isEditMode() ? ('common.update' | translate) : ('common.save' | translate)) }}
        </button>
      </div>
    </div>
  }
</div>
  `
})
export class EmployeeFormComponent implements OnInit {
  private http = inject(HttpClient);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private auth = inject(AuthStore);

  employee = signal<Employee>({
    first_name: '',
    last_name: '',
    arabic_name: '',
    nationality: 'سعودي',
    date_of_birth: '',
    gender: '',
    marital_status: '',
    religion: 'مسلم',
    personal_email: '',
    personal_phone: '',
    emergency_contact: '',
    emergency_phone: '',
    passport_number: '',
    passport_expiry: '',
    passport_file_path: '',
    national_id: '',
    national_id_expiry: '',
    id_document_url: '',  // DB column name
    residence_permit: '',
    residence_expiry: '',
    residence_file_path: '',
    employee_number: '',
    job_title: '',
    employment_type: 'full_time',
    contract_start_date: '',
    contract_end_date: '',
    contract_file_path: '',
    probation_end_date: '',
    basic_salary: 0,
    housing_allowance: 0,
    transport_allowance: 0,
    other_allowances: 0,
    currency: 'SAR',
    bank_name: '',
    bank_account: '',
    iban: '',
    status: 'active',
    // NEW FIELDS
    photo_url: '',  // TASK 5-B: Kept for backward compatibility (column deleted)
    gosi_registered: false,
    payroll_status: false
  });

  departments = signal<Department[]>([]);
  activeTab = signal<string>('basic');
  loading = signal(false);
  submitting = signal(false);
  error = signal<string | null>(null);
  success = signal<string | null>(null);
  errors = signal<Record<string, string>>({});
  isEditMode = signal(false);
  employeeId = signal<number | null>(null);

  // File upload states
  selectedFiles = signal<{
    passport_file: File | null;
    national_id_file: File | null;
    residence_file: File | null;
    contract_file: File | null;
  }>({
    passport_file: null,
    national_id_file: null,
    residence_file: null,
    contract_file: null
  });

  tabs = [
    { key: 'basic', label: 'hr.tabs.basic', icon: 'fas fa-user' },
    { key: 'professional', label: 'hr.tabs.professional', icon: 'fas fa-briefcase' },
    { key: 'financial', label: 'hr.tabs.financial', icon: 'fas fa-money-bill-wave' },
    { key: 'documents', label: 'hr.tabs.documents', icon: 'fas fa-file-upload' }
  ];

  jobTitles = [
    'general_manager',
    'project_manager',
    'engineer',
    'sales_rep',
    'hr_manager',
    'finance_manager',
    'dept_head',
    'contract_dept_head',
    'purchase_manager',
    'procurement_manager',
    'warehouse_manager',
    'quotation_specialist',
    'accountant',
    'admin',
    'technician',
    'supervisor'
  ];

  banks = [
    'البنك الأهلي السعودي',
    'بنك الراجحي',
    'بنك الرياض',
    'البنك السعودي الفرنسي',
    'بنك البلاد',
    'بنك الجزيرة',
    'بنك الإنماء',
    'البنك العربي الوطني',
    'سامبا',
    'STC بنك',
    'أخرى'
  ];

  ngOnInit(): void {
    this.loadDepartments();
    
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.employeeId.set(parseInt(id));
      this.isEditMode.set(true);
      this.loadEmployee(parseInt(id));
    } else {
      this.generateEmployeeNumber();
    }
  }

  loadDepartments(): void {
    this.http.get<{ status: string; data: { departments: Department[] } }>(
      `${environment.apiUrl}/departments`,
      { headers: { Authorization: `Bearer ${this.auth.token() as string}` } }
    ).subscribe({
      next: (response) => {
        this.departments.set(response.data.departments || []);
      },
      error: (err) => {
        console.error('[EmployeeForm] Failed to load departments:', err);
      }
    });
  }

  loadEmployee(id: number): void {
    this.loading.set(true);
    this.http.get<{ status: string; data: { employee: Employee } }>(
      `${environment.apiUrl}/hr/employees/${id}`,
      { headers: { Authorization: `Bearer ${this.auth.token() as string}` } }
    ).subscribe({
      next: (response) => {
        this.employee.set(response.data.employee);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set('فشل في تحميل بيانات الموظف');
        this.loading.set(false);
      }
    });
  }

  generateEmployeeNumber(): void {
    const today = new Date();
    const year = today.getFullYear();
    const random = Math.floor(Math.random() * 999).toString().padStart(3, '0');
    this.employee().employee_number = `EMP-${year}-${random}`;
  }

  calculateTotalSalary(): number {
    const emp = this.employee();
    // TASK 4-A: Exclude transport_allowance from calculation
    // FIX: Use Number() to prevent string concatenation
    return Number(emp.basic_salary || 0) + Number(emp.housing_allowance || 0) + Number(emp.other_allowances || 0);
  }

  validate(): boolean {
    const errors: Record<string, string> = {};
    const emp = this.employee();

    // TASK 5-B: Mandatory field validation
    if (!emp.first_name || emp.first_name.trim() === '') {
      errors['first_name'] = 'الاسم الأول مطلوب (Required)';
    }
    if (!emp.last_name || emp.last_name.trim() === '') {
      errors['last_name'] = 'اسم العائلة مطلوب (Required)';
    }
    if (!emp.national_id || emp.national_id.trim() === '') {
      errors['national_id'] = 'رقم الهوية مطلوب (Required)';
    }
    if (!emp.department_id) {
      errors['department_id'] = 'القسم مطلوب (Required)';
    }
    if (!emp.basic_salary || emp.basic_salary <= 0) {
      errors['basic_salary'] = 'الراتب الأساسي مطلوب (Required)';
    }
    // NEW: Mandatory passport and residence fields
    if (!emp.passport_number || emp.passport_number.trim() === '') {
      errors['passport_number'] = 'رقم الجواز مطلوب (Required)';
    }
    if (!emp.passport_expiry || emp.passport_expiry.trim() === '') {
      errors['passport_expiry'] = 'تاريخ انتهاء الجواز مطلوب (Required)';
    }
    if (!emp.residence_expiry || emp.residence_expiry.trim() === '') {
      errors['residence_expiry'] = 'تاريخ انتهاء الإقامة مطلوب (Required)';
    }

    this.errors.set(errors);
    return Object.keys(errors).length === 0;
  }

  submitForm(): void {
    if (!this.validate()) {
      this.error.set('يرجى ملء جميع الحقول المطلوبة');
      return;
    }

    this.submitting.set(true);
    this.error.set(null);
    this.success.set(null);

    // Prepare employee data with proper type conversion
    const emp = this.employee();
    const empData: any = {
      ...emp,
      // Ensure numbers are sent as numbers, not strings
      basic_salary: parseFloat(emp.basic_salary as any) || 0,
      housing_allowance: parseFloat(emp.housing_allowance as any) || 0,
      transport_allowance: parseFloat(emp.transport_allowance as any) || 0,
      other_allowances: parseFloat(emp.other_allowances as any) || 0,
      // Convert department_id to number if it's a string
      department_id: emp.department_id ? (typeof emp.department_id === 'string' ? parseInt(emp.department_id) : emp.department_id) : null,
      // Ensure dates are in YYYY-MM-DD format or null
      date_of_birth: emp.date_of_birth || null,
      passport_expiry: emp.passport_expiry || null,
      national_id_expiry: emp.national_id_expiry || null,
      residence_expiry: emp.residence_expiry || null,
      contract_start_date: emp.contract_start_date || null,
      contract_end_date: emp.contract_end_date || null,
      probation_end_date: emp.probation_end_date || null,
      // Convert empty strings to null for optional fields
      arabic_name: emp.arabic_name || null,
      nationality: emp.nationality || null,
      gender: emp.gender || null,
      marital_status: emp.marital_status || null,
      religion: emp.religion || null,
      emergency_contact: emp.emergency_contact || null,
      emergency_phone: emp.emergency_phone || null,
      passport_number: emp.passport_number || null,
      residence_permit: emp.residence_permit || null,
      job_title: emp.job_title || null,
      bank_name: emp.bank_name || null,
      bank_account: emp.bank_account || null,
      iban: emp.iban || null,
      system_email: emp.system_email || null,
      department_name: emp.department_name || null
    };

    // Debug: Log the payload being sent
    console.log('[EmployeeForm] Submitting payload:', JSON.stringify(empData, null, 2));
    console.log('[EmployeeForm] job_title:', empData.job_title);
    console.log('[EmployeeForm] basic_salary type:', typeof empData.basic_salary, 'value:', empData.basic_salary);

    if (this.isEditMode() && this.employeeId()) {
      // Update employee
      this.http.patch<{ status: string; data: { employee: Employee } }>(
        `${environment.apiUrl}/hr/employees/${this.employeeId()}`,
        empData,
        { headers: { Authorization: `Bearer ${this.auth.token() as string}` } }
      ).subscribe({
        next: (response) => {
          this.submitting.set(false);
          this.success.set('تم تحديث بيانات الموظف بنجاح');
          setTimeout(() => this.router.navigate(['/hr/employees']), 1500);
        },
        error: (err) => {
          this.submitting.set(false);
          console.error('[EmployeeForm] Update error:', err);
          this.error.set(err.error?.message || 'فشل في تحديث بيانات الموظف');
        }
      });
    } else {
      // Create employee
      this.http.post<{ status: string; data: { employee: Employee } }>(
        `${environment.apiUrl}/hr/employees`,
        empData,
        { headers: { Authorization: `Bearer ${this.auth.token() as string}` } }
      ).subscribe({
        next: (response) => {
          const employeeId = response.data.employee.id;
          
          // Upload files if any selected
          const files = this.selectedFiles();
          if (employeeId && (files.passport_file || files.national_id_file || files.residence_file || files.contract_file)) {
            this.uploadFiles(employeeId);
          } else {
            this.submitting.set(false);
            this.success.set('تم إضافة الموظف بنجاح');
            setTimeout(() => this.router.navigate(['/hr/employees']), 1500);
          }
        },
        error: (err) => {
          this.submitting.set(false);
          console.error('[EmployeeForm] Create error:', err);
          this.error.set(err.error?.message || 'فشل في إضافة الموظف');
        }
      });
    }
  }

  goBack(): void {
    this.router.navigate(['/hr/employees']);
  }

  onFileSelect(event: any, fileType: 'passport_file' | 'national_id_file' | 'residence_file' | 'contract_file'): void {
    const file = event.target.files[0];
    if (file) {
      // Validate file size (10MB max)
      if (file.size > 10 * 1024 * 1024) {
        this.error.set('حجم الملف كبير جداً. الحد الأقصى 10 ميجابايت');
        return;
      }

      // Validate file type
      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
      
      if (!allowedTypes.includes(file.type)) {
        this.error.set('نوع الملف غير مدعوم. يُسمح فقط بـ PDF, JPG, PNG');
        return;
      }

      // Update the selected files signal
      const currentFiles = this.selectedFiles();
      this.selectedFiles.set({
        ...currentFiles,
        [fileType]: file
      });

      this.error.set(null);
      this.success.set(`تم اختيار الملف: ${file.name}`);
    }
  }

  removeFile(fileType: 'passport_file' | 'national_id_file' | 'residence_file' | 'contract_file'): void {
    const currentFiles = this.selectedFiles();
    this.selectedFiles.set({
      ...currentFiles,
      [fileType]: null
    });
    this.success.set('تم إزالة الملف');
  }

  uploadFiles(employeeId: number): void {
    const formData = new FormData();
    const files = this.selectedFiles();
    
    if (files.passport_file) formData.append('passport_file', files.passport_file);
    if (files.national_id_file) formData.append('national_id_file', files.national_id_file);
    if (files.residence_file) formData.append('residence_file', files.residence_file);
    if (files.contract_file) formData.append('contract_file', files.contract_file);
    
    this.http.post<{ status: string; data: any }>(
      `${environment.apiUrl}/hr/employees/${employeeId}/upload-files`,
      formData,
      { headers: { Authorization: `Bearer ${this.auth.token() as string}` } }
    ).subscribe({
      next: () => {
        this.submitting.set(false);
        this.success.set('تم إضافة الموظف ورفع الملفات بنجاح');
        setTimeout(() => this.router.navigate(['/hr/employees']), 1500);
      },
      error: (err) => {
        this.submitting.set(false);
        console.error('[EmployeeForm] File upload error:', err);
        this.error.set('تم حفظ الموظف لكن فشل رفع الملفات');
      }
    });
  }
}
