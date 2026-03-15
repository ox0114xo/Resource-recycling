import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import {
  getClientIp, hashIp,
  isIpBanned, checkRateLimit,
  isPriceReasonable, autobanIfNeeded
} from '@/lib/ip-utils'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { item_id, price, city, vendor_name } = body

    // --- 基本驗證 ---
    if (!item_id || typeof item_id !== 'number') {
      return NextResponse.json({ error: '請選擇回收品項' }, { status: 400 })
    }
    if (!price || typeof price !== 'number' || price <= 0 || price > 99999) {
      return NextResponse.json({ error: '請輸入有效的價格（0.1 ~ 99999）' }, { status: 400 })
    }

    // --- IP 處理 ---
    const ip     = getClientIp(req)
    const ipHash = hashIp(ip)

    // 檢查黑名單
    const banned = await isIpBanned(ipHash)
    if (banned) {
      return NextResponse.json(
        { error: '此 IP 因異常回報已被封鎖，如有疑問請聯繫我們' },
        { status: 403 }
      )
    }

    // 檢查頻率限制
    const rateCheck = await checkRateLimit(ipHash)
    if (!rateCheck.allowed) {
      return NextResponse.json({ error: rateCheck.reason }, { status: 429 })
    }

    // --- 價格合理性 ---
    const { reasonable, avg } = await isPriceReasonable(item_id, price)
    const status = reasonable ? 'active' : 'pending'

    // --- 寫入資料庫 ---
    const { error: insertError } = await supabaseAdmin
      .from('price_reports')
      .insert({
        item_id,
        price_max:   price,
        price_min:   null,
        city:        city   ?? null,
        vendor_name: vendor_name ?? null,
        source:      'user',
        ip_hash:     ipHash,
        status,
        reported_at: new Date().toISOString().split('T')[0],
      })

    if (insertError) {
      console.error('Insert error:', insertError)
      return NextResponse.json({ error: '資料庫錯誤，請稍後再試' }, { status: 500 })
    }

    // --- 自動封鎖檢查（非同步，不等待） ---
    autobanIfNeeded(ipHash).catch(console.error)

    return NextResponse.json({
      success: true,
      status,
      message: status === 'pending'
        ? `你的回報價格（${price}元）偏離近期均價（${avg}元）較多，已進入審核佇列`
        : '回報成功！感謝你的貢獻',
    })

  } catch (err) {
    console.error('Report API error:', err)
    return NextResponse.json({ error: '伺服器錯誤，請稍後再試' }, { status: 500 })
  }
}
