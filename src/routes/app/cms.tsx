import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { ChevronDown, Search, Upload, X } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { type Column, DataTable } from "@/components/DataTable";
import FilterIcon from "@/logo/filter.svg?react";
import PostIcon from "@/logo/post.svg?react";
import SortIcon from "@/logo/sort.svg?react";
import type { ApiErrorDetail } from "../../lib/api";
import { type CreateCmsContentData, cmsService } from "../../lib/cms";

export const Route = createFileRoute("/app/cms")({
	component: CmsPage,
});

type ContentType = "all" | "news" | "videos" | "ads";
type CmsFieldName = keyof CreateCmsContentData;
type CmsMutationError = Error & {
	statusCode?: number;
	details?: ApiErrorDetail[] | null;
};

function CmsPage() {
	const queryClient = useQueryClient();
	const [search, setSearch] = useState("");
	const [page, setPage] = useState(1);
	const [limit] = useState(10);
	const [sortBy, setSortBy] = useState<"title" | "">("");
	const [activeTab, setActiveTab] = useState<ContentType>("all");
	const [showAddModal, setShowAddModal] = useState(false);
	const [selectedFileName, setSelectedFileName] = useState("");
	const [fieldErrors, setFieldErrors] = useState<
		Partial<Record<CmsFieldName, string>>
	>({});
	const [newContent, setNewContent] = useState<CreateCmsContentData>({
		title: "",
		message: "",
		contentType: "news",
		authorName: "",
		bannerImage: undefined,
	});

	const {
		data: cmsData,
		isLoading,
		error,
	} = useQuery({
		queryKey: ["cms", page, limit, sortBy, activeTab, search],
		queryFn: async () => {
			const result = await cmsService.listCmsContent({
				page,
				limit,
				sortBy: sortBy || undefined,
				type: activeTab,
				search: search || undefined,
			});
			if (!result.success) {
				throw new Error(result.error || "Failed to fetch cms content");
			}
			return result.data;
		},
	});

	const { data: authors = [], error: authorsError, isLoading: isAuthorsLoading } =
		useQuery({
			queryKey: ["cms-authors"],
			enabled: showAddModal,
			queryFn: async () => {
				const result = await cmsService.listCmsAuthors();
				if (!result.success) {
					const queryError = new Error(
						result.error || "Failed to fetch authors",
					) as CmsMutationError;
					queryError.statusCode = result.statusCode;
					queryError.details = result.details ?? null;
					throw queryError;
				}
				return result.data || [];
			},
		});

	useEffect(() => {
		if (error) {
			toast.error(error.message || "Failed to fetch cms content");
		}
	}, [error]);

	useEffect(() => {
		if (authorsError) {
			toast.error("An error occurred please try again later");
		}
	}, [authorsError]);

	const createContentMutation = useMutation({
		mutationFn: async (data: CreateCmsContentData) => {
			const result = await cmsService.createCmsContent(data);
			if (!result.success) {
				const apiError = new Error(
					result.error || "Failed to create cms content",
				) as CmsMutationError;
				apiError.statusCode = result.statusCode;
				apiError.details = result.details ?? null;
				throw apiError;
			}
			return result.data;
		},
		onSuccess: () => {
			toast.success("Content created successfully");
			setShowAddModal(false);
			setFieldErrors({});
			setNewContent({
				title: "",
				message: "",
				contentType: "news",
				authorName: "",
				bannerImage: undefined,
			});
			setSelectedFileName("");
			queryClient.invalidateQueries({ queryKey: ["cms"] });
		},
		onError: (error) => {
			const apiError = error as CmsMutationError;

			if (apiError.statusCode === 400) {
				const nextFieldErrors: Partial<Record<CmsFieldName, string>> = {};
				for (const detail of apiError.details || []) {
					if (
						detail.field === "title" ||
						detail.field === "message" ||
						detail.field === "contentType" ||
						detail.field === "authorName" ||
						detail.field === "bannerImage"
					) {
						nextFieldErrors[detail.field] = detail.message;
					}
				}
				setFieldErrors(nextFieldErrors);
				toast.error("Please check the highlighted fields");
				return;
			}

			toast.error("An error occurred please try again later");
		},
	});

	const contents = cmsData?.content || [];
	const tableData = contents.map((item, index) => ({
		...item,
		serialNumber: (page - 1) * limit + index + 1,
	}));
	const total = cmsData?.total || 0;
	const totalPages = Math.ceil(total / limit);

	const getTypeLabel = (type: string) => {
		switch (type) {
			case "news":
				return "News";
			case "videos":
				return "Videos";
			case "ads":
				return "Ads";
			default:
				return type;
		}
	};

	const cmsColumns: Column<(typeof tableData)[number]>[] = [
		{
			header: "S/N",
			accessor: (item) => {
				const previewImage = item.image || item.author.image;
				return (
					<div className="flex items-center gap-3">
						<span className="min-w-6 font-medium text-gray-900">
							{item.serialNumber}
						</span>
						{previewImage ? (
							<img
								src={previewImage}
								alt={item.title}
								className="h-12 w-12 rounded-md object-cover"
							/>
						) : (
							<div className="flex h-12 w-12 items-center justify-center rounded-md bg-gray-100 text-gray-400 text-xs">
								N/A
							</div>
						)}
					</div>
				);
			},
		},
		{
			header: "Content title",
			accessor: "title",
			cellClassName: "max-w-[200px] truncate font-medium",
		},
		{
			header: "Author Name",
			accessor: (item) => (
				<div className="flex items-center gap-3">
					{item.author.image ? (
						<img
							src={item.author.image}
							alt={item.author.name}
							className="h-8 w-8 rounded-full object-cover"
						/>
					) : (
						<div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-200 text-gray-600 text-xs font-medium">
							{item.author.name.charAt(0).toUpperCase()}
						</div>
					)}
					<span>{item.author.name}</span>
				</div>
			),
		},
		{
			header: "Type",
			accessor: (item) => getTypeLabel(item.type),
		},
		{
			header: "Date Uploaded",
			accessor: (item) => item.dateUploaded || "-",
		},
		{
			header: "Status",
			accessor: (item) => (
				<span
					className={`rounded-full px-2 py-1 font-medium text-xs ${
						item.status === "verified"
							? "bg-green-100 text-green-800"
							: "bg-yellow-100 text-yellow-800"
					}`}
				>
					{item.status}
				</span>
			),
		},
	];

	const handleFileChange = (file: File | null) => {
		if (!file) {
			setSelectedFileName("");
			setNewContent((prev) => ({ ...prev, bannerImage: undefined }));
			return;
		}

		if (!file.type.startsWith("image/")) {
			toast.error("Only image uploads are supported for CMS content");
			setSelectedFileName("");
			setNewContent((prev) => ({ ...prev, bannerImage: undefined }));
			return;
		}

		const reader = new FileReader();
		reader.onload = () => {
			const encodedImage =
				typeof reader.result === "string" &&
				reader.result.startsWith("data:image/")
					? reader.result
					: undefined;

			if (!encodedImage) {
				toast.error("Failed to process image file");
				setSelectedFileName("");
				setNewContent((prev) => ({ ...prev, bannerImage: undefined }));
				return;
			}

			setNewContent((prev) => ({
				...prev,
				bannerImage: encodedImage,
			}));
			setFieldErrors((prev) => ({ ...prev, bannerImage: undefined }));
			setSelectedFileName(file.name);
		};
		reader.onerror = () => {
			toast.error("Failed to read selected file");
		};
		reader.readAsDataURL(file);
	};

	return (
		<div className="space-y-6">
			<div className="overflow-x-auto">
				<div className="min-w-[860px] space-y-6 md:min-w-0">
					<div className="flex items-center justify-between">
						<div>
							<h2 className="font-bold text-2xl text-gray-900">CMS Controls</h2>
							<p className="text-gray-600">
								Manage all your contents and creators{" "}
							</p>
						</div>
						<div className="flex items-center gap-3">
							<button
								onClick={() => setSortBy((s) => (s === "title" ? "" : "title"))}
								className="inline-flex cursor-pointer items-center gap-2 rounded-full border-2 border-primary px-2 py-2 font-medium text-gray-900 text-sm hover:bg-gray-50"
							>
								<SortIcon className="h-3 w-3" />
								Sort
							</button>
							<button className="inline-flex cursor-pointer items-center gap-2 rounded-full border-2 border-primary px-2 py-2 font-medium text-gray-900 text-sm hover:bg-gray-50">
								<FilterIcon className="h-3 w-3" />
								Filter
							</button>
						<button
							type="button"
							onClick={() => {
								setFieldErrors({});
								setShowAddModal(true);
							}}
							className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-accent px-4 py-2 font-medium text-white text-sm hover:bg-accent/90"
						>
						<PostIcon className="h-4 w-4" />
						Post new content
					</button>
						</div>
					</div>

					<div className="flex items-center justify-between gap-4">
						<div className="flex gap-8 border-b border-gray-300">
							{[
								{ key: "all", label: "All" },
								{ key: "news", label: "News" },
								{ key: "videos", label: "Videos" },
								{ key: "ads", label: "Ads" },
							].map((tab) => (
								<button
									type="button"
									key={tab.key}
									onClick={() => {
										setActiveTab(tab.key as ContentType);
										setPage(1);
									}}
									className={`cursor-pointer pb-3 font-medium text-sm transition-colors ${
										activeTab === tab.key
											? "border-b-2 border-accent text-accent"
											: "text-gray-600 hover:text-gray-900"
									}`}
								>
									{tab.label}
								</button>
							))}
						</div>

						{!error && (
							<form
								className="relative"
								onSubmit={(e) => {
									e.preventDefault();
									setPage(1);
									queryClient.invalidateQueries({ queryKey: ["cms"] });
								}}
							>
								<input
									type="text"
									placeholder="Search"
									value={search}
									onChange={(e) => setSearch(e.target.value)}
									className="w-64 rounded-full border border-gray-400 bg-gray-50 py-2 pr-4 pl-10 shadow-md focus:border-primary focus:outline-none focus:ring-primary"
								/>
								<Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-500" />
							</form>
						)}
					</div>

					<div className="relative overflow-hidden rounded-lg bg-white shadow-md">
						{isLoading && (
							<div className="absolute inset-0 flex items-center justify-center bg-white/50">
								<div className="h-8 w-8 animate-spin rounded-full border-primary border-b-2" />
							</div>
						)}
						{error ? (
							<div className="flex flex-col items-center justify-center rounded-lg bg-white py-12 shadow-lg">
								<p className="font-bold text-xl text-gray-900">
									{error.message.toLowerCase().includes("not found")
										? "No cms content found"
										: "An error occurred"}
								</p>
								{!error.message.toLowerCase().includes("not found") && (
									<p className="mt-1 text-gray-600">try again later</p>
								)}
								<button
									onClick={() =>
										queryClient.invalidateQueries({ queryKey: ["cms"] })
									}
									className="mt-3 rounded-md bg-accent px-4 py-2 font-medium text-white hover:bg-accent/90"
								>
									Retry
								</button>
							</div>
						) : (
							<DataTable
								data={tableData}
								columns={cmsColumns}
								isLoading={isLoading}
								emptyMessage="No cms content found"
								pagination={{
									currentPage: page,
									totalPages,
									onPageChange: setPage,
									totalItems: total,
									itemsPerPage: limit,
								}}
							/>
						)}
					</div>
				</div>
			</div>

			{showAddModal && (
				<div
					className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-3"
					onClick={() => setShowAddModal(false)}
				>
					<div
						className="flex h-[80%] max-h-[80%] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-[#f3f3f4] shadow-2xl"
						onClick={(e) => e.stopPropagation()}
					>
						<div className="flex items-center justify-between bg-[#ececee] px-5 py-3 sm:px-8">
							<h3 className="font-bold text-[#0a0d3c] text-base sm:text-3xl">
								Upload new Content
							</h3>
							<button
								type="button"
								onClick={() => setShowAddModal(false)}
								className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-[#0a0d3c] text-[#0a0d3c] transition-colors hover:bg-[#e4e4ea]"
							>
								<X className="h-5 w-5" />
							</button>
						</div>
						<form
							onSubmit={(e) => {
								e.preventDefault();
								setFieldErrors({});
								createContentMutation.mutate(newContent);
							}}
							className="flex-1 space-y-4 overflow-y-auto px-5 py-4 sm:px-8 sm:py-4"
						>
							<div>
								<label className="mb-1.5 block font-semibold text-[#11123f] text-base sm:text-xl">
									Content/Story Title
								</label>
								<input
									type="text"
									value={newContent.title}
									onChange={(e) => {
										setFieldErrors((prev) => ({ ...prev, title: undefined }));
										setNewContent((prev) => ({
											...prev,
											title: e.target.value,
										}));
									}}
									required
									placeholder="Enter headline"
									className="h-11 w-full rounded-xl border border-transparent bg-[#ececee] px-3 text-[#11123f] text-sm placeholder:text-[#657084] focus:border-[#0a0d3c] focus:outline-none sm:h-12 sm:text-base"
								/>
								{fieldErrors.title && (
									<p className="mt-1 text-red-600 text-xs">
										{fieldErrors.title}
									</p>
								)}
							</div>

							<div className="grid gap-5 lg:grid-cols-[1fr_335px]">
								<div>
									<label className="mb-1.5 block font-semibold text-[#11123f] text-lg sm:text-2xl">
										Message
									</label>
									<textarea
										value={newContent.message}
										onChange={(e) => {
											setFieldErrors((prev) => ({ ...prev, message: undefined }));
											setNewContent((prev) => ({
												...prev,
												message: e.target.value,
											}));
										}}
										required
										placeholder="Write message here..."
										className="h-[180px] w-full resize-none rounded-xl border border-transparent bg-[#ececee] p-3 text-[#11123f] text-sm placeholder:text-[#657084] focus:border-[#0a0d3c] focus:outline-none sm:h-[220px] sm:text-base lg:h-[260px]"
									/>
									{fieldErrors.message && (
										<p className="mt-1 text-red-600 text-xs">
											{fieldErrors.message}
										</p>
									)}
								</div>

								<div className="flex flex-col gap-4">
									<div>
										<label className="mb-1.5 block font-semibold text-[#11123f] text-base sm:text-xl">
											Author name
										</label>
										<div className="relative">
											<select
											value={newContent.authorName}
											onChange={(e) => {
												setFieldErrors((prev) => ({
													...prev,
													authorName: undefined,
												}));
												setNewContent((prev) => ({
													...prev,
													authorName: e.target.value,
												}));
											}}
												required
												disabled={isAuthorsLoading || authors.length === 0}
												className="h-11 w-full appearance-none rounded-xl border border-transparent bg-[#ececee] px-3 pr-9 text-[#56607a] text-sm focus:border-[#0a0d3c] focus:outline-none disabled:opacity-60 sm:h-12 sm:text-base"
											>
												<option value="" disabled>
													{isAuthorsLoading
														? "Loading authors..."
														: "Select author"}
												</option>
												{authors.map((author) => (
													<option key={author._id} value={author.name}>
														{author.name}
													</option>
												))}
											</select>
											<ChevronDown className="-translate-y-1/2 pointer-events-none absolute top-1/2 right-3 h-4 w-4 text-[#6b7286]" />
										</div>
										{fieldErrors.authorName && (
											<p className="mt-1 text-red-600 text-xs">
												{fieldErrors.authorName}
											</p>
										)}
									</div>

									<div>
										<label className="mb-1.5 block font-semibold text-[#11123f] text-base sm:text-xl">
											Content Type/Labels
										</label>
										<div className="relative">
											<select
												value={newContent.contentType}
												onChange={(e) => {
													setFieldErrors((prev) => ({
														...prev,
														contentType: undefined,
													}));
													setNewContent((prev) => ({
														...prev,
														contentType: e.target.value as
															| "news"
															| "videos"
															| "ads",
													}));
												}}
												required
												className="h-11 w-full appearance-none rounded-xl border border-transparent bg-[#ececee] px-3 pr-9 text-[#56607a] text-sm focus:border-[#0a0d3c] focus:outline-none sm:h-12 sm:text-base"
											>
												<option value="news">News</option>
												<option value="videos">Videos</option>
												<option value="ads">Ads</option>
											</select>
											<ChevronDown className="-translate-y-1/2 pointer-events-none absolute top-1/2 right-3 h-4 w-4 text-[#6b7286]" />
										</div>
										{fieldErrors.contentType && (
											<p className="mt-1 text-red-600 text-xs">
												{fieldErrors.contentType}
											</p>
										)}
									</div>

									<div className="rounded-xl border border-dashed border-[#b9bbc5] bg-[#f5f5f6] p-3">
										<label
											htmlFor="cms-banner-upload"
											className="flex min-h-[84px] cursor-pointer flex-col items-center justify-center rounded-lg border border-transparent text-center transition-colors hover:bg-[#ececee]"
										>
											<Upload className="mb-1.5 h-5 w-5 text-[#8a8d97]" />
											<span className="font-medium text-[#737680] text-sm sm:text-base">
												{selectedFileName || "Choose an Image"}
											</span>
											<span className="text-[#a7a9b2] text-xs sm:text-sm">
												Upload supports: JPG, PNG.
											</span>
										</label>
										<input
											id="cms-banner-upload"
											type="file"
											accept=".jpg,.jpeg,.png,image/*"
											className="hidden"
											onChange={(e) =>
												handleFileChange(e.target.files?.[0] ?? null)
											}
										/>
										{fieldErrors.bannerImage && (
											<p className="mt-1 text-red-600 text-xs">
												{fieldErrors.bannerImage}
											</p>
										)}
									</div>

									<div className="mt-auto pt-1">
										<button
											type="submit"
											disabled={
												createContentMutation.isPending ||
												isAuthorsLoading ||
												authors.length === 0
											}
											className="h-11 w-full rounded-full bg-[#1baa04] font-semibold text-sm text-white transition-colors hover:bg-[#149504] disabled:cursor-not-allowed disabled:opacity-60 sm:h-12 sm:text-base"
										>
											{createContentMutation.isPending ? "Uploading..." : "Upload"}
										</button>
									</div>
								</div>
							</div>

							<div className="flex justify-end">
								<button
									type="button"
									onClick={() => setShowAddModal(false)}
									className="rounded-md px-2 py-1 text-[#5f6679] text-sm underline hover:text-[#0a0d3c]"
								>
									Cancel
								</button>
							</div>
						</form>
					</div>
				</div>
			)}
		</div>
	);
}
