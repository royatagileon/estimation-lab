import { redirect } from "next/navigation";

async function fetchId(slug: string) {
  const url = `/api/session/by-slug/${encodeURIComponent(slug)}`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) return null;
  const data = await res.json();
  return data?.id ?? null;
}

export default async function SharePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const id = await fetchId(slug);
  if (id) redirect("/session/"+id);
  redirect("/join");
}


