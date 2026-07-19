import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, redirect } from "@tanstack/react-router";
import {
	Eye,
	PauseCircle,
	Search,
	SendHorizonal,
	X,
	Copy,
	ExternalLink,
	ZoomIn,
	ZoomOut,
	RotateCw,
	Download,
	MoreHorizontal,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { type Column, DataTable } from "#/components/DataTable";
import { SendNoticeModal } from "#/components/SendNoticeModal";
import { TimePeriodFilter, type TimePeriod } from "#/components/TimePeriodFilter";
import { getDateRangeForPeriod } from "#/lib/time-period";
import { notificationService } from "#/lib/notifications";
import { type KycStatusFilter, kycService } from "@/lib/kyc";
import * as XLSX from "xlsx";
import { FaFileExport, FaFileExcel, FaFilePdf, FaFileWord } from "react-icons/fa6";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Document, Packer, Paragraph, Table, TableRow, TableCell, TextRun, WidthType } from "docx";

export const Route = createFileRoute("/app/kyc")({
	beforeLoad: ({ context }) => {
		const admin = (context as any).admin;
		if (admin && admin.role !== "super_admin" && !admin.permissions?.includes("view_kyc_document")) {
			throw redirect({ to: "/app", replace: true });
		}
	},
	component: KycPage,
});

type DocumentType = "PDF" | "JPG" | "PNG" | "-";
type KycStatus = "verified" | "in_review" | "not_verified";
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

const STATUS_API_TO_UI: Record<string, KycStatus> = {
	approved: "verified",
	pending_review: "in_review",
	rejected: "not_verified",
	not_verified: "not_verified",
};

const TAB_OPTIONS: { key: KycTab; label: string }[] = [
	{ key: "all", label: "All Documents" },
	{ key: "verified", label: "Verified" },
	{ key: "in_review", label: "In review" },
	{ key: "not_verified", label: "Not Verified" },
];

const STATUS_LABELS = {
	verified: "Verified",
	in_review: "In Review",
	not_verified: "Not Verified",
};

const STATUS_STYLES = {
	verified: "bg-[#E8F8E5] text-[#10C300]",
	in_review: "bg-[#FFF8E5] text-[#FFB000]",
	not_verified: "bg-[#FEECEB] text-[#EE201C]",
};

