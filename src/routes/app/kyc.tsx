import { createFileRoute } from "@tanstack/react-router";
import { Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { IoFilter } from "react-icons/io5";
import FilterIcon from "@/logo/filter.svg?react";
import SortIcon from "@/logo/sort.svg?react";
import { DataTable, type Column } from "#/components/DataTable";
import { TimePeriodFilter } from "@/components/TimePeriodFilter";
export const Route = createFileRoute("/app/kyc")({
  component: KycPage,
});

type KycStatus = "verified" | "in_review" | "not_verified";
type KycTab = "all" | KycStatus;
type DocumentType = "PDF" | "JPG";

type KycRecord = {
  sn: string;
  playerName: string;
  avatarSeed: string;
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

const BASE_RECORDS: KycRecord[] = [
  {
    sn: "012345",
    playerName: "George jones",
    avatarSeed: "George jones",
    documentName: "NIN",
    size: "5mb",
    dateUploaded: "Aug 8, 2025",
    type: "PDF",
    status: "verified",
  },
  {
    sn: "012346",
    playerName: "Sarah Miller",
    avatarSeed: "Sarah Miller",
    documentName: "Driver's License",
    size: "5mb",
    dateUploaded: "Aug 8, 2025",
    type: "JPG",
    status: "in_review",
  },
  {
    sn: "012347",
    playerName: "Marcus Reed",
    avatarSeed: "Marcus Reed",
    documentName: "Voter's Card",
    size: "5mb",
    dateUploaded: "Aug 8, 2025",
    type: "JPG",
    status: "not_verified",
  },
  {
    sn: "012348",
    playerName: "Olivia Harris",
    avatarSeed: "Olivia Harris",
    documentName: "International Passport",
    size: "5mb",
    dateUploaded: "Aug 8, 2025",
    type: "JPG",
    status: "verified",
  },
  {
    sn: "012349",
    playerName: "David Cole",
    avatarSeed: "David Cole",
    documentName: "NIN",
    size: "5mb",
    dateUploaded: "Aug 8, 2025",
    type: "JPG",
    status: "verified",
  },
  {
    sn: "012350",
    playerName: "Jane Cooper",
    avatarSeed: "Jane Cooper",
    documentName: "Voter's Card",
    size: "5mb",
    dateUploaded: "Aug 8, 2025",
    type: "PDF",
    status: "in_review",
  },
  {
    sn: "012351",
    playerName: "Henry Stone",
    avatarSeed: "Henry Stone",
    documentName: "International Passport",
    size: "5mb",
    dateUploaded: "Aug 8, 2025",
    type: "JPG",
    status: "not_verified",
  },
  {
    sn: "012352",
    playerName: "Ava Brooks",
    avatarSeed: "Ava Brooks",
    documentName: "Driver's License",
    size: "5mb",
    dateUploaded: "Aug 8, 2025",
    type: "PDF",
    status: "verified",
  },
  {
    sn: "012353",
    playerName: "Ibrahim Musa",
    avatarSeed: "Ibrahim Musa",
    documentName: "Driver's License",
    size: "5mb",
    dateUploaded: "Aug 8, 2025",
    type: "PDF",
    status: "not_verified",
  },
  {
    sn: "012354",
    playerName: "Chidinma Obi",
    avatarSeed: "Chidinma Obi",
    documentName: "NIN",
    size: "5mb",
    dateUploaded: "Aug 8, 2025",
    type: "JPG",
    status: "verified",
  },
];

const ITEMS_PER_PAGE = 10;

function KycPage() {
  const [activeTab, setActiveTab] = useState<KycTab>("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [sortAsc, setSortAsc] = useState(true);

  const kycRecords = useMemo(() => {
    return Array.from({ length: 10 }, (_, index) =>
      BASE_RECORDS.map((record) => ({
        ...record,
        sn: String(Number(record.sn) + index * 10),
      })),
    ).flat();
  }, []);

  const filteredRecords = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    const scopedByTab =
      activeTab === "all"
        ? kycRecords
        : kycRecords.filter((record) => record.status === activeTab);

    const scopedBySearch = normalizedSearch
      ? scopedByTab.filter(
          (record) =>
            record.sn.toLowerCase().includes(normalizedSearch) ||
            record.playerName.toLowerCase().includes(normalizedSearch) ||
            record.documentName.toLowerCase().includes(normalizedSearch),
        )
      : scopedByTab;

    return [...scopedBySearch].sort((a, b) =>
      sortAsc ? a.sn.localeCompare(b.sn) : b.sn.localeCompare(a.sn),
    );
  }, [activeTab, kycRecords, search, sortAsc]);

  const totalPages = Math.max(1, Math.ceil(filteredRecords.length / ITEMS_PER_PAGE));
  const paginatedRecords = filteredRecords.slice(
    (page - 1) * ITEMS_PER_PAGE,
    page * ITEMS_PER_PAGE,
  );

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
          <img
            src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${record.avatarSeed}`}
            alt={record.playerName}
            className="h-6 w-6 rounded-full bg-gray-100 object-cover"
          />
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
            <TimePeriodFilter 
              buttonClassName="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-600 hover:bg-gray-50 cursor-pointer"
              onFilterChange={(period, customRange) => console.log(period, customRange)} 
            />
          </div>
        </div>

        <div className="flex-1 min-h-0 relative overflow-hidden rounded-lg bg-white shadow-md">
          <DataTable
            data={paginatedRecords}
            columns={columns}
            maxHeight="100%"
            onActionClick={(record) => console.log("Action clicked for", record.sn)}
            emptyMessage="No document found"
            pagination={{
              currentPage: page,
              totalPages,
              onPageChange: setPage,
              totalItems: filteredRecords.length,
              itemsPerPage: ITEMS_PER_PAGE,
            }}
          />
        </div>
      </div>
    </div>
  );
}
