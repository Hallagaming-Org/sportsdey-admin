import { createFileRoute, redirect } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { IoFilter } from "react-icons/io5";
import { type Column, DataTable } from "#/components/DataTable";
import {
	type TimePeriod,
	TimePeriodFilter,
} from "#/components/TimePeriodFilter";
import { ActivityChart as ActivityTrendChart } from "@/components/ActivityChart";
import { TicketsTrendPie } from "@/components/TicketsTrendPie";
import { type AdminActivity, getAdminActivity } from "@/lib/admin-activity";
import {
	type DayActivity,
	type TopBet as OverviewTopBet,
	overviewService,
	periodToDateRange,
} from "@/lib/overview";

export const Route = createFileRoute("/app/activity")({
	beforeLoad: ({ context }) => {
		const admin = (context as any).admin;
		if (
			admin &&
			admin.role !== "super_admin" &&
			!admin.permissions?.includes("reports_issues")
		) {
			throw redirect({ to: "/app", replace: true });
		}
	},
	component: ActivityPage,
});

function TopBets({ bets }: { bets: OverviewTopBet[] | null }) {
	const formatAmount = (amount: number) =>
		`NGN ${amount.toLocaleString("en-NG", {
			minimumFractionDigits: 2,
			maximumFractionDigits: 2,
		})}`;

	return (
		<div className="flex h-full flex-col rounded-2xl bg-white p-6 shadow-sm border border-gray-100">
			<div className="mb-6 flex items-center justify-between">
				<h3 className="font-bold text-lg text-gray-900">Top 5 Biggest Bets</h3>
				<button
					type="button"
					className="flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50"
				>
					<span className="hidden lg:block">Time periods</span>
					<IoFilter className="h-3.5 w-3.5" />
				</button>
			</div>
			<div className="flex flex-col gap-4">
				{bets?.map((bet) => (
					<div
						key={bet.id}
						className="flex flex-wrap sm:flex-nowrap xl:grid xl:grid-cols-[1fr_auto_1fr] items-center justify-between gap-3 w-full overflow-hidden"
					>
						<div className="flex items-center gap-3 min-w-0 shrink">
							<img
								src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${bet.id}`}
								alt={bet.playerName}
								className="h-8 w-8 rounded-full bg-[#FEECEB] object-cover shrink-0 p-1"
							/>
							<span
								className="font-bold text-sm text-gray-900 truncate"
								title={bet.playerName}
							>
								{bet.playerName}
							</span>
						</div>

						<div className="hidden xl:flex items-center justify-center px-4">
							<span className="text-gray-400 font-medium text-sm truncate">
								{bet.betType}
							</span>
						</div>

						<div className="flex items-center justify-end gap-4 shrink-0 sm:ml-auto">
							<span className="text-gray-400 font-medium text-sm truncate max-w-[80px] sm:max-w-none xl:hidden">
								{bet.betType}
							</span>
							<span className="font-bold text-sm text-gray-900 text-right whitespace-nowrap">
								{formatAmount(bet.amount)}
							</span>
						</div>
					</div>
				))}
			</div>
		</div>
	);
}

function ActivityPage() {
	const [page, setPage] = useState(1);
	const [adminActivities, setAdminActivities] = useState<AdminActivity[]>([]);
	const [activityPagination, setActivityPagination] = useState({
		totalPages: 1,
		total: 0,
	});
	const [isLoadingActivities, setIsLoadingActivities] = useState(true);
	const [activity, setActivity] = useState<DayActivity[] | null>(null);
	const [topBets, setTopBets] = useState<OverviewTopBet[] | null>(null);
	const [trendDateRange, setTrendDateRange] = useState<{
		fromDate?: string;
		toDate?: string;
	}>({});

	const fetchActivity = useCallback(
		(period: TimePeriod, range?: { start: string; end: string }) => {
			const normalizedPeriod =
				period === "Last week"
					? "A week ago"
					: period === "Last month"
						? "A month ago"
						: period;
			const { fromDate, toDate } = periodToDateRange(normalizedPeriod, range);
			setTrendDateRange({ fromDate, toDate });

			overviewService.getActivity({ fromDate, toDate }).then((res) => {
				if (res.success && res.data) setActivity(res.data.days);
			});
			overviewService.getTopBets({ fromDate, toDate }).then((res) => {
				if (res.success && res.data) setTopBets(res.data.bets);
			});
		},
		[],
	);

	useEffect(() => {
		fetchActivity("All");
	}, [fetchActivity]);

	useEffect(() => {
		setIsLoadingActivities(true);
		getAdminActivity({ page, limit: 10 }).then((res) => {
			if (res.success && res.data) {
				setAdminActivities(res.data.activities);
				setActivityPagination(res.data.pagination);
			}
			setIsLoadingActivities(false);
		});
	}, [page]);

	const columns: Column<AdminActivity>[] = [
		{
			header: "User ID",
			accessor: "adminId",
		},
		{
			header: "Full Name",
			accessor: (record) => (
				<div className="flex items-center gap-3 min-w-0">
					<img
						src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${record.adminId}`}
						alt="avatar"
						className="h-8 w-8 rounded-full bg-gray-100 object-cover shrink-0"
					/>
					<span
						className="font-medium text-sm text-gray-900 truncate"
						title={record.adminName}
					>
						{record.adminName}
					</span>
				</div>
			),
		},
		{
			header: "Email address",
			accessor: "adminEmail",
			cellClassName: "text-gray-500",
		},
		{
			header: "Role",
			accessor: "adminRole",
			cellClassName: "text-gray-500",
		},
		{
			header: "Action",
			accessor: "action",
			cellClassName: "text-gray-500",
		},
		{
			header: "Date",
			accessor: (record) => new Date(record.createdAt).toLocaleString("en-NG"),
			cellClassName: "text-gray-500",
		},
	];

	return (
		<div className="flex h-[calc(100vh-120px)] flex-1 flex-col overflow-hidden px-2 lg:px-4">
			<div className="flex-none mb-6 flex items-center justify-between">
				<h2 className="text-2xl font-bold text-gray-900">
					Activity Trends/Reports
				</h2>
				<TimePeriodFilter
					onFilterChange={fetchActivity}
					buttonClassName="flex items-center gap-2 rounded-lg bg-white border border-gray-200 px-3 py-2 text-xs font-medium text-gray-600 hover:bg-gray-50 cursor-pointer"
				/>
			</div>

			<div className="flex-1 overflow-y-auto custom-scrollbar pb-10 space-y-6">
				{/* Top Section */}
				<div className="h-[383px] w-full">
					<ActivityTrendChart showHeader={false} data={activity ?? undefined} />
				</div>

				{/* Middle Section */}
				<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
					<TicketsTrendPie {...trendDateRange} />
					<TopBets bets={topBets} />
				</div>

				{/* Bottom Section */}
				<div className="flex flex-col bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
					<div className="flex items-center justify-between p-6 pb-4">
						<h3 className="font-bold text-xl text-gray-900">Activity Log</h3>
					</div>

					<div>
						<DataTable
							data={adminActivities}
							columns={columns}
							isLoading={isLoadingActivities}
							emptyMessage="No activity found"
							pagination={{
								currentPage: page,
								totalPages: activityPagination.totalPages,
								onPageChange: setPage,
								totalItems: activityPagination.total,
								itemsPerPage: 10,
							}}
						/>
					</div>
				</div>
			</div>
		</div>
	);
}
