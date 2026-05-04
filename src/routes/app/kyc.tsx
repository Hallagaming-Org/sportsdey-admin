import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Eye, PauseCircle, Search, SendHorizonal, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import FilterIcon from "@/logo/filter.svg?react";
import SortIcon from "@/logo/sort.svg?react";
import { DataTable, type Column } from "#/components/DataTable";
import { TimePeriodFilter } from "@/components/TimePeriodFilter";
import {
  kycService,
  type KycStatusFilter,
} from "@/lib/kyc";

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
  return MIME_TO_EXTENSION[mime] || "-";
}

function formatFileSize(bytes: number) {
  if (!bytes) return "-";
  const sizes = ["B", "KB", "MB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)}${sizes[i]}`;
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
  const [selectedRecord, setSelectedRecord] = useState<KycRecord | null>(null);
  const [showDocumentModal, setShowDocumentModal] = useState(false);

  // NEW: time filter
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
        search: search || undefined,
        status: statusParam,
        // 👇 pass time filter if backend supports it
        ...timeFilter,
      });

      if (!res.success) throw new Error(res.error);
      return res.data;
    },
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
      sn: String(i + 1 + (page - 1) * ITEMS_PER_PAGE),
      kycId: r.id,
      playerName: r.playername,
      image: r.image,
      documentName: DOCUMENT_NAMES[r.form_of_identification] || r.form_of_identification,
      size: `${formatFileSize(r.size.front)} / ${formatFileSize(r.size.back)}`,
      dateUploaded: formatDate(r.uploaded_at),
      type: getDocumentType(r.type.front || r.type.back),
      status: STATUS_API_TO_UI[r.status] || "not_verified",
    }));
  }, [data, page]);

  const sorted = useMemo(() => {
    return [...records].sort((a, b) =>
      sortAsc ? a.sn.localeCompare(b.sn) : b.sn.localeCompare(a.sn)
    );
  }, [records, sortAsc]);

  const totalPages = Math.max(1, Math.ceil((data?.total || 0) / ITEMS_PER_PAGE));

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const columns: Column<KycRecord>[] = [
    { header: "S/N", accessor: "sn" },
    {
      header: "Player Name",
      accessor: (r) => (
        <div className="flex items-center gap-2">
          <img
            src={r.image || `https://api.dicebear.com/7.x/avataaars/svg?seed=${r.playerName}`}
            className="h-6 w-6 rounded-full"
          />
          {r.playerName}
        </div>
      ),
    },
    { header: "Form", accessor: "documentName" },
    { header: "Size", accessor: "size" },
    { header: "Date", accessor: "dateUploaded" },
    { header: "Type", accessor: "type" },
    {
      header: "Status",
      accessor: (r) => (
        <span className={`px-2 py-1 rounded ${STATUS_STYLES[r.status]}`}>
          {STATUS_LABELS[r.status]}
        </span>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-6 px-6 h-full">

      {/* HEADER */}
      <div className="flex justify-between">
        <h2 className="text-2xl font-bold">KYC & Document Uploads</h2>

        <div className="flex gap-2">
          <button onClick={() => setSortAsc(!sortAsc)}>
            <SortIcon />
          </button>
          <button>
            <FilterIcon />
          </button>
        </div>
      </div>

      {/* FILTERS */}
      <div className="flex justify-between">
        <div className="flex gap-4">
          {TAB_OPTIONS.map((t) => (
            <button
              key={t.key}
              onClick={() => {
                setActiveTab(t.key);
                setPage(1);
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="flex gap-2">
          <input
            placeholder="Search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <TimePeriodFilter
            onFilterChange={(period, range) =>
              setTimeFilter({ period, range })
            }
          />
        </div>
      </div>

      {/* TABLE */}
      <DataTable
        data={sorted}
        columns={columns}
        pagination={{
          currentPage: page,
          totalPages,
          onPageChange: setPage,
          totalItems: data?.total || 0,
          itemsPerPage: ITEMS_PER_PAGE,
        }}
        actionMenuItems={[
          {
            label: "View",
            icon: <Eye />,
            onClick: (r) => {
              setSelectedRecord(r);
              setShowDocumentModal(true);
            },
          },
          {
            label: "Notify",
            icon: <SendHorizonal />,
            onClick: (r) => console.log(r),
          },
          {
            label: "Review",
            icon: <PauseCircle />,
            onClick: (r) => console.log(r),
          },
        ]}
      />

      {/* MODAL */}
      {showDocumentModal && (
        <div className="fixed inset-0 bg-black/60 flex justify-center items-center">
          <button onClick={() => setShowDocumentModal(false)}>
            <X />
          </button>

          {docLoading ? (
            "Loading..."
          ) : (
            <div className="grid grid-cols-2 gap-4">
              <iframe src={documents?.frontDocument?.url} />
              <iframe src={documents?.backDocument?.url} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
