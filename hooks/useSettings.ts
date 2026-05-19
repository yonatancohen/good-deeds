import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { Tables } from '@/types/supabase';

type Settings = Tables<'settings'>;

interface UseSettingsResult {
  settings: Settings | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useSettings(): UseSettingsResult {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSettings = useCallback(async () => {
    const { data, error: err } = await supabase
      .from('settings')
      .select('*')
      .limit(1)
      .maybeSingle();

    if (err) {
      setError(err.message);
    } else {
      setSettings(data);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    let mounted = true;

    async function fetchSettingsMounted() {
      const { data, error: err } = await supabase
        .from('settings')
        .select('*')
        .limit(1)
        .maybeSingle();

      if (!mounted) return;
      if (err) {
        setError(err.message);
      } else {
        setSettings(data);
      }
      setLoading(false);
    }

    fetchSettingsMounted();

    // Realtime: unique channel name per instance to avoid "already subscribed" error
    const channelName = `settings-changes-${Math.random().toString(36).slice(2)}`;
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'settings' },
        () => { fetchSettingsMounted(); }
      )
      .subscribe();

    return () => {
      mounted = false;
      supabase.removeChannel(channel);
    };
  }, []);

  return { settings, loading, error, refresh: fetchSettings };
}
