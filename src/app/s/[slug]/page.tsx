import { redirect } from "next/navigation";

async function fetchId(slug: string) {
  const base = process.env.NEXT_PUBLIC_BASE_URL || "";
  const url = `${base}/api/session/by-slug/${encodeURIComponent(slug)}`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) return null;
  const data = await res.json();
  return data?.id ?? null;
}

export default async function SharePage({ params }: { params: { slug: string } }) {
  const id = await fetchId(params.slug);
  if (id) redirect("/session/"+id);
  redirect("/join");
}


