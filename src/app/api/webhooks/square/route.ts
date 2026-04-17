import { NextResponse } from 'next/server';
import { createHmac } from 'crypto';
import { SquareClient, SquareEnvironment } from 'square';
import { createClient } from '@supabase/supabase-js';
import { sendOrderConfirmedEmail } from '@/utils/email';

const isProduction = process.env.NODE_ENV === 'production';
const square = new SquareClient({
  token: isProduction
    ? process.env.SQUARE_ACCESS_TOKEN!
    : process.env.SQUARE_SANDBOX_ACCESS_TOKEN!,
  environment: isProduction
    ? SquareEnvironment.Production
    : SquareEnvironment.Sandbox,
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function verifySignature(body: string, signature: string, url: string): boolean {
  const key = process.env.SQUARE_WEBHOOK_SIGNATURE_KEY!;
  const hmac = createHmac('sha256', key);
  hmac.update(url + body);
  const expected = hmac.digest('base64');
  return expected === signature;
}

export async function POST(req: Request) {
  const body = await req.text();
  const signature = req.headers.get('x-square-hmacsha256-signature') ?? '';
  const url = `${process.env.NEXT_PUBLIC_BASE_URL}/api/webhooks/square`;

  if (!verifySignature(body, signature, url)) {
    console.error('Invalid Square webhook signature');
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  const event = JSON.parse(body);

  if (event.type !== 'payment.updated') {
    return NextResponse.json({ ok: true });
  }

  const payment = event.data?.object?.payment;
  if (!payment || payment.status !== 'COMPLETED') {
    return NextResponse.json({ ok: true });
  }

  const squareOrderId = payment.order_id;
  const squarePaymentId = payment.id;
  const buyerEmail = payment.buyer_email_address ?? null;

  try {
    const orderResponse = await square.orders.get({ orderId: squareOrderId });
    const order = orderResponse.order;

    if (!order) {
      return NextResponse.json({ error: 'Order not found in Square' }, { status: 404 });
    }

    const truckId = order.metadata?.truck_id ?? null;
    const lineItems = order.lineItems ?? [];
    const totalAmount = order.totalMoney?.amount ?? BigInt(0);

    const { data: insertedOrder, error: orderError } = await supabase
      .from('orders')
      .insert({
        truck_id: truckId,
        square_order_id: squareOrderId,
        square_payment_id: squarePaymentId,
        total: Number(totalAmount),
        customer_email: buyerEmail,
        status: 'new',
      })
      .select()
      .single();

    if (orderError) {
      if (orderError.code === '23505') {
        return NextResponse.json({ ok: true });
      }
      console.error('Order insert error:', orderError);
      return NextResponse.json({ error: 'Failed to save order' }, { status: 500 });
    }

    const items = lineItems.map((item) => ({
      order_id: insertedOrder.id,
      name: item.name ?? 'Unknown item',
      quantity: parseInt(item.quantity ?? '1', 10),
      unit_price: Number(item.basePriceMoney?.amount ?? 0),
    }));

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(items);

    if (itemsError) {
      console.error('Order items insert error:', itemsError);
      return NextResponse.json({ error: 'Failed to save order items' }, { status: 500 });
    }

    // Send order confirmed email to customer
    if (buyerEmail) {
      try {
        await sendOrderConfirmedEmail({
          to: buyerEmail,
          orderItems: items.map((item) => ({
            name: item.name,
            quantity: item.quantity,
            unit_price: item.unit_price,
          })),
          total: Number(totalAmount),
        })
      } catch (emailErr) {
        // Don't fail the webhook if email fails — order is already saved
        console.error('Order confirmed email error:', emailErr);
      }
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('Webhook error:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}