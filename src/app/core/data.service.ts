import { Injectable, computed, inject, signal } from '@angular/core';
import { buildDays, monthlyPL, salaryView, summarize } from './calc';
import { DailySale, Employee, EmployeeInput, Expense, NewExpense, NewSalaryEntry, SalaryEntry } from './models';
import { SupabaseService } from './supabase.service';
import { ToastService } from './toast.service';
import { inRange, isoOf, todayIso } from './util';

export type RangePreset = 'all' | 'month' | '7';

type DbResult = PromiseLike<{ error: { message: string } | null }>;

/** Single source of truth: loads everything once, exposes computed reports, wraps all writes. */
@Injectable({ providedIn: 'root' })
export class DataService {
  private readonly db = inject(SupabaseService).client;
  private readonly toast = inject(ToastService);

  // ---- Raw data ----
  readonly days = signal<DailySale[]>([]);
  readonly expenses = signal<Expense[]>([]);
  readonly employees = signal<Employee[]>([]);
  readonly salaryEntries = signal<SalaryEntry[]>([]);
  readonly loaded = signal(false);
  readonly error = signal<string | null>(null);

  // ---- Period filter (shared by Dashboard and Profit pages) ----
  readonly from = signal('');
  readonly to = signal('');
  readonly preset = signal<RangePreset | null>('all');

  // ---- Reports ----
  readonly allDays = computed(() => buildDays(this.days(), this.expenses()));
  readonly rows = computed(() => this.allDays().filter((r) => inRange(r.date, this.from(), this.to())));
  readonly periodExpenses = computed(() => this.expenses().filter((x) => inRange(x.expense_date, this.from(), this.to())));
  readonly summary = computed(() => summarize(this.rows(), this.periodExpenses()));
  readonly monthly = computed(() => monthlyPL(this.rows(), this.periodExpenses()));
  readonly employee = computed(() => this.employees().find((e) => e.active) ?? null);
  readonly salary = computed(() => {
    const emp = this.employee();
    return emp ? salaryView(emp, this.salaryEntries(), this.expenses()) : null;
  });
  readonly descriptions = computed(() => [...new Set(this.expenses().map((x) => x.description).filter((d): d is string => !!d))]);

  setPreset(p: RangePreset): void {
    const now = new Date();
    if (p === 'all') {
      this.from.set('');
      this.to.set('');
    } else if (p === 'month') {
      this.from.set(isoOf(new Date(now.getFullYear(), now.getMonth(), 1)));
      this.to.set(todayIso());
    } else {
      this.from.set(isoOf(new Date(now.getTime() - 6 * 864e5)));
      this.to.set(todayIso());
    }
    this.preset.set(p);
  }

  async loadAll(): Promise<void> {
    const [d, e, m, s] = await Promise.all([
      this.db.from('daily_sales').select('*').order('sale_date'),
      this.db.from('expenses').select('*').order('expense_date', { ascending: false }).order('id', { ascending: false }),
      this.db.from('employees').select('*').order('id'),
      this.db.from('salary_entries').select('*').order('month').order('id'),
    ]);
    const err = d.error || e.error || m.error || s.error;
    if (err) {
      this.error.set(err.message);
      return;
    }
    this.error.set(null);
    this.days.set(d.data as DailySale[]);
    this.expenses.set(e.data as Expense[]);
    this.employees.set(m.data as Employee[]);
    this.salaryEntries.set(s.data as SalaryEntry[]);
    this.loaded.set(true);
  }

  // ---- Writes: each shows a toast, reloads on success, and returns true/false ----

  saveDay(rec: DailySale): Promise<boolean> {
    return this.run(this.db.from('daily_sales').upsert(rec, { onConflict: 'sale_date' }), 'Day sales saved! 🎉');
  }

  deleteDay(date: string): Promise<boolean> {
    return this.run(this.db.from('daily_sales').delete().eq('sale_date', date), 'Day sales deleted');
  }

  addExpense(rec: NewExpense): Promise<boolean> {
    return this.run(this.db.from('expenses').insert(rec), 'Expense saved! 🧾');
  }

  deleteExpense(id: number): Promise<boolean> {
    return this.run(this.db.from('expenses').delete().eq('id', id), 'Expense deleted');
  }

  saveEmployee(rec: EmployeeInput, id?: number): Promise<boolean> {
    const q = id ? this.db.from('employees').update(rec).eq('id', id) : this.db.from('employees').insert(rec);
    return this.run(q, 'Employee saved! 👤');
  }

  addSalaryEntry(rec: NewSalaryEntry): Promise<boolean> {
    return this.run(this.db.from('salary_entries').insert(rec), rec.entry_type === 'salary' ? 'Salary added ➕' : 'Amount deducted ➖');
  }

  deleteSalaryEntry(id: number): Promise<boolean> {
    return this.run(this.db.from('salary_entries').delete().eq('id', id), 'Entry deleted');
  }

  private async run(query: DbResult, okMessage: string): Promise<boolean> {
    const { error } = await query;
    if (error) {
      this.toast.error('Error: ' + error.message);
      return false;
    }
    this.toast.show(okMessage);
    await this.loadAll();
    return true;
  }
}
