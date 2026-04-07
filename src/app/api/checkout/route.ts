import { SquareClient, SquareEnvironment } from 'square';
import { NextResponse } from 'next/server';
import { randomUUID } from 'crypto';

const client = new SquareClient({
  token: process.env.SQUARE_SANDBOX_ACCESS_TOKEN!,
  environment: SquareEnvironment.Sandbox,
});

type CartItem = {
  id: string;
  name: string;
  price: number; // cents
  quantity: number;
};

export async function POST(req: Request) {
  try {
    const { items }: { items: CartItem[] } = await req.json();

    if (!items || items.length === 0) {
      return NextResponse.json({ error: 'Cart is empty' }, { status: 400 });
    }

    const response = await client.checkout.paymentLinks.create({
    idempotencyKey: randomUUID(),
    order: {
        locationId: process.env.SQUARE_SANDBOX_LOCATION_ID!,
        lineItems: items.map(item => ({
        name: item.name,
        quantity: String(item.quantity),
        basePriceMoney: {
            amount: BigInt(item.price),
            currency: 'USD',
        },
        })),
    },
    });

    return NextResponse.json({ url: response.paymentLink?.url });


  } catch (error) {
    console.error('Square error:', error);
    return NextResponse.json({ error: 'Failed to create checkout' }, { status: 500 });
  }
}