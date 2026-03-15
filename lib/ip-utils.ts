import { createHash } from 'crypto'
import { NextRequest } from 'next/server'
import { supabaseAdmin } from './supabase'

// IP 取得（相容 Vercel proxy header）
export function getClientIp(req: NextRequest): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    req.headers.get('x-real-ip') ||
    '0.0.0.0'
  )
}

// SHA-256 雜湊 IP，不儲存原始 IP
export function hashIp(ip: string): string {
  return createHash('sha256').update(ip + process.env.IP_SALT || 'recycle_salt').digest('hex')
}

// 檢查此 IP 是否在黑名單
export async function isIpBanned(ipHash: string): Promise<boolean> {
  const { data } = await supabaseAdmin
    .from('ip_blacklist')
    .select('id, expires_at')
    .eq('ip_hash', ipHash)
    .maybeSingle()

  if (!data) return false

  // 有設期限且已過期 → 不算封鎖
  if (data.expires_at && new Date(data.expires_at) < new Date()) return false

  return true
}

// 檢查 24 小時內同 IP 的回報次數限制
export async function checkRateLimit(ipHash: string): Promise<{
  allowed: boolean
  reason?: string
}> {
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

  const { count } = await supabaseAdmin
    .from('price_reports')
    .select('*', { count: 'exact', head: true })
    .eq('ip_hash', ipHash)
    .gte('created_at', since)

  if ((count || 0) >= 5) {
    return { allowed: false, reason: '24小時內最多回報5筆，請明天再試' }
  }

  return { allowed: true }
}

// 價格合理性檢查（偏離7天均價 ±40% → pending）
export async function isPriceReasonable(
  itemId: number,
  price: number
): Promise<{ reasonable: boolean; avg?: number }> {
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

  const { data } = await supabaseAdmin
    .from('price_reports')
    .select('price_max')
    .eq('item_id', itemId)
    .eq('status', 'active')
    .gte('created_at', since)

  if (!data || data.length < 3) {
    // 資料不足 → 先放行，標記 active
    return { reasonable: true }
  }

  const avg = data.reduce((s, r) => s + Number(r.price_max), 0) / data.length
  const deviation = Math.abs(price - avg) / avg

  return { reasonable: deviation <= 0.4, avg: Math.round(avg) }
}

// 自動封鎖：此 IP 24小時內有 2 筆以上被隱藏 → 加入黑名單
export async function autobanIfNeeded(ipHash: string) {
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

  const { count } = await supabaseAdmin
    .from('price_reports')
    .select('*', { count: 'exact', head: true })
    .eq('ip_hash', ipHash)
    .eq('status', 'hidden')
    .gte('created_at', since)

  if ((count || 0) >= 2) {
    const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    await supabaseAdmin
      .from('ip_blacklist')
      .upsert({
        ip_hash: ipHash,
        reason: 'spam',
        report_count: count,
        expires_at: expires,
      }, { onConflict: 'ip_hash' })
  }
}
