export function TopBets() {
  const bets = [
    { id: 1, name: "Balla Daniella", type: "Jackpot", amount: "NGN 325,895.68K" },
    { id: 2, name: "Balla Daniella", type: "Quick Tipss", amount: "NGN 325,895.68K" },
    { id: 3, name: "Balla Daniella", type: "Smart Bets", amount: "NGN 325,895.68K" },
    { id: 4, name: "Balla Daniella", type: "Super Bets", amount: "NGN 325,895.68K" },
    { id: 5, name: "Balla Daniella", type: "Mega 10", amount: "NGN 325,895.68K" },
  ];

  return (
    <div className="flex h-full flex-col rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
      <h2 className="mb-6 text-lg font-bold text-gray-900">Top 5 Biggest Bets for today</h2>
      <div className="flex flex-1 flex-col justify-between gap-4">
        {bets.map((bet) => (
          <div key={bet.id} className="flex items-center justify-between gap-2 overflow-hidden">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="flex h-10 w-10 shrink-0 overflow-hidden rounded-full bg-orange-100">
                <img 
                  src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${bet.id + 10}`} 
                  alt={bet.name} 
                  className="h-full w-full object-cover" 
                />
              </div>
              <span className="font-semibold text-gray-900 truncate">{bet.name}</span>
            </div>
            <span className="text-xs font-medium text-gray-500 truncate hidden sm:block">{bet.type}</span>
            <span className="shrink-0 rounded-lg bg-gray-50 px-2 py-1.5 text-[10px] font-bold text-gray-900">
              {bet.amount}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
