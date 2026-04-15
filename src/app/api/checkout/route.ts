import { SquareClient, SquareEnvironment } from 'square';
import { NextResponse } from 'next/server';
import { randomUUID } from 'crypto';

const isProduction = process.env.NODE_ENV === 'production';

const client = new SquareClient({
  token: isProduction
    ? process.env.SQUARE_ACCESS_TOKEN!
    : process.env.SQUARE_SANDBOX_ACCESS_TOKEN!,
  environment: isProduction
    ? SquareEnvironment.Production
    : SquareEnvironment.Sandbox,
});

type CartItem = {
  id: string;
  name: string;
  price: number; // cents
  quantity: number;
};

export async function POST(req: Request) {
  try {
    const { items, truckId }: { items: CartItem[], truckId: string } = await req.json();

    if (!items || items.length === 0) {
      return NextResponse.json({ error: 'Cart is empty' }, { status: 400 });
    }

    const locationId = isProduction
      ? process.env.SQUARE_LOCATION_ID!
      : process.env.SQUARE_SANDBOX_LOCATION_ID!;

    const response = await client.checkout.paymentLinks.create({
      idempotencyKey: randomUUID(),
      order: {
        locationId,
        metadata: {truck_id: truckId},
        lineItems: items.map(item => ({
          name: item.name,
          quantity: String(item.quantity),
          basePriceMoney: {
            amount: BigInt(item.price),
            currency: 'USD',
          },
        })),
      },
      checkoutOptions: {
        redirectUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/order-confirmation`,
      },
    });

    return NextResponse.json({ url: response.paymentLink?.url });
  } catch (error) {
    console.error('Square error:', error);
    return NextResponse.json({ error: 'Failed to create checkout' }, { status: 500 });
  }
}