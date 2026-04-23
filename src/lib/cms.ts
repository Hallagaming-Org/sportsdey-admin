import { fetchApi } from "./api";

export interface CmsAuthor {
	name: string;
	image: string | null;
}

export interface CmsContent {
	_id: string;
	title: string;
	author: CmsAuthor;
	type: "news" | "videos" | "ads";
	dateUploaded: string;
	status: "pending" | "verified";
}

export interface CmsContentsResponse {
	content: CmsContent[];
	total: number;
	page: number;
	limit: number;
	totalPages: number;
}

export interface CreateCmsContentData {
	title: string;
	message: string;
	contentType: "news" | "videos" | "ads";
	bannerImage?: string;
	authorName: string;
}

export interface CreateCmsContentResponse {
	success: boolean;
	data?: {
		_id: string;
		title: string;
		status: "pending" | "verified";
	};
	error?: string;
}

class CmsService {
	async listCmsContent(params: {
		page?: number;
		limit?: number;
		sortBy?: "title";
		type?: "all" | "news" | "videos" | "ads";
		search?: string;
	}): Promise<{ success: boolean; data?: CmsContentsResponse; error?: string }> {
		const searchParams = new URLSearchParams();
		if (params.page) searchParams.set("page", params.page.toString());
		if (params.limit) searchParams.set("limit", params.limit.toString());
		if (params.sortBy) searchParams.set("sortBy", params.sortBy);
		if (params.type && params.type !== "all") searchParams.set("type", params.type);
		if (params.search) searchParams.set("search", params.search);

		return fetchApi<CmsContentsResponse>(`/cms/content?${searchParams}`);
	}

	async listAllCmsContent(params: {
		page?: number;
		limit?: number;
		sortBy?: "title";
		type?: "all" | "news" | "videos" | "ads";
		search?: string;
	}): Promise<{ success: boolean; data?: CmsContentsResponse; error?: string }> {
		const searchParams = new URLSearchParams();
		if (params.page) searchParams.set("page", params.page.toString());
		if (params.limit) searchParams.set("limit", params.limit.toString());
		if (params.sortBy) searchParams.set("sortBy", params.sortBy);
		if (params.type && params.type !== "all") searchParams.set("type", params.type);
		if (params.search) searchParams.set("search", params.search);

		return fetchApi<CmsContentsResponse>(`/cms/content/all?${searchParams}`);
	}

	async createCmsContent(
		data: CreateCmsContentData,
	): Promise<CreateCmsContentResponse> {
		const response = await fetchApi<{
			_id: string;
			title: string;
			status: "pending" | "verified";
		}>("/cms/content", {
			method: "POST",
			body: data,
		});

		if (response.success) {
			return {
				success: true,
				data: response.data,
			};
		}

		return {
			success: false,
			error: response.error,
		};
	}
}

export const cmsService = new CmsService();