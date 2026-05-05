import { useState, useEffect, useRef, useCallback } from 'react';
import { get } from '@/lib/api';

/**
 * Fetches multiple analytics endpoints in parallel.
 * Pass a STABLE `endpoints` object (defined outside the component or useMemo'd)
 * to avoid infinite re-fetch loops.
 *
 * @param {{ [key: string]: string }} endpoints
 */
export function useAnalytics(endpoints = {}) {
  const [data, setData] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  // Increment to force a re-fetch (used by refresh())
  const [fetchCount, setFetchCount] = useState(0);

  // Stable string representation of the endpoints so effect deps are primitives
  const endpointKeys = Object.keys(endpoints).sort().join(',');
  const endpointValues = Object.values(
    Object.fromEntries(Object.keys(endpoints).sort().map(k => [k, endpoints[k]]))
  ).join(',');
  const cacheKey = `${endpointKeys}:${endpointValues}`;

  const fetchAll = useCallback(async () => {
    const keys = Object.keys(endpoints);
    if (keys.length === 0) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const promises = keys.map(key =>
        get(endpoints[key]).catch(err => {
          console.warn(`Analytics fetch failed for [${key}]:`, err.message);
          return null;
        })
      );
      const results = await Promise.all(promises);

      const newData = {};
      results.forEach((res, index) => {
        // Unwrap nested data.data if returned
        if (res?.success) {
          const payload = res.data;
          newData[keys[index]] = (payload && typeof payload === 'object' && Array.isArray(payload.data))
            ? payload.data
            : payload;
        } else {
          newData[keys[index]] = null;
        }
      });

      setData(newData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cacheKey, fetchCount]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  // Expose refresh — bumping fetchCount forces fetchAll to be a new reference
  const refresh = useCallback(() => {
    setFetchCount(c => c + 1);
  }, []);

  return { data, loading, error, refresh };
}
