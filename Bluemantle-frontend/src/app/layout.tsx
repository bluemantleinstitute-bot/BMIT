import type { Metadata } from "next";
import "./globals.css";
import { ClientOnlyDNABackground } from "@/components/ClientOnlyDNABackground";

export const metadata: Metadata = {
  title: "Academic Atelier - Bluemantle",
  description: "Ultra-Premium eLearning Platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="font-inter antialiased bg-surface text-on_surface">
        <ClientOnlyDNABackground />
        {children}
      </body>
    </html>
  );
}
