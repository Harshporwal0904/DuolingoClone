"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { api, UserMe, Exercise } from "../../../lib/api";

type Chip = {
  id: number;
  word: string;
};

export default function LessonPlayerPage() {
  const params = useParams();
  const router = useRouter();
  const skillId = Number(params.skillId);

  // States
  const [user, setUser] = useState<UserMe | null>(null);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [lessonId, setLessonId] = useState<number | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // User input states
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [wordBank, setWordBank] = useState<Chip[]>([]);
  const [selectedChips, setSelectedChips] = useState<Chip[]>([]);
  const [typeAnswer, setTypeAnswer] = useState("");

  // Feedback and modal states
  const [checking, setChecking] = useState(false);
  const [hasChecked, setHasChecked] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [correctAnswerServer, setCorrectAnswerServer] = useState("");
  const [correctCount, setCorrectCount] = useState(0);

  const [showHeartsModal, setShowHeartsModal] = useState(false);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [refilling, setRefilling] = useState(false);

  // Completed metrics
  const [completionStats, setCompletionStats] = useState<{
    xp_earned: number;
    new_total_xp: number;
    streak_count: number;
    crowns: number;
  } | null>(null);

  useEffect(() => {
    const initLesson = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch next lesson for skill
        const progress = await api.getSkillProgress(skillId);
        const lessonExercises = await api.getLessonExercises(progress.next_lesson_id);
        const userData = await api.getUserMe();

        if (lessonExercises.length === 0) {
          throw new Error("No exercises found for this lesson.");
        }

        setLessonId(progress.next_lesson_id);
        setExercises(lessonExercises);
        setUser(userData);
        setCurrentIndex(0);
      } catch (err: any) {
        console.error(err);
        setError(err.message || "Failed to load lesson. Please make sure backend is online.");
      } finally {
        setLoading(false);
      }
    };

    if (skillId) {
      initLesson();
    }
  }, [skillId]);

  // Load chip bank when current exercise changes (specifically for Translate)
  const currentExercise = exercises[currentIndex];
  useEffect(() => {
    if (currentExercise) {
      // Clear inputs
      setSelectedOption(null);
      setSelectedChips([]);
      setTypeAnswer("");
      setHasChecked(false);
      setIsCorrect(null);
      setCorrectAnswerServer("");

      if (currentExercise.type === "translate" && currentExercise.options) {
        setWordBank(
          currentExercise.options.map((word, idx) => ({
            id: idx,
            word,
          }))
        );
      }
    }
  }, [currentIndex, currentExercise]);

  const handleChipTap = (chip: Chip) => {
    if (hasChecked) return;
    // Remove from bank, add to selected
    setWordBank(wordBank.filter((c) => c.id !== chip.id));
    setSelectedChips([...selectedChips, chip]);
  };

  const handleSelectedChipTap = (chip: Chip) => {
    if (hasChecked) return;
    // Remove from selected, return to bank (sort by ID to preserve order)
    setSelectedChips(selectedChips.filter((c) => c.id !== chip.id));
    setWordBank([...wordBank, chip].sort((a, b) => a.id - b.id));
  };

  const getAnswerString = () => {
    if (!currentExercise) return "";
    switch (currentExercise.type) {
      case "multiple_choice":
        return selectedOption || "";
      case "translate":
        return selectedChips.map((c) => c.word).join(" ");
      case "type_answer":
        return typeAnswer;
      default:
        return "";
    }
  };

  const isAnswerEmpty = () => {
    return getAnswerString().trim() === "";
  };

  const handleCheck = async () => {
    if (!currentExercise || lessonId === null || hasChecked || checking || isAnswerEmpty()) return;

    try {
      setChecking(true);
      const answer = getAnswerString();
      const res = await api.checkExerciseAnswer(lessonId, currentExercise.id, answer);

      setIsCorrect(res.correct);
      setCorrectAnswerServer(res.correct_answer);
      setHasChecked(true);

      if (res.correct) {
        setCorrectCount((prev) => prev + 1);
      } else {
        // Decrement local user hearts
        setUser((prevUser) => {
          if (!prevUser) return null;
          return {
            ...prevUser,
            hearts: Math.max(0, prevUser.hearts - 1),
          };
        });
      }
    } catch (err) {
      alert("Error checking answer. Please verify connection.");
    } finally {
      setChecking(false);
    }
  };

  const handleContinue = async () => {
    if (!hasChecked || lessonId === null) return;

    // Check hearts
    if (user && user.hearts === 0 && !isCorrect) {
      setShowHeartsModal(true);
      return;
    }

    if (currentIndex < exercises.length - 1) {
      // Move to next exercise
      setCurrentIndex((prev) => prev + 1);
    } else {
      // Completed all exercises!
      try {
        setChecking(true);
        const res = await api.completeLesson(lessonId, correctCount, exercises.length);
        setCompletionStats({
          xp_earned: res.xp_earned,
          new_total_xp: res.new_total_xp,
          streak_count: res.streak_count,
          crowns: res.crowns,
        });
        setShowCompleteModal(true);
      } catch (err) {
        alert("Failed to submit lesson completion. Check backend connection.");
      } finally {
        setChecking(false);
      }
    }
  };

  const handleRefillHearts = async () => {
    if (refilling) return;
    try {
      setRefilling(true);
      const updatedUser = await api.refillHearts();
      setUser(updatedUser);
      setShowHeartsModal(false);
    } catch (err) {
      alert("Failed to refill hearts.");
    } finally {
      setRefilling(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-white">
        <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-[#58CC02]"></div>
        <p className="mt-4 font-bold text-gray-500 text-lg">Loading exercises...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-white px-4 text-center">
        <div className="text-6xl mb-4">⚠️</div>
        <h1 className="text-2xl font-extrabold text-gray-800 mb-2">Lesson Load Failed</h1>
        <p className="text-gray-500 max-w-md mb-6">{error}</p>
        <button
          onClick={() => router.push("/")}
          className="px-6 py-3 bg-[#58CC02] hover:bg-[#46a302] text-white font-extrabold rounded-2xl border-b-4 border-[#46a302] hover:border-b-0 hover:translate-y-[4px] transition-all cursor-pointer"
        >
          Back to Path
        </button>
      </div>
    );
  }

  // Progress Bar segments calculation
  const progressPercent = ((currentIndex) / exercises.length) * 100;

  return (
    <div className="flex flex-col min-h-screen bg-white font-sans text-gray-800">
      {/* 1. Header (Progress & Hearts) */}
      <header className="max-w-2xl w-full mx-auto px-6 py-6 flex items-center justify-between gap-4">
        {/* Close Button */}
        <Link href="/" className="text-gray-400 hover:text-gray-600 text-3xl font-extrabold select-none">
          ✕
        </Link>

        {/* Progress Bar */}
        <div className="flex-1 bg-gray-100 h-4 rounded-full overflow-hidden">
          <div
            className="bg-[#58cc02] h-full transition-all duration-300 rounded-full"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Hearts Status */}
        <div className="flex items-center gap-2 text-red-500 font-extrabold text-lg select-none">
          <span>❤️</span>
          <span>{user?.hearts}</span>
        </div>
      </header>

      {/* 2. Main Exercise Content Area */}
      <main className="flex-1 max-w-xl w-full mx-auto px-6 py-8 flex flex-col justify-center pb-32">
        {currentExercise && (
          <div className="flex-1 flex flex-col">
            {/* Exercise Title Prompt */}
            <h2 className="text-2xl font-extrabold text-gray-800 mb-6 text-center md:text-left select-none">
              {currentExercise.type === "multiple_choice" && "Select the correct option"}
              {currentExercise.type === "translate" && "Translate the word"}
              {currentExercise.type === "type_answer" && "Type the translation"}
            </h2>

            {/* Prompt sentence bubble */}
            <div className="flex items-start gap-4 mb-8 bg-gray-50 border-2 border-[#e5e5e5] rounded-3xl p-6 relative">
              <span className="text-4xl select-none">🦉</span>
              <div className="flex-1">
                <p className="text-lg font-bold text-gray-700">{currentExercise.prompt}</p>
              </div>
            </div>

            {/* Sub-component: Multiple Choice */}
            {currentExercise.type === "multiple_choice" && (
              <div className="flex flex-col gap-3">
                {currentExercise.options?.map((option) => {
                  const isSelected = selectedOption === option;
                  return (
                    <button
                      key={option}
                      disabled={hasChecked}
                      onClick={() => setSelectedOption(option)}
                      className={`w-full text-left px-6 py-4 border-2 rounded-2xl text-base font-extrabold transition-all border-[#e5e5e5] border-b-4 hover:bg-gray-50 active:translate-y-[2px] active:border-b-2 cursor-pointer ${
                        isSelected
                          ? "bg-[#ddf4ff] border-[#84d8ff] text-[#1899d6] hover:bg-[#ddf4ff] border-b-4 border-b-[#1899d6]"
                          : ""
                      }`}
                    >
                      {option}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Sub-component: Translate Word Bank */}
            {currentExercise.type === "translate" && (
              <div className="flex flex-col gap-6">
                {/* Answer construction zone */}
                <div className="min-h-16 border-b-2 border-[#e5e5e5] py-2 flex flex-wrap gap-2 items-center">
                  {selectedChips.map((chip) => (
                    <button
                      key={chip.id}
                      disabled={hasChecked}
                      onClick={() => handleSelectedChipTap(chip)}
                      className="px-4 py-2 bg-white border-2 border-[#e5e5e5] border-b-4 rounded-xl font-extrabold text-sm active:translate-y-[2px] active:border-b-2 transition-all hover:bg-gray-50 text-gray-700 cursor-pointer"
                    >
                      {chip.word}
                    </button>
                  ))}
                </div>

                {/* Word Bank area */}
                <div className="flex flex-wrap gap-2 justify-center py-4">
                  {wordBank.map((chip) => (
                    <button
                      key={chip.id}
                      disabled={hasChecked}
                      onClick={() => handleChipTap(chip)}
                      className="px-4 py-2 bg-white border-2 border-[#e5e5e5] border-b-4 rounded-xl font-extrabold text-sm active:translate-y-[2px] active:border-b-2 transition-all hover:bg-gray-50 text-gray-700 cursor-pointer"
                    >
                      {chip.word}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Sub-component: Type Answer */}
            {currentExercise.type === "type_answer" && (
              <div className="w-full">
                <input
                  type="text"
                  disabled={hasChecked}
                  value={typeAnswer}
                  onChange={(e) => setTypeAnswer(e.target.value)}
                  placeholder="Type your answer here..."
                  className="w-full p-4 border-2 border-[#e5e5e5] border-b-4 rounded-2xl font-extrabold focus:outline-none focus:border-[#84d8ff] transition-all bg-white text-gray-800"
                />
              </div>
            )}
          </div>
        )}
      </main>

      {/* 3. Sticky Bottom Check / Feedback Bar */}
      <footer
        className={`fixed bottom-0 left-0 right-0 py-6 px-6 border-t-2 z-30 transition-colors duration-300 ${
          hasChecked
            ? isCorrect
              ? "bg-[#d7ffb8] border-[#58cc02]"
              : "bg-[#ffdfe0] border-[#ff4b4b]"
            : "bg-white border-[#e5e5e5]"
        }`}
      >
        <div className="max-w-xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Answer feedback message */}
          {hasChecked ? (
            <div className="flex items-center gap-3">
              <span className="text-3xl select-none">{isCorrect ? "✅" : "❌"}</span>
              <div className="flex flex-col">
                <span
                  className={`font-extrabold text-lg ${
                    isCorrect ? "text-[#58cc02]" : "text-[#ea2b2b]"
                  }`}
                >
                  {isCorrect ? "Nice!" : "Correct solution:"}
                </span>
                {!isCorrect && (
                  <span className="text-sm font-bold text-[#ea2b2b]">
                    {correctAnswerServer}
                  </span>
                )}
              </div>
            </div>
          ) : (
            <div className="hidden md:block text-gray-400 font-bold text-sm">
              Press enter to check answer
            </div>
          )}

          {/* Action Button */}
          {!hasChecked ? (
            <button
              onClick={handleCheck}
              disabled={isAnswerEmpty() || checking}
              className={`w-full md:w-auto px-10 py-3 rounded-2xl font-extrabold border-b-4 active:border-b-0 active:translate-y-[4px] transition-all cursor-pointer ${
                isAnswerEmpty()
                  ? "bg-gray-200 border-gray-300 text-gray-400 cursor-not-allowed"
                  : "bg-[#58cc02] border-[#46a302] text-white hover:bg-[#46a302]"
              }`}
            >
              Check Answer
            </button>
          ) : (
            <button
              onClick={handleContinue}
              className={`w-full md:w-auto px-10 py-3 rounded-2xl font-extrabold text-white border-b-4 active:border-b-0 active:translate-y-[4px] transition-all cursor-pointer ${
                isCorrect
                  ? "bg-[#58cc02] border-[#46a302] hover:bg-[#46a302]"
                  : "bg-[#ff4b4b] border-[#ea2b2b] hover:bg-[#ea2b2b]"
              }`}
            >
              Continue
            </button>
          )}
        </div>
      </footer>

      {/* 4. Modal: Out of Hearts */}
      {showHeartsModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center border-2 border-gray-100 shadow-xl">
            <span className="text-7xl mb-4 block select-none">🦉💔</span>
            <h3 className="text-2xl font-extrabold text-gray-800 mb-2">Out of Hearts!</h3>
            <p className="text-gray-500 mb-6 font-medium">
              You ran out of hearts. Refill them instantly to continue learning or return home.
            </p>
            <div className="flex flex-col gap-3">
              <button
                onClick={handleRefillHearts}
                disabled={refilling}
                className="w-full py-3 bg-[#58CC02] hover:bg-[#46a302] text-white font-extrabold rounded-2xl border-b-4 border-[#46a302] hover:border-b-0 hover:translate-y-[4px] transition-all cursor-pointer"
              >
                {refilling ? "Refilling..." : "Refill Hearts"}
              </button>
              <button
                onClick={() => router.push("/")}
                className="w-full py-3 bg-white hover:bg-gray-50 text-gray-500 font-extrabold rounded-2xl border-2 border-[#e5e5e5] border-b-4 active:translate-y-[2px] transition-all cursor-pointer"
              >
                No Thanks, Go Home
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. Modal: Lesson Complete */}
      {showCompleteModal && completionStats && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full text-center border-2 border-gray-100 shadow-xl relative overflow-hidden">
            {/* Confetti Emoji Celebration Ring */}
            <div className="absolute top-0 left-0 right-0 h-2 bg-[#58cc02]" />
            
            <span className="text-7xl mb-4 block select-none animate-bounce">🎉🏆🦉</span>
            <h3 className="text-3xl font-extrabold text-[#58cc02] mb-4">Lesson Complete!</h3>
            
            {/* Completion stats badges */}
            <div className="grid grid-cols-2 gap-4 mb-8">
              <div className="bg-green-50 border-2 border-green-200 rounded-2xl p-4 flex flex-col items-center">
                <span className="text-2xl mb-1">⚡</span>
                <span className="text-xs font-extrabold text-green-600 uppercase tracking-wide">XP Earned</span>
                <span className="text-2xl font-extrabold text-green-700">+{completionStats.xp_earned}</span>
              </div>
              <div className="bg-orange-50 border-2 border-orange-200 rounded-2xl p-4 flex flex-col items-center">
                <span className="text-2xl mb-1">🔥</span>
                <span className="text-xs font-extrabold text-orange-600 uppercase tracking-wide">Streak</span>
                <span className="text-2xl font-extrabold text-orange-700">{completionStats.streak_count} Days</span>
              </div>
            </div>

            <p className="text-gray-500 mb-6 font-bold text-sm">
              Keep learning every day to grow your streak!
            </p>

            <button
              onClick={() => router.push("/")}
              className="w-full py-3 bg-[#58CC02] hover:bg-[#46a302] text-white font-extrabold rounded-2xl border-b-4 border-[#46a302] hover:border-b-0 hover:translate-y-[4px] transition-all cursor-pointer"
            >
              Continue to Path
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
