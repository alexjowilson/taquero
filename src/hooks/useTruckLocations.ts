import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { TruckWithLocation } from '@/types/database'

export function useTruckLocations(clientSlug: string) {
  const [trucks, setTrucks] = useState<TruckWithLocation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Initial fetch
    async function fetchTrucks() {
      const { data: client } = await supabase
        .from('clients')
        .select('id')
        .eq('slug', clientSlug)
        .single()

      if (!client) {
        setError('Client not found')
        setLoading(false)
        return
      }

      const { data, error } = await supabase
        .from('trucks')
        .select(`
          *,
          latest_location:truck_locations(*)
        `)
        .eq('client_id', client.id)
        .eq('is_active', true)
        .order('recorded_at', { referencedTable: 'truck_locations', ascending: false })
        .limit(1, { referencedTable: 'truck_locations' })

      if (error) setError(error.message)
      else setTrucks(data as TruckWithLocation[])
      setLoading(false)
    }

    fetchTrucks()

    // Real-time subscription
    const channel = supabase
      .channel('truck_locations')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'truck_locations' },
        (payload) => {
          setTrucks(prev => prev.map(truck => {
            if (truck.id === payload.new.truck_id) {
              return { ...truck, latest_location: payload.new as any }
            }
            return truck
          }))
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [clientSlug])

  return { trucks, loading, error }
}