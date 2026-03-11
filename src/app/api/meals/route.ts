import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionWithPermissions, checkAccess, forbiddenResponse, unauthorizedResponse } from '@/lib/permissions';
import { sanitizeString, pickFields } from '@/lib/sanitize';
import { parsePagination, paginatedResponse } from '@/lib/pagination';

export async function GET(req: NextRequest) {
  const auth = await getSessionWithPermissions();
  if (!auth) return unauthorizedResponse();
  if (!checkAccess(auth.perms, 'meals', 'read')) return forbiddenResponse();

  try {
    const usePagination = new URL(req.url).searchParams.has('page');
    if (usePagination) {
      const p = parsePagination(req);
      const [meals, total] = await Promise.all([
        prisma.mealPlan.findMany({ orderBy: { date: 'asc' }, skip: p.skip, take: p.limit }),
        prisma.mealPlan.count(),
      ]);
      return NextResponse.json(paginatedResponse(meals, total, p));
    }
    const meals = await prisma.mealPlan.findMany({ orderBy: { date: 'asc' } });
    return NextResponse.json(meals);
  } catch (error) {
    console.error('Meals GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch meals' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await getSessionWithPermissions();
  if (!auth) return unauthorizedResponse();
  if (!checkAccess(auth.perms, 'meals', 'create')) return forbiddenResponse();

  try {
    const body = await req.json();
    const recipe = sanitizeString(body.recipe, 500);
    if (!body.date || !body.meal || !recipe) {
      return NextResponse.json({ error: 'Date, meal type, and recipe are required' }, { status: 400 });
    }
    const meal = await prisma.mealPlan.create({
      data: {
        date: sanitizeString(body.date, 20),
        meal: sanitizeString(body.meal, 20),
        recipe,
        prepBy: sanitizeString(body.prepBy, 100),
        notes: sanitizeString(body.notes, 2000),
        createdBy: auth.user.id,
      },
    });
    return NextResponse.json(meal);
  } catch (error) {
    console.error('Meals POST error:', error);
    return NextResponse.json({ error: 'Failed to create meal' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const auth = await getSessionWithPermissions();
  if (!auth) return unauthorizedResponse();
  if (!checkAccess(auth.perms, 'meals', 'edit')) return forbiddenResponse();

  try {
    const body = await req.json();
    const { id } = body;
    if (!id) return NextResponse.json({ error: 'Meal ID required' }, { status: 400 });

    const existing = await prisma.mealPlan.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: 'Meal not found' }, { status: 404 });

    if (auth.perms.meals === 'own' && existing.createdBy !== auth.user.id) {
      return forbiddenResponse();
    }

    const safeData = pickFields(body, ['date', 'meal', 'recipe', 'prepBy', 'notes'], 2000);
    const meal = await prisma.mealPlan.update({ where: { id }, data: safeData });
    return NextResponse.json(meal);
  } catch (error) {
    console.error('Meals PATCH error:', error);
    return NextResponse.json({ error: 'Failed to update meal' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const auth = await getSessionWithPermissions();
  if (!auth) return unauthorizedResponse();
  if (!checkAccess(auth.perms, 'meals', 'delete')) return forbiddenResponse();

  try {
    const { id } = await req.json();
    if (!id) return NextResponse.json({ error: 'Meal ID required' }, { status: 400 });

    const existing = await prisma.mealPlan.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: 'Meal not found' }, { status: 404 });

    if (auth.perms.meals === 'own' && existing.createdBy !== auth.user.id) {
      return forbiddenResponse();
    }

    await prisma.mealPlan.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Meals DELETE error:', error);
    return NextResponse.json({ error: 'Failed to delete meal' }, { status: 500 });
  }
}
