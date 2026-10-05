import { Component, effect, inject, signal, untracked } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { DataService } from '../../core/data.service';
import { CATEGORY_LABELS, Category, DailySale, Expense, MODE_LABELS, PayMode } from '../../core/models';
import { ToastService } from '../../core/toast.service';
import { N, todayIso } from '../../core/util';
import { PIPES } from '../../shared/pipes';

@Component({
  selector: 'app-entry',
  imports: [FormsModule, ...PIPES],
  templateUrl: './entry.html',
})
export class Entry {
  protected readonly data = inject(DataService);
  private readonly toast = inject(ToastService);

  protected readonly categoryLabels = CATEGORY_LABELS;
  protected readonly modeLabels = MODE_LABELS;
  protected readonly tab = signal<'sales' | 'expense'>('sales');
  protected readonly saving = signal(false);

  // Day sales form
  protected sDate = inject(ActivatedRoute).snapshot.queryParamMap.get('date') ?? todayIso();
  protected sCash: number | null = null;
  protected sPP: number | null = null;
  protected sOther: number | null = null;
  protected sNote = '';

  // Expense form
  protected eDate = todayIso();
  protected eAmount: number | null = null;
  protected eCat: Category = 'operating';
  protected eMode: PayMode = 'cash';
  protected eDesc = '';
  protected eEmp: number | null = null;

  constructor() {
    // Fill the day form once the data has loaded (e.g. when coming from "Edit" on the dashboard).
    effect(() => {
      if (this.data.loaded()) untracked(() => this.fillDay());
    });
  }

  protected existingDay(): DailySale | undefined {
    return this.data.days().find((d) => d.sale_date === this.sDate);
  }

  protected dayTotal(): number {
    return N(this.sCash) + N(this.sPP) + N(this.sOther);
  }

  protected fillDay(): void {
    const d = this.existingDay();
    this.sCash = d && N(d.cash_amount) ? N(d.cash_amount) : null;
    this.sPP = d && N(d.phonepe_amount) ? N(d.phonepe_amount) : null;
    this.sOther = d && N(d.other_amount) ? N(d.other_amount) : null;
    this.sNote = d?.note ?? '';
  }

  protected async saveDay(): Promise<void> {
    if (!this.sDate) return this.toast.error('Pick a date');
    if (!this.dayTotal()) return this.toast.error('Enter at least one sales amount');
    this.saving.set(true);
    await this.data.saveDay({
      sale_date: this.sDate,
      cash_amount: N(this.sCash),
      phonepe_amount: N(this.sPP),
      other_amount: N(this.sOther),
      note: this.sNote.trim() || null,
    });
    this.saving.set(false);
    this.fillDay();
  }

  protected onCategoryChange(): void {
    if (this.eCat !== 'salary') return;
    const emp = this.data.employee();
    if (emp) {
      this.eEmp ??= emp.id;
      if (!this.eDesc) this.eDesc = `${emp.name} salary`;
    }
  }

  protected async saveExpense(): Promise<void> {
    if (!this.eDate) return this.toast.error('Pick a date');
    if (N(this.eAmount) <= 0) return this.toast.error('Enter the amount');
    this.saving.set(true);
    const ok = await this.data.addExpense({
      expense_date: this.eDate,
      category: this.eCat,
      payment_mode: this.eMode,
      amount: N(this.eAmount),
      description: this.eDesc.trim() || null,
      employee_id: this.eCat === 'salary' ? this.eEmp ?? this.data.employee()?.id ?? null : null,
    });
    this.saving.set(false);
    if (ok) {
      this.eAmount = null;
      this.eDesc = '';
    }
  }

  protected async removeExpense(x: Expense): Promise<void> {
    if (confirm(`Delete "${x.description || CATEGORY_LABELS[x.category]}" (₹${N(x.amount)})?`)) {
      await this.data.deleteExpense(x.id);
    }
  }
}
