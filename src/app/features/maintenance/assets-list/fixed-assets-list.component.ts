import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { ToastService } from '../../../core/services/toast.service';
import { firstValueFrom } from 'rxjs';
import { TranslateModule } from '@ngx-translate/core';
import { environment } from '../../../../environments/environment';

interface FixedAsset {
  id: number;
  asset_number: string;
  asset_name: string;
  asset_name_ar: string | null;
  category: string;
  purchase_date: string;
  purchase_cost: number;
  salvage_value: number;
  useful_life_years: number;
  depreciation_method: string;
  project_id: number | null;
  status: string;
  accumulated_depr: number;
  net_book_value: number;
  created_at: string;
}

@Component({
  selector: 'app-fixed-assets-list',
  standalone: true,
  imports: [CommonModule, FormsModule , TranslateModule],
  templateUrl: './fixed-assets-list.component.html',
  styleUrl: './fixed-assets-list.component.css'
})
export class FixedAssetsListComponent implements OnInit {
  private http = inject(HttpClient);
  private router = inject(Router);
  private toast = inject(ToastService);

  assets = signal<FixedAsset[]>([]);
  loading = signal(false);
  runningDepreciation = signal(false);

  ngOnInit(): void {
    this.loadAssets();
  }

  async loadAssets(): Promise<void> {
    this.loading.set(true);
    try {
      const response: any = await firstValueFrom(
        this.http.get(`${environment.apiUrl}/fixed-assets`)

      );

      this.assets.set(response.data || []);
      console.log(`[FixedAssets] Loaded ${this.assets().length} assets`);
      
    } catch (error: any) {
      console.error('[FixedAssets] Error:', error);
      this.toast.error('فشل تحميل الأصول الثابتة');
    } finally {
      this.loading.set(false);
    }
  }

  async runDepreciation(): Promise<void> {
    if (!confirm('هل أنت متأكد من تشغيل الإهلاك الشهري لجميع الأصول؟')) {
      return;
    }

    this.runningDepreciation.set(true);
    try {
      const response: any = await firstValueFrom(
        this.http.post(`${environment.apiUrl}/fixed-assets/depreciation/run`, {})

      );

      this.toast.success(response.message || 'تم تشغيل الإهلاك الشهري بنجاح');
      await this.loadAssets();
      
    } catch (error: any) {
      console.error('[Depreciation] Error:', error);
      this.toast.error(error.error?.message || 'فشل تشغيل الإهلاك');
    } finally {
      this.runningDepreciation.set(false);
    }
  }

  createAsset(): void {
    this.router.navigate(['/maintenance/assets/create']);
  }

  viewAsset(asset: FixedAsset): void {
    this.router.navigate(['/maintenance/assets', asset.id]);
  }

  getCategoryLabel(category: string): string {
    const map: Record<string, string> = {
      leasehold: 'تحسينات عقارية',
      furniture: 'أثاث',
      vehicle: 'مركبات',
      machinery: 'آلات ومعدات',
      computer: 'حواسيب',
      tools: 'أدوات',
      software: 'برمجيات'
    };
    return map[category] || category;
  }

  getStatusLabel(status: string): string {
    const map: Record<string, string> = {
      active: 'نشط',
      disposed: 'تم التخلص منه',
      fully_depreciated: 'مستهلك بالكامل'
    };
    return map[status] || status;
  }

  getMethodLabel(method: string): string {
    return method === 'straight_line' ? 'القسط الثابت' : 'القسط المتناقص';
  }

  formatCurrency(amount: any): string {
    return `${Number(amount || 0).toFixed(2)} SAR`;
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('ar-SA');
  }
}
