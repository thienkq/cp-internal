-- Seed example data
insert into public.signup_email_domains (domain, type, reason) values
  ('coderpush.com', 'allow', 'Internal signups')
on conflict (domain) do nothing;

insert into leave_types (name, description, is_paid, supports_carryover, supports_half_day, quota) values
  ('Annual Leave', 'Default leave type for employees.', true, true, true, 12),
  ('Wedding Leave', 'Special paid leave for marriage, up to 3 days.', true, false, true, 3),
  ('Emergency Leave', 'Leave for family emergency per HR policy.', true, false, true, 3),
  ('Unpaid Leave', 'When running out of annual paid leaves or taking a long unpaid break.', false, false, true, null);


insert into company_settings (carryover_expiry_day, carryover_expiry_month, tenure_accrual_rules) values
  (31, 1, '{"1":12,"2":13,"3":15,"4":18,"5":22}');


insert into projects (name) values
  ('Athletica'),
  ('AWS'),
  ('Capsule Transit'),
  ('Casebook'),
  ('Coin Theaters'),
  ('Commun1ty'),
  ('DuxSoup'),
  ('Ensign'),
  ('Groopl'),
  ('HR/Ops'),
  ('Inhalio'),
  ('Joe Coffee'),
  ('Lemonade'),
  ('Locket'),
  ('Marketing/Sales/Bizdev'),
  ('Moneta'),
  ('Orchestars'),
  ('R&D'),
  ('Rsportz'),
  ('Shrimpl'),
  ('Skylab'),
  ('Sleek'),
  ('Think Global School'); 