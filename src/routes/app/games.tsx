import { createFileRoute, useNavigate, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import SortIcon from "@/logo/sort.svg?react";
import GameCard from "#/components/GameCard";
import { gamesService, type ApiGame } from "#/lib/games";

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
  code: string;
  name: string;
  tagline: string;
  type: string;
  color: string;
  accentColor: string;
  enabled: boolean;
  image: string;
  category: string;
}

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
  const router = useRouter();

  const { data: apiGames = [], isLoading } = useQuery<ApiGame[]>({
    queryKey: ["games"],
    queryFn: async () => {
      const res = await gamesService.listGames();
      if (!res.success) throw new Error(res.error || "Failed to fetch games");
      return res.data || [];
    }
  });

  const games: Game[] = apiGames
    .map((g) => {
      const meta = GAME_METADATA[g.code] || {
        tagline: g.category || "Sportsdey game",
        type: g.category || "Arcade game",
        color: "from-blue-500 to-indigo-700",
        accentColor: "#4F46E5",
        image: g.imageUrl || ImgPlinko,
      };
      return {
        id: g.id,
        code: g.code,
        name: g.name,
        tagline: meta.tagline,
        type: meta.type,
        color: meta.color,
        accentColor: meta.accentColor,
        enabled: g.enabled,
        image: g.imageUrl || meta.image,
        category: g.category || "Others",
      };
    });

  const GAME_PRIORITY = [
    "solitaire",
    "blocks",
    "twentyone",
    "blackjack",
    "slots",
    "plinko",
    "XCAPEHB",
    "EAGLEHB",
    "LUCKYRISEHB",
    "LAGOSRUSH",
  ];

  const sortedGames = [...games].sort((a, b) => {
    const aIdx = GAME_PRIORITY.indexOf(a.code);
    const bIdx = GAME_PRIORITY.indexOf(b.code);

    if (aIdx !== -1 && bIdx !== -1) {
      return sort === "asc" ? aIdx - bIdx : bIdx - aIdx;
    }
    if (aIdx !== -1) return -1;
    if (bIdx !== -1) return 1;

    if (sort === "asc") return a.name.localeCompare(b.name);
    return b.name.localeCompare(a.name);
  });

  const gamesByCategory = sortedGames.reduce((acc, game) => {
    const cat = game.category.toLowerCase();
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(game);
    return acc;
  }, {} as Record<string, Game[]>);

  const toggleMutation = useMutation({
    mutationFn: async ({ id, isCurrentlyEnabled }: { id: string; isCurrentlyEnabled: boolean }) => {
      const res = await gamesService.toggleGame(id, !isCurrentlyEnabled);
      if (!res.success) throw new Error(res.error || "Failed to update game");
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["games"] });
      router.invalidate();
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
        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 2xl:grid-cols-5 gap-x-4 gap-y-8">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="flex flex-col items-center gap-2">
                <div className="w-full aspect-[4/5] rounded-2xl bg-gray-200 animate-pulse"></div>
              </div>
            ))}
          </div>
        ) : Object.keys(gamesByCategory).length > 0 ? (
          Object.entries(gamesByCategory).map(([category, catGames]) => (
            <div key={category} className="mb-10">
              <h3 className="mb-4 text-xl font-bold text-gray-800 capitalize">{category}</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 2xl:grid-cols-5 gap-x-4 gap-y-8">
                {catGames.map((game) => (
                  <GameCard key={game.id} game={game} onToggle={handleToggle} />
                ))}
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full text-center text-gray-500 py-10">
            No active games found.
          </div>
        )}
      </div>
    </div>
  );
}
