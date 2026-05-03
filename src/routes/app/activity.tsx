import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { MoreHorizontal } from "lucide-react";
import FilterIcon from "@/logo/filter.svg?react";
import SortIcon from "@/logo/sort.svg?react";
import { IoFilter } from "react-icons/io5";
import { DataTable, type Column } from "#/components/DataTable";
import { ActionDropdown } from "#/components/ActionDropdown";
import { ActivityChart as ActivityTrendChart } from "@/components/ActivityChart";
import { TicketsTrendPie } from "@/components/TicketsTrendPie";

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
			<div className="flex-none mb-6 flex items-center justify-between">
				<h2 className="text-2xl font-bold text-gray-900">Activity Trends/Reports</h2>
				<button className="flex items-center gap-2 rounded-lg bg-white border border-gray-200 px-3 py-2 text-xs font-medium text-gray-600 hover:bg-gray-50 cursor-pointer">
					<span className="hidden lg:block">Time periods</span>
					<IoFilter className="h-3.5 w-3.5" />
				</button>
			</div>

			<div className="flex-1 overflow-y-auto custom-scrollbar pb-10 space-y-6">
				{/* Top Section */}
				<div className="h-[383px] w-full">
					<ActivityTrendChart showHeader={false} />

				</div>

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
