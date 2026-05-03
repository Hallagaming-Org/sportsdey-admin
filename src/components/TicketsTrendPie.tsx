
export function TicketsTrendPie() {
	const data = [
		{ name: "Casino", value: 60, color: "#AA048C", amount: "NGN 325,805.68K" },
		{ name: "Sportsbook", value: 25, color: "#0766FE", amount: "NGN 325,805.68K" },
		{ name: "Prediction Market", value: 15, color: "#FFDE83", amount: "NGN 325,805.68K" }
	];

	// SVG circle math
	const radius = 16;
	const circumference = 2 * Math.PI * radius; // 100.5309649...
	let cumulativePercent = 0;

	return (
		<div className="flex h-full flex-col rounded-2xl bg-white p-6 shadow-sm border border-gray-100">
			<h3 className="font-bold text-lg text-gray-900 mb-6">Tickets Trend</h3>
			<div className="flex items-center gap-8 justify-between mt-2">
				<div className="relative h-36 w-36 shrink-0 rounded-full overflow-hidden">
					<svg viewBox="0 0 32 32" className="h-full w-full -rotate-90">
						{data.map((slice, idx) => {
							const strokeDasharray = `${(slice.value / 100) * circumference} ${circumference}`;
							const strokeDashoffset = -(cumulativePercent / 100) * circumference;
							cumulativePercent += slice.value;
							return (
								<circle 
									key={idx}
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
						{data.map((slice, idx) => {
							// Recalculate cumulative to find midpoint
							const previousCumulative = data.slice(0, idx).reduce((acc, curr) => acc + curr.value, 0);
							const midPointPercent = (previousCumulative + slice.value / 2) / 100;
							
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
									key={idx} 
									className="absolute text-white font-bold text-xs" 
									style={{ top: `${top}%`, left: `${left}%`, transform: 'translate(-50%, -50%)' }}
								>
									{slice.value}%
								</span>
							);
						})}
					</div>
				</div>
				<div className="flex flex-col gap-4 text-xs font-medium w-full">
					{data.map((slice, idx) => (
						<div key={idx} className={`flex items-center justify-between ${idx !== data.length - 1 ? "border-b border-gray-100 pb-3" : ""}`}>
							<div className="flex items-center gap-2 text-gray-600">
								<div className="w-1 h-3 rounded-full" style={{ backgroundColor: slice.color }}></div>
								{slice.name}
							</div>
							<span style={{ color: slice.color }} className="font-bold">{slice.value}%</span>
						</div>
					))}
				</div>
			</div>
		</div>
	);
}
