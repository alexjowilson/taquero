'use client'

import { useState } from 'react'
import MenuModal from '@/components/menu/MenuModal'
import { APIProvider, Map, AdvancedMarker, Pin, InfoWindow } from '@vis.gl/react-google-maps'
import { useTruckLocations } from '@/hooks/useTruckLocations'
import { TruckWithLocation } from '@/types/database'

const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!
const DEFAULT_CENTER = { lat: 47.97513648233434, lng: -122.20112475592198 }
const DEFAULT_ZOOM = 13

type TruckMapProps = {
  clientSlug: string
}

function TruckMarker({ truck }: { truck: TruckWithLocation }) {
  const [open, setOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  
  // Handle array or single object from Supabase join
  const loc = Array.isArray(truck.latest_location) 
    ? truck.latest_location[0] 
    : truck.latest_location

  if (!loc) return null

  const lat = typeof loc.latitude === 'string' ? parseFloat(loc.latitude) : loc.latitude
  const lng = typeof loc.longitude === 'string' ? parseFloat(loc.longitude) : loc.longitude
  if (isNaN(lat) || isNaN(lng)) return null

  const lastUpdated = new Date(loc.recorded_at).toLocaleTimeString()

  return (
    <>
      <AdvancedMarker
        position={{ lat, lng }}
        title={truck.name}
        onClick={() => setOpen(true)}
      >
        <Pin
          background="#ef4444"
          borderColor="#b91c1c"
          glyphColor="#ffffff"
          glyph="🌮"
          scale={1.2}
        />
      </AdvancedMarker>

      {open && (
        <InfoWindow
          position={{ lat, lng }}
          onCloseClick={() => setOpen(false)}
        >
          <div className="p-2 min-w-[150px]">
            <h3 className="font-bold text-gray-900 text-sm">{truck.name}</h3>
            <p className="text-xs text-gray-500 mt-1">Updated: {lastUpdated}</p>
            <button 
              onClick={() => setMenuOpen(true)}
              className="mt-2 w-full bg-red-500 text-white text-xs font-semibold py-1.5 px-3 rounded hover:bg-red-600 transition-colors">
              Order Now
            </button>
          </div>
        </InfoWindow>
      )}
      {menuOpen && <MenuModal onClose={() => setMenuOpen(false)} />}
    </>
  )
}

export default function TruckMap({ clientSlug }: TruckMapProps) {
  const { trucks, loading, error } = useTruckLocations(clientSlug)


  console.log('trucks:', trucks)
  console.log('loading:', loading)
  console.log('error:', error)

  if (error) {
    return (
      <div className="flex items-center justify-center h-64 bg-red-50 rounded-lg">
        <p className="text-red-600">Error loading truck locations: {error}</p>
      </div>
    )
  }

  return (
    <div className="w-full h-[500px] rounded-xl overflow-hidden relative">
      {loading && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/70">
          <p className="text-gray-500 font-medium">Loading trucks...</p>
        </div>
      )}
      <APIProvider apiKey={API_KEY}>
        <Map
          defaultCenter={DEFAULT_CENTER}
          defaultZoom={DEFAULT_ZOOM}
          mapId="taquero-map"
          gestureHandling="greedy"
          disableDefaultUI={false}
        >
          {trucks.map(truck => (
            <TruckMarker key={truck.id} truck={truck} />
          ))}
        </Map>
      </APIProvider>
    </div>
  )
}