import { JoinSlugClient } from './client';

export default function JoinSlugPage({ params }: { params: { slug: string } }) {
  return <JoinSlugClient slug={params.slug} />;
}


