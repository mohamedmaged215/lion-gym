"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "../../components/Navbar";
import { addCustomer, addPayment } from "../../lib/firebaseUtils";
import { calculateEndDate, calculateStatus } from "../../lib/customerUtils";

export default function NewCustomerPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "",
    phone: "",
    subscriptionType: "monthly",
    startDate: new Date().toISOString().split("T")[0],
    durationDays: "30",
    price: "",
  });

  function set(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  const endDate =
    form.startDate && form.durationDays && form.subscriptionType === "monthly"
      ? calculateEndDate(form.startDate, Number(form.durationDays))
      : "";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    const isSession = form.subscriptionType === "session";
    const durationVal = isSession ? 0 : Number(form.durationDays);
    const endDateVal = isSession ? "" : endDate;

    if (!isSession && !endDateVal) {
      setSaving(false);
      return;
    }

    const status = calculateStatus(endDateVal, form.subscriptionType as "monthly" | "session");
    const customerId = await addCustomer({
      name: form.name.trim(),
      phone: form.phone.trim(),
      subscriptionType: form.subscriptionType as "monthly" | "session",
      startDate: form.startDate,
      endDate: endDateVal,
      durationDays: durationVal,
      price: Number(form.price),
      status,
    });
    await addPayment({ customerId, amount: Number(form.price), date: form.startDate });

    router.push("/customers");
  }

  return (
    <div className="min-h-full bg-gray-50/50 pb-24 sm:pb-8">
      <Navbar />
      <main className="max-w-lg mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="mb-6 flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="p-2.5 rounded-xl border border-gray-200 bg-white text-gray-500 hover:text-gray-900 transition shadow-sm active:scale-95 shrink-0"
            title="رجوع"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h2 className="text-xl sm:text-2xl font-black text-gray-900">إضافة اشتراك جديد</h2>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Subscription Type Switcher */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">نوع الاشتراك</label>
              <div className="grid grid-cols-2 gap-2 p-1.5 bg-gray-100/80 rounded-xl border border-gray-200/50">
                <button
                  type="button"
                  onClick={() => set("subscriptionType", "monthly")}
                  className={`py-2.5 rounded-lg text-sm font-bold transition-all duration-200 ${
                    form.subscriptionType === "monthly"
                      ? "bg-white text-blue-600 shadow-sm border border-gray-150"
                      : "text-gray-500 hover:text-gray-800"
                  }`}
                >
                  شهري
                </button>
                <button
                  type="button"
                  onClick={() => set("subscriptionType", "session")}
                  className={`py-2.5 rounded-lg text-sm font-bold transition-all duration-200 ${
                    form.subscriptionType === "session"
                      ? "bg-white text-blue-600 shadow-sm border border-gray-150"
                      : "text-gray-500 hover:text-gray-800"
                  }`}
                >
                  حصة
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5">الاسم</label>
              <input
                required
                type="text"
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
                placeholder="مثال: أحمد محمد"
                className="w-full px-4 py-3 rounded-xl border border-gray-300 bg-white text-gray-900 placeholder-gray-400 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition shadow-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5">الهاتف</label>
              <input
                required
                type="tel"
                value={form.phone}
                onChange={(e) => set("phone", e.target.value)}
                placeholder="01012345678"
                className="w-full px-4 py-3 rounded-xl border border-gray-300 bg-white text-gray-900 placeholder-gray-400 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition shadow-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5">
                {form.subscriptionType === "session" ? "تاريخ التسجيل" : "تاريخ البداية"}
              </label>
              <input
                required
                type="date"
                value={form.startDate}
                onChange={(e) => set("startDate", e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-300 bg-white text-gray-900 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition shadow-sm"
              />
            </div>

            {form.subscriptionType === "monthly" && (
              <>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1.5">المدة (أيام)</label>
                  <input
                    required
                    type="number"
                    min="1"
                    value={form.durationDays}
                    onChange={(e) => set("durationDays", e.target.value)}
                    placeholder="30"
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 bg-white text-gray-900 placeholder-gray-400 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition shadow-sm"
                  />
                </div>

                {endDate && (
                  <div className="flex items-center gap-2 px-3.5 py-3 bg-blue-50 border border-blue-100 rounded-xl text-sm text-blue-700 font-semibold shadow-sm">
                    <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    تاريخ الانتهاء: <strong>{endDate}</strong>
                  </div>
                )}
              </>
            )}

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5">السعر (جنيه)</label>
              <input
                required
                type="number"
                min="0"
                value={form.price}
                onChange={(e) => set("price", e.target.value)}
                placeholder="500"
                className="w-full px-4 py-3 rounded-xl border border-gray-300 bg-white text-gray-900 placeholder-gray-400 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition shadow-sm"
              />
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full py-3.5 rounded-xl bg-blue-600 text-white text-sm font-bold hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed transition shadow-md shadow-blue-200 mt-2"
            >
              {saving ? "جارٍ الحفظ…" : "إضافة الاشتراك"}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
