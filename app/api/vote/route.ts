import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getClientIp, hashIp, autobanIfNeeded } from '@/lib/ip-utils'

export async function POST(req: NextRequest) {
  try {
    const { reportId, vote } = await req.json()

    if (!reportId || !['up', 'down'].includes(vote)) {
      return NextResponse.json({ error: '無效的請求' }, { status: 400 })
    }

    const ipHash = hashIp(getClientIp(req))

    // 防止重複投票
    const { error: voteError } = await supabaseAdmin
      .from('votes')
      .insert({ report_id: reportId, ip_hash: ipHash, vote })

    if (voteError) {
      // unique constraint violation = 已投票
      if (voteError.code === '23505') {
        return NextResponse.json({ error: '你已經投票過了' }, { status: 409 })
      }
      return NextResponse.json({ error: '投票失敗' }, { status: 500 })
    }

    // 更新 price_reports 的 upvotes / downvotes
    const col = vote === 'up' ? 'upvotes' : 'downvotes'
    await supabaseAdmin.rpc('increment_vote', { row_id: reportId, col_name: col })

    // 取得最新票數，判斷是否需要自動隱藏
    const { data: report } = await supabaseAdmin
      .from('price_reports')
      .select('upvotes, downvotes, ip_hash, status')
      .eq('id', reportId)
      .single()

    if (report) {
      const { upvotes, downvotes, ip_hash: reportIpHash } = report
      const shouldHide = downvotes >= 3 && downvotes > upvotes * 2

      if (shouldHide && report.status !== 'hidden') {
        await supabaseAdmin
          .from('price_reports')
          .update({ status: 'hidden' })
          .eq('id', reportId)

        // 觸發自動封鎖檢查
        if (reportIpHash) autobanIfNeeded(reportIpHash).catch(console.error)
      }
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Vote API error:', err)
    return NextResponse.json({ error: '伺服器錯誤' }, { status: 500 })
  }
}
