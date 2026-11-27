import type { Metadata } from "next";
import { GeistMono } from "geist/font/mono";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { site } from "@/lib/site";
import "./globals.css";

// Every screen is rendered per request, so none is frozen at build time with stale data or settings.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: site.name,
  description: site.promise,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${GeistMono.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <TooltipProvider>{children}</TooltipProvider>
        <Toaster theme="light" />
      </body>
    </html>
  );
}
