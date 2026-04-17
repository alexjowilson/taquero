import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

type OrderItem = {
  name: string
  quantity: number
  unit_price: number
}

type SendOrderConfirmedProps = {
  to: string
  orderItems: OrderItem[]
  total: number
}

type SendOrderReadyProps = {
  to: string
  orderItems: OrderItem[]
  total: number
}

function formatCurrency(cents: number) {
  return `$${(cents / 100).toFixed(2)}`
}

function buildItemsTable(items: OrderItem[]) {
  return items
    .map(
      (item) =>
        `<tr>
          <td style="padding: 8px 0; color: #d0e0d1; font-size: 14px;">${item.quantity}× ${item.name}</td>
          <td style="padding: 8px 0; color: #6b7c6d; font-size: 14px; text-align: right;">${formatCurrency(item.unit_price * item.quantity)}</td>
        </tr>`
    )
    .join('')
}

function emailWrapper(content: string) {
  return `
    <div style="background-color: #080f09; min-height: 100vh; padding: 40px 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
      <div style="max-width: 480px; margin: 0 auto; background-color: #111a12; border: 1px solid #1e2e1f; border-radius: 12px; padding: 32px;">
        <div style="text-align: center; margin-bottom: 28px;">
          <span style="font-size: 32px;">🚚</span>
          <h1 style="color: #ffffff; font-size: 22px; font-weight: 700; margin: 12px 0 4px;">GoVendGo</h1>
        </div>
        ${content}
        <div style="margin-top: 32px; padding-top: 20px; border-top: 1px solid #1e2e1f; text-align: center;">
          <p style="color: #3a4d3b; font-size: 12px; margin: 0;">GoVendGo · govendgo.com</p>
        </div>
      </div>
    </div>
  `
}

export async function sendOrderConfirmedEmail({ to, orderItems, total }: SendOrderConfirmedProps) {
  const html = emailWrapper(`
    <h2 style="color: #28a84a; font-size: 18px; font-weight: 700; margin: 0 0 8px;">Order Confirmed ✓</h2>
    <p style="color: #9aab9b; font-size: 14px; margin: 0 0 24px;">
      Your order has been received and the truck is getting started on it.
    </p>
    <table style="width: 100%; border-collapse: collapse; margin-bottom: 16px;">
      <tbody>
        ${buildItemsTable(orderItems)}
      </tbody>
      <tfoot>
        <tr>
          <td style="padding-top: 12px; border-top: 1px solid #1e2e1f; color: #ffffff; font-weight: 700; font-size: 15px;">Total</td>
          <td style="padding-top: 12px; border-top: 1px solid #1e2e1f; color: #28a84a; font-weight: 700; font-size: 15px; text-align: right;">${formatCurrency(total)}</td>
        </tr>
      </tfoot>
    </table>
    <p style="color: #6b7c6d; font-size: 13px; margin: 0;">
      We'll send you another email when your order is ready for pickup.
    </p>
  `)

  return resend.emails.send({
    from: 'GoVendGo <orders@govendgo.com>',
    to,
    subject: 'Your GoVendGo order is confirmed',
    html,
  })
}

export async function sendOrderReadyEmail({ to, orderItems, total }: SendOrderReadyProps) {
  const html = emailWrapper(`
    <h2 style="color: #e8621a; font-size: 18px; font-weight: 700; margin: 0 0 8px;">Your order is ready! 🎉</h2>
    <p style="color: #9aab9b; font-size: 14px; margin: 0 0 24px;">
      Head to the truck to pick up your order.
    </p>
    <table style="width: 100%; border-collapse: collapse; margin-bottom: 16px;">
      <tbody>
        ${buildItemsTable(orderItems)}
      </tbody>
      <tfoot>
        <tr>
          <td style="padding-top: 12px; border-top: 1px solid #1e2e1f; color: #ffffff; font-weight: 700; font-size: 15px;">Total</td>
          <td style="padding-top: 12px; border-top: 1px solid #1e2e1f; color: #28a84a; font-weight: 700; font-size: 15px; text-align: right;">${formatCurrency(total)}</td>
        </tr>
      </tfoot>
    </table>
    <p style="color: #6b7c6d; font-size: 13px; margin: 0;">
      Thanks for ordering with GoVendGo!
    </p>
  `)

  return resend.emails.send({
    from: 'GoVendGo <orders@govendgo.com>',
    to,
    subject: '🚚 Your order is ready for pickup!',
    html,
  })
}