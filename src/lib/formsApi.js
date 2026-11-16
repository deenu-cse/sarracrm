import axiosInstance from '@/lib/axiosInstance';
import { ApiFailure, request } from '@/lib/projectApi';

/**
 * API layer of the field forms: committee meetings (HPC, SLEC, DLEC), DNSS,
 * training programmes and JSA progress (Prarup-03). Who may do what is decided
 * by the backend and arrives as `permissions`.
 */

const q = (params = {}) => new URLSearchParams(Object.entries(params).filter(([, value]) => value !== '' && value !== null && value !== undefined && value !== false)).toString();
const enc = (value) => encodeURIComponent(String(value));
const multipart = { headers: { 'Content-Type': 'multipart/form-data' } };
const formOf = (files) => {
  const form = new FormData();
  files.forEach((file) => form.append('files', file));
  return form;
};

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

// ─── Committee meetings ──────────────────────────────────────────────────────
export const fetchMeetings = (params) => request(() => axiosInstance.get(`/meetings?${q(params)}`), 'Unable to load meetings. Please try again.');
export const fetchMeeting = (id) => request(() => axiosInstance.get(`/meetings/${enc(id)}`), 'Unable to load the meeting. Please try again.');
export const createMeeting = (body) => request(() => axiosInstance.post('/meetings', body), 'The meeting could not be saved. Please try again.');
export const updateMeeting = (id, body) => request(() => axiosInstance.put(`/meetings/${enc(id)}`, body), 'The meeting could not be saved. Please try again.');
export const deleteMeeting = (id) => request(() => axiosInstance.delete(`/meetings/${enc(id)}`), 'The draft could not be deleted. Please try again.');
export const uploadMeetingFiles = (id, kind, files) => request(() => axiosInstance.post(`/meetings/${enc(id)}/files/${enc(kind)}`, formOf(files), multipart), 'The files could not be uploaded. Please try again.');
export const removeMeetingFile = (id, kind, fileId) => request(() => axiosInstance.delete(`/meetings/${enc(id)}/files/${enc(kind)}/${enc(fileId)}`), 'The file could not be removed. Please try again.');
export const submitMeeting = (id) => request(() => axiosInstance.patch(`/meetings/${enc(id)}/submit`), 'The meeting could not be submitted. Please try again.');
export const approveMeeting = (id, note) => request(() => axiosInstance.patch(`/meetings/${enc(id)}/approve`, { note }), 'The meeting could not be approved. Please try again.');
export const returnMeeting = (id, reason) => request(() => axiosInstance.patch(`/meetings/${enc(id)}/return`, { reason }), 'The meeting could not be returned. Please try again.');
/** Sidebar badge: meetings waiting for the HQ Approver (same shape as the other queues). */
export const fetchMeetingQueue = async () => {
  const data = await request(() => axiosInstance.get('/meetings/pending-count'), 'Unable to count meetings.');
  return { total: data?.count || 0 };
};
export const downloadMeetingPdf = (id, refNo) => download(`/meetings/${enc(id)}/pdf`, `${refNo || 'Meeting'}.pdf`);
export const downloadMeetingsExcel = (params) => download(`/meetings/export?${q(params)}`, 'Committee-Meetings.xlsx');

