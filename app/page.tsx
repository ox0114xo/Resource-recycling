import { supabase } from '@/lib/supabase'
import { CATEGORIES } from '@/lib/constants'
import type { ItemAvg } from '@/lib/constants'
import Header from '@/components/Header'
import PriceCard from '@/components/PriceCard'
import Link from 'next/link'
import { RefreshCw, TrendingUp, Users, Clock } from 'lucide-react'

export const revalidate = 300  // ISR：每5分鐘重新生成

async function getItemAverages(): Promise<ItemAvg[]> {
  const { data, error } = await supabase
    .from('item_recent_avg')
    .select('*')
  if (error) { console.error(error); return [] }
  return data as ItemAvg[]
}

async function getStats() {
  const today = new Date().toISOString().split('T')[0]
  const { count: todayCount } = await supabase
    .from('price_reports')
    .select('*', { count: 'exact', head: true })
    .eq('reported_at', today)
    .eq('status', 'active')

  const { count: totalCount } = await supabase
    .from('price_reports')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'active')

  return { todayCount: todayCount ?? 0, totalCount: totalCount ?? 0 }
}

function formatDate() {
  return new Date().toLocaleDateString('zh-TW', {
    year: 'numeric', month: 'long', day: 'numeric', weekday: 'short'
  })
}

export default async function HomePage() {
  const [items, stats] = await Promise.all([getItemAverages(), getStats()])

  // 依分類分組
  const grouped = CATEGORIES.map(cat => ({
    ...cat,
    items: items.filter(i => i.category === cat.name),
  }))

  const totalItems   = items.length
  const filledItems  = items.filter(i => i.avg_price !== null).length

  return (
    <div className="min-h-screen grid-bg">
      <Header />

      {/* Hero 資訊列 */}
      <div className="bg-surface-card border-b border-surface-border">
        <div className="max-w-6xl mx-auto px-4 py-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-lg font-bold text-gray-100">全台回收即時行情</h1>
            <p className="text-xs text-gray-500 font-mono mt-0.5">{formatDate()}</p>
          </div>
          <div className="flex gap-6 text-sm">
            <div className="flex items-center gap-2 text-gray-400">
              <TrendingUp size={14} className="text-brand-500" />
              <span className="font-mono">{filledItems}<span className="text-gray-600">/{totalItems}</span></span>
              <span className="text-xs text-gray-600">品項有資料</span>
            </div>
            <div className="flex items-center gap-2 text-gray-400">
              <Users size={14} className="text-brand-500" />
              <span className="font-mono">{stats.todayCount}</span>
              <span className="text-xs text-gray-600">今日回報</span>
            </div>
            <div className="flex items-center gap-2 text-gray-400">
              <Clock size={14} className="text-brand-500" />
              <span className="font-mono">{stats.totalCount}</span>
              <span className="text-xs text-gray-600">累計紀錄</span>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-6xl mx-auto px-4 py-8">

        {/* 呼籲回報 Banner */}
        {stats.todayCount < 10 && (
          <div className="mb-8 card border-brand-800 bg-brand-950/30 flex items-center justify-between gap-4">
            <div>
              <p className="text-brand-300 font-medium text-sm">資料還在累積中 📊</p>
              <p className="text-gray-500 text-xs mt-1">
                今天僅有 {stats.todayCount} 筆回報。你知道今天的回收行情嗎？幫大家更新！
              </p>
            </div>
            <Link href="/report" className="btn-primary whitespace-nowrap">
              立即回報
            </Link>
          </div>
        )}

        {/* 各分類價格卡片 */}
        {grouped.map(cat => (
          <section key={cat.id} className="mb-10">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-lg">{cat.emoji}</span>
              <h2 className="font-bold text-gray-200">{cat.name}</h2>
              <div className="flex-1 h-px bg-surface-border ml-2" />
              <span className="text-xs text-gray-600 font-mono">{cat.items.length} 品項</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {cat.items.map(item => (
                <Link key={item.item_id} href={`/item/${item.item_id}`}>
                  <PriceCard item={item} />
                </Link>
              ))}
            </div>
          </section>
        ))}

        {/* 最新回報串流 */}
        <section className="mt-4">
          <div className="flex items-center gap-2 mb-4">
            <RefreshCw size={15} className="text-brand-500" />
            <h2 className="font-bold text-gray-200">最新社群回報</h2>
            <div className="flex-1 h-px bg-surface-border ml-2" />
          </div>
          <RecentReports />
        </section>

      </main>

      <footer className="border-t border-surface-border mt-16 py-8 text-center text-xs text-gray-700 font-mono">
        RecyclePrice.tw — 價格由社群回報，僅供參考，實際以現場為準
      </footer>
    </div>
  )
}

// 最新回報列表（Server Component）
async function RecentReports() {
  const { data } = await supabase
    .from('price_reports')
    .select(`
      id, price_max, city, vendor_name, reported_at, source, upvotes, downvotes,
      items ( name, unit )
    `)
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(20)

  if (!data || data.length === 0) {
    return (
      <div className="card text-center py-10 text-gray-600">
        <p>尚無回報資料</p>
        <Link href="/report" className="text-brand-500 text-sm mt-2 inline-block hover:underline">
          成為第一個回報的人 →
        </Link>
      </div>
    )
  }

  return (
    <div className="card overflow-hidden p-0">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-surface-border text-left">
            <th className="label px-4 py-3">品項</th>
            <th className="label px-4 py-3">價格</th>
            <th className="label px-4 py-3 hidden sm:table-cell">地區</th>
            <th className="label px-4 py-3 hidden md:table-cell">業者</th>
            <th className="label px-4 py-3 hidden sm:table-cell">來源</th>
            <th className="label px-4 py-3">日期</th>
          </tr>
        </thead>
        <tbody>
          {data.map((r: any, idx: number) => (
            <tr
              key={r.id}
              className="border-b border-surface-border/50 hover:bg-surface-muted/50 transition-colors"
              style={{ animationDelay: `${idx * 30}ms` }}
            >
              <td className="px-4 py-3 font-medium text-gray-200">
                {r.items?.name ?? '—'}
              </td>
              <td className="px-4 py-3 font-mono text-brand-400 font-bold">
                {r.price_max} <span className="text-gray-600 text-xs">元/{r.items?.unit}</span>
              </td>
              <td className="px-4 py-3 text-gray-400 hidden sm:table-cell">
                {r.city ?? '—'}
              </td>
              <td className="px-4 py-3 text-gray-500 hidden md:table-cell text-xs">
                {r.vendor_name ?? '未填寫'}
              </td>
              <td className="px-4 py-3 hidden sm:table-cell">
                <span className={`badge ${r.source === 'user' ? 'bg-blue-950 text-blue-400' : 'bg-surface-muted text-gray-500'}`}>
                  {r.source === 'user' ? '社群' : '爬蟲'}
                </span>
              </td>
              <td className="px-4 py-3 text-gray-600 font-mono text-xs">
                {r.reported_at}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
