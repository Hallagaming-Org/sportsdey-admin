import { type ApiErrorDetail, fetchApi } from "./api";

export interface Promotion {
	id: string;
	name: string;
	type: string;
	eligibleUsers: string;
	endDate: string;
	status: "active" | "expired";
	dataBetBoostId?: string | null;
}

export interface PromotionsPagination {
	page: number;
	limit: number;
	total: number;
	totalPages: number;
}

export interface PromotionsResponse {
	promotions: Promotion[];
	pagination: PromotionsPagination;
}

export interface PromotionsOverview {
	activePromotions: number;
	expiredPromotions: number;
	revenue: {
		totalSettledBet: number;
		totalWinningsPaid: number;
		revenue: number;
	};
}

export interface StatusSplit {
	active: { count: number; percentage: number };
	expired: { count: number; percentage: number };
}

export type PromotionTypeFilter =
	| "all"
	| "freebets"
	| "bet_boost"
	| "deposit_match";
export type PromotionStatusFilter = "all" | "active" | "expired";

export interface PromotionsQueryParams {
	status?: PromotionStatusFilter;
	promotionType?: PromotionTypeFilter;
	fromDate?: string;
	toDate?: string;
	page?: number;
	limit?: number;
}

export interface PromotionsDateRange {
	fromDate?: string;
	toDate?: string;
}

class PromotionsService {
	async getOverview(range?: PromotionsDateRange): Promise<{
		success: boolean;
		data?: PromotionsOverview;
		error?: string;
	}> {
		const qs = buildDateQuery(range);
		return fetchApi<PromotionsOverview>(
			`/admin/sportsbook-promotions/overview${qs ? `?${qs}` : ""}`,
		);
	}

	async getStatusSplit(range?: PromotionsDateRange): Promise<{
		success: boolean;
		data?: StatusSplit;
		error?: string;
	}> {
		const qs = buildDateQuery(range);
		return fetchApi<StatusSplit>(
			`/admin/sportsbook-promotions/status-split${qs ? `?${qs}` : ""}`,
		);
	}

	async getPromotions(params?: PromotionsQueryParams): Promise<{
		success: boolean;
		data?: PromotionsResponse;
		error?: string;
	}> {
		const searchParams = new URLSearchParams();
		if (params?.status && params.status !== "all")
			searchParams.set("status", params.status);
		if (params?.promotionType && params.promotionType !== "all") {
			searchParams.set("promotionType", params.promotionType);
		}
		if (params?.fromDate) searchParams.set("fromDate", params.fromDate);
		if (params?.toDate) searchParams.set("toDate", params.toDate);
		if (params?.page) searchParams.set("page", String(params.page));
		if (params?.limit) searchParams.set("limit", String(params.limit));
		const qs = searchParams.toString();
		return fetchApi<PromotionsResponse>(
			`/admin/sportsbook-promotions${qs ? `?${qs}` : ""}`,
		);
	}
}

function buildDateQuery(range?: PromotionsDateRange): string {
	if (!range) return "";
	const params = new URLSearchParams();
	if (range.fromDate) params.set("fromDate", range.fromDate);
	if (range.toDate) params.set("toDate", range.toDate);
	return params.toString();
}

export const promotionsService = new PromotionsService();

export interface SportsbookOption {
	id: string;
	title: string;
}

export interface TournamentPagination {
	offset: number;
	limit: number;
	total: number;
	hasMore: boolean;
}

export interface TournamentPage {
	tournaments: SportsbookOption[];
	pagination: TournamentPagination;
}

export interface GetTournamentsParams {
	offset?: number;
	limit?: number;
	name?: string;
}

export interface EventPagination {
	offset: number;
	limit: number;
	total: number;
	hasMore: boolean;
}

export interface EventPage {
	events: SportsbookOption[];
	pagination: EventPagination;
}

export interface GetEventsParams {
	offset?: number;
	limit?: number;
}

export interface BetBoostCreatePayload {
	boostName: string;
	description: string;
	boostPercentage: number;
	eligibleUsers: string;
	eligibleSports: string[];
	minimumSelections: number;
	maximumSelections: number;
	competitionIDs: string[];
	eligibleEventsID: string[];
	minimumOddsPerSelection: number;
	endDateTime: string;
	maximumWin?: number;
}

export interface BetBoostCreatedItem {
	id: string;
	dataBetBoostId: string;
	playerId: string | null;
}

class SportsbookService {
	async getTournaments(
		sports: string[],
		params?: GetTournamentsParams,
	): Promise<{
		success: boolean;
		data?: TournamentPage;
		error?: string;
	}> {
		const searchParams = new URLSearchParams();
		for (const sport of sports) searchParams.append("sport", sport);
		if (params?.offset != null)
			searchParams.set("offset", String(params.offset));
		if (params?.limit != null) searchParams.set("limit", String(params.limit));
		if (params?.name) searchParams.set("name", params.name);
		return fetchApi<TournamentPage>(
			`/sportsbook/tournaments?${searchParams.toString()}`,
		);
	}

	async getEvents(
		sportId: string,
		params?: GetEventsParams,
	): Promise<{
		success: boolean;
		data?: EventPage;
		error?: string;
	}> {
		const searchParams = new URLSearchParams();
		searchParams.set("sportId", sportId);
		searchParams.set("status", "pre-game");
		if (params?.offset != null)
			searchParams.set("offset", String(params.offset));
		if (params?.limit != null) searchParams.set("limit", String(params.limit));
		return fetchApi<EventPage>(`/sportsbook/events?${searchParams.toString()}`);
	}

	async createBetBoost(payload: BetBoostCreatePayload): Promise<{
		success: boolean;
		data?: BetBoostCreatedItem[];
		error?: string;
		statusCode?: number;
		details?: ApiErrorDetail[] | null;
	}> {
		return fetchApi<BetBoostCreatedItem[]>("/sportsbook/bet-boost", {
			method: "POST",
			body: payload,
		});
	}

	async deleteBetBoost(id: string): Promise<{
		success: boolean;
		error?: string;
		statusCode?: number;
	}> {
		return fetchApi(`/sportsbook/bet-boost/${id}`, {
			method: "DELETE",
		});
	}
}

export const sportsbookService = new SportsbookService();
