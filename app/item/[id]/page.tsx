import { supabase } from '@/lib/supabase'
import Header from '@/components/Header'
import PriceChart from '@/components/PriceChart'
import VoteButtons from '@/components/VoteButtons'
import { notFound } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export const revalidate = 300

async function getItem(id: string) {
  const { data } = await supabase
    .from('items')
    .select('id, name, unit, categories(name)')
    .eq('id', id)
    .single()
  return data
}

async function getHistory(itemId: string) {
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  const { data } = await supabase
    .from('price_reports')
    .select('price_max, price_min, reported_at')
    .eq('item_id', itemId)
    .eq('status', 'active')
    .gte('reported_at', since)
    .order('reported_at')

  // 按日期聚合
  const byDate: Record<string, number[]> = {}
  for (const r of data ?? []) {
    if (!byDate[r.reported_at]) byDate[r.reported_at] = []
    byDate[r.reported_at].push(Number(r.price_max))
  }

  return Object.entries(byDate).map(([date, prices]) => ({
    date,
    avg: prices.reduce((a, b) => a + b, 0) / prices.length,
    min: Math.min(...prices),
    max: Math.max(...prices),
  }))
}

async function getRecentReports(itemId: string) {
  const { data } = await supabase
    .from('price_reports')
    .select('id, price_max, city, vendor_name, reported_at, source, upvotes, downvotes')
    .eq('item_id', itemId)
    .eq('status', 'active')
    .order('reported_at', { ascending: false })
    .limit(30)
  return data ?? []
}

export default async function ItemPage({ params }: { params: { id: string } }) {
  const [item, history, reports] = await Promise.all([
    getItem(params.id),
    getHistory(params.id),
    getRecentReports(params.id),
  ])

  if (!item) return notFound()

  const latestPrice = reports[0]?.price_max ?? null
  const category    = (item as any).categories?.name ?? ''

  return (
    <div className="min-h-screen grid-bg">
      <Header />
      <main className="max-w-4xl mx-auto px-4 py-8">

        {/* 返回 */}
        <Link href="/" className="flex items-center gap-1.5 text-gray-500 hover:text-gray-200 text-sm mb-6 transition-colors">
          <ArrowLeft size={14} /> 返回看板
        </Link>

        {/* 頁頭 */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <p className="label">{category}</p>
            <h1 className="text-3xl font-bold text-gray-100 mt-1">{item.name}</h1>
          </div>
          {latestPrice && (
            <div className="text-right">
              <p className="label">最新均價</p>
              <p className="font-mono font-bold text-3xl text-brand-400 mt-1">
                {latestPrice}
                <span className="text-gray-600 text-base font-normal ml-1">元/{item.unit}</span>
              </p>
            </div>
          )}
        </div>

        {/* 走勢圖 */}
        <div className="card mb-6">
          <PriceChart data={history} itemName={item.name} unit={item.unit} />
        </div>

        {/* 回報列表 */}
        <div className="card p-0 overflow-hidden">
          <div className="px-5 py-4 border-b border-surface-border">
            <h2 className="font-medium text-gray-200">所有回報紀錄</h2>
          </div>
          {reports.length === 0 ? (
            <div className="text-center py-10 text-gray-600">
              <p className="text-sm">尚無回報</p>
              <Link href="/report" className="text-brand-500 text-sm mt-2 inline-block hover:underline">
                搶先回報 →
              </Link>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-surface-border">
                  <th className="label px-5 py-3 text-left">價格</th>
                  <th className="label px-5 py-3 text-left hidden sm:table-cell">地區</th>
                  <th className="label px-5 py-3 text-left hidden md:table-cell">業者</th>
                  <th className="label px-5 py-3 text-left">日期</th>
                  <th className="label px-5 py-3 text-left">評分</th>
                </tr>
              </thead>
              <tbody>
                {reports.map((r: any) => (
                  <tr key={r.id} className="border-b border-surface-border/40 hover:bg-surface-muted/50">
                    <td className="px-5 py-3 font-mono font-bold text-brand-400">
                      {r.price_max}
                      <span className="text-gray-600 text-xs ml-1">元</span>
                    </td>
                    <td className="px-5 py-3 text-gray-400 hidden sm:table-cell">{r.city ?? '—'}</td>
                    <td className="px-5 py-3 text-gray-500 text-xs hidden md:table-cell">{r.vendor_name ?? '未填寫'}</td>
                    <td className="px-5 py-3 text-gray-600 font-mono text-xs">{r.reported_at}</td>
                    <td className="px-5 py-3">
                      <VoteButtons reportId={r.id} upvotes={r.upvotes} downvotes={r.downvotes} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

      </main>
    </div>
  )
}
