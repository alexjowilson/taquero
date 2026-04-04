'use client'

import dynamic from 'next/dynamic'

const TruckMap = dynamic(() => import('@/components/map/TruckMap'), {
  ssr: false,
  loading: () => <p className="text-gray-500">Loading map...</p>
})

export default function Home() {
  return (
    <main className="p-8">
      <h1 className="text-2xl font-bold mb-6">Taquero</h1>
      <TruckMap clientSlug="marios-tacos" />
    </main>
  )
}