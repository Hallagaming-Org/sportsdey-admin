import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, ChevronDown } from "lucide-react";
import { DataTable, type Column } from "#/components/DataTable";
  import { FaFileExport } from "react-icons/fa6";
import { TimePeriodFilter } from "@/components/TimePeriodFilter";
import { transactionService, type Transaction, type TransactionStatus } from "#/lib/transactions";
export const Route = createFileRoute("/app/transactions")({
  component: WalletPage,
});

type TabKey = "all" | "deposits" | "withdrawals" | "payments";

const STATUS_STYLES: Record<TransactionStatus, string> = {
  Won: "bg-[#E8F8E5] text-[#10C300]",
  Pending: "bg-[#FFF8E5] text-[#FFB000]",
  Failed: "bg-[#FEECEB] text-[#EE201C]",
  Refund: "bg-[#EFF6FF] text-[#3B82F6]",
};

const TABS: { key: TabKey; label: string }[] = [
  { key: "all", label: "All Transactions" },
  { key: "deposits", label: "Deposits" },
  { key: "withdrawals", label: "Withdrawals" },
  { key: "payments", label: "Payments" },
];

const ITEMS_PER_PAGE = 10;

function WalletPage() {
  const [activeTab, setActiveTab] = useState<TabKey>("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const typeParam = activeTab === "all" ? undefined : activeTab;

  const { data: response, isLoading, error } = useQuery({
    queryKey: ["transactions", page, typeParam, search],
    queryFn: async () => {
      const result = await transactionService.getTransactions({
        page,
        limit: ITEMS_PER_PAGE,
        type: typeParam,
        search: search || undefined,
      });
      if (!result.success) {
        throw new Error(result.error || "Failed to fetch transactions");
      }
      return result.data;
    },
  });

  const transactions: Transaction[] = response?.transactions ?? [];
  const totalItems = response?.pagination.total ?? 0;
  const totalPages = response?.pagination.totalPages ?? 0;

  const columns: Column<Transaction>[] = [
    {
      header: "Transactions ID",
      accessor: "id",
      cellClassName: "font-mono text-gray-700",
    },
    {
      header: "Date & Time",
      accessor: (t) => (
        <span className="whitespace-pre-line text-gray-500 text-xs leading-relaxed">
          {t.dateTime}
        </span>
      ),
    },
    {
      header: "Type",
      accessor: (t) => (
        <span className="font-medium text-gray-800">{t.type}</span>
      ),
    },
    {
      header: "Payment Method",
      accessor: "paymentMethod",
      cellClassName: "text-gray-500",
    },
    {
      header: "Amount",
      accessor: "amount",
      cellClassName: "font-medium text-gray-900",
    },
    {
      header: "Balance After",
      accessor: "balanceAfter",
      cellClassName: "font-medium text-gray-900",
    },
    {
      header: "Status",
      accessor: (t) => (
        <span
          className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_STYLES[t.status]}`}
        >
          {t.status}
        </span>
      ),
    },
  ];

  return (
    <div className="flex h-[calc(100vh-120px)] flex-col gap-6 overflow-hidden px-6">
      <div className="flex-1 min-h-0 flex flex-col gap-4">
        <div className="flex-none flex items-center justify-between">
          <div>
            <h3 className="font-bold text-xl text-[#03002B]">Transactions</h3>
            <p className="text-sm text-[#001A26]">Manage all betting history</p>
          </div>
          <div className="flex items-center gap-2">
            <button className="inline-flex items-center h-11 gap-1.5 rounded-full border border-[#053209] bg-[#F4F8F3] px-3 py-1.5 text-sm font-medium text-[#053209] hover:bg-gray-50 cursor-pointer">
              T-type <ChevronDown className="h-3.5 w-3.5 text-[#364052]" />
            </button>
            <button className="inline-flex items-center h-11 gap-1.5 rounded-full border border-[#053209] bg-[#F4F8F3] px-3 py-1.5 text-sm font-medium text-[#053209] hover:bg-gray-50 cursor-pointer">
              Status <ChevronDown className="h-3.5 w-3.5 text-[#364052]" />
            </button>
            <button className="inline-flex items-center h-11 gap-1.5 rounded-full bg-[#1BAA04] px-3 py-1.5 text-sm font-medium text-white cursor-pointer">
              Export File as
             
<FaFileExport className="h-3.5 w-3.5 text-white" />
            </button>
          </div>
        </div>

        {/* Tabs + Search */}
        <div className="flex-none flex items-center justify-between gap-4">
          <div className="flex gap-6 border-b border-[#B0B0B0]">
            {TABS.map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => { setActiveTab(tab.key); setPage(1); }}
                className={`pb-3 font-medium text-sm transition-colors cursor-pointer ${
                  activeTab === tab.key
                    ? "border-b-2 border-[#1BAA04] text-[#1BAA04]"
                    : "text-[#B0B0B0] hover:text-[#1BAA04]"
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
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="w-[352px] rounded-full border border-gray-200 bg-gray-50 py-2 pr-4 pl-9 text-sm focus:border-[#1BAA04] focus:outline-none focus:ring-1 focus:ring-[#1BAA04]"
              />
              <Search className="absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
            </div>
            <TimePeriodFilter 
              buttonClassName="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-600 hover:bg-gray-50 cursor-pointer"
              onFilterChange={(period, customRange) => console.log(period, customRange)} 
            />
          </div>
        </div>

        {/* Reusable DataTable */}
        <div className="flex-1 min-h-0">
          <DataTable
            data={transactions}
            columns={columns}
            maxHeight="100%"
            isLoading={isLoading}
            onActionClick={(t) => console.log("Action for transaction", t.id)}
            emptyMessage={error ? error.message : "No transactions found"}
            pagination={{
              currentPage: page,
              totalPages,
              onPageChange: setPage,
              totalItems,
              itemsPerPage: ITEMS_PER_PAGE,
            }}
          />
        </div>
      </div>
    </div>
  );
}