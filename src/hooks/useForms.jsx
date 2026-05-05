import { useState, useEffect, useCallback } from 'react';
import { get, del } from '@/lib/api';
import { useDebounce } from './useDebounce';
import { useUI } from '@/contexts/UIContext';

export function useForms(endpointBase) {
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
      if (filters.department) queryParams.append('department', filters.department);
      if (filters.dateFrom) queryParams.append('dateFrom', filters.dateFrom);
      if (filters.dateTo) queryParams.append('dateTo', filters.dateTo);

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
        setError(result?.message || 'Failed to fetch forms');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [endpointBase, pagination.page, pagination.limit, debouncedSearch, filters.status, filters.district, filters.department, filters.dateFrom, filters.dateTo]);

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

  const deleteForm = async (id, formType = 'SPRINGSHED') => {
    const endpoint = formType === 'STREAMSHED' ? `/dpr/streamshed/${id}` : `/dpr/springshed/${id}`;
    const res = await del(endpoint);
    if (res?.success) {
      addToast('Form deleted successfully', 'success');
      fetchForms();
    } else {
      addToast(res?.message || 'Delete failed', 'error');
    }
  };

  return { forms, loading, error, pagination, filters, applyFilters, changePage, refresh: fetchForms, deleteForm };
}
