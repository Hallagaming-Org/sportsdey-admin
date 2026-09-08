import { createFileRoute, redirect } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { IoFilter } from "react-icons/io5";
import { Copy, Download, Eye, Flag } from "lucide-react";
import { toast } from "sonner";
import { type Column, DataTable } from "#/components/DataTable";
import {
	type TimePeriod,
	TimePeriodFilter,
} from "#/components/TimePeriodFilter";
import { ActivityChart as ActivityTrendChart } from "@/components/ActivityChart";
import { ActivityLogDetailsModal } from "@/components/ActivityLogDetailsModal";
import { TicketsTrendPie } from "@/components/TicketsTrendPie";
import {
	formatActivityAmount,
	type AdminActivity,
	getAdminActivity,
	getAdminActivityDetail,
} from "@/lib/admin-activity";
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
	const [selectedActivity, setSelectedActivity] = useState<AdminActivity | null>(null);
	const [reportActivity, setReportActivity] = useState<AdminActivity | null>(null);
	const [reportText, setReportText] = useState("");
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
			accessor: "userId",
		},
		{
			header: "Full Name",
			accessor: (record) => (
				<div className="flex items-center gap-3 min-w-0">
					<img
						src={record.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${record.userId}`}
						alt="avatar"
						className="h-8 w-8 rounded-full bg-gray-100 object-cover shrink-0"
					/>
					<span
						className="font-medium text-sm text-gray-900 truncate"
						title={record.fullName}
					>
						{record.fullName}
					</span>
				</div>
			),
		},
		{
			header: "Email address",
			accessor: "emailAddress",
			cellClassName: "text-gray-500",
		},
		{
			header: "Role",
			accessor: "role",
			cellClassName: "text-gray-500",
		},
		{
			header: "Action",
			accessor: (record) => (
				<div className="min-w-[220px] whitespace-normal">
					<div className="font-medium text-gray-900">{record.action}</div>
					{record.targetUser && (
						<div className="mt-1 text-xs text-gray-500">
							<span className="font-medium text-gray-700">{record.targetUser.name || "User"}</span>
							<span> · User ID: {record.targetUser.id}</span>
						</div>
					)}
					{record.details?.transactionType && (
						<div className={`mt-1 text-xs ${record.details.transactionType === "credit" ? "text-[#10C300]" : "text-[#EE201C]"}`}>
							{record.details.transactionType === "credit" ? "Credited" : "Debited"} {formatActivityAmount(record)}
							{record.details.reason ? ` · ${record.details.reason}` : ""}
						</div>
					)}
				</div>
			),
		},
		{
			header: "Username",
			accessor: (record) => record.username || "—",
			cellClassName: "text-gray-500",
		},
		{
			header: "Date",
			accessor: (record) => new Date(record.createdAt).toLocaleString("en-NG"),
			cellClassName: "text-gray-500",
		},
		{
			header: "Status",
			accessor: (record) => {
				const online = record.status === "online";
				return <span className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${online ? "bg-[#E8F8E5] text-[#10C300]" : "bg-[#FEECEB] text-[#EE201C]"}`}>{online ? "Online" : "Offline"}</span>;
			},
		},
	];

	const downloadActivity = async (record: AdminActivity) => {
		const response = await getAdminActivityDetail(record.id);
		if (!response.success || !response.data) return toast.error(response.error || "Could not download activity log");
		const blob = new Blob([JSON.stringify(response.data, null, 2)], { type: "application/json" });
		const url = URL.createObjectURL(blob);
		const anchor = document.createElement("a");
		anchor.href = url; anchor.download = `activity-log-${record.id}.json`; anchor.click();
		URL.revokeObjectURL(url);
	};
	const copyActivityLink = async (record: AdminActivity) => {
		await navigator.clipboard?.writeText(`${window.location.origin}/app/activity?activityId=${encodeURIComponent(record.id)}`);
		toast.success("Protected activity-log link copied");
	};

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
							actionMenuItems={[
								{ label: "View Details", icon: <Eye className="h-4 w-4" />, onClick: setSelectedActivity },
								{ label: "Download Activity Log", icon: <Download className="h-4 w-4" />, onClick: downloadActivity },
								{ label: "Copy Log Link", icon: <Copy className="h-4 w-4" />, onClick: copyActivityLink },
								{ label: "Report this Activity", icon: <Flag className="h-4 w-4" />, onClick: setReportActivity },
							]}
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
			<ActivityLogDetailsModal
				activity={selectedActivity}
				isOpen={selectedActivity !== null}
				onClose={() => setSelectedActivity(null)}
			/>
			{reportActivity && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"><form onSubmit={(event) => { event.preventDefault(); toast.success("Report captured locally. No report recipient is configured yet."); setReportActivity(null); setReportText(""); }} className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"><h2 className="text-lg font-bold">Report Activity</h2><p className="mt-1 text-sm text-gray-500">Activity ID: {reportActivity.id}</p><textarea required value={reportText} onChange={(event) => setReportText(event.target.value)} placeholder="Describe the issue" className="mt-4 h-28 w-full rounded-lg border border-gray-300 p-3 text-sm" /><div className="mt-4 flex justify-end gap-3"><button type="button" onClick={() => setReportActivity(null)} className="rounded-lg px-4 py-2 text-sm">Cancel</button><button className="rounded-lg bg-[#1BAA04] px-4 py-2 text-sm font-medium text-white">Submit report</button></div></form></div>}
		</div>
	);
}
