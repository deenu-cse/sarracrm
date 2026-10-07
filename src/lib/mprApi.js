import axiosInstance from '@/lib/axiosInstance';
import { request } from '@/lib/projectApi';

/**
 * API layer for project Monthly Progress Reports.
 * Targets, previous progress and totals always come from the backend; the
 * client only sends this month's figures.
 */

const query = (params) => new URLSearchParams(Object.entries(params).filter(([, value]) => value !== undefined && value !== null && value !== '')).toString();

// ── PIA officer ──────────────────────────────────────────────────────────────

/** Projects (and only the departments) the signed-in PIA officer can report on. */
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

export const submitMpr = (payload) => request(
  () => axiosInstance.post('/project-mprs', payload),
  'Unable to submit the report. Please check your connection and try again.',
);

export const fetchMyMprs = (params = {}) => request(
  () => axiosInstance.get(`/project-mprs/mine?${query(params)}`),
  'Unable to load your reports. Please try again.',
).then((list) => (Array.isArray(list) ? list : []));

// Correction of a returned report
export const fetchMprCorrectionForm = (mprId) => request(
  () => axiosInstance.get(`/project-mprs/${encodeURIComponent(mprId)}/form`),
  'Unable to load the report for correction. Please try again.',
);

export const previewMprCorrection = (mprId, payload) => request(
  () => axiosInstance.post(`/project-mprs/${encodeURIComponent(mprId)}/preview`, payload),
  'Unable to validate the report. Please try again.',
);

export const resubmitMpr = (mprId, payload) => request(
  () => axiosInstance.patch(`/project-mprs/${encodeURIComponent(mprId)}/resubmit`, payload),
  'Unable to resubmit the report. Please check your connection and try again.',
);

// ── Shared reading ───────────────────────────────────────────────────────────

export const fetchMpr = (mprId) => request(
  () => axiosInstance.get(`/project-mprs/${encodeURIComponent(mprId)}`),
  'Unable to load the report. Please try again.',
);

export const fetchProjectMprs = (projectId) => request(
  () => axiosInstance.get(`/project-mprs/project/${encodeURIComponent(projectId)}`),
  'Unable to load progress reports. Please try again.',
).then((list) => (Array.isArray(list) ? list : []));

// ── District ─────────────────────────────────────────────────────────────────

export const fetchDistrictMprs = (params = {}) => request(
  () => axiosInstance.get(`/project-mprs/district?${query(params)}`),
  'Unable to load district reports. Please try again.',
).then((list) => (Array.isArray(list) ? list : []));

export const approveMpr = (mprId, note) => request(
  () => axiosInstance.patch(`/project-mprs/${encodeURIComponent(mprId)}/district-approve`, { note }),
  'Unable to approve the report. Please try again.',
);

export const returnMpr = (mprId, reason) => request(
  () => axiosInstance.patch(`/project-mprs/${encodeURIComponent(mprId)}/return`, { reason }),
  'Unable to return the report. Please try again.',
);

// ── State (State admin, M&E admin) ───────────────────────────────────────────

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

export const verifyMpr = (mprId, note) => request(
  () => axiosInstance.patch(`/project-mprs/${encodeURIComponent(mprId)}/state-verify`, { note }),
  'Unable to verify the report. Please try again.',
);

/** State-wide analytics over projects, budget releases and progress reports, for the given filters. */
export const fetchProjectAnalytics = (filters = {}) => request(
  () => axiosInstance.get(`/project-mprs/analytics?${query(filters)}`),
  'Unable to load analytics. Please try again.',
);

/** State (M&E admin) sends a district-approved report back for correction. */
export const stateReturnMpr = (mprId, reason) => request(
  () => axiosInstance.patch(`/project-mprs/${encodeURIComponent(mprId)}/state-return`, { reason }),
  'Unable to return the report. Please try again.',
);
