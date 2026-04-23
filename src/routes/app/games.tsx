import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Plus } from "lucide-react";
import SortIcon from "@/logo/sort.svg?react";
import GameCard from "#/components/GameCard";

export const Route = createFileRoute("/app/games")({
  component: GamesPage,
});

export interface Game {
  id: string;
  name: string;
  tagline: string;
  type: string;
  color: string;
  accentColor: string;
  enabled: boolean;
  emoji: string;
}

const INITIAL_GAMES: Game[] = [
  { id: "1", name: "Bayse", tagline: "Predict win model", type: "Prediction game", color: "from-blue-500 to-blue-700", accentColor: "#3B82F6", enabled: true, emoji: "🎯" },
  { id: "2", name: "Lagos Rush", tagline: "For filling game", type: "For filling game", color: "from-orange-500 to-red-600", accentColor: "#F97316", enabled: true, emoji: "🏎️" },
  { id: "3", name: "Eagle", tagline: "For filling game", type: "For filling game", color: "from-emerald-500 to-teal-700", accentColor: "#10B981", enabled: true, emoji: "🦅" },
  { id: "4", name: "Lucky Rise", tagline: "For filling game", type: "For filling game", color: "from-yellow-400 to-amber-600", accentColor: "#FBBF24", enabled: true, emoji: "🍀" },
  { id: "5", name: "Xcape", tagline: "Crash game", type: "Crash game", color: "from-purple-500 to-violet-700", accentColor: "#8B5CF6", enabled: true, emoji: "🚀" },
  { id: "6", name: "Lagos Rush", tagline: "For filling game", type: "For filling game", color: "from-orange-500 to-red-600", accentColor: "#F97316", enabled: false, emoji: "🏎️" },
  { id: "7", name: "Bayse", tagline: "Predict win model", type: "Prediction game", color: "from-blue-500 to-blue-700", accentColor: "#3B82F6", enabled: true, emoji: "🎯" },
  { id: "8", name: "Xcape", tagline: "Crash game", type: "Crash game", color: "from-purple-500 to-violet-700", accentColor: "#8B5CF6", enabled: true, emoji: "🚀" },
  { id: "9", name: "Eagle", tagline: "For filling game", type: "For filling game", color: "from-emerald-500 to-teal-700", accentColor: "#10B981", enabled: true, emoji: "🦅" },
  { id: "10", name: "Lucky Rise", tagline: "For filling game", type: "For filling game", color: "from-yellow-400 to-amber-600", accentColor: "#FBBF24", enabled: false, emoji: "🍀" },
  { id: "11", name: "Bayse", tagline: "Predict win model", type: "Prediction game", color: "from-blue-500 to-blue-700", accentColor: "#3B82F6", enabled: true, emoji: "🎯" },
  { id: "12", name: "Xcape", tagline: "Crash game", type: "Crash game", color: "from-purple-500 to-violet-700", accentColor: "#8B5CF6", enabled: true, emoji: "🚀" },
  { id: "13", name: "Lagos Rush", tagline: "For filling game", type: "For filling game", color: "from-orange-500 to-red-600", accentColor: "#F97316", enabled: true, emoji: "🏎️" },
  { id: "14", name: "Eagle", tagline: "For filling game", type: "For filling game", color: "from-emerald-500 to-teal-700", accentColor: "#10B981", enabled: true, emoji: "🦅" },
  { id: "15", name: "Lucky Rise", tagline: "For filling game", type: "For filling game", color: "from-yellow-400 to-amber-600", accentColor: "#FBBF24", enabled: true, emoji: "🍀" },
];



function GamesPage() {
  const [games, setGames] = useState<Game[]>(INITIAL_GAMES);
  	const [sort, setSort] = useState<"asc" | "desc">("asc");
    const navigate = useNavigate();

  const handleToggle = (id: string) => {
    setGames((prev) =>
      prev.map((g) => (g.id === id ? { ...g, enabled: !g.enabled } : g))
    );
  };

  return (
    <div className="flex h-[calc(100vh-120px)] flex-col gap-6 overflow-hidden">
      {/* Sticky Header */}
      <div className="flex-none flex items-center justify-between">
        <div>
          <h2 className="font-bold text-2xl text-gray-900">All Games</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            <span className="font-medium cursor-pointer text-[#001A26] hover:underline hover:transition-all hover:duration-300" onClick={() => navigate({ to: "/app" })}>Dashboard</span> &rsaquo; Games management
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSort((s) => (s === "asc" ? "desc" : "asc"))}
            className="inline-flex cursor-pointer items-center gap-2 rounded-full border-2 border-primary px-2 py-2 font-medium text-gray-900 text-sm hover:bg-gray-50"
          >
            <SortIcon className="h-3 w-3" />
            Sort
          </button>
          <button className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-[#1BAA04] px-4 py-2 font-medium text-white text-sm hover:bg-[#0ea800] shadow-sm transition-colors">
            <Plus className="h-4 w-4" />
            Add new game
          </button>
        </div>
      </div>

      {/* Scrollable Games Grid */}
      <div className="flex-1 overflow-y-auto custom-scrollbar pb-4">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-x-4 gap-y-8">
          {games.map((game) => (
            <GameCard key={game.id} game={game} onToggle={handleToggle} />
          ))}
        </div>
      </div>
    </div>
  );
}
