import { useState } from "react";
import { DataTable, type Column } from "./DataTable";
import { TimePeriodFilter, type TimePeriod } from "./TimePeriodFilter";
import { ChevronDown, Plus, Minus } from "lucide-react";
import { SuccessModal } from "./SuccessModal";
import { TransactionDetailsModal } from "./TransactionDetailsModal";
import { useQuery } from "@tanstack/react-query";
import { transactionService, type Transaction, type TransactionStatus } from "#/lib/transactions";

const STATUS_STYLES: Record<TransactionStatus, string> = {
	Won: "bg-[#E8F8E5] text-[#10C300]",
	Pending: "bg-[#FFF8E5] text-[#FFB000]",
	Failed: "bg-[#FEECEB] text-[#EE201C]",
	Refund: "bg-[#EFF6FF] text-[#3B82F6]",
};

interface UserProfileWalletInfoProps {
  userId: string;
  balance: number;
}

export function UserProfileWalletInfo({ userId, balance }: UserProfileWalletInfoProps) {
  const [selectedTimePeriod, setSelectedTimePeriod] = useState<TimePeriod>("All");
  const [transactionType, setTransactionType] = useState<"credit" | "debit">("credit");
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successData, setSuccessData] = useState<{ type: "credit" | "debit"; amount: string } | null>(null);
  const [selectedTransactionId, setSelectedTransactionId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const ITEMS_PER_PAGE = 5;

  const {
    data: response,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["transactions", "user", userId, page],
    queryFn: async () => {
      const result = await transactionService.getTransactions({
        page,
        limit: ITEMS_PER_PAGE,
        search: userId,
      });
      if (!result.success) {
        throw new Error(result.error || "Failed to fetch transactions");
      }
      return result.data;
    },
  });

  const transactions = response?.transactions ?? [];
  const totalPages = response?.pagination.totalPages ?? 0;
  const totalItems = response?.pagination.total ?? 0;

  const handleProcessTransaction = () => {
    if (!amount) return;
    setSuccessData({ type: transactionType, amount });
    setShowSuccessModal(true);
    setAmount("");
    setReason("");
  };

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
    <div className="space-y-6">
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-6">
          <h4 className="font-bold text-xl text-gray-900">Wallet Overview</h4>
          <TimePeriodFilter 
            onFilterChange={(period) => setSelectedTimePeriod(period)}
            buttonClassName="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          />
        </div>
        <div className="grid grid-cols-4 gap-6">
          <div>
            <p className="text-gray-500 text-sm mb-1">Current Balance</p>
            <p className="text-2xl font-bold text-gray-900">₦{balance.toLocaleString(undefined, {minimumFractionDigits: 2})}</p>
          </div>
          <div>
            <p className="text-gray-500 text-sm mb-1">Total Deposits</p>
            <p className="text-2xl font-bold text-gray-900">₦1,500.00</p>
          </div>
          <div>
            <p className="text-gray-500 text-sm mb-1">Total Withdrawals</p>
            <p className="text-2xl font-bold text-gray-900">₦1,500.00</p>
          </div>
          <div>
            <p className="text-gray-500 text-sm mb-1">Net Position (GGR)</p>
            <p className="text-2xl font-bold text-gray-900">₦1,500.00</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col min-h-[300px]">
        <h4 className="font-bold text-xl text-gray-900 mb-6">Transaction Summary</h4>
        <div className="flex-1 min-h-0">
          <DataTable 
            columns={columns}
            data={transactions}
            maxHeight="300px"
            isLoading={isLoading}
            onActionClick={() => {}}
            actionMenuItems={[
              {
                label: "View transaction info",
                onClick: (item) => setSelectedTransactionId(item.id)
              }
            ]}
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

      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <h4 className="font-bold text-xl text-gray-900">Manual Credit/Debits</h4>
        <p className="text-gray-500 text-sm mb-6">Manually adjust user wallet balance</p>
        
        <div className="flex items-end gap-6 flex-wrap lg:flex-nowrap">
          <div className="flex-none">
            <p className="text-gray-700 text-sm font-medium mb-2">Transaction Type</p>
            <div className="flex items-center gap-2">
              <button 
                type="button"
                onClick={() => setTransactionType("credit")}
                className={`inline-flex items-center gap-2 px-2 w-[84px] py-2 rounded-lg border text-sm font-medium transition-colors cursor-pointer ${
                  transactionType === "credit" ? "border-[#10C300] bg-[#F7FEF7] text-[#10C300]" : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
                }`}
              >
                <div className="w-[14px] h-[14px] rounded-full flex items-center justify-center border border-[#1BAA04]">
                  <Plus className="w-4 h-4" />
                </div>
                Credit
              </button>
              <button 
                type="button"
                onClick={() => setTransactionType("debit")}
                className={`inline-flex items-center gap-2 px-2 w-[84px] py-2 rounded-lg border text-sm font-medium transition-colors cursor-pointer ${
                  transactionType === "debit" ? "border-[#EE201C] bg-[#FEECEB] text-[#EE201C]" : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
                }`}
              >
                <div className="w-[14px] h-[14px] rounded-full flex items-center justify-center border border-[#F3442D]">
                  <Minus className="w-4 h-4 text-[#F3442D]" />
                </div>
                Debit
              </button>
            </div>
          </div>

          <div className="flex-1 min-w-[200px]">
            <p className="text-gray-700 text-sm font-medium mb-2">Amount (₦)</p>
            <input 
              type="number" 
              placeholder="Enter amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-[#10C300] focus:outline-none focus:ring-1 focus:ring-[#10C300]"
            />
          </div>

          <div className="flex-1 w-[207px]">
            <p className="text-gray-700 text-sm font-medium mb-2">Reasons</p>
            <div className="relative">
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full appearance-none rounded-lg border border-gray-300 px-4 py-2.5 pr-10 text-sm text-gray-700 focus:border-[#10C300] focus:outline-none focus:ring-1 focus:ring-[#10C300] cursor-pointer"
              >
                <option value="" disabled>Select a reason</option>
                <option value="bonus">Bonus</option>
                <option value="refund">Refund</option>
                <option value="correction">Correction</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 w-4 h-4 -translate-y-1/2 text-gray-500 pointer-events-none" />
            </div>
          </div>
        </div>

        <div className="mt-8 flex justify-center">
          <button 
            onClick={handleProcessTransaction}
            className="bg-[#1BAA04] text-white font-bold px-8 py-3 rounded-[6px] transition-colors cursor-pointer disabled:opacity-50"
            disabled={!amount}
          >
            Process Transaction
          </button>
        </div>
      </div>

      <SuccessModal 
        open={showSuccessModal} 
        onClose={() => setShowSuccessModal(false)}
        text={successData ? `This user has been successfully ${successData.type === 'credit' ? 'credited' : 'Debited'} with an amount of ₦${Number(successData.amount).toLocaleString()}.` : ""}
      />

      {selectedTransactionId && (
        <TransactionDetailsModal
          transactionId={selectedTransactionId}
          open={!!selectedTransactionId}
          onClose={() => setSelectedTransactionId(null)}
        />
      )}
    </div>
  );
}
