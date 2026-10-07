import axiosInstance from '@/lib/axiosInstance';
import { ApiFailure, request } from '@/lib/projectApi';

/**
 * API layer for the later life of a project: completion and closure, outcome
 * tracking, deadlines and reminders, report evidence and official downloads.
 */

const id = (value) => encodeURIComponent(value);
const query = (params) => new URLSearchParams(Object.entries(params).filter(([, value]) => value !== undefined && value !== null && value !== '')).toString();


// ── Completion and closure ───────────────────────────────────────────────────

export const fetchCompletionState = (projectId) => request(
  () => axiosInstance.get(`/sanctions/${id(projectId)}/completion`),
  'Unable to load the completion status. Please try again.',
);

/** `files` = { completionCertificate?: File, utilisationCertificate?: File } */
export const submitCompletion = (projectId, { departmentId, completionDate, remarks }, files = {}) => {
  const form = new FormData();
  form.append('departmentId', departmentId);
  form.append('completionDate', completionDate);
  form.append('remarks', remarks || '');
  if (files.completionCertificate) form.append('completionCertificate', files.completionCertificate);
  if (files.utilisationCertificate) form.append('utilisationCertificate', files.utilisationCertificate);
  return request(
    () => axiosInstance.post(`/sanctions/${id(projectId)}/completion`, form),
    'The completion report could not be filed. Please check your connection and try again.',
  );
};

export const reviewCompletion = (projectId, departmentId, action, text) => request(
  () => axiosInstance.patch(`/sanctions/${id(projectId)}/completion/${id(departmentId)}/${action === 'verify' ? 'verify' : 'return'}`, action === 'verify' ? { note: text } : { reason: text }),
  'This action could not be completed. Please try again.',
);

export const closeProject = (projectId, payload) => request(
  () => axiosInstance.post(`/sanctions/${id(projectId)}/close`, payload),
  'The project could not be closed. Please try again.',
);

export const recordRefund = (projectId, refundReference) => request(
  () => axiosInstance.patch(`/sanctions/${id(projectId)}/closure/refund`, { refundReference }),
  'The refund could not be recorded. Please try again.',
);

// ── Outcomes ─────────────────────────────────────────────────────────────────

export const fetchProjectOutcomes = (projectId) => request(
  () => axiosInstance.get(`/sanctions/${id(projectId)}/outcomes`),
  'Unable to load outcomes. Please try again.',
);

export const recordOutcome = (projectId, { indicatorCode, kind, value, measuredOn, remarks }, evidence) => {
  const form = new FormData();
  form.append('indicatorCode', indicatorCode);
  form.append('kind', kind);
  form.append('value', value);
  form.append('measuredOn', measuredOn);
  form.append('remarks', remarks || '');
  if (evidence) form.append('evidence', evidence);
  return request(
    () => axiosInstance.post(`/sanctions/${id(projectId)}/outcomes`, form),
    'The reading could not be saved. Please try again.',
  );
};

export const voidOutcome = (projectId, entryId, reason) => request(
  () => axiosInstance.patch(`/sanctions/${id(projectId)}/outcomes/${id(entryId)}/void`, { reason }),
  'The reading could not be struck out. Please try again.',
);

export const fetchOutcomeSummary = (filters = {}) => request(
  () => axiosInstance.get(`/sanctions/outcomes/summary?${query(filters)}`),
  'Unable to load outcomes. Please try again.',
);

// ── Deadlines, reminders, monthly summary ────────────────────────────────────

export const fetchDeadlines = () => request(
  () => axiosInstance.get('/monitoring/deadlines'),
  'Unable to load deadlines. Please try again.',
);

export const fetchMonitoringSettings = () => request(
  () => axiosInstance.get('/monitoring/settings'),
  'Unable to load settings. Please try again.',
);

export const saveMonitoringSettings = (payload) => request(
  () => axiosInstance.put('/monitoring/settings', payload),
  'The settings could not be saved. Please try again.',
);

export const runRemindersNow = () => request(
  () => axiosInstance.post('/monitoring/reminders/run'),
  'Reminders could not be sent. Please try again.',
);

export const sendMonthlySummary = (payload = {}) => request(
  () => axiosInstance.post('/monitoring/reports/send', payload),
  'The summary could not be sent. Please try again.',
);

export const fetchSummaryPreview = () => request(
  () => axiosInstance.get('/monitoring/reports/preview'),
  'Unable to load the summary. Please try again.',
);

export const fetchDispatches = () => request(
  () => axiosInstance.get('/monitoring/reports/dispatches'),
  'Unable to load the send log. Please try again.',
).then((list) => (Array.isArray(list) ? list : []));

// ── Report evidence (optional) ───────────────────────────────────────────────

/** `items` = [{ file: File, caption: string }] */
export const addMprEvidence = (mprId, items) => {
  const form = new FormData();
  items.forEach((item) => {
    form.append('files', item.file);
    form.append('captions', item.caption || '');
  });
  return request(
    () => axiosInstance.post(`/project-mprs/${id(mprId)}/evidence`, form),
    'The files could not be uploaded. Please check your connection and try again.',
  );
};

export const removeMprEvidence = (mprId, evidenceId) => request(
  () => axiosInstance.delete(`/project-mprs/${id(mprId)}/evidence/${id(evidenceId)}`),
  'The file could not be removed. Please try again.',
);

// ── Official downloads (PDF / Excel made by the server) ──────────────────────

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

const download = async (path, fallbackName, fallbackMessage) => {
  try {
    const response = await axiosInstance.get(path, { responseType: 'blob' });
    const header = response.headers?.['content-disposition'] || '';
    const named = /filename="?([^";]+)"?/i.exec(header);
    saveBlob(response.data, named ? named[1] : fallbackName);
  } catch (err) {
    const status = err?.response?.status || 0;
    let message = err?.response?.data?.message || '';
    if (status === 401) message = 'Your session has expired. Please sign in again.';
    throw new ApiFailure(status >= 400 && status < 500 && message ? message : fallbackMessage, { status });
  }
};

export const downloadMprPdf = (mprId, mprNo) => download(`/project-mprs/${id(mprId)}/pdf`, `${mprNo || 'MPR'}.pdf`, 'The PDF could not be prepared. Please try again.');
export const downloadMprExcel = (mprId, mprNo) => download(`/project-mprs/${id(mprId)}/excel`, `${mprNo || 'MPR'}.xlsx`, 'The Excel file could not be prepared. Please try again.');
export const downloadMprRegister = (filters = {}) => download(`/project-mprs/export/register?${query(filters)}`, 'MPR-Register.xlsx', 'The register could not be prepared. Please try again.');
