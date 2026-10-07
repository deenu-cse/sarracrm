import { sumMoney, toNumber } from '@/lib/numeric';

/**
 * State, validation and payload building for the Create Project wizard.
 * Kept free of React so the rules live in one place and stay testable.
 */

export const STEPS = [
  { key: 'location', label: 'Location' },
  { key: 'details', label: 'Project Details' },
  { key: 'departments', label: 'Departments' },
  { key: 'allocation', label: 'Head & Allocation' },
  { key: 'activities', label: 'Activities' },
  { key: 'review', label: 'Review' },
];

export const MAX_PIA = 10;
export const FIRST_REVISION_STEP = 3; // Head & Allocation
export const PIA_OPTIONS = Array.from({ length: MAX_PIA }, (_, index) => index + 1);
export const MONEY_DECIMALS = 5; // amounts are held in ₹ lakh; 5 decimals = ₹1
const EPSILON = 0.000005;

const newKey = () => (
  typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}-${Math.random().toString(36).slice(2, 12)}`
);

const emptyDepartment = () => ({
  key: newKey(),
  department: null, // { id, name }
  deptShare: '',
  sarraShare: '',
  activities: {}, // { [activityCode]: { physical: '', financial: '' } }
});

export const createInitialState = () => ({
  draftKey: newKey(),
  // 'create' a new project, 'resubmit' a rejected one, or 'revise' a sanctioned one
  mode: 'create',
  source: null, // { id, code, totalLakh } of the project being corrected / revised
  revisionReason: '',
  step: 0,
  furthestStep: 0,
  location: { district: null, block: null, gramPanchayat: null, village: null },
  details: { projectName: '', dlec: '', slec: '', hpc: '' },
  piaCount: null,
  departments: [],
  head: null, // { id, code, name }
  activeDepartment: 0,
  projectId: null, // { projectId, generatedAt }
  savedAt: null,
});

// ─── Reducer ─────────────────────────────────────────────────────────────────

export function wizardReducer(state, action) {
  switch (action.type) {
    case 'RESTORE':
      return { ...createInitialState(), ...action.state };

    case 'RESET':
      return createInitialState();

    case 'GO_TO_STEP':
      return { ...state, step: action.step, furthestStep: Math.max(state.furthestStep, action.step) };

    case 'SET_LOCATION': {
      // Changing a parent always clears everything beneath it.
      const order = ['district', 'block', 'gramPanchayat', 'village'];
      const index = order.indexOf(action.level);
      const location = { ...state.location, [action.level]: action.value };
      const unchanged = (state.location[action.level]?.id || null) === (action.value?.id || null);
      if (!unchanged) order.slice(index + 1).forEach((level) => { location[level] = null; });
      return { ...state, location };
    }

    case 'SET_DETAIL':
      return { ...state, details: { ...state.details, [action.field]: action.value } };

    case 'SET_PIA_COUNT': {
      const count = action.count;
      if (!count) return { ...state, piaCount: null };
      const departments = state.departments.slice(0, count);
      while (departments.length < count) departments.push(emptyDepartment());
      return {
        ...state,
        piaCount: count,
        departments,
        activeDepartment: Math.min(state.activeDepartment, count - 1),
      };
    }

    case 'SET_DEPARTMENT':
      return {
        ...state,
        departments: state.departments.map((row, index) => (
          index === action.index ? { ...row, department: action.value } : row
        )),
      };

    case 'SET_SHARE':
      return {
        ...state,
        departments: state.departments.map((row, index) => (
          index === action.index ? { ...row, [action.field]: action.value } : row
        )),
      };

    case 'ADD_DEPARTMENT': {
      if (state.departments.length >= MAX_PIA) return state;
      const departments = [...state.departments, {
        ...emptyDepartment(),
        department: action.department,
        deptShare: action.deptShare,
        sarraShare: action.sarraShare,
      }];
      return { ...state, departments, piaCount: departments.length };
    }

    case 'SET_HEAD': {
      if ((state.head?.id || null) === (action.value?.id || null)) return state;
      // Activities belong to the Head, so entries for the old Head no longer apply.
      return {
        ...state,
        head: action.value,
        departments: state.departments.map((row) => ({ ...row, activities: {} })),
        activeDepartment: 0,
      };
    }

    case 'SET_ACTIVITY':
      return {
        ...state,
        departments: state.departments.map((row, index) => {
          if (index !== action.index) return row;
          const current = row.activities[action.code] || { physical: '', financial: '' };
          return { ...row, activities: { ...row.activities, [action.code]: { ...current, [action.field]: action.value } } };
        }),
      };

    case 'SET_ACTIVE_DEPARTMENT':
      return { ...state, activeDepartment: action.index };

    case 'SET_REVISION_REASON':
      return { ...state, revisionReason: action.value };

    case 'SET_PROJECT_ID':
      return { ...state, projectId: action.value };

    default:
      return state;
  }
}

// ─── Derived values ──────────────────────────────────────────────────────────

export const departmentTotal = (row) => sumMoney([row.deptShare, row.sarraShare], MONEY_DECIMALS);

export const activityFinancialTotal = (row) => sumMoney(
  Object.values(row.activities || {}).map((entry) => entry.financial),
  MONEY_DECIMALS,
);

export const countEnteredActivities = (row) => Object.values(row.activities || {})
  .filter((entry) => toNumber(entry.physical) > 0 || toNumber(entry.financial) > 0).length;

export const projectTotals = (state) => ({
  deptShare: sumMoney(state.departments.map((row) => row.deptShare), MONEY_DECIMALS),
  sarraShare: sumMoney(state.departments.map((row) => row.sarraShare), MONEY_DECIMALS),
  total: sumMoney(state.departments.flatMap((row) => [row.deptShare, row.sarraShare]), MONEY_DECIMALS),
  activityFinancial: sumMoney(state.departments.map(activityFinancialTotal), MONEY_DECIMALS),
  activityCount: state.departments.reduce((sum, row) => sum + countEnteredActivities(row), 0),
});

/** True once the user has entered anything worth protecting. */
export const hasEnteredData = (state) => Boolean(
  state.location.district
  || state.details.projectName.trim()
  || state.details.dlec || state.details.slec || state.details.hpc
  || state.piaCount
  || state.head
  || state.projectId,
);

// ─── Validation ──────────────────────────────────────────────────────────────

const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;

export const todayIso = () => {
  const now = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
};

/** Strict calendar check: "2026-02-31" is not a date. */
export const isRealDate = (value) => {
  const match = ISO_DATE.exec(value || '');
  if (!match) return false;
  const [year, month, day] = [Number(match[1]), Number(match[2]), Number(match[3])];
  const date = new Date(year, month - 1, day);
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
};

export function validateLocation(state) {
  const errors = {};
  const { district, block, gramPanchayat, village } = state.location;
  if (!district) errors.district = 'Please select a district.';
  if (!block) errors.block = 'Please select a block.';
  if (!gramPanchayat) errors.gramPanchayat = 'Please select a Gram Panchayat.';
  if (!village) errors.village = 'Please select a village.';
  return errors;
}

export function validateDetails(state) {
  const errors = {};
  const { projectName, dlec, slec, hpc } = state.details;
  const name = projectName.replace(/\s+/g, ' ').trim();
  if (!name) errors.projectName = 'Project name is required.';
  else if (name.length < 3) errors.projectName = 'Project name must be at least 3 characters.';
  else if (name.length > 200) errors.projectName = 'Project name cannot be longer than 200 characters.';

  const today = todayIso();
  const labels = { dlec: 'DLEC', slec: 'SLEC', hpc: 'HPC' };
  Object.entries({ dlec, slec, hpc }).forEach(([field, value]) => {
    if (!value) return;
    if (!isRealDate(value)) errors[field] = `Enter a valid ${labels[field]} approval date.`;
    else if (value < '2000-01-01') errors[field] = `${labels[field]} approval date is too far in the past.`;
    else if (value > today) errors[field] = `${labels[field]} approval date cannot be in the future.`;
  });

  if (!dlec && !slec && !hpc) errors.dates = 'Enter at least one approval date (DLEC, SLEC or HPC).';

  // Committee order: DLEC ≤ SLEC ≤ HPC
  if (!errors.slec && dlec && slec && !errors.dlec && slec < dlec) {
    errors.slec = 'SLEC approval date cannot be earlier than the DLEC approval date.';
  }
  if (!errors.hpc && hpc) {
    if (slec && !errors.slec && hpc < slec) errors.hpc = 'HPC approval date cannot be earlier than the SLEC approval date.';
    else if (dlec && !errors.dlec && hpc < dlec) errors.hpc = 'HPC approval date cannot be earlier than the DLEC approval date.';
  }
  return errors;
}

export function validateDepartments(state) {
  const errors = { rows: {} };
  if (!state.piaCount) errors.piaCount = 'Please select the number of PIA.';
  const seen = new Map();
  state.departments.forEach((row, index) => {
    if (!row.department) { errors.rows[index] = 'Please select a department.'; return; }
    if (seen.has(row.department.id)) {
      errors.rows[index] = `${row.department.name} is already selected as Department ${seen.get(row.department.id) + 1}.`;
    } else {
      seen.set(row.department.id, index);
    }
  });
  if (!Object.keys(errors.rows).length) delete errors.rows;
  return errors;
}

export function validateAllocation(state) {
  const errors = { rows: {} };
  state.departments.forEach((row, index) => {
    if (departmentTotal(row) <= 0) errors.rows[index] = 'Enter a Department share or a SARRA share.';
  });
  if (!Object.keys(errors.rows).length) delete errors.rows;
  if (!state.head) errors.head = 'Please select a Head.';
  return errors;
}

/**
 * Activity rules for one department.
 * `error` blocks progress; `warning` is advisory only.
 */
export function validateDepartmentActivities(row) {
  const allocated = departmentTotal(row);
  const planned = activityFinancialTotal(row);
  const entered = countEnteredActivities(row);
  const result = { allocated, planned, entered, remaining: Math.round((allocated - planned) * 1e5) / 1e5, error: '', warning: '' };

  if (entered === 0) {
    result.error = 'Enter a physical or financial target for at least one activity.';
  } else if (planned > allocated + EPSILON) {
    result.error = 'Activity financial targets exceed the amount allocated to this department.';
  } else if (planned < allocated - EPSILON) {
    result.warning = 'Part of the allocated amount is not yet assigned to an activity.';
  }
  return result;
}

export function validateActivities(state) {
  const errors = {};
  // Nothing can be planned before departments and a Head exist.
  if (!state.departments.length || !state.head) errors.setup = 'Select departments and a Head first.';
  state.departments.forEach((row, index) => {
    const { error } = validateDepartmentActivities(row);
    if (error) errors[index] = error;
  });
  return errors;
}

const isEmpty = (errors) => Object.keys(errors).length === 0;

/** Validity of the five data-entry steps, in order. */
export const stepValidity = (state) => [
  isEmpty(validateLocation(state)),
  isEmpty(validateDetails(state)),
  isEmpty(validateDepartments(state)),
  isEmpty(validateAllocation(state)),
  isEmpty(validateActivities(state)),
];

/** A step can be opened only when every step before it is valid. */
export const canOpenStep = (state, target) => {
  // A revision only touches shares and targets: location, details and departments stay as sanctioned.
  if (state.mode === 'revise' && target < FIRST_REVISION_STEP) return false;
  return stepValidity(state).slice(0, target).every(Boolean);
};

// ─── Payload ─────────────────────────────────────────────────────────────────

export function buildProjectPayload(state) {
  return {
    draftKey: state.draftKey,
    projectId: state.projectId?.projectId,
    projectName: state.details.projectName.replace(/\s+/g, ' ').trim(),
    location: {
      districtId: state.location.district?.id,
      blockId: state.location.block?.id,
      gramPanchayatId: state.location.gramPanchayat?.id,
      villageId: state.location.village?.id,
    },
    approvalDates: { dlec: state.details.dlec, slec: state.details.slec, hpc: state.details.hpc },
    numberOfPIA: state.piaCount,
    headId: state.head?.id,
    departments: state.departments.map((row) => ({
      departmentId: row.department?.id,
      deptShareLakh: toNumber(row.deptShare),
      sarraShareLakh: toNumber(row.sarraShare),
      activities: Object.entries(row.activities || {})
        .filter(([, entry]) => toNumber(entry.physical) > 0 || toNumber(entry.financial) > 0)
        .map(([activityCode, entry]) => ({
          activityCode,
          physicalTarget: toNumber(entry.physical),
          financialTargetLakh: toNumber(entry.financial),
        })),
    })),
  };
}

const isoDay = (value) => (value ? String(value).slice(0, 10) : '');
const numberText = (value) => (value === null || value === undefined || Number(value) === 0 ? '' : String(value));

/** Load a stored project into the wizard, to correct a rejected project or revise a sanctioned one. */
export function stateFromProject(project, mode) {
  const { location = {}, approvalDates = {}, head } = project;
  const pick = (id, name) => (id && name ? { id: String(id), name } : null);
  return {
    ...createInitialState(),
    mode,
    source: { id: String(project._id), code: project.projectId || project.sanctionId || '', totalLakh: project.totalSanctionedBudgetLakh || 0 },
    step: mode === 'revise' ? FIRST_REVISION_STEP : 0,
    furthestStep: STEPS.length - 1,
    location: {
      district: pick(location.districtId, location.district),
      block: pick(location.blockId, location.block),
      gramPanchayat: pick(location.gramPanchayatId, location.gramPanchayat),
      village: pick(location.villageId, location.village),
    },
    details: { projectName: project.projectTitle || '', dlec: isoDay(approvalDates.dlec), slec: isoDay(approvalDates.slec), hpc: isoDay(approvalDates.hpc) },
    piaCount: (project.departmentAllocations || []).length || null,
    departments: (project.departmentAllocations || []).map((allocation) => ({
      key: newKey(),
      department: { id: String(allocation.departmentId), name: allocation.departmentName },
      deptShare: numberText(allocation.deptShareLakh),
      sarraShare: numberText(allocation.sarraShareLakh),
      activities: Object.fromEntries((allocation.activities || []).map((activity) => [
        activity.activityCode,
        { physical: numberText(activity.physicalTarget), financial: numberText(activity.financialTargetLakh) },
      ])),
    })),
    head: head?.headId ? { id: String(head.headId), code: head.code, name: head.name } : null,
    // The Project ID is permanent: it is shown, never regenerated.
    projectId: project.projectId ? { projectId: project.projectId, generatedAt: null } : null,
  };
}

/** Request body for a revised estimate: only shares and targets. */
export function buildRevisionPayload(state) {
  return {
    reason: (state.revisionReason || '').replace(/\s+/g, ' ').trim(),
    departments: buildProjectPayload(state).departments,
  };
}

// ─── Draft persistence (browser) ─────────────────────────────────────────────
// The wizard state is a plain serialisable object, so the same shape can later
// be posted to a server-side draft endpoint without changing the wizard.

const draftStorageKey = (userId) => `sarra:project-draft:v1:${userId || 'anonymous'}`;

export function loadDraft(userId) {
  try {
    const raw = window.localStorage.getItem(draftStorageKey(userId));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || !parsed.draftKey || !Array.isArray(parsed.departments)) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function saveDraft(userId, state) {
  try {
    window.localStorage.setItem(draftStorageKey(userId), JSON.stringify({ ...state, savedAt: new Date().toISOString() }));
  } catch {
    // Storage full / unavailable: the wizard still works, only the draft is lost.
  }
}

export function clearDraft(userId) {
  try { window.localStorage.removeItem(draftStorageKey(userId)); } catch { /* ignore */ }
}
