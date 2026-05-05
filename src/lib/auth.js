export const setToken = (token) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('accessToken', token);
    document.cookie = `accessToken=${token}; path=/; max-age=86400; SameSite=Lax`;
  }
};

export const getToken = () => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('accessToken');
  }
  return null;
};

export const removeToken = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('accessToken');
    document.cookie = 'accessToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
  }
};
