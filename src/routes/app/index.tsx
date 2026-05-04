import { createFileRoute } from "@tanstack/react-router";
import { Gamepad2, Plus, CircleDotDashed } from "lucide-react";
import { StatCard } from "@/components/StatCard";
import { ActivityChart } from "@/components/ActivityChart";
import { TopBets } from "@/components/TopBets";
import { UserAnalyticsTable } from "@/components/UserAnalyticsTable";
import { TimePeriodFilter } from "@/components/TimePeriodFilter";
import { FaPeopleGroup } from "react-icons/fa6";

export const Route = createFileRoute("/app/")({
	component: DashboardPage,
});

function DashboardPage() {
	return (
		<div className="flex h-[calc(100vh-120px)] flex-1 flex-col overflow-hidden px-2 lg:px-4">
			{/* Header */}
			<div className="flex-none mb-6 flex flex-wrap items-center justify-between gap-4">
				<h1 className="text-3xl font-bold text-gray-900">Overview</h1>
				<div className="flex flex-wrap items-center gap-3">
					<button className="flex cursor-pointer items-center gap-2 rounded-full bg-[#1BAA04] px-4 py-2 text-sm font-medium text-white hover:bg-[#0ea800]">
						<Plus className="h-4 w-4" />
						Add new user
					</button>
					<TimePeriodFilter 
						buttonClassName="flex cursor-pointer items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
						onFilterChange={(period, customRange) => console.log(period, customRange)} 
					/>
				</div>
			</div>

			<div className="flex-1 overflow-y-auto custom-scrollbar pb-10 space-y-6">
			{/* Stats Cards */}
			<div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
				<StatCard 
					title="Total Users" 
					value="2,341" 
					icon={<FaPeopleGroup className="h-5 w-5 text-[#001A26]" />} 
				/>
				<StatCard 
					title="Active Players" 
					value="120" 
					icon={<Gamepad2 className="h-5 w-5 text-[#001A26]" />} 
				/>
				<StatCard 
					title="Pending Payouts" 
					value="80" 
					icon={<CircleDotDashed className="h-5 w-5 text-[#001A26]" />} 
				/>
				<StatCard 
					title="Total Income" 
					value="₦540,000,000,000,000,000,000" 
					icon={<span className="font-bold text-lg text-[#001A26]">₦</span>} 
				/>
			</div>

			{/* Middle Section (Chart + Top Bets) */}
			<div className="grid grid-cols-1 gap-6 lg:grid-cols-[2fr_1fr]">
				<div className="min-h-[380px]">
					<ActivityChart />
				</div>
				<div className="min-h-[380px]">
					<TopBets />
				</div>
			</div>

			{/* Bottom Section (Table) */}
			<div>
				<UserAnalyticsTable />
			</div>
			</div>
		</div>
	);
}