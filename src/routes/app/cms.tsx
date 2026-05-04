import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Search, Eye, Edit2, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { type Column, DataTable } from "@/components/DataTable";
import FilterIcon from "@/logo/filter.svg?react";
import PostIcon from "@/logo/post.svg?react";
import SortIcon from "@/logo/sort.svg?react";
import { cmsService } from "../../lib/cms";
import { TimePeriodFilter } from "@/components/TimePeriodFilter";
import { CmsAddModal } from "../../components/CmsAddModal";
import { ActionDropdown } from "@/components/ActionDropdown";


export const Route = createFileRoute("/app/cms")({
	component: CmsPage,
});

type ContentType = "all" | "news" | "videos" | "ads";

function CmsPage() {
	const queryClient = useQueryClient();
	const [search, setSearch] = useState("");
	const [page, setPage] = useState(1);
	const [limit] = useState(10);
	const [sortBy, setSortBy] = useState<"title" | "">("");
	const [activeTab, setActiveTab] = useState<ContentType>("all");
	const [showAddModal, setShowAddModal] = useState(false);
	const [actionDropdown, setActionDropdown] = useState<{ item: any; top: number; right: number } | null>(null);

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

	useEffect(() => {
		if (error) {
			toast.error(error.message || "Failed to fetch cms content");
		}
	}, [error]);

	const contents = cmsData?.content || [];
	const tableData = contents.map((item) => ({
		...item,
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
								className="flex items-center gap-4"
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
									buttonClassName="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-600 hover:bg-gray-50 cursor-pointer"
									onFilterChange={(period, customRange) => console.log(period, customRange)} 
								/>
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

			<CmsAddModal
				isOpen={showAddModal}
				onClose={() => setShowAddModal(false)}
			/>

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
								console.log("View content", actionDropdown.item);
								setActionDropdown(null);
							},
						},
						{
							icon: <Edit2 className="w-4 h-4" />,
							label: "Edit content",
							onClick: () => {
								console.log("Edit content", actionDropdown.item);
								setActionDropdown(null);
							},
						},
						{
							icon: <Trash2 className="w-4 h-4 text-red-500" />,
							label: "Delete content",
							className: "!text-red-500",
							onClick: () => {
								console.log("Delete content", actionDropdown.item);
								setActionDropdown(null);
							},
						}
					]}
				/>
			)}
		</div>
	);
}