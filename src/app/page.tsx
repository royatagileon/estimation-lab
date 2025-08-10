import Link from 'next/link';
import { ArrowRight, Users, ClipboardList, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Home() {
  return (
    <div className="space-y-8">
      <section className="surface p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Estimate together with clarity and speed</h1>
            <p className="muted mt-1 text-sm">Plan sprints faster with modern, accessible estimation sessions.</p>
          </div>
          <div className="flex gap-3">
            <Link href="/session/new" className="inline-flex items-center gap-2 rounded-xl bg-accent px-4 py-2 text-sm font-medium text-white shadow-md focus-ring">New Session <ArrowRight className="h-4 w-4" /></Link>
            <Link href="/join" className="inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-medium focus-ring">Join</Link>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <div className="surface p-5">
          <div className="flex items-center gap-2"><Sparkles className="h-4 w-4" /><h3 className="text-sm font-medium">Create</h3></div>
          <p className="muted mt-1 text-sm">Start a session and share a simple link or code.</p>
        </div>
        <div className="surface p-5">
          <div className="flex items-center gap-2"><Users className="h-4 w-4" /><h3 className="text-sm font-medium">Join</h3></div>
          <p className="muted mt-1 text-sm">Your team joins from any device and votes privately.</p>
        </div>
        <div className="surface p-5">
          <div className="flex items-center gap-2"><ClipboardList className="h-4 w-4" /><h3 className="text-sm font-medium">Reveal</h3></div>
          <p className="muted mt-1 text-sm">Reveal, discuss outliers, revote, and move forward.</p>
        </div>
      </section>
    </div>
  );
}
