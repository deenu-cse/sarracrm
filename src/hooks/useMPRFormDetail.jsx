import { useState, useCallback, useEffect } from 'react';
import { get, patch } from '@/lib/api';
import { useUI } from '@/contexts/UIContext';

export function useMPRFormDetail(id) {
  const [form, setForm] = useState(null);
  const [resolvedFormId, setResolvedFormId] = useState(id);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { addToast } = useUI();

  const getBaseEndpoint = (formType) => {
    if (formType === 'PRAROOP_1A') return `/mpr/praroop1a`;
    if (formType === 'PRAROOP_1B') return `/mpr/praroop1b`;
    if (formType === 'PRAROOP_1C') return `/mpr/praroop1c`;
    if (formType === 'PRAROOP_1D') return `/mpr/praroop1d`;
    if (formType === 'ABSTRACT_55') return `/mpr/abstract55`;
    return `/mpr/praroop1a`;
  };

  const fetchForm = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const fetchByType = async (type) => {
        const base = getBaseEndpoint(type);
        const res = await get(`${base}/${id}`);
        return res?.success ? { ...res.data, formType: res?.data?.reportType || res?.data?.formType || type } : null;
      };

      // Since we don't know the exact type from just the ID when linking directly, 
      // we try them sequentially if the type isn't provided in the route state.
      let data = await fetchByType('PRAROOP_1A');
      if (!data) data = await fetchByType('PRAROOP_1B');
      if (!data) data = await fetchByType('PRAROOP_1C');
      if (!data) data = await fetchByType('PRAROOP_1D');
      if (!data) data = await fetchByType('ABSTRACT_55');

      if (data) {
        setForm(data);
        setResolvedFormId(data?.mprId || data?._id || id);
      } else {
        setError('MPR Form not found or you are not authorized to view it');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchForm();
  }, [fetchForm]);

  const approveForm = async () => {
    if (!form) return false;
    const base = getBaseEndpoint(form.formType);
    const res = await patch(`${base}/${resolvedFormId}/approve`);
    if (res?.success) {
      addToast('MPR Form approved successfully', 'success');
      setForm(prev => ({ ...prev, status: 'APPROVED' }));
      return true;
    }
    addToast(res?.message || 'Failed to approve', 'error');
    return false;
  };

  const rejectForm = async (reason) => {
    if (!form) return false;
    const base = getBaseEndpoint(form.formType);
    const res = await patch(`${base}/${resolvedFormId}/reject`, { rejectionReason: reason });
    if (res?.success) {
      addToast('MPR Form returned for corrections', 'success');
      setForm(prev => ({ ...prev, status: 'REJECTED', rejectionReason: reason }));
      return true;
    }
    addToast(res?.message || 'Failed to reject', 'error');
    return false;
  };

  const resubmitForm = async (data) => {
    if (!form) return false;
    const base = getBaseEndpoint(form.formType);
    const res = await patch(`${base}/${resolvedFormId}/resubmit`, data);
    if (res?.success) {
      addToast('MPR Form resubmitted successfully', 'success');
      fetchForm();
      return true;
    }
    addToast(res?.message || 'Failed to resubmit', 'error');
    return false;
  };

  return { form, loading, error, refresh: fetchForm, approveForm, rejectForm, resubmitForm, getBaseEndpoint, resolvedFormId };
}
