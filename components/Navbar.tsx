"use client"
import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Home, Package, Users, BarChart3, Settings, Menu, X } from "lucide-react"

const navItems = [
  { href: "/", label: "儀表板", icon: Home },
  { href: "/orders", label: "訂單管理", icon: Package },
  { href: "/customers", label: "客戶管理", icon: Users },
  { href: "/stats", label: "銷售統計", icon: BarChart3 },
  { href: "/settings", label: "系統設定", icon: Settings },
]

export default function Navbar() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  return (
    <nav className="sticky top-0 z-50 bg-gradient-to-r from-brand-100 to-brand-50 border-b border-brand-200 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
        {/* 左側 Logo 與標題 */}
        <Link href="/" className="flex items-center gap-2 group">
          <div className="size-8 rounded-xl bg-gradient-to-br from-brand-400 to-yellow-300 shadow-md group-hover:scale-105 transition" />
          <span className="font-bold text-brand-900 text-lg tracking-tight">
            美甲後台管理
          </span>
        </Link>

        {/* 漢堡選單（手機） */}
        <button
          className="sm:hidden p-2 text-brand-700 hover:text-brand-900 transition"
          onClick={() => setOpen(!open)}
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>

        {/* 桌機導覽 */}
        <div className="hidden sm:flex items-center gap-2 sm:gap-4">
          {navItems.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(`${href}/`)
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-2 rounded-xl font-medium transition text-sm",
                  active
                    ? "bg-brand-400 text-white shadow-sm"
                    : "text-brand-700 hover:bg-brand-100 hover:text-brand-900"
                )}
              >
                <Icon size={16} />
                <span>{label}</span>
              </Link>
            )
          })}
        </div>
      </div>

      {/* 手機下拉導覽 */}
      {open && (
        <div className="sm:hidden border-t border-brand-200 bg-white/95 backdrop-blur-sm shadow-lg animate-fadeIn">
          <div className="flex flex-col p-3 space-y-2">
            {navItems.map(({ href, label, icon: Icon }) => {
              const active = pathname === href || pathname.startsWith(`${href}/`)
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 rounded-lg font-medium transition text-sm",
                    active
                      ? "bg-brand-400 text-white"
                      : "text-brand-700 hover:bg-brand-100 hover:text-brand-900"
                  )}
                >
                  <Icon size={16} />
                  <span>{label}</span>
                </Link>
              )
            })}
          </div>
        </div>
      )}
    </nav>
  )
}
