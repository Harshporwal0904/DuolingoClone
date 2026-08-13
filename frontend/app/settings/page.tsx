"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api, UserMe } from "../../lib/api";

export default function SettingsPage() {
  const [user, setUser] = useState<UserMe | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refilling, setRefilling] = useState(false);

  const fetchData = async () => {
    try {
      setError(null);
      const userData = await api.getUserMe();
      setUser(userData);
    } catch (err: any) {
      console.error(err);
      setError("Could not retrieve settings data. Ensure the backend server is running.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRefillHearts = async () => {
    if (!user || refilling) return;
    try {
      setRefilling(true);
      const updatedUser = await api.refillHearts();
      setUser(updatedUser);
    } catch (err) {
      alert("Failed to refill hearts.");
    } finally {
      setRefilling(false);
    }
  };

  const handleRowClick = (settingName: string) => {
    alert(`${settingName} settings are coming soon!`);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-white">
        <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-[#58CC02]"></div>
        <p className="mt-4 font-bold text-gray-500 text-lg">Loading settings...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-white px-4 text-center">
        <div className="text-6xl mb-4">⚠️</div>
        <h1 className="text-2xl font-extrabold text-gray-800 mb-2">Connection Error</h1>
        <p className="text-gray-500 max-w-md mb-6">{error}</p>
        <button
          onClick={() => {
            setLoading(true);
            fetchData();
          }}
          className="px-6 py-3 bg-[#58CC02] hover:bg-[#46a302] text-white font-extrabold rounded-2xl border-b-4 border-[#46a302] hover:border-b-0 hover:translate-y-[4px] transition-all cursor-pointer"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-1 min-h-screen bg-white">
      {/* 1. Left Sidebar (Desktop Navigation) */}
      <aside className="hidden md:flex flex-col w-64 fixed h-screen border-r border-[#e5e5e5] px-4 py-6 bg-white shrink-0 z-20">
        <div className="flex items-center gap-2 mb-8 px-2">
          <span className="text-3xl font-extrabold text-[#58cc02] tracking-wider select-none font-sans">
            duolingo
          </span>
        </div>

        <nav className="flex flex-col gap-2">
          <Link
            href="/"
            className="flex items-center gap-4 px-4 py-3 text-gray-500 font-extrabold rounded-2xl hover:bg-gray-100 transition-all cursor-pointer"
          >
            <span className="text-2xl">🏡</span>
            <span>LEARN</span>
          </Link>
          <Link
            href="/profile"
            className="flex items-center gap-4 px-4 py-3 text-gray-500 font-extrabold rounded-2xl hover:bg-gray-100 transition-all cursor-pointer"
          >
            <span className="text-2xl">🛡️</span>
            <span>PROFILE & LEADERBOARD</span>
          </Link>
          <Link
            href="/settings"
            className="flex items-center gap-4 px-4 py-3 bg-[#ddf4ff] border-2 border-[#84d8ff] text-[#1899d6] font-extrabold rounded-2xl transition-all"
          >
            <span className="text-2xl">⚙️</span>
            <span>SETTINGS</span>
          </Link>
        </nav>
      </aside>

      {/* Main container offsetting the sticky sidebar */}
      <div className="flex-1 flex flex-col md:pl-64 min-h-screen">
        {/* 2. Sticky Top Bar (User stats) */}
        <header className="sticky top-0 bg-white border-b border-[#e5e5e5] h-16 flex items-center justify-between px-6 z-30">
          <span className="md:hidden font-extrabold text-[#58cc02] text-2xl">duolingo</span>
          
          <div className="flex items-center gap-6 ml-auto font-extrabold text-sm md:text-base">
            <div className="flex items-center gap-2 text-orange-500" title="Daily Streak">
              <span className="text-2xl">🔥</span>
              <span>{user?.streak_count}</span>
            </div>
            <div className="flex items-center gap-2 text-[#58cc02]" title="Total XP">
              <span className="text-2xl">⚡</span>
              <span>{user?.total_xp} XP</span>
            </div>
            <div 
              onClick={handleRefillHearts}
              className={`flex items-center gap-2 cursor-pointer select-none group transition-all p-1 rounded-lg ${user && user.hearts < 5 ? "hover:bg-red-50 text-red-500" : "text-red-500"}`}
              title={user && user.hearts < 5 ? "Click to Refill Hearts!" : "Hearts Full!"}
            >
              <span className="text-2xl transition-transform group-hover:scale-110">❤️</span>
              <span>{user?.hearts}</span>
              {user && user.hearts < 5 && (
                <span className="hidden sm:inline text-xs text-blue-500 font-bold ml-1 group-hover:underline">
                  (Refill)
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 text-sky-400" title="Gems">
              <span className="text-2xl">💎</span>
              <span>{user?.gems}</span>
            </div>
          </div>
        </header>

        {/* 3. Settings List Section */}
        <main className="flex-1 w-full max-w-xl mx-auto px-6 py-8 pb-24">
          <h2 className="text-2xl font-extrabold text-gray-800 mb-6">Settings</h2>
          
          <div className="border-2 border-[#e5e5e5] rounded-3xl overflow-hidden shadow-sm">
            <div className="flex flex-col">
              {["Account", "Notifications", "Sound Effects"].map((setting) => (
                <button
                  key={setting}
                  onClick={() => handleRowClick(setting)}
                  className="w-full flex items-center justify-between px-6 py-5 border-b border-[#e5e5e5] last:border-b-0 hover:bg-gray-50 active:bg-gray-100 transition-colors font-extrabold text-left text-gray-700 cursor-pointer"
                >
                  <span className="text-base">{setting}</span>
                  <span className="text-gray-400 font-bold text-sm flex items-center gap-1">
                    Edit <span>❯</span>
                  </span>
                </button>
              ))}
            </div>
          </div>
        </main>
      </div>

      {/* 4. Mobile Navigation Bottom Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 border-t border-[#e5e5e5] bg-white flex items-center justify-around px-4 z-40">
        <Link href="/" className="flex flex-col items-center text-gray-400 font-extrabold text-xs gap-0.5 opacity-55">
          <span className="text-2xl">🏡</span>
          <span>Learn</span>
        </Link>
        <Link href="/profile" className="flex flex-col items-center text-gray-400 font-extrabold text-xs gap-0.5 opacity-55">
          <span className="text-2xl">🛡️</span>
          <span>Profile</span>
        </Link>
        <Link href="/settings" className="flex flex-col items-center text-[#1899d6] font-extrabold text-xs gap-0.5">
          <span className="text-2xl">⚙️</span>
          <span>Settings</span>
        </Link>
      </nav>
    </div>
  );
}
