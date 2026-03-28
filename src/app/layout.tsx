/**
 * FILE: layout.tsx
 * PATH: apps/admin/src/app/layout.tsx
 */

import type { Metadata } from "next";
import { Montserrat, Cormorant_Garamond } from "next/font/google";
import "@/styles/globals.css";

const montserrat = Montserrat({ subsets: ["latin", "vietnamese"], variable: "--font-montserrat" });
const cormorant = Cormorant_Garamond({ subsets: ["latin", "vietnamese"], weight: ["400", "600", "700"], variable: "--font-cormorant" });

export const metadata: Metadata = {
  title: "VESTA Admin Portal",
  description: "Hệ thống quản trị VESTA Academy",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi" className={`${montserrat.variable} ${cormorant.variable}`}>
      <body className="font-body">{children}</body>
    </html>
  );
}