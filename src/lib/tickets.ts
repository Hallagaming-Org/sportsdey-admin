import { fetchApi } from "./api";

export type TicketOutcome = "Won" | "Active" | "Lost" | "Declined";
export type TicketTab = "all" | "casino" | "sportsbook" | "prediction_market";


export interface MatchSelection {
  id?: string | number;
  matchId?: string;           
  match: string;
  pick?: string;
  marketId?: string;         
  oddId?: string;
  odds: number | string;
  status?: "Won" | "Lost" | "Pending" | "Void" | "win" | "loss" | "pending"; // Add lowercase variants
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
	betType?: string;
	selectionCount?: number;
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
		return fetchApi<DetailedTicket>(`/admin/tickets/${ticketId}`);
	}
}

export const ticketService = new TicketService();