// ─── DNSS ────────────────────────────────────────────────────────────────────
export const fetchDnssList = (params) => request(() => axiosInstance.get(`/dnss?${q(params)}`), 'Unable to load DNSS committees. Please try again.');
export const fetchDnss = (id) => request(() => axiosInstance.get(`/dnss/${enc(id)}`), 'Unable to load the DNSS record. Please try again.');
export const createDnss = (body) => request(() => axiosInstance.post('/dnss', body), 'The DNSS record could not be saved. Please try again.');
export const updateDnss = (id, body) => request(() => axiosInstance.put(`/dnss/${enc(id)}`, body), 'The DNSS record could not be saved. Please try again.');
export const deleteDnss = (id) => request(() => axiosInstance.delete(`/dnss/${enc(id)}`), 'The DNSS record could not be deleted. Please try again.');
export const uploadDnssFiles = (id, kind, files) => request(() => axiosInstance.post(`/dnss/${enc(id)}/files/${enc(kind)}`, formOf(files), multipart), 'The files could not be uploaded. Please try again.');
export const removeDnssFile = (id, kind, fileId) => request(() => axiosInstance.delete(`/dnss/${enc(id)}/files/${enc(kind)}/${enc(fileId)}`), 'The file could not be removed. Please try again.');
export const downloadDnssExcel = (params) => download(`/dnss/export?${q(params)}`, 'DNSS-Register.xlsx');

// ─── Training ────────────────────────────────────────────────────────────────
export const fetchTrainings = (params) => request(() => axiosInstance.get(`/trainings?${q(params)}`), 'Unable to load training programmes. Please try again.');
export const fetchTraining = (id) => request(() => axiosInstance.get(`/trainings/${enc(id)}`), 'Unable to load the training programme. Please try again.');
export const createTraining = (body) => request(() => axiosInstance.post('/trainings', body), 'The training programme could not be saved. Please try again.');
export const updateTraining = (id, body) => request(() => axiosInstance.put(`/trainings/${enc(id)}`, body), 'The training programme could not be saved. Please try again.');
export const deleteTraining = (id) => request(() => axiosInstance.delete(`/trainings/${enc(id)}`), 'The training programme could not be deleted. Please try again.');
export const uploadTrainingFiles = (id, kind, files) => request(() => axiosInstance.post(`/trainings/${enc(id)}/files/${enc(kind)}`, formOf(files), multipart), 'The files could not be uploaded. Please try again.');
export const removeTrainingFile = (id, kind, fileId) => request(() => axiosInstance.delete(`/trainings/${enc(id)}/files/${enc(kind)}/${enc(fileId)}`), 'The file could not be removed. Please try again.');
export const downloadTrainingExcel = (params) => download(`/trainings/export?${q(params)}`, 'Training-Programmes.xlsx');

// ─── JSA progress ────────────────────────────────────────────────────────────
export const fetchJsaReports = (params) => request(() => axiosInstance.get(`/jsa/reports?${q(params)}`), 'Unable to load JSA reports. Please try again.');
export const fetchJsaReport = (id) => request(() => axiosInstance.get(`/jsa/reports/${enc(id)}`), 'Unable to load the JSA report. Please try again.');
export const createJsaReport = (body) => request(() => axiosInstance.post('/jsa/reports', body), 'The JSA report could not be created. Please try again.');
export const updateJsaReport = (id, body) => request(() => axiosInstance.patch(`/jsa/reports/${enc(id)}`, body), 'The JSA report could not be saved. Please try again.');
export const deleteJsaReport = (id) => request(() => axiosInstance.delete(`/jsa/reports/${enc(id)}`), 'The JSA report could not be deleted. Please try again.');
export const addJsaProgress = (id, body) => request(() => axiosInstance.post(`/jsa/reports/${enc(id)}/updates`, body), 'The progress could not be saved. Please try again.');
export const fetchJsaConsolidated = (params) => request(() => axiosInstance.get(`/jsa/consolidated?${q(params)}`), 'Unable to load the JSA progress report. Please try again.');
export const fetchJsaSettings = () => request(() => axiosInstance.get('/jsa/settings'), 'Unable to load the recharge factors. Please try again.');
export const saveJsaSettings = (factors) => request(() => axiosInstance.put('/jsa/settings', { factors }), 'The recharge factors could not be saved. Please try again.');
export const downloadJsa = (params, format) => download(`/jsa/export/${format}?${q(params)}`, `JSA-Prarup-03.${format === 'pdf' ? 'pdf' : 'xlsx'}`);
