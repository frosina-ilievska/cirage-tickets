"use client";

import { signOut, useSession } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function Navbar() {
  const { data: session } = useSession();
  const pathname = usePathname();

  const isActive = (path: string) =>
    pathname.startsWith(path) ? "text-gray-900 font-semibold" : "text-gray-500 hover:text-gray-800";

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-14">
          <div className="flex items-center gap-8">
            <Link href="/dashboard" className="font-semibold text-gray-900 tracking-tight">
              Cirage Paris <span className="text-gray-400 font-normal">/ Tickets</span>
            </Link>
            <div className="flex items-center gap-6 text-sm">
              <Link href="/dashboard" className={isActive("/dashboard")}>Dashboard</Link>
              <Link href="/tickets" className={isActive("/tickets")}>Tickets</Link>
              {session?.user.role === "ADMIN" && (
                <Link href="/admin" className={isActive("/admin")}>Admin</Link>
              )}
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/tickets/new"
              className="text-sm bg-gray-900 text-white px-3 py-1.5 rounded-lg hover:bg-gray-700 transition-colors"
            >
              + New Ticket
            </Link>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <div className="w-7 h-7 bg-indigo-100 text-indigo-700 rounded-full flex items-center justify-center font-medium text-xs">
                {session?.user.name?.[0]?.toUpperCase()}
              </div>
              <span className="hidden sm:block">{session?.user.name}</span>
              <span className="text-gray-300">·</span>
              <button
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="text-gray-400 hover:text-gray-600"
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
