import { Pipe, PipeTransform } from '@angular/core';
import { N, fmtDate, fullDate, inr, monthName } from '../core/util';

/** 1234.5 → ₹1,234.5 */
@Pipe({ name: 'inr' })
export class InrPipe implements PipeTransform {
  transform(v: unknown): string {
    return inr(v);
  }
}

/** Like inr, but shows — for zero. */
@Pipe({ name: 'dash' })
export class DashPipe implements PipeTransform {
  transform(v: unknown): string {
    return N(v) ? inr(v) : '—';
  }
}

/** 2026-10-03 → Sat, 3 Oct */
@Pipe({ name: 'dayDate' })
export class DayDatePipe implements PipeTransform {
  transform(iso: string | null | undefined): string {
    return iso ? fmtDate(iso) : '';
  }
}

/** 2026-10-03 → 3 Oct 2026 */
@Pipe({ name: 'fullDate' })
export class FullDatePipe implements PipeTransform {
  transform(iso: string | null | undefined): string {
    return iso ? fullDate(iso) : '';
  }
}

/** 2026-10 → October 2026 */
@Pipe({ name: 'monthName' })
export class MonthNamePipe implements PipeTransform {
  transform(key: string): string {
    return monthName(key);
  }
}

export const PIPES = [InrPipe, DashPipe, DayDatePipe, FullDatePipe, MonthNamePipe] as const;
