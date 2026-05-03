import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Search, MoreHorizontal } from "lucide-react";
import FilterIcon from "@/logo/filter.svg?react";
import SortIcon from "@/logo/sort.svg?react";
import { IoFilter } from "react-icons/io5";
import { DataTable, type Column } from "#/components/DataTable";
import { ActionDropdown } from "#/components/ActionDropdown";

export const Route = createFileRoute("/app/activity")({
	component: ActivityPage,
});

interface ActivityRecord {
	id: string;
	name: string;
	email: string;
	role: string;
	action: string;
	date: string;
	status: "Online" | "Offline";
}

const DUMMY_ACTIVITIES: ActivityRecord[] = [
	{ id: "012345", name: "George jones", email: "Georgejones@gmail.com", role: "Support Admin", action: "Approved document", date: "Aug 8, 2025", status: "Online" },
	{ id: "012345", name: "Leslie Alexander", email: "Lesliealexander@gmail.com", role: "CSR Admin", action: "Uploaded content", date: "Aug 8, 2025", status: "Offline" },
	{ id: "012345", name: "Savannah Nguyen", email: "Savannahnguyen@gmail.com", role: "Support Admin", action: "Exported File", date: "Aug 8, 2025", status: "Offline" },
	{ id: "012345", name: "George jones", email: "Georgejones@gmail.com", role: "Support Admin", action: "Approved document", date: "Aug 8, 2025", status: "Online" },
	{ id: "012345", name: "Leslie Alexander", email: "Lesliealexander@gmail.com", role: "CSR Admin", action: "Uploaded content", date: "Aug 8, 2025", status: "Offline" },
	{ id: "012345", name: "Savannah Nguyen", email: "Savannahnguyen@gmail.com", role: "Support Admin", action: "Exported File", date: "Aug 8, 2025", status: "Online" },
];

const TOP_BETS = [
	{ id: 1, name: "Balla Daniella", type: "Jackpot", amount: "NGN 325,805.68K", avatar: "B" },
	{ id: 2, name: "Balla Daniella", type: "Quick Tipss", amount: "NGN 325,805.68K", avatar: "B" },
	{ id: 3, name: "Balla Daniella", type: "Smart Bets", amount: "NGN 325,805.68K", avatar: "B" },
	{ id: 4, name: "Balla Daniella", type: "Super Bets", amount: "NGN 325,805.68K", avatar: "B" },
	{ id: 5, name: "Balla Daniella", type: "Mega 10", amount: "NGN 325,805.68K", avatar: "B" },
];

