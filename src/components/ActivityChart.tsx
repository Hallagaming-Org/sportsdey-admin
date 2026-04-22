import { Filter } from "lucide-react";

export function ActivityChart() {
  const days = ["Sat", "Sun", "Mon", "Tue", "Wed", "Thu", "Today"];
  
  // Dummy heights for the bars (percentages) matching the design
  const data = [
    { revenue: 0, bet: 0, users: 0 },
    { revenue: 0, bet: 0, users: 0 },
    { revenue: 0, bet: 0, users: 0 },
    { revenue: 0, bet: 0, users: 0 },
    { revenue: 0, bet: 0, users: 0 },
    { revenue: 95, bet: 0, users: 0 }, // Thu has large green bar
    { revenue: 98, bet: 40, users: 0 } // Today has large green bar and a black bar
  ];

  return (
    <div className="flex h-full flex-col rounded-xl border-2 border-[#0A88FF] bg-white p-6 shadow-sm">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-lg font-bold text-gray-900">Activity Trends/Reports</h2>
        <button className="flex items-center gap-2 rounded-full border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50">
          <Filter className="h-3 w-3" />
          Filter by Region
        </button>
      </div>

      <div className="relative flex-1 min-h-[200px]">
        {/* Y-axis labels */}
        <div className="absolute bottom-6 left-0 top-0 flex flex-col justify-between text-xs font-medium text-gray-400">
          <span>350K</span>
          <span>250K</span>
          <span>150K</span>
          <span>0</span>
        </div>

        {/* Chart area */}
        <div className="ml-10 flex h-full flex-col">
          {/* Horizontal lines and bars */}
          <div className="relative flex-1">
            <div className="absolute left-0 top-0 w-full border-t border-gray-100"></div>
            <div className="absolute left-0 top-[33.33%] w-full border-t border-gray-100"></div>
            <div className="absolute left-0 top-[66.66%] w-full border-t border-gray-100"></div>
            <div className="absolute bottom-0 left-0 w-full border-t border-gray-100"></div>

            {/* Bars container */}
            <div className="absolute bottom-0 left-0 right-0 top-0 flex items-end justify-between px-2">
              {data.map((day, idx) => (
                <div key={idx} className="flex h-full w-12 items-end justify-center gap-1.5">
                  {day.revenue > 0 && (
                    <div 
                      className="w-3 rounded-t-sm bg-[#10C300]" 
                      style={{ height: `${day.revenue}%` }}
                    ></div>
                  )}
                  {day.bet > 0 && (
                    <div 
                      className="w-3 rounded-t-sm bg-black" 
                      style={{ height: `${day.bet}%` }}
                    ></div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* X-axis labels */}
          <div className="mt-2 flex justify-between px-2 text-xs font-medium text-gray-500">
            {days.map((day, idx) => (
              <span key={idx} className={`w-12 text-center ${day === "Today" ? "font-bold text-gray-900" : ""}`}>
                {day}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="mt-6 flex flex-wrap items-center justify-center gap-6 text-xs font-medium text-gray-600">
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-black"></div>
          <span>Revenue generated</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-[#FFB000]"></div>
          <span>Bets Placed</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-[#10C300]"></div>
          <span>All Users</span>
        </div>
      </div>
    </div>
  );
}
