'use client'
import { useState, useEffect } from 'react'
import Header from '@/components/Header'
import { CITIES } from '@/lib/constants'
import { CheckCircle, AlertCircle, Loader2 } from 'lucide-react'

type Item = { id: number; name: string; category: string; unit: string }

export default function ReportPage() {
  const [items, setItems]         = useState<Item[]>([])
  const [category, setCategory]   = useState('')
  const [itemId, setItemId]       = useState('')
  const [price, setPrice]         = useState('')
  const [city, setCity]           = useState('')
  const [vendorName, setVendorName] = useState('')
  const [status, setStatus]       = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [errorMsg, setErrorMsg]   = useState('')

  useEffect(() => {
    fetch('/api/items').then(r => r.json()).then(setItems)
  }, [])

  const categories = [...new Set(items.map(i => i.category))]
  const filteredItems = items.filter(i => !category || i.category === category)
  const selectedItem = items.find(i => String(i.id) === itemId)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!itemId || !price) return
    setStatus('loading')
    setErrorMsg('')
    try {
      const res = await fetch('/api/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          item_id: Number(itemId),
          price: Number(price),
          city: city || null,
          vendor_name: vendorName || null,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setErrorMsg(data.error || '回報失敗，請稍後再試')
        setStatus('error')
      } else {
        setStatus('success')
        setPrice(''); setVendorName(''); setItemId(''); setCategory('')
      }
    } catch {
      setErrorMsg('網路錯誤，請稍後再試')
      setStatus('error')
    }
  }

  return (
    <div className="min-h-screen grid-bg">
      <Header />
      <main className="max-w-xl mx-auto px-4 py-10">

        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-100">回報今日價格</h1>
          <p className="text-gray-500 text-sm mt-1">
            分享你今天在回收場拿到的價格，幫助大家掌握最新行情。
          </p>
        </div>

        {status === 'success' && (
          <div className="card border-green-800 bg-green-950/30 flex items-center gap-3 mb-6 animate-fade-in">
            <CheckCircle size={18} className="text-green-400 shrink-0" />
            <div>
              <p className="text-green-300 font-medium text-sm">回報成功！感謝你的貢獻 🙏</p>
              <p className="text-green-700 text-xs mt-0.5">資料將在審核後顯示於看板</p>
            </div>
          </div>
        )}

        {status === 'error' && (
          <div className="card border-red-800 bg-red-950/30 flex items-center gap-3 mb-6 animate-fade-in">
            <AlertCircle size={18} className="text-red-400 shrink-0" />
            <p className="text-red-300 text-sm">{errorMsg}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="card space-y-5">

          {/* 大類選擇 */}
          <div>
            <label className="label block mb-2">回收大類</label>
            <div className="flex flex-wrap gap-2">
              {categories.map(cat => (
                <button
                  key={cat} type="button"
                  onClick={() => { setCategory(c => c === cat ? '' : cat); setItemId('') }}
                  className={`px-3 py-1.5 rounded-lg text-sm transition-colors border ${
                    category === cat
                      ? 'bg-brand-600 border-brand-600 text-white'
                      : 'border-surface-border text-gray-400 hover:border-brand-700 hover:text-gray-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* 品項 */}
          <div>
            <label className="label block mb-2">回收品項 <span className="text-red-500">*</span></label>
            <select
              value={itemId}
              onChange={e => setItemId(e.target.value)}
              required
              className="w-full bg-surface-muted border border-surface-border rounded-lg px-3 py-2.5
                         text-gray-200 text-sm focus:outline-none focus:border-brand-600"
            >
              <option value="">請選擇品項...</option>
              {filteredItems.map(item => (
                <option key={item.id} value={item.id}>{item.name}</option>
              ))}
            </select>
          </div>

          {/* 價格 */}
          <div>
            <label className="label block mb-2">
              回收價格（元/{selectedItem?.unit || 'kg'}）<span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-mono text-sm">NT$</span>
              <input
                type="number"
                value={price}
                onChange={e => setPrice(e.target.value)}
                placeholder="例：365"
                min="0.1" max="99999" step="0.1"
                required
                className="w-full bg-surface-muted border border-surface-border rounded-lg pl-11 pr-3 py-2.5
                           text-gray-100 font-mono text-sm focus:outline-none focus:border-brand-600"
              />
            </div>
          </div>

          {/* 縣市 */}
          <div>
            <label className="label block mb-2">所在縣市</label>
            <select
              value={city}
              onChange={e => setCity(e.target.value)}
              className="w-full bg-surface-muted border border-surface-border rounded-lg px-3 py-2.5
                         text-gray-200 text-sm focus:outline-none focus:border-brand-600"
            >
              <option value="">不填寫</option>
              {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          {/* 業者名稱（選填） */}
          <div>
            <label className="label block mb-2">業者名稱（選填）</label>
            <input
              type="text"
              value={vendorName}
              onChange={e => setVendorName(e.target.value)}
              placeholder="例：永利行資源回收"
              maxLength={50}
              className="w-full bg-surface-muted border border-surface-border rounded-lg px-3 py-2.5
                         text-gray-200 text-sm focus:outline-none focus:border-brand-600"
            />
          </div>

          {/* 說明文字 */}
          <p className="text-xs text-gray-600 border-t border-surface-border pt-4">
            ⚠️ 回報即視同同意本站使用條款。惡意亂報將依 IP 自動封鎖。
            價格若與市場均價差距過大，將先進入審核佇列。
          </p>

          <button
            type="submit"
            disabled={status === 'loading'}
            className="btn-primary w-full flex items-center justify-center gap-2"
          >
            {status === 'loading' && <Loader2 size={15} className="animate-spin" />}
            {status === 'loading' ? '送出中...' : '送出回報'}
          </button>
        </form>

        {/* 回報規則說明 */}
        <div className="mt-6 card text-xs text-gray-600 space-y-1.5">
          <p className="text-gray-400 font-medium text-sm mb-2">回報規則</p>
          <p>• 同一 IP 每24小時最多回報 5 筆</p>
          <p>• 價格需為今日實際在回收場拿到的價格</p>
          <p>• 若價格偏離近期均價 ±40%，將進入人工審核</p>
          <p>• 被其他用戶舉報不實達3次將自動隱藏</p>
        </div>

      </main>
    </div>
  )
}
