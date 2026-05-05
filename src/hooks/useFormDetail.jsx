import { useState, useCallback, useEffect } from 'react';
import { get, patch } from '@/lib/api';
import { useUI } from '@/contexts/UIContext';

export function useFormDetail(id) {
  const [form, setForm] = useState(null);
  const [resolvedFormId, setResolvedFormId] = useState(id);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { addToast } = useUI();

  const getBaseEndpoint = (formType) => {
    if (formType === 'STREAMSHED') return `/dpr/streamshed`;
    if (formType === 'GROUNDWATER') return `/dpr/groundwater`;
    return `/dpr/springshed`;
  };

  const fetchForm = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const fetchByType = async (type) => {
        const base = type === 'STREAMSHED' ? '/dpr/streamshed' : type === 'GROUNDWATER' ? '/dpr/groundwater' : '/dpr/springshed';
        const res = await get(`${base}/${id}`);
        return res?.success ? { ...res.data, formType: res?.data?.formType || type } : null;
      };

      // Try Springshed first (most common), then Streamshed, then Groundwater
      let data = await fetchByType('SPRINGSHED');
      if (!data) data = await fetchByType('STREAMSHED');
      if (!data) data = await fetchByType('GROUNDWATER');

      if (data) {
        setForm(data);
        setResolvedFormId(data?.dprId || data?._id || id);
      } else {
        setError('Form not found or you are not authorized to view it');
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
      addToast('Form approved successfully', 'success');
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
      addToast('Form returned for corrections', 'success');
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
      addToast('Form resubmitted successfully', 'success');
      fetchForm();
      return true;
    }
    addToast(res?.message || 'Failed to resubmit', 'error');
    return false;
  };

  return { form, loading, error, refresh: fetchForm, approveForm, rejectForm, resubmitForm, getBaseEndpoint, resolvedFormId };
}
