"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_ITEMS } from "./nav";

export default function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className="hidden md:flex flex-col w-56 bg-gray-50 border-r border-gray-200 shrink-0">
      <nav className="flex flex-col gap-1 px-2 pt-3">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href + "/"));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive ? "bg-black text-white" : "text-gray-700 hover:bg-gray-200"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
