import Header from '@/components/Header'
import { supabase } from '@/lib/supabase'
import { MapPin, Phone, Globe, CheckCircle } from 'lucide-react'

export const revalidate = 3600

async function getVendors() {
  const { data } = await supabase
    .from('vendors')
    .select('*')
    .order('is_vip', { ascending: false })
  return data ?? []
}

export default async function MapPage() {
  const vendors = await getVendors()

  return (
    <div className="min-h-screen grid-bg">
      <Header />
      <main className="max-w-6xl mx-auto px-4 py-8">

        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-100">地圖找回收場</h1>
          <p className="text-gray-500 text-sm mt-1">全台回收場位置與即時行情</p>
        </div>

        {/* Google Maps 嵌入 */}
        <div className="card p-0 overflow-hidden mb-8 h-80 bg-surface-muted flex items-center justify-center">
          <div className="text-center text-gray-600">
            <MapPin size={32} className="mx-auto mb-2 opacity-30" />
            <p className="text-sm">地圖功能</p>
            <p className="text-xs mt-1">
              請在 Vercel 環境變數設定 <code className="font-mono text-brand-500">NEXT_PUBLIC_GOOGLE_MAPS_KEY</code>
            </p>
            <p className="text-xs text-gray-700 mt-1">
              或參考 README 使用免費的 Leaflet + OpenStreetMap 替代方案
            </p>
          </div>
        </div>

        {/* 業者列表 */}
        <h2 className="font-bold text-gray-200 mb-4">已收錄業者（{vendors.length}）</h2>

        {vendors.length === 0 ? (
          <div className="card text-center py-10 text-gray-600">
            <p>尚未有業者資料</p>
            <p className="text-xs mt-1">可在 Supabase 直接新增，或開放業者認領功能後由業者自行填寫</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {vendors.map((v: any) => (
              <div key={v.id} className="card hover:border-brand-800 transition-colors">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-medium text-gray-200 text-sm">{v.name}</h3>
                  <div className="flex gap-1">
                    {v.is_verified && (
                      <span className="badge bg-blue-950 text-blue-400">
                        <CheckCircle size={10} /> 認證
                      </span>
                    )}
                    {v.is_vip && (
                      <span className="badge bg-yellow-950 text-yellow-400">VIP</span>
                    )}
                  </div>
                </div>
                {v.address && (
                  <p className="text-xs text-gray-500 flex items-center gap-1 mb-1">
                    <MapPin size={11} /> {v.address}
                  </p>
                )}
                {v.phone && (
                  <p className="text-xs text-gray-500 flex items-center gap-1 mb-1">
                    <Phone size={11} />
                    <a href={`tel:${v.phone}`} className="hover:text-brand-400">{v.phone}</a>
                  </p>
                )}
                {v.website && (
                  <p className="text-xs text-gray-500 flex items-center gap-1">
                    <Globe size={11} />
                    <a href={v.website} target="_blank" rel="noopener noreferrer"
                       className="hover:text-brand-400 truncate">{v.website}</a>
                  </p>
                )}
              </div>
            ))}
          </div>
        )}

      </main>
    </div>
  )
}
