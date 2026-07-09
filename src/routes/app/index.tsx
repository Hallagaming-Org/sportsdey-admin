import { createFileRoute, Navigate } from "@tanstack/react-router";
import { Gamepad2, Plus, CircleDotDashed } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { getCookie } from "@/lib/api";
import { overviewService, periodToDateRange, type OverviewStats, type DayActivity, type TopBet } from "@/lib/overview";
import { StatCard } from "@/components/StatCard";
import { ActivityChart } from "@/components/ActivityChart";
import { TopBets } from "@/components/TopBets";
import { UserAnalyticsTable } from "@/components/UserAnalyticsTable";
import {
	TimePeriodDropdown,
	type TimePeriodOption,
} from "#/components/TimePeriodDropdown";
import { FaPeopleGroup } from "react-icons/fa6";

export const Route = createFileRoute("/app/")({
	component: DashboardPage,
});

function DashboardPage() {
	const [selectedTimePeriod, setSelectedTimePeriod] =
		useState<TimePeriodOption>("All");
	const [customRange, setCustomRange] = useState<{ start: string; end: string } | undefined>();
	const [stats, setStats] = useState<OverviewStats | null>(null);
	const [activity, setActivity] = useState<DayActivity[] | null>(null);
	const [topBets, setTopBets] = useState<TopBet[] | null>(null);

	const fetchData = useCallback((period: TimePeriodOption, range?: { start: string; end: string }) => {
		const { fromDate, toDate } = periodToDateRange(period, range);

		overviewService.getStats({ fromDate, toDate }).then((res) => {
			if (res.success && res.data) setStats(res.data);
		});
		overviewService.getActivity({ fromDate, toDate }).then((res) => {
			if (res.success && res.data) setActivity(res.data.days);
		});
		overviewService.getTopBets().then((res) => {
			if (res.success && res.data) setTopBets(res.data.bets);
		});
	}, []);

	useEffect(() => {
		fetchData("All");
	}, [fetchData]);

	const handlePeriodChange = (period: TimePeriodOption, range?: { start: string; end: string }) => {
		setSelectedTimePeriod(period);
		if (range) setCustomRange(range);
		fetchData(period, range);
	};

	if (!getCookie("admin_session")) {
		return <Navigate to="/sign-in" replace />;
	}

	const formatNumber = (n: number) => n.toLocaleString("en-NG");
	const formatNaira = (n: number) => `₦${n.toLocaleString("en-NG")}`;

	return (
		<div className="flex h-[calc(100vh-120px)] flex-1 flex-col overflow-hidden px-2 lg:px-4">
			<div className="flex-none mb-6 flex flex-wrap items-center justify-between gap-4">
				<h1 className="text-3xl font-bold text-gray-900">Overview</h1>
				<div className="flex flex-wrap items-center gap-3">
					<button className="flex cursor-pointer items-center gap-2 rounded-full bg-[#1BAA04] px-4 py-2 text-sm font-medium text-white hover:bg-[#0ea800]">
						<Plus className="h-4 w-4" />
						Add new user
					</button>
					<TimePeriodDropdown
						value={selectedTimePeriod}
						onChange={handlePeriodChange}
						buttonClassName="flex cursor-pointer items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
					/>
				</div>
			</div>

			<div className="flex-1 overflow-y-auto custom-scrollbar pb-10 space-y-6">
			<div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
				<StatCard
					title="Total Users"
					value={stats ? formatNumber(stats.totalUsers) : "..."}
					icon={<FaPeopleGroup className="h-5 w-5 text-[#001A26]" />}
				/>
				<StatCard
					title="Active Players"
					value={stats ? formatNumber(stats.activePlayers) : "..."}
					icon={<Gamepad2 className="h-5 w-5 text-[#001A26]" />}
				/>
				<StatCard
					title="Pending Payouts"
					value={stats ? formatNaira(stats.pendingPayouts) : "..."}
					icon={<CircleDotDashed className="h-5 w-5 text-[#001A26]" />}
				/>
				<StatCard
					title="Total Income"
					value={stats ? formatNaira(stats.totalIncome) : "..."}
					icon={<span className="font-bold text-lg text-[#001A26]">₦</span>}
				/>
			</div>

			<div className="grid grid-cols-1 gap-6 lg:grid-cols-[2fr_1fr]">
				<div className="min-h-[380px]">
					<ActivityChart data={activity ?? undefined} />
				</div>
				<div className="min-h-[380px]">
					<TopBets bets={topBets ?? undefined} />
				</div>
			</div>

			<div>
				<UserAnalyticsTable />
			</div>
			</div>
		</div>
	);
}
