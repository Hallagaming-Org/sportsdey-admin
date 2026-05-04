import { type ReactNode, useEffect, useRef, useState } from "react";
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
  actionMenuItems?: {
    label: string;
    icon?: ReactNode;
    onClick: (item: T) => void;
  }[];
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
  actionMenuItems,
  isLoading = false,
  emptyMessage = "No user found",
  pagination,
}: DataTableProps<T>) {
  const isFullHeight = maxHeight === "100%";
  const [openActionRow, setOpenActionRow] = useState<number | null>(null);
  const actionMenuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (openActionRow === null) return;

    const handleOutsideClick = (event: MouseEvent) => {
      if (!actionMenuRef.current) return;
      if (!actionMenuRef.current.contains(event.target as Node)) {
        setOpenActionRow(null);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [openActionRow]);

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
                  className={`py-4 font-medium ${idx === 0 ? "pl-4" : "px-4"} ${col.headerClassName || ""}`}
                >
                  {col.header}
                </th>
              ))}
              {(onActionClick || actionMenuItems?.length) && (
                <th className="py-4 pr-4 font-medium text-right"></th>
              )}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <TableSkeleton
                columnsCount={columns.length}
                showActionColumn={!!onActionClick || !!actionMenuItems?.length}
              />
            ) : data.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length + (onActionClick || actionMenuItems?.length ? 1 : 0)}
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
                      className={`py-4 ${colIdx === 0 ? "pl-4 text-gray-900" : "px-4"} ${col.cellClassName || ""}`}
                    >
                      {typeof col.accessor === "function"
                        ? col.accessor(item)
                        : (item[col.accessor] as ReactNode)}
                    </td>
                  ))}
                  {(onActionClick || actionMenuItems?.length) && (
                    <td className="py-4 pr-4 text-right relative">
                      {actionMenuItems?.length ? (
                        <div ref={openActionRow === rowIdx ? actionMenuRef : null} className="relative inline-block">
                          <button
                            onClick={() =>
                              setOpenActionRow((current) => (current === rowIdx ? null : rowIdx))
                            }
                            className="text-gray-400 hover:text-gray-600 cursor-pointer p-1 rounded-md"
                          >
                            <MoreHorizontal className="h-5 w-5" />
                          </button>
                          {openActionRow === rowIdx && (
                            <div className="absolute right-0 top-9 z-30 min-w-[220px] overflow-hidden rounded-xl border border-gray-200 bg-[#F4F4F4] p-1 shadow-lg">
                              {actionMenuItems.map((menuItem) => (
                                <button
                                  key={menuItem.label}
                                  type="button"
                                  onClick={() => {
                                    menuItem.onClick(item);
                                    setOpenActionRow(null);
                                  }}
                                  className="flex w-full cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-left text-[15px] text-gray-800 transition-colors hover:bg-white"
                                >
                                  {menuItem.icon && <span className="text-gray-700">{menuItem.icon}</span>}
                                  <span>{menuItem.label}</span>
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      ) : (
                        <button
                          onClick={(e) => onActionClick?.(item, e)}
                          className="text-gray-400 hover:text-gray-600 cursor-pointer p-1 rounded-md"
                        >
                          <MoreHorizontal className="h-5 w-5" />
                        </button>
                      )}
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
