-- =====================================================================
-- Khova Sweet — Day 14 (Oct 4) & Day 15 (Oct 5), 2026
-- Run in Supabase → SQL Editor. Safe to re-run (no duplicates).
-- =====================================================================

insert into public.daily_sales (sale_date, cash_amount, phonepe_amount, other_amount) values
  ('2026-10-04', 1500, 5200, 0),
  ('2026-10-05', 1900, 6955, 0)
on conflict (sale_date) do update
  set cash_amount = excluded.cash_amount,
      phonepe_amount = excluded.phonepe_amount,
      other_amount = excluded.other_amount;

insert into public.expenses (expense_date, category, payment_mode, amount, description)
select v.* from (values
  ('2026-10-04'::date, 'operating', 'cash',    100::numeric, 'Petrol'),
  ('2026-10-04'::date, 'operating', 'cash',     50,          'Police'),
  ('2026-10-04'::date, 'operating', 'cash',     50,          'Lunch'),
  ('2026-10-04'::date, 'operating', 'phonepe', 300,          'Containers'),
  ('2026-10-05'::date, 'operating', 'cash',    100,          'Petrol'),
  ('2026-10-05'::date, 'operating', 'cash',     50,          'Police'),
  ('2026-10-05'::date, 'operating', 'phonepe', 150,          'Spoons')
) as v(expense_date, category, payment_mode, amount, description)
where not exists (
  select 1 from public.expenses e
  where e.expense_date = v.expense_date and e.description = v.description
    and e.amount = v.amount and e.payment_mode = v.payment_mode
);

-- Check: Oct 4 → sales 6700, exp 500 | Oct 5 → sales 8855, exp 300
select s.sale_date,
       s.cash_amount + s.phonepe_amount + s.other_amount as total_sales,
       (select sum(amount) from public.expenses e
         where e.expense_date = s.sale_date and e.category = 'operating') as total_exp
from public.daily_sales s
where s.sale_date in ('2026-10-04', '2026-10-05')
order by s.sale_date;
