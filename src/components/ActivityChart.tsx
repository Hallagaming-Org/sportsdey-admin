interface DayData {
	date: string;
	revenue: number;
	bets: number;
	winnings: number;
	totalDeposits: number;
	totalWithdrawals: number;
}

interface ActivityChartProps {
	showHeader?: boolean;
	data?: DayData[];
}

const BARS = [
	{
		key: "rev",
		color: "#0D0D0D",
		label: "Rev (GGR)",
		className: "bg-[#0D0D0D]",
	},
	{
		key: "bet",
		color: "#1BAA04",
		label: "Bets Placed",
		className: "bg-[#1BAA04]",
	},
	{
		key: "winnings",
		color: "#E2FDD9",
		label: "Winnings",
		className: "bg-[#E2FDD9]",
	},
	{
		key: "deposits",
		color: "#3B82F6",
		label: "Total Deposits",
		className: "bg-[#3B82F6]",
	},
	{
		key: "withdrawals",
		color: "#EF4444",
		label: "Total Withdrawals",
		className: "bg-[#EF4444]",
	},
] as const;

const FALLBACK_DATA = [
	{
		rev: 120000,
		bet: 150000,
		winnings: 40000,
		deposits: 200000,
		withdrawals: 80000,
	},
	{
		rev: 180000,
		bet: 220000,
		winnings: 60000,
		deposits: 260000,
		withdrawals: 90000,
	},
	{
		rev: 140000,
		bet: 130000,
		winnings: 50000,
		deposits: 210000,
		withdrawals: 70000,
	},
	{
		rev: 250000,
		bet: 280000,
		winnings: 90000,
		deposits: 310000,
		withdrawals: 120000,
	},
	{
		rev: 200000,
		bet: 230000,
		winnings: 70000,
		deposits: 280000,
		withdrawals: 100000,
	},
	{
		rev: 310000,
		bet: 340000,
		winnings: 120000,
		deposits: 380000,
		withdrawals: 140000,
	},
	{
		rev: 330000,
		bet: 350000,
		winnings: 130000,
		deposits: 400000,
		withdrawals: 160000,
	},
];

export function ActivityChart({
	showHeader = true,
	data: propData,
}: ActivityChartProps) {
	const displayData = propData
		? propData.map((d) => ({
				rev: d.revenue,
				bet: d.bets,
				winnings: d.winnings,
				deposits: d.totalDeposits,
				withdrawals: d.totalWithdrawals,
			}))
		: FALLBACK_DATA;

	const days = propData
		? propData.map((d) => d.date)
		: Array.from({ length: 7 }).map((_, i) => {
				const d = new Date();
				d.setDate(d.getDate() - (6 - i));
				if (i === 6) return "Today";
				return d.toLocaleDateString("en-US", { weekday: "short" });
			});

	const maxVal = Math.max(
		...displayData.flatMap((d) => [
			d.rev,
			d.bet,
			d.winnings,
			d.deposits,
			d.withdrawals,
		]),
	);
	const step = 100000;
	const cap = Math.max(300000, Math.ceil(maxVal / step) * step);
	const formatK = (val: number) => `${Math.round(val / 1000)}K`;

	return (
		<div className="flex h-full w-full flex-col rounded-2xl bg-white p-6 shadow-[0_2px_12px_0_#0000000F] border border-gray-100">
			{showHeader && (
				<div className="mb-6 flex items-center justify-between">
					<h2 className="text-xl font-bold text-gray-900">
						Activity Trends/Reports
					</h2>
				</div>
			)}

			<div className="relative flex-1 min-h-[200px] w-full mt-2">
				<div className="absolute bottom-6 left-0 top-0 flex flex-col justify-between text-xs font-medium text-gray-400">
					<span>{formatK(cap)}</span>
					<span>{formatK(cap * 0.66)}</span>
					<span>{formatK(cap * 0.33)}</span>
					<span>0</span>
				</div>

				<div className="ml-12 flex h-full flex-col">
					<div className="relative flex-1">
						<div className="absolute left-0 top-0 w-full border-t border-dashed border-gray-200"></div>
						<div className="absolute left-0 top-[33.33%] w-full border-t border-dashed border-gray-200"></div>
						<div className="absolute left-0 top-[66.66%] w-full border-t border-dashed border-gray-200"></div>
						<div className="absolute bottom-0 left-0 w-full border-t border-gray-300"></div>

						<div className="absolute bottom-0 left-0 right-0 top-0 flex items-end justify-between px-2 lg:px-8">
							{displayData.map((day, idx) => (
								<div
									// biome-ignore lint/suspicious/noArrayIndexKey: static day list, order never changes
									key={idx}
									className="flex h-full w-16 items-end justify-center gap-1 z-10 group relative"
								>
									{BARS.map((bar) => (
										<div
											key={bar.key}
											className={`w-2.5 ${bar.className} transition-all duration-300 ${idx < 6 ? "opacity-40" : "opacity-100"}`}
											style={{ height: `${(day[bar.key] / cap) * 100}%` }}
										></div>
									))}

									<div className="absolute top-full mt-2 hidden group-hover:flex flex-col bg-gray-900 text-white text-[10px] p-2 rounded shadow-lg z-20 whitespace-nowrap">
										{BARS.map((bar) => (
											<div key={bar.key}>
												{bar.label}: {bar.key === "bet" ? "" : "₦"}
												{day[bar.key].toLocaleString()}
											</div>
										))}
									</div>
								</div>
							))}
						</div>
					</div>

					<div className="pt-2 flex justify-between px-2 lg:px-8 text-xs font-semibold text-gray-500">
						{days.map((day, idx) => (
							<span
								// biome-ignore lint/suspicious/noArrayIndexKey: static day list, order never changes
								key={idx}
								className="w-16 text-center uppercase tracking-wider"
							>
								{day}
							</span>
						))}
					</div>
				</div>
			</div>

			<div className="mt-8 flex flex-wrap items-center justify-end gap-x-6 gap-y-2 text-xs font-medium text-gray-600">
				{BARS.map((bar) => (
					<div key={bar.key} className="flex items-center gap-2">
						<div
							className="h-2 w-2 rounded-full"
							style={{ backgroundColor: bar.color }}
						></div>
						<span>{bar.label}</span>
					</div>
				))}
			</div>
		</div>
	);
}
