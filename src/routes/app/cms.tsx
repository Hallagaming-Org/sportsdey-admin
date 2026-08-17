import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, redirect, useRouter } from "@tanstack/react-router";
import { Edit2, Eye, PauseCircle, Search, Trash, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
	FaFileExcel,
	FaFileExport,
	FaFilePdf,
	FaFileWord,
} from "react-icons/fa6";
import { toast } from "sonner";
import { startAdminExport } from "#/lib/admin-exports";
import { ActionDropdown } from "@/components/ActionDropdown";
import { type Column, DataTable } from "@/components/DataTable";
import {
	type TimePeriod,
	TimePeriodFilter,
} from "@/components/TimePeriodFilter";
import FilterIcon from "@/logo/filter.svg?react";
import PostIcon from "@/logo/post.svg?react";
import SortIcon from "@/logo/sort.svg?react";
import { CmsAddModal } from "../../components/CmsAddModal";
import { CmsEditModal } from "../../components/CmsEditModal";
import { cmsService } from "../../lib/cms";
import { getDateRangeForPeriod } from "../../lib/time-period";

export const Route = createFileRoute("/app/cms")({
	beforeLoad: ({ context }) => {
		const admin = (context as any).admin;
		if (
			admin &&
			admin.role !== "super_admin" &&
			!admin.permissions?.includes("post_upload_content")
		) {
			throw redirect({ to: "/app", replace: true });
		}
	},
	component: CmsPage,
});

type ContentType = "all" | "news" | "videos" | "ads";

