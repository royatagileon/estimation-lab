import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from './providers';
import Link from 'next/link';
import { AuthButtons } from './components/AuthButtons';
import { GlobalHeader } from './components/GlobalHeader';
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
      <body className={cn(
        "min-h-screen antialiased",
        "bg-gradient-to-b from-neutral-50 to-white dark:from-neutral-950 dark:to-neutral-950",
        inter.variable
      )}>
        <Providers>
          <div className="mx-auto max-w-7xl px-4">
            <GlobalHeader />
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
