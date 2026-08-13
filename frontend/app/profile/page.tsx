"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api, UserMe, UserProfile, LeaderboardUser } from "../../lib/api";

export default function ProfilePage() {
  const [user, setUser] = useState<UserMe | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [advancingDay, setAdvancingDay] = useState(false);
  const [refilling, setRefilling] = useState(false);

  const fetchData = async () => {
    try {
      setError(null);
      const [userData, profileData, leaderboardData] = await Promise.all([
        api.getUserMe(),
        api.getUserProfile(),
        api.getLeaderboard(),
      ]);
      setUser(userData);
      setProfile(profileData);
      setLeaderboard(leaderboardData);
    } catch (err: any) {
      console.error(err);
      setError("Could not retrieve profile data. Ensure the backend server is running.");
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

  const handleAdvanceDay = async () => {
    if (advancingDay) return;
    try {
      setAdvancingDay(true);
      const res = await api.advanceDay();
      alert(`Success: ${res.message}. Current simulated date is: ${res.last_active_date}`);
      // Refresh statistics
      await fetchData();
    } catch (err) {
      alert("Failed to advance day.");
    } finally {
      setAdvancingDay(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-white">
        <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-[#58CC02]"></div>
        <p className="mt-4 font-bold text-gray-500 text-lg">Loading profile...</p>
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

  // Format join date, e.g. "Joined August 2026"
  const getJoinedDateString = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return `Joined ${date.toLocaleDateString("en-US", { month: "long", year: "numeric" })}`;
    } catch (e) {
      return "Joined recently";
    }
  };

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
            className="flex items-center gap-4 px-4 py-3 bg-[#ddf4ff] border-2 border-[#84d8ff] text-[#1899d6] font-extrabold rounded-2xl transition-all"
          >
            <span className="text-2xl">🛡️</span>
            <span>PROFILE & LEADERBOARD</span>
          </Link>
          <div className="flex items-center gap-4 px-4 py-3 text-gray-500 font-extrabold rounded-2xl hover:bg-gray-100 transition-all cursor-not-allowed opacity-50">
            <span className="text-2xl">🎯</span>
            <span>QUESTS</span>
          </div>
          <div className="flex items-center gap-4 px-4 py-3 text-gray-500 font-extrabold rounded-2xl hover:bg-gray-100 transition-all cursor-not-allowed opacity-50">
            <span className="text-2xl">🏪</span>
            <span>SHOP</span>
          </div>
        </nav>
      </aside>

      {/* Main container offsetting the sticky sidebar */}
      <div className="flex-1 flex flex-col md:pl-64 lg:pr-80 min-h-screen">
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

        {/* 3. Profile & Leaderboard Scroll Section */}
        <main className="flex-1 w-full max-w-xl mx-auto px-6 py-8 pb-24">
          
          {/* User Profile Card */}
          {profile && (
            <section className="mb-10">
              <h2 className="text-2xl font-extrabold text-gray-800 mb-6">Profile</h2>
              
              <div className="border-2 border-[#e5e5e5] rounded-3xl p-6 mb-6">
                {/* Header with Avatar and Username */}
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-16 h-16 rounded-full bg-[#58cc02] text-white text-3xl font-extrabold flex items-center justify-center border-2 border-white shadow-md">
                    {profile.username.slice(0, 1).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-2xl font-extrabold text-gray-800">{profile.username}</h3>
                    <p className="text-gray-400 font-bold text-sm">
                      {getJoinedDateString(profile.created_at)}
                    </p>
                  </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="border-2 border-[#e5e5e5] rounded-2xl p-3 text-center">
                    <span className="text-2xl block mb-1">🔥</span>
                    <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wide">Streak</span>
                    <span className="text-lg font-extrabold text-gray-700 block">{profile.streak_count} Days</span>
                  </div>
                  <div className="border-2 border-[#e5e5e5] rounded-2xl p-3 text-center">
                    <span className="text-2xl block mb-1">⚡</span>
                    <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wide">Total XP</span>
                    <span className="text-lg font-extrabold text-gray-700 block">{profile.total_xp}</span>
                  </div>
                  <div className="border-2 border-[#e5e5e5] rounded-2xl p-3 text-center">
                    <span className="text-2xl block mb-1">👑</span>
                    <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wide">Crowns</span>
                    <span className="text-lg font-extrabold text-gray-700 block">{profile.crowns_count}</span>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* Leaderboard League List */}
          <section id="leaderboard">
            <h2 className="text-2xl font-extrabold text-gray-800 mb-6 flex items-center gap-2">
              <span>🛡️</span> Leaderboard Standings
            </h2>
            
            <div className="border-2 border-[#e5e5e5] rounded-3xl overflow-hidden shadow-sm">
              <div className="bg-[#ddf4ff] border-b-2 border-[#84d8ff] px-6 py-4 flex items-center justify-between">
                <span className="font-extrabold text-[#1899d6] uppercase tracking-wider text-xs">
                  Bronze League standings
                </span>
                <span className="text-xs text-[#1899d6] font-bold">Top 3 advance!</span>
              </div>

              <div className="flex flex-col">
                {leaderboard.map((player) => {
                  const isSelf = player.username === user?.username;
                  return (
                    <div
                      key={player.username}
                      className={`flex items-center justify-between px-6 py-4 border-b border-[#e5e5e5] last:border-b-0 transition-colors ${
                        isSelf ? "bg-green-50 font-extrabold text-green-700" : ""
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        {/* Rank index badge */}
                        <span
                          className={`w-8 text-center font-extrabold text-sm ${
                            player.rank === 1
                              ? "text-2xl text-yellow-500"
                              : player.rank === 2
                              ? "text-2xl text-gray-400"
                              : player.rank === 3
                              ? "text-2xl text-amber-600"
                              : "text-gray-400"
                          }`}
                        >
                          {player.rank === 1 ? "🥇" : player.rank === 2 ? "🥈" : player.rank === 3 ? "🥉" : player.rank}
                        </span>

                        {/* Profile initials circle */}
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white uppercase ${
                            isSelf ? "bg-[#58cc02]" : "bg-gray-400"
                          }`}
                        >
                          {player.username.slice(0, 1)}
                        </div>

                        <span className={`font-extrabold text-sm ${isSelf ? "text-green-700" : "text-gray-700"}`}>
                          {player.username} {isSelf && "(You)"}
                        </span>
                      </div>

                      <span className={`font-extrabold text-sm ${isSelf ? "text-green-600" : "text-gray-400"}`}>
                        {player.total_xp} XP
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>

        </main>
      </div>

      {/* 4. Right Sidebar (Desktop Leaderboard Page Actions) */}
      <aside className="hidden lg:flex flex-col w-80 fixed right-0 top-16 bottom-0 border-l border-[#e5e5e5] px-6 py-6 bg-white z-10 overflow-y-auto">
        <div className="border-2 border-yellow-300 bg-yellow-50/50 rounded-3xl p-5 mb-6">
          <h3 className="font-extrabold text-lg text-yellow-700 mb-2 flex items-center gap-2">
            <span>🛠️</span> Dev Testing Tool
          </h3>
          <p className="text-xs text-yellow-600 font-bold mb-4">
            Simulate day progression to test daily goals expiration and streak count modifiers.
          </p>
          <button
            onClick={handleAdvanceDay}
            disabled={advancingDay}
            className="w-full py-3 bg-yellow-400 hover:bg-yellow-500 text-yellow-950 font-extrabold rounded-2xl border-b-4 border-yellow-600 hover:border-b-0 hover:translate-y-[4px] transition-all cursor-pointer text-sm"
          >
            {advancingDay ? "Advancing..." : "Advance Day by 1 Day"}
          </button>
        </div>
      </aside>

      {/* 5. Mobile Navigation Bottom Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 border-t border-[#e5e5e5] bg-white flex items-center justify-around px-4 z-40">
        <Link href="/" className="flex flex-col items-center text-gray-400 font-extrabold text-xs gap-0.5 opacity-55">
          <span className="text-2xl">🏡</span>
          <span>Learn</span>
        </Link>
        <Link href="/profile" className="flex flex-col items-center text-[#1899d6] font-extrabold text-xs gap-0.5">
          <span className="text-2xl">🛡️</span>
          <span>Profile</span>
        </Link>
        <div className="flex flex-col items-center text-gray-400 font-extrabold text-xs gap-0.5 opacity-50 cursor-not-allowed">
          <span className="text-2xl">🏪</span>
          <span>Shop</span>
        </div>
      </nav>
    </div>
  );
}
