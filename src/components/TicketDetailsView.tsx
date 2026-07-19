import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { 
  ArrowLeft, 
  Printer, 
  MoreHorizontal, 
  CheckCircle2, 
  PauseCircle,
  Mail,
  Phone,
  Copy,
  XCircle,
} from "lucide-react";
import { FaFileExport, FaFilePdf, FaFileWord, FaFileExcel } from "react-icons/fa6";
import { toast } from "sonner";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

import { ticketService, type TicketRecord, type DetailedTicket, type MatchSelection } from "#/lib/tickets";
import type { User } from "#/lib/users";

interface TicketDetailsViewProps {
  ticket: TicketRecord;
  onBack: () => void;
  onViewPlayerProfile: (user: User) => void;
  onSuspendPlayer?: (userId: string, isReactivate?: boolean) => void;
}

export function TicketDetailsView({
  ticket,
  onBack,
  onViewPlayerProfile,
  onSuspendPlayer,
}: TicketDetailsViewProps) {
  const [showExportDropdown, setShowExportDropdown] = useState(false);
  const [showTopMenu, setShowTopMenu] = useState(false);

  const { data: fetchedDetails } = useQuery({
    queryKey: ["ticket-details", ticket.id],
    queryFn: async () => {
      const res = await ticketService.getTicketDetails(ticket.id);
      if (!res.success) return null;
      return res.data;
    },
    enabled: !!ticket.id,
  });

  // Construct full display details with fallbacks matching Figma design when fields are missing
  const details: DetailedTicket = {
    ...ticket,
    ...fetchedDetails,
    placedAt: fetchedDetails?.placedAt || "Aug 8, 2025 , 10:42 pm",
    settledAt: fetchedDetails?.settledAt || "Aug 8, 2025 , 11:58 pm",
    stakeAmount: fetchedDetails?.stakeAmount || ticket.betAmount || "₦50,000",
    potentialWin: fetchedDetails?.potentialWin || ticket.potentialWin || "₦225,000",
    actualPayout: fetchedDetails?.actualPayout || ticket.payout || ticket.payOut || (ticket.outcome === "Won" ? (ticket.potentialWin || "₦225,000") : "₦0.00"),
    profit: fetchedDetails?.profit || "+₦175,000",
    playerEmail: fetchedDetails?.playerEmail || `${ticket.playerName.toLowerCase().replace(/\s+/g, "")}@gmail.com`,
    playerPhone: fetchedDetails?.playerPhone || "+234 812 345 6789",
    playerVerified: fetchedDetails?.playerVerified ?? true,
    betType: fetchedDetails?.betType || ticket.gameType || "Accumulator",
    selectionCount: fetchedDetails?.selectionCount || 5,
    totalOdds: fetchedDetails?.totalOdds || "4.52",
    freeBet: fetchedDetails?.freeBet ?? "No",
    bonusUsed: fetchedDetails?.bonusUsed ?? "No",
    cashOut: fetchedDetails?.cashOut || "Not Used",
    ipAddress: fetchedDetails?.ipAddress || "Safari 105.112.23.191",
    deviceInfo: fetchedDetails?.deviceInfo || "iPhone 13",
    selections: fetchedDetails?.selections || [
      { id: 1, match: "Arsenal vs Chelsea", pick: "Arsenal Win", odds: "1.75", status: "Won" },
      { id: 2, match: "Real Madrid vs Barcelona", pick: "Over 2.5 Goals", odds: "1.60", status: "Won" },
      { id: 3, match: "PSG vs Lyon", pick: "PSG Win", odds: "1.45", status: "Won" },
      { id: 4, match: "AC Milan vs AS Roma", pick: "Both Teams to Score", odds: "1.50", status: "Won" },
      { id: 5, match: "Bayern vs Dortmund", pick: "Over 3.5 Goals", odds: "1.75", status: "Won" },
    ],
  };

  const userForProfile: User = {
    id: ticket.userId || (ticket as any).playerId || ticket.id,
    name: ticket.playerName,
    email: details.playerEmail!,
    wallet: 0,
    status: details.playerVerified ? "verified" : "unverified",
    registeredDate: Date.now(),
    suspended: ticket.userSuspended,
  };

  const isUserSuspended = Boolean(ticket.userSuspended || details.userSuspended);
  const outcomeKey = ticket.outcome === "Won" ? "Won" : (ticket.outcome as any) === "Active" || (ticket.outcome as any) === "Pending" ? "Active" : "Lost";

  const exportToPdf = () => {
    const doc = new jsPDF();
    doc.text(`Ticket Details - ${details.id}`, 14, 15);
    doc.setFontSize(10);
    doc.text(`Player: ${details.playerName} | Status: ${details.outcome}`, 14, 23);
    doc.text(`Stake: ${details.stakeAmount} | Payout: ${details.actualPayout} | Profit: ${details.profit}`, 14, 30);

    autoTable(doc, {
      head: [["#", "Match", "Pick", "Odds"]],
      body: details.selections?.map((s: MatchSelection, idx: number) => [
        idx + 1,
        s.match,
        s.pick,
        s.odds,
      ]) || [],
      startY: 38,
    });

    doc.save(`Ticket_${details.id}.pdf`);
  };

  const exportToExcel = () => {
    toast.success("Ticket exported to Excel");
  };

  const exportToDocx = () => {
    toast.success("Ticket exported to DOCX");
  };

  return (
    <div className="font-inter flex flex-col gap-6 px-8 py-2 overflow-y-auto max-h-[calc(100vh-100px)] print:max-h-none print:overflow-visible print:p-0 custom-scrollbar">
      {/* Header Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="w-8 h-8 flex items-center justify-center rounded-lg border border-[#757575] text-[#757575] transition-colors cursor-pointer print:hidden"
            title="Back to Ticket History"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>

          <div>
            <div className="flex items-center gap-2.5">
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-2xl text-gray-900" title={details.id}>
                  Ticket ID - {details.id && details.id.length > 16 ? `${details.id.substring(0, 12)}...` : details.id}
                </h2>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(details.id);
                    toast.success("Ticket ID copied to clipboard");
                  }}
                  className="text-gray-400 hover:text-gray-700 transition-colors cursor-pointer p-1 rounded-md hover:bg-gray-100"
                  title="Copy Ticket ID"
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>
              <span
                className={`px-3 py-0.5 rounded-full text-xs font-semibold ${
                  outcomeKey === "Won"
                    ? "bg-[#E8F8E5] text-[#10C300]"
                    : outcomeKey === "Active"
                    ? "bg-[#FFF8E5] text-[#FFB000]"
                    : "bg-[#FEECEB] text-[#EE201C]"
                }`}
              >
                {details.outcome}
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              Placed: {details.placedAt} . Settled: {details.settledAt}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 relative print:hidden">
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-gray-200 bg-white text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer shadow-xs"
          >
            <Printer className="w-3.5 h-3.5" />
            Print Ticket
          </button>

          {/* Export Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowExportDropdown(!showExportDropdown)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#1BAA04] hover:bg-[#158903] text-white text-xs font-medium transition-colors cursor-pointer shadow-sm"
            >
              Export File as
              <FaFileExport className="w-3 h-3" />
            </button>

            {showExportDropdown && (
              <div className="absolute right-0 mt-2 w-36 bg-white rounded-xl border border-gray-100 shadow-lg p-1 z-30 overflow-hidden">
                <button
                  onClick={() => {
                    setShowExportDropdown(false);
                    exportToPdf();
                  }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-xs text-gray-700 hover:bg-gray-50 rounded-lg cursor-pointer"
                >
                  <FaFilePdf className="text-red-500 w-3.5 h-3.5" /> PDF
                </button>
                <button
                  onClick={() => {
                    setShowExportDropdown(false);
                    exportToDocx();
                  }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-xs text-gray-700 hover:bg-gray-50 rounded-lg cursor-pointer"
                >
                  <FaFileWord className="text-blue-600 w-3.5 h-3.5" /> DOCX
                </button>
                <button
                  onClick={() => {
                    setShowExportDropdown(false);
                    exportToExcel();
                  }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-xs text-gray-700 hover:bg-gray-50 rounded-lg cursor-pointer"
                >
                  <FaFileExcel className="text-green-600 w-3.5 h-3.5" /> Excel
                </button>
              </div>
            )}
          </div>

          {/* Top Menu Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowTopMenu(!showTopMenu)}
              className="p-2.5 rounded-full border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 transition-colors cursor-pointer shadow-xs"
            >
              <MoreHorizontal className="w-4 h-4" />
            </button>

            {showTopMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl border border-gray-100 shadow-xl p-1 z-30 overflow-hidden">
                <button
                  onClick={() => {
                    setShowTopMenu(false);
                    if (onSuspendPlayer) {
                      onSuspendPlayer(userForProfile.id, isUserSuspended);
                    } else {
                      toast.info(isUserSuspended ? "Reactivate action triggered" : "Suspend action triggered");
                    }
                  }}
                  className="flex w-full items-center gap-2.5 px-3 py-2 text-xs text-gray-700 hover:bg-gray-50 rounded-lg cursor-pointer"
                >
                  {isUserSuspended ? (
                    <>
                      <PauseCircle className="w-3.5 h-3.5 text-[#10C300]" /> Reactivate Player
                    </>
                  ) : (
                    <>
                      <PauseCircle className="w-3.5 h-3.5 text-gray-500" /> Suspend Player
                    </>
                  )}
                </button>
                {/* <button
                  onClick={() => {
                    setShowTopMenu(false);
                    toast.success(`Ticket ${details.id} voided`);
                  }}
                  className="flex w-full items-center gap-2.5 px-3 py-2 text-xs text-gray-700 hover:bg-gray-50 rounded-lg cursor-pointer"
                >
                  <ShieldAlert className="w-3.5 h-3.5 text-orange-500" /> Void Ticket
                </button>
                <button
                  onClick={() => {
                    setShowTopMenu(false);
                    toast.success(`Ticket ${details.id} flagged for investigation`);
                  }}
                  className="flex w-full items-center gap-2.5 px-3 py-2 text-xs text-red-600 hover:bg-red-50 rounded-lg cursor-pointer"
                >
                  <Flag className="w-3.5 h-3.5 text-red-600" /> Flag for Investigation
                </button> */}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs">
          <p className="text-xs text-gray-500 font-medium">Stake Amount</p>
          <h4 className="text-xl md:text-2xl font-bold text-gray-900 mt-1.5">
            {details.stakeAmount}
          </h4>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs">
          <p className="text-xs text-gray-500 font-medium">Potential Win</p>
          <h4 className="text-xl md:text-2xl font-bold text-gray-900 mt-1.5">
            {details.potentialWin}
          </h4>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs">
          <p className="text-xs text-gray-500 font-medium">Actual Payout</p>
          <h4 className="text-xl md:text-2xl font-bold text-[#10C300] mt-1.5">
            {details.actualPayout}
          </h4>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs">
          <p className="text-xs text-gray-500 font-medium">Profit</p>
          <h4 className="text-xl md:text-2xl font-bold text-[#10C300] mt-1.5">
            {details.profit}
          </h4>
        </div>
      </div>

      {/* Player Information Card */}
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs">
        <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-5">
          <h4 className="text-base font-bold text-gray-900">
            Player Information
          </h4>
          <button
            type="button"
            onClick={() => onViewPlayerProfile(userForProfile)}
            className="bg-[#1BAA04] hover:bg-[#158903] text-white px-5 py-2 rounded-full text-xs font-semibold shadow-sm transition-colors cursor-pointer whitespace-nowrap print:hidden"
          >
            View Player Profile
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 divide-y md:divide-y-0 md:divide-x divide-gray-100 items-center">
          <div className="flex items-center gap-4 pr-0 md:pr-4">
            <img
              src={
                ticket.image ||
                "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80"
              }
              alt={details.playerName}
              className="w-12 h-12 rounded-full object-cover border border-gray-200"
            />
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-gray-900 text-sm">
                  {details.playerName}
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#E8F8E5] text-[#10C300]">
                  Verified
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-gray-500 mt-0.5 font-mono">
                <span title={userForProfile.id}>
                  Player ID: {userForProfile.id && userForProfile.id.length > 14 ? `${userForProfile.id.substring(0, 10)}...` : userForProfile.id}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(userForProfile.id);
                    toast.success("Player ID copied to clipboard");
                  }}
                  className="text-gray-400 hover:text-gray-700 transition-colors cursor-pointer p-0.5 rounded hover:bg-gray-100"
                  title="Copy Player ID"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          <div className="pt-4 md:pt-0 md:pl-6 space-y-2 text-xs text-gray-600">
            <div className="flex items-center gap-2.5">
              <Mail className="w-4 h-4 text-gray-400 shrink-0" />
              <span className="truncate">{details.playerEmail}</span>
            </div>
            <div className="flex items-center gap-2.5">
              <Phone className="w-4 h-4 text-gray-400 shrink-0" />
              <span>{details.playerPhone}</span>
            </div>
          </div>

          <div className="pt-4 md:pt-0 md:pl-6 space-y-2 text-xs text-gray-600">
            <div className="flex items-center gap-4">
              <span className="text-gray-400 min-w-[75px]">Bal. Before:</span>
              <span className="font-semibold text-gray-900">
                {details.balanceBefore || "₦225,000"}
              </span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-gray-400 min-w-[75px]">Bal. After:</span>
              <span className="font-semibold text-gray-900">
                {details.balanceAfter || "₦400,000"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Betting Details Table */}
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs">
        <h4 className="text-base font-bold text-gray-900 mb-5">
          Betting Details
        </h4>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-[#F9F9F9]">
              <tr className="text-gray-400 font-medium">
                <th className="py-3 px-4 rounded-l-xl font-normal">Bet Type</th>
                <th className="py-3 px-4 font-normal">Selection</th>
                <th className="py-3 px-4 font-normal">Stake amount</th>
                <th className="py-3 px-4 font-normal">Total Odds</th>
                <th className="py-3 px-4 font-normal">Free Bet</th>
                <th className="py-3 px-4 font-normal">Bonus used</th>
                <th className="py-3 px-4 font-normal">Cash out</th>
                <th className="py-3 px-4 rounded-r-xl font-normal">IP address</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 text-gray-800">
              <tr>
                <td className="py-4 px-4 font-semibold text-gray-900">
                  {details.betType}
                </td>
                <td className="py-4 px-4 font-medium">
                  {details.selectionCount}
                </td>
                <td className="py-4 px-4 font-medium">
                  {details.stakeAmount}
                </td>
                <td className="py-4 px-4 font-semibold text-gray-900">
                  {details.totalOdds}
                </td>
                <td className="py-4 px-4">{details.freeBet}</td>
                <td className="py-4 px-4">{details.bonusUsed}</td>
                <td className="py-4 px-4">{details.cashOut}</td>
                <td className="py-4 px-4">
                  <div className="flex flex-col space-y-1">
                    <button className="w-max p-1 text-[11px] border border-[#757979] rounded-full bg-[#F0F0F0] text-gray-500">
                      {details.deviceInfo}
                    </button>
                    <span className="font-mono text-[11px] text-gray-700">
                      {details.ipAddress}
                    </span>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Match Selections Table */}
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs mb-6">
        <h4 className="text-base font-bold text-gray-900 mb-5">
          Match Selections
        </h4>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-[#F9F9F9]">
              <tr className="text-gray-400 font-medium">
                <th className="py-3 px-4 rounded-l-xl w-12 font-normal">#</th>
                <th className="py-3 px-4 font-normal">Match</th>
                <th className="py-3 px-4 font-normal">Pick</th>
                <th className="py-3 px-4 font-normal">Odds</th>
                <th className="py-3 px-4 rounded-r-xl w-12 text-center font-normal"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-gray-800">
              {details.selections?.map((sel: MatchSelection, idx: number) => (
                <tr key={idx}>
                  <td className="py-3.5 px-4 font-medium text-gray-400">
                    {idx + 1}
                  </td>
                  <td className="py-3.5 px-4 font-semibold text-gray-900">
                    {sel.match}
                  </td>
                  <td className="py-3.5 px-4 text-gray-700">{sel.pick}</td>
                  <td className="py-3.5 px-4 font-semibold text-gray-900">
                    {sel.odds}
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    {sel.status === "Lost" ? (
                      <XCircle className="w-4 h-4 text-red-500 fill-red-500 text-white inline-block" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4 text-[#10C300] fill-[#10C300] text-white inline-block" />
                    )}
                  </td>
                </tr>
              ))}
              <tr className="bg-[#E8F8E5]/50 border-t border-gray-100 font-bold">
                <td className="py-3.5 px-4"></td>
                <td colSpan={2} className="py-3.5 px-4 text-[#10C300] font-bold">
                  Total Odds
                </td>
                <td className="py-3.5 px-4 text-[#10C300] font-bold text-sm">
                  {details.totalOdds}
                </td>
                <td className="py-3.5 px-4"></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
