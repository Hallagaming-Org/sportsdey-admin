import type { ReactNode } from "react";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
}

export function StatCard({ title, value, icon }: StatCardProps) {
  return (
    <div className="flex flex-col justify-between rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
      <span className="mb-4 text-3xl font-bold text-gray-900">{value}</span>
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-500">{title}</span>
        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-gray-50 text-gray-600">
          {icon}
        </div>
      </div>
    </div>
  );
}
