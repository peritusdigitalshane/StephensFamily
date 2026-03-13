import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionWithPermissions, checkAccess, forbiddenResponse, unauthorizedResponse } from '@/lib/permissions';
import { sanitizeString, pickFields } from '@/lib/sanitize';
import { parsePagination, paginatedResponse } from '@/lib/pagination';

export async function GET(req: NextRequest) {
  const auth = await getSessionWithPermissions();
  if (!auth) return unauthorizedResponse();
  if (!checkAccess(auth.perms, 'shopping', 'read')) return forbiddenResponse();

  try {
    const usePagination = new URL(req.url).searchParams.has('page');
    if (usePagination) {
      const p = parsePagination(req);
      const [items, total] = await Promise.all([
        prisma.shoppingItem.findMany({ orderBy: { createdAt: 'desc' }, skip: p.skip, take: p.limit }),
        prisma.shoppingItem.count(),
      ]);
      return NextResponse.json(paginatedResponse(items, total, p));
    }
    const items = await prisma.shoppingItem.findMany({ orderBy: { createdAt: 'desc' } });
    return NextResponse.json(items);
  } catch (error) {
    console.error('Shopping GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch items' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await getSessionWithPermissions();
  if (!auth) return unauthorizedResponse();
  if (!checkAccess(auth.perms, 'shopping', 'create')) return forbiddenResponse();

  try {
    const body = await req.json();

    if (body.action === 'clearChecked') {
      await prisma.shoppingItem.deleteMany({ where: { checked: true } });
      return NextResponse.json({ success: true });
    }

    const name = sanitizeString(body.name, 200);
    if (!name) {
      return NextResponse.json({ error: 'Item name is required' }, { status: 400 });
    }
    const item = await prisma.shoppingItem.create({
      data: {
        name,
        quantity: sanitizeString(body.quantity, 50),
        category: sanitizeString(body.category, 50) || 'groceries',
        addedBy: auth.user.id,
        checked: false,
      },
    });
    return NextResponse.json(item);
  } catch (error) {
    console.error('Shopping POST error:', error);
    return NextResponse.json({ error: 'Failed to add item' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const auth = await getSessionWithPermissions();
  if (!auth) return unauthorizedResponse();
  if (!checkAccess(auth.perms, 'shopping', 'edit')) return forbiddenResponse();

  try {
    const body = await req.json();
    const { id } = body;
    if (!id) return NextResponse.json({ error: 'Item ID required' }, { status: 400 });

    const existing = await prisma.shoppingItem.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: 'Item not found' }, { status: 404 });

    // Ownership check for 'own' permission level
    if (auth.perms.shopping === 'own' && existing.addedBy !== auth.user.id) {
      return forbiddenResponse();
    }

    const safeData = pickFields(body, ['name', 'quantity', 'category', 'checked'], 200);
    const item = await prisma.shoppingItem.update({ where: { id }, data: safeData });
    return NextResponse.json(item);
  } catch (error) {
    console.error('Shopping PATCH error:', error);
    return NextResponse.json({ error: 'Failed to update item' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const auth = await getSessionWithPermissions();
  if (!auth) return unauthorizedResponse();
  if (!checkAccess(auth.perms, 'shopping', 'delete')) return forbiddenResponse();

  try {
    const { id } = await req.json();
    if (!id) return NextResponse.json({ error: 'Item ID required' }, { status: 400 });

    // Ownership check for 'own' permission level
    const existing = await prisma.shoppingItem.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    if (auth.perms.shopping === 'own' && existing.addedBy !== auth.user.id) {
      return forbiddenResponse();
    }

    await prisma.shoppingItem.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Shopping DELETE error:', error);
    return NextResponse.json({ error: 'Failed to delete item' }, { status: 500 });
  }
}
