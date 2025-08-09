import { prisma } from '@/server/db';

export async function POST() {
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
  const session = await prisma.session.create({
    data: { workspaceId: ws.id, title: 'Demo Session', code: '123456', shareSlug: 'DEMO1234', createdBy: user.id },
  });
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
  return Response.json({ ok: true, workspaceId: ws.id, sessionId: session.id });
}


