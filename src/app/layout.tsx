import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from './providers';
import Link from 'next/link';
import { AuthButtons } from './components/AuthButtons';
import { ThemeSwitcher } from './components/ThemeSwitcher';
import { GithubIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

const inter = Inter({ variable: "--font-sans", subsets: ["latin"] });

export const metadata: Metadata = {
  title: {
    default: "Estimation Lab",
    template: "%s • Estimation Lab",
  },
  description: "Estimate together with clarity and speed.",
  metadataBase: new URL("https://estimation-lab.vercel.app"),
  applicationName: "Estimation Lab",
  openGraph: { title: "Estimation Lab", description: "Estimate together with clarity and speed.", siteName: "Estimation Lab" },
  twitter: { card: "summary_large_image", title: "Estimation Lab", description: "Estimate together with clarity and speed." },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={cn("min-h-screen bg-background text-foreground antialiased", inter.variable)}>
        <Providers>
          <div className="mx-auto max-w-7xl px-4">
            <header className="sticky top-0 z-40 backdrop-blur supports-[backdrop-filter]:bg-background/60 bg-background/80 border-b">
              <div className="h-14 flex items-center justify-between">
                <Link href="/" className="font-semibold tracking-tight">Estimation Lab</Link>
                <nav className="text-sm flex items-center gap-3">
                  <Link href="/join" className="hover:underline">Join</Link>
                  <Link href="/admin" className="hover:underline">Admin</Link>
                  <a href="https://github.com/royatagileon/estimation-lab" aria-label="GitHub" className="p-2 rounded-lg hover:bg-muted">
                    <GithubIcon className="h-5 w-5" />
                  </a>
                  <ThemeSwitcher />
                  <AuthButtons />
                </nav>
              </div>
            </header>
            <main className="py-6">{children}</main>
            <footer className="border-t py-6 text-xs text-muted-foreground flex items-center justify-between">
              <span>Estimate together with clarity and speed.</span>
              <span className="space-x-3">
                <Link href="/terms" prefetch className="hover:underline">Terms</Link>
                <Link href="/privacy" prefetch className="hover:underline">Privacy</Link>
              </span>
            </footer>
          </div>
        </Providers>
      </body>
    </html>
  );
}
