'use client'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine
} from 'recharts'

interface DataPoint {
  date: string
  avg: number | null
  min: number | null
  max: number | null
}

interface Props {
  data: DataPoint[]
  itemName: string
  unit?: string
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-surface-card border border-surface-border rounded-lg p-3 text-xs font-mono shadow-xl">
      <p className="text-gray-400 mb-1">{label}</p>
      {payload.map((p: any) => (
        <p key={p.name} style={{ color: p.color }}>
          {p.name === 'avg' ? '均價' : p.name === 'max' ? '最高' : '最低'}：
          {p.value?.toFixed(0)} 元
        </p>
      ))}
    </div>
  )
}

export default function PriceChart({ data, itemName, unit = 'kg' }: Props) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-40 text-gray-600 text-sm">
        尚無足夠歷史資料
      </div>
    )
  }

  const validPrices = data.flatMap(d => [d.avg, d.min, d.max]).filter(Boolean) as number[]
  const minY = Math.floor((Math.min(...validPrices) * 0.9) / 10) * 10
  const maxY = Math.ceil((Math.max(...validPrices) * 1.1) / 10) * 10

  return (
    <div>
      <p className="label mb-3">{itemName} — 近30天走勢（元/{unit}）</p>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={data} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#21262d" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 10, fill: '#6b7280', fontFamily: 'JetBrains Mono' }}
            tickLine={false}
            axisLine={{ stroke: '#30363d' }}
            interval="preserveStartEnd"
          />
          <YAxis
            domain={[minY, maxY]}
            tick={{ fontSize: 10, fill: '#6b7280', fontFamily: 'JetBrains Mono' }}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip content={<CustomTooltip />} />
          <Line
            type="monotone" dataKey="max"
            stroke="#4ade80" strokeWidth={1} dot={false}
            strokeDasharray="4 2" opacity={0.5}
          />
          <Line
            type="monotone" dataKey="avg"
            stroke="#22c55e" strokeWidth={2} dot={false}
            connectNulls
          />
          <Line
            type="monotone" dataKey="min"
            stroke="#166534" strokeWidth={1} dot={false}
            strokeDasharray="4 2" opacity={0.5}
          />
        </LineChart>
      </ResponsiveContainer>
      <div className="flex gap-4 mt-2 text-xs font-mono text-gray-600">
        <span><span className="text-green-400">—</span> 均價</span>
        <span><span className="text-green-600 opacity-60">- -</span> 最高/最低</span>
      </div>
    </div>
  )
}
