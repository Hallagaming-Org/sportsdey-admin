import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Search, Clock, Eye, PauseCircle } from "lucide-react";
import { DataTable, type Column } from "#/components/DataTable";
import SortIcon from "@/logo/sort.svg?react";
import FilterIcon from "@/logo/filter.svg?react";
import { ActionDropdown } from "#/components/ActionDropdown";
import { UserProfileModal } from "#/components/UserProfileModal";
import { SendNoticeModal } from "#/components/SendNoticeModal";
import NotificationIcon from "#/assets/NotificationIcon";
import type { User } from "#/lib/users";
import { toast } from "sonner";

export const Route = createFileRoute("/app/tickets")({
  component: TicketsPage,
});

type TicketOutcome = "Won" | "Active" | "Lost";
type TabKey = "all" | "active" | "won" | "lost";

interface TicketRecord {
  id: string;
  playerName: string;
  betCode: string;
  betAmount: string;
  gameType: string;
  possibleWin: string;
  odds: string;
  outcome: TicketOutcome;
}

const DUMMY_TICKETS: TicketRecord[] = [
  { id: "012345", playerName: "George James", betCode: "8FG23X", betAmount: "₦50,000", gameType: "Casino", possibleWin: "₦10,000", odds: "5.5", outcome: "Won" },
  { id: "012346", playerName: "Savannah Ekikopima Enenche", betCode: "8FG23X", betAmount: "₦50,000", gameType: "Quick Bets", possibleWin: "₦10,000", odds: "5.5", outcome: "Active" },
  { id: "012347", playerName: "Xcape", betCode: "8FG23X", betAmount: "₦50,000", gameType: "Casino", possibleWin: "₦10,000", odds: "5.5", outcome: "Lost" },
  { id: "012348", playerName: "Bayse", betCode: "8FG23X", betAmount: "₦50,000", gameType: "Sports Betting", possibleWin: "₦10,000", odds: "5.5", outcome: "Won" },
  { id: "012349", playerName: "Lucky Rise", betCode: "8FG23X", betAmount: "₦50,000", gameType: "Casino", possibleWin: "₦10,000", odds: "5.5", outcome: "Active" },
  { id: "012350", playerName: "Lagos Rush", betCode: "8FG23X", betAmount: "₦50,000", gameType: "Sports Betting", possibleWin: "₦10,000", odds: "5.5", outcome: "Won" },
  { id: "012351", playerName: "Eagle", betCode: "8FG23X", betAmount: "₦50,000", gameType: "Sportbook", possibleWin: "₦10,000", odds: "5.5", outcome: "Lost" },
  { id: "012352", playerName: "Xcape", betCode: "8FG23X", betAmount: "₦50,000", gameType: "Sportbook", possibleWin: "₦10,000", odds: "5.5", outcome: "Won" },
  { id: "012353", playerName: "Bayse", betCode: "8FG23X", betAmount: "₦50,000", gameType: "Casino", possibleWin: "₦10,000", odds: "5.5", outcome: "Active" },
  { id: "012354", playerName: "Lucky Rise", betCode: "8FG23X", betAmount: "₦50,000", gameType: "Sports Betting", possibleWin: "₦10,000", odds: "5.5", outcome: "Won" },
  { id: "012355", playerName: "Lagos Rush", betCode: "8FG23X", betAmount: "₦50,000", gameType: "Quick Bets", possibleWin: "₦10,000", odds: "5.5", outcome: "Active" },
  { id: "012356", playerName: "Eagle", betCode: "8FG23X", betAmount: "₦50,000", gameType: "Sportbook", possibleWin: "₦10,000", odds: "5.5", outcome: "Lost" },
];

const OUTCOME_STYLES: Record<TicketOutcome, string> = {
  Won: "bg-[#E8F8E5] text-[#10C300]",
  Active: "bg-[#FFF8E5] text-[#FFB000]",
  Lost: "bg-[#FEECEB] text-[#EE201C]",
};

