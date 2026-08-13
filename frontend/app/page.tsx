"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api, UserMe, PathUnit, PathSkill } from "../lib/api";

export default function HomePage() {
  const [user, setUser] = useState<UserMe | null>(null);
  const [path, setPath] = useState<PathUnit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refilling, setRefilling] = useState(false);

  const fetchData = async () => {
    try {
      setError(null);
      const [userData, pathData] = await Promise.all([
        api.getUserMe(),
        api.getPath(),
      ]);
      setUser(userData);
      setPath(pathData);
    } catch (err: any) {
      console.error(err);
      setError("Could not connect to the backend server. Make sure the FastAPI backend is running.");
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
      alert("Failed to refill hearts. Please check backend connection.");
    } finally {
      setRefilling(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-white">
        <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-[#58CC02]"></div>
        <p className="mt-4 font-bold text-gray-500 text-lg">Loading your path...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-white px-4 text-center">
        <div className="text-6xl mb-4">⚠️</div>
        <h1 className="text-2xl font-extrabold text-gray-800 mb-2">Backend Connection Failed</h1>
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

  // Simple emoji mapping for skills
  const getSkillIcon = (title: string) => {
    switch (title) {
      case "Greetings": return "👋";
      case "Food": return "🍎";
      case "Animals": return "🐶";
      case "Travel": return "✈️";
      case "Questions": return "❓";
      case "Family": return "❤️";
      default: return "⭐";
    }
  };

  // Duolingo skill colors
  const getSkillColors = (title: string, status: string) => {
    if (status === "locked") {
      return {
        bg: "bg-[#e5e5e5]",
        border: "border-[#ccc]",
        text: "text-[#afafaf]",
        darkBorder: "border-[#ccc]"
      };
    }
    switch (title) {
      case "Greetings":
        return { bg: "bg-[#58cc02]", border: "border-[#46a302]", text: "text-white", darkBorder: "border-[#3f9202]" };
      case "Food":
        return { bg: "bg-[#1cb0f6]", border: "border-[#1899d6]", text: "text-white", darkBorder: "border-[#147fb3]" };
      case "Animals":
        return { bg: "bg-[#ff9600]", border: "border-[#e07b00]", text: "text-white", darkBorder: "border-[#bf6900]" };
      case "Travel":
        return { bg: "bg-[#ff4b4b]", border: "border-[#ea2b2b]", text: "text-white", darkBorder: "border-[#c92424]" };
      case "Questions":
        return { bg: "bg-[#a560e8]", border: "border-[#8e4ad2]", text: "text-white", darkBorder: "border-[#793eb3]" };
      case "Family":
        return { bg: "bg-[#2be080]", border: "border-[#24be6c]", text: "text-white", darkBorder: "border-[#1d9a57]" };
      default:
        return { bg: "bg-[#58cc02]", border: "border-[#46a302]", text: "text-white", darkBorder: "border-[#3f9202]" };
    }
  };

  // Build leaderboard dummy entries including current user
  const leaderboardUsers = [
    { username: "maria", total_xp: 340, active: false },
    { username: "carlos", total_xp: 210, active: false },
    { username: "sofia", total_xp: 90, active: false },
    { username: user?.username || "learner", total_xp: user?.total_xp || 0, active: true }
  ].sort((a, b) => b.total_xp - a.total_xp);

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
            className="flex items-center gap-4 px-4 py-3 bg-[#ddf4ff] border-2 border-[#84d8ff] text-[#1899d6] font-extrabold rounded-2xl transition-all"
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
            className="flex items-center gap-4 px-4 py-3 text-gray-500 font-extrabold rounded-2xl hover:bg-gray-100 transition-all cursor-pointer"
          >
            <span className="text-2xl">⚙️</span>
            <span>SETTINGS</span>
          </Link>
        </nav>
      </aside>

      {/* Main container offsetting the sticky sidebar */}
      <div className="flex-1 flex flex-col md:pl-64 lg:pr-80 min-h-screen">
        {/* 2. Sticky Top Bar (User stats) */}
        <header className="sticky top-0 bg-white border-b border-[#e5e5e5] h-16 flex items-center justify-between px-6 z-30">
          <span className="md:hidden font-extrabold text-[#58cc02] text-2xl">duolingo</span>
          
          <div className="flex items-center gap-6 ml-auto font-extrabold text-sm md:text-base">
            {/* Streak */}
            <div className="flex items-center gap-2 text-orange-500" title="Daily Streak">
              <span className="text-2xl">🔥</span>
              <span>{user?.streak_count}</span>
            </div>
            {/* XP */}
            <div className="flex items-center gap-2 text-[#58cc02]" title="Total XP">
              <span className="text-2xl">⚡</span>
              <span>{user?.total_xp} XP</span>
            </div>
            {/* Hearts */}
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
            {/* Gems */}
            <div className="flex items-center gap-2 text-sky-400" title="Gems">
              <span className="text-2xl">💎</span>
              <span>{user?.gems}</span>
            </div>
          </div>
        </header>

        {/* 3. Skill Path Center Scroll */}
        <main className="flex-1 w-full max-w-xl mx-auto px-4 py-8 pb-24">
          {path.map((unit) => (
            <section key={unit.id} className="mb-12">
              {/* Unit Header Banner */}
              <div className="bg-[#58cc02] text-white rounded-3xl p-6 mb-10 shadow-[0_4px_0_0_#46a302] font-sans">
                <h2 className="text-xl font-extrabold uppercase tracking-wide">
                  Unit {unit.order_index}
                </h2>
                <p className="text-white/95 font-bold text-lg mt-1">
                  {unit.title}
                </p>
              </div>

              {/* Zig-Zag Path skills */}
              <div className="flex flex-col items-center gap-8 relative py-4">
                {unit.skills.map((skill, index) => {
                  const colors = getSkillColors(skill.title, skill.status);
                  const icon = getSkillIcon(skill.title);
                  
                  // Compute zig zag translation
                  // Indices: 0 (center), 1 (left), 2 (center), 3 (right)...
                  const shift = index % 4 === 1 ? -45 : index % 4 === 3 ? 45 : 0;
                  const isAvailable = skill.status === "available";
                  const isCompleted = skill.status === "completed";
                  const isLocked = skill.status === "locked";

                  return (
                    <div
                      key={skill.id}
                      className="relative flex flex-col items-center"
                      style={{ transform: `translateX(${shift}px)` }}
                    >
                      {/* Outer Ring / Pulsing Ring */}
                      <div className={`relative p-2 rounded-full ${isAvailable ? "pulse-node" : ""}`}>
                        {/* Node circle button */}
                        {isLocked ? (
                          <div
                            className={`w-20 h-20 rounded-full flex items-center justify-center border-b-6 ${colors.bg} ${colors.border} ${colors.darkBorder} opacity-50 grayscale cursor-not-allowed select-none`}
                          >
                            <span className="text-2xl">🔒</span>
                          </div>
                        ) : (
                          <Link
                            href={`/lesson/${skill.id}`}
                            className={`w-20 h-20 rounded-full flex items-center justify-center border-b-6 ${colors.bg} ${colors.border} ${colors.darkBorder} ${colors.text} hover:scale-105 active:scale-95 transition-all shadow-md active:border-b-0 active:translate-y-[6px] cursor-pointer`}
                          >
                            <span className="text-3xl select-none">{icon}</span>
                          </Link>
                        )}

                        {/* Crown/Crown-Check Badge */}
                        {isCompleted && (
                          <div className="absolute -top-1 -right-1 bg-yellow-400 text-yellow-900 border-2 border-white rounded-full w-7 h-7 flex items-center justify-center font-extrabold text-xs shadow-md">
                            👑 {skill.crowns}
                          </div>
                        )}
                        {isAvailable && (
                          <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-white text-[#58cc02] border-2 border-[#e5e5e5] rounded-xl px-3 py-1 font-extrabold text-xs shadow-md uppercase tracking-wider select-none animate-bounce whitespace-nowrap">
                            START
                          </div>
                        )}
                      </div>

                      {/* Title label */}
                      <span className="mt-2 font-extrabold text-sm text-gray-700 tracking-wide">
                        {skill.title}
                      </span>
                    </div>
                  );
                })}
              </div>
            </section>
          ))}
        </main>
      </div>

      {/* 4. Right Sidebar (Desktop Leaderboard & Quests) */}
      <aside className="hidden lg:flex flex-col w-80 fixed right-0 top-16 bottom-0 border-l border-[#e5e5e5] px-6 py-6 bg-white z-10 overflow-y-auto">
        {/* Daily Quests */}
        <div className="border-2 border-[#e5e5e5] rounded-3xl p-5 mb-6">
          <h3 className="font-extrabold text-lg text-gray-800 mb-4 flex items-center gap-2">
            <span>🎯</span> Daily Quests
          </h3>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <div className="flex justify-between text-xs font-bold text-gray-500">
                <span>Earn 20 XP today</span>
                <span>{user?.xp_today} / 20 XP</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
                <div 
                  className="bg-[#58cc02] h-full transition-all duration-300"
                  style={{ width: `${Math.min(100, ((user?.xp_today || 0) / 20) * 100)}%` }}
                />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-2xl">🔥</div>
              <div className="flex flex-col">
                <span className="font-extrabold text-sm text-gray-700">Keep up your streak!</span>
                <span className="text-xs text-gray-400 font-bold">{user?.streak_count} days and counting</span>
              </div>
            </div>
          </div>
        </div>

        {/* Leaderboard Snippet */}
        <div className="border-2 border-[#e5e5e5] rounded-3xl p-5">
          <h3 className="font-extrabold text-lg text-gray-800 mb-4 flex items-center gap-2">
            <span>🛡️</span> Leaderboard
          </h3>
          <div className="flex flex-col gap-3">
            {leaderboardUsers.map((item, idx) => (
              <div 
                key={item.username} 
                className={`flex items-center justify-between p-2 rounded-xl transition-all ${item.active ? "bg-green-50 border border-[#58cc02]" : ""}`}
              >
                <div className="flex items-center gap-3">
                  <span className={`w-6 text-center font-extrabold text-sm ${idx === 0 ? "text-yellow-500 text-lg" : idx === 1 ? "text-gray-400" : idx === 2 ? "text-amber-600" : "text-gray-400"}`}>
                    {idx === 0 ? "🥇" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : `${idx + 1}`}
                  </span>
                  <span className={`font-extrabold text-sm ${item.active ? "text-green-700" : "text-gray-700"}`}>
                    {item.username} {item.active && "(You)"}
                  </span>
                </div>
                <span className="font-extrabold text-sm text-gray-500">{item.total_xp} XP</span>
              </div>
            ))}
          </div>
        </div>
      </aside>

      {/* 5. Mobile Navigation Bottom Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 border-t border-[#e5e5e5] bg-white flex items-center justify-around px-4 z-40">
        <Link href="/" className="flex flex-col items-center text-[#1899d6] font-extrabold text-xs gap-0.5">
          <span className="text-2xl">🏡</span>
          <span>Learn</span>
        </Link>
        <Link href="/profile" className="flex flex-col items-center text-gray-400 font-extrabold text-xs gap-0.5 hover:text-[#1899d6]">
          <span className="text-2xl">🛡️</span>
          <span>Profile</span>
        </Link>
        <Link href="/settings" className="flex flex-col items-center text-gray-400 font-extrabold text-xs gap-0.5 hover:text-[#1899d6]">
          <span className="text-2xl">⚙️</span>
          <span>Settings</span>
        </Link>
      </nav>
    </div>
  );
}
