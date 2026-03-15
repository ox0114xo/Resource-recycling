'use client'
import { useState } from 'react'
import { ThumbsUp, ThumbsDown } from 'lucide-react'
import { clsx } from 'clsx'

interface Props {
  reportId: string
  upvotes: number
  downvotes: number
}

export default function VoteButtons({ reportId, upvotes: initUp, downvotes: initDown }: Props) {
  const [up, setUp] = useState(initUp)
  const [down, setDown] = useState(initDown)
  const [voted, setVoted] = useState<'up' | 'down' | null>(null)
  const [loading, setLoading] = useState(false)

  async function vote(type: 'up' | 'down') {
    if (voted || loading) return
    setLoading(true)
    try {
      const res = await fetch('/api/vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reportId, vote: type }),
      })
      if (res.ok) {
        type === 'up' ? setUp(u => u + 1) : setDown(d => d + 1)
        setVoted(type)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => vote('up')}
        disabled={!!voted || loading}
        className={clsx(
          'flex items-center gap-1 text-xs px-2 py-1 rounded transition-colors',
          voted === 'up'
            ? 'bg-green-950 text-green-400'
            : 'text-gray-600 hover:text-green-400 hover:bg-green-950/50'
        )}
      >
        <ThumbsUp size={12} /> {up}
      </button>
      <button
        onClick={() => vote('down')}
        disabled={!!voted || loading}
        className={clsx(
          'flex items-center gap-1 text-xs px-2 py-1 rounded transition-colors',
          voted === 'down'
            ? 'bg-red-950 text-red-400'
            : 'text-gray-600 hover:text-red-400 hover:bg-red-950/50'
        )}
      >
        <ThumbsDown size={12} /> {down}
      </button>
    </div>
  )
}