const TABS: { key: TabKey; label: string }[] = [
  { key: "all", label: "All Tickets" },
  { key: "active", label: "Active" },
  { key: "won", label: "Won" },
  { key: "lost", label: "Lost" },
];

const ITEMS_PER_PAGE = 10;

function TicketsPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabKey>("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const [actionDropdown, setActionDropdown] = useState<{ ticket: TicketRecord; top: number; right: number } | null>(null);
  const [selectedProfileUser, setSelectedProfileUser] = useState<User | null>(null);
  const [noticeModalUser, setNoticeModalUser] = useState<User | null>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = () => setActionDropdown(null);
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  const filteredTickets = DUMMY_TICKETS.filter((t) => {
    if (activeTab === "active") return t.outcome === "Active";
    if (activeTab === "won") return t.outcome === "Won";
    if (activeTab === "lost") return t.outcome === "Lost";
    return true;
  }).filter((t) =>
    search
      ? t.id.includes(search) || t.playerName.toLowerCase().includes(search.toLowerCase())
      : true
  );

  const totalPages = Math.ceil(filteredTickets.length / ITEMS_PER_PAGE);
  const paginatedTickets = filteredTickets.slice(
    (page - 1) * ITEMS_PER_PAGE,
    page * ITEMS_PER_PAGE
  );

  const columns: Column<TicketRecord>[] = [
    {
      header: "Player ID",
      accessor: "id",
      cellClassName: "font-mono text-gray-700",
    },
    {
      header: "Player Name",
      accessor: (t) => (
        <span className="truncate block max-w-[150px] text-gray-500 text-xs leading-relaxed" title={t.playerName}>
          {t.playerName}
        </span>
      ),
    },
    {
      header: "Bet Code",
      accessor: (t) => (
        <div className="flex items-center gap-2">
          <span className="font-medium text-gray-800">{t.betCode}</span>
        </div>
      ),
    },
    {
      header: "Bet Amount",
      accessor: (t) => (
        <span className="whitespace-pre-line text-gray-500 text-xs leading-relaxed">
          {t.betAmount}
        </span>
      ),
    },
    {
      header: "Game type",
      accessor: (t) => (
        <span className="whitespace-pre-line text-gray-500 text-xs leading-relaxed">
          {t.gameType}
        </span>
      ),
    },
    {
      header: "Odds",
      accessor: (t) => (
        <span className="whitespace-pre-line text-gray-500 text-xs leading-relaxed">
          {t.odds}
        </span>
      ),
    },
    {
      header: "Potential Wins",
      accessor: (t) => (
        <span className="whitespace-pre-line text-gray-500 text-xs leading-relaxed">
          {t.possibleWin}
        </span>
      ),
    },
    {
      header: "Status",
      accessor: (t) => (
        <span
          className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${OUTCOME_STYLES[t.outcome]}`}
        >
          {t.outcome}
        </span>
      ),
    },
  ];

  // Helper function to mock a User object from a ticket record
  const getMockUserFromTicket = (ticket: TicketRecord): User => {
    return {
      id: `USR-${ticket.id}`,
      name: ticket.playerName,
      email: `${ticket.playerName.split(" ")[0].toLowerCase()}@example.com`,
      wallet: 0,
      status: "verified",
      registeredDate: Date.now(),
    };
  };

  return (
    <div className="flex h-[calc(100vh-120px)] flex-col gap-6 overflow-hidden px-8">
      {/* Sticky Header */}
      <div className="flex-none flex items-center justify-between">
        <div>
          <h2 className="font-bold text-2xl text-gray-900">Tickets</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            <span 
              className="relative font-medium cursor-pointer text-[#001A26] after:absolute after:bottom-0 after:left-0 after:h-px after:w-0 after:bg-[#001A26] after:transition-all after:duration-500 hover:after:w-full"
              onClick={() => navigate({ to: "/app" })}
            >Dashboard</span> &rsaquo; Ticket history
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button className="inline-flex cursor-pointer items-center gap-2 rounded-full border-2 border-primary px-2 py-2 font-medium text-gray-900 text-sm hover:bg-gray-50">
            <SortIcon className="h-3 w-3" />
            Sort
          </button>
          <button className="inline-flex cursor-pointer items-center gap-2 rounded-full border-2 border-primary px-2 py-2 font-medium text-gray-900 text-sm hover:bg-gray-50">
            <FilterIcon className="h-3 w-3" />
            Filter
          </button>
        </div>
      </div>

      {/* Tabs + Search */}
      <div className="flex-none flex items-center justify-between gap-4">
        <div className="flex gap-8 border-b border-gray-200">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => { setActiveTab(tab.key); setPage(1); }}
              className={`pb-3 font-medium text-sm transition-colors cursor-pointer ${
                activeTab === tab.key
                  ? "border-b-2 border-[#1BAA04] text-[#1BAA04]"
                  : "text-gray-500 hover:text-gray-800"
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
              className="w-52 rounded-full border border-gray-200 bg-gray-50 py-2 pr-4 pl-9 text-sm focus:border-[#1BAA04] focus:outline-none focus:ring-1 focus:ring-[#1BAA04]"
            />
            <Search className="absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
          </div>
          <button className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-600 hover:bg-gray-50 cursor-pointer">
            <Clock className="h-3.5 w-3.5" />
            Time periods
          </button>
        </div>
      </div>

      {/* Reusable DataTable */}
      <div className="flex-1 min-h-0">
        <DataTable
          data={paginatedTickets}
          columns={columns}
          maxHeight="100%"
          onActionClick={(ticket, e) => {
            e.stopPropagation();
            e.nativeEvent.stopImmediatePropagation();
            const rect = e.currentTarget.getBoundingClientRect();
            setActionDropdown({
              ticket,
              top: rect.bottom + window.scrollY,
              right: window.innerWidth - rect.right,
            });
          }}
          emptyMessage="No tickets found"
          pagination={{
            currentPage: page,
            totalPages,
            onPageChange: setPage,
            totalItems: filteredTickets.length,
            itemsPerPage: ITEMS_PER_PAGE,
          }}
        />
      </div>

      {/* Action Dropdown */}
      {actionDropdown && (
        <ActionDropdown
          top={actionDropdown.top}
          right={actionDropdown.right}
          onClose={() => setActionDropdown(null)}
          items={[
            {
              icon: <Eye className="w-4 h-4" />,
              label: "View ticket",
              onClick: () => {
                setSelectedProfileUser(getMockUserFromTicket(actionDropdown.ticket));
                setActionDropdown(null);
              },
            },
            {
              icon: <NotificationIcon height={"14"} width={"14"} />,
              label: "Send a notification",
              onClick: () => {
                setNoticeModalUser(getMockUserFromTicket(actionDropdown.ticket));
                setActionDropdown(null);
              },
            },
            {
              icon: <PauseCircle className="w-4 h-4" />,
              label: "Suspend",
              onClick: () => {
                // Mock suspend logic
                toast.success(`User suspended successfully`);
                setActionDropdown(null);
              },
            },
          ]}
        />
      )}

      {/* Profile Modal */}
      {selectedProfileUser && (
        <UserProfileModal
          user={selectedProfileUser}
          onClose={() => setSelectedProfileUser(null)}
          onSendNotice={(user) => {
            setNoticeModalUser(user);
            setSelectedProfileUser(null);
          }}
          onSuspend={() => {
            toast.success(`User suspended successfully`);
          }}
        />
      )}

      {/* Send Notice Modal */}
      {noticeModalUser && (
        <SendNoticeModal
          user={noticeModalUser}
          availableUsers={[noticeModalUser]} // We provide at least the mock user to the available list
          onClose={() => setNoticeModalUser(null)}
          onSubmit={(data) => {
            console.log("Sending notice:", data);
            toast.success(`Notice sent to ${noticeModalUser.name}`);
          }}
        />
      )}
    </div>
  );
}
