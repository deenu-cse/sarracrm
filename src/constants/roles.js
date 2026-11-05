export const USER_ROLES = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  DD_LEVEL: 'DD_LEVEL',
  PIA_OFFICER: 'PIA_OFFICER',
  MND_SUPER_ADMIN: 'MND_SUPER_ADMIN',
  MND_OFFICER: 'MND_OFFICER',
};

/** The tier each account role belongs to. */
export const ROLE_LABELS = {
  [USER_ROLES.SUPER_ADMIN]: 'SARRA HQ',
  [USER_ROLES.DD_LEVEL]: 'District SARRA Centre',
  [USER_ROLES.PIA_OFFICER]: 'PIA',
  [USER_ROLES.MND_SUPER_ADMIN]: 'M&E Administrator',
  [USER_ROLES.MND_OFFICER]: 'M&E Officer',
};

export const WORKFLOW_ROLES = { MAKER: 'MAKER', CHECKER: 'CHECKER', APPROVER: 'APPROVER' };
export const WORKFLOW_LABELS = { MAKER: 'Maker', CHECKER: 'Checker', APPROVER: 'Approver' };

const TIER_SHORT = { [USER_ROLES.SUPER_ADMIN]: 'HQ', [USER_ROLES.DD_LEVEL]: 'District', [USER_ROLES.PIA_OFFICER]: 'PIA' };

/**
 * Workflow role of a user. District and PIA accounts created before every tier
 * had its own Maker, Checker and Approver act as that tier's Maker.
 */
export const workflowRoleOf = (user) => {
  if (!user) return null;
  if (user.workflowRole) return user.workflowRole;
  return [USER_ROLES.DD_LEVEL, USER_ROLES.PIA_OFFICER].includes(user.role) ? WORKFLOW_ROLES.MAKER : null;
};

export const isSystemAdmin = (user) => user?.role === USER_ROLES.SUPER_ADMIN && !user?.workflowRole;

/** "District Checker", "HQ Maker", "HQ Administrator", "M&E Officer" … */
export const roleLabelOf = (user) => {
  if (!user?.role) return '';
  if (isSystemAdmin(user)) return 'HQ Administrator';
  const tier = TIER_SHORT[user.role];
  const role = WORKFLOW_LABELS[workflowRoleOf(user)];
  return tier && role ? `${tier} ${role}` : ROLE_LABELS[user.role] || user.role;
};
