import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DataService } from '../core/data.service';

@Component({
  selector: 'app-period-filter',
  imports: [FormsModule],
  template: `
    <div class="filters">
      <span>📅 Period</span>
      <input type="date" title="From" [ngModel]="data.from()" (ngModelChange)="data.from.set($event); data.preset.set(null)" />
      <span>to</span>
      <input type="date" title="To" [ngModel]="data.to()" (ngModelChange)="data.to.set($event); data.preset.set(null)" />
      <button type="button" class="pill-btn" [class.on]="data.preset() === 'all'" (click)="data.setPreset('all')">All</button>
      <button type="button" class="pill-btn" [class.on]="data.preset() === 'month'" (click)="data.setPreset('month')">This month</button>
      <button type="button" class="pill-btn" [class.on]="data.preset() === '7'" (click)="data.setPreset('7')">Last 7 days</button>
    </div>
  `,
})
export class PeriodFilter {
  protected readonly data = inject(DataService);
}
