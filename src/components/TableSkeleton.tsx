interface TableSkeletonProps {
  columnsCount: number;
  rowCount?: number;
  showActionColumn?: boolean;
}

export function TableSkeleton({ 
  columnsCount, 
  rowCount = 5, 
  showActionColumn = false 
}: TableSkeletonProps) {
  return (
    <>
      {Array.from({ length: rowCount }).map((_, rowIdx) => (
        <tr key={rowIdx} className="border-b border-gray-50 animate-pulse">
          {Array.from({ length: columnsCount }).map((_, colIdx) => (
            <td key={colIdx} className={`py-6 ${colIdx === 0 ? "pl-4" : "px-4"}`}>
              <div className="h-4 bg-gray-100 rounded-md w-full" />
            </td>
          ))}
          {showActionColumn && (
            <td className="py-6 pr-4">
              <div className="h-4 bg-gray-100 rounded-md w-4 ml-auto" />
            </td>
          )}
        </tr>
      ))}
    </>
  );
}
