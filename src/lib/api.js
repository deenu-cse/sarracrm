import { getAuthContext } from '@/contexts/AuthContext';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

export async function apiCall(endpoint, options = {}) {
  // If getAuthContext is null or undefined (e.g. Server Side), handle gracefully.
  // In our Next.js App Router setup, mostly we fetch on client-side due to context requirement.
  const auth = typeof window !== 'undefined' ? getAuthContext() : null;
  const accessToken = auth?.accessToken;
  const refreshToken = auth?.refreshToken;
  const logout = auth?.logout;
  
  const config = {
    ...options,
    headers: {
      ...(!(options.body instanceof FormData) && { 'Content-Type': 'application/json' }),
      ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
      ...options.headers
    },
    credentials: 'include' // for cookies
  };
  
  try {
    let res = await fetch(`${API_URL}${endpoint}`, config);
    
    if (res.status === 401 && auth && refreshToken) {
      const refreshed = await refreshToken();
      if (refreshed) {
        config.headers.Authorization = `Bearer ${refreshed}`;
        res = await fetch(`${API_URL}${endpoint}`, config);
      } else {
        if (logout) logout();
        return null;
      }
    }
    
    const data = await res.json();
    return data;
  } catch (error) {
    console.error('API Call Error:', error);
    return { success: false, message: error.message || 'Connection failed' };
  }
}

export const get = (endpoint, options) => apiCall(endpoint, { ...options, method: 'GET' });
export const post = (endpoint, body, options) => apiCall(endpoint, { ...options, method: 'POST', body: JSON.stringify(body) });
export const patch = (endpoint, body, options) => apiCall(endpoint, { ...options, method: 'PATCH', body: JSON.stringify(body) });
export const del = (endpoint, options) => apiCall(endpoint, { ...options, method: 'DELETE' });
export const postFormData = (endpoint, formData, options) => apiCall(endpoint, { ...options, method: 'POST', body: formData });
export const patchFormData = (endpoint, formData, options) => apiCall(endpoint, { ...options, method: 'PATCH', body: formData });
