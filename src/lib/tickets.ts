import { fetchApi } from "./api";

export type TicketOutcome = "Won" | "Active" | "Lost" | "Declined";
export type TicketTab = "all" | "casino" | "sportsbook" | "prediction_market";


export interface MatchSelection {
  id?: string | number;
  matchId?: string;           
  match: string;
  market?: string;
  marketLabel?: string;
  pick?: string;
  pickLabel?: string;
  selectionName?: string;
  outcomeName?: string;
  oddName?: string;
  marketId?: string;         
  oddId?: string;
  odds: number | string;
  status?: "Won" | "Lost" | "Pending" | "Void" | "win" | "loss" | "pending";
  oddStatus?: number;
}

export interface BetBuilderLeg {
  matchId?: string | null;
  match?: string;
  marketId?: string | null;
  oddId?: string | null;
  odds?: string | number | null;
  oddStatus?: number | null;
	pick?: string | null;
	market?: string | null;
	marketLabel?: string | null;
	pickLabel?: string | null;
	selectionName?: string | null;
	outcomeName?: string | null;
	oddName?: string | null;
  status?: "Won" | "Lost" | "Pending" | "Void" | "win" | "loss" | "pending";
}

export interface BetBuilderSelection {
	matchId?: string | null;
	match?: string;
	ratio?: string | null;
	status?: number | null;
	legs: BetBuilderLeg[];
}

export interface CasinoRoundSummary {
	id?: string | number;
	betAmount: string | number;
	cashedOutAt: string | number;
	winAmount: string | number;
	status?: "Won" | "Lost" | "Pending" | "Void";
}

export interface DetailedTicket extends TicketRecord {
	placedAt?: string;
	settledAt?: string;
	stakeAmount?: string | number;
	potentialWin?: string | null;
	actualPayout?: string | null;
	profit?: string | number;
	playerEmail?: string;
	playerPhone?: string;
	playerVerified?: boolean;
	betType?: string | number;
	selectionCount?: number;
	selection?: number | string;
	totalOdds?: number | string;
	freeBet?: boolean | string;
	bonusUsed?: boolean | string;
	cashOut?: string;
	ipAddress?: string;
	deviceInfo?: string;
	selections?: MatchSelection[];
	betBuilderSelections?: BetBuilderSelection[]; 
	// Casino specific fields
	sessionId?: string | null;
	betTime?: string;
	cashOutTime?: string;
	multiplier?: string | number;
	winAmount?: string | number;
	cashedOutAt?: string | number;
	roundSummary?: CasinoRoundSummary[];
}

export interface TicketRecord {
	id: string;
	userId?: string;
	playerName: string;
	image?: string;
	betAmount: string;
	potentialWin?: string | null;
	payout?: string | null;
	payOut?: string | null;
	gameType: string;
	gameName?: string | null;
	provider?: string | null;
	roundId?: string | null;
	odds?: number | string | null;
	sessionId?: string | null;
	multiplier?: string | number;
	winAmount?: string | number;
	outcome: TicketOutcome;
	createdAt: string;
	balanceBefore: string | null;
	balanceAfter: string | null;
	userSuspended?: boolean;
}

export function formatBetType(betType?: string | number | null): string {
	if (typeof betType === "number") {
		return betType === 1 ? "Single" : betType === 2 ? "Multiple" : `Type ${betType}`;
	}
	const normalized = String(betType ?? "").trim().toLowerCase();
	if (normalized === "1") return "Single";
	if (normalized === "2") return "Multiple";
	return normalized ? String(betType) : "—";
}

export function getSelectionCount(ticket: Pick<DetailedTicket, "selectionCount" | "selection" | "selections" | "betBuilderSelections">): number {
	if (typeof ticket.selectionCount === "number") return ticket.selectionCount;
	const legacyCount = Number(ticket.selection);
	if (Number.isInteger(legacyCount) && legacyCount >= 0) return legacyCount;
	const regularSelections = ticket.selections?.length ?? 0;
	const betBuilderLegs = ticket.betBuilderSelections?.reduce(
		(total, builder) => total + (builder.legs?.length ?? 0),
		0,
	) ?? 0;
	return regularSelections + betBuilderLegs;
}

