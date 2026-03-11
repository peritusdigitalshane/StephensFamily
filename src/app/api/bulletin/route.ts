import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionWithPermissions, checkAccess, forbiddenResponse, unauthorizedResponse } from '@/lib/permissions';
import { sanitizeString, pickFields } from '@/lib/sanitize';
import { parsePagination, paginatedResponse } from '@/lib/pagination';

export async function GET(req: NextRequest) {
  const auth = await getSessionWithPermissions();
  if (!auth) return unauthorizedResponse();
  if (!checkAccess(auth.perms, 'bulletin', 'read')) return forbiddenResponse();

  try {
    const usePagination = new URL(req.url).searchParams.has('page');
    if (usePagination) {
      const p = parsePagination(req);
      const [posts, total] = await Promise.all([
        prisma.bulletinPost.findMany({ orderBy: [{ pinned: 'desc' }, { createdAt: 'desc' }], skip: p.skip, take: p.limit }),
        prisma.bulletinPost.count(),
      ]);
      return NextResponse.json(paginatedResponse(posts, total, p));
    }
    const posts = await prisma.bulletinPost.findMany({ orderBy: [{ pinned: 'desc' }, { createdAt: 'desc' }] });
    return NextResponse.json(posts);
  } catch (error) {
    console.error('Bulletin GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch posts' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await getSessionWithPermissions();
  if (!auth) return unauthorizedResponse();
  if (!checkAccess(auth.perms, 'bulletin', 'create')) return forbiddenResponse();

  try {
    const body = await req.json();
    const title = sanitizeString(body.title, 200);
    const content = sanitizeString(body.content, 5000);
    if (!title || !content) {
      return NextResponse.json({ error: 'Title and content are required' }, { status: 400 });
    }
    const post = await prisma.bulletinPost.create({
      data: {
        title,
        content,
        author: auth.user.name,
        authorId: auth.user.id,
        category: sanitizeString(body.category, 50) || 'note',
        pinned: false,
      },
    });
    return NextResponse.json(post);
  } catch (error) {
    console.error('Bulletin POST error:', error);
    return NextResponse.json({ error: 'Failed to create post' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const auth = await getSessionWithPermissions();
  if (!auth) return unauthorizedResponse();
  if (!checkAccess(auth.perms, 'bulletin', 'edit')) return forbiddenResponse();

  try {
    const body = await req.json();
    const { id } = body;
    if (!id) return NextResponse.json({ error: 'Post ID required' }, { status: 400 });

    const existing = await prisma.bulletinPost.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: 'Post not found' }, { status: 404 });

    if (auth.perms.bulletin === 'own' && existing.authorId !== auth.user.id) {
      return forbiddenResponse();
    }

    const safeData = pickFields(body, ['title', 'content', 'category', 'pinned'], 5000);
    const post = await prisma.bulletinPost.update({ where: { id }, data: safeData });
    return NextResponse.json(post);
  } catch (error) {
    console.error('Bulletin PATCH error:', error);
    return NextResponse.json({ error: 'Failed to update post' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const auth = await getSessionWithPermissions();
  if (!auth) return unauthorizedResponse();
  if (!checkAccess(auth.perms, 'bulletin', 'delete')) return forbiddenResponse();

  try {
    const { id } = await req.json();
    if (!id) return NextResponse.json({ error: 'Post ID required' }, { status: 400 });

    const existing = await prisma.bulletinPost.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: 'Post not found' }, { status: 404 });

    if (auth.perms.bulletin === 'own' && existing.authorId !== auth.user.id) {
      return forbiddenResponse();
    }

    await prisma.bulletinPost.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Bulletin DELETE error:', error);
    return NextResponse.json({ error: 'Failed to delete post' }, { status: 500 });
  }
}
