import axiosInstance from '@/lib/axiosInstance';
import { request } from '@/lib/projectApi';

/**
 * API layer for project Monthly Progress Reports.
 * Targets, previous progress and totals always come from the backend; the
 * client only sends this month's figures. Who may take each review step is
 * decided by the backend and arrives with the report as `permissions`.
 */

const query = (params) => new URLSearchParams(Object.entries(params).filter(([, value]) => value !== undefined && value !== null && value !== '')).toString();
const id = (value) => encodeURIComponent(value);

// ── Reporting Maker (PIA Maker or District Technical Staff) ──────────────────

/** Projects (and only the departments) the signed-in Maker reports on. */
export const fetchMprWorkload = () => request(
  () => axiosInstance.get('/project-mprs/workload'),
  'Unable to load your projects. Please try again.',
).then((list) => (Array.isArray(list) ? list : []));

/** Departments, financial years and months that can be chosen for a project. */
export const fetchMprContext = (projectId, departmentId) => request(
  () => axiosInstance.get(`/project-mprs/context?${query({ projectId, departmentId })}`),
  'Unable to load project information. Please try again.',
);

/** Activities, targets and previous progress for one period. */
export const fetchMprForm = ({ projectId, departmentId, financialYear, reportingMonth }) => request(
  () => axiosInstance.get(`/project-mprs/form?${query({ projectId, departmentId, financialYear, reportingMonth })}`),
  "Unable to load previous month's MPR. Please try again.",
);

export const previewMpr = (payload) => request(
  () => axiosInstance.post('/project-mprs/preview', payload),
  'Unable to validate the report. Please try again.',
);

/** Save a new report: `asDraft` keeps it with the Maker, otherwise it goes to the first reviewer. */
export const submitMpr = (payload) => request(
  () => axiosInstance.post('/project-mprs', payload),
  'Unable to save the report. Please check your connection and try again.',
);

/** Reports of the signed-in PIA user or District Technical Staff. */
export const fetchMyMprs = (params = {}) => request(
  () => axiosInstance.get(`/project-mprs/mine?${query(params)}`),
  'Unable to load your reports. Please try again.',
).then((list) => (Array.isArray(list) ? list : []));

// Editing a draft or a returned report
export const fetchMprEditForm = (mprId) => request(
  () => axiosInstance.get(`/project-mprs/${id(mprId)}/form`),
  'Unable to load the report. Please try again.',
);

export const previewMprEdit = (mprId, payload) => request(
  () => axiosInstance.post(`/project-mprs/${id(mprId)}/preview`, payload),
  'Unable to validate the report. Please try again.',
);

/** Save an edit; submitted to the first reviewer of the chain unless `asDraft`. */
export const saveMprEdit = (mprId, payload) => request(
  () => axiosInstance.patch(`/project-mprs/${id(mprId)}/resubmit`, payload),
  'Unable to save the report. Please check your connection and try again.',
);

export const discardMprDraft = (mprId) => request(
  () => axiosInstance.delete(`/project-mprs/${id(mprId)}`),
  'Unable to discard the draft. Please try again.',
);

// ── Shared reading ───────────────────────────────────────────────────────────

export const fetchMpr = (mprId) => request(
  () => axiosInstance.get(`/project-mprs/${id(mprId)}`),
  'Unable to load the report. Please try again.',
);

export const fetchProjectMprs = (projectId) => request(
  () => axiosInstance.get(`/project-mprs/project/${id(projectId)}`),
  'Unable to load progress reports. Please try again.',
).then((list) => (Array.isArray(list) ? list : []));

/** Reports waiting for the signed-in user's own review step, oldest first. Resolves to { items, total }. */
export const fetchMprQueue = async (params = {}) => {
  try {
    const { data: body } = await axiosInstance.get(`/project-mprs/queue?${query(params)}`);
    return { items: Array.isArray(body?.data) ? body.data : [], total: body?.pagination?.total ?? 0 };
  } catch (err) {
    const message = err?.response?.status >= 400 && err?.response?.status < 500 && err?.response?.data?.message;
    throw new Error(message || 'Unable to load the reports waiting for you. Please try again.');
  }
};

// ── Review chain (any tier) ──────────────────────────────────────────────────

/** Take the current review step (verify / approve) and send the report to the next level. */
export const forwardMpr = (mprId, note) => request(
  () => axiosInstance.patch(`/project-mprs/${id(mprId)}/forward`, { note }),
  'Unable to forward the report. Please try again.',
);

/** Back to the reporting Maker with remarks (required). */
export const returnMpr = (mprId, reason) => request(
  () => axiosInstance.patch(`/project-mprs/${id(mprId)}/return`, { reason }),
  'Unable to return the report. Please try again.',
);

/** An Approver rejects the report with a recorded reason. */
export const rejectMpr = (mprId, reason) => request(
  () => axiosInstance.patch(`/project-mprs/${id(mprId)}/reject`, { reason }),
  'Unable to reject the report. Please try again.',
);

// ── District ─────────────────────────────────────────────────────────────────

export const fetchDistrictMprs = (params = {}) => request(
  () => axiosInstance.get(`/project-mprs/district?${query(params)}`),
  'Unable to load district reports. Please try again.',
).then((list) => (Array.isArray(list) ? list : []));

// ── State (HQ, M&E administrator) ────────────────────────────────────────────

/** Every project MPR in the State. Resolves to { items, pagination, summary }. */
export const fetchStateMprs = async (params = {}) => {
  try {
    const { data: body } = await axiosInstance.get(`/project-mprs/all?${query(params)}`);
    return { items: Array.isArray(body?.data) ? body.data : [], pagination: body?.pagination || null, summary: body?.summary || null };
  } catch (err) {
    const message = err?.response?.status >= 400 && err?.response?.status < 500 && err?.response?.data?.message;
    throw new Error(message || 'Unable to load project progress reports. Please try again.');
  }
};

/** State-wide analytics over projects and progress reports, for the given filters. */
export const fetchProjectAnalytics = (filters = {}) => request(
  () => axiosInstance.get(`/project-mprs/analytics?${query(filters)}`),
  'Unable to load analytics. Please try again.',
);
