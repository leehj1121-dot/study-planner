"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Calendar, Settings } from "lucide-react";

const tabs = [
  { href: "/dashboard", label: "대시보드", icon: LayoutDashboard },
  { href: "/calendar", label: "캘린더", icon: Calendar },
  { href: "/settings", label: "설정", icon: Settings },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="bg-background fixed bottom-0 left-0 right-0 border-t">
      <div className="mx-auto flex max-w-md">
        {tabs.map((tab) => {
          const isActive = pathname.startsWith(tab.href);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex flex-1 flex-col items-center gap-0.5 py-2 text-xs transition-colors ${
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <tab.icon className="size-5" />
              {tab.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
