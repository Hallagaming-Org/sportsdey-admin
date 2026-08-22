import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { Copy, Eye, PauseCircle, Search } from "lucide-react";
import { useEffect, useState } from "react";
import {
	FaFileExcel,
	FaFileExport,
	FaFilePdf,
	FaFileWord,
} from "react-icons/fa6";
import { toast } from "sonner";
import NotificationIcon from "#/assets/NotificationIcon";
import { ActionDropdown } from "#/components/ActionDropdown";
import { type Column, DataTable } from "#/components/DataTable";
import { SendNoticeModal } from "#/components/SendNoticeModal";
import { TicketDetailsView } from "#/components/TicketDetailsView";
import {
	type TimePeriod,
	TimePeriodFilter,
} from "#/components/TimePeriodFilter";
import { UserProfileModal } from "#/components/UserProfileModal";
import { startAdminExport } from "#/lib/admin-exports";
import { notificationService } from "#/lib/notifications";
import {
	type TicketOutcome,
	type TicketRecord,
	type TicketTab,
	ticketService,
} from "#/lib/tickets";
import { getDateRangeForPeriod } from "#/lib/time-period";
import { type User, userService } from "#/lib/users";
import FilterIcon from "@/logo/filter.svg?react";
import SortIcon from "@/logo/sort.svg?react";

const copyToClipboard = (text: string, label = "Ticket ID") => {
	if (navigator?.clipboard?.writeText) {
		navigator.clipboard.writeText(text).then(
			() => toast.success(`${label} copied to clipboard`),
			() => fallbackCopy(text, label),
		);
	} else {
		fallbackCopy(text, label);
	}
};

const fallbackCopy = (text: string, label: string) => {
	const textArea = document.createElement("textarea");
	textArea.value = text;
	textArea.style.position = "fixed";
	textArea.style.left = "-9999px";
	document.body.appendChild(textArea);
	textArea.focus();
	textArea.select();
	try {
		document.execCommand("copy");
		toast.success(`${label} copied to clipboard`);
	} catch {
		toast.error(`Failed to copy ${label}`);
	}
	document.body.removeChild(textArea);
};

export const Route = createFileRoute("/app/tickets")({
	validateSearch: (search: Record<string, unknown>): { ticketId?: string } => ({
		ticketId: (search.ticketId as string) || undefined,
	}),
	beforeLoad: ({ context }) => {
		const admin = (context as any).admin;
		if (
			admin &&
			admin.role !== "super_admin" &&
			!admin.permissions?.includes("view_ticket_history")
		) {
			throw redirect({ to: "/app", replace: true });
		}
	},
	component: TicketsPage,
});

const OUTCOME_STYLES: Record<TicketOutcome, string> = {
	Won: "bg-[#E8F8E5] text-[#10C300]",
	Active: "bg-[#FFF8E5] text-[#FFB000]",
	Lost: "bg-[#FEECEB] text-[#EE201C]",
	Declined: "bg-[#F0F0F0] text-[#6B7280]",
};

const TABS: { key: TicketTab; label: string }[] = [
	{ key: "all", label: "All Tickets" },
	{ key: "casino", label: "Casino" },
	{ key: "sportsbook", label: "Sportsbook" },
	{ key: "prediction_market", label: "Prediction Market" },
];

const ITEMS_PER_PAGE = 10;

