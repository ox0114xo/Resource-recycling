'use client'
import { ItemAvg } from '@/lib/constants'
import { TrendingUp, TrendingDown, Minus, Users } from 'lucide-react'
import { clsx } from 'clsx'

interface Props {
  item: ItemAvg
  prevAvg?: number  // 昨天的均價（用來計算漲跌）
}

export default function PriceCard({ item, prevAvg }: Props) {
  const price = item.avg_price

  let trend: 'up' | 'down' | 'flat' = 'flat'
  let changePct = 0
  if (price && prevAvg && prevAvg > 0) {
    changePct = ((price - prevAvg) / prevAvg) * 100
    if (changePct > 0.5) trend = 'up'
    else if (changePct < -0.5) trend = 'down'
  }

  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus

  return (
    <div className={clsx(
      'card hover:border-brand-800 transition-all duration-200 cursor-pointer',
      'hover:shadow-lg hover:shadow-brand-950/50 group'
    )}>

      {/* 頂部：品項名稱 + 走勢圖示 */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="label">{item.category}</p>
          <h3 className="text-gray-100 font-medium mt-0.5 group-hover:text-brand-300 transition-colors">
            {item.item_name}
          </h3>
        </div>
        <div className={clsx(
          'badge',
          trend === 'up'   && 'bg-green-950 text-green-400',
          trend === 'down' && 'bg-red-950 text-red-400',
          trend === 'flat' && 'bg-surface-muted text-gray-500',
        )}>
          <TrendIcon size={11} />
          {changePct !== 0 ? `${changePct > 0 ? '+' : ''}${changePct.toFixed(1)}%` : '持平'}
        </div>
      </div>

      {/* 主價格 */}
      <div className="mb-3">
        {price ? (
          <div className="flex items-baseline gap-1.5">
            <span className="font-mono font-bold text-2xl text-gray-50">
              {price.toFixed(0)}
            </span>
            <span className="text-gray-500 text-sm font-mono">元/{item.unit}</span>
          </div>
        ) : (
          <span className="text-gray-600 font-mono text-lg">— 尚無資料</span>
        )}
      </div>

      {/* 底部：範圍 + 回報數 */}
      {price && (
        <div className="flex items-center justify-between text-xs text-gray-600 border-t border-surface-border pt-3">
          <span className="font-mono">
            {item.min_price ?? '—'} ~ {item.max_price ?? '—'} 元
          </span>
          <span className="flex items-center gap-1">
            <Users size={11} />
            {item.report_count} 筆回報
          </span>
        </div>
      )}

      {/* 無資料時提示 */}
      {!price && (
        <p className="text-xs text-gray-700 mt-1">點此搶先回報今日價格</p>
      )}
    </div>
  )
}
