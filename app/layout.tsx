import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

const geist = Geist({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"),
  title: { default: "MailForge AI: cold emails that feel personal", template: "%s | MailForge AI" },
  description:
    "MailForge AI turns a prospect, company and offer into personalized cold emails in seconds. Manage leads, templates and history in one workspace.",
};

export const viewport: Viewport = { themeColor: "#0b0a0f" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`dark ${geist.variable}`}>
      <body className="min-h-screen font-sans">
        {children}
        <Toaster />
        <Analytics />
      </body>
    </html>
  );
}