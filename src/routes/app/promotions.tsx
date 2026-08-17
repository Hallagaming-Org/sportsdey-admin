import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import {
	ChevronDown,
	ChevronUp,
	Gamepad2,
	MoreHorizontal,
	Plus,
	X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FaFutbol, FaPeopleGroup } from "react-icons/fa6";
import { toast } from "sonner";
import {
	TimePeriodDropdown,
	type TimePeriodOption,
} from "#/components/TimePeriodDropdown";
import {
	Command,
	CommandEmpty,
	CommandInput,
	CommandItem,
	CommandList,
} from "@/components/ui/command";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { periodToDateRange } from "@/lib/overview";
import {
	type BetBoostCreatePayload,
	type Promotion,
	type PromotionStatusFilter,
	type PromotionTypeFilter,
	promotionsService,
	type SportsbookOption,
	type StatusSplit,
	sportsbookService,
} from "@/lib/promotions";

export const Route = createFileRoute("/app/promotions")({
	component: SportsbookPromotionsPage,
});

const TYPE_FILTER_OPTIONS: { label: string; value: PromotionTypeFilter }[] = [
	{ label: "All", value: "all" },
	{ label: "Deposit Match", value: "deposit_match" },
	{ label: "Free Bet", value: "freebets" },
	{ label: "Accumulator", value: "bet_boost" },
];

const STATUS_FILTER_OPTIONS: { label: string; value: PromotionStatusFilter }[] =
	[
		{ label: "All", value: "all" },
		{ label: "Active", value: "active" },
		{ label: "Expired", value: "expired" },
	];

const ELIGIBLE_USER_OPTIONS = ["All Users", "New Users", "VIP Users"];

const ELIGIBLE_SPORTS_OPTIONS = ["Football", "Basketball", "Tennis"];

const SPORT_ID_MAP: Record<string, string> = {
	Football: "football",
	Basketball: "basketball",
	Tennis: "tennis",
};

const TOURNAMENT_PAGE_LIMIT = 50;
const EVENT_PAGE_LIMIT = 100;

function dedupeOptions(options: SportsbookOption[]): SportsbookOption[] {
	const seen = new Set<string>();
	const result: SportsbookOption[] = [];
	for (const option of options) {
		if (seen.has(option.id)) continue;
		seen.add(option.id);
		result.push(option);
	}
	return result;
}

function eligibleUsersValue(label: string): string {
	if (label === "New Users") return "new";
	if (label === "VIP Users") return "vip";
	return "all";
}

type MockStatus = "Enable" | "Disabled" | "Active";

interface ViewPromotion {
	id: string;
	name: string;
	type: string;
	eligibleUsers: string;
	endDate: string;
	status: Promotion["status"] | MockStatus;
	dataBetBoostId?: string | null;
}

function formatEndDate(iso: string): string {
	return new Date(iso).toLocaleDateString("en-US", {
		month: "short",
		day: "numeric",
		year: "numeric",
	});
}

function formatNaira(n: number): string {
	return `₦${n.toLocaleString("en-NG", { maximumFractionDigits: 0 })}`;
}

