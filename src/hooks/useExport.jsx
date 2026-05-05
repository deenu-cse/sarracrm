import { useState } from 'react';
import { getAuthContext } from '@/contexts/AuthContext';
import { useUI } from '@/contexts/UIContext';

export function useExport() {
  const [exporting, setExporting] = useState(false);
  const { addToast } = useUI();
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';
  
  const triggerExport = async (endpoint, filename) => {
    setExporting(true);
    try {
      const auth = getAuthContext();
      const accessToken = auth?.accessToken;
      
      const res = await fetch(`${API_URL}${endpoint}`, {
        headers: {
          ...(accessToken && { Authorization: `Bearer ${accessToken}` })
        }
      });
      
      if (!res.ok) throw new Error('Export failed');
      
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      addToast('Export successful');
    } catch (e) {
      console.error(e);
      addToast('Failed to export document', 'error');
    } finally {
      setExporting(false);
    }
  };

  return { triggerExport, exporting };
}
