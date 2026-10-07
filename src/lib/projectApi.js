import axiosInstance from '@/lib/axiosInstance';

/**
 * API layer for project creation and its master data.
 *
 * Every call resolves with plain data or rejects with an `ApiFailure` whose
 * `message` is safe to show to the user — raw server / network errors never
 * reach the UI.
 */

export class ApiFailure extends Error {
  constructor(message, { status = 0, code = null, data = null } = {}) {
    super(message);
    this.name = 'ApiFailure';
    this.status = status;
    this.code = code;
    this.data = data;
  }
}

const toFailure = (err, fallback) => {
  const status = err?.response?.status || 0;
  const body = err?.response?.data;

  if (status === 401) return new ApiFailure('Your session has expired. Please sign in again.', { status });
  if (status === 403) return new ApiFailure(body?.message || 'You do not have permission to do this.', { status });
  // 4xx messages are written for people by the backend; anything else is not.
  if (status >= 400 && status < 500 && body?.message) {
    return new ApiFailure(body.message, { status, code: body.errorCode || body.data?.code || null, data: body.data || null });
  }
  return new ApiFailure(fallback, { status });
};

export const request = async (run, fallback) => {
  try {
    const { data: body } = await run();
    return body?.data;
  } catch (err) {
    throw toFailure(err, fallback);
  }
};

const query = (params) => new URLSearchParams(params).toString();

// ─── Master data lists (cached for the session; a page reload refetches) ─────

const cache = new Map();

const cachedList = (key, run, fallback) => {
  if (!cache.has(key)) {
    const promise = request(run, fallback).then((list) => (Array.isArray(list) ? list : []));
    cache.set(key, promise);
    // A failed load must not be cached, so Retry really retries.
    promise.catch(() => { if (cache.get(key) === promise) cache.delete(key); });
  }
  return cache.get(key);
};

/** Add a freshly created record to a cached list so no refetch is needed. */
const addToCache = (key, item) => {
  if (!cache.has(key)) return;
  const next = cache.get(key).then((list) => (
    list.some((entry) => entry.id === item.id)
      ? list
      : [...list, item].sort((a, b) => a.name.localeCompare(b.name, 'en', { sensitivity: 'base' }))
  ));
  cache.set(key, next);
};

export const fetchDistricts = () => cachedList(
  'districts',
  () => axiosInstance.get('/master/locations/districts'),
  'Unable to load districts. Please try again.',
);

export const fetchBlocks = (districtId) => cachedList(
  `blocks:${districtId}`,
  () => axiosInstance.get(`/master/locations/blocks?${query({ districtId })}`),
  'Unable to load blocks. Please try again.',
);

export const fetchGramPanchayats = (blockId) => cachedList(
  `gps:${blockId}`,
  () => axiosInstance.get(`/master/locations/gram-panchayats?${query({ blockId })}`),
  'Unable to load Gram Panchayats. Please try again.',
);

export const fetchVillages = (gramPanchayatId) => cachedList(
  `villages:${gramPanchayatId}`,
  () => axiosInstance.get(`/master/locations/villages?${query({ gramPanchayatId })}`),
  'Unable to load villages. Please try again.',
);

export const fetchDepartments = () => cachedList(
  'departments',
  () => axiosInstance.get('/master/departments'),
  'Unable to load departments. Please try again.',
);

export const fetchHeads = () => cachedList(
  'heads',
  () => axiosInstance.get('/master/heads'),
  'Unable to load Heads. Please try again.',
);

const activityCache = new Map();
export const fetchHeadActivities = (headId) => {
  if (!activityCache.has(headId)) {
    const promise = request(
      () => axiosInstance.get(`/master/heads/${encodeURIComponent(headId)}/activities`),
      'Unable to load activities. Please try again.',
    ).then((data) => (Array.isArray(data?.activities) ? data.activities : []));
    activityCache.set(headId, promise);
    promise.catch(() => { if (activityCache.get(headId) === promise) activityCache.delete(headId); });
  }
  return activityCache.get(headId);
};

// ─── Creating master records ─────────────────────────────────────────────────

const createAndCache = async (cacheKey, run, fallback) => {
  const created = await request(run, fallback);
  addToCache(cacheKey, created);
  return created;
};

export const createBlock = (districtId, name) => createAndCache(
  `blocks:${districtId}`,
  () => axiosInstance.post('/master/locations/blocks', { districtId, name }),
  'Unable to add the block. Please try again.',
);

export const createGramPanchayat = (blockId, name) => createAndCache(
  `gps:${blockId}`,
  () => axiosInstance.post('/master/locations/gram-panchayats', { blockId, name }),
  'Unable to add the Gram Panchayat. Please try again.',
);

export const createVillage = (gramPanchayatId, name) => createAndCache(
  `villages:${gramPanchayatId}`,
  () => axiosInstance.post('/master/locations/villages', { gramPanchayatId, name }),
  'Unable to add the village. Please try again.',
);

export const createDepartment = (name) => createAndCache(
  'departments',
  () => axiosInstance.post('/master/departments', { name }),
  'Unable to add the department. Please try again.',
);

// ─── Project ─────────────────────────────────────────────────────────────────

/** Idempotent per draft: asking again returns the same Project ID. */
export const generateProjectId = (draftKey, districtId) => request(
  () => axiosInstance.post('/sanctions/generate-id', { draftKey, districtId }),
  'Unable to generate the Project ID. Please try again.',
);

export const createProject = (payload) => request(
  () => axiosInstance.post('/sanctions', payload),
  'Unable to create the project. Please try again.',
);

// ─── Correcting a rejected project, revising a sanctioned one ────────────────

/** Full project as stored, to load into the wizard. */
export const fetchProjectForEdit = (projectId) => request(
  () => axiosInstance.get(`/sanctions/${encodeURIComponent(projectId)}`),
  'Unable to load the project. Please try again.',
);

export const resubmitProject = (projectId, payload) => request(
  () => axiosInstance.patch(`/sanctions/${encodeURIComponent(projectId)}/resubmit`, payload),
  'Unable to resubmit the project. Please try again.',
);

export const createRevision = (projectId, payload) => request(
  () => axiosInstance.post(`/sanctions/${encodeURIComponent(projectId)}/revisions`, payload),
  'Unable to send the revision. Please try again.',
);

export const fetchRevisions = (projectId) => request(
  () => axiosInstance.get(`/sanctions/${encodeURIComponent(projectId)}/revisions`),
  'Unable to load revisions. Please try again.',
).then((list) => (Array.isArray(list) ? list : []));

/** action: 'verify' | 'approve' | 'reject' */
export const reviewRevision = (revisionId, action, text) => request(
  () => axiosInstance.patch(`/sanctions/revisions/${encodeURIComponent(revisionId)}/${action}`, action === 'reject' ? { reason: text } : { note: text }),
  'This action could not be completed. Reload the page and try again.',
);
