import { useState, useEffect, useCallback } from 'react';
import { apiCall } from '@/lib/api';

export function useFetch(endpoint, initialData = null) {
  const [data, setData] = useState(initialData);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const execute = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await apiCall(endpoint, { method: 'GET' });
      if (result?.success) {
        // Unwrap nested { data: [], pagination: {} } shape (e.g. forms-list API)
        const payload = result.data;
        if (payload && typeof payload === 'object' && Array.isArray(payload.data)) {
          setData(payload.data);
        } else {
          setData(payload ?? initialData);
        }
      } else {
        setError(result?.message || 'Failed to fetch');
        setData(initialData);
      }
    } catch (err) {
      setError(err.message);
      setData(initialData);
    } finally {
      setLoading(false);
    }
  }, [endpoint]);

  useEffect(() => {
    if (endpoint) {
      execute();
    }
  }, [execute, endpoint]);

  return { data, loading, error, refetch: execute, setData };
}
