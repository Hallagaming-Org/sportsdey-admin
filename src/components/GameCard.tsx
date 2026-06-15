import type { Game } from "#/routes/app/games";
import { CheckCircle } from "lucide-react";
import { useState } from "react";
import { IoAdd } from "react-icons/io5";

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
      className="group flex flex-col items-center gap-2 cursor-pointer select-none"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div
        className="relative w-full aspect-[4/5] rounded-2xl overflow-hidden bg-[#11123f]/10"
        style={{ opacity: game.enabled ? 1 : 0.5 }}
      >
        <img 
          src={game.image} 
          alt={game.name} 
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-110" 
        />
        
        {/* Dark gradient overlay for text readability */}
        <div className="absolute inset-0 bg-linear-to-t from-black/40 via-black/20 to-black/30" />

        {!game.enabled && (
          <div className="absolute top-3 right-3 z-10 bg-black/60 backdrop-blur-sm rounded-full px-2.5 py-0.5">
            <span className="text-white/90 font-semibold text-xs">Disabled</span>
          </div>
        )}
        <div className="relative z-5 flex flex-col items-center justify-center h-full p-4">
          {/* <h3 className="text-white mt-20 font-extrabold text-xl uppercase tracking-wide drop-shadow-lg text-center">
            {game.name}
          </h3> */}
          {/* <p className="text-white/80 text-sm mt-1 text-center font-medium drop-shadow-md">
            {game.tagline}
          </p> */}
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
          className={`flex justify-center items-center gap-2 rounded-full w-[157px] h-10 font-semibold text-sm border transition-colors shadow-sm ${
            game.enabled
              ? "border-[#E60D0D] bg-[#FFE7E7] text-[#C03320] cursor-pointer"
              : "border-[#0fa61c] bg-[#d7f4d8] text-[#0fa61c] cursor-pointer"
          }`}
        >
          {game.enabled ? (
            <>
              <IoAdd className="h-5 w-5" />
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