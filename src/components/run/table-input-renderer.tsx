"use client";

import { useState, useEffect } from "react";
import { AtomicStep } from "@/types/schema";
import { Plus, Minus, CheckCircle2, Grid3x3 } from "lucide-react";

interface TableInputRendererProps {
  step: AtomicStep;
  output: any;
  setOutput: (value: any) => void;
  setValidationError: (error: string | null) => void;
}

export function TableInputRenderer({
  step,
  output,
  setOutput,
  setValidationError,
}: TableInputRendererProps) {
  const [rows, setRows] = useState<number>(step.config.tableConfig?.rows || 3);
  const [columns, setColumns] = useState<number>(step.config.tableConfig?.columns || 3);
  const [headers, setHeaders] = useState<string[]>(
    step.config.tableConfig?.headers || Array(step.config.tableConfig?.columns || 3).fill("")
  );
  const [tableData, setTableData] = useState<string[][]>(
    output?.data || Array(step.config.tableConfig?.rows || 3).fill(null).map(() => Array(step.config.tableConfig?.columns || 3).fill(""))
  );
  const [isConfigMode, setIsConfigMode] = useState(!output?.data);

  // Initialize from output if exists
  useEffect(() => {
    if (output?.data) {
      setTableData(output.data);
      if (output.headers) {
        setHeaders(output.headers);
      }
      if (output.rows) setRows(output.rows);
      if (output.columns) setColumns(output.columns);
      setIsConfigMode(false);
    }
  }, [output]);

  const handleHeaderChange = (index: number, value: string) => {
    const newHeaders = [...headers];
    newHeaders[index] = value;
    setHeaders(newHeaders);
  };

  const handleCellChange = (rowIndex: number, colIndex: number, value: string) => {
    const newData = tableData.map((row, rIdx) => {
      if (rIdx === rowIndex) {
        return row.map((cell, cIdx) => (cIdx === colIndex ? value : cell));
      }
      return row;
    });
    setTableData(newData);
    
    // Save to output
    setOutput({
      data: newData,
      headers,
      rows,
      columns,
      type: "table",
    });
    
    // Validate
    if (step.config.required) {
      const hasEmpty = newData.some((row) => row.some((cell) => !cell.trim()));
      if (hasEmpty) {
        setValidationError("Please fill all required cells");
      } else {
        setValidationError(null);
      }
    }
  };

  const handleAddRow = () => {
    const newData = [...tableData, Array(columns).fill("")];
    setTableData(newData);
    setRows(newData.length);
    setOutput({
      data: newData,
      headers,
      rows: newData.length,
      columns,
      type: "table",
    });
  };

  const handleRemoveRow = (rowIndex: number) => {
    if (tableData.length <= 1) return;
    const newData = tableData.filter((_, idx) => idx !== rowIndex);
    setTableData(newData);
    setRows(newData.length);
    setOutput({
      data: newData,
      headers,
      rows: newData.length,
      columns,
      type: "table",
    });
  };

  const handleAddColumn = () => {
    const newHeaders = [...headers, ""];
    setHeaders(newHeaders);
    const newData = tableData.map((row) => [...row, ""]);
    setTableData(newData);
    setColumns(newHeaders.length);
    setOutput({
      data: newData,
      headers: newHeaders,
      rows,
      columns: newHeaders.length,
      type: "table",
    });
  };

  const handleRemoveColumn = (colIndex: number) => {
    if (columns <= 1) return;
    const newHeaders = headers.filter((_, idx) => idx !== colIndex);
    setHeaders(newHeaders);
    const newData = tableData.map((row) => row.filter((_, idx) => idx !== colIndex));
    setTableData(newData);
    setColumns(newHeaders.length);
    setOutput({
      data: newData,
      headers: newHeaders,
      rows,
      columns: newHeaders.length,
      type: "table",
    });
  };

  const handleApplyConfig = () => {
    // Resize table to match config
    const newHeaders = Array(columns).fill("").map((_, idx) => headers[idx] || "");
    const newData = Array(rows)
      .fill(null)
      .map((_, rIdx) =>
        Array(columns)
          .fill("")
          .map((_, cIdx) => (tableData[rIdx]?.[cIdx] || ""))
      );
    
    setHeaders(newHeaders);
    setTableData(newData);
    setIsConfigMode(false);
    setOutput({
      data: newData,
      headers: newHeaders,
      rows,
      columns,
      type: "table",
    });
  };

  if (isConfigMode) {
    return (
      <div className="space-y-4">
        <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
          <p className="text-xs font-semibold text-blue-900 mb-1">💡 Table Configuration</p>
          <p className="text-xs text-blue-700">
            Define the dimensions of your table
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Number of Rows
            </label>
            <input
              type="number"
              min="1"
              max="50"
              value={rows}
              onChange={(e) => setRows(parseInt(e.target.value) || 1)}
              className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Number of Columns
            </label>
            <input
              type="number"
              min="1"
              max="20"
              value={columns}
              onChange={(e) => setColumns(parseInt(e.target.value) || 1)}
              className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
            />
          </div>
        </div>

        <button
          onClick={handleApplyConfig}
          className="w-full rounded-xl bg-blue-600 px-6 py-3 text-sm font-medium text-white transition-all hover:bg-blue-700"
        >
          <Grid3x3 className="mr-2 inline h-4 w-4" />
          Create Table
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-2">
          <p className="text-xs font-semibold text-blue-900">
            Table: {rows} rows × {columns} columns
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setIsConfigMode(true)}
            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition-all hover:bg-slate-50"
          >
            Resize
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                {headers.map((header, colIndex) => (
                  <th
                    key={colIndex}
                    className="border-r border-slate-200 last:border-r-0 p-2 min-w-[120px]"
                  >
                    <div className="flex items-center justify-between">
                      <input
                        type="text"
                        value={header}
                        onChange={(e) => handleHeaderChange(colIndex, e.target.value)}
                        placeholder={`Header ${colIndex + 1}`}
                        className="flex-1 bg-transparent border-none outline-none text-sm font-semibold text-slate-900 px-1"
                      />
                      {columns > 1 && (
                        <button
                          onClick={() => handleRemoveColumn(colIndex)}
                          className="ml-2 text-rose-500 hover:text-rose-700"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                  </th>
                ))}
                <th className="p-2 bg-slate-50">
                  <button
                    onClick={handleAddColumn}
                    className="w-full flex items-center justify-center text-blue-600 hover:text-blue-700"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </th>
              </tr>
            </thead>
            <tbody>
              {tableData.map((row, rowIndex) => (
                <tr key={rowIndex} className="border-b border-slate-200 last:border-b-0 hover:bg-slate-50">
                  {row.map((cell, colIndex) => (
                    <td
                      key={colIndex}
                      className="border-r border-slate-200 last:border-r-0 p-1"
                    >
                      <input
                        type="text"
                        value={cell}
                        onChange={(e) => handleCellChange(rowIndex, colIndex, e.target.value)}
                        placeholder={`Row ${rowIndex + 1}, Col ${colIndex + 1}`}
                        className="w-full border-none outline-none bg-transparent text-sm text-slate-900 px-2 py-1 focus:bg-blue-50 focus:ring-1 focus:ring-blue-200 rounded"
                      />
                    </td>
                  ))}
                  <td className="p-1">
                    <div className="flex items-center gap-1">
                      {rows > 1 && (
                        <button
                          onClick={() => handleRemoveRow(rowIndex)}
                          className="text-rose-500 hover:text-rose-700"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              <tr>
                <td
                  colSpan={columns + 1}
                  className="p-2 bg-slate-50 text-center"
                >
                  <button
                    onClick={handleAddRow}
                    className="flex items-center justify-center gap-2 text-blue-600 hover:text-blue-700 text-sm font-medium"
                  >
                    <Plus className="h-4 w-4" />
                    Add Row
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {step.config.required && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
          <p className="text-xs text-amber-800">
            <span className="font-semibold">Required:</span> Please fill all cells in the table.
          </p>
        </div>
      )}
    </div>
  );
}

