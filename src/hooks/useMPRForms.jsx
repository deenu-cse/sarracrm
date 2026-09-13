import { useState, useEffect, useCallback } from 'react';
import { get, del } from '@/lib/api';
import { useDebounce } from './useDebounce';
import { useUI } from '@/contexts/UIContext';

export function useMPRForms(endpointBase = '/mpr-admin/forms-list') {
  const [forms, setForms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0 });
  const [filters, setFilters] = useState({});
  const { addToast } = useUI();

  const debouncedSearch = useDebounce(filters.search, 300);

  const fetchForms = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const queryParams = new URLSearchParams();
      queryParams.append('page', pagination.page);
      queryParams.append('limit', pagination.limit);
      
      if (debouncedSearch) queryParams.append('search', debouncedSearch);
      if (filters.status) queryParams.append('status', filters.status);
      if (filters.district) queryParams.append('district', filters.district);
      if (filters.formType) queryParams.append('formType', filters.formType);
      if (filters.financialYear) queryParams.append('financialYear', filters.financialYear);
      if (filters.reportingMonth) queryParams.append('reportingMonth', filters.reportingMonth);

      const result = await get(`${endpointBase}?${queryParams.toString()}`);
      if (result?.success) {
        if (Array.isArray(result.data)) {
          setForms(result.data);
          if (result.pagination) {
            setPagination(prev => ({ ...prev, total: result.pagination.total || result.pagination.totalItems, totalPages: result.pagination.totalPages || result.pagination.pages }));
          }
        } else if (result.data && Array.isArray(result.data.data)) {
          setForms(result.data.data);
          if (result.data.pagination) {
            setPagination(prev => ({ ...prev, total: result.data.pagination.total || result.data.pagination.totalItems, totalPages: result.data.pagination.totalPages || result.data.pagination.pages }));
          }
        } else {
          setForms(result.data || []);
        }
      } else {
        setError(result?.message || 'Failed to fetch MPR forms');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [endpointBase, pagination.page, pagination.limit, debouncedSearch, filters.status, filters.district, filters.formType, filters.financialYear, filters.reportingMonth]);

  useEffect(() => {
    fetchForms();
  }, [fetchForms]);

  const applyFilters = (newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const changePage = (newPage) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  const deleteForm = async (id, formType = 'PRAROOP_1A') => {
    const routeMap = {
      'PRAROOP_1A': '/mpr/praroop1a',
      'PRAROOP_1B': '/mpr/praroop1b',
      'PRAROOP_1C': '/mpr/praroop1c',
      'PRAROOP_1D': '/mpr/praroop1d',
      'ABSTRACT_55': '/mpr/abstract55',
    };
    const endpoint = `${routeMap[formType] || '/mpr/praroop1a'}/${id}`;
    const res = await del(endpoint);
    if (res?.success) {
      addToast('MPR Form deleted successfully', 'success');
      fetchForms();
    } else {
      addToast(res?.message || 'Delete failed', 'error');
    }
  };

  return { forms, loading, error, pagination, filters, applyFilters, changePage, refresh: fetchForms, deleteForm };
}
