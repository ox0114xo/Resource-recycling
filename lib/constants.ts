export const CATEGORIES = [
  { id: 1, name: '銅類', color: '#f59e0b', emoji: '🔶' },
  { id: 2, name: '鐵類', color: '#6b7280', emoji: '⚙️' },
  { id: 3, name: '鋁類', color: '#93c5fd', emoji: '🔷' },
  { id: 4, name: '紙類', color: '#86efac', emoji: '📄' },
  { id: 5, name: '塑膠', color: '#f9a8d4', emoji: '♻️' },
  { id: 6, name: '電子', color: '#a78bfa', emoji: '💡' },
] as const

export const CITIES = [
  '台北市', '新北市', '桃園市', '台中市', '台南市', '高雄市',
  '基隆市', '新竹市', '嘉義市', '新竹縣', '苗栗縣', '彰化縣',
  '南投縣', '雲林縣', '嘉義縣', '屏東縣', '宜蘭縣', '花蓮縣',
  '台東縣', '澎湖縣', '金門縣', '連江縣',
]

export type PriceReport = {
  id: string
  item_id: number
  item_name?: string
  category?: string
  vendor_name: string | null
  city: string | null
  price_min: number | null
  price_max: number
  source: string
  status: string
  upvotes: number
  downvotes: number
  reported_at: string
}

export type ItemAvg = {
  item_id: number
  item_name: string
  category: string
  unit: string
  avg_price: number | null
  min_price: number | null
  max_price: number | null
  report_count: number
  last_reported: string | null
}
