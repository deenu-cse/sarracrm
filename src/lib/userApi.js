import axiosInstance from '@/lib/axiosInstance';
import { request } from '@/lib/projectApi';

/**
 * API layer for user management by tier. Who may add, approve or change an
 * account is decided by the backend: the list arrives with `permissions` for the
 * signed-in user and `canApprove` / `canManage` on every account.
 */

const query = (params) => new URLSearchParams(Object.entries(params).filter(([, value]) => value !== '' && value != null)).toString();

export const fetchUsers = async (params = {}) => {
  try {
    const { data: body } = await axiosInstance.get(`/admin/users?${query(params)}`);
    return {
      items: Array.isArray(body?.data) ? body.data : [],
      pagination: body?.pagination || { page: 1, totalPages: 1, total: 0 },
      permissions: body?.permissions || {},
      pendingApproval: body?.pendingApproval || 0,
    };
  } catch (err) {
    const message = err?.response?.status >= 400 && err?.response?.status < 500 && err?.response?.data?.message;
    throw new Error(message || 'Unable to load users. Please try again.');
  }
};

/** The HQ administrator invites directly; the HQ Maker and District Makers request the account. */
export const inviteUser = async (payload) => {
  try {
    const { data: body } = await axiosInstance.post('/admin/users/invite', payload);
    return { user: body?.data, message: body?.message || 'Invitation sent.' };
  } catch (err) {
    const message = err?.response?.status >= 400 && err?.response?.status < 500 && err?.response?.data?.message;
    throw new Error(message || 'The account could not be added. Please try again.');
  }
};

export const approveUser = (id, note) => request(() => axiosInstance.patch(`/admin/users/${id}/approve`, { note }), 'The request could not be approved. Please try again.');
export const rejectUser = (id, reason) => request(() => axiosInstance.patch(`/admin/users/${id}/reject`, { reason }), 'The request could not be rejected. Please try again.');
export const suspendUser = (id, body) => request(() => axiosInstance.patch(`/admin/users/${id}/suspend`, body), 'The user could not be suspended. Please try again.');
export const deactivateUser = (id, body) => request(() => axiosInstance.patch(`/admin/users/${id}/deactivate`, body), 'The user could not be deactivated. Please try again.');
export const restoreUser = (id) => request(() => axiosInstance.patch(`/admin/users/${id}/restore`, {}), 'Access could not be restored. Please try again.');
