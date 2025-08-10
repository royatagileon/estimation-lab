export async function POST() {
  return new Response('Seeding disabled (app data moved off Prisma).', { status: 410 });
}

export async function GET() {
  return new Response('Seeding disabled (app data moved off Prisma).', { status: 410 });
}


