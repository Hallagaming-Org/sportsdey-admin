import {
	TimePeriodDropdown,
	type TimePeriodOption,
} from "./TimePeriodDropdown";
import { useState } from "react";

interface ActivityChartProps {
	showHeader?: boolean;
}

export function ActivityChart({ showHeader = true }: ActivityChartProps) {
	const [selectedTimePeriod, setSelectedTimePeriod] =
		useState<TimePeriodOption>("All");

	const days = Array.from({ length: 7 }).map((_, i) => {
		const d = new Date();
		d.setDate(d.getDate() - (6 - i));
		if (i === 6) return "Today";
		return d.toLocaleDateString("en-US", { weekday: "short" });
	});

	// Fixed dummy data for demonstration, matching the visual scale
	const data = [
		{ rev: 120000, bet: 150000, users: 80000 },
		{ rev: 180000, bet: 220000, users: 120000 },
		{ rev: 140000, bet: 130000, users: 90000 },
		{ rev: 250000, bet: 280000, users: 150000 },
		{ rev: 200000, bet: 230000, users: 110000 },
		{ rev: 310000, bet: 340000, users: 190000 }, 
		{ rev: 330000, bet: 350000, users: 210000 }  
	];

	const maxVal = Math.max(...data.flatMap(d => [d.rev, d.bet, d.users]));
	const step = 100000;
	// Cap to next multiple of step, minimum 300k
	const cap = Math.max(300000, Math.ceil(maxVal / step) * step);
	const formatK = (val: number) => `${Math.round(val / 1000)}K`;

	return (
		<div className="flex h-full w-full flex-col rounded-2xl bg-white p-6 shadow-[0_2px_12px_0_#0000000F] border border-gray-100">
			{showHeader && (
				<div className="mb-6 flex items-center justify-between">
					<h2 className="text-xl font-bold text-gray-900">Activity Trends/Reports</h2>
					<TimePeriodDropdown
						value={selectedTimePeriod}
						onChange={(period) => setSelectedTimePeriod(period)}
					/>
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

						<div className="absolute bottom-0 left-0 right-0 top-0 flex items-end justify-between px-4 lg:px-12">
							{data.map((day, idx) => (
								<div key={idx} className="flex h-full w-12 items-end justify-center z-10 group relative">
									<div className={`w-2.5 bg-[#0D0D0D] transition-all duration-300 ${idx < 6 ? 'opacity-40' : 'opacity-100'}`} style={{ height: `${(day.rev / cap) * 100}%` }}></div>
									<div className={`w-2.5 bg-[#1BAA04] transition-all duration-300 ${idx < 6 ? 'opacity-40' : 'opacity-100'}`} style={{ height: `${(day.bet / cap) * 100}%` }}></div>
									<div className={`w-2.5 bg-[#E2FDD9] transition-all duration-300 ${idx < 6 ? 'opacity-40' : 'opacity-100'}`} style={{ height: `${(day.users / cap) * 100}%` }}></div>
									
									{/* Tooltip on hover */}
									<div className="absolute top-full mt-2 hidden group-hover:flex flex-col bg-gray-900 text-white text-[10px] p-2 rounded shadow-lg z-20 whitespace-nowrap">
										<div>Rev: ₦{day.rev.toLocaleString()}</div>
										<div>Bets: ₦{day.bet.toLocaleString()}</div>
										<div>Users: {day.users.toLocaleString()}</div>
									</div>
								</div>
							))}
						</div>
					</div>

					{/* X-axis labels sitting right below the 0 line */}
					<div className="pt-2 flex justify-between px-4 lg:px-12 text-xs font-semibold text-gray-500">
						{days.map((day, idx) => (
							<span key={idx} className="w-12 text-center uppercase tracking-wider">
								{day}
							</span>
						))}
					</div>
				</div>
			</div>

			<div className="mt-8 flex items-center justify-end gap-6 text-xs font-medium text-gray-600">
				<div className="flex items-center gap-2">
					<div className="h-2 w-2 rounded-full bg-[#0D0D0D]"></div>
					<span>Revenue generated</span>
				</div>
				<div className="flex items-center gap-2">
					<div className="h-2 w-2 rounded-full bg-[#1BAA04]"></div>
					<span>Bets Placed</span>
				</div>
				<div className="flex items-center gap-2">
					<div className="h-2 w-2 rounded-full bg-[#E2FDD9]"></div>
					<span>All Users</span>
				</div>
			</div>
		</div>
	);
}
