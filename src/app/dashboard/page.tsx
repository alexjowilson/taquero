'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'

type OrderItem = {
  id: string
  name: string
  quantity: number
  unit_price: number
}

type Order = {
  id: string
  square_order_id: string
  status: 'new' | 'accepted' | 'ready' | 'fulfilled'
  total: number
  customer_email: string | null
  created_at: string
  order_items: OrderItem[]
}

const STATUS_FLOW: Order['status'][] = ['new', 'accepted', 'ready', 'fulfilled']

const STATUS_COLORS: Record<Order['status'], string> = {
  new: '#e8621a',
  accepted: '#d4a017',
  ready: '#28a84a',
  fulfilled: '#3a4d3b',
}

const STATUS_LABELS: Record<Order['status'], string> = {
  new: 'New',
  accepted: 'Accepted',
  ready: 'Ready',
  fulfilled: 'Fulfilled',
}

function getNextStatus(current: Order['status']): Order['status'] | null {
  const idx = STATUS_FLOW.indexOf(current)
  return idx < STATUS_FLOW.length - 1 ? STATUS_FLOW[idx + 1] : null
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

function formatCurrency(cents: number) {
  return `$${(cents / 100).toFixed(2)}`
}

export default function DashboardPage() {
  const router = useRouter()
  const supabase = createClient()
  const [orders, setOrders] = useState<Order[]>([])
  const [truckId, setTruckId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const audioRef = useRef<AudioContext | null>(null)

  const playAlert = () => {
    try {
      const ctx = new AudioContext()
      const oscillator = ctx.createOscillator()
      const gain = ctx.createGain()
      oscillator.connect(gain)
      gain.connect(ctx.destination)
      oscillator.type = 'sine'
      oscillator.frequency.setValueAtTime(880, ctx.currentTime)
      gain.gain.setValueAtTime(0.3, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6)
      oscillator.start(ctx.currentTime)
      oscillator.stop(ctx.currentTime + 0.6)
      audioRef.current = ctx
    } catch {}
  }

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      // Get truck_id for this operator
      const { data: opData } = await supabase
        .from('truck_operators')
        .select('truck_id')
        .eq('user_id', user.id)
        .single()

      if (!opData) { router.push('/login'); return }

      setTruckId(opData.truck_id)

      // Fetch existing orders
      const { data: ordersData } = await supabase
        .from('orders')
        .select('*, order_items(*)')
        .eq('truck_id', opData.truck_id)
        .neq('status', 'fulfilled')
        .order('created_at', { ascending: false })

      setOrders(ordersData ?? [])
      setLoading(false)

      // Real-time subscription
      const channel = supabase
        .channel('orders-feed')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'orders',
            filter: `truck_id=eq.${opData.truck_id}`,
          },
          async (payload) => {
            if (payload.eventType === 'INSERT') {
              // Fetch full order with items
              const { data: newOrder } = await supabase
                .from('orders')
                .select('*, order_items(*)')
                .eq('id', payload.new.id)
                .single()

              if (newOrder) {
                setOrders((prev) => [newOrder, ...prev])
                playAlert()
              }
            }

            if (payload.eventType === 'UPDATE') {
              setOrders((prev) =>
                prev
                  .map((o) => o.id === payload.new.id ? { ...o, status: payload.new.status } : o)
                  .filter((o) => o.status !== 'fulfilled')
              )
            }
          }
        )
        .subscribe()

      return () => { supabase.removeChannel(channel) }
    }

    init()
  }, [])

  const advanceStatus = async (order: Order) => {
    const next = getNextStatus(order.status)
    if (!next) return

    await supabase
      .from('orders')
      .update({ status: next })
      .eq('id', order.id)

    setOrders((prev) =>
      prev
        .map((o) => o.id === order.id ? { ...o, status: next } : o)
        .filter((o) => o.status !== 'fulfilled')
    )
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        backgroundColor: '#080f09',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#6b7c6d',
        fontSize: '15px',
      }}>
        Loading orders...
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#080f09', padding: '24px' }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '28px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '24px' }}>🚚</span>
          <div>
            <h1 style={{ color: '#fff', fontSize: '20px', fontWeight: 700, margin: 0 }}>
              GoVendGo
            </h1>
            <p style={{ color: '#6b7c6d', fontSize: '13px', margin: 0 }}>
              Operator Dashboard
            </p>
          </div>
        </div>
        <button
          onClick={handleSignOut}
          style={{
            backgroundColor: 'transparent',
            border: '1px solid #2a3d2b',
            borderRadius: '8px',
            color: '#6b7c6d',
            padding: '8px 16px',
            fontSize: '13px',
            cursor: 'pointer',
          }}
        >
          Sign Out
        </button>
      </div>

      {/* Order count */}
      <p style={{ color: '#6b7c6d', fontSize: '13px', marginBottom: '20px' }}>
        {orders.length === 0
          ? 'No active orders'
          : `${orders.length} active order${orders.length !== 1 ? 's' : ''}`}
      </p>

      {/* Order cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '640px' }}>
        {orders.map((order) => {
          const next = getNextStatus(order.status)
          return (
            <div
              key={order.id}
              style={{
                backgroundColor: '#111a12',
                border: `1px solid ${order.status === 'new' ? '#e8621a' : '#1e2e1f'}`,
                borderRadius: '12px',
                padding: '20px',
                boxShadow: order.status === 'new' ? '0 0 12px rgba(232,98,26,0.15)' : 'none',
              }}
            >
              {/* Card header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
                <div>
                  <span style={{
                    display: 'inline-block',
                    backgroundColor: STATUS_COLORS[order.status],
                    color: '#fff',
                    fontSize: '11px',
                    fontWeight: 700,
                    padding: '3px 10px',
                    borderRadius: '20px',
                    letterSpacing: '0.5px',
                    textTransform: 'uppercase',
                  }}>
                    {STATUS_LABELS[order.status]}
                  </span>
                  <p style={{ color: '#6b7c6d', fontSize: '12px', margin: '6px 0 0' }}>
                    {formatTime(order.created_at)}
                    {order.customer_email && ` · ${order.customer_email}`}
                  </p>
                </div>
                <span style={{ color: '#28a84a', fontWeight: 700, fontSize: '18px' }}>
                  {formatCurrency(order.total)}
                </span>
              </div>

              {/* Items */}
              <div style={{ borderTop: '1px solid #1e2e1f', paddingTop: '14px', marginBottom: '16px' }}>
                {order.order_items.map((item) => (
                  <div key={item.id} style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginBottom: '6px',
                  }}>
                    <span style={{ color: '#d0e0d1', fontSize: '14px' }}>
                      {item.quantity}× {item.name}
                    </span>
                    <span style={{ color: '#6b7c6d', fontSize: '14px' }}>
                      {formatCurrency(item.unit_price * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Action button */}
              {next && (
                <button
                  onClick={() => advanceStatus(order)}
                  style={{
                    width: '100%',
                    padding: '10px',
                    backgroundColor: STATUS_COLORS[next],
                    color: '#fff',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Mark as {STATUS_LABELS[next]}
                </button>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}