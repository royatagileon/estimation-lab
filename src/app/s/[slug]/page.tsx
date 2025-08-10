import { redirect } from "next/navigation";
import { headers } from "next/headers";

async function fetchId(slug: string) {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (host.includes("localhost") ? "http" : "https");
  const origin = `${proto}://${host}`;
  const url = new URL(`/api/session/by-slug/${encodeURIComponent(slug)}`, origin);
  const res = await fetch(url.toString(), { cache: "no-store" });
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