export function getSelectionPick(selection: MatchSelection | BetBuilderLeg): string {
	return selection.pick || selection.pickLabel || selection.selectionName || selection.outcomeName || selection.oddName || "—";
}

export function getSelectionMarket(selection: MatchSelection | BetBuilderLeg): string {
	return selection.market || selection.marketLabel || "—";
}

export interface TicketsResponse {
	tickets: TicketRecord[];
	pagination: {
		page: number;
		limit: number;
		total: number;
		totalPages: number;
	};
}

export interface UserTicketOverview {
	currentBet?: number | string;
	currentActiveBetAmount?: number | string;
	activeBetAmount?: number | string;
	currentActiveBet?: number | string;

	totalGamesWon?: number | string;
	gamesWon?: number | string;

	totalGamesLost?: number | string;
	gamesLost?: number | string;

	grossGamingRevenue?: number | string;
	ggr?: number | string;
	netPosition?: number | string;
}

class TicketService {
	async getTickets(params: {
		page?: number;
		limit?: number;
		type?: TicketTab;
		fromDate?: string;
		toDate?: string;
		search?: string;
	}): Promise<{ success: boolean; data?: TicketsResponse; error?: string }> {
		const searchParams = new URLSearchParams();
		if (params.page) searchParams.set("page", params.page.toString());
		if (params.limit) searchParams.set("limit", params.limit.toString());
		if (params.type && params.type !== "all")
			searchParams.set("type", params.type);
		if (params.fromDate) searchParams.set("fromDate", params.fromDate);
		if (params.toDate) searchParams.set("toDate", params.toDate);
		if (params.search) searchParams.set("search", params.search);
		if (!params.type || params.type === "all")
			searchParams.set("type", "all");

		return fetchApi<TicketsResponse>(
			`/admin/tickets?${searchParams.toString()}`,
		);
	}

	async listAllTickets(): Promise<{ success: boolean; data?: TicketsResponse; error?: string }> {
		return fetchApi<TicketsResponse>("/admin/tickets/all");
	}

	async getUserTickets(
		userId: string,
		params: {
			page?: number;
			limit?: number;
			type?: string;
			fromDate?: string;
			toDate?: string;
			search?: string;
		},
	): Promise<{ success: boolean; data?: TicketsResponse; error?: string }> {
		const searchParams = new URLSearchParams();
		if (params.page) searchParams.set("page", params.page.toString());
		if (params.limit) searchParams.set("limit", params.limit.toString());
		searchParams.set("type", params.type || "all");
		if (params.fromDate) searchParams.set("fromDate", params.fromDate);
		if (params.toDate) searchParams.set("toDate", params.toDate);
		if (params.search) searchParams.set("search", params.search);

		return fetchApi<TicketsResponse>(
			`/admin/tickets/user/${userId}?${searchParams.toString()}`,
		);
	}

	async getUserTicketOverview(
		userId: string,
		params?: {
			fromDate?: string;
			toDate?: string;
		},
	): Promise<{ success: boolean; data?: UserTicketOverview; error?: string }> {
		const searchParams = new URLSearchParams();
		if (params?.fromDate) searchParams.set("fromDate", params.fromDate);
		if (params?.toDate) searchParams.set("toDate", params.toDate);
		const qs = searchParams.toString();

		return fetchApi<UserTicketOverview>(
			`/admin/ticket-overview/user/${userId}${qs ? `?${qs}` : ""}`,
		);
	}

	async getTicketDetails(
		ticketId: string,
	): Promise<{ success: boolean; data?: DetailedTicket; error?: string }> {
		return fetchApi<DetailedTicket>(`/admin/tickets/${encodeURIComponent(ticketId)}`);
	}
}

export const ticketService = new TicketService();