function ActivityTrendChart() {
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
		<div className="flex w-full flex-col rounded-2xl bg-white p-6 shadow-[0_2px_12px_0_#0000000F] border border-gray-100">
			<div className="mb-6 flex items-center justify-between">
				<h2 className="text-xl font-bold text-gray-900">Activity Trends/Reports</h2>
				<button className="flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50">
					<span className="hidden lg:block">Time periods</span>
					<IoFilter className="h-3.5 w-3.5" />
				</button>
			</div>

			<div className="relative h-[240px] w-full mt-2">
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
									<div className="w-2.5 bg-black transition-all duration-300" style={{ height: `${(day.rev / cap) * 100}%` }}></div>
									<div className="w-2.5 bg-[#10C300] transition-all duration-300" style={{ height: `${(day.bet / cap) * 100}%` }}></div>
									<div className="w-2.5 bg-[#E2FDD9] transition-all duration-300" style={{ height: `${(day.users / cap) * 100}%` }}></div>
									
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
					<div className="h-2 w-2 rounded-full bg-black"></div>
					<span>Revenue generated</span>
				</div>
				<div className="flex items-center gap-2">
					<div className="h-2 w-2 rounded-full bg-[#10C300]"></div>
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

function TicketsTrendPie() {
	return (
		<div className="flex h-full flex-col rounded-2xl bg-white p-6 shadow-sm border border-gray-100">
			<h3 className="font-bold text-lg text-gray-900 mb-6">Tickets Trend</h3>
			<div className="flex items-center gap-8 justify-between mt-2">
				<div className="relative h-36 w-36 shrink-0 rounded-full overflow-hidden">
					<svg viewBox="0 0 32 32" className="h-full w-full -rotate-90">
						<circle r="16" cx="16" cy="16" fill="transparent" stroke="#B026FF" strokeWidth="32" strokeDasharray="60 100" />
						<circle r="16" cx="16" cy="16" fill="transparent" stroke="#0066FF" strokeWidth="32" strokeDasharray="25 100" strokeDashoffset="-60" />
						<circle r="16" cx="16" cy="16" fill="transparent" stroke="#FFD700" strokeWidth="32" strokeDasharray="15 100" strokeDashoffset="-85" />
					</svg>
					{/* Text overlays using absolute positioning */}
					<div className="absolute inset-0 flex items-center justify-center">
						<span className="absolute text-white font-bold text-xs" style={{ top: "35%", left: "20%" }}>60%</span>
						<span className="absolute text-white font-bold text-[10px]" style={{ top: "65%", left: "65%" }}>15%</span>
						<span className="absolute text-white font-bold text-xs" style={{ top: "25%", left: "60%" }}>25%</span>
					</div>
				</div>
				<div className="flex flex-col gap-4 text-xs font-medium w-full">
					<div className="flex items-center justify-between border-b border-gray-100 pb-3">
						<div className="flex items-center gap-2 text-gray-600">
							<div className="w-1 h-3 rounded-full bg-[#FFD700]"></div>
							All Tickets
						</div>
						<span className="text-[#0066FF] font-bold">15%</span>
					</div>
					<div className="flex items-center justify-between border-b border-gray-100 pb-3">
						<div className="flex items-center gap-2 text-gray-600">
							<div className="w-1 h-3 rounded-full bg-[#0066FF]"></div>
							Won Tickets
						</div>
						<span className="text-[#0066FF] font-bold">25%</span>
					</div>
					<div className="flex items-center justify-between border-b border-gray-100 pb-3">
						<div className="flex items-center gap-2 text-gray-600">
							<div className="w-1 h-3 rounded-full bg-[#B026FF]"></div>
							Lost Tickets
						</div>
						<span className="text-[#B026FF] font-bold">60%</span>
					</div>
				</div>
			</div>
		</div>
	);
}

function TopBets() {
	return (
		<div className="flex h-full flex-col rounded-2xl bg-white p-6 shadow-sm border border-gray-100">
			<div className="mb-6 flex items-center justify-between">
				<h3 className="font-bold text-lg text-gray-900">Top 5 Biggest Bets for today</h3>
				<button className="flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50">
					<span className="hidden lg:block">Time periods</span>
					<IoFilter className="h-3.5 w-3.5" />
				</button>
			</div>
			<div className="flex flex-col gap-4">
				{TOP_BETS.map((bet) => (
					<div key={bet.id} className="flex items-center justify-between">
						<div className="flex items-center gap-3">
							<img 
								src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${bet.name}`} 
								alt="avatar" 
								className="h-8 w-8 rounded-full bg-[#FEECEB] object-cover shrink-0 p-1" 
							/>
							<span className="font-bold text-sm text-gray-900">{bet.name}</span>
						</div>
						<div className="flex items-center justify-between flex-1 ml-10">
							<span className="text-gray-400 font-medium text-sm w-24">{bet.type}</span>
							<span className="font-bold text-sm text-gray-900 text-right">{bet.amount}</span>
						</div>
					</div>
				))}
			</div>
		</div>
	);
}

function ActivityPage() {
	const [page, setPage] = useState(1);
	const [actionDropdown, setActionDropdown] = useState<{ activity: ActivityRecord; top: number; right: number } | null>(null);

	useEffect(() => {
		const handleClickOutside = () => setActionDropdown(null);
		document.addEventListener("click", handleClickOutside);
		return () => document.removeEventListener("click", handleClickOutside);
	}, []);

	const columns: Column<ActivityRecord>[] = [
		{ 
			header: "User ID", 
			accessor: "id" 
		},
		{ 
			header: "Full Name", 
			accessor: (record) => (
				<div className="flex items-center gap-3 min-w-0">
					<img 
						src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${record.name}`} 
						alt="avatar" 
						className="h-8 w-8 rounded-full bg-gray-100 object-cover shrink-0" 
					/>
					<span className="font-medium text-sm text-gray-900 truncate" title={record.name}>{record.name}</span>
				</div>
			)
		},
		{ 
			header: "Email address", 
			accessor: "email",
			cellClassName: "text-gray-500"
		},
		{ 
			header: "Role", 
			accessor: "role",
			cellClassName: "text-gray-500"
		},
		{ 
			header: "Action", 
			accessor: "action",
			cellClassName: "text-gray-500"
		},
		{ 
			header: "Date", 
			accessor: "date",
			cellClassName: "text-gray-500"
		},
		{ 
			header: "Status", 
			accessor: (record) => (
				<span className={`inline-flex items-center font-medium ${
					record.status === "Online" ? "text-[#10C300]" : "text-[#EE201C]"
				}`}>
					{record.status}
				</span>
			)
		}
	];

	return (
		<div className="flex h-[calc(100vh-120px)] flex-1 flex-col overflow-hidden px-2 lg:px-4">
			<div className="flex-1 overflow-y-auto custom-scrollbar pb-10 space-y-6">
				{/* Top Section */}
				<ActivityTrendChart />

				{/* Middle Section */}
				<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
					<TicketsTrendPie />
					<TopBets />
				</div>

				{/* Bottom Section */}
				<div className="flex flex-col bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
					<div className="flex items-center justify-between p-6 pb-4">
						<h3 className="font-bold text-xl text-gray-900">Activity Log</h3>
						<div className="flex items-center gap-3">
							<button className="inline-flex cursor-pointer items-center gap-2 rounded-full border-2 border-primary px-3 py-1.5 font-medium text-gray-900 text-xs hover:bg-gray-50">
								<SortIcon className="h-3 w-3" />
								Sort
							</button>
							<button className="inline-flex cursor-pointer items-center gap-2 rounded-full border-2 border-primary px-3 py-1.5 font-medium text-gray-900 text-xs hover:bg-gray-50">
								<FilterIcon className="h-3 w-3" />
								Filter
							</button>
						</div>
					</div>
					
					<div className="flex-1 min-h-[350px]">
						<DataTable
							data={DUMMY_ACTIVITIES}
							columns={columns}
							onActionClick={(activity, e) => {
								e.stopPropagation();
								e.nativeEvent.stopImmediatePropagation();
								const rect = e.currentTarget.getBoundingClientRect();
								setActionDropdown({
									activity,
									top: rect.bottom + window.scrollY,
									right: window.innerWidth - rect.right,
								});
							}}
							emptyMessage="No activity found"
							pagination={{
								currentPage: page,
								totalPages: 10,
								onPageChange: setPage,
								totalItems: 100,
								itemsPerPage: 10,
							}}
						/>
					</div>
				</div>
			</div>

			{actionDropdown && (
				<ActionDropdown
					top={actionDropdown.top}
					right={actionDropdown.right}
					onClose={() => setActionDropdown(null)}
					items={[
						{
							icon: <MoreHorizontal className="w-4 h-4" />,
							label: "View details",
							onClick: () => setActionDropdown(null),
						}
					]}
				/>
			)}
		</div>
	);
}
