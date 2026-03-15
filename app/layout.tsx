import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: '全台回收即時行情 | RecyclePrice.tw',
  description: '即時掌握全台廢銅、廢鐵、鋁罐、廢紙等回收價格。網友即時回報，每日自動更新，讓你在最好時機賣出最好價格。',
  keywords: '回收價格,廢銅價格,廢鐵價格,鋁罐回收,廢紙回收,台灣回收行情',
  openGraph: {
    title: '全台回收即時行情',
    description: '廢銅、廢鐵、鋁罐、廢紙即時回收價格比較',
    locale: 'zh_TW',
    type: 'website',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-TW" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;700&family=Noto+Sans+TC:wght@400;500;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-surface text-gray-100 font-sans antialiased min-h-screen">
        {children}
      </body>
    </html>
  )
}
