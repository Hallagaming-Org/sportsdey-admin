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
  onActionClick?: (item: T) => void;
  isLoading?: boolean;
  emptyMessage?: string;
}

export function DataTable<T>({ 
  data, 
  columns, 
  maxHeight,
  onActionClick,
  isLoading = false,
  emptyMessage = "No user found"
}: DataTableProps<T>) {
  return (
    <div className="relative overflow-hidden">
      <div className={`overflow-auto custom-scrollbar`} style={maxHeight ? { maxHeight } : {}}>
        <table className="w-full min-w-[800px] text-left text-sm relative border-collapse">
          <thead className="sticky top-0 bg-[#F9F9F9] z-10 shadow-[0_1px_0_#f3f4f6]">
            <tr className="border-b border-gray-100 text-gray-500">
              {columns.map((col, idx) => (
                <th 
                  key={idx} 
                  className={`py-4 font-medium ${idx === 0 ? "pl-4" : "px-4"} ${col.headerClassName || ""}`}
                >
                  {col.header}
                </th>
              ))}
              {onActionClick && <th className="py-4 pr-4 font-medium text-right"></th>}
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
                      className={`py-4 ${colIdx === 0 ? "pl-4 text-gray-900" : "px-4"} ${col.cellClassName || ""}`}
                    >
                      {typeof col.accessor === "function" 
                        ? col.accessor(item) 
                        : (item[col.accessor] as ReactNode)}
                    </td>
                  ))}
                  {onActionClick && (
                    <td className="py-4 pr-4 text-right">
                      <button 
                        onClick={() => onActionClick(item)}
                        className="text-gray-400 hover:text-gray-600 cursor-pointer"
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
    </div>
  );
}
