import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Eye, PauseCircle, Search, SendHorizonal, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { IoFilter } from "react-icons/io5";
import FilterIcon from "@/logo/filter.svg?react";
import SortIcon from "@/logo/sort.svg?react";
import { DataTable, type Column } from "#/components/DataTable";
import { kycService, type KycDocumentResponse, type KycStatusFilter } from "@/lib/kyc";

export const Route = createFileRoute("/app/kyc")({
	component: KycPage,
});

type DocumentType = "PDF" | "JPG" | "PNG" | "-";

type KycStatus = "verified" | "in_review" | "not_verified";

const STATUS_API_TO_UI: Record<string, KycStatus> = {
	approved: "verified",
	pending_review: "in_review",
	rejected: "not_verified",
	not_verified: "not_verified",
};

type KycTab = "all" | KycStatus;

type KycRecord = {
	sn: string;
	kycId: string;
	playerName: string;
	image: string | null;
	documentName: string;
	size: string;
	dateUploaded: string;
	type: DocumentType;
	status: KycStatus;
};

const TAB_OPTIONS: { key: KycTab; label: string }[] = [
	{ key: "all", label: "All Documents" },
	{ key: "verified", label: "Verified" },
	{ key: "in_review", label: "In review" },
	{ key: "not_verified", label: "Not Verified" },
];

const STATUS_LABELS: Record<KycStatus, string> = {
	verified: "Verified",
	in_review: "In Review",
	not_verified: "Not Verified",
};

const STATUS_STYLES: Record<KycStatus, string> = {
	verified: "bg-[#E8F8E5] text-[#10C300]",
	in_review: "bg-[#FFF8E5] text-[#FFB000]",
	not_verified: "bg-[#FEECEB] text-[#EE201C]",
};

const MIME_TO_EXTENSION: Record<string, string> = {
	"image/jpeg": "JPG",
	"image/png": "PNG",
	"application/pdf": "PDF",
};

const DOCUMENT_NAMES: Record<string, string> = {
	nin: "NIN",
	drivers_license: "Driver's License",
	passport: "International Passport",
	voters_card: "Voter's Card",
};

function getDocumentType(mimeType: string): DocumentType {
	const ext = MIME_TO_EXTENSION[mimeType];
	if (ext) return ext as DocumentType;
	if (mimeType.startsWith("image/")) {
		return mimeType.split("/")[1]?.toUpperCase() as DocumentType || "-";
	}
	return "-";
}

const ITEMS_PER_PAGE = 10;

