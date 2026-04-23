import type { Game } from '#/routes/app/games';
import { Ban, CheckCircle } from 'lucide-react';
import { useState } from 'react'

function GameCard({ game, onToggle }: { game: Game; onToggle: (id: string) => void }) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      className="relative w-[190px] h-[220px] rounded-2xl overflow-hidden cursor-pointer select-none"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      
    >
      {/* Background gradient */}
      <div className={`absolute inset-0 bg-linear-to-br ${game.color} opacity-${game.enabled ? "100" : "40"}`} />

      {/* Disabled overlay */}
      {!game.enabled && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-10">
          <span className="text-white/80 font-semibold text-sm bg-black/30 px-3 py-1 rounded-full">Disabled</span>
        </div>
      )}

      {/* Game visual */}
      <div className="relative z-5 flex flex-col items-center justify-center h-full p-4">
        <div className="text-6xl mb-3 drop-shadow-lg">{game.emoji}</div>
        <h3 className="text-white font-extrabold text-xl uppercase tracking-wide drop-shadow">
          {game.name}
        </h3>
        <p className="text-white/70 text-xs mt-1 text-center">{game.tagline}</p>
      </div>

      {/* Hover action button */}
      <div
        className={`absolute bottom-0 left-0 right-0 z-20 transition-all duration-300 ease-out ${
          hovered ? "translate-y-0 opacity-100" : "translate-y-full opacity-0"
        }`}
      >
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggle(game.id);
          }}
          className={`w-full py-3 flex items-center justify-center gap-2 font-semibold text-sm transition-colors ${
            game.enabled
              ? "bg-red-500/90 hover:bg-red-600 text-white"
              : "bg-green-500/90 hover:bg-green-600 text-white"
          }`}
        >
          {game.enabled ? (
            <>
              <Ban className="h-4 w-4" />
              Disable game
            </>
          ) : (
            <>
              <CheckCircle className="h-4 w-4" />
              Enable game
            </>
          )}
        </button>
      </div>
    </div>
  );
}

export default GameCard