function SportsbookPromotionsPage() {
	const [currentPage, setCurrentPage] = useState(1);
	const [limit] = useState(10);
	const [typeFilter, setTypeFilter] = useState<string>("All");
	const [statusFilter, setStatusFilter] = useState<string>("All");

	// Time period filter (same convention as other admin endpoints)
	const [selectedTimePeriod, setSelectedTimePeriod] =
		useState<TimePeriodOption>("All");
	const [customRange, setCustomRange] = useState<
		{ start: string; end: string } | undefined
	>();
	const timeRange = periodToDateRange(selectedTimePeriod, customRange);

	// Unbacked (local-only) UI state
	const [createdPromotions, setCreatedPromotions] = useState<ViewPromotion[]>(
		[],
	);
	const [statusOverrides, setStatusOverrides] = useState<
		Record<string, ViewPromotion["status"]>
	>({});
	const [deletedIds, setDeletedIds] = useState<Set<string>>(new Set());
	const [activeActionMenuId, setActiveActionMenuId] = useState<string | null>(
		null,
	);
	const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
	const [newPromo, setNewPromo] = useState({
		name: "",
		type: "Deposit Match",
		eligibleUsers: "New users",
		status: "Enable" as MockStatus,
	});

	// Dropdown open states
	const [showTypeDropdown, setShowTypeDropdown] = useState(false);
	const [showStatusDropdown, setShowStatusDropdown] = useState(false);
	const [showCreateDropdown, setShowCreateDropdown] = useState(false);
	const [isAccumulatorModalOpen, setIsAccumulatorModalOpen] = useState(false);

	const [accaForm, setAccaForm] = useState({
		boostName: "Weekend Acca Bonus",
		description: "",
		minSelectionsLeft: "0",
		minSelectionsRight: "0",
		minOdds: "",
		boostPercentage: "0",
		eligibleUsers: "All Users",
		eligibleSports: "Football",
		competitionIds: [] as string[],
		eligibleEventIds: [] as string[],
		endDate: "2025-08-31T23:59",
	});

	const [tournaments, setTournaments] = useState<SportsbookOption[]>([]);
	const [tournamentOffset, setTournamentOffset] = useState(0);
	const [tournamentHasMore, setTournamentHasMore] = useState(false);
	const [tournamentSearch, setTournamentSearch] = useState("");
	const [debouncedTournamentSearch, setDebouncedTournamentSearch] =
		useState("");
	const [events, setEvents] = useState<SportsbookOption[]>([]);
	const [eventOffset, setEventOffset] = useState(0);
	const [eventHasMore, setEventHasMore] = useState(false);
	const [loadingTournaments, setLoadingTournaments] = useState(false);
	const [loadingMoreTournaments, setLoadingMoreTournaments] = useState(false);
	const [loadingEvents, setLoadingEvents] = useState(false);
	const [loadingMoreEvents, setLoadingMoreEvents] = useState(false);
	const [submitting, setSubmitting] = useState(false);

	const activeSportId = SPORT_ID_MAP[accaForm.eligibleSports] ?? "football";
	const tournamentRequestId = useRef(0);
	const eventRequestId = useRef(0);

	const loadTournamentPage = useCallback(
		async (offset: number, append: boolean, name?: string) => {
			const requestId = ++tournamentRequestId.current;
			const sportId = activeSportId;
			if (append) setLoadingMoreTournaments(true);
			else setLoadingTournaments(true);
			try {
				const res = await sportsbookService.getTournaments([sportId], {
					offset,
					limit: TOURNAMENT_PAGE_LIMIT,
					name: name || undefined,
				});
				if (requestId !== tournamentRequestId.current) return;
				const page = res.success && res.data ? res.data : null;
				const pageTournaments = page?.tournaments ?? [];
				setTournaments((prev) =>
					append
						? dedupeOptions([...prev, ...pageTournaments])
						: pageTournaments,
				);
				setTournamentOffset(
					page?.pagination.hasMore ? offset + TOURNAMENT_PAGE_LIMIT : offset,
				);
				setTournamentHasMore(page?.pagination.hasMore ?? false);
			} catch {
				if (requestId !== tournamentRequestId.current) return;
				if (!append) setTournaments([]);
				setTournamentHasMore(false);
			}
			if (requestId === tournamentRequestId.current) {
				setLoadingTournaments(false);
				setLoadingMoreTournaments(false);
			}
		},
		[activeSportId],
	);

	const loadMoreTournaments = useCallback(() => {
		if (loadingMoreTournaments || loadingTournaments || !tournamentHasMore) {
			return;
		}
		loadTournamentPage(tournamentOffset, true, debouncedTournamentSearch);
	}, [
		loadingMoreTournaments,
		loadingTournaments,
		tournamentHasMore,
		tournamentOffset,
		debouncedTournamentSearch,
		loadTournamentPage,
	]);

	const loadEventPage = useCallback(
		async (offset: number, append: boolean) => {
			const requestId = ++eventRequestId.current;
			const sportId = activeSportId;
			if (append) setLoadingMoreEvents(true);
			else setLoadingEvents(true);
			try {
				const res = await sportsbookService.getEvents(sportId, {
					offset,
					limit: EVENT_PAGE_LIMIT,
				});
				if (requestId !== eventRequestId.current) return;
				const page = res.success && res.data ? res.data : null;
				const pageEvents = page?.events ?? [];
				setEvents((prev) =>
					append ? dedupeOptions([...prev, ...pageEvents]) : pageEvents,
				);
				setEventOffset(
					page?.pagination.hasMore ? offset + EVENT_PAGE_LIMIT : offset,
				);
				setEventHasMore(page?.pagination.hasMore ?? false);
			} catch {
				if (requestId !== eventRequestId.current) return;
				if (!append) setEvents([]);
				setEventHasMore(false);
			}
			if (requestId === eventRequestId.current) {
				setLoadingEvents(false);
				setLoadingMoreEvents(false);
			}
		},
		[activeSportId],
	);

	const loadMoreEvents = useCallback(() => {
		if (loadingMoreEvents || loadingEvents || !eventHasMore) {
			return;
		}
		loadEventPage(eventOffset, true);
	}, [
		loadingMoreEvents,
		loadingEvents,
		eventHasMore,
		eventOffset,
		loadEventPage,
	]);

	const typeValue =
		TYPE_FILTER_OPTIONS.find((o) => o.label === typeFilter)?.value ?? "all";
	const statusValue =
		STATUS_FILTER_OPTIONS.find((o) => o.label === statusFilter)?.value ?? "all";

	const handlePeriodChange = (
		period: TimePeriodOption,
		range?: { start: string; end: string },
	) => {
		setSelectedTimePeriod(period);
		if (range) setCustomRange(range);
		setCurrentPage(1);
	};

	const overviewQuery = useQuery({
		queryKey: ["admin-promotions-overview", selectedTimePeriod, customRange],
		queryFn: async () => {
			const res = await promotionsService.getOverview(timeRange);
			if (!res.success) throw new Error(res.error || "Failed to load overview");
			const data = res.data;
			if (!data) throw new Error("No overview data");
			return data;
		},
	});

	const statusSplitQuery = useQuery({
		queryKey: [
			"admin-promotions-status-split",
			selectedTimePeriod,
			customRange,
		],
		queryFn: async () => {
			const res = await promotionsService.getStatusSplit(timeRange);
			if (!res.success)
				throw new Error(res.error || "Failed to load status split");
			const data = res.data;
			if (!data) throw new Error("No status split data");
			return data;
		},
	});

	const promotionsQuery = useQuery({
		queryKey: [
			"admin-promotions",
			typeValue,
			statusValue,
			selectedTimePeriod,
			customRange,
			currentPage,
			limit,
		],
		queryFn: async () => {
			const res = await promotionsService.getPromotions({
				promotionType: typeValue,
				status: statusValue,
				fromDate: timeRange.fromDate,
				toDate: timeRange.toDate,
				page: currentPage,
				limit,
			});
			if (!res.success)
				throw new Error(res.error || "Failed to load promotions");
			const data = res.data;
			if (!data) throw new Error("No promotions data");
			return data;
		},
	});

	const overview = overviewQuery.data;
	const statusSplit = statusSplitQuery.data;
	const promotions = promotionsQuery.data?.promotions ?? [];
	const pagination = promotionsQuery.data?.pagination;

	const viewPromotions = useMemo(() => {
		const serverRows = promotions.map((promo) => ({
			...promo,
			status: statusOverrides[promo.id] ?? promo.status,
		}));
		return [
			...createdPromotions,
			...serverRows.filter((p) => !deletedIds.has(p.id)),
		];
	}, [promotions, createdPromotions, statusOverrides, deletedIds]);

	const toggleStatus = (id: string) => {
		setStatusOverrides((prev) => {
			const row = viewPromotions.find((p) => p.id === id);
			const base = row?.status ?? "active";
			return {
				...prev,
				[id]: base === "Disabled" ? "Enable" : "Disabled",
			};
		});
		setActiveActionMenuId(null);
	};

	const deletePromotion = async (id: string) => {
		if (createdPromotions.some((p) => p.id === id)) {
			setCreatedPromotions((prev) => prev.filter((p) => p.id !== id));
			setActiveActionMenuId(null);
			return;
		}
		const promo = viewPromotions.find((p) => p.id === id);
		if (promo?.type === "Bet Boost" && promo.dataBetBoostId) {
			const res = await sportsbookService.deleteBetBoost(promo.dataBetBoostId);
			if (res.success) {
				toast.success("Accumulator boost deleted");
				setDeletedIds((prev) => new Set(prev).add(id));
				promotionsQuery.refetch();
			} else {
				toast.error(res.error || "Failed to delete accumulator boost");
			}
		} else {
			setDeletedIds((prev) => new Set(prev).add(id));
		}
		setActiveActionMenuId(null);
	};

	const handleCreatePromotion = (e: React.FormEvent) => {
		e.preventDefault();
		if (!newPromo.name.trim()) return;
		const created: ViewPromotion = {
			id: `local-${Date.now()}`,
			name: newPromo.name.trim(),
			type: newPromo.type,
			eligibleUsers: newPromo.eligibleUsers,
			endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
			status: newPromo.status,
		};
		setCreatedPromotions((prev) => [created, ...prev]);
		setIsCreateModalOpen(false);
		setNewPromo({
			name: "",
			type: "Deposit Match",
			eligibleUsers: "New users",
			status: "Enable",
		});
	};

	const handleAccaUpload = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!accaForm.boostName.trim()) return;
		setSubmitting(true);
		const payload: BetBoostCreatePayload = {
			boostName: accaForm.boostName.trim(),
			description: accaForm.description,
			boostPercentage: Number.parseFloat(accaForm.boostPercentage) || 0,
			eligibleUsers: eligibleUsersValue(accaForm.eligibleUsers),
			eligibleSports: [accaForm.eligibleSports],
			minimumSelections: parseInt(accaForm.minSelectionsLeft, 10) || 1,
			maximumSelections: parseInt(accaForm.minSelectionsRight, 10) || 1,
			competitionIDs: accaForm.competitionIds,
			eligibleEventsID: accaForm.eligibleEventIds,
			minimumOddsPerSelection: Number.parseFloat(accaForm.minOdds) || 0,
			endDateTime: new Date(accaForm.endDate).toISOString(),
		};
		const res = await sportsbookService.createBetBoost(payload);
		setSubmitting(false);
		if (!res.success) {
			toast.error(res.error || "Failed to create accumulator boost");
			return;
		}
		toast.success("Accumulator boost created successfully");
		setIsAccumulatorModalOpen(false);
		promotionsQuery.refetch();
		overviewQuery.refetch();
		statusSplitQuery.refetch();
	};

	useEffect(() => {
		if (!isAccumulatorModalOpen) return;
		setLoadingEvents(true);
		setTournamentSearch("");
		setDebouncedTournamentSearch("");
		setAccaForm((prev) => ({
			...prev,
			competitionIds: [],
			eligibleEventIds: [],
		}));
		setEventOffset(0);
		setEventHasMore(false);
		setTournamentOffset(0);
		setTournamentHasMore(false);
		loadEventPage(0, false);
	}, [isAccumulatorModalOpen, loadEventPage]);

	useEffect(() => {
		const timeout = window.setTimeout(() => {
			setDebouncedTournamentSearch(tournamentSearch.trim());
		}, 300);
		return () => window.clearTimeout(timeout);
	}, [tournamentSearch]);

	useEffect(() => {
		if (!isAccumulatorModalOpen) return;
		setTournamentOffset(0);
		setTournamentHasMore(false);
		loadTournamentPage(0, false, debouncedTournamentSearch);
	}, [
		isAccumulatorModalOpen,
		debouncedTournamentSearch,
		loadTournamentPage,
	]);

	const stepSelection = (
		key: "minSelectionsLeft" | "minSelectionsRight",
		delta: number,
	) => {
		setAccaForm((prev) => ({
			...prev,
			[key]: String(
				Math.min(99, Math.max(0, (parseInt(prev[key], 10) || 0) + delta)),
			),
		}));
	};

	const stepBoost = (delta: number) => {
		setAccaForm((prev) => ({
			...prev,
			boostPercentage: String(
				Math.min(
					100,
					Math.max(0, (parseInt(prev.boostPercentage, 10) || 0) + delta),
				),
			),
		}));
	};

	useEffect(() => {
		if (!activeActionMenuId) return;
		const handleClickOutside = (event: MouseEvent) => {
			const target = event.target as Node;
			if (target instanceof Element && target.closest("[data-action-menu]")) {
				return;
			}
			setActiveActionMenuId(null);
		};
		document.addEventListener("mousedown", handleClickOutside);
		return () => document.removeEventListener("mousedown", handleClickOutside);
	}, [activeActionMenuId]);

	return (
		<div className="flex h-full flex-col overflow-y-auto px-2 lg:px-4 pb-12 custom-scrollbar">
			{/* Top Header */}
			<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
				<div>
					<h1 className="text-2xl lg:text-3xl font-bold text-[#03002B]">
						Sportsbook Promotions
					</h1>
					<p className="text-xs lg:text-sm font-medium text-gray-500 mt-1">
						Manage and monitor all Sportsbook Promotions
					</p>
				</div>

				<div className="flex items-center gap-3 self-start sm:self-auto">
					<TimePeriodDropdown
						value={selectedTimePeriod}
						onChange={handlePeriodChange}
						buttonClassName="flex items-center gap-2 rounded-xl border border-gray-200/80 bg-white px-4 py-2.5 text-xs font-semibold text-gray-700 shadow-xs hover:bg-gray-50 cursor-pointer transition-colors"
					/>

					<div className="relative">
						<button
							type="button"
							onClick={() => setShowCreateDropdown(!showCreateDropdown)}
							className="flex items-center gap-2 rounded-full bg-[#10C300] hover:bg-[#0ea800] px-4 py-2.5 text-xs font-bold text-white shadow-xs transition-colors cursor-pointer"
						>
							<Plus className="h-4 w-4 stroke-[3]" />
							<span>Create Promotion</span>
						</button>

						{showCreateDropdown && (
							<div className="absolute right-0 mt-2 w-64 rounded-2xl bg-white p-3 shadow-xl border border-gray-100 z-30 space-y-2 animate-in fade-in zoom-in-95 duration-150">
								{/* Option 1: Create Promotion */}
								<button
									type="button"
									onClick={() => {
										setShowCreateDropdown(false);
										setIsAccumulatorModalOpen(true);
									}}
									className="w-full flex items-center gap-3 px-3 py-2 text-xs font-semibold text-gray-900 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer text-left"
								>
									<span>Create Promotion</span>
								</button>

								{/* Option 2: Create Accumulator Boost */}
								<button
									type="button"
									onClick={() => {
										setShowCreateDropdown(false);
										setIsAccumulatorModalOpen(true);
									}}
									className="w-full flex items-center gap-3 px-3 py-2 text-xs font-semibold text-gray-900 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer text-left"
								>
									<span>Create Accumulator Boost</span>
								</button>

								{/* Option 3: Create Bet Insurance */}
								<button
									type="button"
									onClick={() => {
										setShowCreateDropdown(false);
										setIsAccumulatorModalOpen(true);
									}}
									className="w-full flex items-center gap-3 px-3 py-2 text-xs font-semibold text-gray-900 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer text-left"
								>
									<span>Create Bet Insurance</span>
								</button>
							</div>
						)}
					</div>
				</div>
			</div>

			{/* Metric Cards (4 Grid Cards) */}
			<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-6">
				{/* Card 1: Active Promo */}
				<div className="bg-white rounded-2xl p-5 shadow-xs border border-gray-100/90 flex flex-col justify-between h-32 relative">
					<div>
						<span className="text-3xl font-bold text-gray-900 tracking-tight">
							{overview ? overview.activePromotions : "..."}
						</span>
					</div>
					<div className="flex items-center justify-between">
						<span className="text-xs font-semibold text-gray-600">
							Active Promo
						</span>
						<div className="w-9 h-9 rounded-xl bg-gray-100/90 flex items-center justify-center text-gray-800">
							<FaPeopleGroup className="h-4 w-4 text-gray-700" />
						</div>
					</div>
				</div>

				{/* Card 2: Expired Promo */}
				<div className="bg-white rounded-2xl p-5 shadow-xs border border-gray-100/90 flex flex-col justify-between h-32 relative">
					<div>
						<span className="text-3xl font-bold text-gray-900 tracking-tight">
							{overview ? overview.expiredPromotions : "..."}
						</span>
					</div>
					<div className="flex items-center justify-between">
						<span className="text-xs font-semibold text-gray-600">
							Expired Promo
						</span>
						<div className="w-9 h-9 rounded-xl bg-gray-100/90 flex items-center justify-center text-gray-800">
							<Gamepad2 className="h-4 w-4 text-gray-700" />
						</div>
					</div>
				</div>

				{/* Card 3: Conversion Rate */}
				<div className="bg-white rounded-2xl p-5 shadow-xs border border-gray-100/90 flex flex-col justify-between h-32 relative">
					<div>
						<span className="text-3xl font-bold text-gray-900 tracking-tight">
							24.8%
						</span>
					</div>
					<div className="flex items-center justify-between">
						<span className="text-xs font-semibold text-gray-600">
							Conversion Rate
						</span>
						<div className="w-9 h-9 rounded-xl bg-gray-100/90 flex items-center justify-center text-gray-800">
							<FaFutbol className="h-4 w-4 text-gray-700" />
						</div>
					</div>
				</div>

				{/* Card 4: Revenue Generated */}
				<div className="bg-white rounded-2xl p-5 shadow-xs border border-gray-100/90 flex flex-col justify-between h-32 relative">
					<div>
						<span className="text-3xl font-bold text-gray-900 tracking-tight">
							{overview ? formatNaira(overview.revenue.revenue) : "..."}
						</span>
					</div>
					<div className="flex items-center justify-between">
						<span className="text-xs font-semibold text-gray-600">
							Revenue Generated
						</span>
						<div className="w-9 h-9 rounded-xl bg-gray-100/90 flex items-center justify-center font-bold text-sm text-gray-800">
							N
						</div>
					</div>
				</div>
			</div>

			{/* Middle Row: Two Cards */}
			<div className="grid grid-cols-1 lg:grid-cols-12 gap-5 mb-6">
				{/* Promotion Status Overview Card */}
				<div className="lg:col-span-12 bg-white rounded-2xl p-6 shadow-xs border border-gray-100/90 flex flex-col justify-between">
					<h2 className="text-lg font-bold text-gray-900 mb-4">
						Promotion Status Overview
					</h2>

					<div className="flex flex-col sm:flex-row items-center gap-6 lg:gap-10 my-auto">
						{/* Donut Chart */}
						<DonutChart split={statusSplit} />

						{/* Legend Items with percentage and colored progress indicator lines */}
						<div className="flex-1 w-full space-y-3.5">
							{/* Active */}
							<div>
								<div className="flex items-center justify-between text-xs font-semibold mb-1">
									<span className="text-gray-700">Active</span>
									<span className="text-[#10C300]">
										{statusSplit ? `${statusSplit.active.percentage}%` : "..."}
									</span>
								</div>
								<div className="h-1.5 w-full bg-emerald-50 rounded-full overflow-hidden">
									<div
										className="h-full bg-[#10C300] rounded-full"
										style={{ width: `${statusSplit?.active.percentage ?? 0}%` }}
									/>
								</div>
							</div>

							{/* Expired */}
							<div>
								<div className="flex items-center justify-between text-xs font-semibold mb-1">
									<span className="text-gray-700">Expired</span>
									<span className="text-amber-500">
										{statusSplit ? `${statusSplit.expired.percentage}%` : "..."}
									</span>
								</div>
								<div className="h-1.5 w-full bg-amber-50 rounded-full overflow-hidden">
									<div
										className="h-full bg-amber-400 rounded-full"
										style={{
											width: `${statusSplit?.expired.percentage ?? 0}%`,
										}}
									/>
								</div>
							</div>

							{/* Scheduled */}
							<div>
								<div className="flex items-center justify-between text-xs font-semibold mb-1">
									<span className="text-gray-700">Scheduled</span>
									<span className="text-sky-500">0%</span>
								</div>
								<div className="h-1.5 w-full bg-sky-50 rounded-full overflow-hidden">
									<div
										className="h-full bg-sky-500 rounded-full"
										style={{ width: "0%" }}
									/>
								</div>
							</div>

							{/* Draft */}
							<div>
								<div className="flex items-center justify-between text-xs font-semibold mb-1">
									<span className="text-gray-700">Draft</span>
									<span className="text-purple-500">0%</span>
								</div>
								<div className="h-1.5 w-full bg-purple-50 rounded-full overflow-hidden">
									<div
										className="h-full bg-purple-500 rounded-full"
										style={{ width: "0%" }}
									/>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>

			{/* Recent Promotions Table Container */}
			<div className="bg-white rounded-2xl p-6 shadow-xs border border-gray-100/90">
				{/* Table Top Header and Filters */}
				<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
					<h2 className="text-lg font-bold text-gray-900">Recent Promotions</h2>

					<div className="flex flex-wrap items-center gap-2">
						{/* Filter 1: Promo Type */}
						<div className="relative">
							<button
								type="button"
								onClick={() => setShowTypeDropdown(!showTypeDropdown)}
								className="flex items-center gap-1.5 rounded-xl border border-gray-200/80 bg-gray-50/80 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-100 cursor-pointer transition-colors"
							>
								<span>P- type</span>
								<ChevronDown className="h-3.5 w-3.5 text-gray-500" />
							</button>
							{showTypeDropdown && (
								<div className="absolute right-0 mt-2 w-36 rounded-xl bg-white p-1 shadow-xl border border-gray-100 z-30">
									{TYPE_FILTER_OPTIONS.map((t) => (
										<button
											key={t.value}
											type="button"
											onClick={() => {
												setTypeFilter(t.label);
												setCurrentPage(1);
												setShowTypeDropdown(false);
											}}
											className={`w-full text-left px-3 py-1.5 text-xs rounded-lg font-medium hover:bg-gray-50 ${
												typeFilter === t.label
													? "bg-gray-100 text-gray-900"
													: "text-gray-700"
											}`}
										>
											{t.label}
										</button>
									))}
								</div>
							)}
						</div>

						{/* Filter 2: Status */}
						<div className="relative">
							<button
								type="button"
								onClick={() => setShowStatusDropdown(!showStatusDropdown)}
								className="flex items-center gap-1.5 rounded-xl border border-gray-200/80 bg-gray-50/80 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-100 cursor-pointer transition-colors"
							>
								<span>{statusFilter}</span>
								<ChevronDown className="h-3.5 w-3.5 text-gray-500" />
							</button>
							{showStatusDropdown && (
								<div className="absolute right-0 mt-2 w-32 rounded-xl bg-white p-1 shadow-xl border border-gray-100 z-30">
									{STATUS_FILTER_OPTIONS.map((s) => (
										<button
											key={s.value}
											type="button"
											onClick={() => {
												setStatusFilter(s.label);
												setCurrentPage(1);
												setShowStatusDropdown(false);
											}}
											className={`w-full text-left px-3 py-1.5 text-xs rounded-lg font-medium hover:bg-gray-50 ${
												statusFilter === s.label
													? "bg-gray-100 text-gray-900"
													: "text-gray-700"
											}`}
										>
											{s.label}
										</button>
									))}
								</div>
							)}
						</div>
					</div>
				</div>

				{/* Table */}
				<div className="overflow-x-auto">
					<table className="w-full text-left text-xs border-collapse min-w-[750px]">
						<thead>
							<tr className="border-b border-gray-100 text-gray-900 font-bold">
								<th className="py-3 px-3 w-12">S/N</th>
								<th className="py-3 px-3">Promo Name</th>
								<th className="py-3 px-3">Type</th>
								<th className="py-3 px-3">Eligible Users</th>
								<th className="py-3 px-3">End date</th>
								<th className="py-3 px-3 text-center">Status</th>
								<th className="py-3 px-3 text-right">Actions</th>
							</tr>
						</thead>
						<tbody className="divide-y divide-gray-50 font-medium">
							{promotionsQuery.isLoading && (
								<tr>
									<td colSpan={7} className="py-10 text-center text-gray-500">
										Loading promotions...
									</td>
								</tr>
							)}
							{promotionsQuery.isError && (
								<tr>
									<td colSpan={7} className="py-10 text-center">
										<div className="rounded-xl bg-red-50 p-4 text-red-600">
											Failed to load promotions:{" "}
											{(promotionsQuery.error as Error).message}
										</div>
									</td>
								</tr>
							)}
							{!promotionsQuery.isLoading &&
								!promotionsQuery.isError &&
								viewPromotions.length === 0 && (
									<tr>
										<td colSpan={7} className="py-10 text-center text-gray-500">
											No promotions found.
										</td>
									</tr>
								)}
							{viewPromotions.map((promo) => (
								<tr
									key={promo.id}
									className="hover:bg-gray-50/70 transition-colors"
								>
									{/* S/N + Avatar */}
									<td className="py-3.5 px-3">
										<img
											src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${promo.name}`}
											alt={promo.name}
											className="w-10 h-10 rounded-xl object-cover shrink-0"
										/>
									</td>

									{/* Promo Name */}
									<td className="py-3.5 px-3 font-bold text-gray-900">
										{promo.name}
									</td>

									{/* Type */}
									<td className="py-3.5 px-3 text-gray-700">{promo.type}</td>

									{/* Eligible Users */}
									<td className="py-3.5 px-3 text-gray-700">
										{promo.eligibleUsers}
									</td>

									{/* End date */}
									<td className="py-3.5 px-3">
										<div className="text-gray-900 font-semibold">
											{formatEndDate(promo.endDate)}
										</div>
									</td>

									{/* Status Badge */}
									<td className="py-3.5 px-3 text-center">
										{promo.status === "Disabled" ? (
											<span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-500">
												Disabled
											</span>
										) : promo.status === "expired" ? (
											<span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-500">
												Expired
											</span>
										) : (
											<span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-600">
												{promo.status === "active" ? "Active" : promo.status}
											</span>
										)}
									</td>

									{/* Action three dots menu */}
									<td
										className="py-3.5 px-3 text-right relative"
										data-action-menu
									>
										<button
											type="button"
											onClick={() =>
												setActiveActionMenuId(
													activeActionMenuId === promo.id ? null : promo.id,
												)
											}
											className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 cursor-pointer transition-colors"
										>
											<MoreHorizontal className="h-4 w-4" />
										</button>
										{activeActionMenuId === promo.id && (
											<div className="absolute right-3 top-12 z-30 w-36 rounded-xl border border-gray-100 bg-white p-1.5 shadow-xl">
												<button
													type="button"
													onClick={() => toggleStatus(promo.id)}
													className="w-full text-left rounded-lg px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50"
												>
													{promo.status === "Disabled" ? "Enable" : "Disable"}
												</button>
												<button
													type="button"
													onClick={() => deletePromotion(promo.id)}
													className="w-full text-left rounded-lg px-3 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50"
												>
													Delete
												</button>
											</div>
										)}
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>

				{/* Table Pagination */}
				<div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-100 text-xs">
					<span className="font-semibold text-gray-600">
						Page {currentPage} of {pagination?.totalPages ?? 1}
					</span>
					<div className="flex items-center gap-2">
						<button
							type="button"
							onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
							className="rounded-lg bg-[#1BAA04] hover:bg-[#158903] text-white px-4 py-2 font-bold transition-colors cursor-pointer shadow-xs disabled:opacity-50"
							disabled={currentPage === 1}
						>
							Previous
						</button>
						<button
							type="button"
							onClick={() =>
								setCurrentPage((p) =>
									Math.min(pagination?.totalPages ?? 1, p + 1),
								)
							}
							className="rounded-lg bg-[#1BAA04] hover:bg-[#158903] text-white px-4 py-2 font-bold transition-colors cursor-pointer shadow-xs disabled:opacity-50"
							disabled={currentPage >= (pagination?.totalPages ?? 1)}
						>
							Next
						</button>
					</div>
				</div>
			</div>

			{/* Create Promotion Modal */}
			{isCreateModalOpen && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
					<div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
						<div className="mb-5 flex items-center justify-between">
							<h2 className="text-lg font-bold text-gray-900">
								Create Promotion
							</h2>
							<button
								type="button"
								onClick={() => setIsCreateModalOpen(false)}
								className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 cursor-pointer"
							>
								<X className="h-4 w-4" />
							</button>
						</div>

						<form onSubmit={handleCreatePromotion} className="space-y-4">
							<div>
								<label
									htmlFor="new-promo-name"
									className="mb-1.5 block text-xs font-semibold text-gray-600"
								>
									Promotion Name
								</label>
								<input
									id="new-promo-name"
									type="text"
									value={newPromo.name}
									onChange={(e) =>
										setNewPromo({ ...newPromo, name: e.target.value })
									}
									placeholder="e.g. Welcome Bonus"
									className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-800 outline-none focus:border-accent"
								/>
							</div>

							<div>
								<label
									htmlFor="new-promo-type"
									className="mb-1.5 block text-xs font-semibold text-gray-600"
								>
									Type
								</label>
								<select
									id="new-promo-type"
									value={newPromo.type}
									onChange={(e) =>
										setNewPromo({ ...newPromo, type: e.target.value })
									}
									className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-800 outline-none focus:border-accent"
								>
									<option>Deposit Match</option>
									<option>Free Bet</option>
									<option>Accumulator</option>
									<option>Cashback</option>
								</select>
							</div>

							<div>
								<label
									htmlFor="new-promo-eligible"
									className="mb-1.5 block text-xs font-semibold text-gray-600"
								>
									Eligible Users
								</label>
								<select
									id="new-promo-eligible"
									value={newPromo.eligibleUsers}
									onChange={(e) =>
										setNewPromo({ ...newPromo, eligibleUsers: e.target.value })
									}
									className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-800 outline-none focus:border-accent"
								>
									<option>New users</option>
									<option>All users</option>
								</select>
							</div>

							<div>
								<label
									htmlFor="new-promo-status"
									className="mb-1.5 block text-xs font-semibold text-gray-600"
								>
									Status
								</label>
								<select
									id="new-promo-status"
									value={newPromo.status}
									onChange={(e) =>
										setNewPromo({
											...newPromo,
											status: e.target.value as MockStatus,
										})
									}
									className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-800 outline-none focus:border-accent"
								>
									<option>Enable</option>
									<option>Disabled</option>
								</select>
							</div>

							<div className="flex items-center justify-end gap-3 pt-2">
								<button
									type="button"
									onClick={() => setIsCreateModalOpen(false)}
									className="rounded-xl border border-gray-200 px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-50 cursor-pointer"
								>
									Cancel
								</button>
								<button
									type="submit"
									className="rounded-xl bg-[#1BAA04] px-4 py-2 text-xs font-semibold text-white hover:bg-[#158903] cursor-pointer"
								>
									Create Promotion
								</button>
							</div>
						</form>
					</div>
				</div>
			)}

			{/* Create Accumulator Boost Modal (Image 2) */}
			{isAccumulatorModalOpen && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 overflow-y-auto">
					<div className="w-full max-w-4xl rounded-[28px] bg-[#F4F5F7] p-6 lg:p-8 shadow-2xl relative my-auto animate-in zoom-in-95 duration-200 text-left">
						{/* Close Button */}
						<button
							type="button"
							onClick={() => setIsAccumulatorModalOpen(false)}
							className="absolute right-6 top-6 w-9 h-9 rounded-full border border-gray-300 bg-white flex items-center justify-center text-gray-800 hover:bg-gray-100 transition-colors cursor-pointer shadow-xs"
						>
							<X className="w-5 h-5" />
						</button>

						{/* Modal Header */}
						<div className="mb-6">
							<h2 className="text-2xl font-bold text-[#03002B]">
								Create Accumulator Boost
							</h2>
							<p className="text-xs font-medium text-gray-500 mt-1">
								Reward players for placing qualifying accumulator bets.
							</p>
						</div>

						{/* Modal Form */}
						<form onSubmit={handleAccaUpload} className="space-y-6">
							<div className="grid grid-cols-1 lg:grid-cols-2 gap-x-8 gap-y-5">
								{/* LEFT COLUMN */}
								<div className="space-y-5">
									{/* Boost Name * */}
									<div>
										<label className="block text-xs font-bold text-gray-900 mb-1.5">
											Boost Name <span className="text-red-500">*</span>
										</label>
										<input
											type="text"
											required
											value={accaForm.boostName}
											onChange={(e) =>
												setAccaForm({ ...accaForm, boostName: e.target.value })
											}
											placeholder="Weekend Acca Bonus"
											className="w-full rounded-2xl bg-[#F8F9FA] border border-gray-100/80 px-4 py-3.5 text-xs text-gray-800 placeholder-gray-400 outline-none focus:bg-white focus:ring-2 focus:ring-[#10C300]/20 transition-all shadow-2xs"
										/>
									</div>

									{/* Description * */}
									<div>
										<label className="block text-xs font-bold text-gray-900 mb-1.5">
											Description <span className="text-red-500">*</span>
										</label>
										<textarea
											required
											rows={4}
											value={accaForm.description}
											onChange={(e) =>
												setAccaForm({
													...accaForm,
													description: e.target.value,
												})
											}
											placeholder="Get extra winnings when you accumulator contains qualifying selections!"
											className="w-full rounded-2xl bg-[#F8F9FA] border border-gray-100/80 px-4 py-3.5 text-xs text-gray-800 placeholder-gray-400 outline-none focus:bg-white focus:ring-2 focus:ring-[#10C300]/20 transition-all shadow-2xs resize-none"
										/>
									</div>

									{/* Minimum Selections * */}
									<div>
										<div className="flex items-center justify-between mb-1.5 px-1">
											<label className="text-xs font-bold text-gray-900">
												Minimum Selections{" "}
												<span className="text-red-500">*</span>
											</label>
											<span className="text-xs font-bold text-gray-900 pr-[45%]">
												-
											</span>
										</div>
										<div className="grid grid-cols-2 gap-4 items-center">
											{/* Left Number Box */}
											<div className="flex items-center justify-between rounded-2xl bg-[#F8F9FA] border border-gray-100/80 px-4 py-3.5 shadow-2xs">
												<ChevronUp
													className="w-4 h-4 text-gray-600 cursor-pointer hover:text-gray-900"
													onClick={() => stepSelection("minSelectionsLeft", 1)}
												/>
												<span className="text-xs font-bold text-gray-900">
													{accaForm.minSelectionsLeft}
												</span>
												<ChevronDown
													className="w-4 h-4 text-gray-600 cursor-pointer hover:text-gray-900"
													onClick={() => stepSelection("minSelectionsLeft", -1)}
												/>
											</div>
											{/* Right Number Box */}
											<div className="flex items-center justify-between rounded-2xl bg-[#F8F9FA] border border-gray-100/80 px-4 py-3.5 shadow-2xs">
												<ChevronUp
													className="w-4 h-4 text-gray-600 cursor-pointer hover:text-gray-900"
													onClick={() => stepSelection("minSelectionsRight", 1)}
												/>
												<span className="text-xs font-bold text-gray-900">
													{accaForm.minSelectionsRight}
												</span>
												<ChevronDown
													className="w-4 h-4 text-gray-600 cursor-pointer hover:text-gray-900"
													onClick={() =>
														stepSelection("minSelectionsRight", -1)
													}
												/>
											</div>
										</div>
									</div>

									{/* Maximum Selections * */}
									<div>
										<label className="block text-xs font-bold text-gray-900 mb-1.5">
											Maximum Selections <span className="text-red-500">*</span>
										</label>
										<div className="flex items-center justify-between rounded-2xl bg-[#F8F9FA] border border-gray-100/80 px-4 py-3.5 shadow-2xs">
											<span className="text-xs font-medium text-gray-400">
												Minimum Odds per selection
											</span>
											<input
												type="text"
												inputMode="decimal"
												value={accaForm.minOdds}
												onChange={(e) =>
													setAccaForm({ ...accaForm, minOdds: e.target.value })
												}
												placeholder="Enter odds"
												className="w-28 rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-right text-xs font-bold text-gray-900 placeholder-gray-400 outline-none focus:border-[#10C300] focus:ring-2 focus:ring-[#10C300]/20"
											/>
										</div>
									</div>
								</div>

								{/* RIGHT COLUMN */}
								<div className="space-y-5">
									{/* Boost Percentage * */}
									<div>
										<label className="block text-xs font-bold text-gray-900 mb-1.5">
											Boost Percentage <span className="text-red-500">*</span>
										</label>
										<div className="flex items-center justify-between rounded-2xl bg-[#F8F9FA] border border-gray-100/80 px-4 py-3.5 shadow-2xs">
											<ChevronUp
												className="w-4 h-4 text-gray-600 cursor-pointer hover:text-gray-900"
												onClick={() => stepBoost(1)}
											/>
											<span className="text-xs font-bold text-gray-900">
												{accaForm.boostPercentage}
											</span>
											<div className="flex items-center gap-1">
												<ChevronDown
													className="w-4 h-4 text-gray-600 cursor-pointer hover:text-gray-900"
													onClick={() => stepBoost(-1)}
												/>
												<span className="text-xs font-bold text-gray-900">
													%
												</span>
											</div>
										</div>
									</div>

									{/* Eligible Users & Eligible Sports */}
									<div className="grid grid-cols-2 gap-4">
										<div>
											<label className="block text-xs font-bold text-gray-900 mb-1.5">
												Eligible Users
											</label>
											<FormDropdown
												value={accaForm.eligibleUsers}
												options={ELIGIBLE_USER_OPTIONS}
												onChange={(value) =>
													setAccaForm({ ...accaForm, eligibleUsers: value })
												}
											/>
										</div>
										<div>
											<label className="block text-xs font-bold text-gray-900 mb-1.5">
												Eligible Sports
											</label>
											<FormDropdown
												value={accaForm.eligibleSports}
												options={ELIGIBLE_SPORTS_OPTIONS}
												onChange={(value) =>
													setAccaForm({ ...accaForm, eligibleSports: value })
												}
											/>
										</div>
									</div>

									{/* Competition * & Eligible Events */}
									<div className="grid grid-cols-2 gap-4">
										<div>
											<label className="block text-xs font-bold text-gray-900 mb-1.5">
												Competition / League{" "}
												<span className="text-red-500">*</span>
											</label>
											<FormMultiSelect
												options={tournaments}
												selected={accaForm.competitionIds}
												onChange={(ids) =>
													setAccaForm({ ...accaForm, competitionIds: ids })
												}
												placeholder="Select competition or league"
												loading={loadingTournaments}
												searchValue={tournamentSearch}
												onSearchChange={setTournamentSearch}
												onLoadMore={loadMoreTournaments}
												hasMore={tournamentHasMore}
												loadingMore={loadingMoreTournaments}
											/>
										</div>
										<div>
											<label className="block text-xs font-bold text-gray-900 mb-1.5">
												Eligible Events
											</label>
											<FormMultiSelect
												options={events}
												selected={accaForm.eligibleEventIds}
												onChange={(ids) =>
													setAccaForm({ ...accaForm, eligibleEventIds: ids })
												}
												placeholder="Select events"
												loading={loadingEvents}
												onLoadMore={loadMoreEvents}
												hasMore={eventHasMore}
												loadingMore={loadingMoreEvents}
											/>
										</div>
									</div>

									{/* End Date & Time * */}
									<div className="grid grid-cols-2 gap-4">
										<div>
											<label
												htmlFor="acca-end-date"
												className="block text-xs font-bold text-gray-900 mb-1.5"
											>
												End Date & Time <span className="text-red-500">*</span>
											</label>
											<input
												id="acca-end-date"
												type="datetime-local"
												value={accaForm.endDate}
												onChange={(e) =>
													setAccaForm({ ...accaForm, endDate: e.target.value })
												}
												className="w-full rounded-2xl bg-[#F8F9FA] border border-gray-100/80 px-3.5 py-3.5 shadow-2xs text-xs font-medium text-gray-700 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#10C300]/40"
											/>
										</div>
									</div>
								</div>
							</div>

							{/* Upload Button */}
							<div className="pt-4 text-center">
								<button
									type="submit"
									disabled={submitting}
									className="w-full max-w-sm rounded-full bg-[#10C300] hover:bg-[#0ea800] py-3.5 text-sm font-bold text-white shadow-md transition-colors cursor-pointer mx-auto block disabled:opacity-50 disabled:cursor-not-allowed"
								>
									{submitting ? "Uploading..." : "Upload"}
								</button>
							</div>
						</form>
					</div>
				</div>
			)}
		</div>
	);
}

function FormDropdown({
	value,
	options,
	onChange,
	placeholder,
}: {
	value: string;
	options: string[];
	onChange: (value: string) => void;
	placeholder?: string;
}) {
	const [open, setOpen] = useState(false);
	const ref = useRef<HTMLDivElement>(null);

	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (ref.current && !ref.current.contains(event.target as Node)) {
				setOpen(false);
			}
		};
		document.addEventListener("mousedown", handleClickOutside);
		return () => document.removeEventListener("mousedown", handleClickOutside);
	}, []);

	return (
		<div className="relative" ref={ref}>
			<button
				type="button"
				onClick={() => setOpen((prev) => !prev)}
				className="flex w-full items-center justify-between rounded-2xl bg-[#F8F9FA] border border-gray-100/80 px-3.5 py-3.5 shadow-2xs cursor-pointer"
			>
				<span className="text-xs font-medium text-gray-700 truncate">
					{value || placeholder || "Select"}
				</span>
				<ChevronDown
					className={`w-4 h-4 text-gray-500 shrink-0 transition-transform ${
						open ? "rotate-180" : ""
					}`}
				/>
			</button>
			{open && (
				<div className="absolute left-0 z-30 mt-1 w-full max-h-48 overflow-y-auto rounded-2xl border border-gray-200 bg-white py-1 shadow-xl">
					{options.map((option) => (
						<button
							key={option}
							type="button"
							onClick={() => {
								onChange(option);
								setOpen(false);
							}}
							className={`w-full cursor-pointer px-3.5 py-2 text-left text-xs ${
								option === value
									? "bg-emerald-50 font-bold text-gray-900"
									: "font-medium text-gray-700 hover:bg-gray-50"
							}`}
						>
							{option}
						</button>
					))}
				</div>
			)}
		</div>
	);
}

function FormMultiSelect({
	options,
	selected,
	onChange,
	placeholder,
	loading,
	searchValue,
	onSearchChange,
	onLoadMore,
	hasMore,
	loadingMore,
}: {
	options: SportsbookOption[];
	selected: string[];
	onChange: (ids: string[]) => void;
	placeholder: string;
	loading?: boolean;
	searchValue?: string;
	onSearchChange?: (value: string) => void;
	onLoadMore?: () => void;
	hasMore?: boolean;
	loadingMore?: boolean;
}) {
	const [open, setOpen] = useState(false);
	const optionTitles = useRef(new Map<string, string>());
	for (const option of options) {
		optionTitles.current.set(option.id, option.title);
	}
	const selectedTitles = selected.flatMap((id) => {
		const title = optionTitles.current.get(id);
		return title ? [title] : [];
	});

	const toggle = (id: string) => {
		onChange(
			selected.includes(id)
				? selected.filter((current) => current !== id)
				: [...selected, id],
		);
	};

	return (
		<Popover open={open} onOpenChange={setOpen}>
			<PopoverTrigger asChild>
				<button
					type="button"
					role="combobox"
					aria-expanded={open}
					className="flex w-full items-center justify-between rounded-2xl bg-[#F8F9FA] border border-gray-100/80 px-3.5 py-3.5 shadow-2xs cursor-pointer"
				>
					<span className="text-xs font-medium text-gray-700 truncate">
						{loading
							? "Loading..."
							: selectedTitles.length > 0
								? selectedTitles.join(", ")
								: placeholder}
					</span>
					<ChevronDown
						className={`w-4 h-4 text-gray-500 shrink-0 transition-transform ${
							open ? "rotate-180" : ""
						}`}
					/>
				</button>
			</PopoverTrigger>
			<PopoverContent
				align="start"
				className="z-[70] w-[var(--radix-popover-trigger-width)] overflow-hidden rounded-2xl p-0 shadow-xl"
			>
				<Command shouldFilter={!onSearchChange}>
					<CommandInput
						placeholder={`Search ${placeholder.toLocaleLowerCase()}...`}
						value={searchValue}
						onValueChange={onSearchChange}
						maxLength={onSearchChange ? 100 : undefined}
					/>
					<CommandList
						className="max-h-52 overflow-y-auto py-1"
						onScroll={(e) => {
							const el = e.currentTarget;
							if (
								onLoadMore &&
								hasMore &&
								!loadingMore &&
								!loading &&
								el.scrollHeight - el.scrollTop - el.clientHeight < 40
							) {
								onLoadMore();
							}
						}}
					>
						<CommandEmpty>
							{loading ? "Loading..." : "No matching options"}
						</CommandEmpty>
						{options.map((option) => {
							const isSelected = selected.includes(option.id);
							return (
								<CommandItem
									key={option.id}
									value={option.title}
									onSelect={() => toggle(option.id)}
									className={`w-full ${
										isSelected
											? "bg-emerald-50 font-bold text-gray-900"
											: "font-medium text-gray-700 hover:bg-gray-50"
									}`}
								>
									{option.title}
								</CommandItem>
							);
						})}
						{loadingMore && (
							<div className="px-3.5 py-2 text-xs font-medium text-gray-400">
								Loading more...
							</div>
						)}
					</CommandList>
				</Command>
			</PopoverContent>
		</Popover>
	);
}

function DonutChart({ split }: { split?: StatusSplit }) {
	const activePct = split?.active.percentage ?? 0;
	const expiredPct = split?.expired.percentage ?? 0;
	const circumference = 2 * Math.PI * 36;
	const activeLen = (activePct / 100) * circumference;
	const expiredLen = (expiredPct / 100) * circumference;

	return (
		<div className="relative h-44 w-44 shrink-0 flex items-center justify-center">
			<svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
				<title>Promotion status split</title>
				{/* Segment 1: Active (green) */}
				<circle
					cx="50"
					cy="50"
					r="36"
					fill="transparent"
					stroke="#10C300"
					strokeWidth="24"
					strokeDasharray={`${activeLen} ${circumference}`}
					strokeDashoffset="0"
				/>
				{/* Segment 2: Expired (gold) */}
				<circle
					cx="50"
					cy="50"
					r="36"
					fill="transparent"
					stroke="#FBBF24"
					strokeWidth="24"
					strokeDasharray={`${expiredLen} ${circumference}`}
					strokeDashoffset={`-${activeLen}`}
				/>
			</svg>

			{/* Center Overlay */}
			<div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
				<span className="text-2xl font-bold text-gray-900">
					{split ? `${activePct}%` : "..."}
				</span>
				<span className="text-[11px] font-semibold text-gray-500">Active</span>
			</div>
		</div>
	);
}
