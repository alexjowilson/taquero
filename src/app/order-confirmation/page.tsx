'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCart } from '@/context/CartContext';

interface OrderItem {
  name: string;
  quantity: number;
  price: number; // in cents
}

interface SavedOrder {
  items: OrderItem[];
  total: number; // in cents
  orderedAt: string;
}

export default function OrderConfirmationPage() {
  const router = useRouter();
  const { dispatch } = useCart();
  const [order, setOrder] = useState<SavedOrder | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const raw = localStorage.getItem('govendgo_last_order');
    if (raw) {
      try {
        setOrder(JSON.parse(raw));
        localStorage.removeItem('govendgo_last_order');
      } catch {
        // Malformed data — proceed with empty state
      }
    }

    dispatch({ type: 'CLEAR' });

    const t = setTimeout(() => setVisible(true), 80);
    return () => clearTimeout(t);
  }, [dispatch]);

  const formatPrice = (cents: number) =>
    (cents / 100).toLocaleString('en-US', { style: 'currency', currency: 'USD' });

  const formattedTime = order
    ? new Date(order.orderedAt).toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
      })
    : null;

  return (
    <main style={styles.page}>
      <div style={styles.blob1} />
      <div style={styles.blob2} />

      <div
        style={{
          ...styles.card,
          opacity: visible ? 1 : 0,
          transform: visible ? 'translateY(0)' : 'translateY(24px)',
          transition: 'opacity 0.55s ease, transform 0.55s ease',
        }}
      >
        {/* Icon */}
        <div style={styles.iconRing}>
          <span style={styles.iconEmoji}>🚚</span>
        </div>

        {/* Heading */}
        <h1 style={styles.heading}>You're all set!</h1>
        <p style={styles.subheading}>Order received. See you soon!</p>
        {formattedTime && (
          <p style={styles.timestamp}>Placed at {formattedTime}</p>
        )}

        <div style={styles.divider} />

        {/* Line items */}
        {order && order.items.length > 0 ? (
          <ul style={styles.itemList}>
            {order.items.map((item, i) => (
              <li key={i} style={styles.lineItem}>
                <span style={styles.itemName}>
                  <span style={styles.qty}>{item.quantity}×</span> {item.name}
                </span>
                <span style={styles.itemPrice}>
                  {formatPrice(item.price * item.quantity)}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p style={styles.noItems}>Check your email for order details.</p>
        )}

        {/* Total */}
        {order && (
          <>
            <div style={styles.divider} />
            <div style={styles.totalRow}>
              <span style={styles.totalLabel}>Total</span>
              <span style={styles.totalAmount}>{formatPrice(order.total)}</span>
            </div>
          </>
        )}

        <button style={styles.button} onClick={() => router.push('/')}>
          Back to map
        </button>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@600&family=DM+Sans:wght@400;500&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }

        @keyframes blobFloat {
          0%, 100% { transform: translateY(0) scale(1); }
          50% { transform: translateY(-20px) scale(1.04); }
        }
      `}</style>
    </main>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100vh',
    backgroundColor: '#080f09',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '24px',
    position: 'relative',
    overflow: 'hidden',
    fontFamily: "'DM Sans', sans-serif",
  },

  blob1: {
    position: 'absolute',
    width: '480px',
    height: '480px',
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(40,168,74,0.18) 0%, transparent 70%)',
    top: '-80px',
    left: '-120px',
    animation: 'blobFloat 9s ease-in-out infinite',
    pointerEvents: 'none',
  },
  blob2: {
    position: 'absolute',
    width: '400px',
    height: '400px',
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(232,98,26,0.12) 0%, transparent 70%)',
    bottom: '-60px',
    right: '-80px',
    animation: 'blobFloat 11s ease-in-out infinite reverse',
    pointerEvents: 'none',
  },

  card: {
    position: 'relative',
    zIndex: 1,
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.08)',
    backdropFilter: 'blur(20px)',
    borderRadius: '24px',
    padding: '48px 40px',
    width: '100%',
    maxWidth: '420px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '0',
  },

  iconRing: {
    width: '72px',
    height: '72px',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #28a84a, #3ecf65)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '20px',
    boxShadow: '0 0 40px rgba(40,168,74,0.4)',
  },
  iconEmoji: {
    fontSize: '32px',
    lineHeight: 1,
  },

  heading: {
    fontFamily: "'Cormorant Garamond', Georgia, serif",
    fontSize: '42px',
    fontWeight: 600,
    color: '#fff',
    letterSpacing: '-0.5px',
    marginBottom: '8px',
    textAlign: 'center',
  },
  subheading: {
    fontSize: '16px',
    color: 'rgba(255,255,255,0.65)',
    textAlign: 'center',
    marginBottom: '4px',
  },
  timestamp: {
    fontSize: '13px',
    color: 'rgba(255,255,255,0.35)',
    textAlign: 'center',
  },

  divider: {
    width: '100%',
    height: '1px',
    background: 'rgba(255,255,255,0.08)',
    margin: '24px 0',
  },

  itemList: {
    width: '100%',
    listStyle: 'none',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  lineItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    gap: '12px',
  },
  itemName: {
    fontSize: '15px',
    color: 'rgba(255,255,255,0.8)',
  },
  qty: {
    color: '#3ecf65',
    fontWeight: 500,
    marginRight: '2px',
  },
  itemPrice: {
    fontSize: '15px',
    color: 'rgba(255,255,255,0.55)',
    whiteSpace: 'nowrap',
  },
  noItems: {
    fontSize: '14px',
    color: 'rgba(255,255,255,0.4)',
    textAlign: 'center',
  },

  totalRow: {
    width: '100%',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: '32px',
  },
  totalLabel: {
    fontSize: '16px',
    fontWeight: 500,
    color: 'rgba(255,255,255,0.9)',
  },
  totalAmount: {
    fontSize: '22px',
    fontWeight: 600,
    color: '#3ecf65',
    fontFamily: "'Cormorant Garamond', Georgia, serif",
  },

  button: {
    width: '100%',
    padding: '14px',
    borderRadius: '12px',
    background: '#28a84a',
    color: '#fff',
    fontSize: '15px',
    fontWeight: 600,
    fontFamily: "'DM Sans', sans-serif",
    border: 'none',
    cursor: 'pointer',
    letterSpacing: '0.2px',
    boxShadow: '0 4px 24px rgba(40,168,74,0.35)',
    transition: 'opacity 0.15s ease, transform 0.15s ease',
    marginTop: 'auto',
  },
};