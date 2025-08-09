import { prisma } from '@/server/db';

async function doSeed() {
  const user = await prisma.user.upsert({
    where: { id: 'seed' },
    create: { id: 'seed', email: 'seed@example.com', name: 'Seed User' },
    update: {},
  });
  const ws = await prisma.workspace.upsert({
    where: { slug: 'demo' },
    create: { name: 'Demo', slug: 'demo' },
    update: {},
  });
  const session = await prisma.session.upsert({
    where: { shareSlug: 'DEMO1234' },
    update: {},
    create: { workspaceId: ws.id, title: 'Demo Session', code: '123456', shareSlug: 'DEMO1234', createdBy: user.id },
  });
  const existingItems = await prisma.workItem.count({ where: { sessionId: session.id } });
  if (existingItems === 0) {
    for (let i = 1; i <= 10; i++) {
      await prisma.workItem.create({
        data: {
          sessionId: session.id,
          externalKey: `DEMO-${i}`,
          title: `Sample item ${i}`,
          description: `As a user, I want sample ${i} so that…`,
          acceptanceCriteria: `AC for ${i}`,
          tags: ['sample'],
          domain: 'general',
          source: 'seed',
        },
      });
    }
  }
  return { ok: true, workspaceId: ws.id, sessionId: session.id, shareLinkSlug: 'DEMO1234', joinCode: '123456' };
}

export async function POST() {
  try {
    const result = await doSeed();
    return Response.json(result);
  } catch (err) {
    return new Response('Seed failed', { status: 500 });
  }
}

export async function GET() {
  try {
    const result = await doSeed();
    return Response.json(result);
  } catch (err) {
    return new Response('Seed failed', { status: 500 });
  }
}


