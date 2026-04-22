import { ChevronDown, MoreHorizontal } from "lucide-react";

export function UserAnalyticsTable() {
  const users = [
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
  ];

  return (
    <div className="flex flex-col rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">User Analytics</h2>
          <p className="mt-1 text-sm text-gray-500">Manage all your users and activities.</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 rounded-full bg-[#F6F6F6] px-4 py-2 text-sm font-medium text-gray-600 ">
            All Users
            <ChevronDown className="h-4 w-4 text-gray-400" />
          </button>
          <button className="flex items-center gap-2 rounded-full bg-[#F6F6F6] px-4 py-2 text-sm font-medium text-gray-600">
            Status
            <ChevronDown className="h-4 w-4 text-gray-400" />
          </button>
          <button className="flex items-center gap-2 rounded-full bg-[#F6F6F6] px-4 py-2 text-sm font-medium text-gray-600">
            Today
            <ChevronDown className="h-4 w-4 text-gray-400" />
          </button>
        </div>
      </div>

      <div className="overflow-auto max-h-[400px]">
        <table className="w-full min-w-[800px] text-left text-sm relative">
          <thead className="sticky top-0 bg-white z-10 shadow-[0_1px_0_#f3f4f6]">
            <tr className="border-b border-gray-100 text-gray-500">
              <th className="pb-4 pl-4 font-medium">User ID</th>
              <th className="pb-4 px-4 font-medium">Player Name</th>
              <th className="pb-4 px-4 font-medium">Email address</th>
              <th className="pb-4 px-4 font-medium">Registration Date</th>
              <th className="pb-4 px-4 font-medium">Wallet Balance</th>
              <th className="pb-4 px-4 font-medium">Status</th>
              <th className="pb-4 pr-4 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {users.map((user, idx) => (
              <tr key={idx} className="border-b border-gray-50 last:border-0 odd:bg-[#F9F9F9]">
                <td className="py-4 pl-4 text-gray-900">{user.id}</td>
                <td className="py-4 px-4">
                  <div className="flex items-center gap-3">
                    <img 
                      src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user.name}`} 
                      alt="avatar" 
                      className="h-8 w-8 rounded-full bg-gray-100 object-cover" 
                    />
                    <span className="font-medium text-gray-900">{user.name}</span>
                  </div>
                </td>
                <td className="py-4 px-4 text-gray-500">{user.email}</td>
                <td className="py-4 px-4 text-gray-500">{user.date}</td>
                <td className="py-4 px-4 font-medium text-gray-900">{user.balance}</td>
                <td className="py-4 px-4">
                  <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${
                    user.status === 'Verified' ? 'bg-[#E8F8E5] text-[#10C300]' :
                    user.status === 'Pending' ? 'bg-[#FFF8E5] text-[#FFB000]' :
                    'bg-[#FEECEB] text-[#EE201C]'
                  }`}>
                    {user.status}
                  </span>
                </td>
                <td className="py-4 pr-4 text-right">
                  <button className="text-gray-400 hover:text-gray-600">
                    <MoreHorizontal className="h-5 w-5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-6 flex items-center justify-between text-sm text-gray-500">
        <span>Page 1 of 10</span>
        <div className="flex gap-3">
          <button className="rounded-lg bg-[#10C300] px-4 py-2 font-medium text-white hover:bg-[#0ea800]">
            Previous
          </button>
          <button className="rounded-lg bg-[#10C300] px-4 py-2 font-medium text-white hover:bg-[#0ea800]">
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
