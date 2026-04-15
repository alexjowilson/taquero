import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export type MenuItem = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  category: string;
  image_url: string | null;
  sort_order: number;
};

export const TRUCK_ID = '4ad56a60-79f7-4497-80c4-d996026534d6';

export function useMenuItems() {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetch() {
      const { data, error } = await supabase
        .from('menu_items')
        .select('*')
        .eq('truck_id', TRUCK_ID)
        .eq('available', true)
        .order('sort_order');

      if (error) setError(error.message);
      else setItems(data ?? []);
      setLoading(false);
    }
    fetch();
  }, []);

  // Group by category for rendering
  const grouped = items.reduce<Record<string, MenuItem[]>>((acc, item) => {
    acc[item.category] = [...(acc[item.category] ?? []), item];
    return acc;
  }, {});

  return { grouped, loading, error };
}