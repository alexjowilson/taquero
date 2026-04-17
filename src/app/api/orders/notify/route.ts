import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendOrderReadyEmail } from '@/utils/email'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: Request) {
  const { orderId } = await req.json()

  if (!orderId) {
    return NextResponse.json({ error: 'Missing orderId' }, { status: 400 })
  }

  try {
    const { data: order, error } = await supabase
      .from('orders')
      .select('*, order_items(*)')
      .eq('id', orderId)
      .single()

    if (error || !order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    if (!order.customer_email) {
      return NextResponse.json({ ok: true, skipped: 'no email on file' })
    }

    await sendOrderReadyEmail({
      to: order.customer_email,
      orderItems: order.order_items,
      total: order.total,
    })

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('Notify route error:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}