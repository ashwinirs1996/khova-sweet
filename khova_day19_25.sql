-- =====================================================================
-- Khova Sweet — Day 19 to Day 25 (Oct 8 – Oct 14), 2026
-- Day 14 = Oct 3 (after the one-day-back shift), so Day N = Oct (N - 11).
-- Run the shift-back-1-day update FIRST, otherwise old rows sit one day later.
-- Run in Supabase → SQL Editor. Safe to re-run (no duplicates).
-- =====================================================================

insert into public.daily_sales (sale_date, cash_amount, phonepe_amount, other_amount) values
  ('2026-10-08', 1630, 7075, 0),   -- Day 19, total 8705
  ('2026-10-09', 1925, 7440, 0),   -- Day 20, total 9365
  ('2026-10-10', 1150, 7465, 0),   -- Day 21, total 8615
  ('2026-10-11', 1968, 3335, 0),   -- Day 22, total 5303
  ('2026-10-12', 2240, 6455, 0),   -- Day 23, total 8695
  ('2026-10-13', 1395, 6255, 0),   -- Day 24, total 7650
  ('2026-10-14', 1730, 6910, 0)    -- Day 25, total 8640
on conflict (sale_date) do update
  set cash_amount = excluded.cash_amount,
      phonepe_amount = excluded.phonepe_amount,
      other_amount = excluded.other_amount;

insert into public.expenses (expense_date, category, payment_mode, amount, description)
select v.* from (values
  -- Day 19 (Oct 8)
  ('2026-10-08'::date, 'operating', 'cash',      130::numeric, 'Petrol'),
  ('2026-10-08'::date, 'operating', 'phonepe',   133,          'Porter'),
  -- Day 20 (Oct 9)
  ('2026-10-09'::date, 'operating', 'cash',       10,          'Daily expenses'),
  ('2026-10-09'::date, 'operating', 'phonepe',   190,          'Porter'),
  -- Day 21 (Oct 10)
  ('2026-10-10'::date, 'operating', 'cash',       20,          'Daily expenses'),
  ('2026-10-10'::date, 'operating', 'phonepe',   319,          'Container, spoons, porter'),
  ('2026-10-10'::date, 'other',     'phonepe', 15000,          'Bike payment'),
  -- Day 22 (Oct 11)
  ('2026-10-11'::date, 'operating', 'cash',      174,          'Porter'),
  ('2026-10-11'::date, 'operating', 'cash',      100,          'Petrol'),
  ('2026-10-11'::date, 'operating', 'cash',      144,          'Auto'),
  ('2026-10-11'::date, 'operating', 'cash',       50,          'Food'),
  ('2026-10-11'::date, 'operating', 'cash',      300,          'Labour wages'),
  ('2026-10-11'::date, 'operating', 'phonepe',   470,          'Container, spoons, cups'),
  ('2026-10-11'::date, 'purchase',  'phonepe', 12200,          'Khova purchase'),
  -- Day 23 (Oct 12)
  ('2026-10-12'::date, 'operating', 'cash',      130,          'Petrol, food'),
  -- Day 24 (Oct 13)
  ('2026-10-13'::date, 'operating', 'cash',       25,          'Food'),
  ('2026-10-13'::date, 'purchase',  'phonepe', 12050,          'Khova purchase'),
  -- Day 25 (Oct 14)
  ('2026-10-14'::date, 'operating', 'cash',      190,          'Porter, tea')
) as v(expense_date, category, payment_mode, amount, description)
where not exists (
  select 1 from public.expenses e
  where e.expense_date = v.expense_date and e.description = v.description
    and e.amount = v.amount and e.payment_mode = v.payment_mode
);

-- Check: sales 8705, 9365, 8615, 5303, 8695, 7650, 8640
-- Operating exp: Oct 8 263 | Oct 9 200 | Oct 10 339 | Oct 11 1238 | Oct 12 130 | Oct 13 25 | Oct 14 190
select s.sale_date,
       s.cash_amount + s.phonepe_amount + s.other_amount as total_sales,
       (select sum(amount) from public.expenses e
         where e.expense_date = s.sale_date and e.category = 'operating') as total_exp
from public.daily_sales s
where s.sale_date between '2026-10-08' and '2026-10-14'
order by s.sale_date;
