import type { Game } from "#/routes/app/games";
import { Ban, CheckCircle } from "lucide-react";
import { useState } from "react";

function GameCard({
  game,
  onToggle,
}: {
  game: Game;
  onToggle: (id: string) => void;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      className="flex flex-col items-center gap-2 cursor-pointer select-none"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Card */}
      <div
        className="relative w-[190px] h-[220px] rounded-2xl overflow-hidden"
        style={{ opacity: game.enabled ? 1 : 0.5 }}
      >
        {/* Background gradient */}
        <div
          className={`absolute inset-0 bg-linear-to-br ${game.color}`}
        />

        {/* Disabled badge */}
        {!game.enabled && (
          <div className="absolute top-3 right-3 z-10 bg-black/50 rounded-full px-2.5 py-0.5">
            <span className="text-white/90 font-semibold text-xs">Disabled</span>
          </div>
        )}

        {/* Game visual */}
        <div className="relative z-5 flex flex-col items-center justify-center h-full p-4">
          <div className="text-6xl mb-3 drop-shadow-lg">{game.emoji}</div>
          <h3 className="text-white font-extrabold text-xl uppercase tracking-wide drop-shadow">
            {game.name}
          </h3>
          <p className="text-white/70 text-xs mt-1 text-center">
            {game.tagline}
          </p>
        </div>
      </div>

      <div
        className={`transition-all duration-200 ease-out ${
          hovered
            ? "opacity-100 translate-y-0 pointer-events-auto"
            : "opacity-0 -translate-y-1 pointer-events-none"
        }`}
      >
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggle(game.id);
          }}
          className={`flex items-center gap-2 rounded-full px-5 py-2 font-semibold text-sm border transition-colors shadow-sm ${
            game.enabled
              ? "border-gray-300 bg-white text-gray-700 hover:border-red-400 hover:text-red-600"
              : "border-green-400 bg-white text-green-600 hover:bg-green-50"
          }`}
        >
          {game.enabled ? (
            <>
              <Ban className="h-3.5 w-3.5" />
              Disable game
            </>
          ) : (
            <>
              <CheckCircle className="h-3.5 w-3.5" />
              Enable game
            </>
          )}
        </button>
      </div>
    </div>
  );
}

export default GameCard;