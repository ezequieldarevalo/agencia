import { Search } from "lucide-react";

interface DataTableProps<T> {
  columns: {
    key: string;
    label: string;
    render?: (item: T) => React.ReactNode;
  }[];
  data: T[];
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;
  actions?: React.ReactNode;
  emptyMessage?: string;
}

export function DataTable<T extends { id: string }>({
  columns,
  data,
  searchValue,
  onSearchChange,
  searchPlaceholder = "Buscar...",
  actions,
  emptyMessage = "No hay datos para mostrar",
}: DataTableProps<T>) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
      {(onSearchChange || actions) && (
        <div className="px-3 sm:px-4 py-3 border-b border-gray-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4">
          {onSearchChange && (
            <div className="relative flex-1 sm:max-w-sm">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                type="text"
                value={searchValue || ""}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder={searchPlaceholder}
                className="w-full pl-9 pr-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}
          {actions && <div className="flex items-center gap-2 self-end sm:self-auto">{actions}</div>}
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[600px]">
          <thead>
            <tr className="border-b border-gray-800">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider whitespace-nowrap"
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {data.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-4 py-8 text-center text-sm text-gray-500"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              data.map((item) => (
                <tr key={item.id} className="hover:bg-gray-800/50 transition-colors">
                  {columns.map((col) => (
                    <td key={col.key} className="px-3 sm:px-4 py-3 text-sm text-gray-300 whitespace-nowrap">
                      {col.render
                        ? col.render(item)
                        : (item as Record<string, unknown>)[col.key] as string}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
