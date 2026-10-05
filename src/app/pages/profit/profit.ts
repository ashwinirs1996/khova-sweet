import { Component, inject } from '@angular/core';
import { DataService } from '../../core/data.service';
import { CATEGORY_LABELS } from '../../core/models';
import { pct } from '../../core/util';
import { PeriodFilter } from '../../shared/period-filter';
import { PIPES } from '../../shared/pipes';

@Component({
  selector: 'app-profit',
  imports: [PeriodFilter, ...PIPES],
  templateUrl: './profit.html',
})
export class Profit {
  protected readonly data = inject(DataService);
  protected readonly s = this.data.summary;
  protected readonly categoryLabels = CATEGORY_LABELS;
  protected readonly pct = pct;

  protected print(): void {
    window.print();
  }
}
