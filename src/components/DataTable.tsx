import { type ReactNode } from "react";
import { MoreHorizontal } from "lucide-react";
import { TableSkeleton } from "./TableSkeleton";

export interface Column<T> {
  header: string;
  accessor: keyof T | ((item: T) => ReactNode);
  className?: string;
  headerClassName?: string;
  cellClassName?: string;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  maxHeight?: string;
  onActionClick?: (item: T, e: React.MouseEvent<HTMLButtonElement>) => void;
  isLoading?: boolean;
  emptyMessage?: string;
  pagination?: {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
    totalItems: number;
    itemsPerPage: number;
  };
}

export function DataTable<T>({
  data,
  columns,
  maxHeight,
  onActionClick,
  isLoading = false,
  emptyMessage = "No user found",
  pagination,
}: DataTableProps<T>) {
  const isFullHeight = maxHeight === "100%";

  return (
    <div
      className={`relative overflow-hidden bg-white ${isFullHeight ? "flex flex-col h-full" : ""}`}
      style={{
        borderRight: "2px solid #e2e8f0",
        borderBottom: "2px solid #e2e8f0",
        boxShadow: "4px 4px 16px -4px rgba(0,0,0,0.10)",
      }}
    >
      <div
        className={`overflow-x-auto overflow-y-auto custom-scrollbar ${isFullHeight ? "flex-1 min-h-0" : ""}`}
        style={!isFullHeight && maxHeight ? { maxHeight } : {}}
      >
        <table className="w-full min-w-[800px] text-left text-sm relative border-collapse">
          <thead className="sticky top-0 z-10 shadow-[0_1px_0_#f3f4f6]">
            <tr className="border-b border-gray-100 text-gray-500 bg-[#F9F9F9]">
              {columns.map((col, idx) => (
                <th
                  key={idx}
                  className={`py-4 font-medium whitespace-nowrap ${idx === 0 ? "pl-4" : "px-4"} ${col.headerClassName || ""}`}
                >
                  {col.header}
                </th>
              ))}
              {onActionClick && (
                <th className="py-4 pr-4 font-medium text-right"></th>
              )}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <TableSkeleton
                columnsCount={columns.length}
                showActionColumn={!!onActionClick}
              />
            ) : data.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length + (onActionClick ? 1 : 0)}
                  className="py-12 text-center text-gray-500 font-medium"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              data.map((item, rowIdx) => (
                <tr
                  key={rowIdx}
                  className="border-b border-gray-50 last:border-0 even:bg-[#F9F9F9] hover:bg-gray-50/50 transition-colors"
                >
                  {columns.map((col, colIdx) => (
                    <td
                      key={colIdx}
                      className={`py-4 whitespace-nowrap ${colIdx === 0 ? "pl-4 text-gray-900" : "px-4"} ${col.cellClassName || ""}`}
                    >
                      {typeof col.accessor === "function"
                        ? col.accessor(item)
                        : (item[col.accessor] as ReactNode)}
                    </td>
                  ))}
                  {onActionClick && (
                    <td className="py-4 pr-4 text-right relative">
                      <button
                        onClick={(e) => onActionClick(item, e)}
                        className="text-gray-400 hover:text-gray-600 cursor-pointer p-1 rounded-md"
                      >
                        <MoreHorizontal className="h-5 w-5" />
                      </button>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination — part of the same elevated container */}
      {pagination && pagination.totalItems > pagination.itemsPerPage && (
        <div className="bg-[#F9F9F9] px-6 py-4 border-t border-gray-100 flex items-center justify-between text-sm">
          <span className="font-medium text-gray-900">
            Page {pagination.currentPage} of {pagination.totalPages}
          </span>
          <div className="flex gap-3">
            <button
              onClick={() =>
                pagination.onPageChange(
                  Math.max(1, pagination.currentPage - 1)
                )
              }
              disabled={pagination.currentPage === 1}
              className="rounded-lg bg-[#1BAA04] px-4 py-2 font-medium text-white hover:bg-[#0ea800] cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
              onClick={() =>
                pagination.onPageChange(
                  Math.min(pagination.totalPages, pagination.currentPage + 1)
                )
              }
              disabled={pagination.currentPage === pagination.totalPages}
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
