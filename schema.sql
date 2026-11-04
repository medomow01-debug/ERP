-- ===== ERP schema v2 — شغّله كاملاً في Supabase > SQL Editor (يحذف أي جداول قديمة للنظام) =====
create extension if not exists pgcrypto with schema extensions;
drop view if exists stock_balance;
drop table if exists profit_dist,partner_ledger,periods,partners,transfer_shares,transfers,treasury_tx,sales_containers,sales_return_lines,sales_returns,sales_lines,sales_invoices,
 installments,purchase_returns,purchase_lines,purchase_invoices,customers,suppliers,stock_moves,reasons,items,categories,warehouses,sessions,app_users,profiles,settings cascade;
drop function if exists gen_code() cascade; drop function if exists item_init() cascade;

create table settings(id int primary key default 1, company text default 'شركتي', phone text, address text, allow_discount bool default true,
  discounts numeric[] default '{5,10,15}', theme text default '#0f766e');
insert into settings(id) values(1);
create table app_users(id serial primary key, username text unique not null, pass text not null, name text, role text default 'employee',
  perms text[] default '{}', active bool default true, must_change bool default false);
insert into app_users(username,pass,name,role,must_change) values('admin',extensions.crypt('admin',extensions.gen_salt('bf')),'المدير','admin',true);
create table sessions(token text primary key default encode(extensions.gen_random_bytes(24),'hex'), user_id int references app_users on delete cascade, created timestamptz default now());

create table warehouses(id serial primary key, code char(1) unique not null, name text not null);
create table categories(id serial primary key, code char(1) unique not null, name text not null);
create table items(id serial primary key, code text unique, name text not null, wh_id int references warehouses, cat_id int references categories,
  buy numeric default 0, sell numeric default 0, min_qty numeric default 5);
create table reasons(id serial primary key, name text not null, sign int not null check (sign in (1,-1)));
insert into reasons(name,sign) values('تالف',-1),('مسروق',-1),('زيادة جرد',1);
create table stock_moves(id bigserial primary key, item_id int references items, wh_id int references warehouses, qty numeric not null,
  kind text, ref text, note text, created_at timestamptz default now());
create view stock_balance with (security_invoker=true) as
 select i.id item_id,i.code,i.name,m.wh_id,w.name wh,c.name cat,i.cat_id,i.buy,i.sell,i.min_qty,sum(m.qty) qty
 from stock_moves m join items i on i.id=m.item_id join warehouses w on w.id=m.wh_id left join categories c on c.id=i.cat_id group by i.id,m.wh_id,w.name,c.name;

create sequence if not exists sup_seq; create sequence if not exists cus_seq;
create table suppliers(id serial primary key, code text default 'S'||lpad(nextval('sup_seq')::text,4,'0'), name text not null, phone text, trade text);
create table customers(id serial primary key, code text default 'C'||lpad(nextval('cus_seq')::text,4,'0'), name text not null, phone text);

create table purchase_invoices(id serial primary key, supplier_id int references suppliers, date date default current_date, total numeric, mode text, pay_ref text, created_at timestamptz default now());
create table purchase_lines(id serial primary key, inv_id int references purchase_invoices, item_id int references items, wh_id int references warehouses,
  qty numeric, buy numeric, sell numeric, remaining numeric default 0, returned numeric default 0);
create table purchase_returns(id serial primary key, inv_id int references purchase_invoices, total numeric, date date default current_date);
create table installments(id serial primary key, inv_id int references purchase_invoices, due_date date, amount numeric, paid bool default false, paid_date date);

create table sales_invoices(id serial primary key, customer_id int references customers, date date default current_date, discount_pct numeric default 0,
  total numeric, mode text, kind text default 'normal', created_at timestamptz default now());
create table sales_lines(id serial primary key, inv_id int references sales_invoices, item_id int references items, qty numeric, price numeric, cost numeric, returned numeric default 0);
create table sales_returns(id serial primary key, inv_id int references sales_invoices, total numeric, date date default current_date, created_at timestamptz default now());
create table sales_return_lines(id serial primary key, ret_id int references sales_returns, line_id int references sales_lines, item_id int references items, qty numeric, price numeric, cost numeric);
create table sales_containers(id serial primary key, inv_id int references sales_invoices, ctype text, buy numeric, sell numeric, seller_id int references customers, buyer_id int references customers);

create table partners(id serial primary key, name text not null, phone text, pct numeric, active bool default true);
create table periods(id serial primary key, start_at timestamptz default now(), end_at timestamptz, status text default 'open', distributed bool default false);
insert into periods default values;
create table partner_ledger(id bigserial primary key, partner_id int references partners, kind text, amount numeric, period_id int references periods, note text, date date default current_date);
create table profit_dist(id serial primary key, period_id int references periods, partner_id int references partners, pct numeric, amount numeric, date date default current_date);
create table treasury_tx(id bigserial primary key, kind text check (kind in ('in','out')), amount numeric not null, source text, partner_id int references partners,
  party text, inv_id int, payee text, note text, ref text, date date default current_date, created_at timestamptz default now());
create table transfers(id bigserial primary key, dir text check (dir in ('in','out')), amount numeric not null, source text, party text, inv_id int, payee text, note text, ref text,
  date date default current_date, created_at timestamptz default now());
