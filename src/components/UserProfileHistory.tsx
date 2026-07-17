import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { MoreHorizontal } from "lucide-react";
import { TimePeriodFilter, type TimePeriod } from "./TimePeriodFilter";
import { ticketService, type TicketRecord } from "../lib/tickets";
import { userService } from "../lib/users";
import { getDateRangeForPeriod } from "#/lib/time-period";

interface UserProfileHistoryProps {
  userId: string;
}

function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse bg-gray-200 rounded ${className}`} />;
}

export function UserProfileHistory({ userId }: UserProfileHistoryProps) {
  const [timePeriod, setTimePeriod] = useState<TimePeriod>("All");
  const [customRange, setCustomRange] = useState<{ start: string; end: string } | undefined>(undefined);
  const [page, setPage] = useState(1);
  const limit = 10;

  const { fromDate, toDate } = getDateRangeForPeriod(timePeriod, customRange, { output: "date" });

  const { data: walletOverview, isLoading: isOverviewLoading } = useQuery({
    queryKey: ["user-history-overview", userId, fromDate, toDate],
    queryFn: async () => {
      const res = await userService.getUserWalletOverview(userId, { fromDate, toDate });
      if (!res.success) return null;
      return res.data;
    },
    enabled: !!userId,
  });

  const { data: ticketsData, isLoading: isTicketsLoading } = useQuery({
    queryKey: ["user-history-tickets", userId, page, fromDate, toDate],
    queryFn: async () => {
      const res = await ticketService.getUserTickets(userId, {
        page,
        limit,
        type: "all",
        fromDate,
        toDate,
      });
      if (!res.success) return null;
      return res.data;
    },
    enabled: !!userId,
  });

  // Sample/mock items if API has no tickets yet for demo
  const sampleTickets = [
    {
      id: "012345",
      dateTime: "Aug 8, 2025\n10:42 pm",
      amount: "₦150,000.00",
      oddsGameType: "0.5 Casino",
      potentialWin: "₦150,000.00",
      payOut: "₦150,000.00",
      status: "Won",
    },
    {
      id: "012345",
      dateTime: "Aug 8, 2025\n10:42 pm",
      amount: "₦80,000.00",
      oddsGameType: "0.5 Casino",
      potentialWin: "₦80,000.00",
      payOut: "₦80,000.00",
      status: "Pending",
    },
    {
      id: "012345",
      dateTime: "Aug 8, 2025\n10:42 pm",
      amount: "₦50,000.00",
      oddsGameType: "0.5 Casino",
      potentialWin: "₦0",
      payOut: "₦0",
      status: "Lost",
    },
    {
      id: "012345",
      dateTime: "Aug 8, 2025\n10:42 pm",
      amount: "₦150,000.00",
      oddsGameType: "0.5 Casino",
      potentialWin: "₦150,000.00",
      payOut: "₦150,000.00",
      status: "Won",
    },
    {
      id: "012345",
      dateTime: "Aug 8, 2025\n10:42 pm",
      amount: "₦80,000.00",
      oddsGameType: "0.5 Casino",
      potentialWin: "₦80,000.00",
      payOut: "₦80,000.00",
      status: "Pending",
    },
    {
      id: "012345",
      dateTime: "Aug 8, 2025\n10:42 pm",
      amount: "₦50,000.00",
      oddsGameType: "0.5 Casino",
      potentialWin: "₦0",
      payOut: "₦0",
      status: "Lost",
    },
  ];

  const formatMoney = (val: string | number | null | undefined) => {
    if (val == null || val === "") return "₦0.00";
    if (typeof val === "string") {
      const trimmed = val.trim();
      if (trimmed.startsWith("₦") || trimmed.startsWith("$")) {
        return trimmed;
      }
      const num = parseFloat(trimmed.replace(/[^0-9.-]+/g, ""));
      if (isNaN(num)) return trimmed;
      return `₦${num.toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
    if (typeof val === "number") {
      return `₦${val.toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
    return String(val);
  };

  const formatTicketDate = (dateStr?: string) => {
    if (!dateStr) return "—";
    if (dateStr.includes(",")) {
      const parts = dateStr.split(",");
      if (parts.length >= 3) {
        return `${parts[0]}, ${parts[1]}\n${parts.slice(2).join(",").trim()}`;
      } else if (parts.length === 2) {
        return `${parts[0]}\n${parts[1].trim()}`;
      }
    }
    const d = new Date(dateStr);
    if (!isNaN(d.getTime())) {
      const datePart = d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
      const timePart = d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true }).toLowerCase();
      return `${datePart}\n${timePart}`;
    }
    return dateStr;
  };

  const rawTicketList = ticketsData?.tickets;
  const hasLoadedTickets = Array.isArray(rawTicketList);

  const ticketsToDisplay = hasLoadedTickets
    ? rawTicketList.map((t: TicketRecord) => {
        const amount = formatMoney(t.betAmount);
        const potWin = (t as any).potentialWin != null ? formatMoney((t as any).potentialWin) : (t.outcome === "Won" ? amount : "₦0");
        const payOut = (t as any).payOut != null ? formatMoney((t as any).payOut) : (t.outcome === "Won" ? amount : "₦0");
        const status = t.outcome === "Won" ? "Won" : (t.outcome === "Active" || (t.outcome as any) === "Pending") ? "Pending" : "Lost";

        return {
          id: t.id,
          dateTime: formatTicketDate(t.createdAt),
          amount,
          oddsGameType: t.gameType || "Casino",
          potentialWin: potWin,
          payOut,
          status,
        };
      })
    : sampleTickets;

  const totalPages = ticketsData?.pagination?.totalPages || (hasLoadedTickets ? 1 : 10);
  const currentPage = ticketsData?.pagination?.page || page;

  const formatCurrency = (val?: number | null) => {
    if (val == null) return "₦1,500.00";
    return `₦${val.toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  return (
    <div className="space-y-6">
      {/* Ticket Overview */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-6">
          <h4 className="font-bold text-xl text-gray-900">Ticket Overview</h4>
          <div className="flex items-center gap-2">
            <TimePeriodFilter
              onFilterChange={(period, range) => {
                setTimePeriod(period);
                setCustomRange(range);
              }}
            />
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div>
            <p className="text-gray-500 text-sm mb-1">Current Bets placed</p>
            {isOverviewLoading ? (
              <Skeleton className="h-7 w-28 mt-1" />
            ) : (
              <p className="text-xl md:text-2xl font-bold text-gray-900">
                {formatCurrency(walletOverview?.currentBalance ?? 1500)}
              </p>
            )}
          </div>
          <div>
            <p className="text-gray-500 text-sm mb-1">Total Games won</p>
            {isOverviewLoading ? (
              <Skeleton className="h-7 w-28 mt-1" />
            ) : (
              <p className="text-xl md:text-2xl font-bold text-gray-900">
                {formatCurrency(walletOverview?.totalDeposits ?? 1500)}
              </p>
            )}
          </div>
          <div>
            <p className="text-gray-500 text-sm mb-1">Total Games Lost</p>
            {isOverviewLoading ? (
              <Skeleton className="h-7 w-28 mt-1" />
            ) : (
              <p className="text-xl md:text-2xl font-bold text-gray-900">
                {formatCurrency(walletOverview?.totalWithdrawals ?? 1500)}
              </p>
            )}
          </div>
          <div>
            <p className="text-gray-500 text-sm mb-1">Net Position (GGR)</p>
            {isOverviewLoading ? (
              <Skeleton className="h-7 w-28 mt-1" />
            ) : (
              <p className="text-xl md:text-2xl font-bold text-gray-900">
                {formatCurrency(walletOverview?.netPosition ?? 1500)}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Tickets (bet) Summary */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <h4 className="font-bold text-xl text-gray-900 mb-6">Tickets (bet) Summary</h4>
        
        <div className="overflow-x-auto custom-scrollbar">
          <table className="min-w-full text-sm whitespace-nowrap">
            <thead>
              <tr className="border-b border-gray-100 text-gray-500 text-xs font-semibold text-left">
                <th className="pb-4 pr-4">Bet ID</th>
                <th className="pb-4 pr-4">Date &amp; Time</th>
                <th className="pb-4 pr-4">Amount</th>
                <th className="pb-4 pr-4">Odds Game type</th>
                <th className="pb-4 pr-4">Potential win</th>
                <th className="pb-4 pr-4">Pay out</th>
                <th className="pb-4 pr-4">Status</th>
                <th className="pb-4 text-right"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {isTicketsLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-gray-50">
                    <td className="py-4 pr-4"><Skeleton className="h-4 w-16" /></td>
                    <td className="py-4 pr-4">
                      <Skeleton className="h-4 w-24 mb-1" />
                      <Skeleton className="h-3 w-16" />
                    </td>
                    <td className="py-4 pr-4"><Skeleton className="h-4 w-24" /></td>
                    <td className="py-4 pr-4"><Skeleton className="h-4 w-20" /></td>
                    <td className="py-4 pr-4"><Skeleton className="h-4 w-24" /></td>
                    <td className="py-4 pr-4"><Skeleton className="h-4 w-24" /></td>
                    <td className="py-4 pr-4"><Skeleton className="h-6 w-16 rounded-full" /></td>
                    <td className="py-4 text-right"><Skeleton className="h-4 w-4 ml-auto" /></td>
                  </tr>
                ))
              ) : ticketsToDisplay.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-gray-400 text-sm">
                    No ticket history found for this user
                  </td>
                </tr>
              ) : (
                ticketsToDisplay.map((ticket, idx) => (
                  <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
                    <td className="py-4 pr-4 font-mono text-xs text-gray-900">{ticket.id}</td>
                    <td className="py-4 pr-4 text-xs">
                      {ticket.dateTime.includes("\n") ? (
                        <>
                          <div className="font-semibold text-gray-900">{ticket.dateTime.split("\n")[0]}</div>
                          <div className="text-gray-400 text-[11px]">{ticket.dateTime.split("\n")[1]}</div>
                        </>
                      ) : (
                        <div className="font-semibold text-gray-900">{ticket.dateTime}</div>
                      )}
                    </td>
                    <td className="py-4 pr-4 font-bold text-gray-900 text-xs">{ticket.amount}</td>
                    <td className="py-4 pr-4 text-gray-700 text-xs">{ticket.oddsGameType}</td>
                    <td className="py-4 pr-4 font-semibold text-gray-900 text-xs">{ticket.potentialWin}</td>
                    <td className="py-4 pr-4 font-semibold text-gray-900 text-xs">{ticket.payOut}</td>
                    <td className="py-4 pr-4">
                      {ticket.status === "Won" && (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-[#E8F8E5] text-[#10C300] border border-[#10C300]/20">
                          Won
                        </span>
                      )}
                      {ticket.status === "Pending" && (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-[#FFF8E5] text-[#FFB000] border border-[#FFB000]/20">
                          Pending
                        </span>
                      )}
                      {ticket.status === "Lost" && (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-[#FEECEB] text-[#EE201C] border border-[#EE201C]/20">
                          Lost
                        </span>
                      )}
                    </td>
                    <td className="py-4 text-right">
                      <button type="button" className="text-gray-400 hover:text-gray-600 p-1 cursor-pointer">
                        <MoreHorizontal className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="flex items-center justify-between border-t border-gray-100 pt-5 mt-4 text-xs font-medium text-gray-700">
          <span>Page {currentPage} of {totalPages}</span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 rounded-lg bg-[#10C300] text-white hover:bg-[#0ea800] disabled:opacity-40 disabled:cursor-not-allowed font-semibold cursor-pointer transition-colors"
            >
              Previous
            </button>
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-4 py-2 rounded-lg bg-[#10C300] text-white hover:bg-[#0ea800] disabled:opacity-40 disabled:cursor-not-allowed font-semibold cursor-pointer transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
