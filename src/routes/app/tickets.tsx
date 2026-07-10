import { createFileRoute, useNavigate, redirect } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  TimePeriodFilter,
  type TimePeriod,
} from "#/components/TimePeriodFilter";
import { Search, Eye, PauseCircle } from "lucide-react";
import { DataTable, type Column } from "#/components/DataTable";
import SortIcon from "@/logo/sort.svg?react";
import FilterIcon from "@/logo/filter.svg?react";
import { ActionDropdown } from "#/components/ActionDropdown";
import { UserProfileModal } from "#/components/UserProfileModal";
import { SendNoticeModal } from "#/components/SendNoticeModal";
import NotificationIcon from "#/assets/NotificationIcon";
import type { User } from "#/lib/users";
import { notificationService } from "#/lib/notifications";
import { ticketService, type TicketRecord, type TicketOutcome, type TicketTab } from "#/lib/tickets";
import { getDateRangeForPeriod } from "#/lib/time-period";
import { toast } from "sonner";



export const Route = createFileRoute("/app/tickets")({
  beforeLoad: ({ context }) => {
    const admin = (context as any).admin;
    if (admin && admin.role !== "super_admin" && !admin.permissions?.includes("view_ticket_history")) {
      throw redirect({ to: "/app", replace: true });
    }
  },
  component: TicketsPage,
});

const OUTCOME_STYLES: Record<TicketOutcome, string> = {
  Won: "bg-[#E8F8E5] text-[#10C300]",
  Active: "bg-[#FFF8E5] text-[#FFB000]",
  Lost: "bg-[#FEECEB] text-[#EE201C]",
};

const TABS: { key: TicketTab; label: string }[] = [
  { key: "all", label: "All Tickets" },
  { key: "casino", label: "Casino" },
  { key: "sportsbook", label: "Sportsbook" },
];

const ITEMS_PER_PAGE = 10;

function TicketsPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TicketTab>("all");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [selectedTimePeriod, setSelectedTimePeriod] =
    useState<TimePeriod>("All");

  const [actionDropdown, setActionDropdown] = useState<{ ticket: TicketRecord; top: number; right: number } | null>(null);
  const [selectedProfileUser, setSelectedProfileUser] = useState<User | null>(null);
  const [noticeModalUser, setNoticeModalUser] = useState<User | null>(null);

  useEffect(() => {
    const handleClickOutside = () => setActionDropdown(null);
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 400);
    return () => clearTimeout(timer);
  }, [search]);

  const dateRange = getDateRangeForPeriod(selectedTimePeriod, customRange);

  const { data, isLoading } = useQuery({
    queryKey: ["tickets", activeTab, page, debouncedSearch, dateRange.fromDate, dateRange.toDate],
    queryFn: async () => {
      const result = await ticketService.getTickets({
        page,
        limit: ITEMS_PER_PAGE,
        type: activeTab === "all" ? undefined : activeTab,
        search: debouncedSearch || undefined,
        fromDate: dateRange.fromDate,
        toDate: dateRange.toDate,
      });
      if (!result.success) throw new Error(result.error);
      return result.data;
    },
  });

  const columns: Column<TicketRecord>[] = [
    {
      header: "Player ID",
      accessor: "id",
      cellClassName: "font-mono text-gray-700",
    },
    {
      header: "Player Name",
      accessor: (t) => (
        <span className="text-gray-500 text-xs leading-relaxed" title={t.playerName}>
          {t.playerName}
        </span>
      ),
    },
    {
      header: "Bet Amount",
      accessor: (t) => (
        <span className="text-gray-500 text-xs leading-relaxed">
          {t.betAmount}
        </span>
      ),
    },
    {
      header: "Game type",
      accessor: (t) => (
        <span className="text-gray-500 text-xs leading-relaxed">
          {t.gameType}
        </span>
      ),
    },
    {
      header: "Date",
      accessor: (t) => (
        <span className="text-gray-500 text-xs leading-relaxed">
          {t.createdAt}
        </span>
      ),
    },
    {
      header: "Balance Before",
      accessor: (t) => (
        <span className="text-gray-500 text-xs leading-relaxed">
          {t.balanceBefore ?? "N/A"}
        </span>
      ),
    },
    {
      header: "Balance After",
      accessor: (t) => (
        <span className="text-gray-500 text-xs leading-relaxed">
          {t.balanceAfter ?? "N/A"}
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

  const tickets = data?.tickets ?? [];
  const totalPages = data?.pagination.totalPages ?? 1;
  const totalItems = data?.pagination.total ?? 0;

  return (
    <div className="flex h-[calc(100vh-120px)] flex-col gap-6 overflow-hidden px-8">
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
              className="w-[352px] rounded-full border border-gray-200 bg-gray-50 py-2 pr-4 pl-9 text-sm focus:border-[#1BAA04] focus:outline-none focus:ring-1 focus:ring-[#1BAA04]"
            />
            <Search className="absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
          </div>
          <TimePeriodFilter
            onFilterChange={(period) => setSelectedTimePeriod(period)}
            buttonClassName="inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-2 text-xs font-medium text-gray-600 hover:bg-gray-50 cursor-pointer whitespace-nowrap"
          />
        </div>
      </div>

      <div className="flex-1 min-h-0">
        <DataTable
          data={tickets}
          columns={columns}
          maxHeight="100%"
          isLoading={isLoading}
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
            totalItems,
            itemsPerPage: ITEMS_PER_PAGE,
          }}
        />
      </div>

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
                toast.success(`User suspended successfully`);
                setActionDropdown(null);
              },
            },
          ]}
        />
      )}

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

      {noticeModalUser && (
        <SendNoticeModal
          user={noticeModalUser}
          availableUsers={[noticeModalUser]}
          onClose={() => setNoticeModalUser(null)}
          onSubmit={async (data) => {
            const result = await notificationService.sendNotification({
              title: data.title,
              message: data.message,
              userId: noticeModalUser.id,
            });
            if (result.success) {
              toast.success(`Notice sent to ${noticeModalUser.name}`);
            } else {
              toast.error(result.error || "Failed to send notice");
            }
          }}
        />
      )}
    </div>
  );
}
