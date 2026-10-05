import { CATEGORY_LABELS, Category, DailySale, Employee, Expense, MODE_LABELS, SalaryEntry } from './models';
import { N, fmtDate, monthName, sumBy } from './util';

// ---------- Day-wise ----------

export interface DayRow {
  day: number;
  date: string;
  cash: number;
  pp: number;
  other: number;
  sales: number;
  cashExp: number;
  ppExp: number;
  otherExp: number;
  exp: number;
  net: number;
  hasSale: boolean;
}

/** One row per date that has sales or daily (operating) expenses. Day numbers are over ALL dates. */
export function buildDays(days: DailySale[], expenses: Expense[]): DayRow[] {
  const byDate = new Map<string, DayRow>();
  const row = (date: string): DayRow => {
    let r = byDate.get(date);
    if (!r) {
      r = { day: 0, date, cash: 0, pp: 0, other: 0, sales: 0, cashExp: 0, ppExp: 0, otherExp: 0, exp: 0, net: 0, hasSale: false };
      byDate.set(date, r);
    }
    return r;
  };

  for (const d of days) {
    const r = row(d.sale_date);
    r.cash = N(d.cash_amount);
    r.pp = N(d.phonepe_amount);
    r.other = N(d.other_amount);
    r.hasSale = true;
  }
  for (const x of expenses) {
    if (x.category !== 'operating') continue;
    const r = row(x.expense_date);
    if (x.payment_mode === 'cash') r.cashExp += N(x.amount);
    else if (x.payment_mode === 'phonepe') r.ppExp += N(x.amount);
    else r.otherExp += N(x.amount);
  }

  const all = [...byDate.values()].sort((a, b) => (a.date < b.date ? -1 : 1));
  all.forEach((r, i) => {
    r.day = i + 1;
    r.sales = r.cash + r.pp + r.other;
    r.exp = r.cashExp + r.ppExp + r.otherExp;
    r.net = r.sales - r.exp;
  });
  return all;
}

// ---------- Summary / P&L ----------

export interface ExpenseGroup {
  category: Category;
  name: string;
  amount: number;
}

export interface Summary {
  cash: number;
  pp: number;
  other: number;
  sales: number;
  cashExp: number;
  ppExp: number;
  exp: number;
  purchase: number;
  salary: number;
  otherPay: number;
  extra: number;
  gross: number;
  opProfit: number;
  net: number;
  cashOut: number;
  ppOut: number;
  cashBalance: number;
  ppBalance: number;
  saleDays: number;
  avg: number;
  best: DayRow | null;
  firstDate: string | null;
  lastDate: string | null;
  opLines: ExpenseGroup[];
  breakdown: ExpenseGroup[];
}

export function summarize(rows: DayRow[], exps: Expense[]): Summary {
  const cash = sumBy(rows, (r) => r.cash);
  const pp = sumBy(rows, (r) => r.pp);
  const other = sumBy(rows, (r) => r.other);
  const sales = cash + pp + other;
  const cashExp = sumBy(rows, (r) => r.cashExp);
  const ppExp = sumBy(rows, (r) => r.ppExp);
  const exp = sumBy(rows, (r) => r.exp);

  const byCat = (c: Category) => sumBy(exps.filter((x) => x.category === c), (x) => N(x.amount));
  const outBy = (m: string) => sumBy(exps.filter((x) => x.payment_mode === m), (x) => N(x.amount));
  const purchase = byCat('purchase');
  const salary = byCat('salary');
  const otherPay = byCat('other');
  const extra = purchase + salary + otherPay;

  const groups = new Map<string, ExpenseGroup>();
  for (const x of exps) {
    const name = x.description || CATEGORY_LABELS[x.category];
    const key = x.category + '|' + name;
    const g = groups.get(key) ?? { category: x.category, name, amount: 0 };
    g.amount += N(x.amount);
    groups.set(key, g);
  }
  const breakdown = [...groups.values()].sort((a, b) => b.amount - a.amount);

  const saleRows = rows.filter((r) => r.sales > 0);
  const best = saleRows.reduce<DayRow | null>((b, r) => (!b || r.sales > b.sales ? r : b), null);
  const cashOut = outBy('cash');
  const ppOut = outBy('phonepe');

  return {
    cash, pp, other, sales, cashExp, ppExp, exp,
    purchase, salary, otherPay, extra,
    gross: sales - purchase,
    opProfit: sales - exp,
    net: sales - exp - extra,
    cashOut, ppOut,
    cashBalance: cash - cashOut,
    ppBalance: pp - ppOut,
    saleDays: saleRows.length,
    avg: saleRows.length ? sales / saleRows.length : 0,
    best,
    firstDate: rows.length ? rows[0].date : null,
    lastDate: rows.length ? rows[rows.length - 1].date : null,
    opLines: breakdown.filter((g) => g.category === 'operating'),
    breakdown,
  };
}