create table transfer_shares(id bigserial primary key, transfer_id bigint references transfers on delete cascade, partner_id int references partners, amount numeric);

create function gen_code() returns trigger language plpgsql as $$ begin
 if new.code is null then
  select w.code||c.code||(select count(*)+1 from items where wh_id=new.wh_id and cat_id=new.cat_id) into new.code
  from warehouses w, categories c where w.id=new.wh_id and c.id=new.cat_id;
 end if; return new; end $$;
create trigger t_code before insert on items for each row execute function gen_code();
create function item_init() returns trigger language plpgsql as $$ begin
 insert into stock_moves(item_id,wh_id,qty,kind) values(new.id,new.wh_id,0,'init'); return new; end $$;
create trigger t_init after insert on items for each row execute function item_init();

-- صرف بنظام FIFO: يخصم من أقدم دفعة شراء ويرجع سعر كل دفعة
create function fifo_take(p_item int, p_qty numeric) returns table(q numeric, buy numeric, sell numeric) language plpgsql as $$
declare r record; l numeric:=p_qty; t numeric; begin
 for r in select pl.id,pl.remaining,pl.buy b,pl.sell s from purchase_lines pl where pl.item_id=p_item and pl.remaining>0 order by pl.id loop
  exit when l<=0; t:=least(r.remaining,l);
  update purchase_lines set remaining=remaining-t where id=r.id;
  q:=t; buy:=r.b; sell:=r.s; return next; l:=l-t;
 end loop;
 if l>0 then select i.buy,i.sell into buy,sell from items i where i.id=p_item; q:=l; return next; end if;
end $$;

-- الحسابات والجلسات (بدون Supabase Auth)
create function cur_user() returns int language sql stable security definer set search_path=public as $$
 select user_id from sessions where token=nullif(coalesce(current_setting('request.headers',true),'{}')::json->>'x-token','') and created>now()-interval '30 days' limit 1 $$;
create function is_admin() returns bool language sql stable security definer set search_path=public as $$
 select exists(select 1 from app_users where id=cur_user() and role='admin' and active) $$;
create function app_login(u text,p text) returns json language plpgsql security definer set search_path=public,extensions as $$
declare r app_users; t text; begin
 select * into r from app_users where username=lower(u) and active and pass=crypt(p,pass);
 if not found then return null; end if;
 delete from sessions where created<now()-interval '30 days';
 insert into sessions(user_id) values(r.id) returning token into t;
 return json_build_object('token',t,'id',r.id,'name',r.name,'role',r.role,'perms',r.perms,'must_change',r.must_change); end $$;
create function app_me() returns json language sql stable security definer set search_path=public as $$
 select json_build_object('id',id,'name',name,'role',role,'perms',perms,'must_change',must_change) from app_users where id=cur_user() and active $$;
create function app_logout() returns void language sql security definer set search_path=public as $$
 delete from sessions where token=coalesce(current_setting('request.headers',true),'{}')::json->>'x-token' $$;
create function app_change_pass(o text,n text) returns bool language plpgsql security definer set search_path=public,extensions as $$
begin if length(n)<4 then raise exception 'كلمة المرور قصيرة'; end if;
 update app_users set pass=crypt(n,gen_salt('bf')),must_change=false where id=cur_user() and pass=crypt(o,pass);
 return found; end $$;
create function app_users_list() returns table(id int,username text,name text,role text,perms text[],active bool) language plpgsql security definer set search_path=public as $$
begin if not is_admin() then raise exception 'غير مصرح'; end if;
 return query select a.id,a.username,a.name,a.role,a.perms,a.active from app_users a order by a.id; end $$;
create function app_user_save(j jsonb) returns void language plpgsql security definer set search_path=public,extensions as $$
declare pw text:=coalesce(j->>'password',''); pm text[]:=array(select jsonb_array_elements_text(coalesce(j->'perms','[]'::jsonb)));
begin if not is_admin() then raise exception 'غير مصرح'; end if;
 if j->>'id' is not null then
  update app_users set name=j->>'name',role=j->>'role',perms=pm,active=coalesce((j->>'active')::bool,true),
   pass=case when pw<>'' then crypt(pw,gen_salt('bf')) else pass end, must_change=must_change or pw<>'' where id=(j->>'id')::int;
 else
  if pw='' then raise exception 'كلمة المرور مطلوبة'; end if;
  insert into app_users(username,pass,name,role,perms,must_change) values(lower(j->>'username'),crypt(pw,gen_salt('bf')),j->>'name',coalesce(j->>'role','employee'),pm,true);
 end if; end $$;

-- الأمان: كل الجداول لا يصل إليها إلا من معه جلسة صالحة (x-token). جدولا الحسابات والجلسات مغلقان تماماً.
do $$ declare t text; begin
 for t in select tablename from pg_tables where schemaname='public' loop
  execute format('alter table %I enable row level security',t);
  if t not in ('app_users','sessions') then
   execute format('create policy s_all on %I for all to anon,authenticated using(cur_user() is not null) with check(cur_user() is not null)',t);
  end if;
 end loop; end $$;
