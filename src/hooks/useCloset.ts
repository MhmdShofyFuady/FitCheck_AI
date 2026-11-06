import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { isSupabaseConfigured, supabase } from '../lib/supabase';
import { StretchType } from '../utils/estimator';

export interface ClosetGarment {
  id: string;
  uri: string;
  image_path: string;
  chest_width_cm: number;
  hem_width_cm: number | null;
  shoulder_width_cm: number | null;
  length_cm: number | null;
  stretch_type: StretchType;
}

export interface ClosetResult {
  id: string;
  uri: string;
}

const BUCKET = 'tryon-photos';

/** Saved garments and finished try-on results, with signed image URLs. */
export function useCloset() {
  const { user, isDemo } = useAuth();
  const enabled = Boolean(user && !isDemo && isSupabaseConfigured);
  const [garments, setGarments] = useState<ClosetGarment[]>([]);
  const [results, setResults] = useState<ClosetResult[]>([]);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!enabled || !user) return;
    setLoading(true);
    try {
      const [g, r] = await Promise.all([
        supabase
          .from('garments')
          .select('id, image_path, chest_width_cm, hem_width_cm, shoulder_width_cm, length_cm, stretch_type')
          .eq('user_id', user.id)
          .not('image_path', 'is', null)
          .order('created_at', { ascending: false })
          .limit(40),
        supabase
          .from('tryon_jobs')
          .select('id, result_image_path')
          .eq('user_id', user.id)
          .eq('status', 'done')
          .not('result_image_path', 'is', null)
          .order('created_at', { ascending: false })
          .limit(40),
      ]);

      const garmentRows = g.data ?? [];
      const resultRows = r.data ?? [];
      const paths = [
        ...garmentRows.map((row) => row.image_path as string),
        ...resultRows.map((row) => row.result_image_path as string),
      ];

      // Missing files (e.g. mock results) come back without a signedUrl and are skipped.
      const urls = new Map<string, string>();
      if (paths.length > 0) {
        const { data } = await supabase.storage.from(BUCKET).createSignedUrls(paths, 3600);
        data?.forEach((d) => {
          if (d.path && d.signedUrl) urls.set(d.path, d.signedUrl);
        });
      }

      setGarments(
        garmentRows.flatMap((row) => {
          const uri = urls.get(row.image_path);
          return uri ? [{ ...row, uri } as ClosetGarment] : [];
        })
      );
      setResults(
        resultRows.flatMap((row) => {
          const uri = urls.get(row.result_image_path);
          return uri ? [{ id: row.id as string, uri }] : [];
        })
      );
    } catch {
      // Keep the last good list on network errors.
    } finally {
      setLoading(false);
    }
  }, [enabled, user]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { enabled, garments, results, loading, refresh };
}

