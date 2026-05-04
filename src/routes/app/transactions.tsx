import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Search, ChevronDown } from "lucide-react";
import { DataTable, type Column } from "#/components/DataTable";
  import { FaFileExport } from "react-icons/fa6";
import { TimePeriodFilter } from "@/components/TimePeriodFilter";
export const Route = createFileRoute("/app/transactions")({
  component: WalletPage,
});

type TransactionStatus = "Won" | "Pending" | "Failed" | "Refund";
type TransactionType = "Deposit" | "Withdrawal" | "Payments" | "Refund";
type TabKey = "all" | "deposits" | "withdrawals" | "payments";

interface Transaction {
  id: string;
  dateTime: string;
  type: TransactionType;
  paymentMethod: string;
  amount: string;
  balanceAfter: string;
  status: TransactionStatus;
}

const DUMMY_TRANSACTIONS: Transaction[] = [
  { id: "012345", dateTime: "Aug 8, 2025\n10:42 pm", type: "Deposit", paymentMethod: "Card payment", amount: "0.5", balanceAfter: "₦225,000", status: "Won" },
  { id: "012346", dateTime: "Aug 8, 2025\n10:42 pm", type: "Withdrawal", paymentMethod: "Paystack", amount: "1.02", balanceAfter: "₦225,000", status: "Pending" },
  { id: "012347", dateTime: "Aug 8, 2025\n10:42 pm", type: "Payments", paymentMethod: "Paystack", amount: "1.5", balanceAfter: "₦225,000", status: "Failed" },
  { id: "012348", dateTime: "Aug 8, 2025\n10:42 pm", type: "Refund", paymentMethod: "Quick Bets", amount: "2.5", balanceAfter: "₦225,000", status: "Won" },
  { id: "012349", dateTime: "Aug 9, 2025\n11:00 am", type: "Deposit", paymentMethod: "Card payment", amount: "5.0", balanceAfter: "₦430,000", status: "Won" },
  { id: "012350", dateTime: "Aug 9, 2025\n01:15 pm", type: "Withdrawal", paymentMethod: "Bank Transfer", amount: "2.0", balanceAfter: "₦380,000", status: "Pending" },
  { id: "012351", dateTime: "Aug 10, 2025\n09:30 am", type: "Payments", paymentMethod: "Paystack", amount: "3.5", balanceAfter: "₦290,000", status: "Won" },
  { id: "012352", dateTime: "Aug 10, 2025\n02:45 pm", type: "Deposit", paymentMethod: "Card payment", amount: "10.0", balanceAfter: "₦590,000", status: "Failed" },
  { id: "012353", dateTime: "Aug 11, 2025\n08:00 am", type: "Refund", paymentMethod: "Quick Bets", amount: "1.0", balanceAfter: "₦600,000", status: "Won" },
  { id: "012354", dateTime: "Aug 11, 2025\n05:20 pm", type: "Withdrawal", paymentMethod: "Paystack", amount: "4.0", balanceAfter: "₦200,000", status: "Pending" },
  { id: "012355", dateTime: "Aug 12, 2025\n10:10 am", type: "Deposit", paymentMethod: "Card payment", amount: "7.5", balanceAfter: "₦750,000", status: "Won" },
  { id: "012356", dateTime: "Aug 12, 2025\n03:00 pm", type: "Payments", paymentMethod: "Bank Transfer", amount: "2.2", balanceAfter: "₦527,800", status: "Failed" },
  { id: "012357", dateTime: "Aug 13, 2025\n09:00 am", type: "Deposit", paymentMethod: "Card payment", amount: "15.0", balanceAfter: "₦1,027,800", status: "Won" },
  { id: "012358", dateTime: "Aug 13, 2025\n02:30 pm", type: "Withdrawal", paymentMethod: "Paystack", amount: "3.0", balanceAfter: "₦697,800", status: "Pending" },
  { id: "012359", dateTime: "Aug 14, 2025\n11:45 am", type: "Payments", paymentMethod: "Quick Bets", amount: "6.0", balanceAfter: "₦337,800", status: "Won" },
  { id: "012360", dateTime: "Aug 14, 2025\n04:00 pm", type: "Refund", paymentMethod: "Bank Transfer", amount: "1.5", balanceAfter: "₦489,300", status: "Won" },
  { id: "012361", dateTime: "Aug 15, 2025\n08:30 am", type: "Deposit", paymentMethod: "Card payment", amount: "20.0", balanceAfter: "₦1,489,300", status: "Won" },
  { id: "012362", dateTime: "Aug 15, 2025\n01:00 pm", type: "Withdrawal", paymentMethod: "Paystack", amount: "8.0", balanceAfter: "₦689,300", status: "Failed" },
  { id: "012363", dateTime: "Aug 16, 2025\n10:00 am", type: "Payments", paymentMethod: "Quick Bets", amount: "4.5", balanceAfter: "₦239,300", status: "Won" },
  { id: "012364", dateTime: "Aug 16, 2025\n03:30 pm", type: "Deposit", paymentMethod: "Card payment", amount: "12.0", balanceAfter: "₦1,439,300", status: "Pending" },
  { id: "012365", dateTime: "Aug 17, 2025\n09:15 am", type: "Refund", paymentMethod: "Bank Transfer", amount: "2.0", balanceAfter: "₦1,639,300", status: "Won" },
  { id: "012366", dateTime: "Aug 17, 2025\n02:00 pm", type: "Withdrawal", paymentMethod: "Paystack", amount: "5.5", balanceAfter: "₦1,089,300", status: "Failed" },
];

// const SUGGESTED_AMOUNTS = ["₦1,000,000", "₦2,000,000", "₦3,000,000", "₦4,000,000"];

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
  // const [amount, setAmount] = useState("");
  const [activeTab, setActiveTab] = useState<TabKey>("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  // const formatAmount = (val: string) => {
  //   const num = val.replace(/\D/g, "");
  //   return num.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  // };

  // const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  //   const formatted = formatAmount(e.target.value);
  //   setAmount(formatted);
  // };

  // When sending to backend, use: amount.replace(/,/g, "")

  const filteredTransactions = DUMMY_TRANSACTIONS.filter((t) => {
    if (activeTab === "deposits") return t.type === "Deposit";
    if (activeTab === "withdrawals") return t.type === "Withdrawal";
    if (activeTab === "payments") return t.type === "Payments";
    return true;
  }).filter((t) =>
    search
      ? t.id.includes(search) ||
        t.type.toLowerCase().includes(search.toLowerCase()) ||
        t.paymentMethod.toLowerCase().includes(search.toLowerCase())
      : true
  );

  const totalPages = Math.ceil(filteredTransactions.length / ITEMS_PER_PAGE);
  const paginatedTransactions = filteredTransactions.slice(
    (page - 1) * ITEMS_PER_PAGE,
    page * ITEMS_PER_PAGE
  );

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
            data={paginatedTransactions}
            columns={columns}
            maxHeight="100%"
            onActionClick={(t) => console.log("Action for transaction", t.id)}
            emptyMessage="No transactions found"
            pagination={{
              currentPage: page,
              totalPages,
              onPageChange: setPage,
              totalItems: filteredTransactions.length,
              itemsPerPage: ITEMS_PER_PAGE,
            }}
          />
        </div>
      </div>
    </div>
  );
}
