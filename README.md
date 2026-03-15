# RecyclePrice.tw — 全台回收即時行情

全台回收場廢銅、廢鐵、鋁罐、廢紙等品項即時價格比較平台。
社群回報 + 自動爬蟲雙軌並行，讓回收資訊不再不透明。

---

## 功能

- 📊 **行情看板**：各品項近7天均價、最高最低價一覽
- 📝 **社群回報**：任何人都可以回報今天的回收價格
- 🗺️ **地圖找場**：附近回收場列表
- 📈 **走勢圖**：單一品項近30天歷史價格折線圖
- 🤖 **自動爬蟲**：每天早上自動抓取永利行最新牌價
- 🛡️ **IP 防濫用**：黑名單、頻率限制、價格合理性檢查、社群舉報

---

## 部署步驟

### 1. 建立 Supabase 專案

1. 前往 [supabase.com](https://supabase.com) 建立免費專案
2. 進入 **SQL Editor**，貼上並執行 `supabase/migrations/001_init.sql`
3. 執行以下 SQL，建立 increment_vote function：

```sql
create or replace function increment_vote(row_id uuid, col_name text)
returns void language plpgsql as $$
begin
  if col_name = 'upvotes' then
    update price_reports set upvotes = upvotes + 1 where id = row_id;
  elsif col_name = 'downvotes' then
    update price_reports set downvotes = downvotes + 1 where id = row_id;
  end if;
end;
$$;
```

4. 從 **Project Settings > API** 取得：
   - `Project URL`
   - `anon public` key
   - `service_role` key（保密！）

### 2. 部署到 Vercel

1. 把此專案 push 到 GitHub
2. 到 [vercel.com](https://vercel.com) 連結 GitHub repo
3. 在 Vercel **Environment Variables** 設定：

| 變數名稱 | 說明 |
|----------|------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key（保密） |
| `SCRAPE_SECRET` | 自訂任意字串，保護爬蟲 API |

4. 點 **Deploy**

### 3. 設定 GitHub Actions 自動爬蟲

1. 在 GitHub repo 的 **Settings > Secrets and variables > Actions** 新增：
   - `APP_URL`：你的 Vercel 網址（例：`https://recycle-price.vercel.app`）
   - `SCRAPE_SECRET`：與 Vercel 環境變數相同的值

2. Actions 將在每天早上 8:00（台灣時間）自動觸發

也可以在 GitHub Actions 頁面手動觸發測試。

---

## 本地開發

```bash
# 安裝依賴
npm install

# 複製環境變數
cp .env.example .env.local
# 填入你的 Supabase 金鑰

# 啟動開發伺服器
npm run dev
```

---

## 技術架構

- **前端**：Next.js 14 (App Router) + TypeScript + Tailwind CSS
- **後端**：Next.js API Routes（Serverless）
- **資料庫**：Supabase (PostgreSQL + Row Level Security)
- **部署**：Vercel
- **CI/CD**：GitHub Actions（自動爬蟲排程）
- **圖表**：Recharts

---

## 目錄結構

```
recycle-tracker/
├── app/
│   ├── page.tsx              # 首頁行情看板
│   ├── report/page.tsx       # 回報價格表單
│   ├── map/page.tsx          # 地圖找回收場
│   ├── item/[id]/page.tsx    # 單一品項走勢頁
│   └── api/
│       ├── items/route.ts    # 取得品項列表
│       ├── report/route.ts   # 提交回報（含 IP 防護）
│       ├── vote/route.ts     # 投票 API
│       └── scrape/route.ts   # 爬蟲觸發 API
├── components/
│   ├── Header.tsx
│   ├── PriceCard.tsx
│   ├── PriceChart.tsx
│   └── VoteButtons.tsx
├── lib/
│   ├── supabase.ts           # Supabase client
│   ├── ip-utils.ts           # IP 防護工具
│   └── constants.ts          # 品項、縣市常數
└── supabase/migrations/
    └── 001_init.sql          # 資料庫初始化
```

---

## 未來規劃

- [ ] Line 登入
- [ ] 回報者等級制度
- [ ] 價格推播訂閱
- [ ] 大量廢料 B2B 媒合
- [ ] 業者認領後台
- [ ] AI 照片辨識品項
- [ ] 國際金屬行情整合（LME）