function formatFileSize(bytes: number): string {
	if (bytes === 0) return "0 B";
	if (!bytes) return "-";
	const k = 1024;
	const sizes = ["B", "KB", "MB", "GB"];
	const i = Math.floor(Math.log(bytes) / Math.log(k));
	return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))}${sizes[i]}`;
}

function formatDate(dateString: string): string {
	const date = new Date(dateString);
	return date.toLocaleDateString("en-US", {
		month: "short",
		day: "numeric",
		year: "numeric",
	});
}

function KycPage() {
	const [activeTab, setActiveTab] = useState<KycTab>("all");
	const [search, setSearch] = useState("");
	const [page, setPage] = useState(1);
	const [sortAsc, setSortAsc] = useState(true);
	const [selectedRecord, setSelectedRecord] = useState<KycRecord | null>(null);
	const [showDocumentModal, setShowDocumentModal] = useState(false);

	const statusParam: KycStatusFilter | undefined = useMemo(() => {
		if (activeTab === "all") return undefined;
		const reverseMap: Record<KycStatus, KycStatusFilter> = {
			verified: "approved",
			in_review: "pending_review",
			not_verified: "not_verified",
		};
		return reverseMap[activeTab];
	}, [activeTab]);

	const {
		data: kycResponse,
		isLoading,
		error,
	} = useQuery({
		queryKey: ["kyc", page, search, statusParam],
		queryFn: async () => {
			const result = await kycService.listKyc({
				page,
				limit: ITEMS_PER_PAGE,
				search: search.trim() || undefined,
				status: statusParam,
			});

			if (!result.success) {
				throw new Error(result.error || "Failed to fetch KYC records");
			}

			return result.data;
		},
		staleTime: 30000,
		refetchOnWindowFocus: false,
	});

	const {
		data: documentData,
		isLoading: isLoadingDocuments,
	} = useQuery({
		queryKey: ["kyc-documents", selectedRecord?.kycId],
		queryFn: async () => {
			if (!selectedRecord) return null;
			const result = await kycService.getKycDocuments(selectedRecord.kycId);
			if (!result.success) {
				throw new Error(result.error || "Failed to fetch documents");
			}
			return result.data;
		},
		enabled: !!selectedRecord && showDocumentModal,
		staleTime: 60000,
	});

	const kycRecords = useMemo<KycRecord[]>(() => {
		if (!kycResponse?.records) return [];

		return kycResponse.records.map((record, index) => ({
			sn: String(index + 1 + (page - 1) * ITEMS_PER_PAGE).padStart(6, "0"),
			kycId: record.id,
			playerName: record.playername,
			image: record.image,
			documentName: DOCUMENT_NAMES[record.form_of_identification] || record.form_of_identification,
			size: `${formatFileSize(record.size.front)} / ${formatFileSize(record.size.back)}`,
			dateUploaded: formatDate(record.uploaded_at),
			type: getDocumentType(record.type.front || record.type.back || "-"),
			status: STATUS_API_TO_UI[record.status] || "not_verified",
		}));
	}, [kycResponse, page]);

	const filteredRecords = useMemo(() => {
		return [...kycRecords].sort((a, b) =>
			sortAsc ? a.sn.localeCompare(b.sn) : b.sn.localeCompare(a.sn),
		);
	}, [kycRecords, sortAsc]);

	const totalItems = kycResponse?.total ?? 0;
	const totalPages = Math.max(1, Math.ceil(totalItems / ITEMS_PER_PAGE));
	const paginatedRecords = filteredRecords;

	useEffect(() => {
		if (page > totalPages) {
			setPage(totalPages);
		}
	}, [page, totalPages]);

	const columns: Column<KycRecord>[] = [
		{
			header: "S/N",
			accessor: "sn",
			headerClassName: "w-[100px]",
			cellClassName: "font-medium text-gray-900",
		},
		{
			header: "Player Name",
			accessor: (record) => (
				<div className="flex items-center gap-2.5 min-w-0">
					{record.image ? (
						<img
							src={record.image}
							alt={record.playerName}
							className="h-6 w-6 rounded-full bg-gray-100 object-cover"
						/>
					) : (
						<img
							src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${record.playerName}`}
							alt={record.playerName}
							className="h-6 w-6 rounded-full bg-gray-100 object-cover"
						/>
					)}
					<span className="truncate font-medium text-gray-900" title={record.playerName}>
						{record.playerName}
					</span>
				</div>
			),
			headerClassName: "w-[240px]",
		},
		{
			header: "Form of Identification",
			accessor: "documentName",
			headerClassName: "w-[220px]",
			cellClassName: "text-gray-700",
		},
		{
			header: "Size",
			accessor: "size",
			headerClassName: "w-[110px]",
			cellClassName: "text-gray-700",
		},
		{
			header: "Date Uploaded",
			accessor: "dateUploaded",
			headerClassName: "w-[170px]",
			cellClassName: "text-gray-700",
		},
		{
			header: "Type",
			accessor: "type",
			headerClassName: "w-[110px]",
			cellClassName: "text-gray-700",
		},
		{
			header: "Status",
			accessor: (record) => (
				<span
					className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${STATUS_STYLES[record.status]}`}
				>
					{STATUS_LABELS[record.status]}
				</span>
			),
			headerClassName: "w-[150px]",
		},
	];

	return (
		<div className="flex h-[calc(100vh-120px)] flex-col gap-6 overflow-hidden px-6">
			<div className="flex-none flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
				<div>
					<h2 className="font-bold text-2xl text-gray-900">KYC & Document Uploads</h2>
					<p className="text-gray-600">Manage all Documents and files Uploaded.</p>
				</div>
				<div className="flex items-center gap-3">
					<button
						type="button"
						onClick={() => setSortAsc((current) => !current)}
						className="inline-flex cursor-pointer items-center gap-2 rounded-full border-2 border-[#053209] px-2 py-2 font-medium text-gray-900 text-sm hover:bg-gray-50"
					>
						<SortIcon className="h-3 w-3" />
						Sort
					</button>
					<button
						type="button"
						className="inline-flex cursor-pointer items-center gap-2 rounded-full border-2 border-[#053209] px-2 py-2 font-medium text-gray-900 text-sm hover:bg-gray-50"
					>
						<FilterIcon className="h-3 w-3" />
						Filter
					</button>
				</div>
			</div>

			<div className="flex-1 min-h-0 flex flex-col gap-4">
				<div className="flex-none flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
					<div className="flex gap-8 overflow-x-auto border-b border-gray-300 custom-scrollbar">
						{TAB_OPTIONS.map((tab) => (
							<button
								type="button"
								key={tab.key}
								onClick={() => {
									setActiveTab(tab.key);
									setPage(1);
								}}
								className={`cursor-pointer pb-3 font-medium text-sm whitespace-nowrap transition-colors ${
									activeTab === tab.key
										? "border-b-2 border-accent text-accent"
										: "text-gray-600 hover:text-gray-900"
								}`}
							>
								{tab.label}
							</button>
						))}
					</div>

					<div className="flex items-center gap-2">
						<div className="relative">
							<input
								type="text"
								placeholder="Search"
								value={search}
								onChange={(event) => {
									setSearch(event.target.value);
									setPage(1);
								}}
								className="w-64 rounded-full border border-gray-400 bg-gray-50 py-2 pr-4 pl-10 shadow-md focus:border-primary focus:outline-none focus:ring-primary"
							/>
							<Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-500" />
						</div>
						<button className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-600 hover:bg-gray-50 cursor-pointer">
							Time periods
							<IoFilter className="h-3.5 w-3.5" />
						</button>
					</div>
				</div>

				<div className="flex-1 min-h-0 relative overflow-hidden rounded-lg bg-white shadow-md">
					{isLoading ? (
						<div className="flex h-full items-center justify-center">
							<div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-accent" />
						</div>
					) : error ? (
						<div className="flex h-full items-center justify-center text-red-600">
							{error instanceof Error
								? error.message
								: "Failed to load KYC records"}
						</div>
					) : (
						<DataTable
							data={paginatedRecords}
							columns={columns}
							maxHeight="100%"
							actionMenuItems={[
								{
									label: "View document",
									icon: <Eye className="h-4 w-4" />,
									onClick: (record) => {
										setSelectedRecord(record);
										setShowDocumentModal(true);
									},
								},
								{
									label: "Send a notification",
									icon: <SendHorizonal className="h-4 w-4" />,
									onClick: (record) => console.log("Send notification to", record.sn),
								},
								{
									label: "Verify/Review/Declined",
									icon: <PauseCircle className="h-4 w-4" />,
									onClick: (record) => console.log("Review status for", record.sn),
								},
							]}
							emptyMessage="No document found"
							pagination={{
								currentPage: page,
								totalPages,
								onPageChange: setPage,
								totalItems,
								itemsPerPage: ITEMS_PER_PAGE,
							}}
						/>
					)}
				</div>
			</div>

			{showDocumentModal && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
					<div className="relative w-[60%] h-[70%] mx-4 overflow-hidden">
						<button
							type="button"
							onClick={() => {
								setShowDocumentModal(false);
								setSelectedRecord(null);
							}}
							className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white hover:bg-gray-200 cursor-pointer"
						>
							<X className="h-5 w-5 text-gray-700" />
						</button>

						<div className="h-full flex flex-col">
							{isLoadingDocuments ? (
								<div className="flex items-center justify-center h-full">
									<div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-accent" />
								</div>
							) : documentData ? (
								<div className="grid grid-cols-2 gap-4 h-full">
									<div className="h-full">
										<div className="border rounded-lg overflow-hidden bg-gray-50 h-full">
											{documentData.frontDocument ? (
												documentData.frontDocument.url.endsWith(".pdf") ? (
													<iframe
														src={documentData.frontDocument.url}
														className="w-full h-full"
														title="Front Document"
													/>
												) : (
													<img
														src={documentData.frontDocument.url}
														alt="Front Document"
														className="w-full h-full object-contain"
													/>
												)
											) : (
												<div className="flex items-center justify-center h-full text-gray-400">
													No document
												</div>
											)}
										</div>
									</div>
									<div className="h-full">
										<div className="border rounded-lg overflow-hidden bg-gray-50 h-full">
											{documentData.backDocument ? (
												documentData.backDocument.url.endsWith(".pdf") ? (
													<iframe
														src={documentData.backDocument.url}
														className="w-full h-full"
														title="Back Document"
													/>
												) : (
													<img
														src={documentData.backDocument.url}
														alt="Back Document"
														className="w-full h-full object-contain"
													/>
												)
											) : (
												<div className="flex items-center justify-center h-full text-gray-400">
													No document
												</div>
											)}
										</div>
									</div>
								</div>
							) : (
								<div className="text-center py-8 text-white">
									Failed to load documents
								</div>
							)}
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
