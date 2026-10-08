"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { auth } from "../lib/firebaseAuth";
import { getDashboardStats } from "../lib/firebaseUtils";
import { localDate } from "../lib/dates";
import Navbar from "../components/Navbar";

function StatCard({
  label,
  value,
  color,
  icon,
  href,
}: {
  label: string;
  value: string | number;
  color: "green" | "orange" | "blue" | "purple" | "red";
  icon: React.ReactNode;
  href?: string;
}) {
  const colors = {
    green:  { bg: "bg-green-50/60 border-green-100",  icon: "bg-green-100 text-green-600",  text: "text-green-700"  },
    orange: { bg: "bg-orange-50/60 border-orange-100", icon: "bg-orange-100 text-orange-600", text: "text-orange-700" },
    blue:   { bg: "bg-blue-50/60 border-blue-100",   icon: "bg-blue-100 text-blue-600",   text: "text-blue-700"   },
    purple: { bg: "bg-purple-50/60 border-purple-100", icon: "bg-purple-100 text-purple-600", text: "text-purple-700" },
    red:    { bg: "bg-red-50/60 border-red-100",    icon: "bg-red-100 text-red-600",    text: "text-red-700"    },
  }[color];

  const inner = (
    <div className={`border ${colors.bg} rounded-2xl p-5 flex items-center gap-4 transition-all duration-200 ${href ? "cursor-pointer hover:shadow-md hover:scale-[1.01] active:scale-[0.99]" : ""}`}>
      <div className={`${colors.icon} rounded-xl p-3 shrink-0`}>{icon}</div>
      <div className="text-right">
        <p className="text-xs text-gray-500 font-bold leading-snug">{label}</p>
        <p className={`text-xl sm:text-2xl font-black mt-0.5 ${colors.text}`}>{value}</p>
      </div>
    </div>
  );

  if (href) return <Link href={href} className="block">{inner}</Link>;
  return inner;
}

export default function DashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState<Awaited<ReturnType<typeof getDashboardStats>> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedMonth, setSelectedMonth] = useState(() => localDate().slice(0, 7));

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError("");
      try {
        const result = await getDashboardStats(selectedMonth);
        if (!cancelled) setStats(result);
      } catch {
        if (!cancelled) setError("تعذر تحميل الإحصائيات. حاول مرة أخرى.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [selectedMonth]);

  async function handleLogout() {
    await signOut(auth);
    router.push("/");
  }

  return (
    <div className="min-h-full bg-gray-50/50 pb-24 sm:pb-8">
      <Navbar />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="flex items-center justify-between gap-4 mb-6">
          <h2 className="text-xl sm:text-2xl font-black text-gray-900">نظرة عامة</h2>
          
          <div className="flex items-center gap-2">
            <input
              type="month"
              aria-label="شهر الإيرادات والمصاريف"
              value={selectedMonth}
              onChange={(e) => e.target.value && setSelectedMonth(e.target.value)}
              className="px-3.5 py-2 rounded-xl border border-gray-200 bg-white text-gray-900 text-sm font-semibold shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition cursor-pointer"
            />

            {/* Mobile Logout Button */}
            <button
              onClick={handleLogout}
              className="sm:hidden p-2.5 rounded-xl border border-gray-200 bg-white text-gray-500 hover:text-red-600 hover:bg-red-50 hover:border-red-100 transition shadow-sm active:scale-95"
              title="تسجيل الخروج"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        </div>

        <p className="text-xs text-gray-500 mb-4">أرقام الأعضاء حسب حالتهم اليوم، والإيرادات والمصاريف حسب الشهر المختار.</p>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-gray-100 rounded-2xl h-24 animate-pulse border border-gray-150" />
            ))}
          </div>
        ) : error || !stats ? (
          <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error || "تعذر تحميل الإحصائيات."}</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <StatCard
              label="الأعضاء النشطون حالياً"
              value={stats.activeMembers}
              color="green"
              href="/customers?filter=active"
              icon={
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              }
            />
            <StatCard
              label="تنتهي خلال 3 أيام"
              value={stats.expiringSoon}
              color="orange"
              href="/customers?filter=expiring"
              icon={
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              }
            />
            <StatCard
              label="إيرادات الاشتراكات"
              value={`${stats.subscriptionRevenue.toLocaleString()} جنيه`}
              color="blue"
              icon={
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              }
            />
            <StatCard
              label="اشتراكات منتهية حالياً"
              value={stats.expiredMembers}
              color="red"
              href="/customers?filter=expired"
              icon={
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              }
            />
            <StatCard
              label="المصاريف"
              value={`${stats.totalExpenses.toLocaleString()} جنيه`}
              color="red"
              href="/expenses"
              icon={
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              }
            />
            <StatCard
              label="صافي الربح"
              value={`${stats.netProfit.toLocaleString()} جنيه`}
              color="blue"
              icon={
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              }
            />
          </div>
        )}
      </main>
    </div>
  );
}
