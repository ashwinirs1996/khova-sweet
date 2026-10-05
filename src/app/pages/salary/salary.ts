import { NgTemplateOutlet } from '@angular/common';
import { Component, effect, inject, signal, untracked } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LedgerRow } from '../../core/calc';
import { DataService } from '../../core/data.service';
import { PayMode } from '../../core/models';
import { ToastService } from '../../core/toast.service';
import { N, monthName, todayIso } from '../../core/util';
import { PIPES } from '../../shared/pipes';

type SalaryAction = 'salary' | 'deduction' | 'payment';

@Component({
  selector: 'app-salary',
  imports: [FormsModule, NgTemplateOutlet, ...PIPES],
  templateUrl: './salary.html',
})
export class Salary {
  protected readonly data = inject(DataService);
  private readonly toast = inject(ToastService);
  protected readonly abs = Math.abs;

  // Add salary / deduct / pay
  protected readonly action = signal<SalaryAction>('salary');
  protected readonly saving = signal(false);
  protected month = todayIso().slice(0, 7);
  protected payDate = todayIso();
  protected amount: number | null = null;
  protected payMode: PayMode = 'cash';
  protected note = '';

  // Employee details
  protected readonly editing = signal(false);
  protected empName = '';
  protected empPhone = '';
  protected empRole = '';
  protected empSalary: number | null = null;
  protected empJoin = todayIso();

  protected readonly buttonLabels: Record<SalaryAction, string> = {
    salary: '➕ Add Salary',
    deduction: '➖ Deduct Amount',
    payment: '💸 Record Payment',
  };

  constructor() {
    // Pre-fill the monthly salary once the employee is loaded.
    effect(() => {
      const emp = this.data.employee();
      untracked(() => {
        if (emp && this.action() === 'salary' && this.amount == null) this.amount = N(emp.monthly_salary) || null;
      });
    });
  }

  protected setAction(a: SalaryAction): void {
    this.action.set(a);
    const emp = this.data.employee();
    this.amount = a === 'salary' && emp ? N(emp.monthly_salary) || null : null;
    this.note = '';
  }

  protected async submit(): Promise<void> {
    const emp = this.data.employee();
    if (!emp) return this.toast.error('Add an employee first');
    if (N(this.amount) <= 0) return this.toast.error('Enter the amount');
    const a = this.action();
    let ok: boolean;

    this.saving.set(true);
    if (a === 'payment') {
      if (!this.payDate) {
        this.saving.set(false);
        return this.toast.error('Pick the payment date');
      }
      ok = await this.data.addExpense({
        expense_date: this.payDate,
        category: 'salary',
        payment_mode: this.payMode,
        amount: N(this.amount),
        description: this.note.trim() || `${emp.name} salary`,
        employee_id: emp.id,
      });
    } else {
      const monthStart = this.month + '-01';
      const duplicate =
        a === 'salary' &&
        this.data.salaryEntries().some((s) => s.employee_id === emp.id && s.entry_type === 'salary' && s.month === monthStart);
      if (!this.month || duplicate) {
        this.saving.set(false);
        return this.toast.error(
          duplicate ? `Salary for ${monthName(this.month)} is already added — delete it in the ledger to change it` : 'Pick a month',
        );
      }
      ok = await this.data.addSalaryEntry({
        employee_id: emp.id,
        month: monthStart,
        entry_type: a,
        amount: N(this.amount),
        reason: this.note.trim() || null,
      });
    }
    this.saving.set(false);
    if (ok) this.setAction(a);
  }

  protected async removeLedger(row: LedgerRow): Promise<void> {
    if (!confirm(`Delete "${row.text}"?`)) return;
    if (row.table === 'salary_entries') await this.data.deleteSalaryEntry(row.id);
    else await this.data.deleteExpense(row.id);
  }

  protected openEditor(): void {
    const e = this.data.employee();
    this.empName = e?.name ?? '';
    this.empPhone = e?.phone ?? '';
    this.empRole = e?.role ?? '';
    this.empSalary = e ? N(e.monthly_salary) : null;
    this.empJoin = e?.join_date ?? todayIso();
    this.editing.set(true);
  }

  protected async saveEmployee(): Promise<void> {
    if (!this.empName.trim()) return this.toast.error('Enter the name');
    const ok = await this.data.saveEmployee(
      {
        name: this.empName.trim(),
        phone: this.empPhone.trim() || null,
        role: this.empRole.trim() || null,
        monthly_salary: N(this.empSalary),
        join_date: this.empJoin,
      },
      this.data.employee()?.id,
    );
    if (ok) this.editing.set(false);
  }
}
