import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import SortIcon from "@/logo/sort.svg?react";
import GameCard from "#/components/GameCard";
import { fetchApi } from "#/lib/api";

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

interface APIGame {
  id: string;
  name: string;
  code: string;
  imageUrl: string | null;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

const GAME_METADATA: Record<string, { tagline: string, type: string, color: string, accentColor: string, emoji: string }> = {
  blackjack: { tagline: "Classic card game", type: "Card game", color: "from-green-600 to-green-800", accentColor: "#16A34A", emoji: "🃏" },
  blocks: { tagline: "Building puzzle", type: "Puzzle game", color: "from-blue-500 to-indigo-700", accentColor: "#4F46E5", emoji: "🧱" },
  EAGLEHB: { tagline: "For filling game", type: "For filling game", color: "from-emerald-500 to-teal-700", accentColor: "#10B981", emoji: "🦅" },
  LAGOSRUSH: { tagline: "For filling game", type: "For filling game", color: "from-orange-500 to-red-600", accentColor: "#F97316", emoji: "🏎️" },
  LUCKYRISEHB: { tagline: "For filling game", type: "For filling game", color: "from-yellow-400 to-amber-600", accentColor: "#FBBF24", emoji: "🍀" },
  plinko: { tagline: "Drop the ball", type: "Arcade game", color: "from-pink-500 to-rose-700", accentColor: "#E11D48", emoji: "🎯" },
  slots: { tagline: "Spin to win", type: "Casino game", color: "from-yellow-500 to-orange-600", accentColor: "#F59E0B", emoji: "777" },
  solitaire: { tagline: "Single player card", type: "Card game", color: "from-cyan-500 to-blue-600", accentColor: "#0284C7", emoji: "♠️" },
  twentyone: { tagline: "Reach 21", type: "Card game", color: "from-red-500 to-red-700", accentColor: "#DC2626", emoji: "21" },
  XCAPEHB: { tagline: "Crash game", type: "Crash game", color: "from-purple-500 to-violet-700", accentColor: "#8B5CF6", emoji: "🚀" },
};

function GamesPage() {
  const [sort, setSort] = useState<"asc" | "desc">("asc");
  const navigate = useNavigate();

  const { data: apiGames = [], isLoading } = useQuery({
    queryKey: ["games"],
    queryFn: async () => {
      const res = await fetchApi<APIGame[]>("/games");
      if (!res.success) throw new Error(res.error || "Failed to fetch games");
      return res.data || [];
    }
  });

  console.log({apiGames})

  const games: Game[] = apiGames
    .filter((g) => g.enabled) // Only show enabled games
    .map((g) => {
      const meta = GAME_METADATA[g.code] || {
        tagline: "Sportsdey game",
        type: "Arcade game",
        color: "from-gray-500 to-gray-700",
        accentColor: "#6B7280",
        emoji: "🎲",
      };
      return {
        id: g.id,
        name: g.name,
        tagline: meta.tagline,
        type: meta.type,
        color: meta.color,
        accentColor: meta.accentColor,
        enabled: g.enabled,
        emoji: meta.emoji,
      };
    });

  const sortedGames = [...games].sort((a, b) => {
    if (sort === "asc") return a.name.localeCompare(b.name);
    return b.name.localeCompare(a.name);
  });

  const handleToggle = (id: string) => {
    // Optional: implement api call to toggle game enabled status
    console.log("Toggle game status", id);
  };

  return (
    <div className="flex h-[calc(100vh-120px)] flex-col gap-6 overflow-hidden">
      {/* Sticky Header */}
      <div className="flex-none flex items-center justify-between px-8">
        <div>
          <h2 className="font-bold text-2xl text-gray-900">All Games</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            <span 
              className="relative font-medium cursor-pointer text-[#001A26] after:absolute after:bottom-0 after:left-0 after:h-px after:w-0 after:bg-[#001A26] after:transition-all after:duration-500 hover:after:w-full"
              onClick={() => navigate({ to: "/app" })}
            >Dashboard</span> &rsaquo; Games management
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
        </div>
      </div>

      {/* Scrollable Games Grid */}
      <div className="flex-1 overflow-y-auto custom-scrollbar pb-4 px-8">
        {isLoading ? (
          <div className="flex justify-center items-center h-40">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 2xl:grid-cols-5 gap-x-4 gap-y-8">
            {sortedGames.length > 0 ? (
              sortedGames.map((game) => (
                <GameCard key={game.id} game={game} onToggle={handleToggle} />
              ))
            ) : (
              <div className="col-span-full text-center text-gray-500 py-10">
                No active games found.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
