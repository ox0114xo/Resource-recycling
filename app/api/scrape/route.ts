import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

// 只允許帶正確 secret 的呼叫（GitHub Actions 用）
export async function POST(req: NextRequest) {
  const secret = req.headers.get('x-scrape-secret')
  if (secret !== process.env.SCRAPE_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const results = await scrapeYonliham()
    return NextResponse.json({ success: true, count: results.length, items: results })
  } catch (err) {
    console.error('Scrape error:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

// ── 爬蟲主體 ──────────────────────────────────────────────────
async function scrapeYonliham(): Promise<any[]> {
  const res  = await fetch('https://yonliham.com/archives/price', {
    headers: { 'User-Agent': 'Mozilla/5.0 RecyclePriceTW/1.0 (price aggregator)' },
    next: { revalidate: 0 },
  })
  const html = await res.text()

  // 解析品項名稱與價格（格式：品項名 ... NT$數字/kg）
  const priceRegex = /<h3[^>]*>\s*([\u4e00-\u9fffA-Za-z0-9\s]+?)\s*<\/h3>[\s\S]*?NT\$([\d,]+(?:-[\d,]+)?)\s*\/kg/g
  const today = new Date().toISOString().split('T')[0]

  const scraped: { name: string; priceRaw: string; priceMin: number | null; priceMax: number }[] = []
  let match: RegExpExecArray | null

  while ((match = priceRegex.exec(html)) !== null) {
    const name     = match[1].trim()
    const priceRaw = match[2].replace(/,/g, '')

    let priceMin: number | null = null
    let priceMax: number

    if (priceRaw.includes('-')) {
      const parts = priceRaw.split('-')
      priceMin = Number(parts[0])
      priceMax = Number(parts[1])
    } else {
      priceMax = Number(priceRaw)
    }

    if (!name || isNaN(priceMax)) continue
    scraped.push({ name, priceRaw: match[2], priceMin, priceMax })
  }

  // 對應資料庫品項 ID
  const { data: itemRows } = await supabaseAdmin
    .from('items')
    .select('id, name')

  const itemMap = new Map((itemRows ?? []).map((i: any) => [i.name, i.id]))

  const toInsert = scraped
    .filter(s => itemMap.has(s.name))
    .map(s => ({
      item_id:     itemMap.get(s.name),
      price_max:   s.priceMax,
      price_min:   s.priceMin,
      source:      'yonliham',
      status:      'active',
      reported_at: today,
      vendor_name: '永利行資源回收科技',
      city:        '台中市',
    }))

  if (toInsert.length > 0) {
    // 先刪除今天同來源的舊資料，再寫入新資料
    await supabaseAdmin
      .from('price_reports')
      .delete()
      .eq('source', 'yonliham')
      .eq('reported_at', today)

    await supabaseAdmin.from('price_reports').insert(toInsert)
  }

  console.log(`[scrape] yonliham: ${toInsert.length} 筆寫入 (${today})`)
  return toInsert
}
