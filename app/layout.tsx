// src/app/layout.tsx
import "./globals.css"
import type { Metadata } from "next"
import Navbar from "@/components/Navbar"

export const metadata: Metadata = {
  title: "Nail Admin",
  description: "美甲後台管理系統",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-Hant">
      <body className="min-h-screen bg-brand-50 text-brand-900">
        <header className="border-b border-brand-200 sticky top-0 z-40 bg-brand-100/80 backdrop-blur">
          
          <Navbar />
        </header>
        <main className="max-w-7xl mx-auto px-4 py-6">{children}</main>
      </body>
    </html>
  )
}
