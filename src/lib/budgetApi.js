import axiosInstance from '@/lib/axiosInstance';
import { request } from '@/lib/projectApi';

/**
 * API layer for budget allocation against an existing project.
 * The backend is the only authority on budget figures: every call returns
 * what the server calculated, and nothing here is cached.
 */

const path = (projectId, suffix = '') => `/sanctions/${encodeURIComponent(projectId)}${suffix}`;

/** Approved projects whose budget is not yet fully allocated. */
export const fetchEligibleProjects = () => request(
  () => axiosInstance.get('/sanctions/budget-allocation/eligible'),
  'Unable to load projects. Please try again.',
).then((list) => (Array.isArray(list) ? list : []));

/** Current budget position of one project, recalculated by the server. */
export const fetchBudgetState = (projectId) => request(
  () => axiosInstance.get(path(projectId, '/budget-allocation')),
  'Unable to load project. Please try again.',
);

export const uploadAllocationDocument = (projectId, file) => {
  const form = new FormData();
  form.append('document', file);
  return request(
    () => axiosInstance.post(path(projectId, '/budget-allocations/upload'), form),
    'The PDF could not be uploaded. Please try again.',
  );
};

/** Best effort: an upload that is never used does no harm if this fails. */
export const discardAllocationDocument = (projectId, documentId) => request(
  () => axiosInstance.delete(path(projectId, `/budget-allocations/documents/${encodeURIComponent(documentId)}`)),
  'Unable to remove the document.',
).catch(() => null);

/** Full server-side validation; returns the exact figures Proceed would save. Saves nothing. */
export const previewAllocation = (projectId, payload) => request(
  () => axiosInstance.post(path(projectId, '/budget-allocations/preview'), payload),
  'Unable to validate the allocation. Please try again.',
);

/** Commit. Safe to retry with the same `idempotencyKey`: it can only be saved once. */
export const commitAllocation = (projectId, payload) => request(
  () => axiosInstance.post(path(projectId, '/budget-allocations'), payload),
  'Unable to save the allocation. Please check your connection and try again.',
);

/** Take back the latest installment of a department (entered wrongly). Needs a reason. */
export const reverseInstallment = (projectId, payload) => request(
  () => axiosInstance.post(path(projectId, '/budget-allocations/reverse'), payload),
  'Unable to reverse the release. Please try again.',
);
