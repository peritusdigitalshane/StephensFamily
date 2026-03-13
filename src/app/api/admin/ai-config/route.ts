import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import OpenAI from 'openai';

// GET - fetch current AI config
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'superadmin') {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 403 });
  }

  try {
    let config = await prisma.aIConfig.findUnique({ where: { id: 'singleton' } });

    if (!config) {
      config = await prisma.aIConfig.create({
        data: { id: 'singleton' },
      });
    }

    return NextResponse.json({
      ...config,
      apiKey: config.apiKey ? '***configured***' : '',
      enabledModels: JSON.parse(config.enabledModels),
      availableModels: JSON.parse(config.availableModels),
    });
  } catch (error) {
    console.error('AI config GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch AI config' }, { status: 500 });
  }
}

// PATCH - update AI config
export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'superadmin') {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const updateData: Record<string, unknown> = {};

    if (body.apiKey !== undefined) updateData.apiKey = body.apiKey;
    if (body.selectedModel !== undefined) updateData.selectedModel = body.selectedModel;
    if (body.enabledModels !== undefined) updateData.enabledModels = JSON.stringify(body.enabledModels);
    if (body.maxTokens !== undefined) updateData.maxTokens = Math.min(128000, Math.max(256, Number(body.maxTokens) || 4096));
    if (body.temperature !== undefined) updateData.temperature = Math.min(2, Math.max(0, Number(body.temperature) || 0.7));

    const config = await prisma.aIConfig.upsert({
      where: { id: 'singleton' },
      update: updateData,
      create: { id: 'singleton', ...updateData },
    });

    return NextResponse.json({
      ...config,
      apiKey: config.apiKey ? '***configured***' : '',
      enabledModels: JSON.parse(config.enabledModels),
      availableModels: JSON.parse(config.availableModels),
    });
  } catch (error) {
    console.error('AI config PATCH error:', error);
    return NextResponse.json({ error: 'Failed to update AI config' }, { status: 500 });
  }
}

// POST - fetch available models from OpenAI
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'superadmin') {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 403 });
  }

  const { apiKey } = await req.json();

  // Use provided key or get stored key
  let key = apiKey;
  if (!key) {
    const config = await prisma.aIConfig.findUnique({ where: { id: 'singleton' } });
    key = config?.apiKey;
  }

  if (!key) {
    return NextResponse.json({ error: 'No API key configured' }, { status: 400 });
  }

  try {
    const openai = new OpenAI({ apiKey: key });
    const models = await openai.models.list();

    // Filter for chat models (GPT models)
    const chatModels = models.data
      .filter((m) => {
        const id = m.id.toLowerCase();
        return (
          id.includes('gpt') ||
          id.includes('o1') ||
          id.includes('o3') ||
          id.includes('o4')
        );
      })
      .map((m) => ({
        id: m.id,
        name: m.id,
        owned_by: m.owned_by,
        created: m.created,
      }))
      .sort((a, b) => b.created - a.created);

    // Save available models to DB
    await prisma.aIConfig.upsert({
      where: { id: 'singleton' },
      update: {
        availableModels: JSON.stringify(chatModels),
        ...(apiKey ? { apiKey } : {}),
      },
      create: {
        id: 'singleton',
        availableModels: JSON.stringify(chatModels),
        apiKey: apiKey || '',
      },
    });

    return NextResponse.json({ models: chatModels });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: `Failed to fetch models: ${message}` }, { status: 400 });
  }
}
