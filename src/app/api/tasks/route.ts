import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionWithPermissions, checkAccess, forbiddenResponse, unauthorizedResponse } from '@/lib/permissions';
import { sanitizeString, pickFields } from '@/lib/sanitize';
import { parsePagination, paginatedResponse } from '@/lib/pagination';

export async function GET(req: NextRequest) {
  const auth = await getSessionWithPermissions();
  if (!auth) return unauthorizedResponse();
  if (!checkAccess(auth.perms, 'tasks', 'read')) return forbiddenResponse();

  try {
    const usePagination = new URL(req.url).searchParams.has('page');
    if (usePagination) {
      const p = parsePagination(req);
      const [tasks, total] = await Promise.all([
        prisma.task.findMany({ orderBy: { createdAt: 'desc' }, skip: p.skip, take: p.limit }),
        prisma.task.count(),
      ]);
      return NextResponse.json(paginatedResponse(tasks, total, p));
    }
    const tasks = await prisma.task.findMany({ orderBy: { createdAt: 'desc' } });
    return NextResponse.json(tasks);
  } catch (error) {
    console.error('Tasks GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch tasks' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await getSessionWithPermissions();
  if (!auth) return unauthorizedResponse();
  if (!checkAccess(auth.perms, 'tasks', 'create')) return forbiddenResponse();

  try {
    const body = await req.json();
    const title = sanitizeString(body.title, 200);
    if (!title || !body.assignedTo) {
      return NextResponse.json({ error: 'Title and assignee are required' }, { status: 400 });
    }
    const task = await prisma.task.create({
      data: {
        title,
        assignedTo: sanitizeString(body.assignedTo, 100),
        dueDate: sanitizeString(body.dueDate, 20),
        completed: false,
        category: sanitizeString(body.category, 50) || 'chore',
        recurring: sanitizeString(body.recurring, 20),
        createdBy: auth.user.id,
      },
    });
    return NextResponse.json(task);
  } catch (error) {
    console.error('Tasks POST error:', error);
    return NextResponse.json({ error: 'Failed to create task' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const auth = await getSessionWithPermissions();
  if (!auth) return unauthorizedResponse();
  if (!checkAccess(auth.perms, 'tasks', 'edit')) return forbiddenResponse();

  try {
    const body = await req.json();
    const { id } = body;
    if (!id) return NextResponse.json({ error: 'Task ID required' }, { status: 400 });

    const existing = await prisma.task.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: 'Task not found' }, { status: 404 });

    if (auth.perms.tasks === 'own' && existing.createdBy !== auth.user.id && existing.assignedTo !== auth.user.id) {
      return forbiddenResponse();
    }

    const safeData = pickFields(body, ['title', 'assignedTo', 'dueDate', 'completed', 'category', 'recurring']);
    const task = await prisma.task.update({ where: { id }, data: safeData });
    return NextResponse.json(task);
  } catch (error) {
    console.error('Tasks PATCH error:', error);
    return NextResponse.json({ error: 'Failed to update task' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const auth = await getSessionWithPermissions();
  if (!auth) return unauthorizedResponse();
  if (!checkAccess(auth.perms, 'tasks', 'delete')) return forbiddenResponse();

  try {
    const { id } = await req.json();
    if (!id) return NextResponse.json({ error: 'Task ID required' }, { status: 400 });

    const existing = await prisma.task.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: 'Task not found' }, { status: 404 });

    if (auth.perms.tasks === 'own' && existing.createdBy !== auth.user.id && existing.assignedTo !== auth.user.id) {
      return forbiddenResponse();
    }

    await prisma.task.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Tasks DELETE error:', error);
    return NextResponse.json({ error: 'Failed to delete task' }, { status: 500 });
  }
}
