import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { Tables } from '@/types/supabase';

type Deed = Tables<'deeds'>;

interface UseDeeds {
  deeds: Deed[];
  loading: boolean;
  error: string | null;
}

/** Returns only active deeds, ordered by amount descending */
export function useDeeds(): UseDeeds {
  const [deeds, setDeeds] = useState<Deed[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function fetchDeeds() {
      const { data, error: err } = await supabase
        .from('deeds')
        .select('*')
        .eq('is_active', true)
        .order('amount', { ascending: false });

      if (!mounted) return;
      if (err) setError(err.message);
      else setDeeds(data ?? []);
      setLoading(false);
    }

    fetchDeeds();

    const channel = supabase
      .channel(`deeds-changes-${Date.now()}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'deeds' },
        () => { fetchDeeds(); }
      )
      .subscribe();

    return () => {
      mounted = false;
      supabase.removeChannel(channel);
    };
  }, []);

  return { deeds, loading, error };
}
