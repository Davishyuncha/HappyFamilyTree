"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function GlobalNav() {
  const pathname = usePathname();
  const isHome = pathname === "/";

  return (
    <nav className="bg-gradient-to-r from-blue-700 to-indigo-800 text-white shadow-md">
      <div className="max-w-full mx-auto px-4 sm:px-6 py-2 sm:py-2.5 flex items-center justify-between">
        <Link
          href="/"
          className="flex items-center gap-2 hover:opacity-90 transition-opacity"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 20 20"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M3 10.5L10 4l7 6.5" />
            <path d="M5 9.5V16a1 1 0 001 1h3v-4h2v4h3a1 1 0 001-1V9.5" />
          </svg>
          <span className="font-bold text-sm">
            {isHome ? "연안 차씨 디지털 가승" : "홈으로"}
          </span>
        </Link>

        <div className="flex items-center gap-1">
          <NavLink href="/" label="가계도" active={isHome} />
          <NavLink
            href="/calendar"
            label="캘린더"
            active={pathname.startsWith("/calendar")}
          />
          <NavLink
            href="/plaza"
            label="차씨 광장"
            active={pathname.startsWith("/plaza")}
          />
        </div>
      </div>
    </nav>
  );
}

function NavLink({
  href,
  label,
  active,
}: {
  href: string;
  label: string;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
        active
          ? "bg-white/20 text-white"
          : "text-blue-100 hover:bg-white/10 hover:text-white"
      }`}
    >
      {label}
    </Link>
  );
}