function TicketsPage() {
	const navigate = useNavigate();
	const searchParams = Route.useSearch();
	const ticketIdFromUrl = searchParams?.ticketId;
	const [activeTab, setActiveTab] = useState<TicketTab>("all");
	const [search, setSearch] = useState("");
	const [debouncedSearch, setDebouncedSearch] = useState("");
	const [page, setPage] = useState(1);
	const [selectedTimePeriod, setSelectedTimePeriod] =
		useState<TimePeriod>("All");
	const [customRange, setCustomRange] = useState<
		{ start: string; end: string } | undefined
	>(undefined);

	const [actionDropdown, setActionDropdown] = useState<{
		ticket: TicketRecord;
		top: number;
		right: number;
	} | null>(null);
	const [selectedTicketDetails, setSelectedTicketDetails] =
		useState<TicketRecord | null>(null);
	const [selectedProfileUser, setSelectedProfileUser] = useState<User | null>(
		null,
	);
	const [noticeModalUser, setNoticeModalUser] = useState<User | null>(null);
	const [showExportDropdown, setShowExportDropdown] = useState(false);
	const queryClient = useQueryClient();

	const exportTickets = (format: "xlsx" | "docx" | "pdf") =>
		void startAdminExport({
			source: "ticket-history",
			format,
			filters: {
				type: activeTab,
				search: debouncedSearch || undefined,
				fromDate: dateRange.fromDate,
				toDate: dateRange.toDate,
			},
		});

	const exportToExcel = () => exportTickets("xlsx");
	const exportToPdf = () => exportTickets("pdf");
	const exportToDocx = () => exportTickets("docx");

	const toggleSuspendMutation = useMutation({
		mutationFn: async ({
			userId,
		}: {
			userId: string;
			isReactivate?: boolean;
		}) => {
			const result = await userService.toggleUserSuspend(userId);
			if (!result.success)
				throw new Error(result.error || "Failed to toggle suspend status");
			return result;
		},
		onSuccess: (_, variables) => {
			toast.success(
				variables.isReactivate
					? "User reactivated successfully"
					: "User suspended successfully",
			);
			queryClient.invalidateQueries({ queryKey: ["tickets"] });
		},
		onError: (error) => {
			toast.error(error.message);
		},
	});

	useEffect(() => {
		const handleClickOutside = () => setActionDropdown(null);
		document.addEventListener("click", handleClickOutside);
		return () => document.removeEventListener("click", handleClickOutside);
	}, []);

	useEffect(() => {
		const timer = setTimeout(() => {
			setDebouncedSearch(search);
		}, 400);
		return () => clearTimeout(timer);
	}, [search]);

	const dateRange = getDateRangeForPeriod(selectedTimePeriod, customRange);

	const { data, isLoading } = useQuery({
		queryKey: [
			"tickets",
			activeTab,
			page,
			debouncedSearch,
			dateRange.fromDate,
			dateRange.toDate,
		],
		queryFn: async () => {
			const result = await ticketService.getTickets({
				page,
				limit: ITEMS_PER_PAGE,
				type: activeTab === "all" ? undefined : activeTab,
				search: debouncedSearch || undefined,
				fromDate: dateRange.fromDate,
				toDate: dateRange.toDate,
			});
			if (!result.success) throw new Error(result.error);
			return result.data;
		},
	});

	const columns: Column<TicketRecord>[] = [
		{
			header: "Bet ID",
			accessor: (t) => (
				<div className="flex items-center gap-1.5 font-mono text-xs">
					<span
						className="font-medium text-gray-900 truncate max-w-[90px]"
						title={t.id}
					>
						{t.id.length > 10 ? `${t.id.substring(0, 10)}...` : t.id}
					</span>
					<button
						type="button"
						onClick={(e) => {
							e.stopPropagation();
							navigator.clipboard.writeText(t.id);
							toast.success("Bet ID copied to clipboard");
						}}
						className="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
						title="Copy Bet ID"
					>
						<Copy className="w-3.5 h-3.5" />
					</button>
				</div>
			),
		},
		{
			header: "Player Name",
			accessor: (t) => (
				<span
					className="text-gray-900 font-medium text-xs leading-relaxed"
					title={t.playerName}
				>
					{t.playerName}
				</span>
			),
		},
		{
			header: "Bet Amount",
			accessor: (t) => (
				<span className="text-gray-900 font-bold text-xs leading-relaxed">
					{t.betAmount}
				</span>
			),
		},
		{
			header: "Potential Win",
			accessor: (t) => (
				<span className="text-gray-700 text-xs leading-relaxed font-semibold">
					{t.potentialWin ?? "—"}
				</span>
			),
		},
		{
			header: "Payout",
			accessor: (t) => (
				<span className="text-gray-700 text-xs leading-relaxed font-semibold">
					{t.payout || t.payOut || "—"}
				</span>
			),
		},
		{
			header: "Game type",
			accessor: (t) => (
				<span className="text-gray-500 text-xs leading-relaxed">
					{t.gameType}
				</span>
			),
		},
		{
			header: "Game Name",
			accessor: (t) => (
				<span className="text-gray-500 text-xs leading-relaxed">
					{t.gameName ?? "—"}
				</span>
			),
		},
		{
			header: "Provider",
			accessor: (t) => (
				<span className="text-gray-500 text-xs leading-relaxed font-mono">
					{t.provider ?? "—"}
				</span>
			),
		},
		{
			header: "Round ID",
			accessor: (t) =>
				t.roundId ? (
					<div className="flex items-center gap-1.5 font-mono text-xs">
						<span
							className="text-gray-500 truncate max-w-[80px]"
							title={t.roundId}
						>
							{t.roundId.length > 8
								? `${t.roundId.substring(0, 8)}...`
								: t.roundId}
						</span>
						<button
							type="button"
							onClick={(e) => {
								e.stopPropagation();
								navigator.clipboard.writeText(t.roundId!);
								toast.success("Round ID copied to clipboard");
							}}
							className="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
							title="Copy Round ID"
						>
							<Copy className="w-3 h-3" />
						</button>
					</div>
				) : (
					<span className="text-gray-400 text-xs">—</span>
				),
		},
		{
			header: "Odds",
			accessor: (t) => (
				<span className="text-gray-500 text-xs leading-relaxed font-mono">
					{t.odds ??
						(t as any).odd ??
						(t as any).totalOdds ??
						(t as any).multiplier ??
						"—"}
				</span>
			),
		},
		{
			header: "Date",
			accessor: (t) => (
				<span className="text-gray-500 text-xs leading-relaxed">
					{t.createdAt}
				</span>
			),
		},
		{
			header: "Balance Before",
			accessor: (t) => (
				<span className="text-gray-500 text-xs leading-relaxed">
					{t.balanceBefore ?? "—"}
				</span>
			),
		},
		{
			header: "Balance After",
			accessor: (t) => (
				<span className="text-gray-500 text-xs leading-relaxed">
					{t.balanceAfter ?? "—"}
				</span>
			),
		},
		{
			header: "Status",
			accessor: (t) => {
				const outcomeKey = (
					t.outcome === "Won"
						? "Won"
						: (t.outcome as any) === "Active" ||
								(t.outcome as any) === "Pending"
							? "Active"
							: "Lost"
				) as TicketOutcome;
				return (
					<span
						className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${OUTCOME_STYLES[outcomeKey] || "bg-gray-100 text-gray-700"}`}
					>
						{t.outcome === "Active" ? "Pending" : t.outcome}
					</span>
				);
			},
		},
	];

	const getMockUserFromTicket = (ticket: TicketRecord): User => {
		return {
			id: ticket.userId || (ticket as any).playerId || ticket.id,
			name: ticket.playerName,
			email: `${ticket.playerName.split(" ")[0].toLowerCase()}@example.com`,
			wallet: 0,
			status: "verified",
			registeredDate: Date.now(),
			suspended: ticket.userSuspended,
		};
	};

	const tickets = data?.tickets ?? [];
	const totalPages = data?.pagination.totalPages ?? 1;
	const totalItems = data?.pagination.total ?? 0;

	const { data: ticketDetailsData } = useQuery({
		queryKey: ["url-ticket-details", ticketIdFromUrl],
		queryFn: async () => {
			if (!ticketIdFromUrl) return null;
			const res = await ticketService.getTicketDetails(ticketIdFromUrl);
			if (res.success && res.data) return res.data;
			return null;
		},
		enabled: !!ticketIdFromUrl,
	});

	const activeTicketDetails =
		selectedTicketDetails ||
		ticketDetailsData ||
		(ticketIdFromUrl ? tickets.find((t) => t.id === ticketIdFromUrl) : null);

	const shouldRenderTicketDetails = !!activeTicketDetails || !!ticketIdFromUrl;

	if (shouldRenderTicketDetails) {
		const ticketToPass =
			activeTicketDetails || ({ id: ticketIdFromUrl } as TicketRecord);
		return (
			<>
				<TicketDetailsView
					ticket={ticketToPass}
					onBack={() => {
						setSelectedTicketDetails(null);
						navigate({
							to: "/app/tickets",
							search: { ticketId: undefined },
							replace: true,
						});
					}}
					onViewPlayerProfile={(user) => {
						setSelectedProfileUser(user);
					}}
					onSuspendPlayer={(userId, isReactivate) => {
						toggleSuspendMutation.mutate({ userId, isReactivate });
						setSelectedTicketDetails((prev) =>
							prev ? { ...prev, userSuspended: !isReactivate } : null,
						);
					}}
				/>

				{selectedProfileUser && (
					<UserProfileModal
						user={selectedProfileUser}
						onClose={() => setSelectedProfileUser(null)}
						onSendNotice={(user) => {
							setNoticeModalUser(user);
							setSelectedProfileUser(null);
						}}
						onSuspend={(user) => {
							toggleSuspendMutation.mutate({
								userId: user.id,
								isReactivate: user.suspended,
							});
						}}
					/>
				)}

				{noticeModalUser && (
					<SendNoticeModal
						user={noticeModalUser}
						availableUsers={[noticeModalUser]}
						onClose={() => setNoticeModalUser(null)}
						onSubmit={async (data) => {
							const result = await notificationService.sendNotification({
								title: data.title,
								message: data.message,
								userId: noticeModalUser.id,
							});
							if (result.success) {
								toast.success(`Notice sent to ${noticeModalUser.name}`);
							} else {
								toast.error(result.error || "Failed to send notice");
							}
						}}
					/>
				)}
			</>
		);
	}

	return (
		<div className="flex h-[calc(100vh-120px)] flex-col gap-6 overflow-hidden px-8">
			<div className="flex-none flex items-center justify-between">
				<div>
					<h2 className="font-bold text-2xl text-gray-900">Tickets</h2>
					<p className="text-sm text-gray-500 mt-0.5">
						<span
							className="relative font-medium cursor-pointer text-[#001A26] after:absolute after:bottom-0 after:left-0 after:h-px after:w-0 after:bg-[#001A26] after:transition-all after:duration-500 hover:after:w-full"
							onClick={() => navigate({ to: "/app" })}
						>
							Dashboard
						</span>{" "}
						&rsaquo; Ticket history
					</p>
				</div>
				<div className="flex items-center gap-3">
					<button className="inline-flex cursor-pointer items-center gap-2 rounded-full border-2 border-primary px-2 py-2 font-medium text-gray-900 text-sm hover:bg-gray-50">
						<SortIcon className="h-3 w-3" />
						Sort
					</button>
					<button className="inline-flex cursor-pointer items-center gap-2 rounded-full border-2 border-primary px-2 py-2 font-medium text-gray-900 text-sm hover:bg-gray-50">
						<FilterIcon className="h-3 w-3" />
						Filter
					</button>
				</div>
			</div>

			<div className="flex-none flex items-center justify-between gap-4">
				<div className="flex gap-8 border-b border-gray-200">
					{TABS.map((tab) => (
						<button
							key={tab.key}
							type="button"
							onClick={() => {
								setActiveTab(tab.key);
								setPage(1);
							}}
							className={`pb-3 font-medium text-sm transition-colors cursor-pointer ${
								activeTab === tab.key
									? "border-b-2 border-[#1BAA04] text-[#1BAA04]"
									: "text-gray-500 hover:text-gray-800"
							}`}
						>
							{tab.label}
						</button>
					))}
				</div>
				<div className="flex items-center gap-2">
					<div className="relative">
						<input
							type="text"
							placeholder="Search"
							value={search}
							onChange={(e) => {
								setSearch(e.target.value);
								setPage(1);
							}}
							className="w-[240px] rounded-full border border-gray-200 bg-gray-50 py-2 pr-4 pl-9 text-sm focus:border-[#1BAA04] focus:outline-none focus:ring-1 focus:ring-[#1BAA04]"
						/>
						<Search className="absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
					</div>
					<TimePeriodFilter
						onFilterChange={(period, range) => {
							setSelectedTimePeriod(period);
							setCustomRange(range);
						}}
						buttonClassName="inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-2 text-xs font-medium text-gray-600 hover:bg-gray-50 cursor-pointer whitespace-nowrap"
					/>

					{tickets.length > 0 && (
						<div className="relative">
							<button
								type="button"
								onClick={(e) => {
									e.stopPropagation();
									if (e.nativeEvent) {
										e.nativeEvent.stopImmediatePropagation();
									}
									setShowExportDropdown(!showExportDropdown);
								}}
								className="inline-flex items-center h-8 gap-1.5 rounded-full bg-[#1BAA04] px-3.5 py-1.5 text-xs font-medium text-white cursor-pointer hover:bg-[#158903] transition-colors whitespace-nowrap"
							>
								Export File as
								<FaFileExport className="h-3 w-3 text-white" />
							</button>

							{showExportDropdown && (
								<div className="absolute right-0 z-[70] mt-2 w-40 rounded-xl border border-gray-200 bg-white p-1 shadow-lg overflow-hidden">
									<button
										type="button"
										onClick={(e) => {
											e.stopPropagation();
											setShowExportDropdown(false);
											exportToPdf();
										}}
										className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
									>
										<FaFilePdf className="text-red-500 w-4 h-4" />
										PDF
									</button>
									<button
										type="button"
										onClick={(e) => {
											e.stopPropagation();
											setShowExportDropdown(false);
											exportToDocx();
										}}
										className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
									>
										<FaFileWord className="text-blue-600 w-4 h-4" />
										DOCX
									</button>
									<button
										type="button"
										onClick={(e) => {
											e.stopPropagation();
											setShowExportDropdown(false);
											exportToExcel();
										}}
										className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
									>
										<FaFileExcel className="text-green-600 w-4 h-4" />
										Excel
									</button>
								</div>
							)}
						</div>
					)}
				</div>
			</div>

			<div className="flex-1 min-h-0">
				<DataTable
					data={tickets}
					columns={columns}
					maxHeight="100%"
					isLoading={isLoading}
					onActionClick={(ticket, e) => {
						e.stopPropagation();
						e.nativeEvent.stopImmediatePropagation();
						const rect = e.currentTarget.getBoundingClientRect();
						setActionDropdown({
							ticket,
							top: rect.bottom + window.scrollY,
							right: window.innerWidth - rect.right,
						});
					}}
					emptyMessage="No tickets found"
					pagination={{
						currentPage: page,
						totalPages,
						onPageChange: setPage,
						totalItems,
						itemsPerPage: ITEMS_PER_PAGE,
					}}
				/>
			</div>

			{actionDropdown && (
				<ActionDropdown
					top={actionDropdown.top}
					right={actionDropdown.right}
					onClose={() => setActionDropdown(null)}
					items={[
						{
							icon: <Copy className="w-4 h-4" />,
							label: "Copy ticket ID",
							onClick: () => {
								copyToClipboard(actionDropdown.ticket.id, "Ticket ID");
								setActionDropdown(null);
							},
						},
						{
							icon: <Eye className="w-4 h-4" />,
							label: "View ticket details",
							onClick: () => {
								setSelectedTicketDetails(actionDropdown.ticket);
								navigate({
									to: "/app/tickets",
									search: { ticketId: actionDropdown.ticket.id },
									replace: true,
								});
								setActionDropdown(null);
							},
						},
						{
							icon: <Eye className="w-4 h-4" />,
							label: "View player profile",
							onClick: () => {
								setSelectedProfileUser(
									getMockUserFromTicket(actionDropdown.ticket),
								);
								setActionDropdown(null);
							},
						},
						{
							icon: <NotificationIcon height={"14"} width={"14"} />,
							label: "Send a notification",
							onClick: () => {
								setNoticeModalUser(
									getMockUserFromTicket(actionDropdown.ticket),
								);
								setActionDropdown(null);
							},
						},
						{
							icon: <PauseCircle className="w-4 h-4" />,
							label: actionDropdown.ticket.userSuspended
								? "Reactivate"
								: "Suspend",
							onClick: () => {
								toggleSuspendMutation.mutate({
									userId:
										actionDropdown.ticket.userId ||
										(actionDropdown.ticket as any).playerId ||
										actionDropdown.ticket.id,
									isReactivate: actionDropdown.ticket.userSuspended,
								});
								setActionDropdown(null);
							},
						},
					]}
				/>
			)}

			{selectedProfileUser && (
				<UserProfileModal
					user={selectedProfileUser}
					onClose={() => setSelectedProfileUser(null)}
					onSendNotice={(user) => {
						setNoticeModalUser(user);
						setSelectedProfileUser(null);
					}}
					onSuspend={(user) => {
						toggleSuspendMutation.mutate({
							userId: user.id,
							isReactivate: user.suspended,
						});
					}}
				/>
			)}

			{noticeModalUser && (
				<SendNoticeModal
					user={noticeModalUser}
					availableUsers={[noticeModalUser]}
					onClose={() => setNoticeModalUser(null)}
					onSubmit={async (data) => {
						const result = await notificationService.sendNotification({
							title: data.title,
							message: data.message,
							userId: noticeModalUser.id,
						});
						if (result.success) {
							toast.success(`Notice sent to ${noticeModalUser.name}`);
						} else {
							toast.error(result.error || "Failed to send notice");
						}
					}}
				/>
			)}
		</div>
	);
}
