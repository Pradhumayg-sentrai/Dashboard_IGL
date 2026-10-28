import { useEffect } from 'react';
import { getActiveAdapter } from '../data/adapter';
import { useDashboardStore } from './dashboardStore';

export function useSimulationTicker() {
  const applyBayDeltas = useDashboardStore(s => s.applyBayDeltas);
  const setFullBays = useDashboardStore(s => s.setFullBays);
  const setConnectionStatus = useDashboardStore(s => s.setConnectionStatus);

  useEffect(() => {
    const adapter = getActiveAdapter();

    const unsubscribe = adapter.subscribe((event) => {
      if (event.type === 'snapshot') {
        setFullBays(event.data.bays, event.timestamp);
      } else if (event.type === 'delta') {
        if (event.data.bays) {
          applyBayDeltas(event.data.bays, event.timestamp);
        }
      } else if (event.type === 'status') {
        setConnectionStatus(event.status);
      }
    });

    return () => {
      unsubscribe();
    };
  }, [applyBayDeltas, setFullBays, setConnectionStatus]);
}
