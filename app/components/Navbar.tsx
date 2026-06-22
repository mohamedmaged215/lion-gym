"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { auth } from "../lib/firebase";

const GYM_CONFIG = { name: "Lion Gym" };

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    await signOut(auth);
    router.push("/");
  }

  const links = [
    {
      href: "/dashboard",
      label: "الرئيسية",
      icon: (active: boolean) => (
        <svg className={`w-5 h-5 transition-colors ${active ? "text-blue-600" : "text-gray-400 group-hover:text-gray-600"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      )
    },
    {
      href: "/customers",
      label: "الاشتراكات",
      icon: (active: boolean) => (
        <svg className={`w-5 h-5 transition-colors ${active ? "text-blue-600" : "text-gray-400 group-hover:text-gray-600"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      )
    },
    {
      href: "/expenses",
      label: "المصاريف",
      icon: (active: boolean) => (
        <svg className={`w-5 h-5 transition-colors ${active ? "text-blue-600" : "text-gray-400 group-hover:text-gray-600"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      )
    }
  ];

  const allDesktopLinks = [
    { href: "/dashboard", label: "الرئيسية" },
    { href: "/customers", label: "الاشتراكات" },
    { href: "/expenses", label: "المصاريف" },
  ];

  return (
    <>
      {/* Desktop Header Nav (sm and above) */}
      <header className="hidden sm:block bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-6">
            {/* Logo */}
            <div className="flex items-center gap-2 shrink-0">
              <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center shadow-md shadow-blue-200">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 004 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064" />
                </svg>
              </div>
              <span className="text-sm font-bold text-gray-800 tracking-wide">{GYM_CONFIG.name}</span>
            </div>

            {/* Links */}
            <nav className="flex items-center gap-1">
              {allDesktopLinks.map(({ href, label }) => {
                const active = pathname === href || pathname.startsWith(href + "/");
                return (
                  <Link
                    key={href}
                    href={href}
                    className={`px-4 py-2 rounded-xl text-sm font-semibold transition ${
                      active
                        ? "bg-blue-50 text-blue-600 shadow-sm shadow-blue-50/50"
                        : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                    }`}
                  >
                    {label}
                  </Link>
                );
              })}
            </nav>
          </div>

          <div>
            <button
              onClick={handleLogout}
              className="text-sm font-semibold text-gray-500 hover:text-red-600 hover:bg-red-50 px-4 py-2 rounded-xl transition"
            >
              تسجيل الخروج
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Bottom Navigation Bar (sm hidden) */}
      <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-45 bg-white/95 backdrop-blur-md border-t border-gray-150 h-16 shadow-[0_-3px_15px_rgba(0,0,0,0.06)] flex items-center justify-around pb-safe">
        {links.map(({ href, label, icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className="flex flex-col items-center justify-center w-full h-full group py-1"
            >
              <div className="mb-1 transition-transform duration-200 active:scale-95">
                {icon(active)}
              </div>
              <span
                className={`text-[10px] font-bold transition-colors leading-none tracking-wide ${
                  active ? "text-blue-600" : "text-gray-400 group-hover:text-gray-600"
                }`}
              >
                {label}
              </span>
            </Link>
          );
        })}

        {/* Logout Button directly on Mobile Bottom Nav */}
        <button
          onClick={handleLogout}
          className="flex flex-col items-center justify-center w-full h-full group py-1"
        >
          <div className="mb-1 transition-transform duration-200 active:scale-95 text-gray-400 group-hover:text-red-600">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </div>
          <span className="text-[10px] font-bold leading-none tracking-wide text-gray-400 group-hover:text-red-600">
            خروج
          </span>
        </button>
      </nav>
    </>
  );
}
