export type RoleType =
  | 'superadmin'
  | 'parent'
  | 'child'
  | 'auntie'
  | 'uncle'
  | 'nan'
  | 'pop'
  | 'cousin'
  | 'pending';

export const ROLES: { value: RoleType; label: string }[] = [
  { value: 'superadmin', label: 'Super Admin' },
  { value: 'parent', label: 'Parent' },
  { value: 'child', label: 'Child' },
  { value: 'auntie', label: 'Auntie' },
  { value: 'uncle', label: 'Uncle' },
  { value: 'nan', label: 'Nan' },
  { value: 'pop', label: 'Pop' },
  { value: 'cousin', label: 'Cousin' },
  { value: 'pending', label: 'Pending Approval' },
];

export const ASSIGNABLE_ROLES = ROLES.filter((r) => r.value !== 'pending' && r.value !== 'superadmin');

// Permissions per role
// Each key is a feature, each role gets a permission level
export type PermissionLevel = 'full' | 'own' | 'view' | 'none';

export interface RolePermissions {
  calendar: PermissionLevel;
  tasks: PermissionLevel;
  shopping: PermissionLevel;
  meals: PermissionLevel;
  bulletin: PermissionLevel;
  chat: PermissionLevel;
  agents: PermissionLevel; // 'full' = create+use, 'own' = use only, 'view' = view only
  admin: PermissionLevel;  // user management
}

// full = create, edit, delete everything
// own = create own, edit own, view all
// view = read-only
// none = hidden

export const ROLE_PERMISSIONS: Record<string, RolePermissions> = {
  superadmin: {
    calendar: 'full',
    tasks: 'full',
    shopping: 'full',
    meals: 'full',
    bulletin: 'full',
    chat: 'full',
    agents: 'full',
    admin: 'full',
  },
  parent: {
    calendar: 'full',
    tasks: 'full',
    shopping: 'full',
    meals: 'full',
    bulletin: 'full',
    chat: 'full',
    agents: 'full',
    admin: 'none',
  },
  child: {
    calendar: 'own',
    tasks: 'own',
    shopping: 'own',
    meals: 'view',
    bulletin: 'own',
    chat: 'full',
    agents: 'own',
    admin: 'none',
  },
  auntie: {
    calendar: 'view',
    tasks: 'view',
    shopping: 'view',
    meals: 'view',
    bulletin: 'own',
    chat: 'full',
    agents: 'own',
    admin: 'none',
  },
  uncle: {
    calendar: 'view',
    tasks: 'view',
    shopping: 'view',
    meals: 'view',
    bulletin: 'own',
    chat: 'full',
    agents: 'own',
    admin: 'none',
  },
  nan: {
    calendar: 'view',
    tasks: 'view',
    shopping: 'view',
    meals: 'view',
    bulletin: 'own',
    chat: 'full',
    agents: 'own',
    admin: 'none',
  },
  pop: {
    calendar: 'view',
    tasks: 'view',
    shopping: 'view',
    meals: 'view',
    bulletin: 'own',
    chat: 'full',
    agents: 'own',
    admin: 'none',
  },
  cousin: {
    calendar: 'view',
    tasks: 'view',
    shopping: 'view',
    meals: 'view',
    bulletin: 'own',
    chat: 'full',
    agents: 'own',
    admin: 'none',
  },
  pending: {
    calendar: 'none',
    tasks: 'none',
    shopping: 'none',
    meals: 'none',
    bulletin: 'none',
    chat: 'none',
    agents: 'none',
    admin: 'none',
  },
};

export function getPermissions(role: string): RolePermissions {
  return ROLE_PERMISSIONS[role] || ROLE_PERMISSIONS.pending;
}

export function hasAccess(role: string, feature: keyof RolePermissions): boolean {
  const perms = getPermissions(role);
  return perms[feature] !== 'none';
}

export function canEdit(role: string, feature: keyof RolePermissions): boolean {
  const perms = getPermissions(role);
  return perms[feature] === 'full' || perms[feature] === 'own';
}

export function hasFullAccess(role: string, feature: keyof RolePermissions): boolean {
  const perms = getPermissions(role);
  return perms[feature] === 'full';
}
