import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import SortIcon from "@/logo/sort.svg?react";
import GameCard from "#/components/GameCard";
import { fetchApi } from "#/lib/api";

import Img21 from "#/assets/21.png";
import Img777 from "#/assets/777.png";
import ImgBlackjack from "#/assets/BlackJack.png";
import ImgBlocks from "#/assets/Blocks.png";
import ImgPlinko from "#/assets/Plinko.png";
import ImgSolitaire from "#/assets/Solitaire.png";
import ImgEagle from "#/assets/eagle_lite.jpg";
import ImgLagosRush from "#/assets/lagos-rush.png";
import ImgLuckyRise from "#/assets/lucky_rise.png";
import ImgXcape from "#/assets/xcape.png";

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
  image: string;
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

const GAMES = [
  { name: "Solitaire", code: "solitaire" },
  { name: "Blocks", code: "blocks" },
  { name: "Twenty One", code: "twentyone" },
  { name: "Blackjack", code: "blackjack" },
  { name: "Slots", code: "slots" },
  { name: "Plinko", code: "plinko" },
  { name: "Xcape", code: "XCAPEHB" },
  { name: "Eagle", code: "EAGLEHB" },
  { name: "Lucky Rise", code: "LUCKYRISEHB" },
  { name: "Lagos Rush", code: "LAGOSRUSH" },
];

const GAME_METADATA: Record<string, { tagline: string, type: string, color: string, accentColor: string, image: string }> = {
  blackjack: { tagline: "Classic card game", type: "Card game", color: "from-green-600 to-green-800", accentColor: "#16A34A", image: ImgBlackjack },
  blocks: { tagline: "Building puzzle", type: "Puzzle game", color: "from-blue-500 to-indigo-700", accentColor: "#4F46E5", image: ImgBlocks },
  EAGLEHB: { tagline: "For filling game", type: "For filling game", color: "from-emerald-500 to-teal-700", accentColor: "#10B981", image: ImgEagle },
  LAGOSRUSH: { tagline: "For filling game", type: "For filling game", color: "from-orange-500 to-red-600", accentColor: "#F97316", image: ImgLagosRush },
  LUCKYRISEHB: { tagline: "For filling game", type: "For filling game", color: "from-yellow-400 to-amber-600", accentColor: "#FBBF24", image: ImgLuckyRise },
  plinko: { tagline: "Drop the ball", type: "Arcade game", color: "from-pink-500 to-rose-700", accentColor: "#E11D48", image: ImgPlinko },
  slots: { tagline: "Spin to win", type: "Casino game", color: "from-yellow-500 to-orange-600", accentColor: "#F59E0B", image: Img777 },
  solitaire: { tagline: "Single player card", type: "Card game", color: "from-cyan-500 to-blue-600", accentColor: "#0284C7", image: ImgSolitaire },
  twentyone: { tagline: "Reach 21", type: "Card game", color: "from-red-500 to-red-700", accentColor: "#DC2626", image: Img21 },
  XCAPEHB: { tagline: "Crash game", type: "Crash game", color: "from-purple-500 to-violet-700", accentColor: "#8B5CF6", image: ImgXcape },
};

function GamesPage() {
  const [sort, setSort] = useState<"asc" | "desc">("asc");
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: apiGames = [], isLoading } = useQuery({
    queryKey: ["games"],
    queryFn: async () => {
      const res = await fetchApi<APIGame[]>("/games");
      if (!res.success) throw new Error(res.error || "Failed to fetch games");
      return res.data || [];
    }
  });

  console.log({apiGames})

  const GameCodes = new Set(GAMES.map(g => g.code));

  const games: Game[] = apiGames
    .filter((g) => GameCodes.has(g.code))
    .map((g) => {
      const meta = GAME_METADATA[g.code] || {
        tagline: "Sportsdey game",
        type: "Arcade game",
        color: "from-gray-500 to-gray-700",
        accentColor: "#6B7280",
        image: ImgPlinko,
      };
      return {
        id: g.id,
        name: g.name,
        tagline: meta.tagline,
        type: meta.type,
        color: meta.color,
        accentColor: meta.accentColor,
        enabled: g.enabled,
        image: meta.image,
      };
    });

  const sortedGames = [...games].sort((a, b) => {
    if (sort === "asc") return a.name.localeCompare(b.name);
    return b.name.localeCompare(a.name);
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, isCurrentlyEnabled }: { id: string; isCurrentlyEnabled: boolean }) => {
      const action = isCurrentlyEnabled ? "disable" : "enable";
      const res = await fetchApi(`/games/${id}/${action}`, { method: "PATCH" });
      if (!res.success) throw new Error(res.error || `Failed to ${action} game`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["games"] });
      toast.success("Game status updated successfully");
    },
    onError: (error) => {
      toast.error(error.message);
    }
  });

  const handleToggle = (id: string) => {
    const game = apiGames.find(g => g.id === id);
    if (!game) return;
    toggleMutation.mutate({ id, isCurrentlyEnabled: game.enabled });
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
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 2xl:grid-cols-5 gap-x-4 gap-y-8">
          {isLoading ? (
            Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="flex flex-col items-center gap-2">
                <div className="w-[90%] h-[220px] rounded-2xl bg-gray-200 animate-pulse"></div>
              </div>
            ))
          ) : sortedGames.length > 0 ? (
            sortedGames.map((game) => (
              <GameCard key={game.id} game={game} onToggle={handleToggle} />
            ))
          ) : (
            <div className="col-span-full text-center text-gray-500 py-10">
              No active games found.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
