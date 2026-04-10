'use client'
import { useState, useEffect, useRef } from 'react'
import MenuModal from '@/components/menu/MenuModal'
import {
  APIProvider,
  Map,
  AdvancedMarker,
  Pin,
  InfoWindow,
  useMap,
} from '@vis.gl/react-google-maps'
import { useTruckLocations } from '@/hooks/useTruckLocations'
import { TruckWithLocation } from '@/types/database'

const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!
const DEFAULT_CENTER = { lat: 47.97513648233434, lng: -122.20112475592198 }
const DEFAULT_ZOOM = 13

type LatLng = { lat: number; lng: number }

type TruckMapProps = {
  clientSlug: string
}

// ─── Distance helper ─────────────────────────────────────────────────────────
function getDistanceMiles(a: LatLng, b: LatLng): number {
  const R = 3958.8
  const dLat = ((b.lat - a.lat) * Math.PI) / 180
  const dLng = ((b.lng - a.lng) * Math.PI) / 180
  const x =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((a.lat * Math.PI) / 180) *
      Math.cos((b.lat * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2)
  const c = 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x))
  return R * c
}

// ─── MapController ────────────────────────────────────────────────────────────
type MapControllerProps = {
  userLocation: LatLng | null
  truckPositions: LatLng[]
}

function MapController({ userLocation, truckPositions }: MapControllerProps) {
  const map = useMap()
  const hasFit = useRef(false)

  useEffect(() => {
    if (!map) return
    if (hasFit.current) return
    if (truckPositions.length === 0) return

    const bounds = new google.maps.LatLngBounds()

    if (userLocation) bounds.extend(userLocation)
    truckPositions.forEach(p => bounds.extend(p))

    if (userLocation || truckPositions.length > 1) {
      map.fitBounds(bounds, 80)
    } else {
      map.setCenter(truckPositions[0])
      map.setZoom(14)
    }

    hasFit.current = true
  }, [map, userLocation, truckPositions])

  return null
}

// ─── UserMarker ───────────────────────────────────────────────────────────────
function UserMarker({ position }: { position: LatLng }) {
  return (
    <AdvancedMarker position={position} title="You are here">
      <div style={{
        width: '18px',
        height: '18px',
        borderRadius: '50%',
        backgroundColor: '#3b82f6',
        border: '3px solid #fff',
        boxShadow: '0 0 0 3px rgba(59,130,246,0.35)',
      }} />
    </AdvancedMarker>
  )
}

// ─── TruckMarker ─────────────────────────────────────────────────────────────
type TruckMarkerProps = {
  truck: TruckWithLocation
  userLocation: LatLng | null
}

function TruckMarker({ truck, userLocation }: TruckMarkerProps) {
  const [open, setOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  const loc = Array.isArray(truck.latest_location)
    ? truck.latest_location[0]
    : truck.latest_location

  if (!loc) return null

  const lat = typeof loc.latitude === 'string' ? parseFloat(loc.latitude) : loc.latitude
  const lng = typeof loc.longitude === 'string' ? parseFloat(loc.longitude) : loc.longitude

  if (isNaN(lat) || isNaN(lng)) return null

  const lastUpdated = new Date(loc.recorded_at).toLocaleTimeString()

  const distanceMiles = userLocation
    ? getDistanceMiles(userLocation, { lat, lng })
    : null

  const distanceLabel =
    distanceMiles !== null
      ? distanceMiles < 0.1
        ? 'Less than 0.1 mi away'
        : `${distanceMiles.toFixed(1)} mi away`
      : null

  const isIOS =
    typeof navigator !== 'undefined' &&
    /iPad|iPhone|iPod/.test(navigator.userAgent)

  const directionsUrl = isIOS
    ? `https://maps.apple.com/?daddr=${lat},${lng}`
    : `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`

  return (
    <>
      <AdvancedMarker
        position={{ lat, lng }}
        title={truck.name}
        onClick={() => setOpen(true)}
      >
        <Pin
          background="#28a84a"
          borderColor="#1a7a34"
          glyphColor="#ffffff"
          glyph="🚚"
          scale={1.2}
        />
      </AdvancedMarker>

      {open && (
        <InfoWindow
          position={{ lat, lng }}
          onCloseClick={() => setOpen(false)}
        >
          <div className="p-2 min-w-[160px]">
            <h3 className="font-bold text-gray-900 text-sm">{truck.name}</h3>
            {distanceLabel && (
              <p className="text-xs font-medium text-blue-600 mt-0.5">
                📍 {distanceLabel}
              </p>
            )}
            <a
              href={directionsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1 block text-xs font-medium text-green-600 hover:text-green-700"
            >
              🧭 Get Directions
            </a>
            <p className="text-xs text-gray-500 mt-1">Updated: {lastUpdated}</p>
            <button
              onClick={() => setMenuOpen(true)}
              className="mt-2 w-full bg-green-600 text-white text-xs font-semibold py-1.5 px-3 rounded hover:bg-green-700 transition-colors"
            >
              Order Now
            </button>
          </div>
        </InfoWindow>
      )}

      {menuOpen && <MenuModal onClose={() => setMenuOpen(false)} />}
    </>
  )
}

// ─── TruckMap ─────────────────────────────────────────────────────────────────
export default function TruckMap({ clientSlug }: TruckMapProps) {
  const { trucks, loading, error } = useTruckLocations(clientSlug)
  const [userLocation, setUserLocation] = useState<LatLng | null>(null)

  useEffect(() => {
    if (!navigator.geolocation) return
    navigator.geolocation.getCurrentPosition(
      pos => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => {}
    )
  }, [])

  const truckPositions: LatLng[] = trucks.flatMap(truck => {
    const loc = Array.isArray(truck.latest_location)
      ? truck.latest_location[0]
      : truck.latest_location
    if (!loc) return []
    const lat = typeof loc.latitude === 'string' ? parseFloat(loc.latitude) : loc.latitude
    const lng = typeof loc.longitude === 'string' ? parseFloat(loc.longitude) : loc.longitude
    if (isNaN(lat) || isNaN(lng)) return []
    return [{ lat, lng }]
  })

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
          <MapController
            userLocation={userLocation}
            truckPositions={truckPositions}
          />

          {userLocation && <UserMarker position={userLocation} />}

          {trucks.map(truck => (
            <TruckMarker
              key={truck.id}
              truck={truck}
              userLocation={userLocation}
            />
          ))}
        </Map>
      </APIProvider>
    </div>
  )
}