function CmsPage() {
	const queryClient = useQueryClient();
	const router = useRouter();
	const [search, setSearch] = useState("");
	const [page, setPage] = useState(1);
	const [limit] = useState(10);
	const [sortBy, setSortBy] = useState<"title" | "">("");
	const [activeTab, setActiveTab] = useState<ContentType>("all");
	const [showAddModal, setShowAddModal] = useState(false);
	const [selectedTimePeriod, setSelectedTimePeriod] =
		useState<TimePeriod>("All");
	const [customDateRange, setCustomDateRange] = useState<{
		start: string;
		end: string;
	} | null>(null);
	const [selectedContentId, setSelectedContentId] = useState<string | null>(
		null,
	);
	const [editContentId, setEditContentId] = useState<string | null>(null);
	const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

	const { fromDate, toDate } = useMemo(
		() =>
			getDateRangeForPeriod(selectedTimePeriod, customDateRange || undefined),
		[selectedTimePeriod, customDateRange],
	);
	const [actionDropdown, setActionDropdown] = useState<{
		item: any;
		top: number;
		right: number;
	} | null>(null);
	const [showExportDropdown, setShowExportDropdown] = useState(false);

	const exportCms = (format: "xlsx" | "docx" | "pdf") => {
		void startAdminExport({
			source: "cms",
			format,
			filters: {
				search: search || undefined,
				type: activeTab,
				fromDate,
				toDate,
			},
		});
	};

	useEffect(() => {
		const handleClickOutside = () => setActionDropdown(null);
		document.addEventListener("click", handleClickOutside);
		return () => document.removeEventListener("click", handleClickOutside);
	}, []);

	const {
		data: cmsData,
		isLoading,
		error,
	} = useQuery({
		queryKey: [
			"cms",
			page,
			limit,
			sortBy,
			activeTab,
			search,
			selectedTimePeriod,
			customDateRange,
		],
		queryFn: async () => {
			const result = await cmsService.listCmsContent({
				page,
				limit,
				sortBy: sortBy || undefined,
				type: activeTab,
				search: search || undefined,
				fromDate,
				toDate,
			});
			if (!result.success) {
				throw new Error(result.error || "Failed to fetch cms content");
			}
			return result.data;
		},
	});

	useEffect(() => {
		if (error) {
			toast.error(error.message || "Failed to fetch cms content");
		}
	}, [error]);

	const deleteMutation = useMutation({
		mutationFn: (id: string) => cmsService.deleteCmsContent(id),
		onSuccess: (result) => {
			if (result.success) {
				toast.success("Content deleted successfully");
				queryClient.invalidateQueries({ queryKey: ["cms"] });
				router.invalidate();
			} else {
				toast.error(result.error || "Failed to delete content");
			}
			setDeleteConfirmId(null);
		},
		onError: () => {
			toast.error("Failed to delete content");
			setDeleteConfirmId(null);
		},
	});

	const {
		data: selectedContentDetail,
		isLoading: isLoadingContentDetail,
		error: contentDetailError,
	} = useQuery({
		queryKey: ["cms-content-detail", selectedContentId],
		queryFn: async () => {
			if (!selectedContentId) throw new Error("Content id is required");
			const result = await cmsService.getCmsContentById(selectedContentId);
			if (!result.success || !result.data) {
				throw new Error(result.error || "Failed to fetch content details");
			}
			return result.data;
		},
		enabled: !!selectedContentId,
	});

	const contents = cmsData?.content || [];
	const tableData = contents;
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

	const formatPublishedDate = (date: string) => {
		const parsedDate = new Date(date);
		if (Number.isNaN(parsedDate.getTime())) return "-";
		return parsedDate.toLocaleString();
	};

	const cmsColumns: Column<(typeof tableData)[number]>[] = [
		{
			header: "S/N",
			accessor: (item) => {
				const previewImage = item.image || item.author.image;
				return (
					<div className="flex items-center gap-3">
						{/* <span className="min-w-6 font-medium text-gray-900">
							{item.serialNumber}
						</span> */}
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
							className="h-5 w-5 rounded-full object-cover"
						/>
					) : (
						<div className="flex h-5 w-5 items-center justify-center rounded-full bg-gray-200 text-gray-600 text-xs font-medium">
							{item.author.name.charAt(0).toUpperCase()}
						</div>
					)}
					<span className="text-sm">{item.author.name}</span>
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

	return (
		<div className="flex h-[calc(100vh-120px)] flex-col gap-6 overflow-hidden px-6">
			<div className="flex-1 min-h-0 flex flex-col gap-4">
				<div className="flex-none flex items-center justify-between">
					<div>
						<h2 className="font-bold text-2xl text-gray-900">CMS Controls</h2>
						<p className="text-gray-600">
							Manage all your contents and creators{" "}
						</p>
					</div>
					<div className="flex items-center gap-3">
						<button
							onClick={() => setSortBy((s) => (s === "title" ? "" : "title"))}
							className="inline-flex cursor-pointer items-center gap-2 rounded-full border-2 border-[#053209] px-2 py-2 font-medium text-gray-900 text-sm hover:bg-gray-50"
						>
							<SortIcon className="h-3 w-3" />
							Sort
						</button>
						<button className="inline-flex cursor-pointer items-center gap-2 rounded-full border-2 border-[#053209] px-2 py-2 font-medium text-gray-900 text-sm hover:bg-gray-50">
							<FilterIcon className="h-3 w-3" />
							Filter
						</button>
						<button
							type="button"
							onClick={() => {
								setShowAddModal(true);
							}}
							className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-accent px-4 py-2 font-medium text-white text-sm hover:bg-accent/90"
						>
							<PostIcon className="h-4 w-4" />
							Post new content
						</button>
					</div>
				</div>

				<div className="flex-none flex items-center justify-between gap-4">
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
							className="flex items-center gap-3 flex-wrap lg:flex-nowrap"
							onSubmit={(e) => {
								e.preventDefault();
								setPage(1);
								queryClient.invalidateQueries({ queryKey: ["cms"] });
							}}
						>
							<div className="relative">
								<input
									type="text"
									placeholder="Search"
									value={search}
									onChange={(e) => setSearch(e.target.value)}
									className="w-64 rounded-full border border-gray-400 bg-gray-50 py-2 pr-4 pl-10 shadow-md focus:border-primary focus:outline-none focus:ring-primary"
								/>
								<Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-500" />
							</div>
							<TimePeriodFilter
								onFilterChange={(period, customRange) => {
									setSelectedTimePeriod(period);
									if (period === "Custom" && customRange) {
										setCustomDateRange(customRange);
									} else {
										setCustomDateRange(null);
									}
									setPage(1);
								}}
								buttonClassName="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-600 hover:bg-gray-50 cursor-pointer"
							/>

							{contents.length > 0 && (
								<div className="relative">
									<button
										type="button"
										onClick={(e) => {
											e.stopPropagation();
											if (e.nativeEvent) {
												e.nativeEvent.stopImmediatePropagation();
											}
											setShowExportDropdown(!showExportDropdown);
										}}
										className="inline-flex items-center h-8 gap-1.5 rounded-full bg-[#1BAA04] px-3.5 py-1.5 text-xs font-medium text-white cursor-pointer hover:bg-[#158903] transition-colors whitespace-nowrap"
									>
										Export File as
										<FaFileExport className="h-3 w-3 text-white" />
									</button>

									{showExportDropdown && (
										<div className="absolute right-0 z-[70] mt-2 w-40 rounded-xl border border-gray-200 bg-white p-1 shadow-lg overflow-hidden">
											<button
												type="button"
												onClick={(e) => {
													e.stopPropagation();
													setShowExportDropdown(false);
													exportCms("pdf");
												}}
												className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
											>
												<FaFilePdf className="text-red-500 w-4 h-4" />
												PDF
											</button>
											<button
												type="button"
												onClick={(e) => {
													e.stopPropagation();
													setShowExportDropdown(false);
													exportCms("docx");
												}}
												className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
											>
												<FaFileWord className="text-blue-600 w-4 h-4" />
												DOCX
											</button>
											<button
												type="button"
												onClick={(e) => {
													e.stopPropagation();
													setShowExportDropdown(false);
													exportCms("xlsx");
												}}
												className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
											>
												<FaFileExcel className="text-green-600 w-4 h-4" />
												Excel
											</button>
										</div>
									)}
								</div>
							)}
						</form>
					)}
				</div>

				<div className="flex-1 min-h-0 relative overflow-hidden rounded-lg bg-white shadow-md">
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
							onActionClick={(item, e) => {
								if (e) {
									e.stopPropagation();
									e.nativeEvent.stopImmediatePropagation();
									const rect = e.currentTarget.getBoundingClientRect();
									setActionDropdown({
										item,
										top: rect.bottom + window.scrollY,
										right: window.innerWidth - rect.right,
									});
								}
							}}
							maxHeight="100%"
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

			{actionDropdown && (
				<ActionDropdown
					top={actionDropdown.top}
					right={actionDropdown.right}
					onClose={() => setActionDropdown(null)}
					items={[
						{
							icon: <Eye className="w-4 h-4" />,
							label: "View content",
							onClick: () => {
								setSelectedContentId(actionDropdown.item._id);
								setActionDropdown(null);
							},
						},
						{
							icon: <Edit2 className="w-4 h-4" />,
							label: "Edit",
							onClick: () => {
								setEditContentId(actionDropdown.item._id);
								setActionDropdown(null);
							},
						},
						{
							icon: <Trash className="w-4 h-4" />,
							label: "Delete",
							onClick: () => {
								setDeleteConfirmId(actionDropdown.item._id);
								setActionDropdown(null);
							},
						},
					]}
				/>
			)}

			<CmsAddModal
				isOpen={showAddModal}
				onClose={() => setShowAddModal(false)}
			/>

			<CmsEditModal
				editContentId={editContentId}
				onClose={() => setEditContentId(null)}
			/>

			{selectedContentId && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
					<div className="mx-4 w-full max-w-3xl rounded-xl bg-white p-6 shadow-xl">
						<div className="flex items-center justify-between mb-4">
							<h3 className="text-xl font-bold text-gray-900">
								Content Details
							</h3>
							<button
								onClick={() => setSelectedContentId(null)}
								className="text-gray-400 hover:text-gray-600 cursor-pointer"
							>
								✕
							</button>
						</div>
						{isLoadingContentDetail ? (
							<div className="py-12 text-center text-gray-600">
								Loading content...
							</div>
						) : contentDetailError ? (
							<div className="space-y-4 py-6 text-center">
								<p className="font-medium text-gray-900">
									Failed to load content details.
								</p>
								<button
									type="button"
									onClick={() =>
										queryClient.invalidateQueries({
											queryKey: ["cms-content-detail", selectedContentId],
										})
									}
									className="rounded-lg bg-accent px-4 py-2 font-medium text-white hover:bg-accent/90 cursor-pointer"
								>
									Retry
								</button>
							</div>
						) : selectedContentDetail ? (
							<div className="max-h-[70vh] space-y-4 overflow-y-auto pr-1">
								{selectedContentDetail.image && (
									<img
										src={selectedContentDetail.image}
										alt={selectedContentDetail.title}
										className="w-full h-48 object-cover rounded-lg"
									/>
								)}
								<div>
									<p className="text-sm font-medium text-gray-500">Title</p>
									<p className="text-lg font-semibold text-gray-900">
										{selectedContentDetail.title}
									</p>
								</div>
								<div className="flex items-center gap-3">
									<p className="text-sm font-medium text-gray-500">Author:</p>
									<div className="flex items-center gap-2">
										{selectedContentDetail.author.image ? (
											<img
												src={selectedContentDetail.author.image}
												alt={selectedContentDetail.author.name}
												className="h-6 w-6 rounded-full object-cover"
											/>
										) : (
											<div className="h-6 w-6 rounded-full bg-gray-200 flex items-center justify-center">
												<span className="text-xs text-gray-600">
													{selectedContentDetail.author.name
														.charAt(0)
														.toUpperCase()}
												</span>
											</div>
										)}
										<span className="text-sm text-gray-900">
											{selectedContentDetail.author.name}
										</span>
									</div>
								</div>
								<div>
									<p className="text-sm font-medium text-gray-500">Type</p>
									<p className="text-gray-900 capitalize">
										{selectedContentDetail.type}
									</p>
								</div>
								<div>
									<p className="text-sm font-medium text-gray-500">Status</p>
									<span
										className={`inline-block rounded-full px-2 py-1 text-xs font-medium ${
											selectedContentDetail.status === "verified"
												? "bg-green-100 text-green-800"
												: "bg-yellow-100 text-yellow-800"
										}`}
									>
										{selectedContentDetail.status}
									</span>
								</div>
								<div>
									<p className="text-sm font-medium text-gray-500">
										Published At
									</p>
									<p className="text-gray-900">
										{formatPublishedDate(selectedContentDetail.publishedAt)}
									</p>
								</div>
								<div>
									<p className="text-sm font-medium text-gray-500">Content</p>
									<p className="whitespace-pre-wrap rounded-lg border border-gray-200 bg-gray-50 p-3 text-gray-900">
										{selectedContentDetail.message ||
											"No content body provided"}
									</p>
								</div>
							</div>
						) : (
							<div className="py-12 text-center text-gray-600">
								No content found.
							</div>
						)}
						<div className="mt-6 flex justify-end">
							<button
								onClick={() => setSelectedContentId(null)}
								className="rounded-lg bg-gray-100 px-4 py-2 font-medium text-gray-700 hover:bg-gray-200 cursor-pointer"
							>
								Close
							</button>
						</div>
					</div>
				</div>
			)}

			{deleteConfirmId && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
					<div className="mx-4 w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
						<h3 className="text-lg font-bold text-gray-900">Confirm Delete</h3>
						<p className="mt-2 text-gray-600">
							Are you sure you want to delete this content? This action cannot
							be undone.
						</p>
						<div className="mt-6 flex justify-end gap-3">
							<button
								onClick={() => setDeleteConfirmId(null)}
								className="rounded-lg border border-gray-300 px-4 py-2 font-medium text-gray-700 hover:bg-gray-50 cursor-pointer"
							>
								Cancel
							</button>
							<button
								onClick={() => deleteMutation.mutate(deleteConfirmId)}
								disabled={deleteMutation.isPending}
								className="rounded-lg bg-red-600 px-4 py-2 font-medium text-white hover:bg-red-700 disabled:opacity-50 cursor-pointer"
							>
								{deleteMutation.isPending ? "Deleting..." : "Delete"}
							</button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
