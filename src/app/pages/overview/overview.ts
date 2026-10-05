import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { DataService } from '../../core/data.service';
import { downloadCsv, fmtDate, pct, todayIso } from '../../core/util';
import { PeriodFilter } from '../../shared/period-filter';
import { PIPES } from '../../shared/pipes';

@Component({
  selector: 'app-overview',
  imports: [PeriodFilter, ...PIPES],
  templateUrl: './overview.html',
})
export class Overview {
  protected readonly data = inject(DataService);
  private readonly router = inject(Router);

  protected readonly s = this.data.summary;
  protected readonly abs = Math.abs;
  protected readonly pct = pct;

  protected edit(date: string): void {
    this.router.navigate(['/entry'], { queryParams: { date } });
  }

  protected async remove(date: string): Promise<void> {
    if (confirm(`Delete sales for ${fmtDate(date)}? (Expenses for that day are kept.)`)) {
      await this.data.deleteDay(date);
    }
  }

  protected exportCsv(): void {
    const head = ['Day', 'Date', 'Cash Sales', 'PhonePe Sales', 'Other', 'Total Sales', 'Cash Exp', 'PP Exp', 'Total Exp', 'Net'];
    const rows = this.data.rows().map((r) => [r.day, r.date, r.cash, r.pp, r.other, r.sales, r.cashExp, r.ppExp, r.exp, r.net]);
    downloadCsv(`khova_sweet_${todayIso()}.csv`, [head, ...rows]);
  }
}
