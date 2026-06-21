import { ChevronDown } from "lucide-react";
import { DataTable, type Column } from "./DataTable";
import { useState } from "react";

interface User {
  id: string;
  name: string;
  email: string;
  date: string;
  balance: string;
  status: "Verified" | "Pending" | "Not verified";
}

export function UserAnalyticsTable() {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const allUsers: User[] = [
    { id: "012345", name: "George jones", email: "georgejones@gmail.com", date: "Aug 8, 2025", balance: "₦3,000,000", status: "Verified" },
    { id: "012346", name: "Robert Fox", email: "robertfox@gmail.com", date: "Aug 8, 2025", balance: "₦3,000,000", status: "Pending" },
    { id: "012347", name: "Savannah Nguyen", email: "savannahnguyen@gmail.com", date: "Aug 8, 2025", balance: "₦3,000,000", status: "Not verified" },
    { id: "012348", name: "Leslie Alexander", email: "lesliealexander@gmail.com", date: "Aug 8, 2025", balance: "₦3,000,000", status: "Verified" },
    { id: "012349", name: "Jenny Wilson", email: "jennywilson@gmail.com", date: "Aug 9, 2025", balance: "₦1,500,000", status: "Verified" },
    { id: "012350", name: "Courtney Henry", email: "courtneyhenry@gmail.com", date: "Aug 9, 2025", balance: "₦2,200,000", status: "Pending" },
    { id: "012351", name: "Eleanor Pena", email: "eleanorpena@gmail.com", date: "Aug 10, 2025", balance: "₦500,000", status: "Verified" },
    { id: "012352", name: "Arlene McCoy", email: "arlenemccoy@gmail.com", date: "Aug 10, 2025", balance: "₦800,000", status: "Not verified" },
    { id: "012353", name: "Cody Fisher", email: "codyfisher@gmail.com", date: "Aug 11, 2025", balance: "₦4,100,000", status: "Verified" },
    { id: "012354", name: "Bessie Cooper", email: "bessiecooper@gmail.com", date: "Aug 11, 2025", balance: "₦900,000", status: "Pending" },
    { id: "012355", name: "Wade Warren", email: "wadewarren@gmail.com", date: "Aug 12, 2025", balance: "₦1,200,000", status: "Verified" },
    { id: "012356", name: "Jane Cooper", email: "janecooper@gmail.com", date: "Aug 12, 2025", balance: "₦2,800,000", status: "Verified" },
    { id: "012357", name: "Guy Hawkins", email: "guyhawkins@gmail.com", date: "Aug 13, 2025", balance: "₦3,400,000", status: "Pending" },
    { id: "012358", name: "Brooklyn Simmons", email: "brooklynsimmons@gmail.com", date: "Aug 13, 2025", balance: "₦1,900,000", status: "Verified" },
    { id: "012359", name: "Jerome Bell", email: "jeromebell@gmail.com", date: "Aug 14, 2025", balance: "₦5,000,000", status: "Verified" },
  ];

  const totalPages = Math.ceil(allUsers.length / itemsPerPage);
  
  // Slice data for the current page
  const displayedUsers = allUsers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const columns: Column<User>[] = [
    { 
      header: "User ID", 
      accessor: "id" 
    },
    { 
      header: "Player Name", 
      accessor: (user) => (
        <div className="flex items-center gap-3 min-w-0">
          <span className="font-medium text-gray-900 truncate" title={user.name}>{user.name}</span>
        </div>
      )
    },
    { 
      header: "Email address", 
      accessor: "email",
      cellClassName: "text-gray-500"
    },
    { 
      header: "Registration Date", 
      accessor: "date",
      cellClassName: "text-gray-500"
    },
    { 
      header: "Wallet Balance", 
      accessor: "balance",
      cellClassName: "font-medium text-gray-900"
    },
    { 
      header: "Status", 
      accessor: (user) => (
        <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${
          user.status === 'Verified' ? 'bg-[#E8F8E5] text-[#10C300]' :
          user.status === 'Pending' ? 'bg-[#FFF8E5] text-[#FFB000]' :
          'bg-[#FEECEB] text-[#EE201C]'
        }`}>
          {user.status}
        </span>
      )
    }
  ];

  const filters = (
    <>
      <button className="flex cursor-pointer items-center gap-2 rounded-full bg-[#F6F6F6] px-4 py-2 text-sm font-medium text-gray-600 ">
        All Users
        <ChevronDown className="h-4 w-4 text-gray-400" />
      </button>
      <button className="flex cursor-pointer items-center gap-2 rounded-full bg-[#F6F6F6] px-4 py-2 text-sm font-medium text-gray-600">
        Status
        <ChevronDown className="h-4 w-4 text-gray-400" />
      </button>
      <button className="flex cursor-pointer items-center gap-2 rounded-full bg-[#F6F6F6] px-4 py-2 text-sm font-medium text-gray-600">
        Today
        <ChevronDown className="h-4 w-4 text-gray-400" />
      </button>
    </>
  );

  return (
    <div className="flex flex-col rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">User Analytics</h2>
          <p className="mt-1 text-sm text-gray-500">Manage all your users and activities.</p>
        </div>
        <div className="flex items-center gap-3">
          {filters}
        </div>
      </div>

      <DataTable
        data={displayedUsers}
        columns={columns}
        maxHeight="400px"
        // onActionClick={(user) => console.log("Action clicked for", user.name)}
      />

      {allUsers.length > itemsPerPage && (
        <div className="mt-6 flex items-center justify-between text-sm text-gray-500">
          <span>Page {currentPage} of {totalPages}</span>
          <div className="flex gap-3">
            <button 
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="rounded-lg bg-[#1BAA04] px-4 py-2 font-medium text-white hover:bg-[#0ea800] cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button 
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="rounded-lg bg-[#1BAA04] px-4 py-2 font-medium text-white hover:bg-[#0ea800] cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
