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
      className={`relative overflow-hidden rounded-[18px] border border-[#E7E7E7] bg-white shadow-[0_8px_30px_rgba(16,24,40,0.06)] ${isFullHeight ? "flex h-full flex-col" : ""}`}
    >
      <div
        className={`overflow-x-auto overflow-y-auto custom-scrollbar ${isFullHeight ? "flex-1 min-h-0" : ""}`}
        style={!isFullHeight && maxHeight ? { maxHeight } : {}}
      >
        <table className="relative w-full min-w-[980px] border-collapse text-left text-sm">
          <thead className="sticky top-0 z-10 shadow-[0_1px_0_#f3f4f6]">
            <tr className="border-gray-100 border-b bg-[#FAFAFA] text-[#667085]">
              {columns.map((col, idx) => (
                <th
                  key={idx}
                  className={`whitespace-nowrap py-5 font-semibold ${idx === 0 ? "pl-6" : "px-4"} ${col.headerClassName || ""}`}
                >
                  {col.header}
                </th>
              ))}
              {(onActionClick || actionMenuItems?.length) && (
                <th className="py-5 pr-6 font-medium text-right"></th>
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
                  className="border-gray-100 border-b last:border-0 even:bg-[#F8F8F8] hover:bg-gray-50/70 transition-colors"
                >
                  {columns.map((col, colIdx) => (
                    <td
                      key={colIdx}
                      className={`whitespace-nowrap py-6 ${colIdx === 0 ? "pl-6 text-gray-900" : "px-4"} ${col.cellClassName || ""}`}
                    >
                      {typeof col.accessor === "function"
                        ? col.accessor(item)
                        : (item[col.accessor] as ReactNode)}
                    </td>
                  ))}
                  {(onActionClick || actionMenuItems?.length) && (
                    <td className="relative py-4 pr-6 text-right">
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
        <div className="flex items-center justify-between border-gray-100 border-t bg-white px-6 py-4 text-sm">
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
              className="cursor-pointer rounded-lg bg-[#1BAA04] px-4 py-2 font-medium text-white transition-colors hover:bg-[#0ea800] disabled:cursor-not-allowed disabled:opacity-50"
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
              className="cursor-pointer rounded-lg bg-[#1BAA04] px-4 py-2 font-medium text-white transition-colors hover:bg-[#0ea800] disabled:cursor-not-allowed disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
