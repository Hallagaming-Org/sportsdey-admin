import { useState } from "react";
import { DataTable, type Column } from "./DataTable";
import { TimePeriodFilter, type TimePeriod } from "./TimePeriodFilter";
import { ChevronDown, Plus, Minus } from "lucide-react";

interface UserProfileWalletInfoProps {
  userId: string;
  balance: number;
}

export function UserProfileWalletInfo({ userId, balance }: UserProfileWalletInfoProps) {
  const [selectedTimePeriod, setSelectedTimePeriod] = useState<TimePeriod>("All");
  const [transactionType, setTransactionType] = useState<"credit" | "debit">("credit");
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");

  const transactions = [
    { type: "Deposit", amount: 150000, referenceId: "DEP-2025-000123", dateTime: "Aug 8, 2025\n10:42 pm", status: "Success" },
    { type: "Withdrawal", amount: 80000, referenceId: "WDR-2025-000123", dateTime: "Aug 8, 2025\n10:42 pm", status: "Success" },
    { type: "Manual Credit", amount: 50000, referenceId: "MCR-2025-000123", dateTime: "Aug 8, 2025\n10:42 pm", status: "Success" },
  ];

  const columns: Column<typeof transactions[0]>[] = [
    {
      header: "Type",
      accessor: "type",
      cellClassName: "font-medium text-gray-900",
    },
    {
      header: "Amount",
      accessor: (t) => `₦${t.amount.toLocaleString(undefined, {minimumFractionDigits: 2})}`,
      cellClassName: "font-bold text-gray-900",
    },
    {
      header: "Reference ID",
      accessor: "referenceId",
      cellClassName: "font-mono text-gray-500",
    },
    {
      header: "Date & Time",
      accessor: (t) => <span className="whitespace-pre-line text-gray-500 text-xs">{t.dateTime}</span>,
    },
    {
      header: "Status",
      accessor: (t) => (
        <span className="inline-flex items-center rounded-full bg-[#E8F8E5] px-2.5 py-1 text-xs font-medium text-[#10C300]">
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
            onActionClick={() => {}}
            actionMenuItems={[]}
            emptyMessage="No transactions found"
            isLoading={false}
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
                  <Minus className="w-4 h-4" /> Debit
                </div>
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
          <button className="bg-[#10C300] text-white font-bold px-8 py-3 rounded-full hover:bg-[#0ea800] transition-colors shadow-[0_4px_14px_0_rgba(16,195,0,0.39)] cursor-pointer">
            Process Transaction
          </button>
        </div>
      </div>
    </div>
  );
}