export interface MonthRow {
  key: string;
  sales: number;
  purchase: number;
  exp: number;
  salary: number;
  other: number;
  net: number;
}

export function monthlyPL(rows: DayRow[], exps: Expense[]): MonthRow[] {
  const map = new Map<string, MonthRow>();
  const M = (key: string): MonthRow => {
    let m = map.get(key);
    if (!m) {
      m = { key, sales: 0, purchase: 0, exp: 0, salary: 0, other: 0, net: 0 };
      map.set(key, m);
    }
    return m;
  };
  for (const r of rows) {
    const m = M(r.date.slice(0, 7));
    m.sales += r.sales;
    m.exp += r.exp;
  }
  for (const x of exps) {
    if (x.category === 'operating') continue;
    M(x.expense_date.slice(0, 7))[x.category] += N(x.amount);
  }
  const list = [...map.values()].sort((a, b) => (a.key < b.key ? -1 : 1));
  list.forEach((m) => (m.net = m.sales - m.purchase - m.exp - m.salary - m.other));
  return list;
}

// ---------- Employee salary ----------

export interface SalaryMonth {
  key: string;
  salary: number;
  deduction: number;
  payable: number;
  paid: number;
  balance: number;
}

export interface LedgerRow {
  sort: string;
  when: string;
  kind: 'salary' | 'deduction' | 'payment';
  text: string;
  amount: number;
  table: 'salary_entries' | 'expenses';
  id: number;
}

export interface SalaryView {
  months: SalaryMonth[];
  ledger: LedgerRow[];
  totSalary: number;
  totDed: number;
  payable: number;
  paid: number;
  balance: number;
}

/** Balance = salary added − deductions − paid. Positive = due to employee, negative = advance. */
export function salaryView(emp: Employee, entries: SalaryEntry[], expenses: Expense[]): SalaryView {
  const mine = entries.filter((s) => s.employee_id === emp.id);
  // With a single employee, salary payments without an employee link are treated as theirs.
  const pays = expenses.filter((x) => x.category === 'salary' && (x.employee_id == null || x.employee_id === emp.id));

  const map = new Map<string, SalaryMonth>();
  const M = (key: string): SalaryMonth => {
    let m = map.get(key);
    if (!m) {
      m = { key, salary: 0, deduction: 0, payable: 0, paid: 0, balance: 0 };
      map.set(key, m);
    }
    return m;
  };
  for (const s of mine) M(s.month.slice(0, 7))[s.entry_type] += N(s.amount);
  for (const p of pays) M(p.expense_date.slice(0, 7)).paid += N(p.amount);

  const months = [...map.values()].sort((a, b) => (a.key < b.key ? -1 : 1));
  let running = 0;
  for (const m of months) {
    m.payable = m.salary - m.deduction;
    running += m.payable - m.paid;
    m.balance = running;
  }

  const ledger: LedgerRow[] = [
    ...mine.map((s): LedgerRow => {
      const mName = monthName(s.month);
      const isSalary = s.entry_type === 'salary';
      return {
        sort: s.month + '|' + (s.created_at ?? ''),
        when: mName,
        kind: s.entry_type,
        text: isSalary ? `Salary for ${mName}${s.reason ? ' · ' + s.reason : ''}` : s.reason || 'Deduction',
        amount: N(s.amount),
        table: 'salary_entries',
        id: s.id,
      };
    }),
    ...pays.map((p): LedgerRow => ({
      sort: p.expense_date + '|' + (p.created_at ?? ''),
      when: fmtDate(p.expense_date),
      kind: 'payment',
      text: `${MODE_LABELS[p.payment_mode]} · ${p.description || 'Salary payment'}`,
      amount: N(p.amount),
      table: 'expenses',
      id: p.id,
    })),
  ].sort((a, b) => (a.sort < b.sort ? 1 : -1));

  const totSalary = sumBy(months, (m) => m.salary);
  const totDed = sumBy(months, (m) => m.deduction);
  const paid = sumBy(months, (m) => m.paid);
  return { months, ledger, totSalary, totDed, payable: totSalary - totDed, paid, balance: totSalary - totDed - paid };
}
