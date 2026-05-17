import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { ToastService } from '../../../core/services/toast.service';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../../environments/environment.prod';

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
  notes: string | null;
  created_at: string;
}

interface DepreciationSchedule {
  id: number;
  asset_id: number;
  period_number: number;
  depreciation_date: string;
  depreciation_amount: number;
  accumulated_depreciation: number;
  net_book_value: number;
}

@Component({
  selector: 'app-fixed-asset-detail',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './fixed-asset-detail.component.html',
  styleUrl: './fixed-asset-detail.component.css'
})
export class FixedAssetDetailComponent implements OnInit {
  private http = inject(HttpClient);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private toast = inject(ToastService);

  asset = signal<FixedAsset | null>(null);
  schedule = signal<DepreciationSchedule[]>([]);
  loading = signal(false);
  loadingSchedule = signal(false);

  ngOnInit(): void {
    this.loadAsset();
  }

  async loadAsset(): Promise<void> {
    this.loading.set(true);
    try {
      const assetId = this.route.snapshot.paramMap.get('id');
      if (!assetId) {
        this.toast.error('معرف الأصل غير موجود');
        this.router.navigate(['/maintenance/assets']);
        return;
      }

      const response: any = await firstValueFrom(
        this.http.get(`${environment.apiUrl}/fixed-assets/${assetId}`)

      );

      this.asset.set(response.data);
      
      // Load depreciation schedule
      await this.loadDepreciationSchedule(assetId);
      
    } catch (error: any) {
      console.error('[FixedAssetDetail] Error:', error);
      this.toast.error('فشل تحميل بيانات الأصل');
      this.router.navigate(['/maintenance/assets']);
    } finally {
      this.loading.set(false);
    }
  }

  async loadDepreciationSchedule(assetId: string): Promise<void> {
    this.loadingSchedule.set(true);
    try {
      const response: any = await firstValueFrom(
      this.http.get(`${environment.apiUrl}/fixed-assets/${assetId}/schedule`)

      );

      // Transform the schedule data to match frontend expectations
      const scheduleData = response.data?.schedule || [];
      const transformedSchedule = scheduleData.map((item: any, index: number) => ({
        id: index + 1,
        asset_id: response.data?.asset_id,
        period_number: item.year,
        depreciation_date: item.year_start,
        depreciation_amount: item.depreciation,
        accumulated_depreciation: item.accumulated_depr,
        net_book_value: item.closing_nbv
      }));

      this.schedule.set(transformedSchedule);
      console.log(`[FixedAssetDetail] Loaded ${this.schedule().length} depreciation records`);
      
    } catch (error: any) {
      console.error('[FixedAssetDetail] Error loading schedule:', error);
      // Don't show error for schedule, it's optional
    } finally {
      this.loadingSchedule.set(false);
    }
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

  calculateYearsPassed(purchaseDate: string): number {
    const purchase = new Date(purchaseDate);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - purchase.getTime());
    const diffYears = diffTime / (1000 * 60 * 60 * 24 * 365.25);
    return Math.floor(diffYears * 100) / 100;
  }

  goBack(): void {
    this.router.navigate(['/maintenance/assets']);
  }
}
