import type { Metadata } from "next";
import { Epilogue } from "next/font/google";
import "./globals.css";
import AppShell from "@/components/AppShell";

const bodyFont = Epilogue({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-body",
});

export const metadata: Metadata = {
  title: "Theft Guard AI - Recreated UI",
  description: "Django Ninja Extra + Next.js dashboard recreation",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${bodyFont.variable} h-full antialiased dark`}
    >
      <body className="min-h-full flex flex-col">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
