import { useEffect, useState } from "react";
import { overviewService, type TicketTrend } from "@/lib/overview";

interface TicketsTrendPieProps {
	fromDate?: string;
	toDate?: string;
}

const COLORS = ["#FFDE83", "#0766FE", "#AA048C"];

export function TicketsTrendPie({ fromDate, toDate }: TicketsTrendPieProps) {
	const [trend, setTrend] = useState<TicketTrend | null>(null);

	useEffect(() => {
		let isCurrent = true;
		overviewService.getTicketTrend({ fromDate, toDate }).then((res) => {
			if (isCurrent && res.success && res.data) setTrend(res.data);
		});
		return () => {
			isCurrent = false;
		};
	}, [fromDate, toDate]);

	const total = trend?.totalTickets ?? 0;
	const data = [
		{ name: "All Tickets", count: total, color: COLORS[0] },
		{ name: "Won Tickets", count: trend?.wonTickets ?? 0, color: COLORS[1] },
		{ name: "Lost Tickets", count: trend?.lostTickets ?? 0, color: COLORS[2] },
	];
	const wonPercent = total ? (data[1].count / total) * 100 : 0;
	const lostPercent = total ? (data[2].count / total) * 100 : 0;
	const chartData = total
		? [
				{ ...data[1], value: wonPercent },
				{ ...data[2], value: lostPercent },
				{
					name: "Other Tickets",
					count: Math.max(0, total - data[1].count - data[2].count),
					value: Math.max(0, 100 - wonPercent - lostPercent),
					color: "#E5E7EB",
				},
			]
		: [];

	// SVG circle math
	const radius = 16;
	const circumference = 2 * Math.PI * radius; // 100.5309649...
	let cumulativePercent = 0;

	return (
		<div className="flex h-full flex-col rounded-2xl bg-white p-6 shadow-sm border border-gray-100">
			<h3 className="font-bold text-lg text-gray-900 mb-6">Tickets Trend</h3>
			<div className="flex items-center gap-8 justify-between mt-2">
				<div className="relative h-36 w-36 shrink-0 rounded-full overflow-hidden">
					<svg
						viewBox="0 0 32 32"
						role="img"
						aria-label="Ticket outcome distribution"
						className="h-full w-full -rotate-90"
					>
						{chartData.map((slice) => {
							const strokeDasharray = `${(slice.value / 100) * circumference} ${circumference}`;
							const strokeDashoffset =
								-(cumulativePercent / 100) * circumference;
							cumulativePercent += slice.value;
							return (
								<circle
									key={slice.name}
									r={radius}
									cx="16"
									cy="16"
									fill="transparent"
									stroke={slice.color}
									strokeWidth="32"
									strokeDasharray={strokeDasharray}
									strokeDashoffset={strokeDashoffset}
								/>
							);
						})}
					</svg>
					{/* Text overlays using calculated midpoint positions */}
					<div className="absolute inset-0 flex items-center justify-center">
						{chartData.map((slice, idx) => {
							// Recalculate cumulative to find midpoint
							const previousCumulative = chartData
								.slice(0, idx)
								.reduce((acc, curr) => acc + curr.value, 0);
							const midPointPercent =
								(previousCumulative + slice.value / 2) / 100;

							// Calculate X and Y on the circle. -rotate-90 means 0 is at Top (12 o'clock).
							// Angle goes clockwise.
							const x = Math.sin(2 * Math.PI * midPointPercent);
							const y = -Math.cos(2 * Math.PI * midPointPercent);

							// Distance from center (0 to 50%)
							const textRadius = 26;
							const left = 50 + x * textRadius;
							const top = 50 + y * textRadius;

							return (
								<span
									key={slice.name}
									className="absolute text-white font-bold text-xs"
									style={{
										top: `${top}%`,
										left: `${left}%`,
										transform: "translate(-50%, -50%)",
									}}
								>
									{Math.round(slice.value)}%
								</span>
							);
						})}
					</div>
				</div>
				<div className="flex flex-col gap-4 text-xs font-medium w-full">
					{data.map((slice, idx) => (
						<div
							key={slice.name}
							className={`flex items-center justify-between ${idx !== data.length - 1 ? "border-b border-gray-100 pb-3" : ""}`}
						>
							<div className="flex items-center gap-2 text-gray-600">
								<div
									className="w-1 h-3 rounded-full"
									style={{ backgroundColor: slice.color }}
								></div>
								{slice.name}
							</div>
							<span style={{ color: slice.color }} className="font-bold">
								{slice.name === "All Tickets"
									? "100%"
									: `${Math.round((slice.count / total) * 100)}%`}
							</span>
						</div>
					))}
				</div>
			</div>
		</div>
	);
}
