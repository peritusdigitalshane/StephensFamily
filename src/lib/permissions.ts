import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getPermissions, type RolePermissions } from '@/lib/roles';
import { NextResponse } from 'next/server';

export async function getSessionWithPermissions() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return null;
  const perms = getPermissions(session.user.role);
  return { session, perms, user: session.user };
}

export function checkAccess(
  perms: RolePermissions,
  feature: keyof RolePermissions,
  action: 'read' | 'create' | 'edit' | 'delete' = 'read'
) {
  const level = perms[feature];
  if (level === 'none') return false;
  if (level === 'full') return true;
  if (level === 'view') return action === 'read';
  // 'own' - can read all, create/edit/delete own
  if (action === 'read') return true;
  return true; // for own, caller must additionally check ownership
}

export function forbiddenResponse() {
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
}

export function unauthorizedResponse() {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}
