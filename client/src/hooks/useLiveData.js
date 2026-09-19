import { useCallback, useEffect, useRef, useState } from 'react';
import { on } from '../lib/bus.js';

export function useLiveData(fetchFn, deps = [], { interval = 20000, events = ['data-changed'] } = {}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const fetchRef = useRef(fetchFn);
  fetchRef.current = fetchFn;

  const refresh = useCallback(async (silent) => {
    if (!silent) setLoading(true);
    try {
      const result = await fetchRef.current();
      setData(result);
      setError(null);
    } catch (e) {
      setError(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh(false);
    const timer = setInterval(() => refresh(true), interval);
    const offs = events.map((ev) => on(ev, () => refresh(true)));
    return () => {
      clearInterval(timer);
      offs.forEach((off) => off());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return { data, loading, error, refresh };
}
