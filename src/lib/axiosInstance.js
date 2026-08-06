import { getToken } from '@/lib/auth';
import { getAuthContext } from '@/contexts/AuthContext';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

/**
 * Axios-compatible fetch wrapper.
 * Provides .get(), .post(), .patch(), .delete() with automatic
 * auth token injection and 401 refresh-retry logic.
 */
class AxiosInstance {
  async request(endpoint, options = {}) {
    const token = getToken();
    const headers = {
      ...(!(options.body instanceof FormData) && { 'Content-Type': 'application/json' }),
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    };

    let res = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
      credentials: 'include',
    });

    // If 401, attempt silent token refresh and retry once
    if (res.status === 401) {
      const auth = typeof window !== 'undefined' ? getAuthContext() : null;
      if (auth?.refreshToken) {
        const newToken = await auth.refreshToken();
        if (newToken) {
          headers.Authorization = `Bearer ${newToken}`;
          res = await fetch(`${API_URL}${endpoint}`, {
            ...options,
            headers,
            credentials: 'include',
          });
        } else {
          auth.logout?.();
          throw { response: { status: 401, data: { message: 'Session expired. Please login again.' } } };
        }
      }
    }

    const data = await res.json();

    if (!res.ok) {
      const error = new Error(data.message || 'Request failed');
      error.response = { status: res.status, data };
      throw error;
    }

    return { data, status: res.status };
  }

  get(endpoint, config = {}) {
    return this.request(endpoint, { method: 'GET', ...config });
  }

  post(endpoint, body, config = {}) {
    const options = { method: 'POST', ...config };
    if (body instanceof FormData) {
      options.body = body;
    } else {
      options.body = JSON.stringify(body);
    }
    return this.request(endpoint, options);
  }

  patch(endpoint, body, config = {}) {
    return this.request(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(body),
      ...config,
    });
  }

  delete(endpoint, config = {}) {
    return this.request(endpoint, { method: 'DELETE', ...config });
  }

  put(endpoint, body, config = {}) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(body),
      ...config,
    });
  }
}

const axiosInstance = new AxiosInstance();
export default axiosInstance;
