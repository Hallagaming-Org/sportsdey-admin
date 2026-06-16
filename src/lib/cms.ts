import { type ApiErrorDetail, fetchApi } from "./api";

export interface CmsAuthor {
	name: string;
	image: string | null;
}

export interface CmsContent {
	_id: string;
	title: string;
	image: string | null;
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

export interface CmsContentDetail {
	_id: string;
	title: string;
	slug: string | null;
	message: string;
	image: string | null;
	author: {
		_id: string | null;
		name: string;
		image: string | null;
	};
	type: "news" | "videos" | "ads";
	publishedAt: string;
	status: "pending" | "verified";
}

export interface CreateCmsContentData {
	title: string;
	message: string;
	contentType: "news" | "videos" | "ads";
	bannerImage?: string;
	authorName: string;
}

export interface UpdateCmsContentData {
	title?: string;
	message?: string;
	contentType?: "news" | "videos" | "ads";
	bannerImage?: string;
	authorName?: string;
}

export interface CreateCmsContentResponse {
	success: boolean;
	data?: {
		_id: string;
		title: string;
		status: "pending" | "verified";
	};
	error?: string;
	statusCode?: number;
	details?: ApiErrorDetail[] | null;
}

export interface CmsAuthorOption {
	_id: string;
	name: string;
}

class CmsService {
	async listCmsContent(params: {
		page?: number;
		limit?: number;
		sortBy?: "title";
		type?: "all" | "news" | "videos" | "ads";
		search?: string;
		fromDate?: string;
		toDate?: string;
	}): Promise<{ success: boolean; data?: CmsContentsResponse; error?: string }> {
		const searchParams = new URLSearchParams();
		if (params.page) searchParams.set("page", params.page.toString());
		if (params.limit) searchParams.set("limit", params.limit.toString());
		if (params.sortBy) searchParams.set("sortBy", params.sortBy);
		if (params.type && params.type !== "all") searchParams.set("type", params.type);
		if (params.search) searchParams.set("search", params.search);
		if (params.fromDate) searchParams.set("fromDate", params.fromDate);
		if (params.toDate) searchParams.set("toDate", params.toDate);

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

	async listCmsAuthors(): Promise<{
		success: boolean;
		data?: CmsAuthorOption[];
		error?: string;
		statusCode?: number;
		details?: ApiErrorDetail[] | null;
	}> {
		return fetchApi<CmsAuthorOption[]>("/cms/authors");
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
			statusCode: response.statusCode,
			details: response.details ?? null,
		};
	}

	async updateCmsContent(
		id: string,
		data: UpdateCmsContentData,
	): Promise<CreateCmsContentResponse> {
		const response = await fetchApi<{
			_id: string;
			title: string;
			status: "pending" | "verified";
		}>(`/cms/content/${id}`, {
			method: "PUT",
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
			statusCode: response.statusCode,
			details: response.details ?? null,
		};
	}

	async deleteCmsContent(
		id: string,
	): Promise<{ success: boolean; error?: string; statusCode?: number }> {
		const response = await fetchApi<{ deletedId: string }>(`/cms/content/${id}`, {
			method: "DELETE",
		});

		if (response.success) {
			return { success: true };
		}

		return {
			success: false,
			error: response.error,
			statusCode: response.statusCode,
		};
	}

	async getCmsContentById(
		id: string,
	): Promise<{
		success: boolean;
		data?: CmsContentDetail;
		error?: string;
		statusCode?: number;
	}> {
		return fetchApi<CmsContentDetail>(`/cms/content/${id}`);
	}
}

export const cmsService = new CmsService();
