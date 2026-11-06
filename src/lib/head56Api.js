import axiosInstance from '@/lib/axiosInstance';
import { ApiFailure, request } from '@/lib/projectApi';

/**
 * API layer for Budget Head 56 (Non-Salary Grant): master, allocations,
 * monthly reports, dashboard, Prarup-2 statement and the monthly review.
 * Who may do what is decided by the backend and arrives as `permissions`.
 */

const q = (params = {}) => new URLSearchParams(Object.entries(params).filter(([, value]) => value !== '' && value !== null && value !== undefined && value !== false)).toString();
const enc = (value) => encodeURIComponent(String(value));

const listCall = async (path, fallback) => {
  try {
    const { data: body } = await axiosInstance.get(path);
    return { items: Array.isArray(body?.data) ? body.data : [], pagination: body?.pagination || {}, total: body?.pagination?.total ?? 0 };
  } catch (err) {
    const status = err?.response?.status || 0;
    const message = status >= 400 && status < 500 && err?.response?.data?.message;
    throw new ApiFailure(status === 401 ? 'Your session has expired. Please sign in again.' : message || fallback, { status });
  }
};

// ─── Master ──────────────────────────────────────────────────────────────────
export const fetchH56Master = (includeInactive = false) => request(() => axiosInstance.get(`/head56/master?${q({ includeInactive })}`), 'Unable to load the Head 56 master. Please try again.');
export const createH56Item = (body) => request(() => axiosInstance.post('/head56/master', body), 'The line could not be added. Please try again.');
export const updateH56Item = (code, body) => request(() => axiosInstance.patch(`/head56/master/${enc(code)}`, body), 'The line could not be saved. Please try again.');

// ─── Allocations ─────────────────────────────────────────────────────────────
export const fetchH56Allocations = (params) => request(() => axiosInstance.get(`/head56/allocations?${q(params)}`), 'Unable to load allocations. Please try again.');
export const fetchH56Allocation = (id) => request(() => axiosInstance.get(`/head56/allocations/${enc(id)}`), 'Unable to load the allocation. Please try again.');
export const createH56Allocation = (body) => request(() => axiosInstance.post('/head56/allocations', body), 'The allocation could not be created. Please try again.');
export const saveH56Allocation = (id, body) => request(() => axiosInstance.put(`/head56/allocations/${enc(id)}`, body), 'The allocation could not be saved. Please try again.');
export const submitH56Allocation = (id, reason) => request(() => axiosInstance.patch(`/head56/allocations/${enc(id)}/submit`, { reason }), 'The allocation could not be submitted. Please try again.');
export const verifyH56Allocation = (id, note) => request(() => axiosInstance.patch(`/head56/allocations/${enc(id)}/verify`, { note }), 'The allocation could not be verified. Please try again.');
export const approveH56Allocation = (id, note) => request(() => axiosInstance.patch(`/head56/allocations/${enc(id)}/approve`, { note }), 'The allocation could not be approved. Please try again.');
export const returnH56Allocation = (id, reason) => request(() => axiosInstance.patch(`/head56/allocations/${enc(id)}/return`, { reason }), 'The allocation could not be returned. Please try again.');
export const discardH56Allocation = (id) => request(() => axiosInstance.delete(`/head56/allocations/${enc(id)}`), 'The allocation could not be discarded. Please try again.');

