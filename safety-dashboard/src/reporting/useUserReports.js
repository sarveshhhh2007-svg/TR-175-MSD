import { useEffect, useState } from 'react';
import { ref, onValue } from 'firebase/database';
import { rtdb } from '../firebase';

/**
 * Listens to /user_reports in RTDB in real-time.
 * Returns reports sorted newest-first.
 */
export function useUserReports() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const reportsRef = ref(rtdb, 'user_reports');

    const unsubscribe = onValue(
      reportsRef,
      (snapshot) => {
        const raw = snapshot.val();
        if (!raw) {
          setReports([]);
          setLoading(false);
          return;
        }
        const list = Object.values(raw)
          .filter(r => r.status === 'active')
          .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
        setReports(list);
        setLoading(false);
      },
      (err) => {
        console.error('[useUserReports] RTDB error:', err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  return { reports, loading };
}
