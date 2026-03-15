'use client'
import { useEffect, useState } from 'react'
import Header from '@/components/Header'
import { MapPin, Phone, Globe, CheckCircle } from 'lucide-react'

type Vendor = {
  id: string
  name: string
  address: string | null
  city: string | null
  lat: number | null
  lng: number | null
  phone: string | null
  website: string | null
  is_verified: boolean
  is_vip: boolean
}

export default function MapPage() {
  const [vendors, setVendors] = useState<Vendor[]>([])

  useEffect(() => {
    fetch('/api/vendors').then(r => r.json()).then(setVendors)
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return
    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
    document.head.appendChild(link)
    const script = document.createElement('script')
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
    script.onload = () => {
      const L = (window as any).L
      const mapEl = document.getElementById('map') as any
      if (!L || mapEl?._leaflet_id) return
      const map = L.map('map').setView([23.6978, 120.9605], 7)
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap'
      }).addTo(map)
      vendors.filter(v => v.lat && v.lng).forEach(v => {
        L.marker([v.lat, v.lng]).addTo(map).bindPopup(`<b>${v.name}</b><br>${v.city ?? ''}`)
      })
    }
    document.head.appendChild(script)
  }, [vendors])

  return (
    <div className="min-h-screen grid-bg">
      <Header />
      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-100">地圖找回收場</h1>
          <p className="text-gray-500 text-sm mt-1">全台回收場位置與即時行情</p>
        </div>
        <div className="card p-0 overflow-hidden mb-8" style={{ height: '360px' }}>
          <div id="map" style={{ height: '100%', width: '100%', background: '#161b22' }} />
        </div>
        <h2 className="font-bold text-gray-200 mb-4">已收錄業者（{vendors.length}）</h2>
        {vendors.length === 0 ? (
          <div className="card text-center py-10 text-gray-600">
            <p className="text-sm">尚未有業者資料</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {vendors.map(v => (
              <div key={v.id} className="card hover:border-brand-800 transition-colors">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-medium text-gray-200 text-sm">{v.name}</h3>
                  <div className="flex gap-1">
                    {v.is_verified && <span className="badge bg-blue-950 text-blue-400"><CheckCircle size={10} /> 認證</span>}
                    {v.is_vip && <span className="badge bg-yellow-950 text-yellow-400">VIP</span>}
                  </div>
                </div>
                {v.address && <p className="text-xs text-gray-500 flex items-center gap-1 mb-1"><MapPin size={11} /> {v.address}</p>}
                {v.phone && <p className="text-xs text-gray-500 flex items-center gap-1 mb-1"><Phone size={11} /><a href={`tel:${v.phone}`} className="hover:text-brand-400">{v.phone}</a></p>}
                {v.website && <p className="text-xs text-gray-500 flex items-center gap-1"><Globe size={11} /><a href={v.website} target="_blank" rel="noopener noreferrer" className="hover:text-brand-400 truncate">{v.website}</a></p>}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
