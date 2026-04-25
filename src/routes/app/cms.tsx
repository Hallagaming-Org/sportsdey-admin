import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { IoMdCloud } from "react-icons/io";
import { Search } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import FilterIcon from "@/logo/filter.svg?react";
import SortIcon from "@/logo/sort.svg?react";
import { cmsService, type CreateCmsContentData, type CmsContent } from "../../lib/cms";
import { IoFilter } from "react-icons/io5";
import { DataTable, type Column } from "../../components/DataTable";

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

	useEffect(() => {
		if (error) {
			toast.error(error.message || "Failed to fetch cms content");
		}
	}, [error]);

	const createContentMutation = useMutation({
		mutationFn: async (data: CreateCmsContentData) => {
			const result = await cmsService.createCmsContent(data);
			if (!result.success) {
				throw new Error(result.error || "Failed to create cms content");
			}
			return result.data;
		},
		onSuccess: () => {
			toast.success("Content created successfully");
			setShowAddModal(false);
			setNewContent({
				title: "",
				message: "",
				contentType: "news",
				authorName: "",
				bannerImage: undefined,
			});
			queryClient.invalidateQueries({ queryKey: ["cms"] });
		},
		onError: (error) => {
			toast.error(error.message || "Failed to create cms content");
		},
	});

	const contents = cmsData?.content || [];
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

	const columns: Column<CmsContent>[] = [
		{
			header: "Content title",
			accessor: (content) => (
				<span className="block max-w-[200px] truncate font-medium text-gray-900">
					{content.title}
				</span>
			),
			cellClassName: "text-sm",
		},
		{
			header: "Author Name",
			accessor: (content) => (
				<div className="flex items-center gap-3">
					{content.author.image ? (
						<img
							src={content.author.image}
							alt={content.author.name}
							className="h-8 w-8 rounded-full object-cover"
						/>
					) : (
						<div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-200 text-gray-600 text-xs font-medium">
							{content.author.name.charAt(0).toUpperCase()}
						</div>
					)}
					<span>{content.author.name}</span>
				</div>
			),
			cellClassName: "whitespace-nowrap text-gray-900 text-sm",
		},
		{
			header: "Type",
			accessor: (content) => getTypeLabel(content.type),
			cellClassName: "whitespace-nowrap text-gray-900 text-sm",
		},
		{
			header: "Date Uploaded",
			accessor: (content) =>
				content.dateUploaded
					? new Date(content.dateUploaded).toLocaleDateString()
					: "-",
			cellClassName: "whitespace-nowrap text-gray-900 text-sm",
		},
		{
			header: "Status",
			accessor: (content) => (
				<span
					className={`rounded-full px-2 py-1 font-medium text-xs ${
						content.status === "verified"
							? "bg-green-100 text-green-800"
							: "bg-yellow-100 text-yellow-800"
					}`}
				>
					{content.status}
				</span>
			),
			cellClassName: "whitespace-nowrap",
		},
	];

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<div>
					<h2 className="font-bold text-2xl text-gray-900">CMS Content</h2>
					<p className="text-gray-600">Manage all your cms content</p>
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
						onClick={() => setShowAddModal(true)}
						className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-accent px-4 py-2 font-medium text-white text-sm hover:bg-accent/90"
					>
						<IoMdCloud className="w-4 h-4"/>
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
						className="relative space-x-3"
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
						 <button className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-600 hover:bg-gray-50 cursor-pointer">
									  Time periods
									  <IoFilter className="h-3.5 w-3.5" />
									</button>
					</form>
				)}
			</div>

			<div className="relative">
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
						data={contents}
						columns={columns}
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

			{showAddModal && (
				<div
					className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
					onClick={() => setShowAddModal(false)}
				>
					<div
						className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl"
						onClick={(e) => e.stopPropagation()}
					>
						<div className="mb-4 flex items-center justify-between">
							<h3 className="font-bold text-xl text-gray-900">Add new content</h3>
							<button
								type="button"
								onClick={() => setShowAddModal(false)}
								className="text-gray-500 hover:text-gray-900"
							>
								<svg
									className="h-5 w-5"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d="M6 18L18 6M6 6l12 12"
									/>
								</svg>
							</button>
						</div>
						<form
							onSubmit={(e) => {
								e.preventDefault();
								createContentMutation.mutate(newContent);
							}}
							className="space-y-4"
						>
							<div>
								<label className="block font-medium text-gray-900 text-sm">
									Title
								</label>
								<input
									type="text"
									value={newContent.title}
									onChange={(e) =>
										setNewContent({
											...newContent,
											title: e.target.value,
										})
									}
									required
									className="mt-1 w-full rounded-md border border-gray-400 px-3 py-2 text-gray-900 shadow-sm focus:border-primary focus:outline-none focus:ring-primary"
								/>
							</div>
							<div>
								<label className="block font-medium text-gray-900 text-sm">
									Message
								</label>
								<textarea
									value={newContent.message}
									onChange={(e) =>
										setNewContent({
											...newContent,
											message: e.target.value,
										})
									}
									required
									rows={4}
									className="mt-1 w-full rounded-md border border-gray-400 px-3 py-2 text-gray-900 shadow-sm focus:border-primary focus:outline-none focus:ring-primary"
								/>
							</div>
							<div>
								<label className="block font-medium text-gray-900 text-sm">
									Content Type
								</label>
								<select
									value={newContent.contentType}
									onChange={(e) =>
										setNewContent({
											...newContent,
											contentType: e.target.value as
												| "news"
												| "videos"
												| "ads",
										})
									}
									required
									className="mt-1 w-full rounded-md border border-gray-400 px-3 py-2 text-gray-900 shadow-sm focus:border-primary focus:outline-none focus:ring-primary"
								>
									<option value="news">News</option>
									<option value="videos">Videos</option>
									<option value="ads">Ads</option>
								</select>
							</div>
							<div>
								<label className="block font-medium text-gray-900 text-sm">
									Author Name
								</label>
								<input
									type="text"
									value={newContent.authorName}
									onChange={(e) =>
										setNewContent({
											...newContent,
											authorName: e.target.value,
										})
									}
									required
									className="mt-1 w-full rounded-md border border-gray-400 px-3 py-2 text-gray-900 shadow-sm focus:border-primary focus:outline-none focus:ring-primary"
								/>
							</div>
							<div className="flex justify-end gap-3 pt-2">
								<button
									type="button"
									onClick={() => setShowAddModal(false)}
									className="rounded-md border border-gray-300 px-4 py-2 font-medium text-gray-900 hover:bg-gray-50"
								>
									Cancel
								</button>
								<button
									type="submit"
									disabled={createContentMutation.isPending}
									className="rounded-md bg-accent px-4 py-2 font-medium text-white hover:bg-accent/90 disabled:opacity-50"
								>
									{createContentMutation.isPending
										? "Adding..."
										: "Add content"}
								</button>
							</div>
						</form>
					</div>
				</div>
			)}
		</div>
	);
}