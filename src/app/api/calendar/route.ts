import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionWithPermissions, checkAccess, forbiddenResponse, unauthorizedResponse } from '@/lib/permissions';
import { sanitizeString, pickFields } from '@/lib/sanitize';
import { parsePagination, paginatedResponse } from '@/lib/pagination';

export async function GET(req: NextRequest) {
  const auth = await getSessionWithPermissions();
  if (!auth) return unauthorizedResponse();
  if (!checkAccess(auth.perms, 'calendar', 'read')) return forbiddenResponse();

  try {
    const usePagination = new URL(req.url).searchParams.has('page');
    if (usePagination) {
      const p = parsePagination(req);
      const [events, total] = await Promise.all([
        prisma.calendarEvent.findMany({ orderBy: { date: 'asc' }, skip: p.skip, take: p.limit }),
        prisma.calendarEvent.count(),
      ]);
      return NextResponse.json(paginatedResponse(events, total, p));
    }
    const events = await prisma.calendarEvent.findMany({ orderBy: { date: 'asc' } });
    return NextResponse.json(events);
  } catch (error) {
    console.error('Calendar GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch events' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await getSessionWithPermissions();
  if (!auth) return unauthorizedResponse();
  if (!checkAccess(auth.perms, 'calendar', 'create')) return forbiddenResponse();

  try {
    const body = await req.json();
    const title = sanitizeString(body.title, 200);
    if (!title || !body.date || !body.memberId) {
      return NextResponse.json({ error: 'Title, date, and member are required' }, { status: 400 });
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(body.date)) {
      return NextResponse.json({ error: 'Date must be in YYYY-MM-DD format' }, { status: 400 });
    }
    const event = await prisma.calendarEvent.create({
      data: {
        title,
        date: sanitizeString(body.date, 20),
        time: sanitizeString(body.time, 10),
        endTime: sanitizeString(body.endTime, 10),
        memberId: sanitizeString(body.memberId, 100),
        category: sanitizeString(body.category, 50) || 'other',
        recurring: sanitizeString(body.recurring, 20),
        notes: sanitizeString(body.notes, 2000),
        createdBy: auth.user.id,
      },
    });
    return NextResponse.json(event);
  } catch (error) {
    console.error('Calendar POST error:', error);
    return NextResponse.json({ error: 'Failed to create event' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const auth = await getSessionWithPermissions();
  if (!auth) return unauthorizedResponse();
  if (!checkAccess(auth.perms, 'calendar', 'edit')) return forbiddenResponse();

  try {
    const body = await req.json();
    const { id } = body;
    if (!id) return NextResponse.json({ error: 'Event ID required' }, { status: 400 });

    const existing = await prisma.calendarEvent.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: 'Event not found' }, { status: 404 });

    if (auth.perms.calendar === 'own' && existing.createdBy !== auth.user.id) {
      return forbiddenResponse();
    }

    const safeData = pickFields(body, ['title', 'date', 'time', 'endTime', 'memberId', 'category', 'recurring', 'notes'], 2000);
    const event = await prisma.calendarEvent.update({ where: { id }, data: safeData });
    return NextResponse.json(event);
  } catch (error) {
    console.error('Calendar PATCH error:', error);
    return NextResponse.json({ error: 'Failed to update event' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const auth = await getSessionWithPermissions();
  if (!auth) return unauthorizedResponse();
  if (!checkAccess(auth.perms, 'calendar', 'delete')) return forbiddenResponse();

  try {
    const { id } = await req.json();
    if (!id) return NextResponse.json({ error: 'Event ID required' }, { status: 400 });

    const existing = await prisma.calendarEvent.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: 'Event not found' }, { status: 404 });

    if (auth.perms.calendar === 'own' && existing.createdBy !== auth.user.id) {
      return forbiddenResponse();
    }

    await prisma.calendarEvent.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Calendar DELETE error:', error);
    return NextResponse.json({ error: 'Failed to delete event' }, { status: 500 });
  }
}
