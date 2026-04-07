'use client';

import { useState } from 'react';
import { useMenuItems } from '@/hooks/useMenuItems';
import { useCart } from '@/context/CartContext';

type Props = {
  onClose: () => void;
};

function formatPrice(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

const CATEGORY_LABELS: Record<string, string> = {
  tacos: '🌮 Tacos',
  drinks: '🥤 Drinks',
  sides: '🍟 Sides',
};

const CATEGORY_ORDER = ['tacos', 'sides', 'drinks'];

export default function MenuModal({ onClose }: Props) {
  const { grouped, loading, error } = useMenuItems();
  const { items: cartItems, dispatch, total, itemCount } = useCart();
  const [view, setView] = useState<'menu' | 'cart'>('menu');

  const getQuantity = (id: string) =>
    cartItems.find(i => i.id === id)?.quantity ?? 0;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-white">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-4 border-b">
        <h2 className="text-xl font-bold">{view === 'menu' ? 'Menu' : 'Your Order'}</h2>
        <button
          onClick={onClose}
          className="text-gray-500 hover:text-black text-2xl leading-none"
        >
          ✕
        </button>
      </div>

      {/* Cart view */}
      {view === 'cart' ? (
        <div className="flex-1 overflow-y-auto px-4 pb-32">
          <div className="space-y-3 mt-6">
            {cartItems.map(item => (
              <div key={item.id} className="flex items-center justify-between p-3 rounded-xl border">
                <div className="flex-1">
                  <p className="font-medium">{item.name}</p>
                  <p className="text-sm text-gray-500">{formatPrice(item.price)} each</p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => dispatch({ type: 'DECREMENT', id: item.id })}
                    className="w-8 h-8 rounded-full border-2 border-orange-500 text-orange-500 font-bold"
                  >
                    −
                  </button>
                  <span className="font-bold w-4 text-center">{item.quantity}</span>
                  <button
                    onClick={() => dispatch({ type: 'INCREMENT', id: item.id })}
                    className="w-8 h-8 rounded-full bg-orange-500 text-white font-bold"
                  >
                    +
                  </button>
                </div>
                <p className="ml-4 font-semibold w-14 text-right">
                  {formatPrice(item.price * item.quantity)}
                </p>
              </div>
            ))}
          </div>
          <div className="mt-6 pt-4 border-t flex justify-between font-bold text-lg">
            <span>Total</span>
            <span>{formatPrice(total)}</span>
          </div>
        </div>

      ) : (
        /* Menu view */
        <div className="flex-1 overflow-y-auto px-4 pb-32">
          {loading && <p className="text-center mt-10 text-gray-400">Loading menu...</p>}
          {error && <p className="text-center mt-10 text-red-500">{error}</p>}

          {CATEGORY_ORDER.filter(cat => grouped[cat]).map((category) => (
            <div key={category} className="mt-6">
              <h3 className="text-lg font-semibold mb-3">
                {CATEGORY_LABELS[category] ?? category}
              </h3>
              <div className="space-y-3">
                {grouped[category].map(item => {        // 👈 fixed: was `items`
                  const qty = getQuantity(item.id);
                  return (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-3 rounded-xl border"
                    >
                      <div className="flex-1 pr-4">
                        <p className="font-medium">{item.name}</p>
                        {item.description && (
                          <p className="text-sm text-gray-500 mt-0.5">{item.description}</p>
                        )}
                        <p className="text-sm font-semibold mt-1">{formatPrice(item.price)}</p>
                      </div>
                      {qty === 0 ? (
                        <button
                          onClick={() =>
                            dispatch({ type: 'ADD_ITEM', item: { id: item.id, name: item.name, price: item.price } })
                          }
                          className="bg-orange-500 text-white text-sm font-bold px-4 py-2 rounded-full"
                        >
                          Add
                        </button>
                      ) : (
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => dispatch({ type: 'DECREMENT', id: item.id })}
                            className="w-8 h-8 rounded-full border-2 border-orange-500 text-orange-500 font-bold"
                          >
                            −
                          </button>
                          <span className="font-bold w-4 text-center">{qty}</span>
                          <button
                            onClick={() => dispatch({ type: 'INCREMENT', id: item.id })}
                            className="w-8 h-8 rounded-full bg-orange-500 text-white font-bold"
                          >
                            +
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Sticky cart footer */}
      {itemCount > 0 && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t">
          <button
            onClick={() => setView(view === 'menu' ? 'cart' : 'menu')}
            className="w-full bg-orange-500 text-white font-bold py-4 rounded-2xl flex justify-between items-center px-5"
          >
            <span className="bg-orange-600 rounded-full w-7 h-7 flex items-center justify-center text-sm">
              {itemCount}
            </span>
            <span>{view === 'cart' ? '← Back to Menu' : 'View Order'}</span>
            <span>{formatPrice(total)}</span>
          </button>
        </div>
      )}
    </div>
  );
}