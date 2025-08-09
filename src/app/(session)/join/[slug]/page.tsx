import { JoinSlugClient } from './client';

export default async function JoinSlugPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <JoinSlugClient slug={slug} />;
}


