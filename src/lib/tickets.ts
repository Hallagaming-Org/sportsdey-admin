import { fetchApi } from "./api";

export type TicketOutcome = "Won" | "Active" | "Lost";
export type TicketTab = "all" | "casino" | "sportsbook";

export interface TicketRecord {
	id: string;
	playerName: string;
	betAmount: string;
	gameType: string;
	outcome: TicketOutcome;
	createdAt: string;
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
}

export const ticketService = new TicketService();
