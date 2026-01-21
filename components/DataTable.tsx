"use client";

import { useState, useMemo } from "react";
import { ArrowUpDown, Search, ChevronLeft, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface DataTableProps {
  data: any[];
  onDataUpdate?: (newData: any[]) => void;
  showAll?: boolean;
}

export default function DataTable({ data, onDataUpdate, showAll = false }: DataTableProps) {
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: "ascending" | "descending";
  } | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [editingCell, setEditingCell] = useState<{rowIndex: number, colKey: string} | null>(null);
  
  // We'll reimplement the update logic.
  const handleCellUpdate = (rowIndex: number, colKey: string, newValue: string) => {
    if (!onDataUpdate) return;
    const newData = [...data];
    // We need to find the correct index in the original data. 
    // Since we have pagination and sorting, the rowIndex passed here corresponds to 'paginatedData'.
    // We actually need to know the index in 'data'.
    
    // Simplification: We can map the displayed row back to the original object if the objects are reference equal.
    const rowToUpdate = paginatedData[rowIndex];
    const originalIndex = data.indexOf(rowToUpdate);
    
    if (originalIndex !== -1) {
       newData[originalIndex] = { ...newData[originalIndex], [colKey]: newValue };
       onDataUpdate(newData);
    }
  };

  const columns = useMemo(() => {
    if (data.length === 0) return [];
    return Object.keys(data[0]);
  }, [data]);

  const filteredData = useMemo(() => {
    let processData = [...data];

    if (searchTerm) {
      const lowerTerm = searchTerm.toLowerCase();
      processData = processData.filter((row) =>
        Object.values(row).some((val) =>
          String(val).toLowerCase().includes(lowerTerm)
        )
      );
    }

    if (sortConfig) {
      processData.sort((a, b) => {
        const valA = a[sortConfig.key];
        const valB = b[sortConfig.key];

        if (valA < valB) return sortConfig.direction === "ascending" ? -1 : 1;
        if (valA > valB) return sortConfig.direction === "ascending" ? 1 : -1;
        return 0;
      });
    }

    return processData;
  }, [data, searchTerm, sortConfig]);

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const paginatedData = showAll ? filteredData : filteredData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const requestSort = (key: string) => {
    let direction: "ascending" | "descending" = "ascending";
    if (
      sortConfig &&
      sortConfig.key === key &&
      sortConfig.direction === "ascending"
    ) {
      direction = "descending";
    }
    setSortConfig({ key, direction });
  };

  if (data.length === 0) return null;

  return (
    <div className="space-y-4 ">
      {!showAll && (
        <div className="flex items-center justify-between gap-4">
            <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-black" />
            <input
                type="text"
                placeholder="Search details..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 rounded-lg border-2 border-black bg-white focus:outline-none focus:shadow-neo transition-all text-sm font-medium placeholder:text-black/40"
            />
            </div>
        </div>
      )}

      <div className="rounded-xl border-2 border-black overflow-hidden bg-white shadow-neo">
        <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-black scrollbar-track-transparent">
          <table className="w-full text-sm font-medium min-w-[600px] md:min-w-full">
            <thead className="bg-primary text-white border-b-2 border-black">
              <tr>
                {columns.map((col) => (
                  <th
                    key={col}
                    className="h-12 px-4 text-left font-bold cursor-pointer hover:bg-black/10 transition-colors select-none whitespace-nowrap"
                    onClick={() => requestSort(col)}
                  >
                    <div className="flex items-center gap-2 text-black">
                      {col}
                      {sortConfig?.key === col && (
                        sortConfig.direction === "ascending" ? <ArrowUpDown className="w-4 h-4" /> : <ArrowUpDown className="w-4 h-4 rotate-180" />
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y-2 divide-black/10">
              {paginatedData.map((row, i) => (
                <tr key={i} className="hover:bg-primary/5 transition-colors group">
                  {columns.map((col) => (
                    <td key={col} className="p-0 relative border-r-2 border-black/10 last:border-r-0">
                        <input 
                            className="w-full h-full px-4 py-3 bg-transparent border-none focus:ring-inset focus:ring-2 focus:ring-primary outline-none transition-all truncate font-medium group-hover:bg-white/50"
                            value={row[col] ?? ""}
                            readOnly={showAll}
                            onChange={(e) => handleCellUpdate(i, col, e.target.value)}
                        />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {!showAll && totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 py-4">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="p-2.5 rounded-lg border-2 border-black hover:bg-white hover:shadow-neo disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none transition-all active:translate-y-1 active:shadow-none bg-white"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="text-sm font-bold mx-2 px-4 py-2 bg-white border-2 border-black rounded-lg shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="p-2.5 rounded-lg border-2 border-black hover:bg-white hover:shadow-neo disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none transition-all active:translate-y-1 active:shadow-none bg-white"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      )}
    </div>
  );
}
