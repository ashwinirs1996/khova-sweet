export type Category = 'operating' | 'purchase' | 'salary' | 'other';
export type PayMode = 'cash' | 'phonepe' | 'other';
export type SalaryEntryType = 'salary' | 'deduction';

/** Numeric columns come back from Supabase as strings — always read them through N(). */
type Num = number | string;

export interface DailySale {
  id?: number;
  sale_date: string;
  cash_amount: Num;
  phonepe_amount: Num;
  other_amount: Num;
  note: string | null;
}

export interface Expense {
  id: number;
  expense_date: string;
  category: Category;
  payment_mode: PayMode;
  amount: Num;
  description: string | null;
  employee_id: number | null;
  created_at?: string;
}

export interface Employee {
  id: number;
  name: string;
  phone: string | null;
  role: string | null;
  monthly_salary: Num;
  join_date: string;
  active: boolean;
}

export interface SalaryEntry {
  id: number;
  employee_id: number;
  month: string;
  entry_type: SalaryEntryType;
  amount: Num;
  reason: string | null;
  created_at?: string;
}

export type NewExpense = Omit<Expense, 'id' | 'created_at'>;
export type NewSalaryEntry = Omit<SalaryEntry, 'id' | 'created_at'>;
export type EmployeeInput = Omit<Employee, 'id' | 'active'>;

export const CATEGORY_LABELS: Record<Category, string> = {
  operating: 'Daily expense',
  purchase: 'Purchase',
  salary: 'Salary',
  other: 'Other',
};

export const MODE_LABELS: Record<PayMode, string> = {
  cash: '💵 Cash',
  phonepe: '📱 PhonePe',
  other: '🔖 Other',
};
