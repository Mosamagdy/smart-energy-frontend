import { Component, signal, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { ToastService } from '../../../core/services/toast.service';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-fixed-asset-create',
  standalone: true,
  imports: [CommonModule, FormsModule ,TranslateModule],
  templateUrl: './fixed-asset-create.component.html',
  styleUrl: './fixed-asset-create.component.css'
})
export class FixedAssetCreateComponent {
  private http = inject(HttpClient);
  private router = inject(Router);
  private toast = inject(ToastService);

  // Form fields
  assetName = signal<string>('');
  assetNameAr = signal<string>('');
  category = signal<string>('');
  purchaseDate = signal<string>(new Date().toISOString().split('T')[0]);
  purchaseCost = signal<number>(0);
  salvageValue = signal<number>(0);
  usefulLifeYears = signal<number>(5);
  depreciationMethod = signal<string>('straight_line');
  notes = signal<string>('');
  
  // UI state
  loading = signal(false);
  submitting = signal(false);

  categories = [
    { value: 'leasehold', label: 'تحسينات عقارية', labelEn: 'Leasehold Improvements' },
    { value: 'furniture', label: 'أثاث', labelEn: 'Furniture' },
    { value: 'vehicle', label: 'مركبات', labelEn: 'Vehicle' },
    { value: 'machinery', label: 'آلات ومعدات', labelEn: 'Machinery' },
    { value: 'computer', label: 'حواسيب', labelEn: 'Computers' },
    { value: 'tools', label: 'أدوات', labelEn: 'Tools' },
    { value: 'software', label: 'برمجيات', labelEn: 'Software' }
  ];

  depreciationMethods = [
    { value: 'straight_line', label: 'القسط الثابت', labelEn: 'Straight Line' },
    { value: 'declining_balance', label: 'القسط المتناقص', labelEn: 'Declining Balance' }
  ];



  async submit(): Promise<void> {
    // Validation
    if (!this.assetName()) {
      this.toast.error('اسم الأصل مطلوب');
      return;
    }
    if (!this.category()) {
      this.toast.error('الفئة مطلوبة');
      return;
    }
    if (!this.purchaseCost() || this.purchaseCost() <= 0) {
      this.toast.error('تكلفة الشراء يجب أن تكون أكبر من صفر');
      return;
    }
    if (!this.usefulLifeYears() || this.usefulLifeYears() <= 0) {
      this.toast.error('العمر الإنتاجي يجب أن يكون أكبر من صفر');
      return;
    }

    this.submitting.set(true);
    try {
      const payload = {
        asset_name: this.assetName(),
        asset_name_ar: this.assetNameAr() || null,
        category: this.category(),
        purchase_date: this.purchaseDate(),
        purchase_cost: Number(this.purchaseCost()) || 0,
        salvage_value: Number(this.salvageValue()) || 0,
        useful_life_years: Number(this.usefulLifeYears()) || 5,
        depreciation_method: this.depreciationMethod(),
        project_id: null,
        notes: this.notes() || null
      };

      const response: any = await firstValueFrom(
       this.http.post(`${environment.apiUrl}/fixed-assets`, payload)
 
      );

      this.toast.success(response.message || 'تم إضافة الأصل بنجاح');
      this.router.navigate(['/maintenance/assets']);
      
    } catch (error: any) {
      console.error('[AssetCreate] Error:', error);
      this.toast.error(error.error?.message || 'فشل إضافة الأصل');
    } finally {
      this.submitting.set(false);
    }
  }

  cancel(): void {
    this.router.navigate(['/maintenance/assets']);
  }

  // Computed: Depreciation Rate
  depreciationRate = computed(() => {
    const years = Number(this.usefulLifeYears()) || 0;
    if (years <= 0) return 0;
    return parseFloat((100 / years).toFixed(2));
  });

  // Computed: Annual Depreciation Expense
  annualDepreciation = computed(() => {
    const cost = Number(this.purchaseCost()) || 0;
    const salvage = Number(this.salvageValue()) || 0;
    const rate = this.depreciationRate();
    
    if (cost <= 0 || rate <= 0) return 0;
    
    // Formula: (Purchase Cost - Salvage Value) * (Depreciation Rate / 100)
    const depreciableAmount = cost - salvage;
    return parseFloat((depreciableAmount * (rate / 100)).toFixed(2));
  });
}
