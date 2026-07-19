import { fetchApi } from "./api";

export type TicketOutcome = "Won" | "Active" | "Lost" | "Declined";
export type TicketTab = "all" | "casino" | "sportsbook";

export interface TicketRecord {
	id: string;
	userId?: string;
	playerName: string;
	betAmount: string;
	potentialWin?: string | null;
	payout?: string | null;
	payOut?: string | null;
	gameType: string;
	gameName?: string | null;
	provider?: string | null;
	roundId?: string | null;
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

	async getUserTickets(
		userId: string,
		params: {
			page?: number;
			limit?: number;
			type?: string;
			fromDate?: string;
			toDate?: string;
		},
	): Promise<{ success: boolean; data?: TicketsResponse; error?: string }> {
		const searchParams = new URLSearchParams();
		if (params.page) searchParams.set("page", params.page.toString());
		if (params.limit) searchParams.set("limit", params.limit.toString());
		searchParams.set("type", params.type || "all");
		if (params.fromDate) searchParams.set("fromDate", params.fromDate);
		if (params.toDate) searchParams.set("toDate", params.toDate);

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
}

export const ticketService = new TicketService();

