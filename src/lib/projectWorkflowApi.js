import axiosInstance from '@/lib/axiosInstance';
import { request } from '@/lib/projectApi';

/**
 * State-level workflow actions on a project (Checker → Approver → District).
 * Each call rejects with an `ApiFailure` whose message is safe to show.
 */

const path = (projectId, action) => `/sanctions/${encodeURIComponent(projectId)}/${action}`;
const STALE = 'This action could not be completed. The project may have moved on — reload the page and try again.';

export const checkerVerify = (projectId, note) => request(
  () => axiosInstance.patch(path(projectId, 'checker-verify'), { note }),
  STALE,
);

/** Approve and sanction. The two order documents are optional. */
export const approveProject = (projectId, { note, secretariatApprovalOrder, stateSanctionOrder }) => {
  const form = new FormData();
  form.append('note', note || '');
  if (secretariatApprovalOrder) form.append('secretariatApprovalOrder', secretariatApprovalOrder);
  if (stateSanctionOrder) form.append('stateSanctionOrder', stateSanctionOrder);
  return request(
    () => axiosInstance.request(path(projectId, 'approve'), { method: 'PATCH', body: form }),
    STALE,
  );
};

export const rejectProject = (projectId, reason) => request(
  () => axiosInstance.patch(path(projectId, 'reject'), { reason }),
  STALE,
);

export const forwardToDistrict = (projectId) => request(
  () => axiosInstance.patch(path(projectId, 'forward-district'), {}),
  STALE,
);

// ── District ─────────────────────────────────────────────────────────────────

/** Accept a project forwarded by the State. The fund allocation order PDF is optional. */
export const districtAccept = (projectId, fundAllocationOrder) => {
  const form = new FormData();
  if (fundAllocationOrder) form.append('fundAllocationOrder', fundAllocationOrder);
  return request(
    () => axiosInstance.request(path(projectId, 'district-accept'), { method: 'PATCH', body: form }),
    STALE,
  );
};

/** For each department of the project: the PIA officers of that department in this district. */
export const fetchPiaCandidates = (projectId) => request(
  () => axiosInstance.get(path(projectId, 'pia-candidates')),
  'Unable to load PIA officers. Please try again.',
).then((list) => (Array.isArray(list) ? list : []));

/** assignments: [{ departmentId, piaUserId }] */
export const assignPiaOfficers = (projectId, assignments) => request(
  () => axiosInstance.patch(path(projectId, 'forward-pia'), { assignments }),
  STALE,
);

// ── PIA officer ──────────────────────────────────────────────────────────────

export const piaAccept = (projectId) => request(
  () => axiosInstance.patch(path(projectId, 'pia-accept'), {}),
  STALE,
);

/** Hand one department over to another PIA officer (works after acceptance). */
export const transferPia = (projectId, payload) => request(
  () => axiosInstance.patch(path(projectId, 'transfer-pia'), payload),
  STALE,
);

/** PIA officers of the district, what each holds, and who could take over. */
export const fetchPiaWorkload = () => request(
  () => axiosInstance.get('/sanctions/pia-workload'),
  'Unable to load PIA officers. Please try again.',
).then((list) => (Array.isArray(list) ? list : []));

export const handoverPiaCharge = (payload) => request(
  () => axiosInstance.post('/sanctions/pia-handover', payload),
  'The charge could not be handed over. Please try again.',
);
