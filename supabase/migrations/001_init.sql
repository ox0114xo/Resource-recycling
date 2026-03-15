-- =============================================
-- 全台回收價格回報系統 - 資料庫初始化
-- 執行環境：Supabase SQL Editor
-- =============================================

-- 1. 品項分類表
create table if not exists categories (
  id   serial primary key,
  name text not null unique  -- 銅類、鐵類、鋁類、紙類、塑膠、電子
);

insert into categories (name) values
  ('銅類'), ('鐵類'), ('鋁類'), ('紙類'), ('塑膠'), ('電子') on conflict do nothing;

-- 2. 回收品項表
create table if not exists items (
  id          serial primary key,
  category_id int  references categories(id),
  name        text not null unique,  -- 紅銅線、廢鐵、鋁罐...
  unit        text default 'kg',
  sort_order  int  default 0
);

insert into items (category_id, name, unit, sort_order) values
  (1, '紅銅線',   'kg', 1),
  (1, '紅銅板',   'kg', 2),
  (1, '紅銅管',   'kg', 3),
  (1, '紅銅屑',   'kg', 4),
  (1, '馬達線',   'kg', 5),
  (1, '雜銅',     'kg', 6),
  (2, '廢鐵',     'kg', 10),
  (2, '白鐵',     'kg', 11),
  (2, '鋼筋',     'kg', 12),
  (2, '鐵罐',     'kg', 13),
  (3, '鋁罐',     'kg', 20),
  (3, '鋁板',     'kg', 21),
  (3, '鋁窗框',   'kg', 22),
  (4, '報紙',     'kg', 30),
  (4, '紙箱',     'kg', 31),
  (4, '雜誌',     'kg', 32),
  (5, '寶特瓶',   'kg', 40),
  (5, 'HDPE',     'kg', 41),
  (5, '雜塑膠',   'kg', 42),
  (6, '電線',     'kg', 50),
  (6, '廢電池',   'kg', 51),
  (6, '電子廢料', 'kg', 52) on conflict do nothing;

-- 3. 回收業者表
create table if not exists vendors (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  address     text,
  city        text,         -- 縣市
  district    text,         -- 鄉鎮市區
  lat         numeric(10,7),
  lng         numeric(10,7),
  phone       text,
  website     text,
  is_verified boolean default false,  -- 付費認證業者
  is_vip      boolean default false,  -- 付費置頂
  created_at  timestamptz default now()
);

-- 4. 價格回報主表
create table if not exists price_reports (
  id           uuid primary key default gen_random_uuid(),
  item_id      int  references items(id) not null,
  vendor_id    uuid references vendors(id),
  vendor_name  text,          -- 未認領業者的自填名稱
  city         text,
  price_min    numeric,       -- 最低價（範圍報價時用）
  price_max    numeric,       -- 最高價（主要欄位）
  source       text not null, -- 'user' | 'yonliham' | 'scraper'
  ip_hash      text,          -- sha256(ip)，不存原始 IP
  user_id      uuid,          -- 未來 Line 登入後填入
  status       text default 'active',  -- 'active' | 'pending' | 'hidden'
  upvotes      int  default 0,
  downvotes    int  default 0,
  reported_at  date default current_date,
  created_at   timestamptz default now()
);

-- 5. IP 黑名單表
create table if not exists ip_blacklist (
  id            serial primary key,
  ip_hash       text unique not null,
  reason        text,        -- 'spam' | 'price_manipulation' | 'manual'
  report_count  int default 0,
  banned_at     timestamptz default now(),
  expires_at    timestamptz  -- null = 永久封鎖
);

-- 6. 投票紀錄表（防止重複投票）
create table if not exists votes (
  id         serial primary key,
  report_id  uuid references price_reports(id) on delete cascade,
  ip_hash    text,
  vote       text not null,   -- 'up' | 'down'
  created_at timestamptz default now(),
  unique (report_id, ip_hash)
);

-- 7. 推播訂閱表
create table if not exists subscriptions (
  id          uuid primary key default gen_random_uuid(),
  item_id     int  references items(id),
  city        text,
  threshold   numeric,        -- 價格漲超過此值才推播
  contact     text not null,  -- Line User ID 或 email
  type        text default 'line',  -- 'line' | 'email'
  is_active   boolean default true,
  created_at  timestamptz default now()
);

-- =============================================
-- 索引（加速查詢）
-- =============================================
create index if not exists idx_price_reports_item     on price_reports(item_id);
create index if not exists idx_price_reports_date     on price_reports(reported_at desc);
create index if not exists idx_price_reports_status   on price_reports(status);
create index if not exists idx_price_reports_ip       on price_reports(ip_hash);
create index if not exists idx_ip_blacklist_hash      on ip_blacklist(ip_hash);
create index if not exists idx_vendors_city           on vendors(city);

-- =============================================
-- Row Level Security
-- =============================================
alter table price_reports  enable row level security;
alter table ip_blacklist   enable row level security;
alter table votes          enable row level security;
alter table vendors        enable row level security;
alter table subscriptions  enable row level security;

-- 所有人可以讀取 active 的價格
create policy "Public read active prices"
  on price_reports for select
  using (status = 'active');

-- 所有人可以讀取業者資料
create policy "Public read vendors"
  on vendors for select
  using (true);

-- 只有 service role 可以寫入（透過 API Route）
create policy "Service role can insert price_reports"
  on price_reports for insert
  with check (true);

create policy "Service role can update price_reports"
  on price_reports for update
  using (true);

create policy "Service role can insert votes"
  on votes for insert
  with check (true);

create policy "Service role can read ip_blacklist"
  on ip_blacklist for select
  using (true);

create policy "Service role can insert ip_blacklist"
  on ip_blacklist for insert
  with check (true);

-- =============================================
-- 取得品項近7天均價的 View
-- =============================================
create or replace view item_recent_avg as
select
  i.id          as item_id,
  i.name        as item_name,
  c.name        as category,
  i.unit,
  round(avg(pr.price_max), 1)  as avg_price,
  round(min(pr.price_max), 1)  as min_price,
  round(max(pr.price_max), 1)  as max_price,
  count(*)                     as report_count,
  max(pr.reported_at)          as last_reported
from items i
join categories c on c.id = i.category_id
left join price_reports pr
  on pr.item_id = i.id
  and pr.status = 'active'
  and pr.reported_at >= current_date - interval '7 days'
group by i.id, i.name, c.name, i.unit
order by c.name, i.sort_order;
