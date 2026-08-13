"use client";

import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

export default function LessonPlaceholderPage() {
  const params = useParams();
  const router = useRouter();
  const skillId = params.skillId;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-white px-6 py-12 text-center">
      <div className="max-w-md w-full border-2 border-[#e5e5e5] rounded-3xl p-8 shadow-sm">
        <span className="text-6xl mb-4 block">📚</span>
        <h1 className="text-2xl font-extrabold text-gray-800 mb-2">Lesson Player</h1>
        <p className="text-gray-500 mb-6">
          You are about to start a lesson for Skill ID: <span className="font-extrabold text-[#58cc02]">#{skillId}</span>.
          The interactive lesson player is coming up in the next step!
        </p>

        <div className="flex flex-col gap-3">
          <button
            onClick={() => router.push("/")}
            className="w-full py-3 bg-[#58CC02] hover:bg-[#46a302] text-white font-extrabold rounded-2xl border-b-4 border-[#46a302] hover:border-b-0 hover:translate-y-[4px] transition-all cursor-pointer"
          >
            Go Back to Path
          </button>
          
          <Link
            href="/"
            className="text-gray-400 hover:text-gray-600 font-extrabold text-sm transition-all"
          >
            Cancel
          </Link>
        </div>
      </div>
    </div>
  );
}