const MIME_TO_EXTENSION: Record<string, DocumentType> = {
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

const ITEMS_PER_PAGE = 10;

function getDocumentType(mime: string): DocumentType {
	if (!mime) return "-";
	return MIME_TO_EXTENSION[mime] || "-";
}

function formatFileSize(bytes: number) {
	if (!bytes) return "-";
	const sizes = ["B", "KB", "MB", "GB"];
	const i = Math.floor(Math.log(bytes) / Math.log(1024));
	return `${(bytes / 1024 ** i).toFixed(1)}${sizes[i]}`;
}

function formatDate(date: string) {
	return new Date(date).toLocaleDateString("en-US", {
		month: "short",
		day: "numeric",
		year: "numeric",
	});
}

function isImageMime(mime: string | null | undefined) {
	return mime?.startsWith("image/") ?? false;
}

// function DocumentViewer({ doc }: { doc: { url: string; mimeType: string } }) {
// 	const isImage = isImageMime(doc.mimeType);

// 	if (isImage) {
// 		return (
// 			<img
// 				src={doc.url}
// 				alt="Document"
// 				className="w-full h-full object-contain"
// 			/>
// 		);
// 	}

// 	return (
// 		<embed src={doc.url} type={doc.mimeType} className="w-full h-full" />
// 	);
// }

function KycPage() {
	const [activeTab, setActiveTab] = useState<KycTab>("all");
	const [search, setSearch] = useState("");
	const [page, setPage] = useState(1);
	const [sortAsc] = useState(true);
	const [selectedTimePeriod, setSelectedTimePeriod] = useState<TimePeriod>("All");
	const [customRange, setCustomRange] = useState<{ start: string; end: string } | undefined>(undefined);
	const [showExportDropdown, setShowExportDropdown] = useState(false);
	const [selectedRecord, setSelectedRecord] = useState<KycRecord | null>(null);
	const [showDocumentModal, setShowDocumentModal] = useState(false);
	const [activeSide, setActiveSide] = useState<"front" | "back">("front");
	const [scale, setScale] = useState(1);
	const [rotation, setRotation] = useState(0);
	const [isRejecting, setIsRejecting] = useState(false);
	const [rejectReason, setRejectReason] = useState("");
	const [noticeUser, setNoticeUser] = useState<{
		id: string;
		name: string;
		email?: string;
	} | null>(null);

	const { fromDate, toDate } = useMemo(
		() => getDateRangeForPeriod(selectedTimePeriod, customRange),
		[selectedTimePeriod, customRange],
	);

	const statusParam: KycStatusFilter | undefined = useMemo(() => {
		if (activeTab === "all") return undefined;
		return {
			verified: "approved",
			in_review: "pending_review",
			not_verified: "not_verified",
		}[activeTab] as KycStatusFilter;
	}, [activeTab]);

	const { data, isLoading, error } = useQuery({
		queryKey: ["kyc", page, search, statusParam, fromDate, toDate],
		queryFn: async () => {
			const res = await kycService.listKyc({
				page,
				limit: ITEMS_PER_PAGE,
				search: search.trim() || undefined,
				status: statusParam,
				fromDate,
				toDate,
			});

			if (!res.success) throw new Error(res.error);
			return res.data;
		},
		staleTime: 30000,
		refetchOnWindowFocus: false,
	});

	const {
		data: documents,
		isLoading: docLoading,
		isError: docError,
		error: docErrorObj,
	} = useQuery({
		queryKey: ["kyc-docs", selectedRecord?.kycId],
		queryFn: async () => {
			if (!selectedRecord) return null;
			const res = await kycService.getKycDocuments(selectedRecord.kycId);
			if (!res.success) throw new Error(res.error);
			return res.data;
		},
		enabled: !!selectedRecord && showDocumentModal,
	});

	const activeDoc = documents?.[activeSide === "front" ? "frontDocument" : "backDocument"];

	const queryClient = useQueryClient();

	const approveMutation = useMutation({
		mutationFn: async (kycId: string) => {
			const res = await kycService.approveKyc(kycId);
			if (!res.success) throw new Error(res.error);
			return res.data;
		},
		onSuccess: () => {
			toast.success("KYC approved successfully");
			queryClient.invalidateQueries({ queryKey: ["kyc"] });
		},
		onError: (err) => {
			toast.error((err as Error).message || "Failed to approve KYC");
		},
	});

	const rejectMutation = useMutation({
		mutationFn: async ({ kycId, reason }: { kycId: string; reason: string }) => {
			const res = await kycService.rejectKyc(kycId, reason);
			if (!res.success) throw new Error(res.error);
			return res.data;
		},
		onSuccess: () => {
			toast.success("KYC rejected");
			setRejectReason("");
			queryClient.invalidateQueries({ queryKey: ["kyc"] });
		},
		onError: (err) => {
			toast.error((err as Error).message || "Failed to reject KYC");
		},
	});

	const reviewMutation = useMutation({
		mutationFn: async (kycId: string) => {
			const res = await kycService.markAsInReview(kycId);
			if (!res.success) throw new Error(res.error);
			return res.data;
		},
		onSuccess: () => {
			toast.success("Document marked as in review");
			queryClient.invalidateQueries({ queryKey: ["kyc"] });
		},
		onError: (err) => {
			toast.error((err as Error).message || "Failed to mark as in review");
		},
	});

	const records = useMemo<KycRecord[]>(() => {
		if (!data?.records) return [];

		return data.records.map((r, i) => ({
			sn: String(i + 1 + (page - 1) * ITEMS_PER_PAGE).padStart(6, "0"),
			kycId: r.id,
			playerName: r.playername,
			image: r.image,
			documentName:
				DOCUMENT_NAMES[r.form_of_identification] || r.form_of_identification,
			size: `${formatFileSize(r.size.front)} / ${formatFileSize(r.size.back)}`,
			dateUploaded: formatDate(r.uploaded_at),
			type: getDocumentType(r.type.front || r.type.back),
			status: STATUS_API_TO_UI[r.status] || "not_verified",
		}));
	}, [data, page]);

	const sorted = useMemo(() => {
		return [...records].sort((a, b) =>
			sortAsc ? a.sn.localeCompare(b.sn) : b.sn.localeCompare(a.sn),
		);
	}, [records, sortAsc]);

	const exportToPdf = () => {
		if (sorted.length === 0) return;
		const doc = new jsPDF("landscape");
		doc.text("KYC Documents Report", 14, 15);
		autoTable(doc, {
			head: [["S/N", "Player Name", "Document Name", "Size", "Date Uploaded", "Document Type", "Status"]],
			body: sorted.map((r) => [
				r.sn,
				r.playerName,
				r.documentName,
				r.size,
				r.dateUploaded,
				r.type,
				STATUS_LABELS[r.status] || r.status,
			]),
			startY: 20,
		});
		doc.save(`kyc_documents_${new Date().toISOString().split("T")[0]}.pdf`);
	};

	const exportToDocx = () => {
		if (sorted.length === 0) return;
		const docx = new Document({
			sections: [
				{
					properties: {},
					children: [
						new Paragraph({
							children: [
								new TextRun({
									text: "KYC Documents Report",
									bold: true,
									size: 32,
								}),
							],
							spacing: { after: 400 },
						}),
						new Table({
							width: { size: 100, type: WidthType.PERCENTAGE },
							rows: [
								new TableRow({
									children: [
										"S/N",
										"Player Name",
										"Document Name",
										"Size",
										"Date Uploaded",
										"Document Type",
										"Status",
									].map(
										(header) =>
											new TableCell({
												children: [
													new Paragraph({
														children: [new TextRun({ text: header, bold: true })],
													}),
												],
												shading: { fill: "f3f4f6" },
												margins: { top: 100, bottom: 100, left: 100, right: 100 },
											}),
									),
								}),
								...sorted.map(
									(r) =>
										new TableRow({
											children: [
												r.sn,
												r.playerName,
												r.documentName,
												r.size,
												r.dateUploaded,
												r.type,
												STATUS_LABELS[r.status] || r.status,
											].map(
												(cell) =>
													new TableCell({
														children: [new Paragraph(String(cell))],
														margins: { top: 100, bottom: 100, left: 100, right: 100 },
													}),
											),
										}),
								),
							],
						}),
					],
				},
			],
		});

		Packer.toBlob(docx).then((blob) => {
			const link = document.createElement("a");
			const url = URL.createObjectURL(blob);
			link.setAttribute("href", url);
			link.setAttribute("download", `kyc_documents_${new Date().toISOString().split("T")[0]}.docx`);
			link.style.visibility = "hidden";
			document.body.appendChild(link);
			link.click();
			document.body.removeChild(link);
		});
	};

	const exportToExcel = () => {
		if (sorted.length === 0) return;
		const dataToExport = sorted.map((r) => ({
			"S/N": r.sn,
			"Player Name": r.playerName,
			"Document Name": r.documentName,
			Size: r.size,
			"Date Uploaded": r.dateUploaded,
			"Document Type": r.type,
			Status: STATUS_LABELS[r.status] || r.status,
		}));

		const worksheet = XLSX.utils.json_to_sheet(dataToExport);
		const workbook = XLSX.utils.book_new();
		XLSX.utils.book_append_sheet(workbook, worksheet, "KYC Documents");
		XLSX.writeFile(workbook, `kyc_documents_${new Date().toISOString().split("T")[0]}.xlsx`);
	};

	const totalPages = Math.max(
		1,
		Math.ceil((data?.total || 0) / ITEMS_PER_PAGE),
	);

	useEffect(() => {
		if (page > totalPages) setPage(totalPages);
	}, [page, totalPages]);

	const columns: Column<KycRecord>[] = [
		{
			header: "S/N",
			accessor: "sn",
			headerClassName: "w-[100px]",
		},
		{
			header: "Player Name",
			accessor: (r) => (
				<div className="flex items-center gap-2 min-w-0">
					<img
						src={
							r.image ||
							"https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80"
						}
						alt={r.playerName}
						className="w-8 h-8 rounded-full object-cover shrink-0"
					/>
					<span className="truncate">{r.playerName}</span>
				</div>
			),
		},
		{
			header: "Document Name",
			accessor: "documentName",
		},
		{
			header: "Size",
			accessor: "size",
		},
		{
			header: "Date Uploaded",
			accessor: "dateUploaded",
		},
		{
			header: "Document Type",
			accessor: "type",
		},
		{
			header: "Status",
			accessor: (r) => (
				<span
					className={`px-3 py-1 text-xs font-semibold rounded-full ${
						STATUS_STYLES[r.status]
					}`}
				>
					{STATUS_LABELS[r.status]}
				</span>
			),
		},
	];

	return (
		<div className="flex h-[calc(100vh-120px)] flex-col gap-6 overflow-hidden px-6">
			<div className="flex-1 min-h-0 flex flex-col gap-4">
				<div className="relative z-30 flex-none flex items-center justify-between overflow-visible">
					<div>
						<h3 className="font-bold text-xl text-[#03002B]">KYC & Document Uploads</h3>
						<p className="text-sm text-[#001A26]">Manage all Documents and files Uploaded.</p>
					</div>

					<div className="relative z-40 flex items-center gap-2">
						<form
							onSubmit={(e) => {
								e.preventDefault();
								setPage(1);
							}}
							className="relative"
						>
							<input
								type="text"
								placeholder="Search"
								value={search}
								onChange={(e) => {
									setSearch(e.target.value);
									setPage(1);
								}}
								className="w-64 rounded-full border border-gray-200 bg-gray-50 py-2 pr-4 pl-10 text-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
							/>
							<Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
						</form>


						<TimePeriodFilter
							onFilterChange={(period, range) => {
								setSelectedTimePeriod(period);
								setCustomRange(range);
								setPage(1);
							}}
							buttonClassName="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-600 hover:bg-gray-50 cursor-pointer whitespace-nowrap"
						/>

						{sorted.length > 0 && (
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
									className="inline-flex items-center h-11 gap-1.5 rounded-full bg-[#1BAA04] px-4 py-2 text-sm font-medium text-white cursor-pointer hover:bg-[#158903] transition-colors"
								>
									Export File as
									<FaFileExport className="h-3.5 w-3.5 text-white" />
								</button>

								{showExportDropdown && (
									<div className="absolute right-0 z-[70] mt-2 w-40 rounded-xl border border-gray-200 bg-white p-1 shadow-lg overflow-hidden">
										<button
											type="button"
											onClick={(e) => {
												e.stopPropagation();
												setShowExportDropdown(false);
												exportToPdf();
											}}
											className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
										>
											<FaFilePdf className="text-red-500 w-4 h-4" />
											PDF
										</button>
										<button
											type="button"
											onClick={(e) => {
												e.stopPropagation();
												setShowExportDropdown(false);
												exportToDocx();
											}}
											className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
										>
											<FaFileWord className="text-blue-600 w-4 h-4" />
											DOCX
										</button>
										<button
											type="button"
											onClick={(e) => {
												e.stopPropagation();
												setShowExportDropdown(false);
												exportToExcel();
											}}
											className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
										>
											<FaFileExcel className="text-green-600 w-4 h-4" />
											Excel
										</button>
									</div>
								)}
							</div>
						)}
					</div>
				</div>

				{/* TABS */}
				<div className="flex shrink-0 items-center justify-between border-b border-gray-200">
					<div className="flex gap-8">
						{TAB_OPTIONS.map((tab) => (
							<button
								key={tab.key}
								type="button"
								onClick={() => {
									setActiveTab(tab.key);
									setPage(1);
								}}
								className={`pb-3 text-sm font-medium transition-colors cursor-pointer ${
									activeTab === tab.key
										? "border-b-2 border-[#1BAA04] text-[#1BAA04]"
										: "text-gray-500 hover:text-gray-700"
								}`}
							>
								{tab.label}
							</button>
						))}
					</div>
				</div>

				{/* TABLE */}
				<div className="flex-1 min-h-0">
					<DataTable
						data={sorted}
						columns={columns}
						maxHeight="100%"
						isLoading={isLoading}
						emptyMessage={error ? (error as Error).message : "No KYC documents found"}
						pagination={{
							currentPage: page,
							totalPages,
							onPageChange: setPage,
							totalItems: data?.total || 0,
							itemsPerPage: ITEMS_PER_PAGE,
						}}
						actionMenuItems={[
							{
								label: "View document",
								icon: <Eye className="h-4 w-4" />,
								onClick: (r) => {
									setSelectedRecord(r);
									setActiveSide("front");
									setScale(1);
									setRotation(0);
									setIsRejecting(false);
									setRejectReason("");
									setShowDocumentModal(true);
								},
							},
							{
								label: "Notify",
								icon: <SendHorizonal className="h-4 w-4" />,
								onClick: (r) =>
									setNoticeUser({ id: r.kycId, name: r.playerName }),
							},
							{
								label: "Review",
								icon: <PauseCircle className="h-4 w-4" />,
								onClick: (r) => {
									setSelectedRecord(r);
									setActiveSide("front");
									setScale(1);
									setRotation(0);
									setIsRejecting(false);
									setRejectReason("");
									setShowDocumentModal(true);
								},
							},
						]}
					/>
				</div>
			</div>

			{/* Document Viewer Modal */}
			{showDocumentModal && selectedRecord && (
				<div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 sm:p-6 overflow-y-auto">
					<div className="relative w-full max-w-4xl bg-[#F8F9FA] rounded-[32px] p-6 sm:p-8 flex flex-col shadow-2xl my-8 max-h-[95vh] overflow-y-auto custom-scrollbar">
						{/* HEADER */}
						<div className="flex items-center justify-between mb-6">
							<div className="flex items-center gap-3">
								<div className="h-10 w-10 rounded-full bg-[#E8F8E5] flex items-center justify-center text-[#10C300]">
									<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/></svg>
								</div>
								<h3 className="text-xl font-bold text-[#0B0D17]">
									Activity Log Details
								</h3>
							</div>
							<button
								onClick={() => {
									setShowDocumentModal(false);
									setIsRejecting(false);
									setRejectReason("");
								}}
								className="h-8 w-8 rounded-full bg-[#0B0D17] text-white flex items-center justify-center hover:bg-opacity-80 transition-all cursor-pointer"
							>
								<X className="h-4 w-4" />
							</button>
						</div>

						{/* BODY */}
						<div className="flex flex-col gap-6">
							{/* CARD 1: DOCUMENT OVERVIEW */}
							<div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
								<h4 className="text-lg font-bold text-[#0B0D17] mb-4">
									Document Overview
								</h4>
								<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-4 gap-x-6 text-sm">
									<div className="flex justify-between md:flex-col md:gap-1 border-b md:border-none pb-2 md:pb-0">
										<span className="text-gray-400 font-medium">Document ID:</span>
										<span className="flex items-center gap-1.5 font-semibold text-[#0B0D17]">
											{selectedRecord.kycId}
											<button
												onClick={() => {
													navigator.clipboard.writeText(selectedRecord.kycId);
													toast.success("Document ID copied to clipboard");
												}}
												className="text-[#10C300] hover:scale-110 active:scale-95 transition-all p-1 cursor-pointer"
												title="Copy Document ID"
											>
												<Copy className="h-3.5 w-3.5" />
											</button>
										</span>
									</div>

									<div className="flex justify-between md:flex-col md:gap-1 border-b md:border-none pb-2 md:pb-0">
										<span className="text-gray-400 font-medium">Player Name:</span>
										<span className="flex items-center gap-2 font-semibold text-[#0B0D17]">
											<img
												src={
													selectedRecord.image ||
													`https://api.dicebear.com/7.x/avataaars/svg?seed=${selectedRecord.playerName}`
												}
												className="h-5 w-5 rounded-full object-cover"
											/>
											<span className="truncate">{selectedRecord.playerName}</span>
											<span className="text-[#7A8699] text-xs font-normal underline cursor-pointer hover:text-green-600 transition-colors">
												(ID {selectedRecord.kycId.slice(0, 6)})
											</span>
										</span>
									</div>

									<div className="flex justify-between md:flex-col md:gap-1 border-b md:border-none pb-2 md:pb-0">
										<span className="text-gray-400 font-medium">Form of Identification:</span>
										<span className="font-semibold text-[#0B0D17]">{selectedRecord.documentName}</span>
									</div>

									<div className="flex justify-between md:flex-col md:gap-1 border-b md:border-none pb-2 md:pb-0">
										<span className="text-gray-400 font-medium">Verification Number:</span>
										<span className="font-semibold text-[#0B0D17]">
											{selectedRecord.status === "verified" ? "Approved Document" : "Pending Verification"}
										</span>
									</div>

									<div className="flex justify-between md:flex-col md:gap-1 border-b md:border-none pb-2 md:pb-0">
										<span className="text-gray-400 font-medium">Document Type:</span>
										<span className="font-semibold text-[#0B0D17]">KYC & Documents</span>
									</div>

									<div className="flex justify-between md:flex-col md:gap-1 border-b md:border-none pb-2 md:pb-0">
										<span className="text-gray-400 font-medium">File Size:</span>
										<span className="font-semibold text-[#0B0D17]">{selectedRecord.size}</span>
									</div>

									<div className="flex justify-between md:flex-col md:gap-1 border-b md:border-none pb-2 md:pb-0">
										<span className="text-gray-400 font-medium">Date Uploaded:</span>
										<span className="font-semibold text-[#0B0D17]">{selectedRecord.dateUploaded}</span>
									</div>

									<div className="flex justify-between md:flex-col md:gap-1 border-b md:border-none pb-2 md:pb-0">
										<span className="text-gray-400 font-medium">Status:</span>
										<span
											className={`px-3 py-0.5 rounded-full text-xs font-semibold w-fit border ${
												selectedRecord.status === "verified"
													? "bg-[#EAF9E8] text-[#10C300] border-[#CFF0CA]"
													: selectedRecord.status === "in_review"
														? "bg-[#FFF9EA] text-[#FFB000] border-[#FFEFC5]"
														: "bg-[#FEECEB] text-[#EE201C] border-[#FCD8D6]"
											}`}
										>
											{STATUS_LABELS[selectedRecord.status]}
										</span>
									</div>

									<div className="flex justify-between md:flex-col md:gap-1 border-b md:border-none pb-2 md:pb-0">
										<span className="text-gray-400 font-medium">Reviewed By:</span>
										<span className="flex items-center gap-2 font-semibold text-[#0B0D17]">
											{selectedRecord.status === "verified" ? (
												<>
													<img
														src={`https://api.dicebear.com/7.x/avataaars/svg?seed=George`}
														className="h-5 w-5 rounded-full object-cover"
													/>
													<span>George jones</span>
												</>
											) : (
												<span>-</span>
											)}
										</span>
									</div>

									<div className="flex justify-between md:flex-col md:gap-1 pb-2 md:pb-0">
										<span className="text-gray-400 font-medium">Reviewed On:</span>
										<span className="font-semibold text-[#0B0D17]">
											{selectedRecord.status === "verified" ? selectedRecord.dateUploaded : "-"}
										</span>
									</div>
								</div>
							</div>

							{/* COLUMNS SECTION */}
							<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
								{/* COLUMN 1: DOCUMENT PREVIEW */}
								<div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
									<div>
										<div className="flex items-center justify-between mb-4">
											<h4 className="text-lg font-bold text-[#0B0D17]">
												Document Preview
											</h4>

											{/* Front / Back selection toggle */}
											{documents?.backDocument && (
												<div className="flex gap-1.5 bg-gray-100 p-1 rounded-full border border-gray-200">
													<button
														onClick={() => {
															setActiveSide("front");
															setScale(1);
															setRotation(0);
														}}
														className={`px-3 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer ${
															activeSide === "front"
																? "bg-white text-[#0B0D17] shadow-sm"
																: "text-gray-500 hover:text-gray-800"
														}`}
													>
														Front
													</button>
													<button
														onClick={() => {
															setActiveSide("back");
															setScale(1);
															setRotation(0);
														}}
														className={`px-3 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer ${
															activeSide === "back"
																? "bg-white text-[#0B0D17] shadow-sm"
																: "text-gray-500 hover:text-gray-800"
														}`}
													>
														Back
													</button>
												</div>
											)}
										</div>

										{docLoading ? (
											<div className="h-[280px] bg-gray-50 rounded-2xl flex items-center justify-center text-gray-500">
												Loading documents...
											</div>
										) : docError ? (
											<div className="h-[280px] bg-gray-50 rounded-2xl flex items-center justify-center text-red-500 p-4 text-center text-sm">
												{(docErrorObj as Error)?.message || "Failed to load documents"}
											</div>
										) : activeDoc ? (
											<div className="flex gap-4 items-center">
												<div className="flex-1 relative h-[280px] bg-gray-50 rounded-2xl overflow-hidden flex items-center justify-center border border-gray-100">
													{isImageMime(activeDoc.mimeType) ? (
														<img
															src={activeDoc.url}
															alt={`${activeSide} Side Document`}
															style={{
																transform: `scale(${scale}) rotate(${rotation}deg)`,
																transition: "transform 0.2s ease-in-out",
															}}
															className="max-h-full max-w-full object-contain"
														/>
													) : (
														<embed
															src={activeDoc.url}
															type={activeDoc.mimeType}
															className="w-full h-full"
														/>
													)}
												</div>

												{/* FLOATING ACTION ICONS */}
												<div className="flex flex-col gap-3.5">
													<button
														onClick={() => setScale((s) => Math.min(3, s + 0.2))}
														className="h-10 w-10 rounded-full border border-gray-200 hover:border-gray-300 flex items-center justify-center text-gray-500 hover:text-[#0B0D17] hover:bg-gray-50 transition-all cursor-pointer shadow-sm bg-white"
														title="Zoom In"
													>
														<ZoomIn className="h-5 w-5" />
													</button>
													<button
														onClick={() => setScale((s) => Math.max(0.5, s - 0.2))}
														className="h-10 w-10 rounded-full border border-gray-200 hover:border-gray-300 flex items-center justify-center text-gray-500 hover:text-[#0B0D17] hover:bg-gray-50 transition-all cursor-pointer shadow-sm bg-white"
														title="Zoom Out"
													>
														<ZoomOut className="h-5 w-5" />
													</button>
													<button
														onClick={() => setRotation((r) => (r + 90) % 360)}
														className="h-10 w-10 rounded-full border border-gray-200 hover:border-gray-300 flex items-center justify-center text-gray-500 hover:text-[#0B0D17] hover:bg-gray-50 transition-all cursor-pointer shadow-sm bg-white"
														title="Rotate"
													>
														<RotateCw className="h-5 w-5" />
													</button>
													<button
														onClick={async () => {
															if (!activeDoc) return;
															try {
																const response = await fetch(activeDoc.url);
																const blob = await response.blob();
																const url = window.URL.createObjectURL(blob);
																const link = document.createElement("a");
																link.href = url;
																link.download = `${selectedRecord.playerName}_${activeSide}_document`;
																document.body.appendChild(link);
																link.click();
																document.body.removeChild(link);
																window.URL.revokeObjectURL(url);
															} catch {
																window.open(activeDoc.url, "_blank");
															}
														}}
														className="h-10 w-10 rounded-full border border-gray-200 hover:border-gray-300 flex items-center justify-center text-gray-500 hover:text-[#0B0D17] hover:bg-gray-50 transition-all cursor-pointer shadow-sm bg-white"
														title="Download"
													>
														<Download className="h-5 w-5" />
													</button>
												</div>
											</div>
										) : (
											<div className="h-[280px] bg-gray-50 rounded-2xl flex items-center justify-center text-gray-400">
												No document uploaded
											</div>
										)}
									</div>

									{activeDoc && (
										<button
											onClick={() => window.open(activeDoc.url, "_blank")}
											className="mt-6 w-full py-3 bg-white border border-gray-200 hover:bg-gray-50 hover:border-gray-300 rounded-full text-sm font-semibold text-[#0B0D17] transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm"
										>
											Open in new tab
											<ExternalLink className="h-4 w-4" />
										</button>
									)}
								</div>

								{/* COLUMN 2: ADDITIONAL INFORMATION */}
								<div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
									<div>
										<div className="flex items-center justify-between mb-6">
											<h4 className="text-lg font-bold text-[#0B0D17]">
												Additional Information
											</h4>
											<button className="text-gray-400 hover:text-gray-600 transition-colors p-1 cursor-pointer">
												<MoreHorizontal className="h-5 w-5" />
											</button>
										</div>

										<div className="flex flex-col gap-4 text-sm">
											<div className="flex justify-between items-center py-2 border-b border-gray-50">
												<span className="text-gray-500 font-medium">Device Used:</span>
												<span className="text-[#0B0D17] font-semibold">Chrome on Windows</span>
											</div>
											<div className="flex justify-between items-center py-2 border-b border-gray-50">
												<span className="text-gray-500 font-medium">IP Address:</span>
												<span className="text-[#0B0D17] font-semibold">102.88.12.34</span>
											</div>
											<div className="flex justify-between items-center py-2 border-b border-gray-50">
												<span className="text-gray-500 font-medium">Location:</span>
												<span className="text-[#0B0D17] font-semibold">Lagos, Nigeria</span>
											</div>
											<div className="flex justify-between items-center py-2 border-b border-gray-50">
												<span className="text-gray-500 font-medium">Reference ID:</span>
												<span className="text-[#0B0D17] font-semibold">REF-2025-0006789</span>
											</div>
											<div className="flex justify-between items-center py-2">
												<span className="text-gray-500 font-medium">Notes:</span>
												<span className="text-[#0B0D17] font-semibold">Clear and Valid Document</span>
											</div>
										</div>
									</div>
								</div>
							</div>

							{/* FOOTER ACTIONS */}
							{isRejecting ? (
								<div className="mt-4 p-6 bg-[#FFF0F0] border border-[#FFD8D8] rounded-2xl flex flex-col gap-4">
									<div>
										<label className="block text-sm font-semibold text-gray-700 mb-2">
											Rejection Reason
										</label>
										<textarea
											value={rejectReason}
											onChange={(e) => setRejectReason(e.target.value)}
											placeholder="Enter reason for rejection..."
											className="w-full border border-gray-200 rounded-xl px-4 py-3 min-h-[100px] resize-none focus:outline-none focus:ring-2 focus:ring-red-500 bg-white text-sm"
										/>
									</div>
									<div className="flex gap-4">
										<button
											onClick={() => {
												setIsRejecting(false);
												setRejectReason("");
											}}
											className="w-1/2 py-3 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-semibold rounded-full transition-all cursor-pointer text-center text-sm shadow-sm"
										>
											Cancel
										</button>
										<button
											onClick={() => {
												if (!rejectReason.trim()) {
													toast.error("Please enter a rejection reason");
													return;
												}
												rejectMutation.mutate({
													kycId: selectedRecord.kycId,
													reason: rejectReason.trim(),
												});
												setShowDocumentModal(false);
												setIsRejecting(false);
												setRejectReason("");
											}}
											disabled={rejectMutation.isPending}
											className="w-1/2 py-3 bg-[#EE201C] hover:bg-[#D31C18] text-white font-semibold rounded-full transition-all cursor-pointer text-center text-sm disabled:opacity-50"
										>
											{rejectMutation.isPending ? "Declining..." : "Confirm Decline"}
										</button>
									</div>
								</div>
							) : (
								<div className="mt-4 flex flex-col gap-3">
									<button
								onClick={() => {
										reviewMutation.mutate(selectedRecord.kycId);
										setShowDocumentModal(false);
									}}
									disabled={reviewMutation.isPending}
									className="w-full py-2.5 bg-[#E9ECEF] hover:bg-[#DEE2E6] text-[#495057] font-semibold rounded-full text-sm transition-colors cursor-pointer text-center disabled:opacity-50"
								>
									{reviewMutation.isPending ? "Marking..." : "Mark as in Review"}
									</button>
									<div className="flex gap-4">
										<button
											onClick={() => setIsRejecting(true)}
											className="w-1/2 py-2.5 bg-[#FEECEB] hover:bg-[#FCD8D6] text-[#EE201C] font-semibold rounded-full text-sm transition-colors cursor-pointer text-center"
										>
											Decline Document
										</button>
										<button
											onClick={() => {
												approveMutation.mutate(selectedRecord.kycId);
												setShowDocumentModal(false);
											}}
											disabled={approveMutation.isPending}
											className="w-1/2 py-2.5 bg-[#10C300] hover:bg-[#0EB000] text-white font-semibold rounded-full text-sm transition-colors cursor-pointer text-center disabled:opacity-50"
										>
											{approveMutation.isPending ? "Verifying..." : "Verify Document"}
										</button>
									</div>
								</div>
							)}
						</div>
					</div>
				</div>
			)}

			{/* Send Notice Modal */}
			{noticeUser && (
				<SendNoticeModal
					user={noticeUser as unknown as import("../../lib/users").User}
					onClose={() => setNoticeUser(null)}
					onSubmit={async (data) => {
						const result = await notificationService.sendNotification({
							title: data.title,
							message: data.message,
							userId: noticeUser.id,
						});
						if (result.success) {
							toast.success(`Notice sent to ${noticeUser.name}`);
						} else {
							toast.error(result.error || "Failed to send notice");
						}
					}}
				/>
			)}
		</div>
	);
}