// ─── Reports: Maker ──────────────────────────────────────────────────────────
export const fetchH56Context = () => request(() => axiosInstance.get('/head56/context'), 'Unable to load your reporting unit. Please try again.');
export const fetchH56Form = (params) => request(() => axiosInstance.get(`/head56/form?${q(params)}`), 'Unable to load the report form. Please try again.');
export const createH56Report = (body) => request(() => axiosInstance.post('/head56/reports', body), 'The report could not be saved. Please try again.');
export const fetchH56EditForm = (id) => request(() => axiosInstance.get(`/head56/reports/${enc(id)}/form`), 'Unable to load the report. Please try again.');
export const saveH56Report = (id, body) => request(() => axiosInstance.put(`/head56/reports/${enc(id)}`, body), 'The report could not be saved. Please try again.');
export const discardH56Report = (id) => request(() => axiosInstance.delete(`/head56/reports/${enc(id)}`), 'The draft could not be discarded. Please try again.');
export const uploadH56Documents = (id, files, { code, docType }) => {
  const form = new FormData();
  files.forEach((file) => form.append('files', file));
  if (code) form.append('code', code);
  form.append('docType', docType || 'OTHER');
  return request(() => axiosInstance.post(`/head56/reports/${enc(id)}/documents`, form, { headers: { 'Content-Type': 'multipart/form-data' } }), 'The documents could not be uploaded. Please try again.');
};
export const removeH56Document = (id, documentId) => request(() => axiosInstance.delete(`/head56/reports/${enc(id)}/documents/${enc(documentId)}`), 'The document could not be removed. Please try again.');

// ─── Reports: reading and review chain ───────────────────────────────────────
export const fetchH56Reports = (params) => listCall(`/head56/reports?${q(params)}`, 'Unable to load reports. Please try again.');
export const fetchH56Queue = (params = {}) => listCall(`/head56/queue?${q(params)}`, 'Unable to load the reports waiting for you. Please try again.');
export const fetchH56Report = (id) => request(() => axiosInstance.get(`/head56/reports/${enc(id)}`), 'Unable to load the report. Please try again.');
export const forwardH56Report = (id, { note, checks }) => request(() => axiosInstance.patch(`/head56/reports/${enc(id)}/forward`, { note, checks }), 'The report could not be forwarded. Please try again.');
export const returnH56Report = (id, reason) => request(() => axiosInstance.patch(`/head56/reports/${enc(id)}/return`, { reason }), 'The report could not be returned. Please try again.');
export const rejectH56Report = (id, reason) => request(() => axiosInstance.patch(`/head56/reports/${enc(id)}/reject`, { reason }), 'The report could not be rejected. Please try again.');
export const reopenH56Report = (id, reason) => request(() => axiosInstance.patch(`/head56/reports/${enc(id)}/reopen`, { reason }), 'The report could not be reopened. Please try again.');

// ─── Dashboard, statement and monthly review ─────────────────────────────────
export const fetchH56Dashboard = (params) => request(() => axiosInstance.get(`/head56/dashboard?${q(params)}`), 'Unable to load the Head 56 dashboard. Please try again.');
export const fetchH56Statement = (params) => request(() => axiosInstance.get(`/head56/statement?${q(params)}`), 'Unable to load the statement. Please try again.');
export const fetchH56Reviews = (params) => request(() => axiosInstance.get(`/head56/reviews?${q(params)}`), 'Unable to load the monthly reviews. Please try again.');
export const recordH56Review = (body) => request(() => axiosInstance.post('/head56/reviews', body), 'The review could not be recorded. Please try again.');
export const withdrawH56Review = (id, reason) => request(() => axiosInstance.patch(`/head56/reviews/${enc(id)}/withdraw`, { reason }), 'The review could not be withdrawn. Please try again.');

// ─── Official downloads ──────────────────────────────────────────────────────
const saveBlob = (blob, filename) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 2000);
};

const download = async (path, fallbackName) => {
  try {
    const response = await axiosInstance.get(path, { responseType: 'blob' });
    const named = /filename="?([^";]+)"?/i.exec(response.headers?.['content-disposition'] || '');
    saveBlob(response.data, named ? named[1] : fallbackName);
  } catch (err) {
    const status = err?.response?.status || 0;
    throw new ApiFailure(status === 401 ? 'Your session has expired. Please sign in again.' : 'The file could not be prepared. Please try again.', { status });
  }
};

export const downloadH56Report = (id, format, mprNo) => download(`/head56/reports/${enc(id)}/${format}`, `${mprNo || 'Head56'}.${format === 'pdf' ? 'pdf' : 'xlsx'}`);
export const downloadH56Statement = (params, format) => download(`/head56/statement/${format}?${q(params)}`, `Head56-Prarup-2.${format === 'pdf' ? 'pdf' : 'xlsx'}`);
