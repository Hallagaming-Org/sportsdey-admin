import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Eye, PauseCircle, Search, SendHorizonal, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { type Column, DataTable } from "#/components/DataTable";
import { SendNoticeModal } from "#/components/SendNoticeModal";
import {
	TimePeriodDropdown,
	type TimePeriodOption,
} from "#/components/TimePeriodDropdown";
import { notificationService } from "#/lib/notifications";
import { type KycStatusFilter, kycService } from "@/lib/kyc";
import FilterIcon from "@/logo/filter.svg?react";
import SortIcon from "@/logo/sort.svg?react";

export const Route = createFileRoute("/app/kyc")({
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

const TAB_OPTIONS = [
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

function KycPage() {
	const [activeTab, setActiveTab] = useState<KycTab>("all");
	const [search, setSearch] = useState("");
	const [page, setPage] = useState(1);
	const [sortAsc, setSortAsc] = useState(true);
	const [selectedTimePeriod, setSelectedTimePeriod] =
		useState<TimePeriodOption>("All");
	const [selectedRecord, setSelectedRecord] = useState<KycRecord | null>(null);
	const [showDocumentModal, setShowDocumentModal] = useState(false);
	const [noticeUser, setNoticeUser] = useState<{
		id: string;
		name: string;
		email?: string;
	} | null>(null);

	// time filter
	const [timeFilter, setTimeFilter] = useState<any>(null);

	const statusParam: KycStatusFilter | undefined = useMemo(() => {
		if (activeTab === "all") return undefined;
		return {
			verified: "approved",
			in_review: "pending_review",
			not_verified: "not_verified",
		}[activeTab];
	}, [activeTab]);

	const { data, isLoading, error } = useQuery({
		queryKey: ["kyc", page, search, statusParam, timeFilter],
		queryFn: async () => {
			const res = await kycService.listKyc({
				page,
				limit: ITEMS_PER_PAGE,
				search: search.trim() || undefined,
				status: statusParam,
				...timeFilter,
			});

			if (!res.success) throw new Error(res.error);
			return res.data;
		},
		staleTime: 30000,
		refetchOnWindowFocus: false,
	});

	const { data: documents, isLoading: docLoading } = useQuery({
		queryKey: ["kyc-docs", selectedRecord?.kycId],
		queryFn: async () => {
			if (!selectedRecord) return null;
			const res = await kycService.getKycDocuments(selectedRecord.kycId);
			if (!res.success) throw new Error(res.error);
			return res.data;
		},
		enabled: !!selectedRecord && showDocumentModal,
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
							`https://api.dicebear.com/7.x/avataaars/svg?seed=${r.playerName}`
						}
						className="h-6 w-6 rounded-full object-cover"
					/>
					<span className="truncate">{r.playerName}</span>
				</div>
			),
		},
		{
			header: "Form",
			accessor: "documentName",
		},
		{
			header: "Size",
			accessor: "size",
		},
		{
			header: "Date",
			accessor: "dateUploaded",
		},
		{
			header: "Type",
			accessor: "type",
		},
		{
			header: "Status",
			accessor: (r) => (
				<span
					className={`px-2 py-1 rounded-full text-xs ${STATUS_STYLES[r.status]}`}
				>
					{STATUS_LABELS[r.status]}
				</span>
			),
		},
	];

	return (
		<div className="flex h-[calc(100vh-120px)] flex-col gap-6 overflow-hidden px-6">
			{/* HEADER */}
			<div className="flex-none flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
				<div>
					<h2 className="text-2xl font-bold">KYC & Document Uploads</h2>
					<p className="text-gray-600">
						Manage all Documents and files Uploaded.
					</p>
				</div>

				<div className="flex items-center gap-3">
					<button
						onClick={() => setSortAsc((c) => !c)}
						className="flex items-center gap-2 border px-3 py-2 rounded-full"
					>
						<SortIcon className="h-3 w-3" />
						Sort
					</button>

					<button className="flex items-center gap-2 border px-3 py-2 rounded-full">
						<FilterIcon className="h-3 w-3" />
						Filter
					</button>
				</div>
			</div>
			{/* CONTENT */}
			<div className="flex-1 min-h-0 flex flex-col gap-4">
				{/* FILTER BAR */}
				<div className="flex-none flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
					{/* TABS */}
					<div className="flex gap-6 overflow-x-auto border-b">
						{TAB_OPTIONS.map((tab) => (
							<button
								key={tab.key}
								onClick={() => {
									setActiveTab(tab.key);
									setPage(1);
								}}
								className={`pb-2 ${
									activeTab === tab.key
										? "border-b-2 border-green-600 text-green-600"
										: "text-gray-500"
								}`}
							>
								{tab.label}
							</button>
						))}
					</div>

					{/* SEARCH + FILTER */}
					<div className="flex items-center gap-2 shrink-0">
						<div className="relative">
							<input
								value={search}
								onChange={(e) => {
									setSearch(e.target.value);
									setPage(1);
								}}
								placeholder="Search"
								className="w-64 pl-10 pr-4 py-2 border rounded-full"
							/>
							<Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
						</div>

						<TimePeriodDropdown
							value={selectedTimePeriod}
							onChange={(period, range) => {
								setSelectedTimePeriod(period);
								setTimeFilter({ period, range });
								setPage(1);
							}}
							buttonClassName="px-3 py-2 border rounded-lg text-sm"
							showCustomOption
						/>
					</div>
				</div>

				{/* TABLE */}
				<div className="flex-1 min-h-0 overflow-hidden bg-white rounded-lg shadow">
					{isLoading ? (
						<div className="flex items-center justify-center h-full">
							Loading...
						</div>
					) : error ? (
						<div className="text-red-500 p-4">{(error as Error).message}</div>
					) : (
						<DataTable
							data={sorted}
							columns={columns}
							maxHeight="100%"
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
									onClick: (r) => console.log(r),
								},
							]}
						/>
					)}
				</div>
			</div>

			{/* MODAL */}
			{showDocumentModal && (
				<div className="fixed inset-0 bg-black/60 flex items-center justify-center">
					<div className="relative w-[60%] h-[70%] bg-white rounded-lg p-4">
						<button
							onClick={() => setShowDocumentModal(false)}
							className="absolute top-2 right-2"
						>
							<X />
						</button>

						{docLoading ? (
							<div className="flex justify-center items-center h-full">
								Loading...
							</div>
						) : (
							<div className="grid grid-cols-2 gap-4 h-full">
								<iframe
									src={documents?.frontDocument?.url}
									className="w-full h-full"
								/>
								<iframe
									src={documents?.backDocument?.url}
									className="w-full h-full"
								/>
							</div>
						)}
					</div>
				</div>
			)}

			{/* Send Notice Modal */}
			{noticeUser && (
				<SendNoticeModal
					user={noticeUser}
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
