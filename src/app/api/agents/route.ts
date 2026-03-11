import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionWithPermissions, checkAccess, forbiddenResponse, unauthorizedResponse } from '@/lib/permissions';
import { sanitizeString } from '@/lib/sanitize';
import { parsePagination, paginatedResponse } from '@/lib/pagination';

export async function GET(req: NextRequest) {
  const auth = await getSessionWithPermissions();
  if (!auth) return unauthorizedResponse();
  if (!checkAccess(auth.perms, 'agents', 'read')) return forbiddenResponse();

  try {
    const usePagination = new URL(req.url).searchParams.has('page');
    if (usePagination) {
      const p = parsePagination(req);
      const [agents, total] = await Promise.all([
        prisma.agent.findMany({ orderBy: [{ isSystem: 'desc' }, { createdAt: 'asc' }], skip: p.skip, take: p.limit }),
        prisma.agent.count(),
      ]);
      return NextResponse.json(paginatedResponse(agents, total, p));
    }
    const agents = await prisma.agent.findMany({ orderBy: [{ isSystem: 'desc' }, { createdAt: 'asc' }] });
    return NextResponse.json(agents);
  } catch (error) {
    console.error('Agents GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch agents' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await getSessionWithPermissions();
  if (!auth) return unauthorizedResponse();
  if (!checkAccess(auth.perms, 'agents', 'create')) return forbiddenResponse();

  try {
    const body = await req.json();
    const name = sanitizeString(body.name, 100);
    const systemPrompt = sanitizeString(body.systemPrompt, 5000);
    if (!name || !systemPrompt) {
      return NextResponse.json({ error: 'Name and system prompt are required' }, { status: 400 });
    }
    const agent = await prisma.agent.create({
      data: {
        name,
        description: sanitizeString(body.description, 500),
        systemPrompt,
        icon: sanitizeString(body.icon, 50) || 'Bot',
        createdBy: auth.user.id,
        isSystem: false,
      },
    });
    return NextResponse.json(agent);
  } catch (error) {
    console.error('Agents POST error:', error);
    return NextResponse.json({ error: 'Failed to create agent' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const auth = await getSessionWithPermissions();
  if (!auth) return unauthorizedResponse();
  if (!checkAccess(auth.perms, 'agents', 'edit')) return forbiddenResponse();

  try {
    const body = await req.json();
    const { id, ...rawData } = body;
    if (!id) return NextResponse.json({ error: 'Agent ID required' }, { status: 400 });

    const existing = await prisma.agent.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
    if (existing.isSystem && auth.user.role !== 'superadmin') return forbiddenResponse();
    if (auth.perms.agents === 'own' && existing.createdBy !== auth.user.id) return forbiddenResponse();

    // Only allow safe fields to be updated - prevent isSystem/createdBy tampering
    const safeData: Record<string, unknown> = {};
    if (rawData.name !== undefined) safeData.name = sanitizeString(rawData.name, 100);
    if (rawData.description !== undefined) safeData.description = sanitizeString(rawData.description, 500);
    if (rawData.systemPrompt !== undefined) safeData.systemPrompt = sanitizeString(rawData.systemPrompt, 5000);
    if (rawData.icon !== undefined) safeData.icon = sanitizeString(rawData.icon, 50);

    const agent = await prisma.agent.update({ where: { id }, data: safeData });
    return NextResponse.json(agent);
  } catch (error) {
    console.error('Agents PATCH error:', error);
    return NextResponse.json({ error: 'Failed to update agent' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const auth = await getSessionWithPermissions();
  if (!auth) return unauthorizedResponse();
  if (!checkAccess(auth.perms, 'agents', 'delete')) return forbiddenResponse();

  try {
    const { id } = await req.json();
    if (!id) return NextResponse.json({ error: 'Agent ID required' }, { status: 400 });

    const existing = await prisma.agent.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
    if (existing.isSystem) return NextResponse.json({ error: 'Cannot delete system agents' }, { status: 400 });
    if (auth.perms.agents === 'own' && existing.createdBy !== auth.user.id) return forbiddenResponse();

    await prisma.agent.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Agents DELETE error:', error);
    return NextResponse.json({ error: 'Failed to delete agent' }, { status: 500 });
  }
}
