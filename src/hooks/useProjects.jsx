"use client";
import { useState, useEffect, useCallback } from 'react';
import { apiCall } from '@/lib/api';

/**
 * Hook to fetch projects/sanctions based on user role.
 * @param {string} role - USER_ROLES value
 * @param {object} filters - query filters { status, district, financialYear, page, limit }
 */
export function useProjects(role, filters = {}) {
  const [projects, setProjects] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const getEndpoint = useCallback(() => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => {
      if (v !== '' && v != null) params.set(k, v);
    });
    const q = params.toString() ? `?${params.toString()}` : '';

    switch (role) {
      case 'SUPER_ADMIN':
      case 'MND_SUPER_ADMIN':
        return `/sanctions${q}`;
      case 'DD_LEVEL':
        return `/sanctions/district${q}`;
      case 'PIA_OFFICER':
        return `/sanctions/my-projects${q}`;
      default:
        return `/sanctions${q}`;
    }
  }, [role, JSON.stringify(filters)]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiCall(getEndpoint());
      if (res?.success) {
        const payload = res.data;
        if (payload && Array.isArray(payload.data)) {
          setProjects(payload.data);
          setPagination(payload.pagination || null);
        } else if (Array.isArray(payload)) {
          setProjects(payload);
        } else {
          setProjects([]);
        }
      } else {
        setError(res?.message || 'Failed to load projects');
        setProjects([]);
      }
    } catch (err) {
      setError(err.message);
      setProjects([]);
    } finally {
      setLoading(false);
    }
  }, [getEndpoint]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { projects, pagination, loading, error, refetch: fetch };
}

/**
 * Hook to fetch a single project detail.
 */
export function useProjectDetail(projectId) {
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetch = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await apiCall(`/sanctions/${projectId}`);
      if (res?.success) {
        setProject(res.data);
      } else {
        setError(res?.message || 'Failed to load project');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { project, loading, error, refetch: fetch };
}
