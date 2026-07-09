interface TopBet {
	id: string;
	playerName: string;
	betType: string;
	amount: number;
}

interface TopBetsProps {
	bets?: TopBet[];
}

export function TopBets({ bets: propBets }: TopBetsProps) {
	const bets = propBets ?? [
		{ id: "1", playerName: "Balla Daniella", betType: "Jackpot", amount: 325895.68 },
		{ id: "2", playerName: "Balla Daniella", betType: "Quick Tipss", amount: 325895.68 },
		{ id: "3", playerName: "Balla Daniella", betType: "Smart Bets", amount: 325895.68 },
		{ id: "4", playerName: "Balla Daniella", betType: "Super Bets", amount: 325895.68 },
		{ id: "5", playerName: "Balla Daniella", betType: "Mega 10", amount: 325895.68 },
	];

	const formatAmount = (amount: number) => {
		return `NGN ${amount.toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}K`;
	};

	return (
		<div className="flex h-full flex-col rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
			<h2 className="mb-6 text-lg font-bold text-gray-900">Top 5 Biggest Bets for today</h2>
			<div className="flex flex-1 flex-col justify-between gap-4">
				{bets.map((bet) => (
					<div key={bet.id} className="flex items-center justify-between gap-2 overflow-hidden">
						<div className="flex items-center gap-3 min-w-0 flex-1">
							<div className="flex h-10 w-10 shrink-0 overflow-hidden rounded-full bg-orange-100">
								<img
									src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${bet.id}`}
									alt={bet.playerName}
									className="h-full w-full object-cover"
								/>
							</div>
							<span className="font-semibold text-gray-900 truncate">{bet.playerName}</span>
						</div>
						<span className="text-xs font-medium text-gray-500 truncate hidden sm:block">{bet.betType}</span>
						<span className="shrink-0 rounded-lg bg-gray-50 px-2 py-1.5 text-[10px] font-bold text-gray-900">
							{formatAmount(bet.amount)}
						</span>
					</div>
				))}
			</div>
		</div>
	);
}
