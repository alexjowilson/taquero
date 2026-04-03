export type Client = {
  id: string
  name: string
  slug: string
  created_at: string
}

export type Truck = {
  id: string
  client_id: string
  name: string
  is_active: boolean
  created_at: string
}

export type TruckLocation = {
  id: string
  truck_id: string
  latitude: number
  longitude: number
  recorded_at: string
}

// Truck with its latest location joined
export type TruckWithLocation = Truck & {
  latest_location: TruckLocation | null
}