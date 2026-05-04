import { fetchApi } from "./api";

export interface KycRecord {
	id: string;
	playername: string;
	image: string | null;
	form_of_identification: "nin" | "drivers_license" | "passport" | "voters_card";
	size: {
		front: number;
		back: number;
	};
	uploaded_at: string;
	type: {
		front: string;
		back: string;
	};
	status: "not_verified" | "pending_review" | "approved" | "rejected";
}

export interface KycListResponse {
	records: KycRecord[];
	page: number;
	limit: number;
	total: number;
}

export type KycStatusFilter = "not_verified" | "pending_review" | "approved" | "rejected";

export interface ListKycParams {
	page?: number;
	limit?: number;
	search?: string;
	status?: KycStatusFilter;
}

export interface KycDocument {
	id: string;
	url: string;
}

export interface KycDocumentResponse {
	frontDocument: KycDocument | null;
	backDocument: KycDocument | null;
}

class KycService {
	async listKyc(
		params: ListKycParams = {},
	): Promise<{ success: boolean; data?: KycListResponse; error?: string }> {
		const searchParams = new URLSearchParams();
		if (params.page) searchParams.set("page", params.page.toString());
		if (params.limit) searchParams.set("limit", params.limit.toString());
		if (params.search) searchParams.set("search", params.search);
		if (params.status) searchParams.set("status", params.status);

		const queryString = searchParams.toString();
		const endpoint = queryString ? `/kyc/all?${queryString}` : "/kyc/all";

		return fetchApi<KycListResponse>(endpoint);
	}

	async getKycDocuments(
		kycId: string,
	): Promise<{ success: boolean; data?: KycDocumentResponse; error?: string }> {
		return fetchApi<KycDocumentResponse>(`/kyc/${kycId}`);
	}
}

export const kycService = new KycService();