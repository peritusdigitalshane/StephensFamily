import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionWithPermissions, checkAccess, forbiddenResponse, unauthorizedResponse } from '@/lib/permissions';
import OpenAI from 'openai';

export async function POST(req: NextRequest) {
  try {
    const auth = await getSessionWithPermissions();
    if (!auth) return unauthorizedResponse();
    if (!checkAccess(auth.perms, 'chat', 'create')) return forbiddenResponse();

    const session = { user: auth.user };

    const { messages, systemPrompt, model: requestedModel } = await req.json();

    // Get AI config from database
    const aiConfig = await prisma.aIConfig.findUnique({ where: { id: 'singleton' } });

    const apiKey = aiConfig?.apiKey;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured. Ask the admin to set it up in AI Configuration.' },
        { status: 503 }
      );
    }

    // Validate model against enabled list
    const enabledModels = (() => {
      try { return JSON.parse(aiConfig?.enabledModels || '[]'); } catch { return []; }
    })();
    const enabledIds = enabledModels.map((m: { id?: string }) => m.id || m);
    let model = requestedModel || aiConfig.selectedModel || 'gpt-4o';
    if (enabledIds.length > 0 && !enabledIds.includes(model)) {
      model = enabledIds[0] || aiConfig.selectedModel || 'gpt-4o';
    }
    const maxTokens = aiConfig?.maxTokens || 4096;
    const temperature = aiConfig?.temperature ?? 0.7;

    const client = new OpenAI({ apiKey });

    const response = await client.chat.completions.create({
      model,
      max_tokens: maxTokens,
      temperature,
      messages: [
        {
          role: 'system' as const,
          content: `${systemPrompt}\n\nYou are currently speaking with ${session.user.name} from the Stephens family. Keep your responses concise and helpful.`,
        },
        ...messages.map((m: { role: string; content: string }) => ({
          role: m.role as 'user' | 'assistant',
          content: m.content,
        })),
      ],
    });

    const content = response.choices[0]?.message?.content || 'No response generated.';
    return NextResponse.json({ content, model });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Chat API error:', message);
    return NextResponse.json(
      { error: `Something went wrong: ${message}` },
      { status: 500 }
    );
  }
}
